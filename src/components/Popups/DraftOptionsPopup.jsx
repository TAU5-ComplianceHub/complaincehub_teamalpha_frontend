import React from "react";
import { useNavigate } from "react-router-dom";
import "./DraftOptionsPopup.css";

const DraftOptionsPopup = ({
    isOpen,
    draft,
    openDraftRoute,
    versionHistoryRoute,
    onClose,
}) => {
    const navigate = useNavigate();

    if (!isOpen || !draft) return null;

    const goTo = (route) => {
        if (!route) return;
        onClose?.();
        navigate(route);
    };

    return (
        <div
            className="popup-menu-container-pub-files"
            onClick={(event) => event.stopPropagation()}
        >
            <div
                className="popup-content-pub-files"
                onMouseLeave={() => onClose?.()}
            >
                <ul>
                    <li onClick={() => goTo(openDraftRoute)}>Open Draft</li>
                </ul>

                {versionHistoryRoute && (
                    <ul>
                        <li onClick={() => goTo(versionHistoryRoute)}>Version History</li>
                    </ul>
                )}
            </div>
        </div>
    );
};

export default DraftOptionsPopup;
