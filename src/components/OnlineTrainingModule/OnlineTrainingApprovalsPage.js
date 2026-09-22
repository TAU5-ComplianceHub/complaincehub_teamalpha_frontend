import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrash, faX, faFilter, faArrowLeft, faCaretRight, faCaretLeft, faSearch, faFileArrowDown } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../Notifications/TopBar";
import { toast, ToastContainer } from "react-toastify";
import RemoveFromApprovalPopup from "../Popups/RemoveFromApprovalPopup";
import { getCurrentUser, can, canIn, isAdmin } from "../../utils/auth";

// Same shell as OnlineTrainingDrafts, but backed by the approval workflow.
// Development drafts and published-course revisions share this table and use
// different editor/removal routes. Online training is approval-only, so there
// is no reviewState/currentReviewer branch.
// NOTE: named ApprovalsPage for now to match the pattern used elsewhere;
// rename if this needs to be distinguished from the Induction version.
const LOAD_ROUTE = `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/reviewApprovalDrafts`;
const REMOVE_DRAFT_APPROVAL_ROUTE = `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/remove-from-approval-draft`;
const REMOVE_REVISION_APPROVAL_ROUTE = `${process.env.REACT_APP_URL}/api/onlineTrainingCourses/remove-from-approval-publishedDoc`;
const DRAFT_ROW_CLICK_ROUTE = (draftId) => `/FrontendDMS/onlineCreateCourse/${draftId}`;
// Mirrors the canonical published-approval link used by backend notifications.
const REVISION_ROW_CLICK_ROUTE = (documentId) => `/FrontendDMS/loginRedirect/TMS/approvePublished/${documentId}/null`;

