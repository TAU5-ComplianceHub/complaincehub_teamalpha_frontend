import React, { useEffect, useState } from "react";
import "./SaveAsPopup.css"; // Reuses the Save As popup styling
import { toast } from "react-toastify";

// Based on SaveAsPopup. Instead of creating a new draft copy, this lets the
// owner of a draft change its existing title in place.
// `siblingDraftsRoute` is the same full URL used to load the drafts list on
// the calling page (e.g. pageConfig.loadRoute), so this works for any draft
// type (procedure, standard, special, ibra, jra, blra, ...) without needing
// to know its routing scheme.
// `titleField` is the key inside formData that holds the title — most draft
// types use "title", but visitor inductions and online training courses use
// "courseTitle" instead.
const RenameDraftPopup = ({ onClose, onRename, current, draftId, siblingDraftsRoute, titleField = "title" }) => {
    const [title, setTitle] = useState(current);
    const [drafts, setDrafts] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch sibling drafts so we can avoid saving a duplicate title,
    // same approach as SaveAsPopup.
    useEffect(() => {
        if (!siblingDraftsRoute) return;
        let isMounted = true;
        async function loadDrafts() {
            try {
                const res = await fetch(siblingDraftsRoute, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        Accept: "application/json",
                    },
                });
                if (!res.ok) throw new Error(res.statusText);
                const data = await res.json();
                if (isMounted) setDrafts(data);
            } catch (err) {
                console.error("Fetch drafts failed:", err);
            }
        }
        loadDrafts();
        return () => { isMounted = false; };
    }, [siblingDraftsRoute]);

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
    };

    const handleSave = async () => {
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            toast.error("Please enter a title for this draft");
            return;
        }

        if (trimmedTitle === (current || "").trim()) {
            onClose();
            return;
        }

        // Same auto-increment behaviour as SaveAsPopup: if the title is
        // already taken by another draft, append " (1)", " (2)", etc.
        // rather than blocking the rename.
        const existingTitles = drafts
            .filter(d => d._id !== draftId)
            .map(d => d.formData?.[titleField] ?? "");

        let finalTitle = trimmedTitle;
        if (existingTitles.includes(finalTitle)) {
            let counter = 1;
            let candidate = `${finalTitle} (${counter})`;
            while (existingTitles.includes(candidate)) {
                counter += 1;
                candidate = `${finalTitle} (${counter})`;
            }
            finalTitle = candidate;
        }

        try {
            setIsSaving(true);
            await onRename(finalTitle);
            onClose();
        } catch (err) {
            // onRename is expected to toast its own error; keep the popup open so the user can retry.
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="saveAs-popup-overlay">
            <div className="saveAs-popup-content">
                <div className="saveAs-date-header">
                    <h2 className="saveAs-date-title">Rename Document</h2>
                    <button className="saveAs-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="saveAs-date-group">
                    <label className="saveAs-date-label" htmlFor="title">New Draft Title</label>
                    <span className="saveAs-date-label-tc">
                        Insert the new title that should be used for this draft.
                    </span>
                    <textarea
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder={`Insert the new title`}
                        className="saveAs-popup-input"
                    />
                </div>

                <div className="saveAs-date-buttons">
                    <button onClick={handleSave} className="saveAs-date-button" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Rename"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RenameDraftPopup;