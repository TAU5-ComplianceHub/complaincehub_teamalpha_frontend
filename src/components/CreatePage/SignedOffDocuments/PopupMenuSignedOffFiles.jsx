import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PopupMenuSignedOffFiles = ({ isOpen, setHoveredFileId, openDownloadModal, file, type, risk = false, typeDoc = "", id = null, openProcedurePopup, review }) => {
    const navigate = useNavigate();

    const getRoute = () => {
        let route;

        if (typeDoc == "standard") {
            route = `/FrontendDMS/reviewSOStandards/${file._id}/${typeDoc}`;
        }
        else if (typeDoc == "special") {
            route = `/FrontendDMS/reviewSOSpecial/${file._id}/${typeDoc}`;
        }
        else {
            route = `/FrontendDMS/reviewSOProcedure/${file._id}`;
        }

        return route;
    }

    const getVerRoute = () => {
        let verRoute;

        switch (typeDoc) {
            case "special":
                verRoute = `/FrontendDMS/versionHistorySOSpecial/${file._id}`;
                break;
            case "standard":
                verRoute = `/FrontendDMS/versionHistorySOStandards/${file._id}`;
                break;
            case "procedure":
                verRoute = `/FrontendDMS/versionHistorySOProcedures/${file._id}`;
                break;
        }

        return verRoute;
    }

    const getVerRoutePreview = () => {
        let verRoute;

        switch (typeDoc) {
            case "procedure":
                verRoute = `/FrontendDMS/ddsSignedOffPreview/Procedure/${file._id}`;
                break;
            case "standard":
                verRoute = `/FrontendDMS/ddsSignedOffPreview/Standard/${file._id}`;
                break;
            case "special":
                verRoute = `/FrontendDMS/ddsSignedOffPreview/Special Instruction/${file._id}`;
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

export default PopupMenuSignedOffFiles;