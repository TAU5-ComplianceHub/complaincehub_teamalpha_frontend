import React from "react";
import { useNavigate } from "react-router-dom";

const PopupMenuOnlineTraining = ({ isOpen, setHoveredFileId, undoRetakeChoice, openDownloadModal, file, type, risk = false, typeDoc = "", id = null, openPreview, isCreate = false, openReviewPopup }) => {
    const navigate = useNavigate();

    return (
        <div className="popup-menu-container-pub-files">
            {isOpen && (
                <div className="popup-content-pub-files"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    <ul>
                        <li onClick={() => openPreview(file._id)}>Preview Course</li>
                    </ul>
                    <ul>
                        <li onClick={() => {
                            if (isCreate) openReviewPopup(file._id)
                            navigate(`/FrontendDMS/onlineReviewCourse/${file._id}`)
                        }}>Review</li>
                    </ul>
                    {file.undoable && (<ul>
                        <li onClick={() => undoRetakeChoice(file.batchId)}>Undo Require Retake</li>
                    </ul>)}
                    <ul>
                        <li onClick={() => navigate(`/FrontendDMS/onlineTrainingHistory/${file._id}`)}>Version History</li>
                    </ul>
                    <ul>
                        <li onClick={() => navigate(`/FrontendDMS/onlineTrainingCourseManagement/${file._id}`)}>Manage Course</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default PopupMenuOnlineTraining;
