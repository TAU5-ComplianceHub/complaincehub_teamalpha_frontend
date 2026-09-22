import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faSearch, faTimes, faCaretLeft, faCaretRight,
    faTableColumns, faArrowsRotate, faCirclePlus, faEdit,
    faFilter, faX, faTrash, faClockRotateLeft,
    faFilePdf,
    faClock,
    faFileExcel,
    faDownLong,
    faDownload,
    faClockFour,
    faPen,
    faPlusCircle,
    faCircle,
    faEye,
    faFileLines
} from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import { saveAs } from "file-saver";
import TopBar from "../../../Notifications/TopBar";
import { canIn, getCurrentUser } from "../../../../utils/auth";
import { ToastContainer, toast } from "react-toastify";
import AddTaskPopup from "./AddTaskPopup";
import AddRepeatingTaskPopup from "./AddRepeatingTaskPopup";
import DeleteAllocatedTask from "./DeleteAllocatedTask";
import CloseAllocatedTask from "./CloseAllocatedTask";
import ReopenAllocatedTask from "./ReopenAllocatedTask";
import ModifyAllocatedTaskPopup from "./ModifyAllocatedTaskPopup";
import ModifyMyTask from "./ModifyMyTask";
import axios from "axios";
import AcceptTaskPopup from "./AcceptTaskPopup";
import DelegateTaskPopup from "./DelegateTaskPopup";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import PopupMenu from "../../../FileInfo/PopupMenu";
import PopupMenuTasks from "./PopupMenuTasks";
import TaskDueDatePopup from "./TaskDueDatePopup";
import AddWorkOrderInstance from "./AddWorkOrderInstance";
import WorkOrderDueDate from "../WorkOrderManagementPopups/WorkOrderDueDate";
import DeleteAllocatedWorkOrder from "../WorkOrderManagementPopups/DeleteAllocatedWorkOrder";
import CloseAllocatedWorkOrder from "../WorkOrderManagementPopups/CloseAllocatedWorkOrder";
import ReopenAllocatedWorkOrder from "../WorkOrderManagementPopups/ReopenAllocatedWorkOrder";
import AcceptWorkOrderPopup from "../WorkOrderManagementPopups/AcceptWorkOrderPopup";
import DelegateWorkOrderPopup from "../WorkOrderManagementPopups/DelegateWorkOrderPopup";
import MigrateWorkOrder from "../WorkOrderManagementPopups/MigrateWorkOrder";
// NOTE: WorkOrderInfoPreview (and the two components it uses,
// ActionFieldsPreviewBox + ActionFieldFileValue) need to live next to
// ActionFieldsInfoBox/ActionFieldControl/TemplatePreview, since
// ActionFieldsPreviewBox imports "./ActionFieldControl" directly. Adjust
// this path to wherever that folder actually is relative to this file.
import WorkOrderInfoPreview from "../WorkOrderManagementPopups/WorkOrderInfoPreview";
// Desktop equivalent of the mobile app's Populate Work Order screen - lets
// the responsible person fill in/edit an accepted work order's action
// fields from the browser. Lives next to WorkOrderInfoPreview since it
// reuses the same popup shell styling and pulls in ActionFieldsPopulateBox
// (which, like ActionFieldsPreviewBox, expects to sit next to
// ActionFieldControl/ActionFieldsInfoBox) - adjust the path if that folder
// moves.
import PopulateWorkOrderPreview from "../WorkOrderManagementPopups/PopulateWorkOrderPreview";

// ─── Route helpers ────────────────────────────────────────────────────────────
// Work order tasks all live on a single route now — no more auto-auto/auto-manual sources.
const taskApiBase = () => `${process.env.REACT_APP_URL}/api/workOrderTasks`;

const ALL_COLUMNS = [
    { id: "nr", title: "Nr", views: "both", collapsed: false },
    { id: "uniqueID", title: "Unique Identifier", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "allocatedBy", title: "Originator", views: "both", collapsed: true, collapsedFor: "allocator" },
    { id: "allocatedDate", title: "Date Created", views: "both", collapsed: true, collapsedFor: "both", hidden: true },
    { id: "site", title: "Site", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "mainArea", title: "Main Area", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "subArea", title: "Sub Area", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "department", title: "Department", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "departmentCode", title: "Department Code", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "accountableParty", title: "Accountable Party", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "responsibleParty", title: "Responsible Party", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "assetType", title: "Asset Type", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "assetModel", title: "Asset Model", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "assetNumber", title: "Asset Number", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "frequency", title: "Frequency", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "workOrderType", title: "Work Order Type", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "workOrderBasis", title: "Work Order Basis", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "taskTitle", title: "Work Order Title", views: "both", collapsed: false },
    { id: "priority", title: "Priority", views: "both", collapsed: false },
    { id: "comments", class: `task-grey2`, title: "Originator Comments", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "attachments", class: `task-grey2`, title: "Supporting Information", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "responsible", class: `task-grey2`, title: "Responsible Person", views: "both", collapsed: true, collapsedFor: "viewer" },
    { id: "dueDate", class: `task-grey2`, title: "Due Date", views: "both", collapsed: false },
    { id: "acceptanceStatus", class: `task-grey1`, title: "Acceptance Status", views: "both", collapsed: true, collapsedFor: "viewer" },
    { id: "status", class: `task-grey1`, title: "Completion Status", views: "both", collapsed: false },
    { id: "completionDate", title: "Completion Date", views: "both", collapsed: true, collapsedFor: "both", hidden: true },
    { id: "closeStatus", title: "Closeout Status", views: "both", collapsed: true },
    { id: "completionChain", title: "Completion Chain", views: "both", collapsed: false },
    { id: "closeOutComments", title: "Close Out Comments", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "ppe", class: `task-grey2`, title: "PPE", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "handTools", class: `task-grey2`, title: "Hand Tools", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "materials", class: `task-grey2`, title: "Materials", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "hazards", class: `task-grey2`, title: "Hazards", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "action", title: "Action", views: "both", collapsed: false },
];

const TASK_TYPE_OPTIONS = ["Develop", "Evaluate", "Inspect", "Investigate", "Monitor", "Review"];

const PRIORITY_OPTIONS = [
    { value: "Critical", color: "#CB6F6F", textColor: "#FFFFFF" },
    { value: "High", color: "#FFA500", textColor: "#000000" },
    { value: "Medium", color: "#FFFF00", textColor: "#000000" },
    { value: "Low", color: "#FFFFEE", textColor: "#000000" },
];

const getStatusDisplay = (status) => {
    if (status === "Completed") return "Submitted";
    if (status === "75% Completed") return "In Progress";
    return status || "Not Started";
};

const WORK_ORDER_BASIS_LABELS = {
    assetBased: "Asset Based",
    departmentBased: "Department Based",
    siteBased: "Area Based",
};

const getWorkOrderBasisDisplay = (workOrderBasis) => {
    return WORK_ORDER_BASIS_LABELS[workOrderBasis] || workOrderBasis || "-";
};

const STATUS_OPTIONS = [
    { value: "25% Completed", label: "25% Completed", color: "#FFC000" },
    { value: "50% Completed", label: "50% Completed", color: "#FFFF00" },
    { value: "75% Completed", label: "In Progress", color: "#FFFFCC" },
    { value: "Completed", label: "Submitted", color: "#7EAC87" },
    { value: "Cancelled", label: "Cancelled", color: "#CB6F6F" },
    { value: "Failed/Incomplete", label: "Failed/ Incomplete", color: "#CB6F6F" },
];

const DEFAULT_COLUMN_WIDTHS = {
    nr: 50,
    taskTitle: 100,
    priority: 30,
    responsible: 50,
    acceptanceStatus: 40,
    allocatedDate: 130,
    dueDate: 40,
    completionDate: 140,
    completionChain: 80,
    status: 45,
    attachments: 220,
    comments: 200,
    closeStatus: 30,
    closeOutComments: 300,
    allocatedBy: 50,
    uniqueID: 80,
    site: 60,
    mainArea: 70,
    subArea: 70,
    department: 80,
    departmentCode: 70,
    accountableParty: 120,
    responsibleParty: 120,
    assetType: 80,
    assetModel: 90,
    assetNumber: 90,
    frequency: 70,
    workOrderType: 90,
    workOrderBasis: 100,
    ppe: 160,
    handTools: 160,
    materials: 160,
    hazards: 140,
    action: 90,
};

const COLUMN_SIZE_LIMITS = {
    nr: { min: 50, max: 50 },
    taskTitle: { min: 70, max: 600 },
    priority: { min: 30, max: 200 },
    responsible: { min: 50, max: 400 },
    acceptanceStatus: { min: 40, max: 300 },
    allocatedDate: { min: 100, max: 260 },
    allocatedBy: { min: 50, max: 300 },
    dueDate: { min: 40, max: 260 },
    completionDate: { min: 100, max: 260 },
    completionChain: { min: 80, max: 420 },
    status: { min: 45, max: 260 },
    attachments: { min: 180, max: 420 },
    comments: { min: 150, max: 700 },
    closeStatus: { min: 30, max: 260 },
    closeOutComments: { min: 200, max: 700 },
    action: { min: 90, max: 90 },
    uniqueID: { min: 30, max: 300 },
    site: { min: 50, max: 300 },
    mainArea: { min: 50, max: 300 },
    subArea: { min: 50, max: 300 },
    department: { min: 60, max: 300 },
    departmentCode: { min: 50, max: 260 },
    accountableParty: { min: 80, max: 400 },
    responsibleParty: { min: 80, max: 400 },
    assetType: { min: 60, max: 300 },
    assetModel: { min: 60, max: 300 },
    assetNumber: { min: 60, max: 300 },
    frequency: { min: 50, max: 260 },
    workOrderType: { min: 70, max: 300 },
    workOrderBasis: { min: 70, max: 300 },
    ppe: { min: 120, max: 420 },
    handTools: { min: 120, max: 420 },
    materials: { min: 120, max: 420 },
    hazards: { min: 100, max: 300 },
};

const getColumnsForView = (view) => {
    return ALL_COLUMNS.filter(col => !col.hidden && (col.views === "both" || col.views === view));
};

const getDefaultShowColumns = (view) => {
    return getColumnsForView(view)
        .filter(col => {
            if (!col.collapsed) return true;
            if (col.collapsedFor === "both") return false;
            if (col.collapsedFor === view) return false;
            return true;
        })
        .map(col => col.id);
};

const COMPLETED_NOT_CLOSED_COLOR = "#7EAC87"; // light yellow
const COMPLETED_CLOSED_COLOR = "#7EAC87"; // green

const getStatusColor = (status, closeStatus) => {
    if (status === "Completed") {
        return closeStatus ? COMPLETED_CLOSED_COLOR : COMPLETED_NOT_CLOSED_COLOR;
    }
    const match = STATUS_OPTIONS.find(o => o.value === status);
    return match ? match.color : "transparent";
};

