import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCaretLeft, faCaretRight, faCircle } from '@fortawesome/free-solid-svg-icons';
import TopBarDD from "../Notifications/TopBarDD";
import { getCurrentUser, canIn } from "../../utils/auth";
import TopBar from "../Notifications/TopBar";

const FieldTemplateHomePage = () => {
    const navigate = useNavigate();
    const access = getCurrentUser();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    return (
        <div className="risk-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Field Template</p>
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

            <div className="main-box-risk">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    <TopBarDD canIn={canIn} access={access} menu={"1"} create={true} />
                </div>

                <div className="scrollable-box-risk-home">
                    {false && (<div className={`document-card-riks-all`} onClick={() => navigate("/FrontendDMS/standardFieldsFTS")}>
                        <>
                            <div className="icon-risk-all">
                                <FontAwesomeIcon icon={faCircle} alt="Control Attributes" className="icon-risk-all" style={{ color: "white" }} />
                            </div>
                            <h3 className="document-title-risk-home">Standard Fields<br /></h3>
                        </>
                    </div>)}
                    <div className={`document-card-fi-home-all`} onClick={() => navigate("/FrontendDMS/ftsCreateTemplate/template/new")}>
                        <>
                            <div className="all-icon-fi-home">
                                <img src={`${process.env.PUBLIC_URL}/ftsDevelop1.svg`} className="icon-risk-all" style={{ color: "white" }} />
                            </div>
                            <h3 className="document-title-dc-home">Develop Template</h3>
                        </>
                    </div>
                    {true && (<div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/ftsDrafts/template")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/tmsSavedDrafts.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Saved Drafts</h3>
                        </>
                    </div>)}
                    {true && (<div className={`document-card-dc-home`} onClick={() => navigate("/FrontendDMS/ftsGeneratedTemplates")}>
                        <>
                            <div className="icon-dc">
                                <img src={`${process.env.PUBLIC_URL}/tmsPublished.svg`} className={"icon-dc"} />
                            </div>
                            <h3 className="document-title-dc-home">Review & Approval Templates</h3>
                        </>
                    </div>)}
                    {true && (<div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/ftsSignedOffTemplates")}>
                        <>
                            <div className="icon-risk">
                                <img src={`${process.env.PUBLIC_URL}/tmsPublished.svg`} alt="Control Attributes" className="icon-risk" />
                            </div>
                            <h3 className="document-title-risk-home">Controlled Templates<br /></h3>
                        </>
                    </div>)}
                    {true && (<div className={`document-card-risk-home`} onClick={() => navigate("/FrontendDMS/fieldTemplateRevision")}>
                        <>
                            <div className="icon-risk">
                                <img src={`${process.env.PUBLIC_URL}/tmsPublished.svg`} alt="Control Attributes" className="icon-risk" />
                            </div>
                            <h3 className="document-title-risk-home">Under Revision Templates<br /></h3>
                        </>
                    </div>)}
                </div>
            </div>
            <ToastContainer />
        </div>
    );
};

export default FieldTemplateHomePage;