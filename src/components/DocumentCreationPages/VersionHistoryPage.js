import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faCaretLeft,
    faCaretRight,
    faEye,
    faRotateLeft,
    faSearch,
    faSpinner,
    faX,
} from "@fortawesome/free-solid-svg-icons";
import TopBar from "../Notifications/TopBar";
import { toast, ToastContainer } from "react-toastify";
import RestoreVersionPopup from "../Popups/RestoreVersionPopup";

const VersionHistoryPage = () => {
    const navigate = useNavigate();
    const { type, id } = useParams();
    const [versions, setVersions] = useState([]);
    const [draftTitle, setDraftTitle] = useState("");
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [canRestore, setCanRestore] = useState(false);
    const [restoringVersion, setRestoringVersion] = useState(null);
    const [restoreTarget, setRestoreTarget] = useState(null);
    const [sortDir] = useState("desc");

    const normalizedType = type || "Procedure";

    // Same idea as DraftsPage's configMap - each draft type saves its version
    // history under a different API prefix (and reopens in a different editor),
    // but otherwise this page works identically for all of them.
    const VERSION_HISTORY_CONFIG = {
        Procedure: {
            apiBase: `${process.env.REACT_APP_URL}/api/draft`,
            editorRoute: (draftId) => `/FrontendDMS/documentCreateProc/Procedure/${draftId}`,
        },
        Standard: {
            apiBase: `${process.env.REACT_APP_URL}/api/draft/standards`,
            editorRoute: (draftId) => `/FrontendDMS/documentCreateStand/Standard/${draftId}`,
        },
        "Special Instruction": {
            apiBase: `${process.env.REACT_APP_URL}/api/draft/special`,
            editorRoute: (draftId) => `/FrontendDMS/documentCreateSI/Special Instruction/${draftId}`,
        },
    };

    const pageConfig = VERSION_HISTORY_CONFIG[normalizedType] || VERSION_HISTORY_CONFIG.Procedure;

    const loadVersions = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(
                `${pageConfig.apiBase}/versions/${id}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data?.error || "Failed to load version history");
            }

            setDraftTitle(data.title || "Untitled Draft");
            setCanRestore(Boolean(data.canRestore));
            setVersions(Array.isArray(data.versions) ? data.versions : []);
        } catch (error) {
            console.error("Failed to load version history:", error);
            toast.error(error.message || "Failed to load version history");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadVersions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, normalizedType]);

    const formatDateTime = (value) => {
        if (!value) return "N/A";
        const date = new Date(value);
        const options = {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", hour12: true,
            timeZone: "Africa/Johannesburg"
        };
        const formatter = new Intl.DateTimeFormat(undefined, options);
        const parts = formatter.formatToParts(date);
        const datePart = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
        const timePart = `${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value} ${parts.find(p => p.type === 'dayPeriod').value}`;
        return `${datePart} ${timePart}`;
    };

    const displayedVersions = useMemo(() => {
        const search = query.trim().toLowerCase();
        const filtered = versions.filter((item) => {
            if (!search) return true;

            return [
                draftTitle,
                item.label,
                item.createdBy?.username,
                formatDateTime(item.createdAt),
            ].some((value) => String(value || "").toLowerCase().includes(search));
        });

        return [...filtered].sort((a, b) => {
            const direction = sortDir === "asc" ? 1 : -1;
            return (Number(a.version) - Number(b.version)) * direction;
        });
    }, [versions, draftTitle, query, sortDir]);

    const openPreview = (version) => {
        navigate(
            `/FrontendDMS/documentVersionPreview/${encodeURIComponent(normalizedType)}/${id}/${version}`
        );
    };

    const requestRestore = (item) => {
        if (!canRestore || restoringVersion) return;
        setRestoreTarget(item);
    };

    const restoreVersion = async (item) => {
        setRestoreTarget(null);
        setRestoringVersion(item.version);

        try {
            const response = await fetch(
                `${pageConfig.apiBase}/versions/${id}/${item.version}/restore`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data?.error || "Failed to restore version");
            }

            toast.success(
                data?.backupLabel
                    ? `${item.label} restored successfully. Previous working state saved as ${data.backupLabel}.`
                    : `${item.label} restored successfully`
            );

            setTimeout(() => {
                navigate(pageConfig.editorRoute(id));
            }, 500);
        } catch (error) {
            console.error("Failed to restore version:", error);
            toast.error(error.message || "Failed to restore version");
        } finally {
            setRestoringVersion(null);
        }
    };

    return (
        <div className="gen-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div
                        className="sidebar-toggle-icon"
                        title="Hide Sidebar"
                        onClick={() => setIsSidebarVisible(false)}
                    >
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Document Development</p>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <p className="logo-text-dm-fi">Version History</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div
                        className="sidebar-toggle-icon"
                        title="Show Sidebar"
                        onClick={() => setIsSidebarVisible(true)}
                    >
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            <div className="main-box-gen-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon icon={faArrowLeft} onClick={() => navigate(-1)} title="Back" />
                    </div>

                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search versions"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                        {query ? (
                            <i>
                                <FontAwesomeIcon
                                    icon={faX}
                                    onClick={() => setQuery("")}
                                    className="icon-um-search"
                                    title="Clear Search"
                                />
                            </i>
                        ) : (
                            <i>
                                <FontAwesomeIcon icon={faSearch} className="icon-um-search" />
                            </i>
                        )}
                    </div>

                    <div className="spacer" />
                    <TopBar />
                </div>

                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">
                            {draftTitle ? `${draftTitle} - Version History` : "Version History"}
                        </label>
                    </div>

                    <div className="table-container-file-flameproof-all-assets">
                        <table className="gen-table">
                            <thead className="gen-head" style={{ fontSize: "14px" }}>
                                <tr>
                                    <th className="gen-th" style={{ width: "6%" }}>Nr</th>
                                    <th className="gen-th ibraGenFN" style={{ width: "40%" }}>Draft / Version</th>
                                    <th className="gen-th ibraGenVer" style={{ width: "18%" }}>Saved By</th>
                                    <th className="gen-th ibraGenPD" style={{ width: "26%" }}>Saved Date</th>
                                    <th className="gen-th ibraGenType" style={{ width: "10%" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && (
                                    <tr>
                                        <td colSpan="5" className="cent">Loading versions...</td>
                                    </tr>
                                )}

                                {!isLoading && displayedVersions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="cent">No Versions Available.</td>
                                    </tr>
                                )}

                                {!isLoading && displayedVersions.map((item, index) => (
                                    <tr
                                        key={item._id || item.version}
                                        style={{ fontSize: "14px", cursor: "pointer" }}
                                        className="load-draft-td"
                                        onClick={() => openPreview(item.version)}
                                    >
                                        <td style={{ fontFamily: "Arial", textAlign: "center" }}>{index + 1}</td>
                                        <td style={{ fontFamily: "Arial" }}>
                                            {draftTitle} {item.label}
                                        </td>
                                        <td className="cent-draft-class" style={{ fontFamily: "Arial" }}>
                                            {item.createdBy?.username || "Unknown"}
                                        </td>
                                        <td className="cent-draft-class" style={{ fontFamily: "Arial" }}>
                                            {formatDateTime(item.createdAt)}
                                        </td>
                                        <td
                                            className="load-draft-delete"
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <div style={{ display: "flex", width: "100%" }}>
                                                <button
                                                    type="button"
                                                    className="action-button-load-draft delete-button-load-draft"
                                                    style={{ width: "50%" }}
                                                    title={`View ${item.label}`}
                                                    onClick={() => openPreview(item.version)}
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="action-button-load-draft delete-button-load-draft"
                                                    style={{ width: "50%" }}
                                                    disabled={!canRestore || restoringVersion !== null}
                                                    title={canRestore ? `Restore ${item.label}` : "You do not have permission to restore versions"}
                                                    onClick={() => requestRestore(item)}
                                                >
                                                    {restoringVersion === item.version ? (
                                                        <FontAwesomeIcon icon={faSpinner} spin />
                                                    ) : (
                                                        <FontAwesomeIcon icon={faRotateLeft} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {restoreTarget && (
                <RestoreVersionPopup
                    closeModal={() => setRestoreTarget(null)}
                    confirmRestore={() => restoreVersion(restoreTarget)}
                    versionLabel={restoreTarget.label}
                />
            )}

            <ToastContainer />
        </div>
    );
};

export default VersionHistoryPage;