const getStatusTextColor = (status, closeStatus) => {
    if (status === "Completed") {
        return closeStatus ? "#FFFFFF" : "#FFFFFF";
    }
    return (status === "Cancelled" || status === "Failed/Incomplete") ? "#FFFFFF" : "#000000";
};

const getPriorityStyle = (priority) => {
    const match = PRIORITY_OPTIONS.find(o => o.value === priority);
    return match
        ? { backgroundColor: match.color, color: match.textColor }
        : {};
};

const normalizeTask = (task) => ({
    ...task,
    _rawResponsible: task?.responsible || "",
    _rawAllocatedBy: task?.allocatedBy || "",
    // ── _isPendingRepeating: true when this row is a future repeating template ─
    _isPendingRepeating: task?._isPendingRepeating || false,
    responsible: task?.responsible?.username || task?.responsible || "",
    // If allocatedBy is null (system task) we fall through to "" so the cell
    // renderer can display "System" instead.
    allocatedBy: task?.allocatedBy?.username || task?.allocatedBy || task?.sourceSystem || "",
    prevResponsibleName: task?.prevResponsibleName || "",
    allocatedDate: task?.allocatedDate ? String(task.allocatedDate).slice(0, 10) : "",
    dueDate: task?.dueDate ? (() => {
        const d = new Date(task.dueDate);
        if (isNaN(d.getTime())) return String(task.dueDate).slice(0, 10);
        const gmt2 = new Date(d.getTime() + 2 * 60 * 60 * 1000);
        return gmt2.toISOString().slice(0, 10);
    })() : "",
    completionDate: task?.completionDate ? String(task.completionDate).slice(0, 10) : "",
    acceptanceDate: task?.acceptanceDate ? String(task.acceptanceDate).slice(0, 10) : "",
    closeOutDate: task?.closeOutDate ? String(task.closeOutDate).slice(0, 10) : "",
    _rawAttachments: Array.isArray(task?.attachments) ? task.attachments : [],
    attachments: Array.isArray(task?.attachments)
        ? task.attachments.map(f => f?.fileName || f?.name || f)
        : [],
    // ── PPE / Hand Tools / Materials — flattened to plain string lists for
    // the bullet-list cell renderers. Raw hazardsControls kept for a future
    // "Download Hazard table" export.
    ppe: Array.isArray(task?.PPEItems)
        ? task.PPEItems.map(i => i?.ppe).filter(Boolean)
        : [],
    handTools: Array.isArray(task?.HandTools)
        ? task.HandTools.map(i => i?.tool).filter(Boolean)
        : [],
    materials: Array.isArray(task?.Materials)
        ? task.Materials.map(i => i?.mat).filter(Boolean)
        : [],
    _rawHazardsControls: Array.isArray(task?.hazardsControls) ? task.hazardsControls : [],
    // allocatedByName used for display: null allocatedBy → "System"
    allocatedByName: task?.allocatedBy?.username || task?.allocatedBy || "",
    closeOutComments: task?.closeOutComments || "",
    taskTitle: task?.taskTitle || "",
    priority: task?.priority || "",
    site: task?.site || "",
    mainArea: task?.mainArea || "",
    subArea: task?.subArea || "",
    department: task?.department || "",
    departmentCode: task?.departmentCode || "",
    accountableParty: task?.accountableParty || "",
    responsibleParty: task?.responsibleParty || "",
    assetType: task?.assetType || "",
    assetModel: task?.assetModel || "",
    assetNumber: task?.assetNumber || "",
    frequency: task?.frequency || "",
    workOrderType: task?.workOrderType || "",
    workOrderBasis: task?.workOrderBasis || "",
    acceptanceStatus: task?.acceptanceStatus || "",
    // No more manual/auto-filled distinction now that filledManual is gone -
    // always false so downstream row styling/action gating treats every row
    // the same way a manually-filled one used to be treated.
    isTagged: false,
    uniqueID: task?.uniqueID || "",
});

