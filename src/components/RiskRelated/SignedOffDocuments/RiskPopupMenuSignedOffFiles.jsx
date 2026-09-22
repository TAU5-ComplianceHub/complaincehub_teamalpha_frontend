import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const RiskPopupMenuSignedOffFiles = ({ isOpen, setHoveredFileId, openDownloadModal, file, type, risk = false, typeDoc = "", id = null, openProcedurePopup, review }) => {
    const navigate = useNavigate();

    const getRoute = () => {
        let route;

        if (typeDoc == "ibra") {
            route = `/FrontendDMS/reviewSOIBRA/${file._id}/${typeDoc.toUpperCase()}`;
        }
        else if (typeDoc == "blra") {
            route = `/FrontendDMS/reviewSOBLRA/${file._id}/${typeDoc.toUpperCase()}`;
        }
        else {
            route = `/FrontendDMS/reviewSOJRA/${file._id}/${typeDoc.toUpperCase()}`;
        }

        return route;
    }

    const getVerRoute = () => {
        let verRoute;

        switch (typeDoc) {
            case "ibra":
                verRoute = `/FrontendDMS/versionHistorySOIBRA/${file._id}`;
                break;
            case "blra":
                verRoute = `/FrontendDMS/versionHistorySOBLRA/${file._id}`;
                break;
            case "jra":
                verRoute = `/FrontendDMS/versionHistorySOJRA/${file._id}`;
                break;
        }

        return verRoute;
    }

    const getVerRoutePreview = () => {
        let verRoute;

        switch (typeDoc) {
            case "ibra":
                verRoute = `/FrontendDMS/rmsSignedOffPreview/IBRA/${file._id}`;
                break;
            case "blra":
                verRoute = `/FrontendDMS/rmsSignedOffPreview/BLRA/${file._id}`;
                break;
            case "jra":
                verRoute = `/FrontendDMS/rmsSignedOffPreview/JRA/${file._id}`;
                break;
        }

        return verRoute;
    }

    return (
        <div className="popup-menu-container-pub-files">
            {isOpen && (
                <div className="popup-content-pub-files"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    {false && (<ul>
                        <li onClick={() => openDownloadModal(file.dmsId._id, file.dmsId.fileName)}>Download</li>
                    </ul>)}
                    {file.documentStatus.toLowerCase() !== "in revision" && (
                        <ul>
                            <li onClick={() => review(file._id)}>Review</li>
                        </ul>
                    )}
                    <ul>
                        <li onClick={() => navigate(`${getVerRoutePreview()}`)}>Preview</li>
                    </ul>
                    <ul>
                        <li onClick={() => navigate(`${getVerRoute()}`)}>Version History</li>
                    </ul>
                    {false && (
                        <ul>
                            <li onClick={console.log("1")}>Upload PDF Document</li>
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default RiskPopupMenuSignedOffFiles;