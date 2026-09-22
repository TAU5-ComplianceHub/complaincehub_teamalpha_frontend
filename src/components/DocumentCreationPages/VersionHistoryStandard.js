import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBell, faCircleUser, faDownload, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import BurgerMenuFI from "../FileInfo/BurgerMenuFI";
import DownloadPopup from "../FileInfo/DownloadPopup";
import { jwtDecode } from 'jwt-decode';
import "./VersionHistoryDC.css";
import TopBar from "../Notifications/TopBar";

const VersionHistoryStandard = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadFileName, setDownloadFileName] = useState(null);
    const [displayName, setDisplayName] = useState(null);
    const { id } = useParams();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [versions, setVersions] = useState([]);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        fetchActivity();
    }, [token]);

    const openDownloadModal = (fileName, displayName) => {
        setDownloadFileName(fileName);
        setDisplayName(displayName);
        setIsDownloadModalOpen(true);
    };

    const closeDownloadModal = () => {
        setDownloadFileName(null);
        setDisplayName(null);
        setIsDownloadModalOpen(false);
    };

    const confirmDownload = () => {
        if (downloadFileName) {
            downloadFile(downloadFileName, displayName);
        }
        closeDownloadModal();
    };

    const downloadFile = async (fileName, displayName) => {
        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/generatedStandardHistory/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    fileName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to download the file');
            }

            // Confirm the response is a Blob
            const blob = await response.blob();

            // Create a URL and download the file
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', displayName || 'document.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error downloading the file. Please try again.');
        } finally {
            setLoading(false); // Reset loading state after response
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    // Fetch files from the API
    const fetchActivity = async () => {
        const route = `/api/fileGenDocs/standard/getFile/${id}`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Uncomment and fill in the token if needed
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();
            const storedData = data.files;

            setVersions(storedData.versions);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="dc-version-history-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Version History</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}
            <div className="main-box-dc-version-history-file">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">Version History</label>
                    </div>
                    <div className="table-containerdc-version-history-file-info">
                        <table className="dc-version-history-file-info-table">
                            <thead className="dc-version-history-file-info-head">
                                <tr>
                                    <th className="dc-version-history-file-th">Nr</th>
                                    <th className="dc-version-history-file-th">Name</th>
                                    <th className="dc-version-history-file-th">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {versions.length > 0 ? (
                                    versions.map((ver, index) => (
                                        <tr key={index} className={`file-info-row-height dc-version-history-file-info-tr`}>
                                            <td className="dc-version-history-file-nr">{index + 1}</td>
                                            <td className="dc-version-history-file-fn">{(ver.fileName)}</td>
                                            <td className="dc-version-history-file-ver"><button className="verion-download-button" onClick={() => openDownloadModal(ver.azureFileName, ver.fileName)}><FontAwesomeIcon icon={faDownload} title="Download" /></button></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No Version History</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isDownloadModalOpen && (<DownloadPopup closeDownloadModal={closeDownloadModal} confirmDownload={confirmDownload} downloadFileName={displayName} loading={loading} />)}
        </div >
    );
};

export default VersionHistoryStandard;