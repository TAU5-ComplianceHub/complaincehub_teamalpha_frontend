import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTrash, faSearch, faX, faFilter, faArrowLeft, faCaretRight, faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import TopBar from "../Notifications/TopBar";
import { toast, ToastContainer } from "react-toastify";
import { getCurrentUser, canIn, isAdmin } from "../../utils/auth";

// Same shell as ApprovalsRiskPage (sidebar, search, type-based routing via
// RISK_TYPE_CONFIG, excel filtering) but the table is built off the same
// "column config map" pattern RiskDocumentsIBRA/GeneratedFileInfo use
// (allColumns: id/title/td) instead of the switch-based getRawValue
// approach, so the columns line up exactly with those pages.
// The "Action" column is defined but hidden for now — drop "action" from
// HIDDEN_COLUMNS to bring it back later.
const HIDDEN_COLUMNS = ["action"];

// Risk assessments under revision — one entry per risk type, mirroring
// ApprovalsRiskPage's RISK_TYPE_CONFIG but pointed at the underRevisionDrafts
// endpoints on the fileGenDocs router instead of the review/approval ones.
const RISK_TYPE_CONFIG = {
    ibra: {
        icon: `${process.env.PUBLIC_URL}/ibra2.svg`,
        label: "Under Revision",
        loadRoute: (userID) => `${process.env.REACT_APP_URL}/api/fileGenDocs/ibra/underRevisionDrafts/${userID}`,
        downloadRoute: (fileId) => `${process.env.REACT_APP_URL}/api/file/generatedIBRA/download/${fileId}`,
        rowClickRoute: (draftId) => `/FrontendDMS/reviewIBRA/${draftId}/IBRA`,
    },
    jra: {
        icon: `${process.env.PUBLIC_URL}/jra2.svg`,
        label: "Under Revision",
        loadRoute: (userID) => `${process.env.REACT_APP_URL}/api/fileGenDocs/jra/underRevisionDrafts/${userID}`,
        downloadRoute: (fileId) => `${process.env.REACT_APP_URL}/api/file/generatedJRA/download/${fileId}`,
        rowClickRoute: (draftId) => `/FrontendDMS/reviewJRA/${draftId}/JRA`,
    },
    blra: {
        icon: `${process.env.PUBLIC_URL}/blra2.svg`,
        label: "Under Revision",
        loadRoute: (userID) => `${process.env.REACT_APP_URL}/api/fileGenDocs/blra/underRevisionDrafts/${userID}`,
        downloadRoute: (fileId) => `${process.env.REACT_APP_URL}/api/file/generatedBLRA/download/${fileId}`,
        rowClickRoute: (draftId) => `/FrontendDMS/reviewBLRA/${draftId}/BLRA`,
    },
};

