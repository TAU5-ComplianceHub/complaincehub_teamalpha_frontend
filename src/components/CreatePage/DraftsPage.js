import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faCircleLeft, faPenToSquare, faRotateLeft, faArrowsRotate, faMagnifyingGlass, faCircleXmark, faX, faFilter, faSortUp, faSortDown, faArrowLeft, faCaretRight, faCaretLeft, faSearch, faEdit } from '@fortawesome/free-solid-svg-icons';
import DeleteDraftPopup from "../Popups/DeleteDraftPopup";
import TopBar from "../Notifications/TopBar";
import { toast, ToastContainer } from "react-toastify";
import DraftOptionsPopup from "../Popups/DraftOptionsPopup";
import RenameDraftPopup from "../Popups/RenameDraftPopup";

const DraftsPage = () => {
    const [drafts, setDrafts] = useState([]);
    const [query, setQuery] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, draftId: null });
    const [isLoading, setIsLoading] = useState(true);
    const [showNoDrafts, setShowNoDrafts] = useState(false);
    const [deletePopup, setDeletePopup] = useState(false);
    const [author, setAuthor] = useState(false);
    const [title, setTitle] = useState("");
    const [sortBy, setSortBy] = useState(null);
    const [sortDir, setSortDir] = useState(null);
    const [isLoadingDraft, setIsLoadingDraft] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [userID, setUserID] = useState('');
    const [openDraftMenuId, setOpenDraftMenuId] = useState(null);
    const [renamePopup, setRenamePopup] = useState({ open: false, draftId: null, currentTitle: "" });
    const navigate = useNavigate();
    const { type } = useParams();

    // Excel Filter States
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const [activeExcelFilters, setActiveExcelFilters] = useState({});
    const excelPopupRef = useRef(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    const pageConfig = useMemo(() => {
        const configMap = {
            procedure: {
                icon: `${process.env.PUBLIC_URL}/proceduresDMSInverted.svg`,
                loadRoute: `${process.env.REACT_APP_URL}/api/draft/drafts/${userID}`,
                deleteRoute: (draftId) => `${process.env.REACT_APP_URL}/api/draft/delete/${draftId}`,
                renameRoute: (draftId) => `${process.env.REACT_APP_URL}/api/draft/rename/${draftId}`,
                rowClickRoute: (draftId) => `/FrontendDMS/documentCreateProc/Procedure/${draftId}`,
                versionHistoryRoute: (draftId) => `/FrontendDMS/ddsDraftHistory/Procedure/${draftId}`,
            },

            standard: {
                icon: `${process.env.PUBLIC_URL}/standardsDMSInverted.svg`,
                loadRoute: `${process.env.REACT_APP_URL}/api/draft/standards/drafts/${userID}`,
                deleteRoute: (draftId) => `${process.env.REACT_APP_URL}/api/draft/standards/delete/${draftId}`,
                renameRoute: (draftId) => `${process.env.REACT_APP_URL}/api/draft/standards/rename/${draftId}`,
                rowClickRoute: (draftId) => `/FrontendDMS/documentCreateStand/Standard/${draftId}`,
                versionHistoryRoute: (draftId) => `/FrontendDMS/ddsDraftHistory/Standard/${draftId}`,
            },

            special: {
                icon: `${process.env.PUBLIC_URL}/specialInstInverted.svg`,
                loadRoute: `${process.env.REACT_APP_URL}/api/draft/special/drafts/${userID}`,
                deleteRoute: (draftId) => `${process.env.REACT_APP_URL}/api/draft/special/delete/${draftId}`,
                renameRoute: (draftId) => `${process.env.REACT_APP_URL}/api/draft/special/rename/${draftId}`,
                rowClickRoute: (draftId) => `/FrontendDMS/documentCreateSI/Special Instruction/${draftId}`,
                versionHistoryRoute: (draftId) => `/FrontendDMS/ddsDraftHistory/Special Instruction/${draftId}`,
            },

            default: {
                label: "Saved Drafts",
                icon: "/tmsSavedDrafts2.svg",
                loadRoute: `${process.env.REACT_APP_URL}/api/visitorDrafts/getDrafts/${userID}`,
                deleteRoute: (draftId) => `${process.env.REACT_APP_URL}/api/visitorDrafts/delete/${draftId}`,
                rowClickRoute: (draftId) => `/inductionCreation/${draftId}`,
                titleField: (item) => item.formData?.courseTitle || item.formData?.title || "Untitled Draft",
                tableHeading: "Saved Draft",
                versionHistoryRoute: null,
            }
        };

        return configMap[type] || configMap.default;
    }, [type, userID]);

    // Helper for formatted values
    const formatDateTime = (dateString) => {
        if (!dateString) return "Not Updated Yet";
        const date = new Date(dateString);
        const options = {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: true,
            timeZone: 'Africa/Johannesburg'
        };
        const formatter = new Intl.DateTimeFormat(undefined, options);
        const parts = formatter.formatToParts(date);
        const datePart = `${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}`;
        const timePart = `${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value} ${parts.find(p => p.type === 'dayPeriod').value}`;
        return `${datePart} ${timePart}`;
    };

    const getDraftStatus = (item) => {
        const userIDs = Array.isArray(item?.userIDs) ? item.userIDs : [];
        if (item.isWithdrawn) {
            return "Published - Withdrawn"
        }
        if (item.isRejected) {
            return "Published - Rejected"
        }
        return userIDs.length > 1 ? "In Collaboration" : "In Development";
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "In Collaboration": return { color: "black", fontWeight: "normal" };
            case "In Development": return { color: "black", fontWeight: "normal" };
            default: return { color: "black", fontWeight: "normal" };
        }
    };

    const getRawValue = (item, colId) => {
        switch (colId) {
            case "name": return item.formData?.title || "";
            case "createdBy": return item.creator?.username || "Unknown";
            case "creationDate": return formatDateTime(item.dateCreated);
            case "lastModifiedBy": return item.lockActive ? item.lockOwner?.username : (item.updater?.username || "-");
            case "lastModifiedDate": return item.lockActive ? "Active" : item.dateUpdated ? formatDateTime(item.dateUpdated) : "Not Updated Yet";
            case "status": return getDraftStatus(item);
            default: return "";
        }
    };

    const getRawDate = (item, colId) => {
        switch (colId) {
            case "creationDate": return item.dateCreated ? new Date(item.dateCreated).getTime() : 0;
            case "lastModifiedDate": return item.dateUpdated ? new Date(item.dateUpdated).getTime() : 0;
            default: return 0;
        }
    };

    const toggleExcelSort = (field, dir) => {
        if (sortBy === field && sortDir === dir) {
            setSortBy(null);
            setSortDir(null);
        } else {
            setSortBy(field);
            setSortDir(dir);
        }
    };

    const filteredDrafts = useMemo(() => {
        const q = query.trim().toLowerCase();

        return drafts.filter(d => {
            const matchesQuery = !q || (d?.formData?.title || '').toLowerCase().includes(q);

            // Excel Filters
            let excelMatch = true;
            for (const [colId, selectedSet] of Object.entries(activeExcelFilters)) {
                if (!selectedSet) continue;
                const val = getRawValue(d, colId);
                if (!selectedSet.has(val)) {
                    excelMatch = false;
                    break;
                }
            }

            return matchesQuery && excelMatch;
        });
    }, [drafts, query, activeExcelFilters]);

    const displayDrafts = useMemo(() => {
        const list = [...filteredDrafts];

        return list.sort((a, b) => {
            // 1) Active (lockActive) always first
            if (a.lockActive && !b.lockActive) return -1;
            if (!a.lockActive && b.lockActive) return 1;

            // 2) Default sort: no active sort → newest dateUpdated first
            if (!sortBy || !sortDir) {
                const dateA = a.dateUpdated ? new Date(a.dateUpdated).getTime() : 0;
                const dateB = b.dateUpdated ? new Date(b.dateUpdated).getTime() : 0;
                return dateB - dateA;
            }

            // 3) Date columns: compare raw timestamps
            if (sortBy === 'creationDate' || sortBy === 'lastModifiedDate') {
                const dateA = getRawDate(a, sortBy);
                const dateB = getRawDate(b, sortBy);
                return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
            }

            // 4) All other columns: string compare
            const valA = getRawValue(a, sortBy);
            const valB = getRawValue(b, sortBy);
            const dir = sortDir === 'asc' ? 1 : -1;
            return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * dir;
        });
    }, [filteredDrafts, sortBy, sortDir]);

    const closeDelete = () => {
        setDeletePopup(false);
        setDeleteConfirm({ open: false, draftId: null });
    }

    useEffect(() => {
        const getDraftDocuments = async () => {
            setIsLoading(true);
            setShowNoDrafts(false);
            const token = localStorage.getItem("token");
            const route = pageConfig.loadRoute;
            try {
                const response = await fetch(route, {
                    method: "GET",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                });
                if (!response.ok) throw new Error("Failed to fetch drafts");
                const data = await response.json();
                setDrafts(data);
            } catch (error) {
                console.error("Failed to fetch drafts:", error);
            } finally {
                setIsLoading(false);
            }
        };
        getDraftDocuments();
    }, [userID, pageConfig]);

    useEffect(() => {
        if (!isLoading && drafts.length === 0) {
            const timer = setTimeout(() => setShowNoDrafts(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowNoDrafts(false);
        }
    }, [isLoading, drafts]);

    const confirmDelete = (draftId, title, creator) => {
        setDeleteConfirm({ open: true, draftId });
        setTitle(title);
        if (creator === userID) setAuthor(true);
        else if (creator !== userID) setAuthor(false);
        setDeletePopup(true);
    };

    const handleDelete = async () => {
        const { draftId } = deleteConfirm;
        if (!draftId) return;

        const route = pageConfig.deleteRoute(draftId);

        try {
            const response = await fetch(`${route}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            if (!response.ok) throw new Error("Failed to delete draft");

            setDrafts(drafts.filter(draft => draft._id !== draftId));

            if (author) {
                toast.success("Draft successfully deleted");
            } else {
                toast.success("Stopped collaborating successfully");
            }

            if (drafts.length === 0) setShowNoDrafts(true);

        } catch (error) {
            console.error("Failed to delete draft:", error);
            toast.error("Failed to delete draft");
        }

        setDeleteConfirm({ open: false, draftId: null });
        closeDelete();
    };

    const openRename = (item) => {
        if (item.lockActive) {
            toast.warn("This draft is currently locked and its title cannot be changed.", { closeButton: false });
            return;
        }
        setRenamePopup({ open: true, draftId: item._id, currentTitle: item.formData?.title || "" });
    };

    const closeRename = () => {
        setRenamePopup({ open: false, draftId: null, currentTitle: "" });
    };

    const handleRename = async (newTitle) => {
        const { draftId } = renamePopup;
        if (!draftId || !pageConfig.renameRoute) return;

        try {
            const response = await fetch(pageConfig.renameRoute(draftId), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ title: newTitle }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to rename draft");
            }

            setDrafts(prev => prev.map(draft =>
                draft._id === draftId
                    ? { ...draft, formData: { ...draft.formData, title: newTitle } }
                    : draft
            ));

            toast.success("Draft renamed successfully");
        } catch (error) {
            console.error("Failed to rename draft:", error);
            toast.error(error.message || "Failed to rename draft");
            throw error;
        }
    };

    const clearSearch = () => {
        setQuery("");
    }

    // Excel Filter Popup Logic
    function openExcelFilterPopup(colId, e) {
        if (!colId) return;
        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        const allValues = Array.from(new Set(drafts.map(d => getRawValue(d, colId)))).sort();
        const currentFilter = activeExcelFilters[colId];
        const initialSelected = currentFilter ? new Set(currentFilter) : new Set(allValues);

        setExcelSelected(initialSelected);
        setExcelSearch("");
        setExcelFilter({
            open: true,
            colId,
            anchorRect: rect,
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(220, rect.width),
            },
        });
    }

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (excelPopupRef.current && !excelPopupRef.current.contains(e.target) && !e.target.closest('th')) {
                setExcelFilter(prev => ({ ...prev, open: false }));
            }
        };
        if (excelFilter.open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [excelFilter.open]);

    const handleInnerScrollWheel = (e) => e.stopPropagation();

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(activeExcelFilters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortBy !== null || sortDir !== null;
        return hasColumnFilters || hasSort;
    }, [activeExcelFilters, sortBy, sortDir]);

    const openFilterMenu = (e) => {
        if (!hasActiveFilters) return;
        if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
        const rect = e.currentTarget.getBoundingClientRect();
        setFilterMenu({ isOpen: true, anchorRect: rect });
    };

    const closeFilterMenuWithDelay = () => {
        filterMenuTimerRef.current = setTimeout(() => {
            setFilterMenu(prev => ({ ...prev, isOpen: false }));
        }, 200);
    };

    const handleClearFilters = () => {
        setActiveExcelFilters({});
        setSortBy(null);
        setSortDir(null);
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getFilterBtnClass = () => {
        return "top-right-button-control-att";
    };

    useEffect(() => {
        if (!openDraftMenuId) return;

        const closeDraftMenu = (event) => {
            if (!event.target.closest(".draft-options-anchor")) {
                setOpenDraftMenuId(null);
            }
        };

        document.addEventListener("mousedown", closeDraftMenu);
        return () => document.removeEventListener("mousedown", closeDraftMenu);
    }, [openDraftMenuId]);

    return (
        <div className="gen-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Document Development</p>
                    </div>


                    <div className="button-container-create">
                        <button className="but-um" onClick={() => navigate(`/FrontendDMS/deletedDDSDrafts/${type}`)}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faTrash} className="button-logo-custom" />
                                <span className="button-text">Deleted Drafts</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={pageConfig.icon} alt={pageConfig.label} className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Saved Drafts"}</p>
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

            <div className="main-box-gen-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {query === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Saved Drafts"}</label>
                        <FontAwesomeIcon
                            icon={faFilter}
                            className={getFilterBtnClass()} // Calculated class (e.g., ibra4, ibra5, ibra6)
                            title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
                            style={{
                                cursor: hasActiveFilters ? "pointer" : "default",
                                color: hasActiveFilters ? "#002060" : "gray"
                            }}
                            onMouseEnter={(e) => {
                                if (hasActiveFilters) openFilterMenu(e);
                            }}
                            onMouseLeave={closeFilterMenuWithDelay}
                            onDoubleClick={handleClearFilters}
                        />
                    </div>
                    <div className="table-container-file-flameproof-all-assets">
                        {isLoadingDraft ? (
                            <div className="draft-loading" aria-live="polite">
                                <FontAwesomeIcon icon={faSpinner} className="spin" />
                                <span style={{ marginLeft: 10, fontWeight: "normal" }}>Loading draft…</span>
                            </div>
                        ) : (
                            <table className="gen-table">
                                <thead className="gen-head" style={{ fontSize: "14px" }}>
                                    <tr>
                                        <th className="gen-th ibraGenNr" style={{ width: "5%" }}>Nr</th>
                                        <th className="gen-th ibraGenFN" style={{ width: "25%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("name", e)}>
                                            Draft Title
                                            {(sortBy === "name" || activeExcelFilters["name"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                        </th>
                                        <th className="gen-th ibraGenDraftStatus" style={{ width: "15%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("status", e)}>
                                            Status
                                            {(sortBy === "status" || activeExcelFilters["status"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                        </th>
                                        <th className="gen-th ibraGenVer" style={{ width: "10%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("createdBy", e)}>
                                            Created By
                                            {(sortBy === "createdBy" || activeExcelFilters["createdBy"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                        </th>
                                        <th className="gen-th ibraGenStatus" style={{ width: "15%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("creationDate", e)}>
                                            Creation Date
                                            {(sortBy === "creationDate" || activeExcelFilters["creationDate"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                        </th>
                                        <th className="gen-th ibraGenPB" style={{ width: "10%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("lastModifiedBy", e)}>
                                            Last Modified By
                                            {(sortBy === "lastModifiedBy" || activeExcelFilters["lastModifiedBy"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                        </th>
                                        <th className="gen-th ibraGenPD" style={{ width: "15%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("lastModifiedDate", e)}>
                                            Last Modification Date
                                            {(sortBy === "lastModifiedDate" || activeExcelFilters["lastModifiedDate"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                        </th>
                                        <th className="gen-th ibraGenType" style={{ width: "5%" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!isLoading && drafts.length > 0 && filteredDrafts.length > 0 && (
                                        displayDrafts
                                            .map((item, index) => (
                                                <tr
                                                    key={item._id}
                                                    style={{ fontSize: "14px" }}
                                                    className="load-draft-td"
                                                >
                                                    <td style={{ fontFamily: "Arial", textAlign: "center" }}>
                                                        {index + 1}
                                                    </td>
                                                    <td
                                                        style={{ fontFamily: "Arial", cursor: "pointer" }}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setOpenDraftMenuId((current) => current === item._id ? null : item._id);
                                                        }}
                                                    >
                                                        <div className="draft-options-anchor">
                                                            <span>{item.formData.title}</span>
                                                            <DraftOptionsPopup
                                                                isOpen={openDraftMenuId === item._id}
                                                                draft={item}
                                                                openDraftRoute={pageConfig.rowClickRoute(item._id)}
                                                                versionHistoryRoute={pageConfig.versionHistoryRoute
                                                                    ? pageConfig.versionHistoryRoute(item._id)
                                                                    : null}
                                                                onClose={() => setOpenDraftMenuId(null)}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: "center", fontFamily: "Arial", ...getStatusStyle(getDraftStatus(item)) }}>
                                                        {getDraftStatus(item)}
                                                    </td>
                                                    <td className="cent-draft-class" style={{ fontFamily: "Arial" }}>
                                                        {item.creator?.username || "Unknown"}
                                                    </td>
                                                    <td style={{ textAlign: "center", fontFamily: "Arial" }}>
                                                        {formatDateTime(item.dateCreated)}
                                                    </td>

                                                    <td className="cent-draft-class" style={{ fontFamily: "Arial" }}>
                                                        {item.lockActive ? item.lockOwner?.username : (item.updater?.username || "-")}
                                                    </td>
                                                    <td style={{ color: item.lockActive ? "#7EAC89" : "black", fontWeight: item.lockActive ? "bold" : "normal", textAlign: "center", fontFamily: "Arial" }}>
                                                        {item.lockActive ? "Active" : item.dateUpdated ? formatDateTime(item.dateUpdated) : "Not Updated Yet"}
                                                    </td>
                                                    <td className="load-draft-delete" >
                                                        <div className="load-draft-actions">
                                                            {pageConfig.renameRoute && String(item?.creator?._id) === String(userID) && (
                                                                <button
                                                                    className={"action-button-load-draft delete-button-load-draft"}
                                                                    style={{ width: "100%" }}
                                                                    onClick={(e) => { e.stopPropagation(); openRename(item) }}
                                                                >
                                                                    <FontAwesomeIcon icon={faEdit} title="Rename Document" />
                                                                </button>
                                                            )}
                                                            <button
                                                                className={"action-button-load-draft delete-button-load-draft"}
                                                                style={{ width: "100%" }}
                                                                onClick={(e) => { e.stopPropagation(); confirmDelete(item._id, item.formData.title, item?.creator?._id) }}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} title="Remove Draft" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    )}

                                    {isLoading && (
                                        <tr>
                                            <td colSpan="8" className="cent">
                                                Loading drafts…
                                            </td>
                                        </tr>
                                    )}

                                    {!isLoading && drafts.length === 0 && showNoDrafts && (
                                        <tr>
                                            <td colSpan="8" className="cent">
                                                No Drafts Available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            {deletePopup && (<DeleteDraftPopup closeModal={closeDelete} deleteDraft={handleDelete} draftName={title} author={author} />)}

            {renamePopup.open && (
                <RenameDraftPopup
                    onClose={closeRename}
                    onRename={handleRename}
                    current={renamePopup.currentTitle}
                    draftId={renamePopup.draftId}
                    siblingDraftsRoute={pageConfig.loadRoute}
                />
            )}

            {excelFilter.open && (
                <div className="excel-filter-popup" ref={excelPopupRef} style={{ position: "fixed", top: excelFilter.pos.top, left: excelFilter.pos.left, width: excelFilter.pos.width, zIndex: 9999 }} onWheel={handleInnerScrollWheel}>
                    <div className="excel-filter-sortbar">
                        <button type="button" className={`excel-sort-btn ${sortBy === excelFilter.colId && sortDir === "asc" ? "active" : ""}`} onClick={() => toggleExcelSort(excelFilter.colId, "asc")}>Sort Ascending</button>
                        <button type="button" className={`excel-sort-btn ${sortBy === excelFilter.colId && sortDir === "desc" ? "active" : ""}`} onClick={() => toggleExcelSort(excelFilter.colId, "desc")}>Sort Descending</button>
                    </div>
                    <input type="text" className="excel-filter-search" placeholder="Search" value={excelSearch} onChange={(e) => setExcelSearch(e.target.value)} />
                    {(() => {
                        const colId = excelFilter.colId;
                        const allValues = Array.from(new Set(drafts.map(d => getRawValue(d, colId)))).sort();
                        const visibleValues = allValues.filter(v => String(v).toLowerCase().includes(excelSearch.toLowerCase()));

                        const allSelected =
                            allValues.length > 0 && allValues.every(v => excelSelected.has(v));

                        const toggleAll = (checked) => {
                            setExcelSelected(() => {
                                if (checked) return new Set(allValues); // select everything
                                return new Set();                      // clear everything
                            });
                        };

                        const toggleValue = (v) => setExcelSelected(prev => { const next = new Set(prev); if (next.has(v)) next.delete(v); else next.add(v); return next; });
                        const toggleAllVisible = (checked) => setExcelSelected(prev => { const next = new Set(prev); visibleValues.forEach(v => { if (checked) next.add(v); else next.delete(v); }); return next; });

                        const onOk = () => {
                            const isAllSelected = allValues.length > 0 && allValues.every(v => excelSelected.has(v));
                            setActiveExcelFilters(prev => { const next = { ...prev }; if (isAllSelected) delete next[colId]; else next[colId] = excelSelected; return next; });
                            setExcelFilter(prev => ({ ...prev, open: false }));
                        };

                        return (
                            <>
                                <div className="excel-filter-list">
                                    <label className="excel-filter-item"><span className="excel-filter-checkbox"><input type="checkbox" className="checkbox-excel-attend" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} /></span><span className="excel-filter-text">(Select All)</span></label>
                                    {visibleValues.map(v => (
                                        <label className="excel-filter-item" key={String(v)}><span className="excel-filter-checkbox"><input type="checkbox" className="checkbox-excel-attend" checked={excelSelected.has(v)} onChange={() => toggleValue(v)} /></span><span className="excel-filter-text">{v}</span></label>
                                    ))}
                                </div>
                                <div className="excel-filter-actions">
                                    <button type="button" className="excel-filter-btn" onClick={onOk}>Apply</button>
                                    <button type="button" className="excel-filter-btn-cnc" onClick={() => setExcelFilter(prev => ({ ...prev, open: false }))}>Cancel</button>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
            <ToastContainer />
        </div>
    );
};

export default DraftsPage;