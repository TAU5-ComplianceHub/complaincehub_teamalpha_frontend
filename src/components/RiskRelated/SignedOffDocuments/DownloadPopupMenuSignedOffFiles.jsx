import React from "react";

const DownloadPopupMenuSignedOffFiles = ({ isOpen, setHoveredDownloadId, file, onDownloadPDF, onDownloadWord }) => {
    return (
        <div className="popup-menu-container-pub-files" style={{ left: "-130px" }}>
            {isOpen && (
                <div className="popup-content-pub-files"
                    onMouseEnter={() => setHoveredDownloadId(file._id)}
                    onMouseLeave={() => setHoveredDownloadId(null)}
                >
                    <ul>
                        <li onClick={onDownloadPDF}>Download PDF</li>
                    </ul>
                    <ul>
                        <li onClick={onDownloadWord}>Download Latest Word</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default DownloadPopupMenuSignedOffFiles;
