import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PopupMenuPubFiles.css";

const PopupMenuPubFiles = ({ isOpen, setHoveredFileId, openDownloadModal, file, type, risk = false, typeDoc = "", id = null, openProcedurePopup }) => {
    const navigate = useNavigate();
    let route;
    let verRoute;

    const getRoute = () => {
        if (risk) {
            route = `/FrontendDMS/review${typeDoc.toUpperCase()}/${file._id}/${typeDoc}`;
        }
        else {
            if (typeDoc == "standard") {
                route = `/FrontendDMS/reviewStandard/${file._id}/${typeDoc}`;
            }
            else if (typeDoc == "special") {
                route = `/FrontendDMS/reviewSpecial/${file._id}/${typeDoc}`;
            }
            else {
                route = `/FrontendDMS/review/${file._id}`;
            }
        }
    }

    const getVerRoute = () => {
        switch (typeDoc) {
            case "ibra":
                verRoute = `/FrontendDMS/versionHistoryIBRA/${id}`;
                break;
            case "special":
                verRoute = `/FrontendDMS/versionHistorySpecial/${id}`;
                break;
            case "standard":
                verRoute = `/FrontendDMS/versionHistoryStandard/${id}`;
                break;
            case "blra":
                verRoute = `/FrontendDMS/versionHistoryBLRA/${id}`;
                break;
            case "jra":
                verRoute = `/FrontendDMS/versionHistoryJRA/${id}`;
                break;
            case "procedure":
                verRoute = `/FrontendDMS/versionHistoryProcedure/${id}`;
                break;
        }
    }

    useEffect(() => {
        getRoute();
        getVerRoute();
    }, [])

    return (
        <div className="popup-menu-container-pub-files">
            {isOpen && (
                <div className="popup-content-pub-files"
                    onMouseEnter={() => setHoveredFileId(file._id)}
                    onMouseLeave={() => setHoveredFileId(null)}
                >
                    {false && (<ul>
                        <li onClick={() => openDownloadModal(file._id, file.fileName)}>Download</li>
                    </ul>)}
                    {false && type !== "dont" && (
                        <ul>
                            <li onClick={() => navigate(route)}>Review</li>
                        </ul>
                    )}
                    <ul>
                        <li onClick={() => navigate(verRoute)}>Version History</li>
                    </ul>
                    {(file.documentStatus.toLowerCase() !== "in review") && (<ul>
                        <li onClick={() => {
                            let safeId = file._id;
                            if (typeof file._id === 'object' && file._id !== null) {
                                safeId = file._id.$oid || file._id.toString();
                            }

                            console.log("2. Safe ID being sent:", safeId);
                            openProcedurePopup(safeId);
                        }}>
                            Upload Signed Off Version</li>
                    </ul>)}
                </div>
            )}
        </div>
    );
};

export default PopupMenuPubFiles;