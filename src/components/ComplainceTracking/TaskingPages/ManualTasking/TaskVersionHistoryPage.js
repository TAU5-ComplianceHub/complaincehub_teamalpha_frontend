import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft, faSearch, faTimes, faCaretLeft, faCaretRight,
    faTableColumns, faArrowsRotate, faFilter, faX,
} from "@fortawesome/free-solid-svg-icons";
import { saveAs } from "file-saver";
import TopBar from "../../../Notifications/TopBar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ALL_COLUMNS = [
    { id: "nr", title: "Nr" },
    { id: "version", title: "Version" },
    { id: "area", title: "Area" },
    { id: "discipline", title: "Department" },
    { id: "taskType", title: "Type" },
    { id: "taskTitle", title: "Title" },
    { id: "taskDescription", title: "Description" },
    { id: "priority", title: "Priority" },
    { id: "allocatedBy", title: "Originator", class: "task-grey2" },
    { id: "allocatedDate", title: "Date Created", class: "task-grey2" },
    { id: "category", title: "Source", class: "task-grey2" },
    { id: "comments", title: "Originator Comments", class: "task-grey2" },
    { id: "attachments", title: "Originator Supporting Info", class: "task-grey2" },
    { id: "responsible", title: "Responsible Person", class: "task-grey2" },
    { id: "dueDate", title: "Due Date", class: "task-grey2" },
    { id: "acceptanceStatus", title: "Acceptance Status", class: "task-grey1" },
    { id: "status", title: "Status", class: "task-grey1" },
    { id: "userComments", title: "Responsible Person Comments", class: "task-grey1" },
    { id: "userAttachments", title: "Responsible Person Supporting Info", class: "task-grey1" },
    { id: "completionDate", title: "Completion Date" },
    { id: "closeStatus", title: "Closeout Status" },
    { id: "closeoutDate", title: "Closeout Date" },
    { id: "closeOutComments", title: "Close Out Comments" },
    { id: "prevResponsible", title: "Delegated From" },
    { id: "delegateDate", title: "Delegation Date" },
    { id: "delegationReason", title: "Delegation Reason" },
    { id: "reopenDate", title: "Reopen Date" },
    { id: "reopenReason", title: "Reopen Reason" },
    { id: "changedBy", title: "Updated By" },
    { id: "changedOn", title: "Updated On" },
];

const DEFAULT_COLUMN_WIDTHS = {
    nr: 50,
    area: 40,
    discipline: 40,
    taskType: 30,
    taskTitle: 95,
    taskDescription: 165,
    priority: 30,
    allocatedBy: 50,
    allocatedDate: 130,
    category: 50,
    comments: 200,
    attachments: 220,
    responsible: 50,
    dueDate: 90,
    acceptanceStatus: 40,
    status: 45,
    userComments: 120,
    userAttachments: 220,
    completionDate: 90,
    closeStatus: 30,
    closeoutDate: 90,
    version: 60,
    closeOutComments: 300,
    action: 90,
    delegateDate: 150,
    delegationReason: 260,
    reopenDate: 150,
    reopenReason: 260,
    changedBy: 180,
    changedOn: 160,
    prevResponsible: 180,
};

const COLUMN_SIZE_LIMITS = {
    nr: { min: 50, max: 60 },
    version: { min: 120, max: 260 },
    area: { min: 40, max: 300 },
    discipline: { min: 40, max: 300 },
    taskType: { min: 30, max: 240 },
    taskTitle: { min: 70, max: 520 },
    taskDescription: { min: 200, max: 700 },
    priority: { min: 30, max: 200 },
    allocatedBy: { min: 50, max: 340 },
    allocatedDate: { min: 110, max: 240 },
    category: { min: 50, max: 300 },
    comments: { min: 200, max: 600 },
    attachments: { min: 160, max: 400 },
    responsible: { min: 50, max: 380 },
    dueDate: { min: 40, max: 240 },
    acceptanceStatus: { min: 40, max: 280 },
    status: { min: 45, max: 260 },
    userComments: { min: 120, max: 600 },
    userAttachments: { min: 160, max: 400 },
    completionDate: { min: 110, max: 240 },
    closeStatus: { min: 30, max: 240 },
    closeoutDate: { min: 110, max: 240 },
    closeOutComments: { min: 180, max: 600 },
    prevResponsible: { min: 140, max: 340 },
    delegateDate: { min: 110, max: 240 },
    delegationReason: { min: 180, max: 600 },
    reopenDate: { min: 110, max: 240 },
    reopenReason: { min: 180, max: 600 },
    changedBy: { min: 140, max: 340 },
    changedOn: { min: 130, max: 260 },
    action: { min: 90, max: 300 },
};

