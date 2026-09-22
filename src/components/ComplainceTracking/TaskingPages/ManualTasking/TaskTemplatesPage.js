import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faCaretLeft, faCaretRight, faCirclePlus, faDownload, faEdit, faFile, faFolderOpen, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faColumns, faFilter } from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import TopBar from "../../../Notifications/TopBar";
import { jwtDecode } from "jwt-decode";
import "./TaskTemplatePage.css";
import { canIn, getCurrentUser } from "../../../../utils/auth";
import AddTemplatePopup from "./AddTemplatePopup";
import ModifyTaskTemplate from "./ModifyTaskTemplate";
import DeleteTaskTemplate from "./DeleteTaskTemplate";

const DEFAULT_COLUMN_WIDTHS = {
    nr: 40,
    taskTitle: 120,
    taskDescription: 180,
    comment: 160,
    taskPriority: 60,
    taskType: 80,
    createdBy: 100,
    discipline: 120,
    area: 120,
    action: 80,
};

const COLUMN_SIZE_LIMITS = {
    nr: { min: 40, max: 40 },
    taskTitle: { min: 80, max: 600 },
    taskDescription: { min: 120, max: 800 },
    comment: { min: 100, max: 700 },
    taskPriority: { min: 60, max: 200 },
    taskType: { min: 60, max: 260 },
    createdBy: { min: 80, max: 300 },
    discipline: { min: 80, max: 300 },
    area: { min: 80, max: 300 },
    action: { min: 80, max: 80 },
};

