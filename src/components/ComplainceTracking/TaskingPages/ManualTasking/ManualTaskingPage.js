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
    faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import { saveAs } from "file-saver";
import TopBar from "../../../Notifications/TopBar";
import { canIn, getCurrentUser } from "../../../../utils/auth";
import { ToastContainer, toast } from "react-toastify";
import AddTaskPopup from "./AddTaskPopup";
import AddSubTaskPopup from "./AddSubTaskPopup";
import ViewSubTasksPopup from "./ViewSubTasksPopup";
import AddRepeatingTaskPopup from "./AddRepeatingTaskPopup";
import DeleteAllocatedTask from "./DeleteAllocatedTask";
import CloseAllocatedTask from "./CloseAllocatedTask";
import ReopenAllocatedTask from "./ReopenAllocatedTask";
import ModifyAllocatedTaskPopup from "./ModifyAllocatedTaskPopup";
import ViewMainTask from "./ViewMainTask";
import ModifyMyTask from "./ModifyMyTask";
import axios from "axios";
import AcceptTaskPopup from "./AcceptTaskPopup";
import DelegateTaskPopup from "./DelegateTaskPopup";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import PopupMenu from "../../../FileInfo/PopupMenu";
import PopupMenuTasks from "./PopupMenuTasks";
import { getAutoManualNavigationRoute } from "./getAutoManualNavigationRoute";
import { getAutoAutoNavigationRoute } from "./getAutoAutoNavigationRoute";
import TaskDueDatePopup from "./TaskDueDatePopup";
import TaskSourceInfo from "./TaskSourceInfo";

// ─── Route helpers ────────────────────────────────────────────────────────────
// Returns the correct API base path for any task object based on _taskSource.
const taskApiBase = (task) =>
    task?._taskSource === "autoAuto"
        ? `${process.env.REACT_APP_URL}/api/auto-auto-tasks`
        : `${process.env.REACT_APP_URL}/api/complainceTasks`;

const ALL_COLUMNS = [
    { id: "nr", title: "Nr", views: "both", collapsed: false },
    { id: "allocationType", title: "Task Category", views: "closedOut", collapsed: false },
    { id: "uniqueID", title: "Unique Identifier", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "allocatedBy", title: "Originator", views: "both", collapsed: true, collapsedFor: "allocator" },
    { id: "allocatedDate", title: "Date Created", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "area", title: "Area", views: "both", collapsed: true, collapsedFor: "allocator" },
    { id: "discipline", title: "Department", views: "both", collapsed: true, collapsedFor: "allocator" },
    { id: "taskType", title: "Type", views: "both", collapsed: false },
    { id: "category", title: "Source", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "taskTitle", title: "Title", views: "both", collapsed: false },
    { id: "taskDescription", title: "Description", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "priority", title: "Priority", views: "both", collapsed: false },
    { id: "comments", class: `task-grey2`, title: "Originator Comments", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "attachments", class: `task-grey2`, title: "Originator Supporting Info", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "responsible", class: `task-grey2`, title: "Responsible Person", views: "both", collapsed: true, collapsedFor: "viewer" },
    { id: "dueDate", class: `task-grey2`, title: "Due Date", views: "both", collapsed: false },
    { id: "acceptanceStatus", class: `task-grey1`, title: "Acceptance Status", views: "both", collapsed: true, collapsedFor: "viewer" },
    { id: "status", class: `task-grey1`, title: "Status", views: "both", collapsed: false },
    { id: "userComments", class: `task-grey1`, title: "Responsible Person Comments", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "userAttachments", class: `task-grey1`, title: "Responsible Person Supporting Info", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "completionDate", title: "Completion Date", views: "both", collapsed: true, collapsedFor: "both" },
    { id: "closeStatus", title: "Closeout Status", views: "both", collapsed: false, collapsedFor: "allocator" },
    { id: "closeOutComments", title: "Close Out Comments", views: "both", collapsed: true, collapsedFor: "both" },
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
    return status || "-";
};

// AATCD-change here
const getCategoryDisplay = (category) => {
    if (category === "Auto-Auto") return "System Generated"; // ← replace empty string with the new display value
    if (category === "Auto-Manual") return "User Triggered"; // ← replace empty string with the new display value
    if (category === "Manual") return "User Created"; // ← replace empty string with the new display value
    return category || "-";
};

const STATUS_OPTIONS = [
    { value: "25% Completed", label: "25% Completed", color: "#FFC000" },
    { value: "50% Completed", label: "50% Completed", color: "#FFFF00" },
    { value: "75% Completed", label: "75% Completed", color: "#FFFFCC" },
    { value: "Completed", label: "Submitted", color: "#7EAC87" },
    //{ value: "Completed", label: "Completed", color: "#7EAC87" },
    { value: "Cancelled", label: "Cancelled", color: "#CB6F6F" },
];

const DEFAULT_COLUMN_WIDTHS = {
    nr: 50,
    taskType: 30,
    taskTitle: 70,
    taskDescription: 350,
    priority: 30,
    responsible: 50,
    acceptanceStatus: 40,
    allocatedDate: 130,
    dueDate: 40,
    completionDate: 140,
    status: 45,
    attachments: 220,
    comments: 200,
    userAttachments: 220,
    userComments: 120,
    closeStatus: 30,
    closeOutComments: 300,
    allocationType: 40,
    allocatedBy: 50,
    category: 100,
    discipline: 40,
    area: 30,
    uniqueID: 80,
    action: 90,
};

