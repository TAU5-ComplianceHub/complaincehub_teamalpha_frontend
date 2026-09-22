import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faDownload, faFolderOpen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faColumns, faFilter } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import PopupMenuPubFiles from "../../PublishedDocuments/PopupMenuPubFiles";
import TopBar from "../../Notifications/TopBar";
import DeletePopup from "../../FileInfo/DeletePopup";
import PopupMenuPubInduction from "./PopupMenuPubInduction";
import PublishedInductionPreviewPage from "./PublishedInductionPreviewPage";
import { toast, ToastContainer } from "react-toastify";
import { getCurrentUser, canIn, isAdmin } from "../../../utils/auth";

const GeneratedInductionInfoRevision = () => {
    const [files, setFiles] = useState([]); // State to hold the file data
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fileToDelete, setFileToDelete] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState();
    const [userID, setUserID] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const [previewID, setPreviewID] = useState(false);

    // --- Unified Sort Configuration ---
    const DEFAULT_SORT = { colId: "nr", direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

    // --- Excel Filter States ---
    const [activeExcelFilters, setActiveExcelFilters] = useState({});
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const excelPopupRef = useRef(null);

    // ----- horizontal drag-to-scroll logic -----
    const scrollerRef = useRef(null);
    const dragRef = useRef({
        active: false,
        startX: 0,
        startScrollLeft: 0,
        hasDragged: false
    });
    const [isDraggingX, setIsDraggingX] = useState(false);
    const DRAG_THRESHOLD = 5;

    const isInteractive = (el) =>
        !!el.closest('button, a, input, textarea, select, [role="button"], .no-drag');

    const onPointerDownX = (e) => {
        const el = scrollerRef.current;
        if (!el) return;
        if (isInteractive(e.target)) return;
        dragRef.current.active = true;
        dragRef.current.hasDragged = false;
        dragRef.current.startX = e.clientX;
        dragRef.current.startScrollLeft = el.scrollLeft;
    };

    const onPointerMoveX = (e) => {
        const el = scrollerRef.current;
        if (!el || !dragRef.current.active) return;
        const dx = e.clientX - dragRef.current.startX;
        if (!dragRef.current.hasDragged) {
            if (Math.abs(dx) >= DRAG_THRESHOLD) {
                dragRef.current.hasDragged = true;
                setIsDraggingX(true);
                try { el.setPointerCapture?.(e.pointerId); } catch { }
            } else {
                return;
            }
        }
        el.scrollLeft = dragRef.current.startScrollLeft - dx;
        e.preventDefault();
    };

    const endDragX = (e) => {
        const el = scrollerRef.current;
        if (dragRef.current.active && dragRef.current.hasDragged && e?.pointerId != null) {
            try { el?.releasePointerCapture?.(e.pointerId); } catch { }
        }
        dragRef.current.active = false;
        dragRef.current.hasDragged = false;
        setIsDraggingX(false);
    };
    // ------------------------------------------------------------------------------

    const openPreview = (id) => {
        setPreviewID(id);
        setIsPreview(true);
    };

    const closePreview = () => {
        setPreviewID("");
        setIsPreview(false);
    };

    const fileDelete = (id, fileName) => {
        setFileToDelete(id);
        setIsModalOpen(true);
        setSelectedFileName(fileName);
    };

    const closeModal = () => {
        setIsModalOpen(null);
    };

    const deleteFile = async () => {
        if (!fileToDelete) return;
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/standard/trashFile/${fileToDelete}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to delete the file');

            setFileToDelete("");
            setSelectedFileName("");
            setIsModalOpen(false);
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getStatusClass = (status) => {
        if (!status) return 'status-default';
        switch (status.toLowerCase()) {
            case 'published': return 'status-approved';
            case 'in review': return 'status-pending';
            case 'in approval': return 'status-rejected';
            default: return 'status-default';
        }
    };

    const navigate = useNavigate();

    const access = getCurrentUser();
    const isSystemAdmin = isAdmin(access) || canIn(access, "TMS", ["systemAdmin"]);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    useEffect(() => {
        if (token) {
            fetchFiles();
        }
    }, [token, isSystemAdmin]);

    const fetchFiles = async () => {
        const route = isSystemAdmin
            ? `/api/visitorDrafts/publishedDocs?isAdmin=true`
            : `/api/visitorDrafts/publishedDocs`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();

            // Active approvals live on the Approvals page, not Under Revision.
            const revisionDocs = (data || []).filter((doc) => {
                const status = doc.documentStatus;
                return doc.approvalState !== true
                    && status
                    && status.toLowerCase() !== "published";
            });

            setFiles(revisionDocs);
        } catch (error) {
            setError(error.message);
        }
    };

    const undoRetakeChoice = async (id) => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/undo-retake/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to delete the file');
            toast.success("Induction Retake Required Reverted")
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    // --- Excel Filtering Logic Helpers ---

    const getFilterValuesForCell = (row, colId, index) => {
        // 1. Static/Index Column
        if (colId === "nr") return [String(index + 1)];

        // 2. Simple Strings & Dates
        if (colId === "name") return [removeFileExtension(row.formData.courseTitle)];
        if (colId === "version") return [String(row.version)];
        if (colId === "firstPublishedBy") return [row.publisher?.username || "N/A"];
        if (colId === "firstPublishedDate") return [formatDate(row.datePublished)];
        if (colId === "lastReviewedBy") return [row.reviewer?.username || "N/A"];
        if (colId === "lastReviewDate") return [formatDate(row.dateReviewed)];

        // 3. Status (Conditional)
        if (colId === "status") {
            const val = row.approvalState ? "In Approval" : row.documentStatus;
            return [val];
        }

        // 4. Arrays (Approvers)
        if (colId === "approvers") {
            const list = row.approvers || [];
            if (list.length === 0) return ["N/A"];
            // Return array of names for checkbox list
            return list.map(appr => appr.user?.username || "Unknown");
        }

        // Default fallback
        const val = row[colId];
        return [val ? String(val).trim() : "N/A"];
    };

    const openExcelFilterPopup = (colId, e) => {
        if (colId === "action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        // Gather unique values from ALL files
        const values = Array.from(
            new Set(
                (files || []).flatMap((r, i) => getFilterValuesForCell(r, colId, i))
            )
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

        const existing = activeExcelFilters[colId];
        const initialSelected = new Set(existing && Array.isArray(existing) ? existing : values);

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
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return DEFAULT_SORT; // Reset to default "nr" sort
            }
            return { colId, direction };
        });
    };

    // --- Main Processing: Search -> Filter -> Sort ---

    const processedFiles = useMemo(() => {
        let current = [...files];

        // 1. Global Search (on course title)
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            current = current.filter(f =>
                f.formData.courseTitle.toLowerCase().includes(lowerQ)
            );
        }

        // 2. Excel Column Filters
        // We use original index for 'nr' filter value
        current = current.filter((row, originalIndex) => {
            for (const [colId, selectedValues] of Object.entries(activeExcelFilters)) {
                if (!selectedValues || !Array.isArray(selectedValues)) continue;

                const cellValues = getFilterValuesForCell(row, colId, originalIndex);
                // If any of the cell's values match one of the selected checkboxes, keep row
                const match = cellValues.some(v => selectedValues.includes(v));
                if (!match) return false;
            }
            return true;
        });

        // 3. Sorting
        const { colId, direction } = sortConfig;
        const dir = direction === "desc" ? -1 : 1;

        if (colId === "nr") {
            // Default load order (assumed files order)
        } else {
            const normalize = (v) => {
                const s = v == null ? "" : String(v).trim();
                return s === "" ? "(Blanks)" : s;
            };

            const tryDate = (v) => {
                if (!v) return null;
                const d = new Date(v);
                return isNaN(d.getTime()) ? null : d.getTime();
            }

            current.sort((a, b) => {
                let valA, valB;

                // Map colId to data value
                switch (colId) {
                    case "name":
                        valA = a.formData.courseTitle; valB = b.formData.courseTitle; break;
                    case "version":
                        valA = a.version; valB = b.version; break;
                    case "status":
                        valA = a.approvalState ? "In Approval" : a.documentStatus;
                        valB = b.approvalState ? "In Approval" : b.documentStatus;
                        break;
                    case "firstPublishedBy":
                        valA = a.publisher?.username; valB = b.publisher?.username; break;
                    case "firstPublishedDate":
                        valA = a.datePublished; valB = b.datePublished; break;
                    case "lastReviewedBy":
                        valA = a.reviewer?.username; valB = b.reviewer?.username; break;
                    case "lastReviewDate":
                        valA = a.dateReviewed; valB = b.dateReviewed; break;
                    case "approvers":
                        // Sort by first approver name for simplicity
                        valA = (a.approvers?.[0]?.user?.username) ?? "";
                        valB = (b.approvers?.[0]?.user?.username) ?? "";
                        break;
                    default:
                        valA = a[colId]; valB = b[colId];
                }

                // Handle Dates
                if (["firstPublishedDate", "lastReviewDate"].includes(colId)) {
                    const da = tryDate(valA);
                    const db = tryDate(valB);
                    if (da !== null && db !== null) return (da - db) * dir;
                }

                // Handle Numbers
                if (colId === "version") {
                    return (Number(valA) - Number(valB)) * dir;
                }

                // Handle Strings
                const normA = normalize(valA);
                const normB = normalize(valB);

                if (normA === "(Blanks)" && normB !== "(Blanks)") return 1;
                if (normA !== "(Blanks)" && normB === "(Blanks)") return -1;

                return normA.localeCompare(normB, undefined, { numeric: true, sensitivity: 'base' }) * dir;
            });
        }

        return current;

    }, [files, searchQuery, activeExcelFilters, sortConfig]);

    // -------- Column Definitions (Using processed data) --------
    const allColumns = [
        {
            id: "nr",
            title: "Nr",
            thClass: "gen-th ibraGenNr",
            tdClass: "cent-values-gen",
            td: (file, index) => index + 1 // Dynamic index after sort/filter
        },
        {
            id: "name",
            title: "Visitor Induction Name",
            thClass: "gen-th ibraGenFN",
            tdClass: "gen-point",
            onCellClick: (file) => {
                setHoveredFileId(hoveredFileId === file._id ? null : file._id);
            },
            td: (file) => (
                <div className="popup-anchor">
                    <span>
                        {removeFileExtension(file.formData.courseTitle)}
                    </span>

                    {(hoveredFileId === file._id) && (
                        <PopupMenuPubInduction
                            file={file}
                            typeDoc={"standard"}
                            risk={false}
                            isOpen={hoveredFileId === file._id}
                            setHoveredFileId={setHoveredFileId}
                            id={file._id}
                            openPreview={openPreview}
                            undoRetakeChoice={undoRetakeChoice}
                        />
                    )}
                </div>
            )
        },
        {
            id: "version",
            title: "Version",
            thClass: "gen-th ibraGenVer",
            tdClass: "cent-values-gen",
            td: (file) => file.version
        },
        {
            id: "status",
            title: "Induction Status",
            thClass: `gen-th ibraGenStatus`,
            tdClass: `cent-values-gen`,
            td: (file) => (
                file.approvalState ? "In Approval" : file.documentStatus
            )
        },
        {
            id: "firstPublishedBy",
            title: "First Published By",
            thClass: "gen-th ibraGenPB",
            tdClass: "cent-values-gen",
            td: (file) => file.publisher.username
        },
        {
            id: "firstPublishedDate",
            title: "First Published Date",
            thClass: "gen-th ibraGenPD",
            tdClass: "cent-values-gen",
            td: (file) => formatDate(file.datePublished)
        },
        {
            id: "lastReviewedBy",
            title: "Last Reviewed By",
            thClass: "gen-th ibraGenRB",
            tdClass: "cent-values-gen",
            td: (file) => file.reviewer?.username ? file.reviewer.username : "N/A"
        },
        {
            id: "lastReviewDate",
            title: "Last Review Date",
            thClass: "gen-th ibraGenRD",
            tdClass: "cent-values-gen",
            td: (file) => file.dateReviewed ? formatDate(file.dateReviewed) : "N/A"
        },
        {
            id: "approvers",
            title: "Induction Approvers",
            thClass: "gen-th ibraGenStatus",
            tdClass: "cent-values-gen",
            td: (file) => {
                const approvers = file.approvers || [];
                if (!approvers.length) {
                    return "N/A";
                }
                const inApproval = !!file.approvalState;
                return (
                    <ul className="approver-list">
                        {approvers.map((appr) => {
                            const name = appr.user?.username || "Unknown";
                            const isApproved = inApproval && appr.approved;
                            return (
                                <li
                                    key={appr._id || name}
                                    style={{ color: isApproved ? "#7EAC89" : "black" }}
                                >
                                    {name}
                                </li>
                            );
                        })}
                    </ul>
                );
            }
        },
        {
            id: "action",
            title: "Action",
            thClass: "gen-th ibraGenType",
            tdClass: "cent-values-gen",
            td: (file) => (
                <button
                    className={"delete-button-fi col-but"}
                    onClick={(e) => { e.stopPropagation(); fileDelete(file._id, file.formData.courseTitle); }}
                >
                    <FontAwesomeIcon
                        icon={faTrash}
                        title="Delete Document"
                    />
                </button>
            )
        }
    ];

    const MAIN_COLUMNS_COUNT = 9;
    const [showColumns, setShowColumns] = useState(() =>
        allColumns.map(c => c.id).filter(id => id !== "approvers")
    );
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const availableColumns = allColumns;

    const toggleColumn = (id) => {
        if (id === "nr" || id === "action") return;
        setShowColumns(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) {
            setShowColumns(availableColumns.map(c => c.id));
        } else {
            setShowColumns(["nr", "action"]);
        }
    };

    const areAllSelected = () => {
        const selectable = availableColumns.map(c => c.id);
        return selectable.every(id => showColumns.includes(id));
    };

    const visibleColumns = availableColumns.filter(c => showColumns.includes(c.id));
    const visibleCount = visibleColumns.length;
    const isWide = visibleCount > MAIN_COLUMNS_COUNT;

    // --- Cleanup Popup Listeners ---
    useEffect(() => {
        if (!excelFilter.open) return;

        const handleClickOutside = (e) => {
            if (e.target.closest('.excel-filter-popup')) return;
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        const handleScroll = (e) => {
            if (e.target.closest('.excel-filter-popup')) return;
            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [excelFilter.open]);

    // --- Popup Positioning ---
    useEffect(() => {
        if (!excelFilter.open) return;
        const el = excelPopupRef.current;
        if (!el) return;

        const popupRect = el.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const margin = 8;

        let newTop = excelFilter.pos.top;
        let newLeft = excelFilter.pos.left;

        if (popupRect.bottom > viewportH - margin) {
            const anchor = excelFilter.anchorRect;
            if (anchor) {
                const desiredTop = anchor.top - popupRect.height - 4;
                newTop = Math.max(margin, desiredTop);
            }
        }

        if (popupRect.right > viewportW - margin) {
            const overflow = popupRect.right - (viewportW - margin);
            newLeft = Math.max(margin, newLeft - overflow);
        }
        if (popupRect.left < margin) newLeft = margin;

        if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
            setExcelFilter(prev => ({
                ...prev,
                pos: { ...prev.pos, top: newTop, left: newLeft }
            }));
        }
    }, [excelFilter.open, excelFilter.pos, excelSearch]);

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(activeExcelFilters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortConfig.colId !== "nr" || sortConfig.direction !== "asc";

        console.log("Active Filters Check:", { activeExcelFilters, sortConfig, hasColumnFilters, hasSort });
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

    const cancelCloseFilterMenu = () => {
        if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
    };

    const handleClearFilters = () => {
        setActiveExcelFilters({});
        setSortConfig({ colId: "nr", direction: "asc" });
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getFilterBtnClass = () => {
        return "top-right-button-control-att-2";
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

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
                        <p className="logo-text-dm-fi">{"Under Revision Visitor Induction"}</p>
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
                            value={searchQuery}
                            autoComplete="off"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className={`info-box-fih`}>Number of Inductions: {processedFiles.length}</div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Under Revision Visitor Induction"}</label>

                        <FontAwesomeIcon
                            icon={faColumns}
                            title="Select Columns to Display"
                            className="top-right-button-control-att"
                            onClick={() => setShowColumnSelector(v => !v)}
                        />

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

                        {showColumnSelector && (
                            <div className="column-selector-popup" onMouseDown={(e) => e.stopPropagation()}>
                                <div className="column-selector-header">
                                    <h4>Select Columns</h4>
                                    <button className="close-popup-btn" onClick={() => setShowColumnSelector(false)}>×</button>
                                </div>
                                <div className="column-selector-content">
                                    <p className="column-selector-note">Select columns to display</p>
                                    <div className="select-all-container">
                                        <label className="select-all-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={areAllSelected()}
                                                onChange={(e) => toggleAllColumns(e.target.checked)}
                                            />
                                            <span className="select-all-text">Select All</span>
                                        </label>
                                    </div>
                                    <div className="column-checkbox-container">
                                        {availableColumns.map(col => (
                                            <div className="column-checkbox-item" key={col.id}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={showColumns.includes(col.id)}
                                                        disabled={col.id === "nr" || col.id === "action"}
                                                        onChange={() => toggleColumn(col.id)}
                                                    />
                                                    <span>{col.title}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="column-selector-footer">
                                        <p>{visibleCount} columns selected</p>
                                        <button className="apply-columns-btn" onClick={() => setShowColumnSelector(false)}>Apply</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="table-container-file-flameproof-all-assets">
                        <div
                            className={`limit-table-height-visitor-wrap ${isDraggingX ? 'dragging' : ''} ${isWide ? 'wide' : ''}`}
                            ref={scrollerRef}
                            onPointerDown={onPointerDownX}
                            onPointerMove={onPointerMoveX}
                            onPointerUp={endDragX}
                            onPointerLeave={endDragX}
                            onDragStart={(e) => e.preventDefault()}
                            style={{ maxHeight: "calc(100% - 0px)", height: "100%" }}
                        >
                            <table className={`limit-table-height-visitor ${isWide ? 'wide' : ''}`} style={{ height: "0" }}>
                                <thead className="gen-head">
                                    <tr>
                                        {visibleColumns.map(col => {
                                            const isAction = col.id === "action";
                                            const isActiveFilter = activeExcelFilters[col.id];
                                            const isActiveSort = sortConfig.colId === col.id && col.id !== "nr";

                                            return (
                                                <th
                                                    key={col.id}
                                                    className={col.thClass}
                                                    onClick={(e) => {
                                                        if (isAction) return;
                                                        openExcelFilterPopup(col.id, e);
                                                    }}
                                                    style={{ cursor: isAction ? "default" : "pointer", position: "relative" }}
                                                >
                                                    {col.title}
                                                    {/* Show icons */}
                                                    {(isActiveFilter || isActiveSort) && (
                                                        <FontAwesomeIcon
                                                            icon={faFilter}
                                                            className="th-filter-icon"
                                                            style={{ marginLeft: "8px", opacity: 0.8 }}
                                                        />
                                                    )}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedFiles.length === 0 ? (
                                        <tr><td colSpan={visibleColumns.length} className="cent-values-gen">No inductions found.</td></tr>
                                    ) : (
                                        processedFiles.map((file, index) => (
                                            <tr key={file._id} className={`file-info-row-height gen-tr`}>
                                                {visibleColumns.map(col => {
                                                    const isStatusCol = col.id === "status";
                                                    const statusValue = isStatusCol
                                                        ? (file.approvalState ? "In Approval" : file.documentStatus)
                                                        : null;
                                                    const statusClass = isStatusCol && statusValue
                                                        ? getStatusClass(statusValue)
                                                        : "";

                                                    return (
                                                        <td
                                                            key={`${file._id}-${col.id}`}
                                                            className={`${col.tdClass} ${statusClass}`}
                                                            onClick={
                                                                col.onCellClick
                                                                    ? () => col.onCellClick(file)
                                                                    : undefined
                                                            }
                                                        >
                                                            {col.td(file, index)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Excel Filter Popup */}
            {excelFilter.open && (
                <div
                    className="excel-filter-popup"
                    ref={excelPopupRef}
                    style={{
                        position: "fixed",
                        top: excelFilter.pos.top,
                        left: excelFilter.pos.left,
                        width: excelFilter.pos.width,
                        zIndex: 9999,
                    }}
                    onWheel={(e) => e.stopPropagation()}
                >
                    <div className="excel-filter-sortbar">
                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                sortConfig.direction === "asc" ? "active" : ""
                                }`}
                            onClick={() => toggleSort(excelFilter.colId, "asc")}
                        >
                            Sort Acsending
                        </button>

                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                sortConfig.direction === "desc" ? "active" : ""
                                }`}
                            onClick={() => toggleSort(excelFilter.colId, "desc")}
                        >
                            Sort Descending
                        </button>
                    </div>

                    <input
                        type="text"
                        className="excel-filter-search"
                        placeholder="Search"
                        value={excelSearch}
                        onChange={(e) => setExcelSearch(e.target.value)}
                    />

                    {(() => {
                        const colId = excelFilter.colId;
                        const allValues = Array.from(
                            new Set((files || []).flatMap((r, i) => getFilterValuesForCell(r, colId, i)))
                        ).sort((a, b) => String(a).localeCompare(String(b)));

                        const visibleValues = allValues.filter(v =>
                            String(v).toLowerCase().includes(excelSearch.toLowerCase())
                        );

                        const allSelected =
                            allValues.length > 0 && allValues.every(v => excelSelected.has(v));

                        const toggleAll = (checked) => {
                            setExcelSelected(() => {
                                if (checked) return new Set(allValues); // select everything
                                return new Set();                      // clear everything
                            });
                        };

                        const toggleValue = (v) => {
                            setExcelSelected(prev => {
                                const next = new Set(prev);
                                if (next.has(v)) next.delete(v);
                                else next.add(v);
                                return next;
                            });
                        };

                        const toggleAllVisible = (checked) => {
                            setExcelSelected(prev => {
                                const next = new Set(prev);
                                visibleValues.forEach(v => {
                                    if (checked) next.add(v);
                                    else next.delete(v);
                                });
                                return next;
                            });
                        };

                        const onOk = () => {
                            const selectedArr = Array.from(excelSelected);
                            const isAllSelected = allValues.length > 0 && allValues.every(v => excelSelected.has(v));
                            setActiveExcelFilters(prev => {
                                const next = { ...prev };
                                if (isAllSelected) delete next[colId];
                                else next[colId] = selectedArr;
                                return next;
                            });
                            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                        };

                        const onCancel = () => {
                            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                        };

                        return (
                            <>
                                <div className="excel-filter-list">
                                    <label className="excel-filter-item">
                                        <span className="excel-filter-checkbox">
                                            <input
                                                type="checkbox"
                                                className="checkbox-excel-attend"
                                                checked={allSelected}
                                                onChange={(e) => toggleAll(e.target.checked)}
                                            />
                                        </span>
                                        <span className="excel-filter-text">(Select All)</span>
                                    </label>

                                    {visibleValues.map(v => (
                                        <label className="excel-filter-item" key={String(v)}>
                                            <span className="excel-filter-checkbox">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox-excel-attend"
                                                    checked={excelSelected.has(v)}
                                                    onChange={() => toggleValue(v)}
                                                />
                                            </span>
                                            <span className="excel-filter-text">{v}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="excel-filter-actions">
                                    <button type="button" className="excel-filter-btn" onClick={onOk}>Apply</button>
                                    <button type="button" className="excel-filter-btn-cnc" onClick={onCancel}>Cancel</button>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            {isModalOpen && (<DeletePopup closeModal={closeModal} deleteFile={deleteFile} isTrashView={false} loading={loading} selectedFileName={selectedFileName} />)}
            {isPreview && (<PublishedInductionPreviewPage draftID={previewID} closeModal={closePreview} />)}
            <ToastContainer />
        </div>
    );
};

export default GeneratedInductionInfoRevision;