const TaskTemplatesPage = () => {
    const access = getCurrentUser();
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [fileToDelete, setFileToDelete] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addTemplate, setAddTemplate] = useState(false);
    const [editTemplate, setEditTemplate] = useState(false);
    const [editTemplateRow, setEditTemplateRow] = useState([]);
    const [deleteTemplate, setDeleteTemplate] = useState(false);
    const [deleteTaskRow, setDeleteTaskRow] = useState([]);
    const [deleteName, setDeleteName] = useState("");

    const openEdit = (data) => {
        setEditTemplateRow(data);
        setEditTemplate(true);
    }

    const closeEdit = () => {
        setEditTemplate(false);

        fetchFiles();
    }

    const openAdd = () => {
        setAddTemplate(true);
    }

    const closeAdd = () => {
        setAddTemplate(false);

        fetchFiles();
    }

    const openDelete = (data) => {
        setDeleteTaskRow(data);
        setDeleteName(data.taskTitle);
        setDeleteTemplate(true);
    }

    const closeDelete = () => {
        setDeleteTemplate(false);

        fetchFiles();
    }

    const navigate = useNavigate();

    const DEFAULT_SORT = { colId: "nr", direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

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

    const getPriorityClass = (priority) => {
        switch (priority) {
            case "Critical":
                return "templateTask-priority priority-critical";
            case "High":
                return "templateTask-priority priority-high";
            case "Medium":
                return "templateTask-priority priority-medium";
            case "Low":
                return "templateTask-priority priority-low";
            default:
                return "templateTask-priority priority-empty";
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

    useEffect(() => {
        if (token) {
            fetchFiles();
        }
    }, [token]);

    const fetchFiles = async () => {
        const route = `/api/taskTemplates/approved`;
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

            console.log(data)
            setFiles(data.templates);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDeleteTask = async () => {
        const storedToken = localStorage.getItem("token");
        if (!storedToken) return;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/taskTemplates/${deleteTaskRow._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${storedToken}` },
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.error || "Failed to delete task");
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success(
                "Task template deleted successfully.",
                { autoClose: 3000, closeButton: false }
            );
            closeDelete();
            fetchFiles();
        } catch (error) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Failed to delete task template", { autoClose: 3000, closeButton: false });
        }
    };

    const getFilterValuesForCell = (row, colId, index) => {
        if (colId === "nr") return [String(index + 1)];

        if (colId === "taskTitle") return [(row.taskTitle)];
        if (colId === "taskDescription") return [(row.taskDescription)];
        if (colId === "comment") return [row.comment || "N/A"];
        if (colId === "createdBy") return [(row.createdBy?.username)];
        if (colId === "taskType") return [(row.taskType)];
        if (colId === "taskPriority") return [(row.taskPriority)];
        if (colId === "discipline") return [row.discipline || "N/A"];
        if (colId === "area") return [row.area || "N/A"];

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

    const processedFiles = useMemo(() => {
        let current = [...files];

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            current = current.filter(f =>
                f.fileName.toLowerCase().includes(lowerQ)
            );
        }


        current = current.filter((r, i) => {
            for (const [c, s] of Object.entries(activeExcelFilters)) {
                if (!Array.isArray(s)) continue;

                if (s.length === 0) return false;

                if (!getFilterValuesForCell(r, c, i).some(v => s.includes(v))) return false;
            }
            return true;
        });

        const { colId, direction } = sortConfig;
        const dir = direction === "desc" ? -1 : 1;

        if (colId === "nr") {
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

                switch (colId) {
                    case "taskTitle":
                        valA = a.taskTitle; valB = b.taskTitle; break;
                    case "taskDescription":
                        valA = a.taskDescription; valB = b.taskDescription; break;
                    case "comment":
                        valA = (a.comment); valB = (b.comment); break;
                    case "createdBy":
                        valA = a.createdBy?.username; valB = b.createdBy?.username; break;
                    case "taskType":
                        valA = a.taskType; valB = b.taskType; break;
                    case "taskPriority":
                        valA = a.taskPriority; valB = b.taskPriority; break;
                    case "discipline":
                        valA = a.discipline; valB = b.discipline; break;
                    case "area":
                        valA = a.area; valB = b.area; break;
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

    const allColumns = [
        {
            id: "nr",
            title: "Nr",
            thClass: "gen-th templateTask-nr",
            tdClass: "task-cent",
            td: (file, index) => index + 1
        },
        {
            id: "taskTitle",
            title: "Title",
            thClass: "gen-th templateTask-title",
            tdClass: "",
            td: (file) => file.taskTitle
        },
        {
            id: "taskDescription",
            title: "Description",
            thClass: "gen-th templateTask-desc",
            tdClass: "",
            td: (file) => file.taskDescription
        },
        {
            id: "comment",
            title: "Comments",
            thClass: "gen-th templateTask-comment",
            tdClass: "",
            td: (file) => file.comment
        },
        {
            id: "taskPriority",
            title: "Priority",
            thClass: "gen-th templateTask-priority",
            tdClass: (file) => getPriorityClass(file.taskPriority),
            td: (file) => file.taskPriority || "-"
        },
        {
            id: "taskType",
            title: "Type",
            thClass: "gen-th templateTask-type",
            tdClass: "task-cent",
            td: (file) => file.taskType
        },
        {
            id: "createdBy",
            title: "Template By",
            thClass: "gen-th templateTask-by",
            tdClass: "task-cent",
            td: (file) => file.createdBy.username
        },
        {
            id: "discipline",
            title: "Department",
            thClass: "gen-th templateTask-discipline",
            tdClass: "task-cent",
            hidden: true,
            td: (file) => file.discipline || "-"
        },
        {
            id: "area",
            title: "Area",
            thClass: "gen-th templateTask-area",
            tdClass: "task-cent",
            hidden: true,
            td: (file) => file.area || "-"
        },
        {
            id: "action",
            title: "Action",
            thClass: "gen-th templateTask-act",
            tdClass: "task-cent",
            td: (file) => (
                <>
                    <button
                        className={"delete-button-fi col-but-res"}
                        onClick={(e) => { e.stopPropagation(); }}
                    >
                        <FontAwesomeIcon icon={faEdit} title="Edit Template" onClick={() => openEdit(file)} />
                    </button>
                    <button
                        className={"delete-button-fi col-but"}
                        onClick={(e) => { e.stopPropagation(); }}
                    >
                        <FontAwesomeIcon icon={faTrash} title="Delete Template" onClick={() => openDelete(file)} />
                    </button>
                </>
            )
        }
    ];

    const [showColumns, setShowColumns] = useState(allColumns.filter(c => !c.hidden).map(c => c.id));
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const availableColumns = allColumns;

    // ── Column resize ────────────────────────────────────────────────────────
    const [columnWidths, setColumnWidths] = useState({ ...DEFAULT_COLUMN_WIDTHS });
    const [initialColumnWidths] = useState({ ...DEFAULT_COLUMN_WIDTHS });
    const [tableWidth, setTableWidth] = useState(null);
    const [wrapperWidth, setWrapperWidth] = useState(0);
    const [hasFittedOnce, setHasFittedOnce] = useState(false);
    const widthsInitializedRef = useRef(false);
    const isResizingRef = useRef(false);
    const resizingColRef = useRef(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);

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

    const getDisplayColumns = () => showColumns;

    const startColumnResize = (e, columnId) => {
        e.preventDefault(); e.stopPropagation();
        isResizingRef.current = true;
        resizingColRef.current = columnId;
        resizeStartXRef.current = e.clientX;
        const th = e.target.closest("th");
        resizeStartWidthRef.current = columnWidths[columnId] ?? (th ? th.getBoundingClientRect().width : 100);
        document.addEventListener("mousemove", handleColumnResizeMove);
        document.addEventListener("mouseup", stopColumnResize);
    };

    const handleColumnResizeMove = (e) => {
        const colId = resizingColRef.current;
        if (!colId) return;
        let newWidth = resizeStartWidthRef.current + (e.clientX - resizeStartXRef.current);
        const limits = COLUMN_SIZE_LIMITS[colId];
        if (limits?.min != null) newWidth = Math.max(limits.min, newWidth);
        if (limits?.max != null) newWidth = Math.min(limits.max, newWidth);
        setColumnWidths(prev => {
            const updated = { ...prev, [colId]: newWidth };
            const total = getDisplayColumns().filter(id => typeof updated[id] === "number").reduce((s, id) => s + updated[id], 0);
            setTableWidth(total);
            return updated;
        });
    };

    const stopColumnResize = () => {
        document.removeEventListener("mousemove", handleColumnResizeMove);
        document.removeEventListener("mouseup", stopColumnResize);
        setTimeout(() => { isResizingRef.current = false; }, 0);
        resizingColRef.current = null;
    };

    useEffect(() => {
        if (widthsInitializedRef.current || !scrollerRef.current) return;
        const wWidth = scrollerRef.current.clientWidth;
        if (!wWidth) return;
        const cols = getDisplayColumns();
        const total = cols.reduce((s, id) => s + (typeof columnWidths[id] === "number" ? columnWidths[id] : 0), 0);
        if (!total) return;
        const factor = wWidth / total;
        setColumnWidths(prev => {
            const updated = { ...prev };
            cols.forEach(id => { if (typeof prev[id] === "number") updated[id] = Math.round(prev[id] * factor); });
            return updated;
        });
        setWrapperWidth(scrollerRef.current.getBoundingClientRect().width);
        setTableWidth(wWidth);
        setHasFittedOnce(true);
        widthsInitializedRef.current = true;
    }, [showColumns, columnWidths]);

    const fitTableToWidth = () => {
        const wrapper = scrollerRef.current;
        if (!wrapper) return;
        const ww = wrapper.getBoundingClientRect().width;
        if (!ww) return;
        const visibleCols = getDisplayColumns().filter(id => typeof columnWidths[id] === "number");
        if (!visibleCols.length) return;
        const prevWidths = visibleCols.map(id => columnWidths[id]);
        const total = prevWidths.reduce((a, b) => a + b, 0);
        if (total >= ww) { setTableWidth(total); return; }
        const scale = ww / total;
        let newWidths = prevWidths.map(w => Math.round(w * scale));
        let diff = ww - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 2) { newWidths[i % newWidths.length] += diff > 0 ? 1 : -1; diff = ww - newWidths.reduce((s, w) => s + w, 0); i++; }
        setColumnWidths(prev => { const u = { ...prev }; visibleCols.forEach((id, idx) => { u[id] = newWidths[idx]; }); return u; });
        setTableWidth(ww);
        setWrapperWidth(ww);
    };

    const resetColumnWidths = () => {
        const wrapper = scrollerRef.current;
        if (!wrapper) return;
        const ww = wrapper.getBoundingClientRect().width;
        if (!ww) return;
        const defaultCols = availableColumns.map(c => c.id);
        setShowColumns(defaultCols);
        const visibleCols = defaultCols.filter(id => typeof initialColumnWidths[id] === "number");
        if (!visibleCols.length) return;
        const prevWidths = visibleCols.map(id => initialColumnWidths[id]);
        const total = prevWidths.reduce((a, b) => a + b, 0);
        if (!total) return;
        const scale = ww / total;
        let newWidths = prevWidths.map(w => Math.round(w * scale));
        let diff = ww - newWidths.reduce((s, w) => s + w, 0);
        let i = 0;
        while (diff !== 0 && i < newWidths.length * 10) {
            const idx = i % newWidths.length;
            const colId = visibleCols[idx];
            const limits = COLUMN_SIZE_LIMITS[colId] || {};
            if (diff > 0) { if (limits.max == null || newWidths[idx] < limits.max) { newWidths[idx]++; diff--; } }
            else { if (limits.min == null || newWidths[idx] > limits.min) { newWidths[idx]--; diff++; } }
            i++;
        }
        setColumnWidths(prev => { const u = { ...prev }; visibleCols.forEach((id, idx) => { u[id] = newWidths[idx]; }); return u; });
        setTableWidth(ww);
        setWrapperWidth(ww);
    };

    const isTableFitted = hasFittedOnce && wrapperWidth > 0 && tableWidth != null && Math.abs(tableWidth - wrapperWidth) <= 1;
    const showFitButton = hasFittedOnce && wrapperWidth > 0 && tableWidth != null && tableWidth < wrapperWidth - 1;
    const showResetButton = hasFittedOnce && !isTableFitted;

    useEffect(() => { if (hasFittedOnce) fitTableToWidth(); }, [isSidebarVisible, showColumns]);

    const visibleColumns = availableColumns.filter(c => showColumns.includes(c.id));
    const visibleCount = visibleColumns.length;
    const isWide = visibleCount > 9;

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

    const getAvailableOptions = (colId) => {
        let filtered = files;

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            filtered = filtered.filter(f =>
                (f.fileName || f.formData?.title || "").toLowerCase().includes(lowerQ)
            );
        }

        for (const [filterColId, selectedValues] of Object.entries(activeExcelFilters)) {
            if (filterColId === colId) continue; // Don't filter a column by itself
            if (!selectedValues || !Array.isArray(selectedValues)) continue;

            filtered = filtered.filter((row, index) => {
                const cellValues = getFilterValuesForCell(row, filterColId, index);
                // Keep row if ANY of its cell values match the selection
                return cellValues.some(v => selectedValues.includes(v));
            });
        }

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
                        <p className="logo-text-um">Compliance Tracking</p>
                    </div>

                    <div className="button-container-create">
                        <button className="but-um" onClick={() => navigate('/FrontendDMS/suggestedTaskTemplates/new')}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faFile} className="button-logo-custom" />
                                <span className="button-text">Suggested Templates</span>
                            </div>
                        </button>
                        <button className="but-um" onClick={() => navigate('/FrontendDMS/deletedTaskTemplates')}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                                <span className="button-text">Deleted Templates</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/templateManagement1.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Task Templates"}</p>
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

                    {canIn(access, "CTS", ["systemAdmin", "contributor"]) && (
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon icon={faCirclePlus} title="Add Template" onClick={openAdd} />
                        </div>
                    )}

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

                    <div className="spacer"></div>

                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Task Templates"}</label>

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

                        {showResetButton && (
                            <FontAwesomeIcon
                                icon={faArrowsRotate}
                                title="Reset column widths"
                                className="top-right-button-control-att-3-new"
                                onClick={resetColumnWidths}
                                style={{ top: "20px" }}
                            />
                        )}

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
                            <table
                                className={`limit-table-height-visitor ${isWide ? 'wide' : ''}`}
                                style={{ height: "0", tableLayout: "fixed", width: tableWidth ? `${tableWidth}px` : "100%" }}
                            >
                                <colgroup>
                                    {visibleColumns.map(col => (
                                        <col key={col.id} style={{ width: `${columnWidths[col.id] ?? 100}px`, minWidth: `${(COLUMN_SIZE_LIMITS[col.id]?.min ?? 40)}px` }} />
                                    ))}
                                </colgroup>
                                <thead className="gen-head" style={{ fontSize: "14px" }}>
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
                                                        if (isResizingRef.current) return;
                                                        if (isAction) return;
                                                        openExcelFilterPopup(col.id, e);
                                                    }}
                                                    style={{
                                                        cursor: isAction ? "default" : "pointer",
                                                        position: "relative",
                                                        width: `${columnWidths[col.id] ?? 100}px`,
                                                        minWidth: `${(COLUMN_SIZE_LIMITS[col.id]?.min ?? 40)}px`,
                                                        maxWidth: COLUMN_SIZE_LIMITS[col.id]?.max ? `${COLUMN_SIZE_LIMITS[col.id].max}px` : undefined,
                                                        overflow: "visible",
                                                        whiteSpace: "normal",
                                                        wordBreak: "break-word",
                                                        userSelect: "none",
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
                                                    {!isAction && (
                                                        <span
                                                            className="col-resize-handle"
                                                            onMouseDown={(e) => startColumnResize(e, col.id)}
                                                            style={{
                                                                position: "absolute",
                                                                right: 0,
                                                                top: 0,
                                                                height: "100%",
                                                                width: "6px",
                                                                cursor: "col-resize",
                                                                userSelect: "none",
                                                                zIndex: 2,
                                                            }}
                                                        />
                                                    )}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedFiles.length === 0 ? (
                                        <tr><td colSpan={visibleColumns.length} className="cent-values-gen">No Templates Found.</td></tr>
                                    ) : (
                                        processedFiles.map((file, index) => (
                                            <tr key={file._id} className={`file-info-row-height gen-tr`} style={{ fontSize: "14px" }}>
                                                {visibleColumns.map(col => {
                                                    return (
                                                        <td
                                                            key={`${file._id}-${col.id}`}
                                                            className={
                                                                typeof col.tdClass === "function"
                                                                    ? col.tdClass(file)
                                                                    : col.tdClass || ""
                                                            }
                                                            style={{
                                                                width: `${columnWidths[col.id] ?? 100}px`,
                                                                maxWidth: `${columnWidths[col.id] ?? 100}px`,
                                                                overflow: "visible",
                                                                textOverflow: "unset",
                                                                whiteSpace: "normal",
                                                                wordBreak: "break-word",
                                                            }}
                                                            onClick={col.onCellClick ? () => col.onCellClick(file) : undefined}
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

            {deleteTemplate && (<DeleteTaskTemplate cancel={false} handleDeleteTask={handleDeleteTask} onClose={closeDelete} open={true} task={deleteTaskRow} taskName={deleteName} />)}
            {editTemplate && (<ModifyTaskTemplate data={editTemplateRow} onClose={closeEdit} onTaskAdded={closeEdit} />)}
            {addTemplate && (<AddTemplatePopup onClose={closeAdd} onTaskAdded={closeAdd} />)}
            <ToastContainer />
        </div >
    );
};

export default TaskTemplatesPage;