import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faDownload, faFolderOpen, faTrash, faBan, faFileArrowDown } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faColumns, faFilter } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import TopBar from "../Notifications/TopBar";
import DeletePopup from "../FileInfo/DeletePopup";
import RemoveApprovalPopup from "./RemoveApprovalPopup";
import { ToastContainer } from "react-toastify";
import FTSSignedOffUploadPopup from "./FTSSignedOffUploadPopup";
import { getCurrentUser, can, canIn, isAdmin } from "../../utils/auth";

const FTSTemplateDocuments = () => {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [fileToDelete, setFileToDelete] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState();
    const [uploadID, setUploadID] = useState("");
    const [uploadProcedurePDF, setUploadProcedurePDF] = useState(false);

    const [fileToRemoveApproval, setFileToRemoveApproval] = useState("");
    const [isRemoveApprovalModalOpen, setIsRemoveApprovalModalOpen] = useState(false);
    const [selectedRemoveFileName, setSelectedRemoveFileName] = useState();
    const [removeApprovalLoading, setRemoveApprovalLoading] = useState(false);

    const openPDFUpload = (rawId) => {
        console.log("Raw ID received:", rawId);

        // Safely extract the string if it comes through as an object
        let stringId = rawId;
        if (typeof rawId === 'object' && rawId !== null) {
            // Checks for common MongoDB object formats or the file object itself
            stringId = rawId.$oid || rawId._id || rawId.id || String(rawId);
        }

        setUploadID(stringId);
        setUploadProcedurePDF(true);
    }

    const closePDFUpload = () => {
        setUploadID("");
        setUploadProcedurePDF(false);
    }

    const closePDFNavigate = () => {
        setUploadID("");
        setUploadProcedurePDF(false);
        navigate("/FrontendDMS/ftsSignedOffTemplates")
    }

    const navigate = useNavigate();

    const access = getCurrentUser();
    const isSystemAdmin = isAdmin(access) || canIn(access, "FTS", ["systemAdmin"]);

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

    // ----- Horizontal drag-to-scroll logic -----
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

    const fileDelete = (id, fileName) => {
        setFileToDelete(id);
        setIsModalOpen(true);
        setSelectedFileName(fileName);
    }

    const closeModal = () => {
        setIsModalOpen(null);
    }

    const deleteFile = async () => { //*NB
        if (!fileToDelete) return;
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsGeneratedDocs/template/trashFile/${fileToDelete}`, {
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

    const openRemoveApprovalModal = (id, fileName) => {
        setFileToRemoveApproval(id);
        setSelectedRemoveFileName(fileName);
        setIsRemoveApprovalModalOpen(true);
    };

    const closeRemoveApprovalModal = () => {
        setIsRemoveApprovalModalOpen(false);
        setFileToRemoveApproval("");
        setSelectedRemoveFileName("");
    };

    const removeApprovalProcess = async () => {
        if (!fileToRemoveApproval) return;
        try {
            setRemoveApprovalLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsApproval/remove-from-approval-process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ draftID: fileToRemoveApproval }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Failed to remove the template from the approval process');
            }

            closeRemoveApprovalModal();
            fetchFiles();
        } catch (error) {
            console.error('Error removing template from approval process:', error);
            alert(error.message || 'Error removing the template from the approval process. Please try again.');
        } finally {
            setRemoveApprovalLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            const decodedToken = jwtDecode(storedToken);
            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    const getStatusClass = (status) => {
        if (!status) return 'status-default';
        switch (status.toLowerCase()) {
            case 'published': return 'status-approved';
            case 'in review': return 'status-pending';
            case 'in approval': return 'status-approved';
            default: return 'status-default';
        }
    };

    useEffect(() => {
        if (token) {
            fetchFiles();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isSystemAdmin]);

    const fetchFiles = async () => {
        const route = isSystemAdmin
            ? `/api/ftsDrafts/templates/reviewApprovalTemplates?isAdmin=true`
            : `/api/ftsDrafts/templates/reviewApprovalTemplates`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();
            console.log(data)
            setFiles(Array.isArray(data) ? data : (data.files || []));
        } catch (error) {
            setError(error.message);
        }
    };

    const downloadFile = async (fileId, fileName) => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/generatedTemplates/download/${fileId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download the file');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'document.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error downloading the file. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Shows whichever role is currently pending action on the document
    const getCurrentReviewerOrApprover = (file) => {
        if (file.documentStatus === "In Review") return file.currentReviewerName || "N/A";
        if (file.documentStatus === "In Approval") return file.currentApproverName || "N/A";
        return file.currentReviewerName || file.currentApproverName || "N/A";
    };

    // --- Excel Filtering Logic Helpers ---

    const getFilterValuesForCell = (row, colId, index) => {
        // 1. Static/Index Column
        if (colId === "nr") return [String(index + 1)];

        // 2. Simple Strings & Dates
        if (colId === "name") return [(row.formData.title)];
        if (colId === "version") return [String(row.formData.version)];
        if (colId === "firstPublishedBy") return [row.creator ? String(row.creator) : "N/A"];
        if (colId === "currentReviewer") return [getCurrentReviewerOrApprover(row)];
        if (colId === "lastUpdated") return [formatDate(row.dateUpdated)];

        // 3. Status
        if (colId === "status") return [row.documentStatus || "N/A"];

        // Default
        const val = row[colId];
        return [val ? String(val).trim() : "N/A"];
    };

    const openExcelFilterPopup = (colId, e) => {
        if (colId === "action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

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
                return DEFAULT_SORT;
            }
            return { colId, direction };
        });
    };

    // --- Main Processing: Search -> Filter -> Sort ---

    const processedFiles = useMemo(() => {
        let current = [...files];

        // 1. Global Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            current = current.filter(f =>
                f.fileName.toLowerCase().includes(lowerQ)
            );
        }

        // 2. Excel Column Filters

        current = current.filter((r, i) => {
            for (const [c, s] of Object.entries(activeExcelFilters)) {
                if (!Array.isArray(s)) continue;

                // If user applied with nothing selected: show NO rows
                if (s.length === 0) return false;

                if (!getFilterValuesForCell(r, c, i).some(v => s.includes(v))) return false;
            }
            return true;
        });

        // 3. Sorting
        const { colId, direction } = sortConfig;
        const dir = direction === "desc" ? -1 : 1;

        if (colId === "nr") {
            // Default load order
        } else {
            const normalize = (v) => {
                const s = v == null ? "" : String(v).trim();
                return s === "" ? "(Blanks)" : s;
            };

            current.sort((a, b) => {
                let valA, valB;

                switch (colId) {
                    case "name":
                        valA = a.formData.title; valB = b.formData.title; break;
                    case "version":
                        valA = a.formData.version; valB = b.formData.version; break;
                    case "status":
                        valA = a.documentStatus; valB = b.documentStatus; break;
                    case "firstPublishedBy":
                        valA = a.creator ? String(a.creator) : ""; valB = b.creator ? String(b.creator) : ""; break;
                    case "currentReviewer":
                        valA = getCurrentReviewerOrApprover(a); valB = getCurrentReviewerOrApprover(b); break;
                    case "lastUpdated":
                        valA = a.dateUpdated; valB = b.dateUpdated; break;
                    default:
                        valA = a[colId]; valB = b[colId];
                }

                if (colId === "version") {
                    return (Number(valA) - Number(valB)) * dir;
                }

                if (colId === "lastUpdated") {
                    const da = valA ? new Date(valA).getTime() : null;
                    const db = valB ? new Date(valB).getTime() : null;
                    if (da !== null && db !== null && !isNaN(da) && !isNaN(db)) return (da - db) * dir;
                }

                const normA = normalize(valA);
                const normB = normalize(valB);

                if (normA === "(Blanks)" && normB !== "(Blanks)") return 1;
                if (normA !== "(Blanks)" && normB === "(Blanks)") return -1;

                return normA.localeCompare(normB, undefined, { numeric: true, sensitivity: 'base' }) * dir;
            });
        }

        return current;

    }, [files, searchQuery, activeExcelFilters, sortConfig]);

    // -------- Column Definitions --------
    const allColumns = [
        {
            id: "nr",
            title: "Nr",
            thClass: "gen-th ibraGenNr",
            tdClass: "cent-values-gen gen-point",
            td: (file, index) => index + 1
        },
        {
            id: "name",
            title: "Template Name",
            thClass: "gen-th ibraGenFN",
            tdClass: "gen-point",
            // Filename click disabled for now - no popup on click
            td: (file) => (
                <div className="popup-anchor">
                    <span>
                        {(file.formData.title)}
                    </span>
                </div>
            )
        },
        {
            id: "version",
            title: "Version",
            thClass: "gen-th ibraGenVer",
            tdClass: "cent-values-gen gen-point",
            td: (file) => file.formData.version
        },
        {
            id: "status",
            title: "Status",
            thClass: "gen-th ibraGenStatus",
            tdClass: "cent-values-gen gen-point",
            td: (file) => file.documentStatus || "N/A"
        },
        {
            id: "currentReviewer",
            title: "Current Reviewer / Approver",
            thClass: "gen-th ibraGenCRA",
            tdClass: "cent-values-gen gen-point",
            td: (file) => getCurrentReviewerOrApprover(file)
        },
        {
            id: "firstPublishedBy",
            title: "Owner",
            thClass: "gen-th ibraGenPB",
            tdClass: "cent-values-gen gen-point",
            td: (file) => file.creator ? file.firstPublishedBy : "N/A"
        },
        {
            id: "lastUpdated",
            title: "Last Updated",
            thClass: "gen-th ibraGenPB",
            tdClass: "cent-values-gen gen-point",
            td: (file) => formatDate(file.dateUpdated)
        },
        {
            id: "action",
            title: "Action",
            thClass: "gen-th ibraGenType",
            tdClass: "cent-values-gen gen-point",
            td: (f) => {
                const isPublisher = f.publisher && String(f.publisher) === String(userID);
                return (
                    <div className="action-buttons-fi">
                        <button
                            className="delete-button-fi col-but"
                            onClick={() => openRemoveApprovalModal(f._id, f.formData.title)}
                            disabled={!isPublisher}
                            title={isPublisher ? "Withdraw from approval process" : "Only the publisher can remove this template from the approval process"}
                        >
                            <FontAwesomeIcon icon={faFileArrowDown} title="Withdraw from approval process" />
                        </button>
                    </div>
                );
            },
        }
    ];

    const [showColumns, setShowColumns] = useState(allColumns.map(c => c.id));
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const availableColumns = allColumns;

    const toggleColumn = (id) => {
        if (id === "nr" || id === "action") return;
        setShowColumns(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const toggleAllColumns = (selectAll) => {
        if (selectAll) setShowColumns(availableColumns.map(c => c.id));
        else setShowColumns(["nr", "action"]);
    };

    const areAllSelected = () => {
        return availableColumns.every(col => showColumns.includes(col.id));
    };

    const visibleColumns = availableColumns.filter(c => showColumns.includes(c.id));
    const visibleCount = visibleColumns.length;
    const isWide = visibleCount > 9;

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
            if (anchor) newTop = Math.max(margin, anchor.top - popupRect.height - 4);
        }
        if (popupRect.right > viewportW - margin) {
            newLeft = Math.max(margin, newLeft - (popupRect.right - (viewportW - margin)));
        }
        if (popupRect.left < margin) newLeft = margin;
        if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
            setExcelFilter(prev => ({ ...prev, pos: { ...prev.pos, top: newTop, left: newLeft } }));
        }
    }, [excelFilter.open, excelFilter.pos, excelSearch]);

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(activeExcelFilters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
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

    // --- NEW: Helper to get options filtered by OTHER columns ---
    const getAvailableOptions = (colId) => {
        // Start with all files
        let filtered = files;

        // 1. Apply Global Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            // Matching the logic in processedFiles (assuming fileName or formData.title)
            filtered = filtered.filter(f =>
                (f.fileName || f.formData?.title || "").toLowerCase().includes(lowerQ)
            );
        }

        // 2. Apply filters from ALL OTHER active columns
        for (const [filterColId, selectedValues] of Object.entries(activeExcelFilters)) {
            if (filterColId === colId) continue; // Don't filter a column by itself
            if (!selectedValues || !Array.isArray(selectedValues)) continue;

            filtered = filtered.filter((row, index) => {
                const cellValues = getFilterValuesForCell(row, filterColId, index);
                // Keep row if ANY of its cell values match the selection
                return cellValues.some(v => selectedValues.includes(v));
            });
        }

        // 3. Extract unique values for the requested column from the filtered subset
        return Array.from(
            new Set(filtered.flatMap((r, i) => getFilterValuesForCell(r, colId, i)))
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
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
                        <p className="logo-text-um">Field Template</p>
                    </div>

                    {false && (<div className="button-container-create">
                        <button className="but-um" onClick={() => navigate('/FrontendDMS/ftsDeletedTemplates')}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                                <span className="button-text">Deleted Templates</span>
                            </div>
                        </button>
                    </div>)}
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

                    <div className={`info-box-fih`}>Number of Templates: {processedFiles.length}</div>

                    <div className="spacer"></div>

                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Review & Approval Templates"}</label>

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
                            <table className={`limit-table-height-visitor ${isWide ? 'wide' : ''}`} style={{ height: "0", tableLayout: "fixed" }}>
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
                                                    style={{
                                                        cursor: isAction ? "default" : "pointer",
                                                        position: "relative",
                                                        width: col.width,
                                                        minWidth: col.width,
                                                        maxWidth: col.width
                                                    }}
                                                >
                                                    {col.title}
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
                                        <tr><td colSpan={visibleColumns.length} className="cent-values-gen">No documents found.</td></tr>
                                    ) : (
                                        processedFiles.map((file, index) => (
                                            <tr
                                                key={file._id}
                                                className={`file-info-row-height gen-tr`}
                                                style={{ cursor: "pointer" }}
                                                onClick={(e) => {
                                                    if (dragRef.current.hasDragged) return;
                                                    if (isInteractive(e.target)) return;
                                                    navigate(`/FrontendDMS/ftsCreateTemplate/template/${file._id}`);
                                                }}
                                            >
                                                {visibleColumns.map(col => {
                                                    const isStatusCol = col.id === "status";
                                                    const statusValue = isStatusCol ? file.documentStatus : null;
                                                    const statusClass = isStatusCol && statusValue ? getStatusClass(file.documentStatus) : "";

                                                    return (
                                                        <td
                                                            key={`${file._id}-${col.id}`}
                                                            className={`${col.tdClass} ${statusClass}`}
                                                            style={{
                                                                width: col.width,
                                                                minWidth: col.width,
                                                                maxWidth: col.width
                                                            }}
                                                            onClick={col.onCellClick ? (e) => { e.stopPropagation(); col.onCellClick(file); } : undefined}
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

                        // Use the new helper to get context-aware options
                        const allValues = getAvailableOptions(colId);

                        const visibleValues = allValues.filter(v =>
                            String(v).toLowerCase().includes(excelSearch.toLowerCase())
                        );

                        const isAllVisibleSelected =
                            visibleValues.length > 0 && visibleValues.every(v => excelSelected.has(v));

                        const toggleAll = (checked) => {
                            setExcelSelected(prev => {
                                const next = new Set(prev);
                                if (checked) {
                                    visibleValues.forEach(v => next.add(v));
                                } else {
                                    visibleValues.forEach(v => next.delete(v));
                                }
                                return next;
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

                        const onOk = () => {
                            let finalSelection = new Set(excelSelected);

                            // If searching, only apply changes to the visible items
                            if (excelSearch.trim() !== "") {
                                const visibleSet = new Set(visibleValues);
                                finalSelection = new Set(
                                    Array.from(excelSelected).filter(v => visibleSet.has(v))
                                );
                            }

                            const selectedArr = Array.from(finalSelection);

                            // Check if this is a "Select All" (Reset) scenario
                            const isTotalReset = allValues.length > 0 &&
                                allValues.length === selectedArr.length &&
                                selectedArr.every(v => finalSelection.has(v));

                            setActiveExcelFilters(prev => {
                                const next = { ...prev };
                                if (isTotalReset) {
                                    delete next[colId];
                                } else {
                                    next[colId] = selectedArr;
                                }
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
                                                checked={isAllVisibleSelected}
                                                onChange={(e) => toggleAll(e.target.checked)}
                                            />
                                        </span>
                                        <span className="excel-filter-text">
                                            {excelSearch === "" ? "(Select All)" : "(Select All Search Results)"}
                                        </span>
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

                                    {visibleValues.length === 0 && (
                                        <div style={{ padding: "8px", color: "#888", fontStyle: "italic", fontSize: "12px" }}>
                                            No matches found
                                        </div>
                                    )}
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

            {uploadProcedurePDF && (<FTSSignedOffUploadPopup docID={uploadID} onClose={closePDFUpload} refresh={fetchFiles} closeNavigate={closePDFNavigate} type={"ibra"} />)}
            {isModalOpen && (<DeletePopup closeModal={closeModal} deleteFile={deleteFile} isTrashView={false} loading={loading} selectedFileName={selectedFileName} />)}
            {isRemoveApprovalModalOpen && (
                <RemoveApprovalPopup
                    closeModal={closeRemoveApprovalModal}
                    removeApproval={removeApprovalProcess}
                    selectedFileName={selectedRemoveFileName}
                    loading={removeApprovalLoading}
                />
            )}
            <ToastContainer />
        </div >
    );
};

export default FTSTemplateDocuments;