// ─── Colour helpers (mirrors ManualTaskingPage) ───────────────────────────────
const PRIORITY_OPTIONS = [
    { value: "Critical", color: "#CB6F6F", textColor: "#FFFFFF" },
    { value: "High", color: "#FFA500", textColor: "#000000" },
    { value: "Medium", color: "#FFFF00", textColor: "#000000" },
    { value: "Low", color: "#FFFFEE", textColor: "#000000" },
];
const STATUS_OPTIONS = [
    { value: "25% Completed", color: "#FFC000" },
    { value: "50% Completed", color: "#FFFF00" },
    { value: "75% Completed", color: "#FFFFCC" },
    { value: "Completed", color: "#7EAC87" },
];
const getStatusColor = (s) => STATUS_OPTIONS.find(o => o.value === s)?.color ?? "transparent";
const getStatusTextColor = (s) => s === "Completed" ? "#FFFFFF" : "#000000";
const getPriorityStyle = (p) => {
    const m = PRIORITY_OPTIONS.find(o => o.value === p);
    return m ? { backgroundColor: m.color, color: m.textColor } : {};
};

// ─── Normalise a history node for table rendering ─────────────────────────────
const normalizeNode = (node) => ({
    ...node,
    _id: node._id,
    version: node.version ?? "",
    responsible: node?.responsible?.username ?? node?.responsible ?? "",
    allocatedBy: node?.allocatedBy?.username ?? node?.allocatedBy ?? "",
    changedBy: node?.changedBy?.username ?? node?.changedBy ?? "-",
    changedOn: node?.changedOn
        ? new Date(node.changedOn).toLocaleDateString("en-GB", {
            day: "2-digit", month: "2-digit", year: "numeric",
            timeZone: "Africa/Johannesburg",
        }) + " " +
        new Date(node.changedOn).toLocaleTimeString("en-GB", {
            hour: "2-digit", minute: "2-digit", hour12: false,
            timeZone: "Africa/Johannesburg",
        })
        : "-",
    allocatedDate: node?.allocatedDate ? String(node.allocatedDate).slice(0, 10) : "",
    dueDate: node?.dueDate
        ? (() => {
            const d = new Date(node.dueDate);
            if (isNaN(d.getTime())) return String(node.dueDate).slice(0, 10);
            const gmt2 = new Date(d.getTime() + 2 * 60 * 60 * 1000);
            return `${gmt2.toISOString().slice(0, 10)}`;
        })()
        : "",
    completionDate: node?.completionDate ? String(node.completionDate).slice(0, 10) : "",
    closeoutDate: node?.closeStatus && node?.completionDate
        ? String(node.completionDate).slice(0, 10)
        : "",
    category: node?.category ?? "",
    area: node?.area ?? "",
    discipline: node?.discipline ?? "",
    prevResponsible: node?.prevResponsible?.username ?? node?.prevResponsibleName ?? node?.prevResponsible ?? "",
    delegateDate: node?.delegateDate
        ? new Date(node.delegateDate).toLocaleDateString("en-GB", {
            day: "2-digit", month: "2-digit", year: "numeric",
            timeZone: "Africa/Johannesburg",
        })
        : "",
    delegationReason: node?.delegationReason && node.delegationReason !== "null" ? node.delegationReason : "",
    reopenDate: node?.reopenDate
        ? new Date(node.reopenDate).toLocaleDateString("en-GB", {
            day: "2-digit", month: "2-digit", year: "numeric",
            timeZone: "Africa/Johannesburg",
        })
        : "",
    reopenReason: node?.reopenReason && node.reopenReason !== "null" ? node.reopenReason : "",
    _rawAttachments: Array.isArray(node?.attachments) ? node.attachments : [],
    _rawUserAttachments: Array.isArray(node?.userAttachments) ? node.userAttachments : [],
    attachments: Array.isArray(node?.attachments)
        ? node.attachments.map(f => f?.fileName ?? f?.name ?? f)
        : [],
    userAttachments: Array.isArray(node?.userAttachments)
        ? node.userAttachments.map(f => f?.fileName ?? f?.name ?? f)
        : [],
});