const RiskRevisionPage = () => {
    const [drafts, setDrafts] = useState([]);
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showNoDrafts, setShowNoDrafts] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [userID, setUserID] = useState('');
    const navigate = useNavigate();
    const { type } = useParams();

    const access = getCurrentUser();
    const isSystemAdmin = isAdmin(access) || canIn(access, "RMS", ["systemAdmin"]);

    // --- Unified Sort (same shape as GeneratedFileInfo / RiskDocumentsIBRA) ---
    const DEFAULT_SORT = { colId: "nr", direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

    // --- Excel Filter States ---
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
        return RISK_TYPE_CONFIG[type] || RISK_TYPE_CONFIG.ibra;
    }, [type]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const getStatusClass = (s) => {
        switch (s?.toLowerCase()) {
            case 'published': return 'status-approved';
            case 'in review': return 'status-pending';
            default: return 'status-default';
        }
    };

    const removeFileExtension = (n) => (n || "").replace(/\.[^/.]+$/, "");

    const downloadFile = async (fileId, fileName) => {
        try {
            const response = await fetch(pageConfig.downloadRoute(fileId), {
                method: 'GET',
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!response.ok) throw new Error('Failed to download file');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'doc.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Failed to download file:", error);
            toast.error("Failed to download file");
        }
    };

    // --- Column config map (mirrors RiskDocumentsIBRA's / GeneratedFileInfo's allColumns) ---
    // Every column knows its own title, header/cell classes, and how to pull
    // its value off a row, so both the header labels and the cell content
    // come from this single source of truth.
    const allColumns = [
        { id: "nr", title: "Nr", thClass: "gen-th ibraGenNr", tdClass: "cent-values-gen gen-point", td: (f, i) => i + 1 },
        { id: "name", title: "Document Name", thClass: "gen-th ibraGenFN", tdClass: "gen-point", td: (f) => (f.formData?.title) },
        { id: "version", title: "Version", thClass: "gen-th ibraGenVer", tdClass: "cent-values-gen gen-point", td: (f) => f.formData?.version },
        { id: "status", title: "Document Status", thClass: "gen-th ibraGenStatus", tdClass: "cent-values-gen gen-point", td: (f) => f.documentStatus || "N/A" },
        { id: "firstPublishedBy", title: "First Published By", thClass: "gen-th ibraGenPB", tdClass: "cent-values-gen gen-point", td: (f) => f.publisher?.username || "N/A" },
        { id: "firstPublishedDate", title: "First Published Date", thClass: "gen-th ibraGenPD", tdClass: "cent-values-gen gen-point", td: (f) => formatDate(f.datePublished) },
        { id: "lastReviewedBy", title: "Last Reviewed By", thClass: "gen-th ibraGenRB", tdClass: "cent-values-gen gen-point", td: (f) => f.reviewer?.username || "N/A" },
        { id: "lastReviewDate", title: "Last Review Date", thClass: "gen-th ibraGenRD", tdClass: "cent-values-gen gen-point", td: (f) => f.dateReviewed ? formatDate(f.dateReviewed) : "N/A" },
        {
            id: "action",
            title: "Action",
            thClass: "gen-th ibraGenType",
            tdClass: "cent-values-gen gen-point",
            td: (f) => (
                <div className="action-buttons-fi">
                    <button className="download-button-fi col-but-res" onClick={(e) => { e.stopPropagation(); downloadFile(f._id, f.fileName); }}>
                        <FontAwesomeIcon icon={faDownload} title="Download" />
                    </button>
                    <button className="delete-button-fi col-but" onClick={(e) => e.stopPropagation()}>
                        <FontAwesomeIcon icon={faTrash} title="Delete" />
                    </button>
                </div>
            ),
        },
    ];

    // Action column is hidden for now — everything else from the config map
    // above is shown as-is.
    const visibleColumns = allColumns.filter(c => !HIDDEN_COLUMNS.includes(c.id));

    // Same per-cell value resolution used for both search-column filtering
    // and the excel-style filter popup, keyed off the same column ids.
    const getFilterValuesForCell = (row, colId, index) => {
        if (colId === "nr") return [String(index + 1)];
        if (colId === "name") return [(row.formData?.title)];
        if (colId === "version") return [String(row.formData?.version)];
        if (colId === "status") return [row.documentStatus || "N/A"];
        if (colId === "firstPublishedBy") return [row.publisher?.username || "N/A"];
        if (colId === "firstPublishedDate") return [formatDate(row.datePublished)];
        if (colId === "lastReviewedBy") return [row.reviewer?.username || "N/A"];
        if (colId === "lastReviewDate") return [row.dateReviewed ? formatDate(row.dateReviewed) : "N/A"];
        return [row[colId] ? String(row[colId]).trim() : "N/A"];
    };

    const toggleSort = (colId, direction) =>
        setSortConfig(p => (p?.colId === colId && p?.direction === direction) ? DEFAULT_SORT : { colId, direction });

    const processedDrafts = useMemo(() => {
        let current = [...drafts];

        const q = query.trim().toLowerCase();
        if (q) {
            current = current.filter(d => (d.formData?.title || '').toLowerCase().includes(q));
        }

        current = current.filter((row, index) => {
            for (const [colId, selected] of Object.entries(activeExcelFilters)) {
                if (!Array.isArray(selected)) continue;
                if (selected.length === 0) return false;
                if (!getFilterValuesForCell(row, colId, index).some(v => selected.includes(v))) return false;
            }
            return true;
        });

        const { colId, direction } = sortConfig;
        const dir = direction === "desc" ? -1 : 1;
        if (colId !== "nr") {
            const normalize = (v) => { const s = v == null ? "" : String(v).trim(); return s === "" ? "(Blanks)" : s; };
            current.sort((a, b) => {
                let valA, valB;
                switch (colId) {
                    case "name": valA = a.formData?.title; valB = b.formData?.title; break;
                    case "version": valA = a.formData?.version; valB = b.formData?.version; break;
                    case "status": valA = a.documentStatus; valB = b.documentStatus; break;
                    case "firstPublishedBy": valA = a.publisher?.username; valB = b.publisher?.username; break;
                    case "firstPublishedDate": valA = a.datePublished; valB = b.datePublished; break;
                    case "lastReviewedBy": valA = a.reviewer?.username; valB = b.reviewer?.username; break;
                    case "lastReviewDate": valA = a.dateReviewed; valB = b.dateReviewed; break;
                    default: valA = a[colId]; valB = b[colId];
                }
                if (["firstPublishedDate", "lastReviewDate"].includes(colId)) {
                    return (new Date(valA) - new Date(valB)) * dir;
                }
                if (colId === "version") return (Number(valA) - Number(valB)) * dir;
                return normalize(valA).localeCompare(normalize(valB), undefined, { numeric: true, sensitivity: 'base' }) * dir;
            });
        }
        return current;
    }, [drafts, query, activeExcelFilters, sortConfig]);

    const fetchUnderRevisionDocuments = async () => {
        setIsLoading(true);
        setShowNoDrafts(false);
        const token = localStorage.getItem("token");
        const baseRoute = pageConfig.loadRoute(userID);
        const route = isSystemAdmin
            ? `${baseRoute}?isAdmin=true`
            : baseRoute;
        try {
            const response = await fetch(route, {
                method: "GET",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch under revision documents");
            const data = await response.json();
            setDrafts(data.files || []);
        } catch (error) {
            console.error("Failed to fetch under revision documents:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!userID) return;
        fetchUnderRevisionDocuments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pageConfig, isSystemAdmin, userID]);

    useEffect(() => {
        if (!isLoading && drafts.length === 0) {
            const timer = setTimeout(() => setShowNoDrafts(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setShowNoDrafts(false);
        }
    }, [isLoading, drafts]);

    const clearSearch = () => setQuery("");

    function openExcelFilterPopup(colId, e) {
        if (!colId || colId === "action") return;
        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        const allValues = Array.from(new Set(drafts.flatMap((d, i) => getFilterValuesForCell(d, colId, i)))).sort();
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
        const hasSort = sortConfig.colId !== "nr" || sortConfig.direction !== "asc";
        return hasColumnFilters || hasSort;
    }, [activeExcelFilters, sortConfig]);

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
        setSortConfig(DEFAULT_SORT);
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getFilterBtnClass = () => "top-right-button-control-att";

    return (
        <div className="gen-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Risk Management</p>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={pageConfig.icon} alt={pageConfig.label} className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{pageConfig.label}</p>
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
                        <label className="risk-control-label">{pageConfig.label}</label>
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
                                    {visibleColumns.map(col => {
                                        const active = activeExcelFilters[col.id] || (sortConfig.colId === col.id && col.id !== "nr");
                                        return (
                                            <th
                                                key={col.id}
                                                className={col.thClass}
                                                style={{ cursor: col.id === "nr" ? "default" : "pointer" }}
                                                onClick={(e) => openExcelFilterPopup(col.id, e)}
                                            >
                                                {col.title}
                                                {active && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {!isLoading && drafts.length > 0 && processedDrafts.length > 0 && (
                                    processedDrafts.map((item, index) => (
                                        <tr
                                            key={item._id}
                                            style={{ fontSize: "14px" }}
                                            className="load-draft-td file-info-row-height gen-tr"
                                            onClick={() => navigate(pageConfig.rowClickRoute(item._id))}
                                        >
                                            {visibleColumns.map(col => (
                                                <td
                                                    key={`${item._id}-${col.id}`}
                                                    className={`${col.tdClass} ${col.id === "status" ? getStatusClass(item.documentStatus) : ""}`}
                                                    style={{ fontFamily: "Arial" }}
                                                >
                                                    {col.td(item, index)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}

                                {isLoading && (
                                    <tr>
                                        <td colSpan={visibleColumns.length} className="cent">
                                            Loading risk assessments…
                                        </td>
                                    </tr>
                                )}

                                {!isLoading && drafts.length === 0 && showNoDrafts && (
                                    <tr>
                                        <td colSpan={visibleColumns.length} className="cent">
                                            No Risk Assessments Currently Under Revision
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {excelFilter.open && (
                <div className="excel-filter-popup" ref={excelPopupRef} style={{ position: "fixed", top: excelFilter.pos.top, left: excelFilter.pos.left, width: excelFilter.pos.width, zIndex: 9999 }} onWheel={handleInnerScrollWheel}>
                    <div className="excel-filter-sortbar">
                        <button type="button" className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId && sortConfig.direction === "asc" ? "active" : ""}`} onClick={() => toggleSort(excelFilter.colId, "asc")}>Sort Ascending</button>
                        <button type="button" className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId && sortConfig.direction === "desc" ? "active" : ""}`} onClick={() => toggleSort(excelFilter.colId, "desc")}>Sort Descending</button>
                    </div>
                    <input type="text" className="excel-filter-search" placeholder="Search" value={excelSearch} onChange={(e) => setExcelSearch(e.target.value)} />
                    {(() => {
                        const colId = excelFilter.colId;
                        const allValues = Array.from(new Set(drafts.flatMap((d, i) => getFilterValuesForCell(d, colId, i)))).sort();
                        const visibleValues = allValues.filter(v => String(v).toLowerCase().includes(excelSearch.toLowerCase()));

                        const allSelected = allValues.length > 0 && allValues.every(v => excelSelected.has(v));

                        const toggleAll = (checked) => {
                            setExcelSelected(() => (checked ? new Set(allValues) : new Set()));
                        };

                        const toggleValue = (v) => setExcelSelected(prev => { const next = new Set(prev); if (next.has(v)) next.delete(v); else next.add(v); return next; });

                        const onOk = () => {
                            const isAllSelected = allValues.length > 0 && allValues.every(v => excelSelected.has(v));
                            setActiveExcelFilters(prev => { const next = { ...prev }; if (isAllSelected) delete next[colId]; else next[colId] = Array.from(excelSelected); return next; });
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

export default RiskRevisionPage;