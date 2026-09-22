import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faFolderOpen, faFileCirclePlus, faFolder, faCloudUploadAlt, faUsersCog, faSitemap, faCaretLeft, faCaretRight, faPersonChalkboard, faBookOpen, faBullhorn, faChalkboardTeacher, faDownload, faLaptop, faCircle, faMessage } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../Notifications/TopBar";
import { getCurrentUser, canIn } from "../../utils/auth";

const OnlineTrainingHomePage = () => {
    const [error, setError] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [token, setToken] = useState('');
    const [count, setCount] = useState([]);
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [searchQuery, setSearchQuery] = useState("");
    const access = getCurrentUser();
    const navigate = useNavigate();

    const clearSearch = () => {
        setSearchQuery("");
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            console.log(decodedToken);
            setloggedInUserId(decodedToken.userId);
        }
    }, [navigate]);

    const TOTAL_SLOTS = 12;

    const paddedDocs = [...count];

    // Add placeholders if fewer than 12
    while (paddedDocs.length < TOTAL_SLOTS) {
        paddedDocs.push(null);
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="user-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Training Management</p>
                    </div>
                    <div className="button-container-create">
                        {true && canIn(access, "TMS", ["systemAdmin", "profileManager"]) && (
                            <>
                                <button className="but-um" onClick={() => navigate("/FrontendDMS/onlineProfiles")}>
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faUser} src={"/dmsAdmin.svg"} size="xs" className={"button-logo-custom"} />
                                        <span className="button-text">Student Profiles</span>
                                    </div>
                                </button>
                                <button className="but-um" onClick={() => navigate("/FrontendDMS/chatBoxCourses")}>
                                    <div className="button-content">
                                        <FontAwesomeIcon icon={faMessage} src={"/dmsAdmin.svg"} size="xs" className={"button-logo-custom"} />
                                        <span className="button-text">Chat Box</span>
                                    </div>
                                </button>
                            </>
                        )}
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

            <div className="main-box-user">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate("/FrontendDMS/trainingHomePage")} icon={faArrowLeft} title="Back" />
                    </div>
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>

                <div className="scrollable-box-fi-home">
                    {canIn(access, "TMS", ["systemAdmin"]) && (<div className={`document-card-fi-home-all`} onClick={() => navigate("/FrontendDMS/onlineCreateCourse/new")}>
                        <>
                            <div className="all-icon-fi-home">
                                <img src={`${process.env.PUBLIC_URL}/tmsCreateCourse2.svg`} className={"all-icon-fi-home"} />
                            </div>
                            <h3 className="document-title-fi-home">Develop Course</h3>
                        </>
                    </div>)}
                    {canIn(access, "TMS", ["systemAdmin"]) && (<div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/onlineDraftCourses")}>
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/tmsSavedDrafts.svg`} icon={faFolderOpen} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Saved Drafts</h3>
                        </>
                    </div>)}
                    <div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/onlineTrainingApprovals")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/tmsPublished.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Review & Approval Courses</h3>
                        </>
                    </div>
                    {canIn(access, "TMS", ["systemAdmin"]) && (<div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/onlinePublishedCourses")}>
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/tmsPublished.svg`} icon={faFolderOpen} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Controlled Courses</h3>
                        </>
                    </div>)}
                    {true && (<div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/trainingRevisionInfo")}>
                        <>
                            <div className="icon-risk">
                                <img src={`${process.env.PUBLIC_URL}/tmsPublished.svg`} alt="Control Attributes" className="icon-risk" />
                            </div>
                            <h3 className="document-title-risk-home">Under Revision Courses<br /></h3>
                        </>
                    </div>)}
                    {false && canIn(access, "TMS", ["systemAdmin", "profileManager"]) && (<div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/onlineProfiles")}>
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/visitorInductionIcon.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Student Profiles</h3>
                        </>
                    </div>)}
                    {false && canIn(access, "TMS", ["systemAdmin", "profileManager"]) && (<div className={`document-card-fi-home`} onClick={() => navigate("/FrontendDMS/chatBoxCourses")}>
                        <>
                            <div className="icon-dept">
                                <img src={`${process.env.PUBLIC_URL}/chatBox2.svg`} className={"icon-dept"} />
                            </div>
                            <h3 className="document-title-fi-home">Chat Box</h3>
                        </>
                    </div>)}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default OnlineTrainingHomePage;