const WorkManagement = () => {
    const [view, setView] = useState("viewer");

    const [tasks, setTasks] = useState([]);
    const [token, setToken] = useState("");
    const navigate = useNavigate();
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const access = getCurrentUser();
    const scrollerRef = useRef(null);
    const tbodyRef = useRef(null);
    const DRAG_THRESHOLD_PX = 6;
    const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

    const [searchQuery, setSearchQuery] = useState("");
    const [statusTab, setStatusTab] = useState("All");
    const DEFAULT_SORT = { colId: null, direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
    const [activeExcelFilters, setActiveExcelFilters] = useState({});
    const [loading, setLoading] = useState(true);

    const [excelFilter, setExcelFilter] = useState({
        open: false, colId: null, anchorRect: null,
        pos: { top: 0, left: 0, width: 0 },
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const excelPopupRef = useRef(null);

    const [showAddTaskPopup, setShowAddTaskPopup] = useState(false);
    const [showAddRepeatingTaskPopup, setShowAddRepeatingTaskPopup] = useState(false);
    const [deleteTaskPopup, setDeleteTaskPopup] = useState({ open: false, task: null, taskName: "" });
    const [closeTaskPopup, setCloseTaskPopup] = useState({ open: false, task: null, taskName: "" });
    const [reopenTaskPopup, setReopenTaskPopup] = useState({ open: false, task: null, taskName: "" });
    const [showModifyAllocatedTaskPopup, setShowModifyAllocatedTaskPopup] = useState(false);
    const [selectedAllocatedTask, setSelectedAllocatedTask] = useState(null);
    const [closingTaskIds, setClosingTaskIds] = useState(new Set());
    const [reopeningTaskIds, setReopeningTaskIds] = useState(new Set());
    const [categoryTab, setCategoryTab] = useState("My Work Orders");

    const [showModifyPopup, setShowModifyPopup] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const [showColumns, setShowColumns] = useState(() => getDefaultShowColumns("viewer"));
    const [showColumnSelector, setShowColumnSelector] = useState(false);

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

    const filterMenuTimerRef = useRef(null);
    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const [acceptTaskPopup, setAcceptTaskPopup] = useState({ open: false, task: null });
    const [delegateTaskPopup, setDelegateTaskPopup] = useState({ open: false, task: null });
    const [reassignWorkOrderPopup, setReassignWorkOrderPopup] = useState({ open: false, task: null });
    const [previewTaskPopup, setPreviewTaskPopup] = useState({ open: false, task: null });
    // "My Work Orders" (view === "viewer") only - the faEdit icon in the
    // action column opens this so the responsible person can populate/edit
    // an accepted work order's action fields from the desktop.
    const [populateTaskPopup, setPopulateTaskPopup] = useState({ open: false, task: null });
    const [hoveredTaskId, setHoveredTaskId] = useState(null);
    const [dueDateVal, setDueDateVal] = useState(30);
    const [isTaskDueDatePopupOpen, setIsTaskDueDatePopupOpen] = useState(false);

    // ── View switch ──────────────────────────────────────────────────────────
    const switchView = (nextView) => {
        setView(nextView);
        // closedOut uses viewer-style columns
        const colView = nextView === "closedOut" ? "viewer" : nextView;
        setShowColumns(getDefaultShowColumns(colView));
        setActiveExcelFilters({});
        setSortConfig(DEFAULT_SORT);
        setSearchQuery("");
        widthsInitializedRef.current = false;
        setHasFittedOnce(false);
        setTableWidth(null);
        setColumnWidths({ ...DEFAULT_COLUMN_WIDTHS });
    };

    // ── Columns available for current view ───────────────────────────────────
    const availableColumns = useMemo(() => getColumnsForView(view === "closedOut" ? "viewer" : view), [view]);
    const allColumnIds = useMemo(() => availableColumns.map(c => c.id), [availableColumns]);

    // ── Fetch ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) setToken(storedToken);
    }, [navigate]);

    useEffect(() => {
        const saved = localStorage.getItem("highlightWorkOrderDueDates");
        if (saved && !isNaN(saved) && Number(saved) > 0) {
            setDueDateVal(Number(saved));
        } else {
            localStorage.setItem("highlightWorkOrderDueDates", "30");
            setDueDateVal(30);
        }
    }, []);

    useEffect(() => { fetchTasks(); }, [view]);

    const fetchTasks = async () => {
        setLoading(true);

        const storedToken = localStorage.getItem("token");
        if (!storedToken) {
            setLoading(false);
            return;
        }

        try {
            if (view === "allocator") {
                // /all/open — allocated tasks excluding closed-out ones
                const response = await fetch(`${process.env.REACT_APP_URL}/api/workOrderTasks/all/open`, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                });

                if (!response.ok) throw new Error("Failed to load tasks");

                const data = await response.json();
                const raw = data?.tasks ?? [];

                const normalised = raw.map(normalizeTask);

                normalised.sort((a, b) =>
                    (a.taskTitle || "").localeCompare(
                        b.taskTitle || "",
                        undefined,
                        { sensitivity: "base" }
                    )
                );

                setTasks(normalised);
            } else if (view === "closedOut") {
                // /closed — tasks (responsible or allocator) that are closed out
                const response = await axios.get(`${process.env.REACT_APP_URL}/api/workOrderTasks/closed`, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                });

                const raw = response.data?.tasks ?? [];
                const normalised = raw.map(t => ({
                    ...normalizeTask(t),
                    _isAllocator: t._isAllocator || false,
                    _isResponsible: t._isResponsible || false,
                }));

                normalised.sort((a, b) =>
                    (a.dueDate || "").localeCompare(b.dueDate || "") ||
                    (a.taskTitle || "").localeCompare(
                        b.taskTitle || "",
                        undefined,
                        { sensitivity: "base" }
                    )
                );

                setTasks(normalised);
            } else {
                // ── viewer: /my/open excludes closed-out tasks ──
                const response = await axios.get(`${process.env.REACT_APP_URL}/api/workOrderTasks/my/open`, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                });

                const raw = response.data?.tasks ?? [];

                // normalizeTask fills in display-friendly fields for each row
                const normalised = raw.map(normalizeTask);

                normalised.sort((a, b) =>
                    (a.dueDate || "").localeCompare(b.dueDate || "") ||
                    (a.taskTitle || "").localeCompare(
                        b.taskTitle || "",
                        undefined,
                        { sensitivity: "base" }
                    )
                );

                console.log("Fetched tasks:", normalised);

                setTasks(normalised);
            }
        } catch (error) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(error.message || "Failed to load tasks.");
        } finally {
            setLoading(false);
        }
    };

    // ── Allocator actions ────────────────────────────────────────────────────
    const handleOpenModifyAllocatedTaskPopup = (task) => {
        if (task?.status === "Cancelled") {
            toast.warn("Cancelled work orders cannot be modified.", {
                autoClose: 3000,
                closeButton: false,
            });
            return;
        }

        if (task?.closeStatus) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.info("You cannot edit this work order because it is closed out.", { autoClose: 3000, closeButton: false });
            return;
        }
        setSelectedAllocatedTask({
            ...task,
            responsible: task?._rawResponsible || task?.responsible || "",
            allocatedBy: task?._rawAllocatedBy || task?.allocatedBy || "",
            attachments: task?._rawAttachments || task?.attachments || [],
        });
        setShowModifyAllocatedTaskPopup(true);
    };
    const handleCloseModifyAllocatedTaskPopup = () => {
        setShowModifyAllocatedTaskPopup(false);
        setSelectedAllocatedTask(null);
    };

    const handleAcceptTask = async (taskId) => {
        const storedToken = localStorage.getItem("token");
        if (!storedToken || !taskId) return;
        // Find task to get its source
        const task = tasks.find(t => t._id === taskId);
        try {
            const response = await fetch(
                `${taskApiBase()}/${taskId}/accept`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${storedToken}` },
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Failed to accept task");
            fetchTasks();
            toast.success("Work Order accepted successfully.", { autoClose: 2000, closeButton: false });
        } catch (error) {
            toast.error(error.message || "Failed to accept task.", { autoClose: 3000, closeButton: false });
        }
    };

    // Called when DelegateTaskPopup succeeds
    const handleTaskDelegated = (updatedTask) => {
        fetchTasks();
    };

    const openDeleteTaskPopup = (task) => {
        setDeleteTaskPopup({
            open: true,
            task,
            taskName: task?.taskTitle || "",
        });
    };

    const closeDeleteTaskPopup = () => setDeleteTaskPopup({ open: false, task: null, taskName: "" });
    const openCloseTaskPopup = (task) => setCloseTaskPopup({ open: true, task, taskName: task?.taskTitle || "" });
    const closeCloseTaskPopup = () => setCloseTaskPopup({ open: false, task: null, taskName: "" });
    const openReopenTaskPopup = (task) => setReopenTaskPopup({ open: true, task, taskName: task?.taskTitle || "" });
    const closeReopenTaskPopup = () => setReopenTaskPopup({ open: false, task: null, taskName: "" });
    const openPreviewTaskPopup = (task) => setPreviewTaskPopup({ open: true, task });
    const closePreviewTaskPopup = () => setPreviewTaskPopup({ open: false, task: null });
    // "Close Out Task" inside the preview popup doesn't close anything
    // itself - it just closes the preview and hands off to the same
    // CloseAllocatedWorkOrder confirmation popup the closeStatus checkbox
    // already uses elsewhere in this table.
    const handlePreviewCloseOut = () => {
        const task = previewTaskPopup.task;
        closePreviewTaskPopup();
        if (task) openCloseTaskPopup(task);
    };
    const openPopulateTaskPopup = (task) => setPopulateTaskPopup({ open: true, task });
    const closePopulateTaskPopup = () => {
        setPopulateTaskPopup({ open: false, task: null });
        fetchTasks();
    }
    // Refreshes the table once a work order has actually been submitted
    // from the popup (Save Progress alone doesn't need this - the row's
    // status only meaningfully changes on submit).
    const handlePopulateTaskSubmitted = () => {
        fetchTasks();
    };

    const handleDeleteTask = async () => {
        const storedToken = localStorage.getItem("token");
        const task = deleteTaskPopup?.task;
        const taskId = task?._id;
        if (!storedToken || !taskId) return;
        try {
            let response;
            response = await fetch(`${taskApiBase()}/${taskId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${storedToken}` },
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.error || "Failed to delete task");
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success(
                data?.cancelled
                    ? "Accepted work order cancelled successfully."
                    : "Work Order deleted successfully",
                { autoClose: 3000, closeButton: false }
            );
            closeDeleteTaskPopup();
            fetchTasks();
        } catch (error) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Failed to delete work order", { autoClose: 3000, closeButton: false });
        }
    };

    const handleCloseTask = async (taskId, closeOutPayload = {}) => {
        if (closingTaskIds.has(taskId)) return;
        setClosingTaskIds(prev => new Set(prev).add(taskId));
        // Find the task to determine its source
        const task = tasks.find(t => t._id === taskId);
        // closeOutPayload comes straight from CloseAllocatedWorkOrder's onConfirm:
        // { closeOutComments, accountableSignature: { date, signature } }.
        // No username is included here - the server always stamps that (and
        // re-stamps the date) from the authenticated user, never from the
        // request body, so it can't be spoofed as someone else.
        const { closeOutComments = "", accountableSignature } = closeOutPayload;
        try {
            const storedToken = localStorage.getItem("token");
            const response = await fetch(`${taskApiBase()}/${taskId}/close`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${storedToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ closeOutComments, accountableSignature }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Failed to close task");
            setTasks(prev => prev.map(t =>
                t._id === taskId
                    ? {
                        ...t, closeStatus: true, closeOutComments: data.task?.closeOutComments ?? closeOutComments,
                        completionDate: data.task?.completionDate ? String(data.task.completionDate).slice(0, 10) : t.completionDate
                    }
                    : t
            ));
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Work order closed out successfully.", { autoClose: 2000, closeButton: false });
        } catch (error) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(error.message || "Failed to close task.", { autoClose: 3000, closeButton: false });
        } finally {
            setClosingTaskIds(prev => { const next = new Set(prev); next.delete(taskId); return next; });
        }
    };

    const handleReopenTask = async (taskId, message) => {
        if (reopeningTaskIds.has(taskId)) return;
        setReopeningTaskIds(prev => new Set(prev).add(taskId));
        const task = tasks.find(t => t._id === taskId);
        try {
            const storedToken = localStorage.getItem("token");
            const response = await fetch(`${taskApiBase()}/${taskId}/reopen`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${storedToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ reopenReason: message }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Failed to reopen task");
            setTasks(prev => prev.map(t => t._id === taskId ? { ...t, closeStatus: false, completionDate: "" } : t));
            fetchTasks();
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Work order reopened successfully.", { autoClose: 2000, closeButton: false });
        } catch (error) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(error.message || "Failed to reopen task.", { autoClose: 3000, closeButton: false });
        } finally {
            setReopeningTaskIds(prev => { const next = new Set(prev); next.delete(taskId); return next; });
        }
    };

    // ── Viewer actions ───────────────────────────────────────────────────────
    const handleOpenModifyPopup = (task) => {
        if (task?.status === "Cancelled") {
            toast.warn("Cancelled work orders cannot be modified.", {
                autoClose: 3000,
                closeButton: false,
            });
            return;
        }

        if (task.closeStatus) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.info("This work order has been closed out and can no longer be modified.", { autoClose: 3000, closeButton: false });
            return;
        }
        // Tasks need explicit acceptance before the responsible person can act on them
        if (task.acceptanceStatus !== "Accepted") {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("You can only modify work orders that you have accepted.", { autoClose: 3000, closeButton: false });
            return;
        }
        setSelectedTask(task);
        setShowModifyPopup(true);
    };
    const handleCloseModifyPopup = () => { setShowModifyPopup(false); setSelectedTask(null); };
    const handleTaskSaved = (updatedTask) => {
        fetchTasks();
    };


    // ── Download ─────────────────────────────────────────────────────────────
    const handleDownloadAttachment = async (task, attachmentId, fileName, attachmentType = "attachments") => {
        const storedToken = localStorage.getItem("token");
        const taskId = task._id;
        if (!storedToken || !taskId || !attachmentId) return;
        try {
            const response = await fetch(
                `${taskApiBase()}/${taskId}/${attachmentType}/${attachmentId}/download`,
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

    const handleDownloadHazardTable = async (task) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/workOrderTasks/${task._id}/hazards-pdf`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error("Failed to download hazard table");

            const blob = await response.blob();
            const fileName = `ComplianceHub_Hazards_${(task.taskTitle || "task")
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase()}.pdf`;

            saveAs(blob, fileName);
        } catch (err) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Failed to download hazard table. Please try again.", { autoClose: 3000, closeButton: false });
        }
    };

    const handleDownloadJobCard = async (task) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/workOrderTasks/${task._id}/job-card/pdf`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to download job card");
            }

            const blob = await response.blob();

            const fileName = `ComplianceHub_Job_Card_${(task.taskTitle || "task")
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase()}.pdf`;

            saveAs(blob, fileName);
        } catch (err) {
            console.error(err);
            toast.error("Failed to download job card", {
                autoClose: 3000,
                closeButton: false,
            });
        }
    };

    // ── Work Order Summary PDF — separate from the job card above; shows
    // Work Order Management info (Accountable/Responsible Party, Due Date,
    // Priority) plus Status and Closeout Status. ─────────────────────────────
    const handleDownloadWorkOrderSummary = async (task) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/workOrderTasks/${task._id}/pdf`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to download work order summary");
            }

            const blob = await response.blob();

            const fileName = `ComplianceHub_${(task.taskTitle || "work_order")
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase()}.pdf`;

            saveAs(blob, fileName);
        } catch (err) {
            console.error(err);
            toast.error("Failed to download work order summary", {
                autoClose: 3000,
                closeButton: false,
            });
        }
    };

    // ── Work Order Results PDF — separate from the summary above; used for
    // the "Work Orders Assigned" (allocator) and "Closed Out Work Orders"
    // views, where what's needed is what was actually submitted for each
    // action field, not the blank template. Hits GET /:id/results-pdf. ───────
    const handleDownloadWorkOrderResults = async (task) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/workOrderTasks/${task._id}/results-pdf`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to download work order results");
            }

            const blob = await response.blob();

            const fileName = `ComplianceHub_${(task.taskTitle || "work_order")
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase()}_results.pdf`;

            saveAs(blob, fileName);
        } catch (err) {
            console.error(err);
            toast.error("Failed to download work order results", {
                autoClose: 3000,
                closeButton: false,
            });
        }
    };

    // ── Drag-to-scroll ───────────────────────────────────────────────────────
    const onNativeDragStart = (e) => e.preventDefault();

    const onRowPointerDown = (e) => {
        if (
            e.target.closest(".title-task-clickable") ||
            e.target.closest(".popup-anchor") ||
            e.target.closest(".rca-action-btn") ||
            e.target.closest(".risk-control-attributes-action-cell") ||
            e.target.closest("button") || e.target.closest("a") ||
            e.target.closest("input") || e.target.closest("textarea") ||
            e.target.closest("select")
        ) return;

        const tr = e.target.closest("tr");
        if (!tr || !scrollerRef.current) return;
        drag.current = { active: true, moved: false, startX: e.clientX, startLeft: scrollerRef.current.scrollLeft };
        tr.setPointerCapture?.(e.pointerId);
    };

    useEffect(() => {
        if (!hoveredTaskId) return;

        const closeTaskPopup = (e) => {
            if (!e.target.closest(".popup-anchor")) {
                setHoveredTaskId(null);
            }
        };

        document.addEventListener("mousedown", closeTaskPopup);
        window.addEventListener("scroll", closeTaskPopup, true);

        return () => {
            document.removeEventListener("mousedown", closeTaskPopup);
            window.removeEventListener("scroll", closeTaskPopup, true);
        };
    }, [hoveredTaskId]);

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

    // ── Filter / Sort ────────────────────────────────────────────────────────
    const getFilterValuesForCell = (row, colId, index) => {
        if (colId === "nr") return [String(index + 1)];
        if (colId === "status") return [getStatusDisplay(row.status)];
        if (colId === "closeStatus") return [row.closeStatus ? "Closed Out" : "Open"];
        if (colId === "attachments") return [Array.isArray(row.attachments) && row.attachments.length > 0 ? "Has Attachments" : "No Attachments"];
        if (colId === "ppe") return Array.isArray(row.ppe) && row.ppe.length > 0 ? row.ppe : ["-"];
        if (colId === "handTools") return Array.isArray(row.handTools) && row.handTools.length > 0 ? row.handTools : ["-"];
        if (colId === "materials") return Array.isArray(row.materials) && row.materials.length > 0 ? row.materials : ["-"];
        if (colId === "hazards") return [Array.isArray(row._rawHazardsControls) && row._rawHazardsControls.length > 0 ? "Has Hazards" : "N/A"];
        // allocatedBy: null becomes "System" for filtering
        if (colId === "allocatedBy") return [row.allocatedBy || "System"];
        // completionChain: expose each individual date (sent/accepted/executed/closed)
        // as its own filterable value so the Excel-style filter popup can find and
        // select on any date within the chain, not just the combined cell text.
        if (colId === "completionChain") {
            const dates = [row.allocatedDate, row.acceptanceDate, row.completionDate, row.closeOutDate]
                .filter(v => v && String(v).trim() !== "")
                .map(v => String(v).trim());
            return dates.length > 0 ? Array.from(new Set(dates)) : ["-"];
        }
        const val = row[colId];
        return [val ? String(val).trim() : "-"];
    };

    const getAvailableOptions = (colId) => {
        let filtered = [...tasks];
        if (searchQuery) {
            const lq = searchQuery.toLowerCase();
            filtered = filtered.filter(c => (c.taskTitle || "").toLowerCase().includes(lq));
        }
        for (const [fColId, sel] of Object.entries(activeExcelFilters)) {
            if (fColId === colId || !Array.isArray(sel)) continue;
            filtered = filtered.filter((row, idx) => getFilterValuesForCell(row, fColId, idx).some(v => sel.includes(v)));
        }
        return Array.from(new Set(filtered.flatMap((r, i) => getFilterValuesForCell(r, colId, i))))
            .sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
    };

    const openExcelFilterPopup = (colId, e) => {
        if (colId === "action") return;
        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();
        const values = getAvailableOptions(colId);
        const existing = activeExcelFilters[colId];
        setExcelSelected(new Set(existing && Array.isArray(existing) ? existing : values));
        setExcelSearch("");
        setExcelFilter({
            open: true, colId, anchorRect: rect,
            pos: { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(220, rect.width) },
        });
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev =>
            prev?.colId === colId && prev?.direction === direction ? DEFAULT_SORT : { colId, direction }
        );
    };

    const processedTasks = useMemo(() => {
        let current = tasks.filter(t => t._rawAllocatedBy != null && t._rawAllocatedBy !== "");
        if (searchQuery) {
            const lq = searchQuery.toLowerCase();
            current = current.filter(c => (c.taskTitle || "").toLowerCase().includes(lq));
        }
        current = current.filter((row, idx) => {
            for (const [colId, sel] of Object.entries(activeExcelFilters)) {
                if (!Array.isArray(sel)) continue;
                if (!getFilterValuesForCell(row, colId, idx).some(v => sel.includes(v))) return false;
            }
            return true;
        });

        const normalize = (v) => { const s = v == null ? "" : String(v).trim(); return s === "" ? "(Blanks)" : s; };
        const compareText = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
        const parseDateValue = (value) => {
            if (!value || value === "(Blanks)") return null;
            const d = new Date(value);
            return Number.isNaN(d.getTime()) ? null : d.getTime();
        };

        current.sort((a, b) => {
            const hasActiveColumnSort = !!sortConfig?.colId;

            // Only keep closed tasks at the bottom in the default sort.
            // Do not override Excel column sorting.
            if (!hasActiveColumnSort && Boolean(a.closeStatus) !== Boolean(b.closeStatus)) {
                return Boolean(a.closeStatus) ? 1 : -1;
            }

            if (a.isTagged !== b.isTagged) return a.isTagged ? -1 : 1;

            if (!sortConfig?.colId) {
                const dA = parseDateValue(a?.dueDate), dB = parseDateValue(b?.dueDate);
                if (dA === null && dB !== null) return 1;
                if (dA !== null && dB === null) return -1;
                if (dA !== null && dB !== null && dA !== dB) return dA - dB;
                return compareText(normalize(a?.taskTitle), normalize(b?.taskTitle));
            }

            const { colId, direction } = sortConfig;
            const dir = direction === "desc" ? -1 : 1;

            if (["allocatedDate", "dueDate", "completionDate"].includes(colId)) {
                const vA = parseDateValue(a?.[colId]), vB = parseDateValue(b?.[colId]);
                if (vA === null && vB !== null) return 1;
                if (vA !== null && vB === null) return -1;
                if (vA !== null && vB !== null && vA !== vB) return (vA - vB) * dir;
            } else if (colId === "completionChain") {
                const vA = parseDateValue(a?.allocatedDate), vB = parseDateValue(b?.allocatedDate);
                if (vA === null && vB !== null) return 1;
                if (vA !== null && vB === null) return -1;
                if (vA !== null && vB !== null && vA !== vB) return (vA - vB) * dir;
            } else {
                const vA =
                    colId === "closeStatus"
                        ? a.closeStatus ? "Closed Out" : "Open"
                        : normalize(a?.[colId]);

                const vB =
                    colId === "closeStatus"
                        ? b.closeStatus ? "Closed Out" : "Open"
                        : normalize(b?.[colId]);

                if (vA === "(Blanks)" && vB !== "(Blanks)") return 1;
                if (vA !== "(Blanks)" && vB === "(Blanks)") return -1;

                const r = compareText(vA, vB) * dir;
                if (r !== 0) return r;
            }

            const dA = parseDateValue(a?.dueDate), dB = parseDateValue(b?.dueDate);
            if (dA === null && dB !== null) return 1;
            if (dA !== null && dB === null) return -1;
            if (dA !== null && dB !== null && dA !== dB) return dA - dB;

            return compareText(normalize(a?.taskTitle), normalize(b?.taskTitle));
        });

        return current;
    }, [tasks, searchQuery, activeExcelFilters, sortConfig]);

    // ── Column selector ──────────────────────────────────────────────────────
    const toggleColumn = (columnId) => {
        if (columnId === "nr" || columnId === "action") return;
        setShowColumns(prev =>
            prev.includes(columnId) ? prev.filter(id => id !== columnId) : [...prev, columnId]
        );
    };
    const toggleAllColumns = (selectAll) => {
        setShowColumns(selectAll ? allColumnIds : ["nr", "action"]);
    };
    const areAllColumnsSelected = () => allColumnIds.every(id => showColumns.includes(id));

    useEffect(() => {
        if (!showColumnSelector) return;
        const handleClickOutside = (e) => {
            if (!e.target.closest(".column-selector-popup") && !e.target.closest(".top-right-button-control-att-3")) {
                setShowColumnSelector(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showColumnSelector]);

    // ── Column resize ────────────────────────────────────────────────────────
    const getDisplayColumns = () => showColumns;

    const startColumnResize = (e, columnId) => {
        e.preventDefault(); e.stopPropagation();
        isResizingRef.current = true;
        resizingColRef.current = columnId;
        resizeStartXRef.current = e.clientX;
        const th = e.target.closest("th");
        resizeStartWidthRef.current = columnWidths[columnId] ?? (th ? th.getBoundingClientRect().width : 150);
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
        const defaultCols = getDefaultShowColumns(view === "closedOut" ? "viewer" : view);
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

    // ── Excel filter popup effects ────────────────────────────────────────────
    useEffect(() => {
        if (!excelFilter.open) return;
        const handleClickOutside = (e) => {
            if (!e.target.closest(".excel-filter-popup")) setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };
        const handleScroll = (e) => {
            if (!e.target.closest(".excel-filter-popup")) setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
        };
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        return () => { document.removeEventListener("mousedown", handleClickOutside); window.removeEventListener("scroll", handleScroll, true); };
    }, [excelFilter.open]);

    useEffect(() => {
        if (!excelFilter.open) return;
        const el = excelPopupRef.current;
        if (!el) return;
        const popupRect = el.getBoundingClientRect();
        const margin = 8;
        let newTop = excelFilter.pos.top, newLeft = excelFilter.pos.left;
        if (popupRect.bottom > window.innerHeight - margin) {
            const anchor = excelFilter.anchorRect;
            if (anchor) newTop = Math.max(margin, anchor.top - popupRect.height - 4);
        }
        if (popupRect.right > window.innerWidth - margin) newLeft = Math.max(margin, newLeft - (popupRect.right - (window.innerWidth - margin)));
        if (popupRect.left < margin) newLeft = margin;
        if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left)
            setExcelFilter(prev => ({ ...prev, pos: { ...prev.pos, top: newTop, left: newLeft } }));
    }, [excelFilter.open, excelFilter.pos, excelSearch]);

    // ── Filter menu ──────────────────────────────────────────────────────────
    const hasActiveFilters = useMemo(() => {
        return Object.keys(activeExcelFilters).length > 0 || sortConfig.colId !== null || sortConfig.direction !== "asc";
    }, [activeExcelFilters, sortConfig]);

    const openFilterMenu = (e) => {
        if (!hasActiveFilters) return;
        if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
        setFilterMenu({ isOpen: true, anchorRect: e.currentTarget.getBoundingClientRect() });
    };
    const closeFilterMenuWithDelay = () => {
        filterMenuTimerRef.current = setTimeout(() => setFilterMenu(prev => ({ ...prev, isOpen: false })), 200);
    };
    const handleClearFilters = () => {
        setActiveExcelFilters({});
        setSortConfig({ colId: null, direction: "asc" });
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getFilterBtnClass = () => showResetButton ? "top-right-button-control-att-3-new" : "top-right-button-control-att-2-new";

    const handleExportExcel = async () => {
        const COL_META = {
            nr: { width: 6, centre: true, headerGroup: "navy" },
            uniqueID: { width: 16, centre: true, headerGroup: "navy" },
            site: { width: 16, centre: true, headerGroup: "navy" },
            mainArea: { width: 18, centre: true, headerGroup: "navy" },
            subArea: { width: 18, centre: true, headerGroup: "navy" },
            department: { width: 20, centre: true, headerGroup: "navy" },
            departmentCode: { width: 16, centre: true, headerGroup: "navy" },
            accountableParty: { width: 22, centre: false, headerGroup: "navy" },
            responsibleParty: { width: 22, centre: false, headerGroup: "navy" },
            assetType: { width: 18, centre: true, headerGroup: "navy" },
            assetModel: { width: 18, centre: true, headerGroup: "navy" },
            assetNumber: { width: 18, centre: true, headerGroup: "navy" },
            frequency: { width: 16, centre: true, headerGroup: "navy" },
            workOrderType: { width: 18, centre: true, headerGroup: "navy" },
            workOrderBasis: { width: 18, centre: true, headerGroup: "navy" },
            taskTitle: { width: 28, centre: false, headerGroup: "navy" },
            priority: { width: 14, centre: true, headerGroup: "navy" },
            allocatedBy: { width: 20, centre: true, headerGroup: "grey2" },
            allocatedDate: { width: 18, centre: true, headerGroup: "grey2" },
            comments: { width: 35, centre: false, headerGroup: "grey2" },
            attachments: { width: 30, centre: false, headerGroup: "grey2" },
            responsible: { width: 20, centre: true, headerGroup: "grey2" },
            dueDate: { width: 14, centre: true, headerGroup: "grey2" },
            acceptanceStatus: { width: 20, centre: true, headerGroup: "grey1" },
            status: { width: 22, centre: true, headerGroup: "grey1" },
            completionDate: { width: 18, centre: true, headerGroup: "navy" },
            closeStatus: { width: 16, centre: true, headerGroup: "navy" },
            closeOutComments: { width: 35, centre: false, headerGroup: "navy" },
            ppe: { width: 28, centre: false, headerGroup: "grey2" },
            handTools: { width: 28, centre: false, headerGroup: "grey2" },
            materials: { width: 28, centre: false, headerGroup: "grey2" },
            hazards: { width: 22, centre: false, headerGroup: "grey2" },
        };

        const HEADER_BORDER = {
            top: { style: "thin", color: { argb: "FF002060" } },
            left: { style: "thin", color: { argb: "FF002060" } },
            bottom: { style: "thin", color: { argb: "FF002060" } },
            right: { style: "thin", color: { argb: "FF002060" } },
        };
        const HEADER_BORDER_GREY2 = {
            top: { style: "thin", color: { argb: "FFD9D9D9" } },
            left: { style: "thin", color: { argb: "FFD9D9D9" } },
            bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
            right: { style: "thin", color: { argb: "FFD9D9D9" } },
        };
        const HEADER_BORDER_GREY1 = {
            top: { style: "thin", color: { argb: "FFBFBFBF" } },
            left: { style: "thin", color: { argb: "FFBFBFBF" } },
            bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
            right: { style: "thin", color: { argb: "FFBFBFBF" } },
        };
        const HEADER_ALIGN = { horizontal: "center", vertical: "middle", wrapText: true };

        // Navy header (task info group) — white text on dark navy
        const HDR_NAVY_FONT = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        const HDR_NAVY_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF002060" } };

        // Grey2 header (originator group) — dark text on mid grey
        const HDR_GREY2_FONT = { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } };
        const HDR_GREY2_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9D9D9" } };

        // Grey1 header (responsible person group) — dark text on light grey
        const HDR_GREY1_FONT = { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } };
        const HDR_GREY1_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBFBFBF" } };

        const DATA_FONT = { name: "Arial", size: 10 };
        const DATA_BORDER = {
            top: { style: "thin", color: { argb: "FFBFBFBF" } },
            left: { style: "thin", color: { argb: "FFBFBFBF" } },
            bottom: { style: "thin", color: { argb: "FFBFBFBF" } },
            right: { style: "thin", color: { argb: "FFBFBFBF" } },
        };
        const DATA_ALIGN_C = { horizontal: "center", vertical: "middle", wrapText: true };
        const DATA_ALIGN_L = { horizontal: "left", vertical: "middle", wrapText: true };

        // Banner — exact gradient from the template (degree 0, theme:1 → FF002060)
        const BANNER_FILL = {
            type: "gradient", gradient: "angle", degree: 0,
            stops: [
                { position: 0, color: { theme: 1 } },
                { position: 1, color: { argb: "FF002060" } },
            ],
        };
        const BANNER_FONT = { name: "Arial", size: 11, bold: true, color: { theme: 0 } };
        const BANNER_ALIGN = { horizontal: "center", vertical: "middle", wrapText: true };

        // ── Build column list from what's currently visible ───────────────────
        const exportHeaders = availableColumns
            .filter(col => showColumns.includes(col.id) && col.id !== "action")
            .map(col => ({ id: col.id, title: col.title, meta: COL_META[col.id] ?? { width: 18, centre: false, headerGroup: "navy" } }));

        const SPACER = 2;                              // col B = index 2
        const bannerEnd = SPACER + exportHeaders.length - 1;

        try {
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet("Tasks");

            ws.views = [
                {
                    showGridLines: false,
                },
            ];

            ws.getColumn(1).width = 3.14;                 // col A narrow decriptio
            exportHeaders.forEach((hdr, i) => {
                ws.getColumn(SPACER + i).width = hdr.meta.width;
            });

            ws.getRow(1).height = 12;

            ws.getRow(2).height = 54;
            ws.mergeCells(2, SPACER, 2, bannerEnd);
            const banner = ws.getCell(2, SPACER);
            banner.value = {
                richText: [
                    { text: "ComplianceHub", font: { name: "Arial", size: 20, bold: true, color: { theme: 0 } } },
                    { text: "\n", font: { name: "Arial", size: 12, bold: true, color: { theme: 0 } } },
                    { text: "Task List", font: { name: "Arial", size: 12, bold: true, color: { theme: 0 } } },
                ],
            };
            banner.fill = BANNER_FILL;
            banner.alignment = BANNER_ALIGN;

            ws.getRow(3).height = 12;

            ws.getRow(4).height = 28;
            exportHeaders.forEach((hdr, i) => {
                const cell = ws.getCell(4, SPACER + i);
                cell.value = hdr.title;
                cell.alignment = HEADER_ALIGN;

                if (hdr.meta.headerGroup === "grey2") {
                    cell.font = HDR_GREY2_FONT;
                    cell.fill = HDR_GREY2_FILL;
                    cell.border = HEADER_BORDER_GREY2;
                } else if (hdr.meta.headerGroup === "grey1") {
                    cell.font = HDR_GREY1_FONT;
                    cell.fill = HDR_GREY1_FILL;
                    cell.border = HEADER_BORDER_GREY1;
                } else {
                    cell.font = HDR_NAVY_FONT;
                    cell.fill = HDR_NAVY_FILL;
                    cell.border = HEADER_BORDER;
                }
            });

            ws.views = [
                {
                    state: "frozen",
                    xSplit: 0,
                    ySplit: 4,
                    topLeftCell: "B5",
                    activeCell: "B5",
                    showGridLines: false,
                },
            ];

            ws.getRow(4).height = 36;

            processedTasks.forEach((row, rowIdx) => {
                const excelRow = ws.getRow(5 + rowIdx);
                let maxLines = 1;
                exportHeaders.forEach((hdr) => {
                    let val = "";
                    if (hdr.id === "nr") val = String(rowIdx + 1);
                    else if (hdr.id === "closeStatus") val = row.closeStatus ? "Closed Out" : "Open";
                    else if (hdr.id === "attachments") val = Array.isArray(row.attachments) && row.attachments.length > 0 ? row.attachments.join("\n") : "No files";
                    else if (hdr.id === "ppe") val = Array.isArray(row.ppe) && row.ppe.length > 0 ? row.ppe.join("\n") : "-";
                    else if (hdr.id === "handTools") val = Array.isArray(row.handTools) && row.handTools.length > 0 ? row.handTools.join("\n") : "-";
                    else if (hdr.id === "materials") val = Array.isArray(row.materials) && row.materials.length > 0 ? row.materials.join("\n") : "-";
                    else if (hdr.id === "hazards") val = Array.isArray(row._rawHazardsControls) && row._rawHazardsControls.length > 0 ? "Has Hazards" : "N/A";
                    else if (hdr.id === "workOrderBasis") val = getWorkOrderBasisDisplay(row.workOrderBasis);
                    else if (hdr.id === "status") {
                        val = getStatusDisplay(row.status);
                    }
                    else val = String(row[hdr.id] ?? "-");
                    // Estimate lines: count newlines + rough word-wrap estimate based on col width
                    const colWidthChars = (hdr.meta.width || 18) * 1.2; // approximate chars per line
                    const newlines = (val.match(/\n/g) || []).length;
                    const wrapLines = Math.ceil(val.replace(/\n/g, " ").length / colWidthChars);
                    const lines = newlines + Math.max(1, wrapLines);
                    if (lines > maxLines) maxLines = lines;
                });
                excelRow.height = Math.max(20, Math.min(maxLines * 15, 200));

                exportHeaders.forEach((hdr, colIdx) => {
                    const cell = excelRow.getCell(SPACER + colIdx);

                    let value;
                    if (hdr.id === "nr") {
                        value = rowIdx + 1;
                    } else if (hdr.id === "closeStatus") {
                        value = row.closeStatus ? "Closed Out" : "Open";
                    } else if (hdr.id === "attachments") {
                        const a = row.attachments;
                        value = Array.isArray(a) && a.length > 0 ? a.join("\n") : "No files";
                    } else if (hdr.id === "ppe") {
                        value = Array.isArray(row.ppe) && row.ppe.length > 0 ? row.ppe.join("\n") : "-";
                    } else if (hdr.id === "handTools") {
                        value = Array.isArray(row.handTools) && row.handTools.length > 0 ? row.handTools.join("\n") : "-";
                    } else if (hdr.id === "materials") {
                        value = Array.isArray(row.materials) && row.materials.length > 0 ? row.materials.join("\n") : "-";
                    } else if (hdr.id === "hazards") {
                        value = Array.isArray(row._rawHazardsControls) && row._rawHazardsControls.length > 0 ? "Has Hazards" : "N/A";
                    } else if (hdr.id === "workOrderBasis") {
                        value = getWorkOrderBasisDisplay(row.workOrderBasis);
                    } else {
                        const v = row[hdr.id];
                        value = (v === null || v === undefined || v === "") ? "-" : v;
                    }

                    cell.value = value;
                    cell.font = DATA_FONT;
                    cell.border = DATA_BORDER;
                    cell.alignment = hdr.meta.centre ? DATA_ALIGN_C : DATA_ALIGN_L;
                });
            });

            // ── Write to blob and trigger download ────────────────────────────
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const dateStr = new Date().toLocaleDateString("en-ZA", {
                day: "2-digit", month: "2-digit", year: "numeric",
                timeZone: "Africa/Johannesburg",
            }).replace(/\//g, ".");
            saveAs(blob, `ComplianceHub Task List.xlsx`);

        } catch (err) {
            console.error(err);
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Failed to export task list.", { autoClose: 3000, closeButton: false });
        }
    };

    const getDueDateClass = (dueDate, closeStatus) => {
        if (!dueDate) return "";
        if (closeStatus) return "";
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        const timeDiff = due - today;
        if (timeDiff < 0) return "review-past"; // actually overdue — red
        if (timeDiff <= dueDateVal * 24 * 60 * 60 * 1000) return "review-soon"; // approaching — yellow
        return "";
    };

    // ── Cell renderer ────────────────────────────────────────────────────────
    const renderCell = (col, row, index) => {
        switch (col.id) {
            case "nr":
                return <td key="nr" className="procCent" style={{ fontSize: "14px" }}>{index + 1}
                    {view === "allocator" ? (
                        <>
                            <button type="button" className="rca-action-btn" title="Reassign Work Order"
                                onClick={() => {
                                    if (row.status === "Completed") {
                                        toast.error("Submitted Tasks Cannot be reassigned", {
                                            closeButton: false,
                                            autoClose: 2000,
                                            style: { textAlign: 'center' }
                                        });
                                        return;
                                    }
                                    setReassignWorkOrderPopup({ open: true, task: row });
                                }}>
                                <FontAwesomeIcon icon={faEdit} style={{ fontSize: "14px", marginLeft: "5px" }} />
                            </button>
                        </>
                    ) : (
                        <>
                            {false && (<button
                                type="button"
                                className="rca-action-btn"
                                title={
                                    row.acceptanceStatus !== "Accepted"
                                        ? "You must accept this work order before editing"
                                        : "Modify Work Order Progress"
                                }
                                style={{
                                    opacity: row.acceptanceStatus !== "Accepted" ? 0.4 : 1,
                                    cursor: row.acceptanceStatus !== "Accepted" ? "not-allowed" : "pointer",
                                }}
                                onClick={() => {
                                    if (row.acceptanceStatus !== "Accepted") {
                                        toast.warn("You must accept this task before editing.", { autoClose: 3000, closeButton: false });
                                        return;
                                    }
                                    handleOpenModifyPopup({ ...row, attachments: row._rawAttachments });
                                }}
                            >
                                <FontAwesomeIcon icon={faEdit} style={{ fontSize: "14px", marginLeft: "5px" }} />
                            </button>
                            )}
                        </>
                    )}
                </td>;

            case "uniqueID":
                return <td key="uniqueID" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.uniqueID || "-"}</td>;

            case "site":
                return <td key="site" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.site || "-"}</td>;

            case "mainArea":
                return <td key="mainArea" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.mainArea || "-"}</td>;

            case "subArea":
                return <td key="subArea" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.subArea || "-"}</td>;

            case "department":
                return <td key="department" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.department || "-"}</td>;

            case "departmentCode":
                return <td key="departmentCode" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.departmentCode || "-"}</td>;

            case "accountableParty":
                return <td key="accountableParty" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.accountableParty || "-"}</td>;

            case "responsibleParty":
                return <td key="responsibleParty" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.responsibleParty || "-"}</td>;

            case "assetType":
                return <td key="assetType" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.assetType || "-"}</td>;

            case "assetModel":
                return <td key="assetModel" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.assetModel || "-"}</td>;

            case "assetNumber":
                return <td key="assetNumber" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.assetNumber || "-"}</td>;

            case "frequency":
                return <td key="frequency" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.frequency || "-"}</td>;

            case "workOrderType":
                return <td key="workOrderType" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.workOrderType || "-"}</td>;

            case "workOrderBasis":
                return <td key="workOrderBasis" className="backGrey procCent" style={{ fontSize: "14px" }}>{getWorkOrderBasisDisplay(row.workOrderBasis)}</td>;

            case "taskTitle":
                return (
                    <td
                        key="taskTitle"
                        style={{ fontSize: "14px" }}
                        className="gen-point title-task-clickable"
                        onClick={(e) => {
                            e.stopPropagation();
                            setHoveredTaskId(hoveredTaskId === row._id ? null : row._id);
                        }}
                    >
                        <div className="popup-anchor">
                            <span>{row.taskTitle || "-"}</span>
                        </div>
                    </td>
                );

            case "allocatedBy":
                // null allocatedBy means system-generated → display "System"
                return (
                    <td key="allocatedBy" className="backGrey procCent" style={{ fontSize: "14px" }}>
                        {row.allocatedBy}
                    </td>
                );

            case "priority":
                return (
                    <td key="priority" className="procCent" style={{ fontSize: "14px", fontWeight: "500", ...getPriorityStyle(row.priority) }}>
                        {row.priority || "-"}
                    </td>
                );

            case "responsible": {
                const displayResponsible = row.acceptanceStatus === "Delegated"
                    ? row.prevResponsible?.username
                    : row.responsible;
                return (
                    <td key="responsible" className="procCent" style={{ fontSize: "14px" }}>
                        {displayResponsible || "-"}
                    </td>
                );
            }

            case "acceptanceStatus": {
                // Viewer: map "Delegated" → "Pending" so the viewer only ever sees
                // "Accepted" or "Pending". Allocator always sees the real value.
                const displayStatus =
                    view === "viewer" && row.acceptanceStatus === "Delegated"
                        ? "Pending"
                        : row.acceptanceStatus;

                const isAccepted = displayStatus === "Accepted";

                return (
                    <td key="acceptanceStatus" className="procCent" style={{
                        fontSize: "14px",
                        backgroundColor: isAccepted ? "#7EAC87" : "white",
                        color: isAccepted ? "#fff" : "black",
                        borderLeft: "1px solid white", borderRight: "1px solid white"
                    }}>
                        {displayStatus || "-"}
                    </td>
                );
            }

            case "allocatedDate":
                return <td key="allocatedDate" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.allocatedDate || "-"}</td>;

            case "dueDate":
                return <td key="dueDate" className={`procCent ${getDueDateClass(row.dueDate, row.closeStatus)}`} style={{ fontSize: "14px" }}>{row.dueDate || "-"}</td>;

            case "completionDate":
                return <td key="completionDate" className="procCent" style={{ fontSize: "14px" }}>{row.completionDate || "-"}</td>;

            case "completionChain": {
                const chainRows = [
                    { label: "Sent", value: row.allocatedDate },
                    { label: "Accepted", value: row.acceptanceDate },
                    { label: "Executed", value: row.completionDate },
                    { label: "Closed Out", value: row.closeOutDate },
                ];
                return (
                    <td key="completionChain" style={{ fontSize: "14px", textAlign: "left" }}>
                        {chainRows.map((r, i) => (
                            <div key={r.label} style={{ marginBottom: i < chainRows.length - 1 ? "2px" : 0 }}>
                                <span style={{ fontWeight: "700" }}>{r.label}: </span>
                                <span style={{ fontWeight: "400" }}>{r.value || "N/A"}</span>
                            </div>
                        ))}
                    </td>
                );
            }

            case "status":
                // Read-only coloured cell for both views - the responsible
                // person no longer edits status directly here; it's driven
                // by their progress on the Populate Work Order screen.
                return (
                    <td key="status" className="procCent taskStatusSelect_a8f3c1" style={{ fontSize: "14px", backgroundColor: getStatusColor(row.status, row.closeStatus), color: getStatusTextColor(row.status, row.closeStatus), fontWeight: "500" }}>
                        {getStatusDisplay(row.status)}
                    </td>
                );

            case "attachments":
                return (
                    <td key="attachments" style={{ fontSize: "14px" }}>
                        {Array.isArray(row._rawAttachments) && row._rawAttachments.length > 0 ? (
                            row._rawAttachments.map((file, fi) => {
                                const fileName = file?.fileName || file?.name || row.attachments?.[fi] || "Attachment";
                                const attachmentId = file?._id;
                                return (
                                    <div key={`att-${fi}`}>
                                        <button type="button" title="Click to download"
                                            onClick={() => handleDownloadAttachment(row, attachmentId, fileName, "attachments")}
                                            disabled={!attachmentId}
                                            style={{ padding: 0, border: "none", background: "transparent", color: "#0B5ED7", textDecoration: "underline", cursor: attachmentId ? "pointer" : "not-allowed", fontSize: "14px", textAlign: "left" }}>
                                            {fileName}
                                        </button>
                                        {fi < row._rawAttachments.length - 1 && <hr style={{ margin: "4px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />}
                                    </div>
                                );
                            })
                        ) : <span>No files</span>}
                    </td>
                );

            case "comments":
                return <td key="comments" style={{ fontSize: "14px" }}>{row.comments || "-"}</td>;

            case "closeStatus": {
                const isAlreadyClosed = !!row.closeStatus;
                const isCompleted = row.status === "Completed";
                const isClosing = closingTaskIds.has(row._id);
                const isReopening = reopeningTaskIds.has(row._id);
                const isCancelled = row.status === "Cancelled";

                // ── Closed-out view — always a read-only "Closed Out" badge ──────────────
                // The reopen action now lives in the Action column as a restore icon.
                if (view === "closedOut") {
                    return (
                        <td key="closeStatus" className="procCent" style={{ fontSize: "14px", backgroundColor: "#7EAC87", color: "#fff", borderLeft: "1px solid white", borderRight: "1px solid white" }}>
                            Closed Out
                        </td>
                    );
                }

                // ── Viewer (responsible person) — read-only cell ──
                if (view === "viewer") {
                    return (
                        <td key="closeStatus" className="procCent" style={{
                            fontSize: "14px",
                            backgroundColor: isAlreadyClosed ? "#7EAC87" : "white",
                            color: isAlreadyClosed ? "white" : "black",
                            borderLeft: "1px solid white", borderRight: "1px solid white"
                        }}>
                            {isAlreadyClosed ? "Closed Out" : "Open"}
                        </td>
                    );
                }

                // ── Allocator view — interactive checkbox ──────────────────────────────
                const checkboxDisabled = isCancelled || (!isCompleted && !isAlreadyClosed) || isClosing || isReopening;

                return (
                    <td key="closeStatus" className="procCent" style={{ fontSize: "14px" }}>
                        <input type="checkbox" className="checkbox-inp-abbr"
                            checked={isAlreadyClosed}
                            disabled={checkboxDisabled && !isAlreadyClosed}
                            title={
                                isCancelled
                                    ? "Cancelled work orders cannot be closed out"
                                    : isAlreadyClosed
                                        ? "Click to reopen this work order"
                                        : !isCompleted
                                            ? "Work Order must be 'Completed' before closeout"
                                            : "Close out this work order"
                            }
                            style={{ cursor: (checkboxDisabled && !isAlreadyClosed) ? "not-allowed" : "pointer", opacity: (checkboxDisabled && !isAlreadyClosed) ? 0.4 : 1 }}
                            onChange={() => {
                                if (isCancelled) {
                                    toast.warn("Cancelled work order cannot be closed out.", { autoClose: 3000, closeButton: false });
                                    return;
                                }
                                if (isAlreadyClosed) { openReopenTaskPopup(row); }
                                else { if (!isCompleted || isClosing || isReopening) return; openCloseTaskPopup(row); }
                            }}
                        />
                    </td>
                );
            }

            case "closeOutComments":
                return <td key="closeOutComments" style={{ fontSize: "14px" }}>{row.closeOutComments || "-"}</td>;

            case "action":
                return (
                    <td key="action" className="risk-control-attributes-action-cell">
                        {view === "allocator" ? (
                            <>
                                {false && !row.isTagged && (
                                    <button
                                        type="button"
                                        className="rca-action-btn"
                                        title="Download Job Card"
                                        style={{ marginLeft: "5px" }}
                                        onClick={() => handleDownloadJobCard(row)}
                                    >
                                        <FontAwesomeIcon icon={faFilePdf} />
                                    </button>
                                )}
                                {row.status === "Completed" && (
                                    <button type="button" className="rca-action-btn" title="View Work Order Information"
                                        style={{ marginLeft: "5px" }} onClick={() => openPreviewTaskPopup(row)}>
                                        <FontAwesomeIcon icon={faEye} />
                                    </button>
                                )}
                                <button type="button" className="rca-action-btn" title="Download Work Order Summary"
                                    style={{ marginLeft: "5px" }} onClick={() => handleDownloadWorkOrderResults(row)}>
                                    <FontAwesomeIcon icon={faFilePdf} />
                                </button>
                                <button type="button" className="rca-action-btn" title="Delete Work Order"
                                    style={{ marginLeft: "5px" }} onClick={() => openDeleteTaskPopup(row)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </>
                        ) : view === "closedOut" ? (
                            <>
                                {false && !row.isTagged && row._isAllocator && (
                                    <button
                                        type="button"
                                        className="rca-action-btn"
                                        title="Download Job Card"
                                        style={{ marginLeft: "5px" }}
                                        onClick={() => handleDownloadJobCard(row)}
                                    >
                                        <FontAwesomeIcon icon={faFilePdf} />
                                    </button>
                                )}
                                <button type="button" className="rca-action-btn" title="Download Work Order Summary"
                                    style={{ marginLeft: "5px" }} onClick={() => handleDownloadWorkOrderResults(row)}>
                                    <FontAwesomeIcon icon={faFilePdf} />
                                </button>
                                {/* Restore/reopen — allocator (or both) only */}
                                {row._isAllocator === true && (() => {
                                    const isReopening = reopeningTaskIds.has(row._id);
                                    return (
                                        <button
                                            type="button"
                                            className="rca-action-btn"
                                            title="Restore (reopen) this work order"
                                            style={{
                                                marginLeft: "5px",
                                                cursor: isReopening ? "not-allowed" : "pointer",
                                                opacity: isReopening ? 0.4 : 1,
                                            }}
                                            disabled={isReopening}
                                            onClick={() => openReopenTaskPopup(row)}
                                        >
                                            <FontAwesomeIcon icon={faClockRotateLeft} />
                                        </button>
                                    );
                                })()}
                            </>
                        ) : (
                            <>
                                {row.acceptanceStatus !== "Accepted" && (
                                    <button
                                        type="button"
                                        className="rca-action-btn"
                                        title="Accept or Delegate Work Order"
                                        style={{ color: "gray" }}
                                        onClick={() => setAcceptTaskPopup({ open: true, task: row })}
                                    >
                                        <FontAwesomeIcon icon={faCircleCheck} />
                                    </button>
                                )}
                                {/* Populate/edit the work order's action fields from the
                                    desktop - only once it's been accepted, and only while
                                    it isn't already submitted (mirrors the mobile app's
                                    _isReadOnly: status !== "Completed"). */}
                                {row.acceptanceStatus === "Accepted" && row.status !== "Completed" && (
                                    <button
                                        type="button"
                                        className="rca-action-btn"
                                        title="Populate Work Order"
                                        style={{ marginLeft: "5px" }}
                                        onClick={() => openPopulateTaskPopup(row)}
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                )}
                                {false && (<button
                                    type="button"
                                    className="rca-action-btn"
                                    title="Download Job Card"
                                    style={{ marginLeft: "5px" }}
                                    onClick={() => handleDownloadJobCard(row)}
                                >
                                    <FontAwesomeIcon icon={faFilePdf} />
                                </button>)}
                                <button type="button" className="rca-action-btn" title="Download Work Order Summary"
                                    style={{ marginLeft: "5px" }} onClick={() => handleDownloadWorkOrderSummary(row)}>
                                    <FontAwesomeIcon icon={faFilePdf} />
                                </button>
                            </>
                        )}
                    </td>
                );

            case "ppe":
                return (
                    <td key="ppe" style={{ fontSize: "14px", textAlign: "left" }}>
                        {Array.isArray(row.ppe) && row.ppe.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: "18px" }}>
                                {row.ppe.map((item, i) => <li key={`ppe-${i}`}>{item}</li>)}
                            </ul>
                        ) : <span>-</span>}
                    </td>
                );

            case "handTools":
                return (
                    <td key="handTools" style={{ fontSize: "14px", textAlign: "left" }}>
                        {Array.isArray(row.handTools) && row.handTools.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: "18px" }}>
                                {row.handTools.map((item, i) => <li key={`tool-${i}`}>{item}</li>)}
                            </ul>
                        ) : <span>-</span>}
                    </td>
                );

            case "materials":
                return (
                    <td key="materials" style={{ fontSize: "14px", textAlign: "left" }}>
                        {Array.isArray(row.materials) && row.materials.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: "18px" }}>
                                {row.materials.map((item, i) => <li key={`mat-${i}`}>{item}</li>)}
                            </ul>
                        ) : <span>-</span>}
                    </td>
                );

            case "hazards":
                return (
                    <td key="hazards" style={{ fontSize: "14px" }}>
                        {Array.isArray(row._rawHazardsControls) && row._rawHazardsControls.length > 0 ? (
                            <button type="button" title="Click to download"
                                onClick={() => handleDownloadHazardTable(row)}
                                style={{ padding: 0, border: "none", background: "transparent", color: "#0B5ED7", textDecoration: "underline", cursor: "pointer", fontSize: "14px", textAlign: "left" }}>
                                Download Hazard table
                            </button>
                        ) : <span>N/A</span>}
                    </td>
                );

            default:
                return null;
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    const pageLabel = view === "allocator" ? "Work Order Management" : view === "closedOut" ? "Closed Out Work Orders" : "Update My Work Order";

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
                        <img src={`${process.env.PUBLIC_URL}/WOM1.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Work Order Management"}</p>
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

                    {view === "allocator" && canIn(access, "CTS", ["systemAdmin", "contributor"]) && (
                        <div className="burger-menu-icon-um">
                            <FontAwesomeIcon icon={faCirclePlus} title="Allocate Work Order" onClick={() => setShowAddTaskPopup(true)} />
                        </div>
                    )}

                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            autoComplete="off"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && <i><FontAwesomeIcon icon={faX} onClick={() => setSearchQuery("")} className="icon-um-search" title="Clear Search" /></i>}
                        {searchQuery === "" && <i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>}
                    </div>

                    <div className="spacer"></div>
                    <TopBar />
                </div>

                {/* Table area */}
                <div className="table-container-risk-control-attributes">
                    <div
                        className="risk-control-label-wrapper-new"
                        style={{ paddingBottom: "36px", marginBottom: "10px" }}
                    >
                        <div
                            className="control-attributes-pill-bar"
                            style={{ top: "auto", bottom: "0", transform: "none" }}
                        >
                            {["My Work Orders", "Work Orders Assigned", "Closed Out Work Orders"].map((pill) => (
                                <div
                                    key={pill}
                                    className={`control-attributes-pill ${categoryTab === pill ? "active" : ""}`}
                                    onClick={() => {
                                        let newView = pill;
                                        if (pill === "My Work Orders") newView = "viewer";
                                        else if (pill === "Work Orders Assigned") newView = "allocator";
                                        else if (pill === "Closed Out Work Orders") newView = "closedOut";

                                        switchView(newView)
                                        setCategoryTab(pill);
                                    }}
                                >
                                    {pill}
                                </div>
                            ))}
                        </div>

                        <label className="risk-control-label-new">{"Work Order Management"}</label>

                        <FontAwesomeIcon
                            icon={faTableColumns}
                            title="Show / Hide Columns"
                            className="top-right-button-control-att-new"
                            onClick={() => setShowColumnSelector(prev => !prev)}
                        />

                        <FontAwesomeIcon
                            icon={faFilter}
                            className={getFilterBtnClass()}
                            title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
                            style={{ cursor: hasActiveFilters ? "pointer" : "default", color: hasActiveFilters ? "#002060" : "gray", userSelect: "none" }}
                            onDoubleClick={handleClearFilters}
                        />

                        {showResetButton && (
                            <FontAwesomeIcon
                                icon={faArrowsRotate}
                                title="Reset column widths"
                                className="top-right-button-control-att-2-new"
                                onClick={resetColumnWidths}
                            />
                        )}

                        {false && (<FontAwesomeIcon
                            icon={faDownload}
                            title="Export to Excel"
                            className={showResetButton ? `top-right-button-control-att-4-new` : "top-right-button-control-att-3-new"}
                            style={{ cursor: "pointer", color: "gray" }}
                            onClick={handleExportExcel}
                        />)}

                        <button
                            className={showResetButton ? `top-right-button-control-att-4-new` : "top-right-button-control-att-3-new"}
                            title="Highlight Work Order Due Dates"
                            onClick={() => setIsTaskDueDatePopupOpen(true)}
                            style={{ cursor: "pointer", color: "gray", userSelect: "none", background: "none", border: "none", fontSize: "25px" }}
                        >
                            <FontAwesomeIcon icon={faClock} />
                        </button>

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
                                        {/* Only show columns available for the current view */}
                                        {availableColumns.map(column => (
                                            <div className="column-checkbox-item" key={column.id}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={showColumns.includes(column.id)}
                                                        disabled={column.id === "nr" || column.id === "action"}
                                                        onChange={() => toggleColumn(column.id)}
                                                    />
                                                    <span>{column.title}</span>
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
                        <table className={isSidebarVisible ? "risk-control-attributes-table" : "risk-control-attributes-table-ws"} style={{ tableLayout: "fixed" }}>
                            <thead className="risk-control-attributes-head">
                                <tr>
                                    {availableColumns.map(col => {
                                        if (col.id === "action") return null;
                                        if (!showColumns.includes(col.id)) return null;
                                        const isActiveFilter = !!activeExcelFilters[col.id];
                                        const isActiveSort = sortConfig.colId === col.id && col.id !== "nr";
                                        return (
                                            <th
                                                key={col.id}
                                                className={`${col.class ? col.class : `risk-control-attributes-action`}`}
                                                onClick={(e) => {
                                                    if (isResizingRef.current) return;
                                                    if (e.target.classList.contains("rca-col-resizer")) return;
                                                    openExcelFilterPopup(col.id, e);
                                                }}
                                                style={{
                                                    position: "relative",
                                                    width: columnWidths[col.id] ? `${columnWidths[col.id]}px` : undefined,
                                                    minWidth: COLUMN_SIZE_LIMITS[col.id]?.min,
                                                    maxWidth: COLUMN_SIZE_LIMITS[col.id]?.max,
                                                    cursor: col.id === "nr" ? "default" : "pointer",
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
                                    {showColumns.includes("action") && (
                                        <th
                                            className="risk-control-attributes-action"
                                            style={{ position: "relative", width: columnWidths.action ? `${columnWidths.action}px` : undefined, minWidth: COLUMN_SIZE_LIMITS.action?.min, maxWidth: COLUMN_SIZE_LIMITS.action?.max, cursor: "default" }}
                                        >
                                            <span>Action</span>
                                            <div className="rca-col-resizer" onMouseDown={e => startColumnResize(e, "action")} />
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody
                                ref={tbodyRef}
                                onPointerDown={onRowPointerDown}
                                onPointerMove={onRowPointerMove}
                                onPointerUp={endRowDrag}
                                onPointerCancel={endRowDrag}
                                onDragStart={onNativeDragStart}
                            >
                                {loading ? (
                                    <tr>
                                        <td colSpan={showColumns.length} style={{ textAlign: "center", padding: "20px", fontSize: "14px", color: "#666" }}>
                                            Loading tasks...
                                        </td>
                                    </tr>
                                ) : processedTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={showColumns.length} style={{ textAlign: "center", padding: "20px", fontSize: "14px", color: "#666" }}>
                                            No work orders available
                                        </td>
                                    </tr>
                                ) : (
                                    processedTasks.map((row, index) => (
                                        <tr
                                            key={row._id ?? index}
                                            className="table-scroll-wrapper-attributes-controls"
                                            style={{
                                                whiteSpace: "pre-wrap",
                                                backgroundColor: row.isTagged ? "#f2f2f2" : undefined,
                                            }}
                                        >
                                            {availableColumns
                                                .filter(col => showColumns.includes(col.id))
                                                .map(col => renderCell(col, row, index))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Excel Filter Popup */}
            {excelFilter.open && (
                <div
                    className="excel-filter-popup"
                    ref={excelPopupRef}
                    style={{ position: "fixed", top: excelFilter.pos.top, left: excelFilter.pos.left, width: excelFilter.pos.width, zIndex: 9999 }}
                    onWheel={e => e.stopPropagation()}
                >
                    <div className="excel-filter-sortbar">
                        <button type="button" className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId && sortConfig.direction === "asc" ? "active" : ""}`} onClick={() => toggleSort(excelFilter.colId, "asc")}>Sort Acsending</button>
                        <button type="button" className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId && sortConfig.direction === "desc" ? "active" : ""}`} onClick={() => toggleSort(excelFilter.colId, "desc")}>Sort Descending </button>
                    </div>
                    <input type="text" className="excel-filter-search" placeholder="Search" value={excelSearch} onChange={e => setExcelSearch(e.target.value)} />
                    {(() => {
                        const colId = excelFilter.colId;
                        const allValues = getAvailableOptions(colId);
                        const visibleValues = allValues.filter(v => String(v).toLowerCase().includes(excelSearch.toLowerCase()));
                        const isAllVisibleSelected = visibleValues.length > 0 && visibleValues.every(v => excelSelected.has(v));
                        const toggleAll = (checked) => {
                            setExcelSelected(prev => { const next = new Set(prev); checked ? visibleValues.forEach(v => next.add(v)) : visibleValues.forEach(v => next.delete(v)); return next; });
                        };
                        const toggleValue = (v) => {
                            setExcelSelected(prev => { const next = new Set(prev); next.has(v) ? next.delete(v) : next.add(v); return next; });
                        };
                        const onOk = () => {
                            let finalSelection = new Set(excelSelected);
                            if (excelSearch.trim() !== "") {
                                const visibleSet = new Set(visibleValues);
                                finalSelection = new Set(Array.from(excelSelected).filter(v => visibleSet.has(v)));
                            }
                            const selectedArr = Array.from(finalSelection);
                            const isTotalReset = allValues.length > 0 && allValues.length === selectedArr.length && selectedArr.every(v => finalSelection.has(v));
                            setActiveExcelFilters(prev => { const next = { ...prev }; isTotalReset ? delete next[colId] : next[colId] = selectedArr; return next; });
                            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                        };
                        const onCancel = () => setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                        return (
                            <>
                                <div className="excel-filter-list">
                                    <label className="excel-filter-item">
                                        <span className="excel-filter-checkbox"><input type="checkbox" className="checkbox-excel-attend" checked={isAllVisibleSelected} onChange={e => toggleAll(e.target.checked)} /></span>
                                        <span className="excel-filter-text">{excelSearch === "" ? "(Select All)" : "(Select All Search Results)"}</span>
                                    </label>
                                    {visibleValues.map(v => (
                                        <label className="excel-filter-item" key={String(v)}>
                                            <span className="excel-filter-checkbox"><input type="checkbox" className="checkbox-excel-attend" checked={excelSelected.has(v)} onChange={() => toggleValue(v)} /></span>
                                            <span className="excel-filter-text">{v}</span>
                                        </label>
                                    ))}
                                    {visibleValues.length === 0 && <div style={{ padding: "8px", color: "#888", fontStyle: "italic", fontSize: "12px" }}>No matches found</div>}
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

            {/* Allocator popups */}
            {showAddTaskPopup &&
                <AddWorkOrderInstance
                    onClose={() => setShowAddTaskPopup(false)}
                    onWorkOrderAdded={fetchTasks}
                />
            }
            {isTaskDueDatePopupOpen && (
                <WorkOrderDueDate
                    isOpen={isTaskDueDatePopupOpen}
                    onClose={() => setIsTaskDueDatePopupOpen(false)}
                    onUpdate={setDueDateVal}
                    currVal={dueDateVal}
                />
            )}

            {deleteTaskPopup.open && (
                <DeleteAllocatedWorkOrder
                    cancel={deleteTaskPopup.task?.acceptanceStatus === "Accepted"}
                    cancelled={deleteTaskPopup.task?.status === "Cancelled"}
                    open={deleteTaskPopup.open}
                    task={deleteTaskPopup.task}
                    taskName={deleteTaskPopup.taskName}
                    onClose={closeDeleteTaskPopup}
                    handleDeleteTask={handleDeleteTask}
                />
            )}

            {closeTaskPopup.open && (
                <CloseAllocatedWorkOrder
                    open={closeTaskPopup.open} taskName={closeTaskPopup.taskName}
                    onClose={closeCloseTaskPopup}
                    onConfirm={(closeOutPayload) => { handleCloseTask(closeTaskPopup.task._id, closeOutPayload); closeCloseTaskPopup(); }}
                />
            )}

            {previewTaskPopup.open && (
                <WorkOrderInfoPreview
                    open={previewTaskPopup.open}
                    taskId={previewTaskPopup.task?._id}
                    onClose={closePreviewTaskPopup}
                    onCloseOut={handlePreviewCloseOut}
                />
            )}

            {populateTaskPopup.open && (
                <PopulateWorkOrderPreview
                    open={populateTaskPopup.open}
                    taskId={populateTaskPopup.task?._id}
                    onClose={closePopulateTaskPopup}
                    onSubmitted={handlePopulateTaskSubmitted}
                />
            )}

            {reopenTaskPopup.open && (
                <ReopenAllocatedWorkOrder
                    open={reopenTaskPopup.open} taskName={reopenTaskPopup.taskName}
                    onClose={closeReopenTaskPopup}
                    onConfirm={(message) => { handleReopenTask(reopenTaskPopup.task._id, message); closeReopenTaskPopup(); }}
                />
            )}

            {showModifyAllocatedTaskPopup && (
                <ModifyAllocatedTaskPopup task={selectedAllocatedTask} onClose={handleCloseModifyAllocatedTaskPopup} onTaskUpdated={fetchTasks} />
            )}

            {/* Viewer popup for updating a task's own progress */}
            {showModifyPopup && (
                <ModifyMyTask onClose={handleCloseModifyPopup} data={selectedTask} onSaved={handleTaskSaved} />
            )}

            {/* Accept Task popup */}
            {acceptTaskPopup.open && (
                <AcceptWorkOrderPopup
                    open={acceptTaskPopup.open}
                    taskName={acceptTaskPopup.task?.taskTitle || ""}
                    onClose={() => setAcceptTaskPopup({ open: false, task: null })}
                    onAccept={() => {
                        handleAcceptTask(acceptTaskPopup.task._id);
                        setAcceptTaskPopup({ open: false, task: null });
                    }}
                    onDelegate={() => {
                        //Keep the task reference but swap to the delegate popup
                        const task = acceptTaskPopup.task;
                        setAcceptTaskPopup({ open: false, task: null });
                        setDelegateTaskPopup({ open: true, task });
                    }}
                />
            )}

            {/* Delegate Task popup */}
            {delegateTaskPopup.open && (
                <DelegateWorkOrderPopup
                    open={delegateTaskPopup.open}
                    taskName={delegateTaskPopup.task?.taskTitle || ""}
                    taskId={delegateTaskPopup.task?._id}
                    onClose={() => setDelegateTaskPopup({ open: false, task: null })}
                    onDelegated={(updatedTask) => {
                        handleTaskDelegated(updatedTask);
                        setDelegateTaskPopup({ open: false, task: null });
                    }}
                />
            )}
            {/* Reassign Work Order popup */}
            {reassignWorkOrderPopup.open && (
                <MigrateWorkOrder
                    task={reassignWorkOrderPopup.task}
                    onClose={() => setReassignWorkOrderPopup({ open: false, task: null })}
                    onReassigned={fetchTasks}
                />
            )}
            <ToastContainer />
        </div>
    );
};

export default WorkManagement;