// ─── Main component ───────────────────────────────────────────────────────────
const TaskVersionHistoryPage = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [taskTitle, setTaskTitle] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const DEFAULT_VISIBLE_COLUMNS = [
        "nr", "version", "taskType", "taskTitle", "taskDescription",
        "responsible", "dueDate", "completionDate", "closeoutDate",
    ];
    const [showColumns, setShowColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [columnWidths, setColumnWidths] = useState({ ...DEFAULT_COLUMN_WIDTHS });
    const [activeExcelFilters, setActiveExcelFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ colId: null, direction: "asc" });
    const [excelFilter, setExcelFilter] = useState({ open: false, colId: null, pos: { top: 0, left: 0 } });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const excelPopupRef = useRef(null);

    const scrollerRef = useRef(null);
    const isResizingRef = useRef(false);
    const resizingColRef = useRef(null);
    const resizeStartXRef = useRef(0);
    const resizeStartWidthRef = useRef(0);
    const filterMenuTimerRef = useRef(null);
    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const [showResetButton, setShowResetButton] = useState(false);

    // ── Drag-to-scroll ────────────────────────────────────────────────────────
    const DRAG_THRESHOLD_PX = 6;
    const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

    const onNativeDragStart = (e) => e.preventDefault();

    const onRowPointerDown = (e) => {
        if (
            e.target.closest("button") || e.target.closest("a") ||
            e.target.closest("input") || e.target.closest("select")
        ) return;
        const tr = e.target.closest("tr");
        if (!tr || !scrollerRef.current) return;
        drag.current = { active: true, moved: false, startX: e.clientX, startLeft: scrollerRef.current.scrollLeft };
        tr.setPointerCapture?.(e.pointerId);
    };

    const onRowPointerMove = (e) => {
        if (!drag.current.active) return;
        const dx = e.clientX - drag.current.startX;
        if (!drag.current.moved) {
            if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
            drag.current.moved = true;
            scrollerRef.current?.classList.add("dragging");
        }
        scrollerRef.current.scrollLeft = drag.current.startLeft - dx;
        e.preventDefault();
    };

    const endRowDrag = (e) => {
        if (!drag.current.active) return;
        drag.current.active = false;
        scrollerRef.current?.classList.remove("dragging");
        e.target.closest("tr")?.releasePointerCapture?.(e.pointerId);
    };

    // ── Attachment download ───────────────────────────────────────────────────
    const handleDownloadAttachment = async (taskId, attachmentId, fileName, attachmentType = "attachments") => {
        const storedToken = localStorage.getItem("token");
        if (!storedToken || !taskId || !attachmentId) return;
        try {
            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/complainceTasks/${taskId}/${attachmentType}/${attachmentId}/download`,
                { headers: { Authorization: `Bearer ${storedToken}` } }
            );
            if (!response.ok) throw new Error("Failed to download attachment");
            const blob = await response.blob();
            saveAs(blob, fileName || "attachment");
        } catch {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Failed to download file. Please try again.", { autoClose: 3000, closeButton: false });
        }
    };

    // ── Fetch history ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!taskId) return;
        fetchHistory();
    }, [taskId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${process.env.REACT_APP_URL}/api/complainceTasks/${taskId}/history`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error("Failed to fetch history");
            const data = await res.json();
            const normalized = (data.history || []).map(normalizeNode);
            setHistory(normalized);
            if (normalized.length > 0) {
                setTaskTitle(normalized[normalized.length - 1].taskTitle || normalized[normalized.length - 1].taskDescription || "Task");
            }
        } catch (err) {
            toast.error("Failed to load version history.", { autoClose: 3000, closeButton: false });
        } finally {
            setLoading(false);
        }
    };

    // ── Column resize ─────────────────────────────────────────────────────────
    const startColumnResize = (e, colId) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;
        resizingColRef.current = colId;
        resizeStartXRef.current = e.clientX;
        resizeStartWidthRef.current = columnWidths[colId] ?? DEFAULT_COLUMN_WIDTHS[colId] ?? 160;

        const onMouseMove = (me) => {
            const delta = me.clientX - resizeStartXRef.current;
            const { min, max } = COLUMN_SIZE_LIMITS[colId] ?? { min: 80, max: 800 };
            const newW = Math.min(max, Math.max(min, resizeStartWidthRef.current + delta));
            setColumnWidths(prev => ({ ...prev, [colId]: newW }));
        };
        const onMouseUp = () => {
            isResizingRef.current = false;
            resizingColRef.current = null;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            setShowResetButton(true);
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    const resetColumnWidths = () => {
        setColumnWidths({ ...DEFAULT_COLUMN_WIDTHS });
        setShowResetButton(false);
    };

    // ── Column selector ───────────────────────────────────────────────────────
    const toggleColumn = (id) =>
        setShowColumns(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    const toggleAllColumns = (checked) =>
        setShowColumns(checked ? ALL_COLUMNS.map(c => c.id) : []);
    const areAllColumnsSelected = () => showColumns.length === ALL_COLUMNS.length;

    // ── Excel filter ──────────────────────────────────────────────────────────
    const getAvailableOptions = (colId) => {
        if (!colId) return [];
        const vals = history.map(r => String(r[colId] ?? "")).filter(v => v !== "");
        return [...new Set(vals)].sort();
    };

    const openExcelFilterPopup = (colId, e) => {
        if (colId === "version") return; // version is read-only computed
        const rect = e.currentTarget.getBoundingClientRect();
        const currentFilter = activeExcelFilters[colId];
        const opts = getAvailableOptions(colId);
        setExcelSearch("");
        setExcelSelected(currentFilter ? new Set(currentFilter) : new Set(opts));
        setExcelFilter({ open: true, colId, anchorRect: rect, pos: { top: rect.bottom + 4, left: rect.left, width: Math.max(200, rect.width) } });
    };

    // ── Filter + sort ─────────────────────────────────────────────────────────
    const filteredRows = useMemo(() => {
        let rows = [...history];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            rows = rows.filter(r => ALL_COLUMNS.some(c => String(r[c.id] ?? "").toLowerCase().includes(q)));
        }

        Object.entries(activeExcelFilters).forEach(([colId, allowed]) => {
            if (!allowed || allowed.length === 0) return;
            rows = rows.filter(r => allowed.includes(String(r[colId] ?? "")));
        });

        if (sortConfig.colId) {
            rows.sort((a, b) => {
                const av = String(a[sortConfig.colId] ?? "").toLowerCase();
                const bv = String(b[sortConfig.colId] ?? "").toLowerCase();
                return sortConfig.direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            });
        }

        return rows;
    }, [history, searchQuery, activeExcelFilters, sortConfig]);

    const handleClearFilters = () => {
        setActiveExcelFilters({});
        setSortConfig({ colId: null, direction: "asc" });
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const hasActiveFilters = useMemo(() =>
        Object.keys(activeExcelFilters).length > 0 || sortConfig.colId !== null,
        [activeExcelFilters, sortConfig]);

    const openFilterMenu = (e) => {
        if (!hasActiveFilters) return;
        if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
        setFilterMenu({ isOpen: true, anchorRect: e.currentTarget.getBoundingClientRect() });
    };
    const closeFilterMenuWithDelay = () => {
        filterMenuTimerRef.current = setTimeout(() =>
            setFilterMenu(prev => ({ ...prev, isOpen: false })), 200);
    };

    // ── Cell renderer ─────────────────────────────────────────────────────────
    const renderCell = (col, row, index) => {
        const isCurrent = row.current === true;

        switch (col.id) {
            case "nr":
                return <td key="nr" className="procCent" style={{ fontSize: "14px" }}>{index + 1}</td>;

            case "version":
                return (
                    <td key="version" className="procCent" style={{
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                    }}>
                        {row.version || `Version ${index + 1}`}
                    </td>
                );

            case "taskType":
                return <td key="taskType" className="procCent" style={{ fontSize: "14px" }}>{row.taskType || "-"}</td>;

            case "taskTitle":
                return <td key="taskTitle" style={{ fontSize: "14px" }}>{row.taskTitle || "-"}</td>;

            case "taskDescription":
                return <td key="taskDescription" style={{ fontSize: "14px" }}>{row.taskDescription || "-"}</td>;

            case "priority":
                return (
                    <td key="priority" className="procCent" style={{ fontSize: "14px", fontWeight: "500", ...getPriorityStyle(row.priority) }}>
                        {row.priority || "-"}
                    </td>
                );

            case "responsible":
                return <td key="responsible" className="procCent" style={{ fontSize: "14px" }}>{row.responsible || "-"}</td>;

            case "acceptanceStatus": {
                const statusColor =
                    row.acceptanceStatus === "Accepted"
                        ? { backgroundColor: "#7EA87C", color: "white" }
                        : row.acceptanceStatus === "Delegated"
                            ? { backgroundColor: "#fff3cd", color: "black" }
                            : { backgroundColor: "#f0f0f0", color: "#555" };
                return (
                    <td key="acceptanceStatus" className="procCent" style={{ fontSize: "14px" }}>
                        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", ...statusColor }}>
                            {row.acceptanceStatus || "-"}
                        </span>
                    </td>
                );
            }

            case "status":
                return (
                    <td key="status" className="procCent" style={{
                        fontSize: "14px",
                        backgroundColor: getStatusColor(row.status),
                        color: getStatusTextColor(row.status),
                        fontWeight: "500",
                    }}>
                        {row.status || "-"}
                    </td>
                );

            case "comments":
                return <td key="comments" style={{ fontSize: "14px" }}>{row.comments || "-"}</td>;

            case "userComments":
                return <td key="userComments" style={{ fontSize: "14px" }}>{row.userComments || "-"}</td>;

            case "attachments":
                return (
                    <td key="attachments" style={{ fontSize: "14px" }}>
                        {row._rawAttachments?.length > 0
                            ? row._rawAttachments.map((f, fi) => {
                                const fileName = f?.fileName ?? f?.name ?? "Attachment";
                                const attachmentId = f?._id;
                                return (
                                    <div key={fi}>
                                        <button
                                            type="button"
                                            title="Click to download"
                                            onClick={() => handleDownloadAttachment(row._id, attachmentId, fileName, "attachments")}
                                            disabled={!attachmentId}
                                            style={{ padding: 0, border: "none", background: "transparent", color: "#0B5ED7", textDecoration: "underline", cursor: attachmentId ? "pointer" : "not-allowed", fontSize: "14px", textAlign: "left" }}
                                        >
                                            {fileName}
                                        </button>
                                        {fi < row._rawAttachments.length - 1 && <hr style={{ margin: "4px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />}
                                    </div>
                                );
                            })
                            : <span>No files</span>}
                    </td>
                );

            case "userAttachments":
                return (
                    <td key="userAttachments" style={{ fontSize: "14px" }}>
                        {row._rawUserAttachments?.length > 0
                            ? row._rawUserAttachments.map((f, fi) => {
                                const fileName = f?.fileName ?? f?.name ?? "Attachment";
                                const attachmentId = f?._id;
                                return (
                                    <div key={fi}>
                                        <button
                                            type="button"
                                            title="Click to download"
                                            onClick={() => handleDownloadAttachment(row._id, attachmentId, fileName, "user-attachments")}
                                            disabled={!attachmentId}
                                            style={{ padding: 0, border: "none", background: "transparent", color: "#0B5ED7", textDecoration: "underline", cursor: attachmentId ? "pointer" : "not-allowed", fontSize: "14px", textAlign: "left" }}
                                        >
                                            {fileName}
                                        </button>
                                        {fi < row._rawUserAttachments.length - 1 && <hr style={{ margin: "4px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />}
                                    </div>
                                );
                            })
                            : <span>No files</span>}
                    </td>
                );

            case "allocatedBy":
                return <td key="allocatedBy" className="procCent" style={{ fontSize: "14px" }}>{row.allocatedBy || "-"}</td>;

            case "allocatedDate":
                return <td key="allocatedDate" className="procCent" style={{ fontSize: "14px" }}>{row.allocatedDate || "-"}</td>;

            case "category":
                return <td key="category" className="procCent" style={{ fontSize: "14px" }}>{row.category || "-"}</td>;

            case "dueDate":
                return <td key="dueDate" className="procCent" style={{ fontSize: "14px" }}>{row.dueDate || "-"}</td>;

            case "completionDate":
                return <td key="completionDate" className="procCent" style={{ fontSize: "14px" }}>{row.completionDate || "-"}</td>;

            case "closeoutDate":
                return (
                    <td key="closeoutDate" className="procCent" style={{ fontSize: "14px" }}>
                        {row.closeoutDate || "-"}
                    </td>
                );

            case "closeStatus":
                return (
                    <td key="closeStatus" className="procCent" style={{ fontSize: "14px" }}>
                        <span style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            backgroundColor: row.closeStatus ? "#7EAC87" : "#f0f0f0",
                            color: row.closeStatus ? "#fff" : "#555",
                        }}>
                            {row.closeStatus ? "Closed" : "Open"}
                        </span>
                    </td>
                );

            case "closeOutComments":
                return <td key="closeOutComments" style={{ fontSize: "14px" }}>{row.closeOutComments || "-"}</td>;

            case "area":
                return <td key="area" className="procCent" style={{ fontSize: "14px" }}>{row.area || "-"}</td>;

            case "discipline":
                return <td key="discipline" className="procCent" style={{ fontSize: "14px" }}>{row.discipline || "-"}</td>;

            case "prevResponsible":
                return <td key="prevResponsible" className="procCent" style={{ fontSize: "14px" }}>{row.prevResponsible || "-"}</td>;

            case "delegateDate":
                return <td key="delegateDate" className="procCent" style={{ fontSize: "14px" }}>{row.delegateDate || "-"}</td>;

            case "delegationReason":
                return <td key="delegationReason" style={{ fontSize: "14px" }}>{row.delegationReason || "-"}</td>;

            case "reopenDate":
                return <td key="reopenDate" className="procCent" style={{ fontSize: "14px" }}>{row.reopenDate || "-"}</td>;

            case "reopenReason":
                return <td key="reopenReason" style={{ fontSize: "14px" }}>{row.reopenReason || "-"}</td>;

            case "changedBy":
                return <td key="changedBy" className="procCent" style={{ fontSize: "14px" }}>{row.changedBy || "-"}</td>;

            case "changedOn":
                return <td key="changedOn" className="procCent" style={{ fontSize: "14px" }}>{row.changedOn || "-"}</td>;

            default:
                return null;
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="risk-control-attributes-container" style={{ userSelect: "none" }}>
            {/* Sidebar */}
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Compliance Tracking</p>
                    </div>
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/taskManagement2.svg`} alt="Task Management" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">Version History</p>
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

            <div className="main-box-risk-control-attributes">
                {/* Top bar */}
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>

                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            autoComplete="off"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (
                            <i><FontAwesomeIcon icon={faX} onClick={() => setSearchQuery("")} className="icon-um-search" title="Clear Search" /></i>
                        )}
                        {searchQuery === "" && (
                            <i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>
                        )}
                    </div>

                    <div className="spacer"></div>
                    <TopBar />
                </div>

                {/* Table area */}
                <div className="table-container-risk-control-attributes">
                    <div className="risk-control-label-wrapper-new">
                        <label className="risk-control-label-new">
                            Version History
                        </label>

                        <FontAwesomeIcon
                            icon={faTableColumns}
                            title="Show / Hide Columns"
                            className="top-right-button-control-att-new"
                            onClick={() => setShowColumnSelector(prev => !prev)}
                        />

                        <FontAwesomeIcon
                            icon={faFilter}
                            className={showResetButton ? "top-right-button-control-att-3-new" : "top-right-button-control-att-2-new"}
                            title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
                            style={{ cursor: hasActiveFilters ? "pointer" : "default", color: hasActiveFilters ? "#002060" : "gray", userSelect: "none" }}
                            onMouseEnter={openFilterMenu}
                            onMouseLeave={closeFilterMenuWithDelay}
                            onDoubleClick={handleClearFilters}
                        />

                        {filterMenu.isOpen && filterMenu.anchorRect && (
                            <div
                                className="control-popup-menu"
                                style={{ position: "fixed", top: filterMenu.anchorRect.bottom + 6, left: filterMenu.anchorRect.left, zIndex: 9999, background: "#fff", border: "1px solid #ccc", borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", padding: "8px 0", minWidth: "160px" }}
                                onMouseEnter={() => { if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current); }}
                                onMouseLeave={closeFilterMenuWithDelay}
                            >
                                <div style={{ padding: "6px 14px", fontSize: "13px", color: "#555", borderBottom: "1px solid #eee", marginBottom: "4px" }}>Active filters</div>
                                <div style={{ padding: "6px 14px", fontSize: "13px", cursor: "pointer", color: "#c0392b" }} onClick={handleClearFilters}>Clear all filters &amp; sort</div>
                            </div>
                        )}

                        {showResetButton && (
                            <FontAwesomeIcon
                                icon={faArrowsRotate}
                                title="Reset column widths"
                                className="top-right-button-control-att-2-new"
                                onClick={resetColumnWidths}
                            />
                        )}

                        {/* Column selector popup */}
                        {showColumnSelector && (
                            <div className="column-selector-popup" onMouseDown={e => e.stopPropagation()}>
                                <div className="column-selector-header">
                                    <h4>Select Columns</h4>
                                    <button className="close-popup-btn" type="button" onClick={() => setShowColumnSelector(false)}>
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                                <div className="column-selector-content">
                                    <p className="column-selector-note">Select columns to display</p>
                                    <div className="select-all-container">
                                        <label className="select-all-checkbox">
                                            <input type="checkbox" checked={areAllColumnsSelected()} onChange={e => toggleAllColumns(e.target.checked)} />
                                            <span className="select-all-text">Select All</span>
                                        </label>
                                    </div>
                                    <div className="column-checkbox-container">
                                        {ALL_COLUMNS.map(col => (
                                            <div className="column-checkbox-item" key={col.id}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={showColumns.includes(col.id)}
                                                        disabled={col.id === "version"}
                                                        onChange={() => toggleColumn(col.id)}
                                                    />
                                                    <span>{col.title}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="column-selector-footer">
                                        <p>{showColumns.length} columns selected</p>
                                        <button className="apply-columns-btn" type="button" onClick={() => setShowColumnSelector(false)}>Apply</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div className="table-scroll-wrapper-attributes-controls" ref={scrollerRef}>
                        <table className="risk-control-attributes-table-ws">
                            <thead className="risk-control-attributes-head">
                                <tr>
                                    {ALL_COLUMNS.map(col => {
                                        if (!showColumns.includes(col.id)) return null;
                                        const isActiveFilter = !!activeExcelFilters[col.id];
                                        const isActiveSort = sortConfig.colId === col.id;
                                        return (
                                            <th
                                                key={col.id}
                                                className={col.class ? col.class : "risk-control-attributes-action"}
                                                onClick={(e) => {
                                                    if (isResizingRef.current) return;
                                                    if (e.target.classList.contains("rca-col-resizer")) return;
                                                    if (col.id === "version") return;
                                                    openExcelFilterPopup(col.id, e);
                                                }}
                                                style={{
                                                    position: "relative",
                                                    width: columnWidths[col.id] ? `${columnWidths[col.id]}px` : undefined,
                                                    minWidth: COLUMN_SIZE_LIMITS[col.id]?.min,
                                                    maxWidth: COLUMN_SIZE_LIMITS[col.id]?.max,
                                                    cursor: col.id === "version" ? "default" : "pointer",
                                                }}
                                            >
                                                <span>{col.title}</span>
                                                {(isActiveFilter || isActiveSort) && (
                                                    <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />
                                                )}
                                                <div className="rca-col-resizer" onMouseDown={e => startColumnResize(e, col.id)} />
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={showColumns.length} style={{ textAlign: "center", padding: "32px", color: "#888", fontSize: "14px" }}>
                                            Loading version history…
                                        </td>
                                    </tr>
                                ) : filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={showColumns.length} style={{ textAlign: "center", padding: "32px", color: "#888", fontSize: "14px" }}>
                                            No history found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row, index) => (
                                        <tr
                                            key={row._id}
                                            className="risk-control-attributes-row"
                                            onDragStart={onNativeDragStart}
                                            onPointerDown={onRowPointerDown}
                                            onPointerMove={onRowPointerMove}
                                            onPointerUp={endRowDrag}
                                            onPointerCancel={endRowDrag}
                                        >
                                            {ALL_COLUMNS.map(col => {
                                                if (!showColumns.includes(col.id)) return null;
                                                return renderCell(col, row, index);
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Excel-style filter popup */}
            {excelFilter.open && (
                <div
                    ref={excelPopupRef}
                    className="excel-filter-popup"
                    style={{ position: "fixed", top: excelFilter.pos.top, left: excelFilter.pos.left, width: excelFilter.pos.width, zIndex: 99999, background: "#fff", border: "1px solid #ccc", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", padding: "8px 0" }}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <div style={{ padding: "6px 10px 4px" }}>
                        <input
                            className="search-input-um"
                            placeholder="Search values…"
                            value={excelSearch}
                            onChange={e => setExcelSearch(e.target.value)}
                            style={{ width: "100%", fontSize: "12px", padding: "4px 8px" }}
                            autoFocus
                        />
                    </div>
                    {(() => {
                        const allValues = getAvailableOptions(excelFilter.colId);
                        const visibleValues = allValues.filter(v => String(v).toLowerCase().includes(excelSearch.toLowerCase()));
                        const isAllSelected = visibleValues.length > 0 && visibleValues.every(v => excelSelected.has(v));
                        const toggleAll = (checked) =>
                            setExcelSelected(prev => { const next = new Set(prev); checked ? visibleValues.forEach(v => next.add(v)) : visibleValues.forEach(v => next.delete(v)); return next; });
                        const toggleVal = (v) =>
                            setExcelSelected(prev => { const next = new Set(prev); next.has(v) ? next.delete(v) : next.add(v); return next; });
                        const onOk = () => {
                            const selectedArr = Array.from(excelSelected).filter(v => new Set(visibleValues).has(v) || excelSearch === "");
                            const isTotalReset = allValues.length > 0 && allValues.length === selectedArr.length;
                            setActiveExcelFilters(prev => {
                                const next = { ...prev };
                                isTotalReset ? delete next[excelFilter.colId] : (next[excelFilter.colId] = selectedArr);
                                return next;
                            });
                            setExcelFilter({ open: false, colId: null, pos: { top: 0, left: 0 } });
                        };
                        const onCancel = () => setExcelFilter({ open: false, colId: null, pos: { top: 0, left: 0 } });
                        return (
                            <>
                                <div className="excel-filter-list">
                                    <label className="excel-filter-item">
                                        <span className="excel-filter-checkbox"><input type="checkbox" className="checkbox-excel-attend" checked={isAllSelected} onChange={e => toggleAll(e.target.checked)} /></span>
                                        <span className="excel-filter-text">{excelSearch === "" ? "(Select All)" : "(Select All Search Results)"}</span>
                                    </label>
                                    {visibleValues.map(v => (
                                        <label className="excel-filter-item" key={v}>
                                            <span className="excel-filter-checkbox"><input type="checkbox" className="checkbox-excel-attend" checked={excelSelected.has(v)} onChange={() => toggleVal(v)} /></span>
                                            <span className="excel-filter-text">{v}</span>
                                        </label>
                                    ))}
                                    {visibleValues.length === 0 && <div style={{ padding: "8px", color: "#888", fontStyle: "italic", fontSize: "12px" }}>No matches</div>}
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

            <ToastContainer />
        </div>
    );
};

export default TaskVersionHistoryPage;