const COLUMN_SIZE_LIMITS = {
    nr: { min: 50, max: 50 },
    category: { min: 50, max: 260 },
    taskType: { min: 30, max: 260 },
    taskTitle: { min: 70, max: 600 },
    taskDescription: { min: 110, max: 800 },
    priority: { min: 30, max: 200 },
    responsible: { min: 50, max: 400 },
    acceptanceStatus: { min: 40, max: 300 },
    allocatedDate: { min: 100, max: 260 },
    allocatedBy: { min: 50, max: 300 },
    dueDate: { min: 40, max: 260 },
    completionDate: { min: 100, max: 260 },
    status: { min: 45, max: 260 },
    attachments: { min: 180, max: 420 },
    comments: { min: 150, max: 700 },
    userAttachments: { min: 180, max: 420 },
    userComments: { min: 120, max: 700 },
    closeStatus: { min: 30, max: 260 },
    closeOutComments: { min: 200, max: 700 },
    allocationType: { min: 4, max: 260 },
    action: { min: 90, max: 90 },
    discipline: { min: 40, max: 300 },
    area: { min: 30, max: 300 },
    uniqueID: { min: 30, max: 300 },
};

const getColumnsForView = (view) => {
    return ALL_COLUMNS.filter(col => col.views === "both" || col.views === view);
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

const getStatusColor = (status) => {
    const match = STATUS_OPTIONS.find(o => o.value === status);
    return match ? match.color : "transparent";
};

const getStatusTextColor = (status) =>
    status === "Completed" || status === "Cancelled" ? "#FFFFFF" : "#000000";

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
    // ── _taskSource is preserved from the server tag ──────────────────────────
    _taskSource: task?._taskSource || "manual",
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
    _rawAttachments: Array.isArray(task?.attachments) ? task.attachments : [],
    _rawUserAttachments: Array.isArray(task?.userAttachments) ? task.userAttachments : [],
    attachments: Array.isArray(task?.attachments)
        ? task.attachments.map(f => f?.fileName || f?.name || f)
        : [],
    userAttachments: Array.isArray(task?.userAttachments)
        ? task.userAttachments.map(f => f?.fileName || f?.name || f)
        : [],
    // allocatedByName used for display: null allocatedBy → "System"
    allocatedByName: task?.allocatedBy?.username || task?.allocatedBy || "",
    userComments: task?.userComments || "",
    closeOutComments: task?.closeOutComments || "",
    taskType: task?.taskType || "",
    taskTitle: task?.taskTitle || "",
    priority: task?.priority || "",
    category: task?.category || "",
    discipline: task?.discipline || "",
    area: task?.area || "",
    acceptanceStatus: task?.acceptanceStatus || "",
    isTagged: task?.filledManual === false,
    uniqueID: task?.uniqueID || "",
    // True for follow-up tasks created from a Work Order action field's
    // "Schedule Task" popup (see POST /:id/action-fields/:fieldId/schedule-task
    // on the work order route) — drives the "WO - " allocator prefix and the
    // bold/normal title split below.
    isWorkOrder: task?.isWorkOrderTask || false,
});

const ManualTaskingPage = () => {
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
    const [showAddSubTaskPopup, setShowAddSubTaskPopup] = useState(false);
    const [subTaskParent, setSubTaskParent] = useState(null);
    const [viewSubTasksPopup, setViewSubTasksPopup] = useState({ open: false, parentTask: null, subtasks: [] });
    const [viewMainTaskPopup, setViewMainTaskPopup] = useState({ open: false, subTaskId: null });
    const [showAddRepeatingTaskPopup, setShowAddRepeatingTaskPopup] = useState(false);
    const [deleteTaskPopup, setDeleteTaskPopup] = useState({ open: false, task: null, taskName: "" });
    const [closeTaskPopup, setCloseTaskPopup] = useState({ open: false, task: null, taskName: "" });
    const [reopenTaskPopup, setReopenTaskPopup] = useState({ open: false, task: null, taskName: "" });
    const [showModifyAllocatedTaskPopup, setShowModifyAllocatedTaskPopup] = useState(false);
    const [selectedAllocatedTask, setSelectedAllocatedTask] = useState(null);
    const [closingTaskIds, setClosingTaskIds] = useState(new Set());
    const [reopeningTaskIds, setReopeningTaskIds] = useState(new Set());
    const [categoryTab, setCategoryTab] = useState("My Tasks");
    const [showCategoryInfo, setShowCategoryInfo] = useState(false);

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
    const [hoveredTaskId, setHoveredTaskId] = useState(null);
    const [dueDateVal, setDueDateVal] = useState(30);
    const [isTaskDueDatePopupOpen, setIsTaskDueDatePopupOpen] = useState(false);

    // ── View switch ──────────────────────────────────────────────────────────
    const switchView = (nextView) => {
        setView(nextView);
        // closedOut uses viewer-style columns
        const colView = nextView === "closedOut" ? "viewer" : nextView;
        const defaultShowColumns = getDefaultShowColumns(colView);
        if (nextView === "closedOut") defaultShowColumns.push("allocationType");
        setShowColumns(defaultShowColumns);
        setActiveExcelFilters({});
        setSortConfig(DEFAULT_SORT);
        setSearchQuery("");
        widthsInitializedRef.current = false;
        setHasFittedOnce(false);
        setTableWidth(null);
        setColumnWidths({ ...DEFAULT_COLUMN_WIDTHS });
    };

    // ── Columns available for current view ───────────────────────────────────
    const availableColumns = useMemo(() => {
        return ALL_COLUMNS.filter(col => {
            if (view === "closedOut") return col.views === "both" || col.views === "viewer" || col.views === "closedOut";
            return col.views === "both" || col.views === view;
        });
    }, [view]);
    const allColumnIds = useMemo(() => availableColumns.map(c => c.id), [availableColumns]);

    // ── Fetch ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) setToken(storedToken);
    }, [navigate]);

    useEffect(() => {
        const saved = localStorage.getItem("highlightTaskDueDates");
        if (saved && !isNaN(saved) && Number(saved) > 0) {
            setDueDateVal(Number(saved));
        } else {
            localStorage.setItem("highlightTaskDueDates", "30");
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
                const response = await fetch(`${process.env.REACT_APP_URL}/api/complainceTasks/all/open`, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                });

                if (!response.ok) throw new Error("Failed to load tasks");

                const data = await response.json();
                const raw = data?.tasks ?? [];

                const normalised = raw.map(normalizeTask);

                normalised.sort((a, b) =>
                    (a.taskDescription || "").localeCompare(
                        b.taskDescription || "",
                        undefined,
                        { sensitivity: "base" }
                    )
                );

                setTasks(normalised);
            } else if (view === "closedOut") {
                // /closed — tasks (responsible or allocator) that are closed out
                const response = await axios.get(`${process.env.REACT_APP_URL}/api/complainceTasks/closed`, {
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
                    (a.taskDescription || "").localeCompare(
                        b.taskDescription || "",
                        undefined,
                        { sensitivity: "base" }
                    )
                );

                setTasks(normalised);
            } else {
                // ── viewer: /my/open excludes closed-out tasks ──
                const response = await axios.get(`${process.env.REACT_APP_URL}/api/complainceTasks/my/open`, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                });

                const raw = response.data?.tasks ?? [];

                // normalizeTask preserves _taskSource set by the server
                const normalised = raw.map(normalizeTask);

                normalised.sort((a, b) =>
                    (a.dueDate || "").localeCompare(b.dueDate || "") ||
                    (a.taskDescription || "").localeCompare(
                        b.taskDescription || "",
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
        if (task?._isPendingRepeating) {
            toast.info("This repeating task has not started yet and cannot be modified.", {
                autoClose: 3000,
                closeButton: false,
            });
            return;
        }

        if (task?.status === "Cancelled") {
            toast.warn("Cancelled tasks cannot be modified.", {
                autoClose: 3000,
                closeButton: false,
            });
            return;
        }

        if (task?.closeStatus) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.info("You cannot edit this task because it is closed out.", { autoClose: 3000, closeButton: false });
            return;
        }
        setSelectedAllocatedTask({
            ...task,
            responsible: task?._rawResponsible || task?.responsible || "",
            allocatedBy: task?._rawAllocatedBy || task?.allocatedBy || "",
            attachments: task?._rawAttachments || task?.attachments || [],
            userAttachments: task?._rawUserAttachments || task?.userAttachments || [],
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
                `${taskApiBase(task)}/${taskId}/accept`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${storedToken}` },
                }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error || "Failed to accept task");
            fetchTasks();
            toast.success("Task accepted successfully.", { autoClose: 2000, closeButton: false });
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

    // ── Sub-task popups ─────────────────────────────────────────────────────
    const openAddSubTaskPopup = (task) => {
        // On "My Tasks" (viewer), a manual task must be accepted before sub tasks can be added.
        if (view === "viewer" && task?.acceptanceStatus !== "Accepted") {
            toast.warn("You must accept this task before adding a sub task.", { autoClose: 3000, closeButton: false });
            return;
        }
        setSubTaskParent(task);
        setShowAddSubTaskPopup(true);
    };
    const closeAddSubTaskPopup = () => {
        setShowAddSubTaskPopup(false);
        setSubTaskParent(null);
    };

    const openViewSubTasksPopup = (task, subtasks) => {
        setViewSubTasksPopup({ open: true, parentTask: task, subtasks: subtasks || [] });
    };
    const closeViewSubTasksPopup = () => {
        setViewSubTasksPopup({ open: false, parentTask: null, subtasks: [] });
    };

    const openViewMainTaskPopup = (task) => {
        setViewMainTaskPopup({ open: true, subTaskId: task?._id || null });
    };
    const closeViewMainTaskPopup = () => {
        setViewMainTaskPopup({ open: false, subTaskId: null });
    };

    const handleDeleteTask = async () => {
        const storedToken = localStorage.getItem("token");
        const task = deleteTaskPopup?.task;
        const taskId = task?._id;
        if (!storedToken || !taskId) return;
        try {
            let response;
            if (task?._isPendingRepeating) {
                // Delete the repeating task template directly (no ManualTask exists yet)
                response = await fetch(
                    `${process.env.REACT_APP_URL}/api/repeatTasks/${taskId}`,
                    {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${storedToken}` },
                    }
                );
            } else {
                response = await fetch(`${taskApiBase(task)}/${taskId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${storedToken}` },
                });
            }
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data?.error || "Failed to delete task");
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success(
                task?._isPendingRepeating
                    ? "Repeating task deleted successfully."
                    : data?.cancelled
                        ? "Accepted task cancelled successfully."
                        : "Task deleted successfully",
                { autoClose: 3000, closeButton: false }
            );
            closeDeleteTaskPopup();
            fetchTasks();
        } catch (error) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(error.message || "Failed to delete task", { autoClose: 3000, closeButton: false });
        }
    };

    const handleCloseTask = async (taskId, closeOutComments = "") => {
        if (closingTaskIds.has(taskId)) return;
        setClosingTaskIds(prev => new Set(prev).add(taskId));
        // Find the task to determine its source
        const task = tasks.find(t => t._id === taskId);
        try {
            const storedToken = localStorage.getItem("token");
            const response = await fetch(`${taskApiBase(task)}/${taskId}/close`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${storedToken}`, "Content-Type": "application/json" },
                body: JSON.stringify({ closeOutComments }),
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
            toast.success("Task closed out successfully.", { autoClose: 2000, closeButton: false });
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
            const response = await fetch(`${taskApiBase(task)}/${taskId}/reopen`, {
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
            toast.success("Task reopened successfully.", { autoClose: 2000, closeButton: false });
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
            toast.warn("Cancelled tasks cannot be modified.", {
                autoClose: 3000,
                closeButton: false,
            });
            return;
        }

        if (task.closeStatus) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.info("This task has been closed out and can no longer be modified.", { autoClose: 3000, closeButton: false });
            return;
        }
        // Auto-auto tasks are always pre-accepted; manual tasks need explicit acceptance
        if (task.acceptanceStatus !== "Accepted") {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("You can only modify tasks that you have accepted.", { autoClose: 3000, closeButton: false });
            return;
        }
        setSelectedTask(task);
        setShowModifyPopup(true);
    };
    const handleCloseModifyPopup = () => { setShowModifyPopup(false); setSelectedTask(null); };
    const handleTaskSaved = (updatedTask) => {
        fetchTasks();
    };

    const handleStatusChange = async (taskId, newStatus) => {
        const previousTask = tasks.find(t => t._id === taskId);
        const storedToken = localStorage.getItem("token");

        if (!storedToken || !taskId) return;

        setTasks(prev =>
            prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t)
        );

        try {
            const response = await axios.put(
                `${taskApiBase(previousTask)}/${taskId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${storedToken}` } }
            );

            if (response.data?.task) {
                setTasks(prev =>
                    prev.map(t =>
                        t._id === taskId ? normalizeTask({ ...response.data.task, _taskSource: previousTask?._taskSource }) : t
                    )
                );
            }

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Task status updated.", {
                autoClose: 2000,
                closeButton: false,
            });
        } catch (error) {
            setTasks(prev =>
                prev.map(t => t._id === taskId ? previousTask : t)
            );

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(
                error.response?.data?.error || "Failed to update task status.",
                { autoClose: 3000, closeButton: false }
            );
        }
    };

    // ── Download ─────────────────────────────────────────────────────────────
    const handleDownloadAttachment = async (task, attachmentId, fileName, attachmentType = "attachments") => {
        const storedToken = localStorage.getItem("token");
        const taskId = task._id;
        if (!storedToken || !taskId || !attachmentId) return;
        try {
            const response = await fetch(
                `${taskApiBase(task)}/${taskId}/${attachmentType}/${attachmentId}/download`,
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

    const handleDownloadJobCard = async (task) => {
        // Auto-auto tasks don't have a job-card route
        if (task?._taskSource === "autoAuto") {
            toast.info("Job cards are not available for auto-generated tasks.", { autoClose: 3000, closeButton: false });
            return;
        }
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/complainceTasks/${task._id}/job-card/pdf`,
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
            if (!e.target.closest(".popup-anchor") && !e.target.closest(".popup-content-pub-files")) {
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
        if (colId === "allocationType") return [row._isAllocator ? "Tasks Assigned" : "My Tasks"];
        if (colId === "category") return [getCategoryDisplay(row.category)];
        if (colId === "attachments") return [Array.isArray(row.attachments) && row.attachments.length > 0 ? "Has Attachments" : "No Attachments"];
        if (colId === "userAttachments") return [Array.isArray(row.userAttachments) && row.userAttachments.length > 0 ? "Has Attachments" : "No Attachments"];
        // allocatedBy: null becomes "System" for filtering
        if (colId === "allocatedBy") return [row.allocatedBy || "System"];
        const val = row[colId];
        return [val ? String(val).trim() : "-"];
    };

    const getAvailableOptions = (colId) => {
        let filtered = [...tasks];
        if (searchQuery) {
            const lq = searchQuery.toLowerCase();
            filtered = filtered.filter(c => (c.taskDescription || "").toLowerCase().includes(lq));
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
        let current = [...tasks];
        if (searchQuery) {
            const lq = searchQuery.toLowerCase();
            current = current.filter(c => (c.taskDescription || "").toLowerCase().includes(lq));
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
                return compareText(normalize(a?.taskDescription), normalize(b?.taskDescription));
            }

            const { colId, direction } = sortConfig;
            const dir = direction === "desc" ? -1 : 1;

            if (["allocatedDate", "dueDate", "completionDate"].includes(colId)) {
                const vA = parseDateValue(a?.[colId]), vB = parseDateValue(b?.[colId]);
                if (vA === null && vB !== null) return 1;
                if (vA !== null && vB === null) return -1;
                if (vA !== null && vB !== null && vA !== vB) return (vA - vB) * dir;
            } else {
                const vA =
                    colId === "closeStatus"
                        ? a.closeStatus ? "Closed Out" : "Open"
                        : colId === "allocationType"
                            ? (a._isAllocator ? "Tasks Assigned" : "My Tasks")
                            : normalize(a?.[colId]);

                const vB =
                    colId === "closeStatus"
                        ? b.closeStatus ? "Closed Out" : "Open"
                        : colId === "allocationType"
                            ? (b._isAllocator ? "Tasks Assigned" : "My Tasks")
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

            return compareText(normalize(a?.taskDescription), normalize(b?.taskDescription));
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

    useEffect(() => {
        if (!showCategoryInfo) return;
        const handleClickOutside = (e) => {
            if (!e.target.closest(".category-info-popup") && !e.target.closest(".category-info-btn")) {
                setShowCategoryInfo(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showCategoryInfo]);

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
        if (view === "closedOut" && !defaultCols.includes("allocationType")) defaultCols.push("allocationType");
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
            area: { width: 18, centre: true, headerGroup: "navy" },
            discipline: { width: 18, centre: true, headerGroup: "navy" },
            taskType: { width: 16, centre: true, headerGroup: "navy" },
            category: { width: 16, centre: true, headerGroup: "navy" },
            taskTitle: { width: 28, centre: false, headerGroup: "navy" },
            taskDescription: { width: 40, centre: false, headerGroup: "navy" },
            priority: { width: 14, centre: true, headerGroup: "navy" },
            allocatedBy: { width: 20, centre: true, headerGroup: "grey2" },
            allocatedDate: { width: 18, centre: true, headerGroup: "grey2" },
            comments: { width: 35, centre: false, headerGroup: "grey2" },
            attachments: { width: 30, centre: false, headerGroup: "grey2" },
            responsible: { width: 20, centre: true, headerGroup: "grey2" },
            dueDate: { width: 14, centre: true, headerGroup: "grey2" },
            acceptanceStatus: { width: 20, centre: true, headerGroup: "grey1" },
            status: { width: 22, centre: true, headerGroup: "grey1" },
            userComments: { width: 35, centre: false, headerGroup: "grey1" },
            userAttachments: { width: 30, centre: false, headerGroup: "grey1" },
            completionDate: { width: 18, centre: true, headerGroup: "navy" },
            closeStatus: { width: 16, centre: true, headerGroup: "navy" },
            closeOutComments: { width: 35, centre: false, headerGroup: "navy" },
            allocationType: { width: 20, centre: true, headerGroup: "navy" },
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
                    else if (hdr.id === "allocationType") val = row._isAllocator ? "Tasks Assigned" : "My Tasks";
                    else if (hdr.id === "attachments") val = Array.isArray(row.attachments) && row.attachments.length > 0 ? row.attachments.join("\n") : "No files";
                    else if (hdr.id === "userAttachments") val = Array.isArray(row.userAttachments) && row.userAttachments.length > 0 ? row.userAttachments.join("\n") : "No files";
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
                    } else if (hdr.id === "allocationType") {
                        value = row._isAllocator ? "Tasks Assigned" : "My Tasks";
                    } else if (hdr.id === "attachments") {
                        const a = row.attachments;
                        value = Array.isArray(a) && a.length > 0 ? a.join("\n") : "No files";
                    } else if (hdr.id === "userAttachments") {
                        const a = row.userAttachments;
                        value = Array.isArray(a) && a.length > 0 ? a.join("\n") : "No files";
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
        const isAutoAuto = row._taskSource === "autoAuto";
        const isAutoManual = row._taskSource === "autoManual";

        switch (col.id) {
            case "nr":
                return <td key="nr" className="procCent" style={{ fontSize: "14px" }}>{index + 1}
                    {view === "allocator" ? (
                        <>
                            {/* Pending repeating tasks: show a clock badge, no edit */}
                            {row._isPendingRepeating ? (
                                <FontAwesomeIcon
                                    icon={faClock}
                                    title={`Scheduled repeating task — starts ${row.dueDate || ""}`}
                                    style={{ fontSize: "13px", marginLeft: "5px", color: "#888", opacity: 0.7 }}
                                />
                            ) : (
                                /* Auto-auto tasks in allocator view: no edit button (system-managed) */
                                (!isAutoAuto || !isAutoManual) && (
                                    <button type="button" className="rca-action-btn" title="Modify Allocated Task"
                                        onClick={() => handleOpenModifyAllocatedTaskPopup(row)}>
                                        <FontAwesomeIcon icon={faEdit} style={{ fontSize: "14px", marginLeft: "5px" }} />
                                    </button>
                                )
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                className="rca-action-btn"
                                title={
                                    // Auto-auto tasks are always accepted; manual need explicit accept
                                    (!isAutoAuto || !isAutoManual) && row.acceptanceStatus !== "Accepted"
                                        ? "You must accept this task before editing"
                                        : "Modify Task Progress"
                                }
                                style={{
                                    opacity: (!isAutoAuto || !isAutoManual) && row.acceptanceStatus !== "Accepted" ? 0.4 : 1,
                                    cursor: (!isAutoAuto || !isAutoManual) && row.acceptanceStatus !== "Accepted" ? "not-allowed" : "pointer",
                                }}
                                onClick={() => {
                                    if (!isAutoAuto && !isAutoManual && row.acceptanceStatus !== "Accepted") {
                                        toast.warn("You must accept this task before editing.", { autoClose: 3000, closeButton: false });
                                        return;
                                    }
                                    handleOpenModifyPopup({ ...row, attachments: row._rawAttachments, userAttachments: row._rawUserAttachments });
                                }}
                            >
                                <FontAwesomeIcon icon={faEdit} style={{ fontSize: "14px", marginLeft: "5px" }} />
                            </button>
                        </>
                    )}
                </td>;

            case "uniqueID":
                return <td key="uniqueID" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.uniqueID || "-"}</td>;

            case "taskType":
                return <td key="taskType" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.taskType || "-"}</td>;

            case "taskTitle":
                return (
                    <td
                        key="taskTitle"
                        style={{ fontSize: "14px" }}
                        className="gen-point title-task-clickable"
                        onClick={(e) => {
                            e.stopPropagation();

                            if (row?._taskSource === "autoManual") {
                                handleAutoManualNavigation(row);
                                return;
                            }

                            if (row?._taskSource === "autoAuto") {
                                handleAutoAutoNavigation(row);
                                return;
                            }

                            setHoveredTaskId(hoveredTaskId === row._id ? null : row._id);
                        }}
                    >
                        <div className="popup-anchor">
                            <span>
                                {(() => {
                                    const title = row.taskTitle || "-";

                                    if (row.isSubTask || row.isWorkOrder) {
                                        const colonIndex = title.indexOf(":");

                                        if (colonIndex !== -1) {
                                            // DB keeps the colon (e.g. "Subtask of AM-MT-0008: ..." or
                                            // a work-order-originated title like "Conveyor Guard: Ensure
                                            // that ... issue is resolved") — only the display strips it
                                            // and adds a blank line.
                                            const boldPart = title.slice(0, colonIndex);
                                            const restPart = title.slice(colonIndex + 1).trimStart();

                                            return (
                                                <>
                                                    <strong>{boldPart}</strong>
                                                    <br />
                                                    <br />
                                                    {restPart}
                                                </>
                                            );
                                        }
                                    }

                                    return title;
                                })()}
                            </span>

                            {(hoveredTaskId === row._id) && (
                                <PopupMenuTasks
                                    hoveredId={hoveredTaskId}
                                    setHoveredId={setHoveredTaskId}
                                    isOpen={true}
                                    file={row}
                                    view={view}
                                    allowed={!isAutoAuto && !isAutoManual}
                                    onAddSubTask={openAddSubTaskPopup}
                                    onViewSubtasks={openViewSubTasksPopup}
                                    onViewMainTask={openViewMainTaskPopup}
                                />
                            )}
                        </div>
                    </td>
                );

            case "allocatedBy":
                // null allocatedBy means system-generated → display "System"
                return (
                    <td key="allocatedBy" className="backGrey procCent" style={{ fontSize: "14px" }}>
                        {(isAutoAuto || isAutoManual) ? (
                            <span style={{ color: "#888", fontStyle: "italic" }}>
                                {row.allocatedBy}
                            </span>
                        ) : (
                            row.isWorkOrder ? `${row.allocatedBy}` : row.allocatedBy
                        )}
                    </td>
                );

            case "taskDescription":
                return <td key="taskDescription" style={{ fontSize: "14px" }}>{row.taskDescription || "-"}</td>;

            case "category":
                return <td key="category" className="backGrey procCent" style={{ fontSize: "14px" }}>{getCategoryDisplay(row.category)}</td>;

            case "discipline":
                return <td key="discipline" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.discipline || "-"}</td>;

            case "area":
                return <td key="area" className="backGrey procCent" style={{ fontSize: "14px" }}>{row.area || "-"}</td>;

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

            case "status":
                // Allocator view — read-only coloured cell
                if (view === "allocator") {
                    return (
                        <td key="status" className="procCent" style={{ fontSize: "14px", backgroundColor: getStatusColor(row.status), color: getStatusTextColor(row.status), fontWeight: "500" }}>
                            {getStatusDisplay(row.status)}
                        </td>
                    );
                }
                // Viewer (responsible person) view — editable dropdown
                return (
                    <td key="status" className="procCent" style={{ fontSize: "14px", backgroundColor: getStatusColor(row.status), padding: "4px 6px" }}>
                        <select
                            value={row.status || ""}
                            disabled={
                                !!row.closeStatus ||
                                row.status === "Cancelled" ||
                                // Manual tasks: must be accepted first. Auto-auto: always editable (pre-accepted)
                                (!isAutoAuto && !isAutoManual && row.acceptanceStatus !== "Accepted") ||
                                isAutoAuto || isAutoManual
                            }
                            title={
                                row.status === "Cancelled"
                                    ? "Cancelled tasks cannot be updated"
                                    : row.closeStatus
                                        ? "Task is closed out"
                                        : "Update task status"
                            }
                            style={{
                                width: "100%",
                                border: "none",
                                background: "transparent",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: getStatusTextColor(row.status),
                                cursor: (row.closeStatus || row.status === "Cancelled" || (!isAutoAuto && !isAutoManual && row.acceptanceStatus !== "Accepted"))
                                    ? "not-allowed"
                                    : "pointer",
                                outline: "none",
                                appearance: "auto",
                                textAlign: "center",
                            }}
                            onChange={(e) => handleStatusChange(row._id, e.target.value)}
                            className="taskStatusSelect_a8f3c1"
                        >
                            <option value="" style={{ color: "black" }}>Not Started</option>
                            {STATUS_OPTIONS.filter(opt => opt.value !== "Cancelled").map(opt => (
                                <option key={opt.value} value={opt.value} style={{ color: "black" }}>{opt.label}</option>
                            ))}
                        </select>
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

            case "userAttachments":
                return (
                    <td key="userAttachments" style={{ fontSize: "14px" }}>
                        {Array.isArray(row._rawUserAttachments) && row._rawUserAttachments.length > 0 ? (
                            row._rawUserAttachments.map((file, fi) => {
                                const fileName = file?.fileName || file?.name || row.userAttachments?.[fi] || "Attachment";
                                const attachmentId = file?._id;
                                return (
                                    <div key={`uatt-${fi}`}>
                                        <button type="button" title="Click to download"
                                            onClick={() => handleDownloadAttachment(row, attachmentId, fileName, "user-attachments")}
                                            disabled={!attachmentId}
                                            style={{ padding: 0, border: "none", background: "transparent", color: "#0B5ED7", textDecoration: "underline", cursor: attachmentId ? "pointer" : "not-allowed", fontSize: "14px", textAlign: "left" }}>
                                            {fileName}
                                        </button>
                                        {fi < row._rawUserAttachments.length - 1 && <hr style={{ margin: "4px 0", border: "none", borderTop: "1px solid #e0e0e0" }} />}
                                    </div>
                                );
                            })
                        ) : <span>No files</span>}
                    </td>
                );

            case "userComments":
                return <td key="userComments" style={{ fontSize: "14px" }}>{row.userComments || "-"}</td>;

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

                // ── Viewer (responsible person) on a MANUAL task → read-only cell ──
                if (view === "viewer") {
                    return (
                        <td key="closeStatus" className="procCent" style={{
                            fontSize: "14px",
                            backgroundColor: isAlreadyClosed ? "#7EAC87" : "white",
                            color: isAlreadyClosed ? "#fff" : "black",
                            borderLeft: "1px solid white", borderRight: "1px solid white"
                        }}>
                            {isAlreadyClosed ? "Closed Out" : "Open"}
                        </td>
                    );
                }

                // ── Viewer on an AUTO-AUTO task → interactive checkbox (responsible can close) ──
                if (view === "viewer" && isAutoAuto) {
                    const checkboxDisabled = isCancelled || (!isCompleted && !isAlreadyClosed) || isClosing || isReopening;
                    return (
                        <td key="closeStatus" className="procCent" style={{ fontSize: "14px" }}>
                            <input type="checkbox" className="checkbox-inp-abbr"
                                checked={isAlreadyClosed}
                                disabled={checkboxDisabled && !isAlreadyClosed}
                                title={
                                    isCancelled
                                        ? "Cancelled tasks cannot be closed out"
                                        : isAlreadyClosed
                                            ? "Click to reopen this task"
                                            : !isCompleted
                                                ? "Task must be 'Completed' before closeout"
                                                : "Close out this task"
                                }
                                style={{ cursor: (checkboxDisabled && !isAlreadyClosed) ? "not-allowed" : "pointer", opacity: (checkboxDisabled && !isAlreadyClosed) ? 0.4 : 1 }}
                                onChange={() => {
                                    if (isCancelled) {
                                        toast.warn("Cancelled tasks cannot be closed out.", { autoClose: 3000, closeButton: false });
                                        return;
                                    }
                                    if (isAlreadyClosed) { openReopenTaskPopup(row); }
                                    else { if (!isCompleted || isClosing || isReopening) return; openCloseTaskPopup(row); }
                                }}
                            />
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
                                    ? "Cancelled tasks cannot be closed out"
                                    : isAlreadyClosed
                                        ? "Click to reopen this task"
                                        : !isCompleted
                                            ? "Task must be 'Completed' before closeout"
                                            : "Close out this task"
                            }
                            style={{ cursor: (checkboxDisabled && !isAlreadyClosed) ? "not-allowed" : "pointer", opacity: (checkboxDisabled && !isAlreadyClosed) ? 0.4 : 1 }}
                            onChange={() => {
                                if (isCancelled) {
                                    toast.warn("Cancelled tasks cannot be closed out.", { autoClose: 3000, closeButton: false });
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

            case "allocationType":
                return (
                    <td key="allocationType" className="procCent" style={{ fontSize: "14px" }}>
                        {row._isAllocator ? "Tasks Assigned" : "My Tasks"}
                    </td>
                );

            case "action":
                return (
                    <td key="action" className="risk-control-attributes-action-cell">
                        {view === "allocator" ? (
                            <>
                                {/* Job card only for manual tasks */}
                                {(!isAutoAuto && !isAutoManual && !row.isTagged) && (
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
                                <button type="button" className="rca-action-btn" title="Delete Task"
                                    style={{ marginLeft: "5px" }} onClick={() => openDeleteTaskPopup(row)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </>
                        ) : view === "closedOut" ? (
                            <>
                                {/* In closed-out view: job card for manual allocators/both; nothing for responsible-only */}
                                {(!isAutoAuto && !isAutoManual && !row.isTagged && row._isAllocator) && (
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
                                {/* Restore/reopen — allocator (or both) only. A sub-task can't be
                                    reopened while its main task is still closed out. */}
                                {row._isAllocator === true && (() => {
                                    const isReopening = reopeningTaskIds.has(row._id);
                                    const isBlockedByParent = !!row.isSubTask && !!row._parentTaskClosed;
                                    return (
                                        <button
                                            type="button"
                                            className="rca-action-btn"
                                            title={
                                                isBlockedByParent
                                                    ? "Main task has been closed out"
                                                    : "Restore (reopen) this task"
                                            }
                                            style={{
                                                marginLeft: "5px",
                                                cursor: (isReopening || isBlockedByParent) ? "not-allowed" : "pointer",
                                                opacity: (isReopening || isBlockedByParent) ? 0.4 : 1,
                                            }}
                                            disabled={isReopening || isBlockedByParent}
                                            onClick={() => {
                                                if (isBlockedByParent) return;
                                                openReopenTaskPopup(row);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faClockRotateLeft} />
                                        </button>
                                    );
                                })()}
                            </>
                        ) : (
                            <>
                                {/* Accept/delegate only for manual tasks that haven't been accepted */}
                                {(!isAutoAuto && !isAutoManual) && row.acceptanceStatus !== "Accepted" && (
                                    <button
                                        type="button"
                                        className="rca-action-btn"
                                        title="Accept or Delegate Task"
                                        style={{ color: "gray" }}
                                        onClick={() => setAcceptTaskPopup({ open: true, task: row })}
                                    >
                                        <FontAwesomeIcon icon={faCircleCheck} />
                                    </button>
                                )}
                                {/* Job card only for manual tasks */}
                                {(!isAutoAuto && !isAutoManual) && (
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
                                {/* History hidden for auto-auto tasks */}
                            </>
                        )}
                    </td>
                );

            default:
                return null;
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    const pageLabel = view === "allocator" ? "Task Management" : view === "closedOut" ? "Closed Out Tasks" : "Update my Tasks";

    const handleAutoManualNavigation = (row) => {
        const route = getAutoManualNavigationRoute(row);

        if (route) {
            navigate(route);
        }
    };

    const handleAutoAutoNavigation = (row) => {
        const route = getAutoAutoNavigationRoute(row);

        if (route) {
            navigate(route);
        }
    };

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
                        <img src={`${process.env.PUBLIC_URL}/taskManagement2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Task Management"}</p>
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
                            <FontAwesomeIcon icon={faCirclePlus} title="Allocate Task" onClick={() => setShowAddTaskPopup(true)} />
                        </div>
                    )}

                    {view === "allocator" && canIn(access, "CTS", ["systemAdmin", "contributor"]) && (
                        <span className="fa-layers fa-fw" style={{ fontSize: "28px", color: "grey", cursor: "pointer", marginRight: "5px" }} onClick={() => setShowAddRepeatingTaskPopup(true)} title="Schedule Repeating Task">
                            <FontAwesomeIcon icon={faClock} />
                            <FontAwesomeIcon
                                icon={faCircle}
                                transform="shrink-6 down-5 right-7"
                                color="white"   /* or whatever contrast you need */
                            />
                            <FontAwesomeIcon
                                icon={faPlusCircle}
                                transform="shrink-7 down-5 right-7"
                                color="gray"   /* or whatever contrast you need */
                            />
                        </span>
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
                            {["My Tasks", "Tasks Assigned", "Closed Out Tasks"].map((pill) => (
                                <div
                                    key={pill}
                                    className={`control-attributes-pill ${categoryTab === pill ? "active" : ""}`}
                                    onClick={() => {
                                        let newView = pill;
                                        if (pill === "My Tasks") newView = "viewer";
                                        else if (pill === "Tasks Assigned") newView = "allocator";
                                        else if (pill === "Closed Out Tasks") newView = "closedOut";

                                        switchView(newView)
                                        setCategoryTab(pill);
                                    }}
                                >
                                    {pill}
                                </div>
                            ))}
                        </div>

                        <label className="risk-control-label-new">{"Task Management"}</label>

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

                        <FontAwesomeIcon
                            icon={faDownload}
                            title="Export to Excel"
                            className={showResetButton ? `top-right-button-control-att-4-new` : "top-right-button-control-att-3-new"}
                            style={{ cursor: "pointer", color: "gray" }}
                            onClick={handleExportExcel}
                        />

                        <button
                            className={showResetButton ? `top-right-button-control-att-5-new` : "top-right-button-control-att-4-new"}
                            title="Highlight Task Due Dates"
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
                                                {col.id === "category" && (
                                                    <span
                                                        className="category-info-btn"
                                                        role="button"
                                                        tabIndex={0}
                                                        title="What does Source mean?"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowCategoryInfo(prev => !prev);
                                                        }}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        style={{ marginLeft: "6px", cursor: "pointer", color: "white" }}
                                                    >
                                                        <FontAwesomeIcon icon={faInfoCircle} />
                                                    </span>
                                                )}
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
                                            No tasks available
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
            {showAddTaskPopup && <AddTaskPopup onTaskAdded={fetchTasks} onClose={() => setShowAddTaskPopup(false)} />}
            {showAddSubTaskPopup && (
                <AddSubTaskPopup
                    parentTask={subTaskParent}
                    onTaskAdded={fetchTasks}
                    onClose={closeAddSubTaskPopup}
                />
            )}
            {viewSubTasksPopup.open && (
                <ViewSubTasksPopup
                    parentTask={viewSubTasksPopup.parentTask}
                    subtasks={viewSubTasksPopup.subtasks}
                    onClose={closeViewSubTasksPopup}
                />
            )}
            {viewMainTaskPopup.open && (
                <ViewMainTask
                    subTaskId={viewMainTaskPopup.subTaskId}
                    onClose={closeViewMainTaskPopup}
                />
            )}
            {isTaskDueDatePopupOpen && (
                <TaskDueDatePopup
                    isOpen={isTaskDueDatePopupOpen}
                    onClose={() => setIsTaskDueDatePopupOpen(false)}
                    onUpdate={setDueDateVal}
                    currVal={dueDateVal}
                />
            )}
            {showAddRepeatingTaskPopup && <AddRepeatingTaskPopup onTaskAdded={fetchTasks} onClose={() => setShowAddRepeatingTaskPopup(false)} />}

            {deleteTaskPopup.open && (
                <DeleteAllocatedTask
                    cancel={!deleteTaskPopup.task?._isPendingRepeating && deleteTaskPopup.task?.acceptanceStatus === "Accepted"}
                    cancelled={deleteTaskPopup.task?.status === "Cancelled"}
                    isPendingRepeating={deleteTaskPopup.task?._isPendingRepeating}
                    open={deleteTaskPopup.open} task={deleteTaskPopup.task} taskName={deleteTaskPopup.taskName}
                    onClose={closeDeleteTaskPopup} handleDeleteTask={handleDeleteTask}
                />
            )}

            {closeTaskPopup.open && (
                <CloseAllocatedTask
                    open={closeTaskPopup.open} taskName={closeTaskPopup.taskName}
                    onClose={closeCloseTaskPopup}
                    onConfirm={(comments) => { handleCloseTask(closeTaskPopup.task._id, comments); closeCloseTaskPopup(); }}
                />
            )}

            {reopenTaskPopup.open && (
                <ReopenAllocatedTask
                    open={reopenTaskPopup.open} taskName={reopenTaskPopup.taskName}
                    onClose={closeReopenTaskPopup}
                    onConfirm={(message) => { handleReopenTask(reopenTaskPopup.task._id, message); closeReopenTaskPopup(); }}
                />
            )}

            {showModifyAllocatedTaskPopup && (
                <ModifyAllocatedTaskPopup task={selectedAllocatedTask} onClose={handleCloseModifyAllocatedTaskPopup} onTaskUpdated={fetchTasks} />
            )}

            {/* Viewer popup — passes _taskSource through so ModifyMyTask can route correctly */}
            {showModifyPopup && (
                <ModifyMyTask onClose={handleCloseModifyPopup} data={selectedTask} onSaved={handleTaskSaved} />
            )}

            {/* Accept Task popup — manual tasks only */}
            {acceptTaskPopup.open && (
                <AcceptTaskPopup
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

            {/* Delegate Task popup — manual tasks only */}
            {delegateTaskPopup.open && (
                <DelegateTaskPopup
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

            {showCategoryInfo && (<TaskSourceInfo setClose={() => setShowCategoryInfo(false)} />)}
            <ToastContainer />
        </div>
    );
};

export default ManualTaskingPage;