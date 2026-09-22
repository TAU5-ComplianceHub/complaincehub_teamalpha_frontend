import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const SignedOffDownloadConfirmPopup = ({ closeDownloadModal, confirmDownload, downloadFileName, downloadType, loading }) => {
    return (
        <div className="download-popup-overlay">
            <div className="download-popup-content">
                <div className="download-file-header">
                    <h2 className="download-file-title">Download File</h2>
                    <button className="download-file-close" onClick={closeDownloadModal} title="Close Popup">×</button>
                </div>

                <div className="download-file-group">
                    <div className="download-file-text">
                        {downloadType === "word"
                            ? "Do you want to download the latest Word document for this document?"
                            : "Do you want to download the PDF for this document?"}
                    </div>
                    <div>{downloadFileName}</div>
                </div>

                <div className="download-file-buttons">
                    <button className="download-file-button-download" onClick={confirmDownload} disabled={loading}>
                        {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Download'}
                    </button>
                    <button className="download-file-button-cancel" onClick={closeDownloadModal}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignedOffDownloadConfirmPopup;
