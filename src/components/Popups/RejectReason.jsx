import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";

const RejectReason = ({ isOpen, onClose, onSubmit, loading }) => {
    const [message, setMessage] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!message.trim()) {
            toast.error("Please enter a reason for rejection.");
            return;
        }

        onSubmit(message);
    };

    return (
        <div className="abbr-popup-overlay">
            <div className="abbr-popup-content" style={{ width: "600px", maxWidth: "600px" }}>
                <div className="abbr-popup-header">
                    <h2 className="abbr-popup-title">Reject Document</h2>
                    <button
                        className="abbr-popup-close"
                        onClick={onClose}
                        title="Close Popup"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div
                        className="term-popup-scrollable"
                        style={{ marginBottom: "5px" }}
                    >
                        <div className="manDefs-popup-group">
                            <label className="manDefs-popup-label">
                                Reason For Rejection
                            </label>

                            <textarea
                                rows={4}
                                style={{
                                    resize: "none",
                                    fontFamily: "Arial"
                                }}
                                spellCheck={true}
                                className="manDefs-input-text-area"
                                placeholder="Insert the reason this document is being rejected."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="abbr-popup-buttons">
                        <button
                            type="submit"
                            className="abbr-popup-button"
                            disabled={loading}
                            style={{ width: "40%" }}
                        >
                            {loading
                                ? <FontAwesomeIcon icon={faSpinner} spin />
                                : "Submit"
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RejectReason;