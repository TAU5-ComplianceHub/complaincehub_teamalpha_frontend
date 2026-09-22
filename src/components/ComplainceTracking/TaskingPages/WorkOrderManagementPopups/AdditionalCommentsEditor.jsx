import React, { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

// ---------------------------------------------------------------------------
// AdditionalCommentsEditor
//
// Editable counterpart to AdditionalCommentsPreview, used on the desktop
// Populate Work Order form. Two differences from the read-only version:
//
//   1. It's an actual editable textarea, not disabled - typing here is what
//      ends up in field.comment when the form is saved/submitted (see
//      _commentsForServer on the mobile app, which this mirrors: every
//      field gets an entry, including blank ones, so a cleared comment
//      clears server-side too).
//   2. It's shown underneath every field, not gated behind a server-driven
//      flag - matching what was asked for on this desktop form specifically.
//
// Collapsible exactly like populateWorkOrder.dart's isExperimentalComments
// Dropdown behaviour (_buildCommentSection): a small "Additional Comment"
// row with a chevron that expands/collapses the textarea underneath.
// Collapsed by default, same as mobile - it only opens once the person
// actually taps it, regardless of whether a comment is already saved there.
// ---------------------------------------------------------------------------
const AdditionalCommentsEditor = ({ fieldId, comment, expanded, onToggleExpand, onChange, disabled = false }) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea || !expanded) return;
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
    }, [comment, expanded]);

    return (
        <div style={{ marginTop: "8px" }}>
            <button
                type="button"
                onClick={onToggleExpand}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 0",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                }}
            >
                <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} style={{ color: "#002060", fontSize: "12px" }} />
                <span className="font-fam" style={{ fontSize: "13px", fontWeight: 600, color: "#002060" }}>
                    Additional Comment
                </span>
            </button>

            {expanded && (
                <div
                    style={{
                        marginTop: "4px",
                        padding: "8px",
                        backgroundColor: "#f0f0f0",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                    }}
                >
                    <textarea
                        ref={textareaRef}
                        className="waf-control waf-textarea"
                        placeholder="Insert Additional Comments"
                        value={comment ?? ""}
                        disabled={disabled}
                        onChange={(e) => onChange(fieldId, e.target.value)}
                        style={{ width: "calc(100% - 20px)", resize: "none", minHeight: "60px" }}
                    />
                </div>
            )}
        </div>
    );
};

export default AdditionalCommentsEditor;
