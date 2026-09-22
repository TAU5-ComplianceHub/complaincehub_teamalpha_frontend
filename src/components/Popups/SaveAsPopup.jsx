import React, { useEffect, useState } from "react";
import "./SaveAsPopup.css"; // Import a separate CSS file for styling
import { toast } from "react-toastify";

const SaveAsPopup = ({ readonlyTitle = false, onClose, saveAs, current, type, userID, create, standard = false, special = false }) => {
    const [title, setTitle] = useState(current);
    const [drafts, setDrafts] = useState([]);

    // 1) Fetch whenever the inputs that drive your route change
    useEffect(() => {
        if (readonlyTitle) return;
        let isMounted = true;
        async function loadDrafts() {
            let route;
            if (standard) {
                route = `draft/standards/drafts/${userID}`
            }
            else if (special) {
                route = `draft/special/drafts/${userID}`
            }
            else {
                route = create
                    ? `draft/drafts/${userID}`
                    : `riskDraft/${type.toLowerCase()}/drafts/${userID}`;
            }

            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/${route}`, {
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
    }, [userID, type, create]);

    const handleTitleChange = (e) => {
        const value = e.target.value;
        setTitle(value);
    };

    const handleSave = () => {
        if (readonlyTitle) {
            saveAs(title);
            onClose();
            return;
        }

        // 2) Compute existing titles right here
        const existingTitles = drafts.map(d => d.formData?.title ?? "");
        console.log("▶ title:", title);
        console.log("▶ existingTitles:", existingTitles);
        let finalTitle = title;
        if (existingTitles.includes(title)) {
            let counter = 1;
            let candidate = `${title} (${counter})`;
            while (existingTitles.includes(candidate)) {
                counter += 1;
                candidate = `${title} (${counter})`;
            }
            finalTitle = candidate;
        }

        // 3) Fire your save callback
        saveAs(finalTitle);

        // 4) Close the popup if that’s desirable
        onClose();
    };

    return (
        <div className="saveAs-popup-overlay">
            <div className="saveAs-popup-content">
                <div className="saveAs-date-header">
                    <h2 className="saveAs-date-title">Create Draft Copy</h2>
                    <button className="saveAs-date-close" onClick={onClose} title="Close Popup">×</button>
                </div>

                <div className="saveAs-date-group">
                    <label className="saveAs-date-label" htmlFor="email">New Draft Title</label>
                    <span className="saveAs-date-label-tc">
                        {readonlyTitle ? "The following title will be used for the saved template." : "Insert the title that should be used for the new draft that will be saved."}
                    </span>
                    <textarea
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder={`Insert the new title`}
                        className="saveAs-popup-input"
                        readOnly={readonlyTitle}
                    />
                </div>

                <div className="saveAs-date-buttons">
                    <button onClick={handleSave} className="saveAs-date-button">Create Copy</button>
                </div>
            </div>
        </div>
    );
};

export default SaveAsPopup;