const OnlineTrainingApprovalsPage = () => {
    const [drafts, setDrafts] = useState([]);
    const [query, setQuery] = useState('');
    const [removeConfirm, setRemoveConfirm] = useState({
        open: false,
        draftId: null,
        workflowSource: null,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showNoDrafts, setShowNoDrafts] = useState(false);
    const [removePopup, setRemovePopup] = useState(false);
    const [title, setTitle] = useState("");
    const [sortBy, setSortBy] = useState(null);
    const [sortDir, setSortDir] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [userID, setUserID] = useState('');
    const [removeLoading, setRemoveLoading] = useState(false);
    const navigate = useNavigate();

    const access = getCurrentUser();
    const isSystemAdmin = isAdmin(access) || canIn(access, "TMS", ["systemAdmin"]);

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

    const getRowClickRoute = (item) => item.workflowSource === "revision"
        ? REVISION_ROW_CLICK_ROUTE(item._id)
        : DRAFT_ROW_CLICK_ROUTE(item._id);

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

    // Same status -> cell class mapping used elsewhere so "In Approval" gets
    // the same green highlight as a published/approved document.
    const getStatusClass = (status) => {
        if (!status) return 'status-default';
        switch (status.toLowerCase()) {
            case 'in approval': return 'status-approved';
            default: return 'status-default';
        }
    };

    const getRawValue = (item, colId) => {
        switch (colId) {
            case "name": return item.formData?.courseTitle || "";
            case "createdBy": return item.firstPublishedBy || "Unknown";
            case "status": return item.documentStatus || "N/A";
            case "currentApprover": return item.currentApproverName || "N/A";
            case "lastModifiedDate": return item.dateUpdated ? formatDateTime(item.dateUpdated) : "Not Updated Yet";
            default: return "";
        }
    };

    const getRawDate = (item, colId) => {
        switch (colId) {
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
            const matchesQuery = !q || (d?.formData?.courseTitle || '').toLowerCase().includes(q);

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
            if (!sortBy || !sortDir) {
                const dateA = a.dateUpdated ? new Date(a.dateUpdated).getTime() : 0;
                const dateB = b.dateUpdated ? new Date(b.dateUpdated).getTime() : 0;
                return dateB - dateA;
            }

            if (sortBy === 'lastModifiedDate') {
                const dateA = getRawDate(a, sortBy);
                const dateB = getRawDate(b, sortBy);
                return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
            }

            const valA = getRawValue(a, sortBy);
            const valB = getRawValue(b, sortBy);
            const dir = sortDir === 'asc' ? 1 : -1;
            return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * dir;
        });
    }, [filteredDrafts, sortBy, sortDir]);

    const closeRemove = () => {
        setRemovePopup(false);
        setRemoveConfirm({ open: false, draftId: null, workflowSource: null });
    };

    const fetchReviewApprovalDrafts = async () => {
        setIsLoading(true);
        setShowNoDrafts(false);
        const token = localStorage.getItem("token");
        const route = isSystemAdmin ? `${LOAD_ROUTE}?isAdmin=true` : LOAD_ROUTE;
        try {
            const response = await fetch(route, {
                method: "GET",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch review & approval drafts");
            const data = await response.json();
            setDrafts(data);
        } catch (error) {
            console.error("Failed to fetch review & approval drafts:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviewApprovalDrafts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSystemAdmin]);

    useEffect(() => {
        if (!isLoading && drafts.length === 0) {
            const timer = setTimeout(() => setShowNoDrafts(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowNoDrafts(false);
        }
    }, [isLoading, drafts]);

    const confirmRemove = (item) => {
        setRemoveConfirm({
            open: true,
            draftId: item._id,
            workflowSource: item.workflowSource || "draft",
        });
        setTitle(item.formData?.courseTitle || "Online training course");
        setRemovePopup(true);
    };

    const handleRemoveApproval = async () => {
        const { draftId, workflowSource } = removeConfirm;
        if (!draftId) return;

        const route = workflowSource === "revision"
            ? REMOVE_REVISION_APPROVAL_ROUTE
            : REMOVE_DRAFT_APPROVAL_ROUTE;

        try {
            setRemoveLoading(true);
            const response = await fetch(route, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ draftID: draftId }),
            });

            if (!response.ok) {
                const errText = await response.text().catch(() => "");
                throw new Error(errText || "Failed to remove the draft from the approval process");
            }

            // Drafts return to Saved Drafts; revisions return to Under Revision.
            setDrafts(prev => prev.filter((item) => !(
                item._id === draftId &&
                (item.workflowSource || "draft") === (workflowSource || "draft")
            )));

            toast.success("Draft removed from the approval process");

            if (drafts.length === 1) setShowNoDrafts(true);
        } catch (error) {
            console.error("Failed to remove draft from approval process:", error);
            toast.error(error.message || "Failed to remove the draft from the approval process");
        } finally {
            setRemoveLoading(false);
        }

        setRemoveConfirm({ open: false, draftId: null, workflowSource: null });
        closeRemove();
    };

    const clearSearch = () => {
        setQuery("");
    };

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

    return (
        <div className="gen-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Training Management</p>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/tmsSavedDrafts2.svg`} alt="Review & Approval Online Training" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">In Approval Courses</p>
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
                        <label className="risk-control-label">In Approval Courses</label>
                        <FontAwesomeIcon
                            icon={faFilter}
                            className={getFilterBtnClass()}
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
                        <table className="gen-table">
                            <thead className="gen-head" style={{ fontSize: "14px" }}>
                                <tr>
                                    <th className="gen-th ibraGenNr" style={{ width: "5%" }}>Nr</th>
                                    <th className="gen-th ibraGenFN" style={{ width: "30%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("name", e)}>
                                        Draft Name
                                        {(sortBy === "name" || activeExcelFilters["name"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                    </th>
                                    <th className="gen-th ibraGenStatus" style={{ width: "13%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("status", e)}>
                                        Status
                                        {(sortBy === "status" || activeExcelFilters["status"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                    </th>
                                    <th className="gen-th ibraGenCRA" style={{ width: "20%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("currentApprover", e)}>
                                        Current Approver
                                        {(sortBy === "currentApprover" || activeExcelFilters["currentApprover"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                    </th>
                                    <th className="gen-th ibraGenVer" style={{ width: "17%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("createdBy", e)}>
                                        Owner
                                        {(sortBy === "createdBy" || activeExcelFilters["createdBy"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                    </th>
                                    <th className="gen-th ibraGenPD" style={{ width: "15%", cursor: "pointer" }} onClick={(e) => openExcelFilterPopup("lastModifiedDate", e)}>
                                        Last Updated
                                        {(sortBy === "lastModifiedDate" || activeExcelFilters["lastModifiedDate"]) && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" />}
                                    </th>
                                    <th className="gen-th ibraGenType" style={{ width: "5%" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!isLoading && drafts.length > 0 && filteredDrafts.length > 0 && (
                                    displayDrafts.map((item, index) => {
                                        const workflowOwnerId = item.workflowOwnerId
                                            || item.publisher?._id
                                            || item.publisher
                                            || item.creator?._id
                                            || item.creator;
                                        const isWorkflowOwner = workflowOwnerId
                                            && String(workflowOwnerId) === String(userID);
                                        const statusClass = getStatusClass(item.documentStatus);
                                        return (
                                            <tr
                                                key={`${item.workflowSource || "draft"}-${item._id}`}
                                                style={{ fontSize: "14px" }}
                                                className="load-draft-td"
                                                onClick={() => navigate(getRowClickRoute(item))}
                                            >
                                                <td style={{ fontFamily: "Arial", textAlign: "center" }}>
                                                    {index + 1}
                                                </td>
                                                <td style={{ fontFamily: "Arial" }}>{item.formData?.courseTitle}</td>
                                                <td className={`cent-draft-class ${statusClass}`} style={{ fontFamily: "Arial", fontWeight: "bold" }}>
                                                    {item.documentStatus || "N/A"}
                                                </td>
                                                <td className="cent-draft-class" style={{ fontFamily: "Arial" }}>
                                                    {item.currentApproverName || "N/A"}
                                                </td>
                                                <td className="cent-draft-class" style={{ fontFamily: "Arial" }}>
                                                    {item.firstPublishedBy || "Unknown"}
                                                </td>
                                                <td style={{ textAlign: "center", fontFamily: "Arial" }}>
                                                    {item.dateUpdated ? formatDateTime(item.dateUpdated) : "Not Updated Yet"}
                                                </td>
                                                <td className="load-draft-delete">
                                                    <button
                                                        className={"action-button-load-draft delete-button-load-draft"}
                                                        style={{ width: "100%" }}
                                                        disabled={!isWorkflowOwner}
                                                        title={isWorkflowOwner ? "Withdraw from approval process" : "Only the publisher can remove this document from the approval process"}
                                                        onClick={(e) => { e.stopPropagation(); confirmRemove(item); }}
                                                    >
                                                        <FontAwesomeIcon icon={faFileArrowDown} title="Withdraw from approval process" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}

                                {isLoading && (
                                    <tr>
                                        <td colSpan="7" className="cent">
                                            Loading drafts…
                                        </td>
                                    </tr>
                                )}

                                {!isLoading && drafts.length === 0 && showNoDrafts && (
                                    <tr>
                                        <td colSpan="7" className="cent">
                                            No Drafts Currently In Approval
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {removePopup && (
                <RemoveFromApprovalPopup
                    closeModal={closeRemove}
                    removeApproval={handleRemoveApproval}
                    docType={"onlineTraining"}
                    title={title}
                    loading={removeLoading}
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
                                if (checked) return new Set(allValues);
                                return new Set();
                            });
                        };

                        const toggleValue = (v) => setExcelSelected(prev => { const next = new Set(prev); if (next.has(v)) next.delete(v); else next.add(v); return next; });

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

export default OnlineTrainingApprovalsPage;
