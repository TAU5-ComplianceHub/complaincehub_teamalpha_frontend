import React from "react";
import { useNavigate } from "react-router-dom";

const PopupMenuPubInduction = ({ isOpen, setHoveredFileId, undoRetakeChoice, openDownloadModal, file, type, risk = false, typeDoc = "", id = null, openPreview, openReviewPopup, isCreate = false }) => {
    const navigate = useNavigate();

    return (
        <div className="popup-menu-container-pub-files">
            {isOpen && (
                <div className="popup-content-pub-files"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    <ul>
                        <li onClick={() => openPreview(file._id)}>Preview Induction</li>
                    </ul>
                    <ul>
                        <li onClick={() => {
                            if (isCreate) openReviewPopup(file._id)
                            navigate(`/FrontendDMS/inductionReview/${file._id}`)
                        }}>Review</li>
                    </ul>
                    {file.undoable && (<ul>
                        <li onClick={() => undoRetakeChoice(file.batchId)}>Undo Require Retake</li>
                    </ul>)}
                    <ul>
                        <li onClick={() => navigate(`/FrontendDMS/inductionHistory/${file._id}`)}>Version History</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PopupMenuPubInduction;
