import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faCaretLeft, faCaretRight,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import TopBar from "./Notifications/TopBar";
import TopBarDD from "./Notifications/TopBarDD";
import { getCurrentUser, canIn } from "../utils/auth";
import "./DMSDashboard.css";

const DMSDashboard = () => {
    const navigate = useNavigate();
    const access = getCurrentUser();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        valid: 0,
        invalid: 0,
        dueForReview: 0,
    });
    const [ctsStats, setCtsStats] = useState({
        openTasks: 0,
        overdue: 0,
        dueSoon: 0,
        completed: 0,
    });

    const [epamsStats, setEpamsStats] = useState({
        total: 0,
        valid: 0,
        expiringSoon: 0,
        expired: 0,
    });

    const [ddsStats, setDdsStats] = useState({
        total: 0,
        inApproval: 0,
        inReview: 0,
        underPeriodicReview: 0,
    });

    const [rmsStats, setRmsStats] = useState({
        total: 0,
        inApproval: 0,
        inReview: 0,
        underPeriodicReview: 0,
    });

    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    console.error("No token found in localStorage");
                    return;
                }

                const res = await fetch(`${process.env.REACT_APP_URL}/api/dashboard/dashboard-all`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = await res.json();

                if (!res.ok) {
                    console.error("Dashboard API error:", res.status, data);
                    throw new Error(data?.error || "Failed to fetch dashboard data");
                }

                const { fileStats, ddsStats, rmsStats } = data;

                setStats({
                    total: fileStats.total,
                    valid: fileStats.valid,
                    dueForReview: fileStats.expiringSoon,
                    invalid: fileStats.expired,
                });

                if (ddsStats) {
                    setDdsStats({
                        total: ddsStats.total,
                        inApproval: ddsStats.inApproval,
                        inReview: ddsStats.inReview,
                        underPeriodicReview: ddsStats.underPeriodicReview,
                    });
                }

                if (rmsStats) {
                    setRmsStats({
                        total: rmsStats.total,
                        inApproval: rmsStats.inApproval,
                        inReview: rmsStats.inReview,
                        underPeriodicReview: rmsStats.underPeriodicReview,
                    });
                }

                if (data.ctsStats) {
                    setCtsStats({
                        openTasks: data.ctsStats.openTasks,
                        overdue: data.ctsStats.overdue,
                        dueSoon: data.ctsStats.dueSoon,
                        completed: data.ctsStats.completed,
                    });
                }

                if (data.epamsStats) {
                    setEpamsStats({
                        total: data.epamsStats.total,
                        valid: data.epamsStats.valid,
                        expiringSoon: data.epamsStats.expiringSoon,
                        expired: data.epamsStats.expired,
                    });
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchDashboard();
    }, []);

    const getStatusBadge = (n) => {
        if (n <= 10) return <span className="dms-ops-badge dms-ops-badge-ok">Compliant</span>;
        if (n <= 30) return <span className="dms-ops-badge dms-ops-badge-info">Monitor</span>;
        if (n <= 100) return <span className="dms-ops-badge dms-ops-badge-warn">Attention Required</span>;
        return <span className="dms-ops-badge dms-ops-badge-danger">High Attention</span>;
    };

    const getDmsStatusBadge = ({ expired, expiringSoon }) => {
        if (expired >= 1) {
            return <span className="dms-ops-badge dms-ops-badge-danger">High Attention</span>;
        }

        if (expiringSoon >= 20) {
            return <span className="dms-ops-badge dms-ops-badge-warn">Attention Required</span>;
        }

        if (expiringSoon >= 10) {
            return <span className="dms-ops-badge dms-ops-badge-info">Monitor</span>;
        }

        return <span className="dms-ops-badge dms-ops-badge-ok">Compliant</span>;
    };

    return (
        <div className="risk-info-container" style={{ fontFamily: "Arial" }}>
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Dashboards</p>
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
                    <div className="spacer"></div>
                    <TopBarDD canIn={canIn} access={access} menu={"1"} create={true} risk={true} showInfo={false} type={"RMS"} />
                </div>

                <div className="dms-dashboard-wrapper">
                    {loadingStats ? (
                        <div className="dms-dashboard-loading" aria-live="polite">
                            <FontAwesomeIcon
                                icon={faSpinner}
                                className="dms-dashboard-spinner"
                            />
                            <span className="dms-dashboard-loading-text">
                                Loading dashboard…
                            </span>
                        </div>
                    ) : (
                        <div className={isSidebarVisible ? `dms-ops-grid-sideopen` : `dms-ops-grid`}>

                            <div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/dmsDash')}>
                                <div className="dms-ops-card-header">
                                    <div style={{ width: "100%" }}>
                                        <p className="dms-ops-card-title">Document Management</p>
                                        <p className="dms-ops-card-desc">Stored and controlled documents</p>
                                    </div>
                                    {getDmsStatusBadge({
                                        expired: stats.invalid,
                                        expiringSoon: stats.dueForReview
                                    })}
                                </div>
                                <div className="dms-ops-bottom">
                                    <div className="dms-ops-hero">
                                        <div className="dms-ops-hero-number color-red">{stats.invalid + stats.dueForReview}</div>
                                        <div className="dms-ops-hero-label">Documents Requiring Attention</div>
                                    </div>
                                    <div className="dms-ops-substats">
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-orange">{stats.dueForReview}</span>
                                            <span className="dms-ops-substat-lbl">Due For Review</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-red">{stats.invalid}</span>
                                            <span className="dms-ops-substat-lbl">Review Overdue</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-green">{stats.valid}</span>
                                            <span className="dms-ops-substat-lbl">Valid</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Document Development */}
                            <div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/ddsDash')}>
                                <div className="dms-ops-card-header">
                                    <div style={{ width: "100%" }}>
                                        <p className="dms-ops-card-title">Document Development</p>
                                        <p className="dms-ops-card-desc">Documents in creation and approval</p>
                                    </div>
                                    {getStatusBadge(ddsStats.total)}
                                </div>
                                <div className="dms-ops-bottom">
                                    <div className="dms-ops-hero">
                                        <div className="dms-ops-hero-number color-blue">{ddsStats.total}</div>
                                        <div className="dms-ops-hero-label">Documents In Development</div>
                                    </div>
                                    <div className="dms-ops-substats">
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-orange">{ddsStats.inApproval}</span>
                                            <span className="dms-ops-substat-lbl">In Approval</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-blue">{ddsStats.inReview}</span>
                                            <span className="dms-ops-substat-lbl">In Review</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-green">{ddsStats.underPeriodicReview}</span>
                                            <span className="dms-ops-substat-lbl">Under Periodic Review</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Risk Management */}
                            <div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/rmsDash')}>
                                <div className="dms-ops-card-header">
                                    <div style={{ width: "100%" }}>
                                        <p className="dms-ops-card-title">Risk Management</p>
                                        <p className="dms-ops-card-desc">Risk assessments and approvals</p>
                                    </div>
                                    {getStatusBadge(rmsStats.total)}
                                </div>
                                <div className="dms-ops-bottom">
                                    <div className="dms-ops-hero">
                                        <div className="dms-ops-hero-number color-blue">{rmsStats.total}</div>
                                        <div className="dms-ops-hero-label">Risk Assessments In Development</div>
                                    </div>
                                    <div className="dms-ops-substats">
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-orange">{rmsStats.inApproval}</span>
                                            <span className="dms-ops-substat-lbl">In Approval</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-blue">{rmsStats.inReview}</span>
                                            <span className="dms-ops-substat-lbl">In Review</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-green">{rmsStats.underPeriodicReview}</span>
                                            <span className="dms-ops-substat-lbl">Under Periodic Review</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Training Management */}
                            {false && (<div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/constructionHelp')}>
                                <div className="dms-ops-card-header">
                                    <div style={{ width: "100%" }}>
                                        <p className="dms-ops-card-title">Training Management</p>
                                        <p className="dms-ops-card-desc">Courses and inductions</p>
                                    </div>
                                    <span className="dms-ops-badge dms-ops-badge-warn">Attention Required</span>
                                </div>
                                <div className="dms-ops-bottom">
                                    <div className="dms-ops-hero">
                                        <div className="dms-ops-hero-number color-red">31</div>
                                        <div className="dms-ops-hero-label">Overdue Training</div>
                                    </div>
                                    <div className="dms-ops-substats">
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-blue">240</span>
                                            <span className="dms-ops-substat-lbl">Active Students</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-blue">18</span>
                                            <span className="dms-ops-substat-lbl">Active Courses</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-green">209</span>
                                            <span className="dms-ops-substat-lbl">Completed Courses</span>
                                        </div>
                                    </div>
                                </div>
                            </div>)}

                            {/* 5. EPA Management */}
                            {false && (<div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/epamsDash')}>
                                <div className="dms-ops-card-header">
                                    <div style={{ width: "100%" }}>
                                        <p className="dms-ops-card-title">EPA Management</p>
                                        <p className="dms-ops-card-desc">Certificate validity tracking</p>
                                    </div>
                                    {getStatusBadge(epamsStats.expired + epamsStats.expiringSoon)}
                                </div>
                                <div className="dms-ops-bottom">
                                    <div className="dms-ops-hero">
                                        <div className="dms-ops-hero-number color-red">{epamsStats.expired + epamsStats.expiringSoon}</div>
                                        <div className="dms-ops-hero-label">Certificates Requiring Attention</div>
                                    </div>
                                    <div className="dms-ops-substats">
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-orange">{epamsStats.expiringSoon}</span>
                                            <span className="dms-ops-substat-lbl">Expiring Soon</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-red">{epamsStats.expired}</span>
                                            <span className="dms-ops-substat-lbl">Expired</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-green">{epamsStats.valid}</span>
                                            <span className="dms-ops-substat-lbl">Valid</span>
                                        </div>
                                    </div>
                                </div>
                            </div>)}

                            {/* 6. Compliance Tracking */}
                            <div className="dms-ops-card" onClick={() => navigate('/FrontendDMS/ctsDash')}>
                                <div className="dms-ops-card-header">
                                    <div style={{ width: "100%" }}>
                                        <p className="dms-ops-card-title">Compliance Tracking</p>
                                        <p className="dms-ops-card-desc">Tasks, actions and accountability</p>
                                    </div>
                                    {getStatusBadge((ctsStats.overdue + ctsStats.openTasks + ctsStats.dueSoon))}
                                </div>
                                <div className="dms-ops-bottom">
                                    <div className="dms-ops-hero">
                                        <div className="dms-ops-hero-number color-red">{ctsStats.overdue}</div>
                                        <div className="dms-ops-hero-label">Overdue</div>
                                    </div>
                                    <div className="dms-ops-substats">
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-blue">{ctsStats.openTasks}</span>
                                            <span className="dms-ops-substat-lbl">Open Tasks</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-orange">{ctsStats.dueSoon}</span>
                                            <span className="dms-ops-substat-lbl">Due Soon</span>
                                        </div>
                                        <div className="dms-ops-substat">
                                            <span className="dms-ops-substat-num color-green">{ctsStats.completed}</span>
                                            <span className="dms-ops-substat-lbl">Completed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ToastContainer />
        </div>
    );
};

export default DMSDashboard;