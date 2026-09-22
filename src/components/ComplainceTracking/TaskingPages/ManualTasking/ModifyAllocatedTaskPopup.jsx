import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCirclePlus, faCalendarDays, faTrash, faClock } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { toast } from 'react-toastify';

const AREAS = [
    "All Areas",
    "Offices",
    "Plant",
    "Surface",
    "Underground",
];

const ModifyAllocatedTaskPopup = ({ onClose, onTaskUpdated, task }) => {
    const [taskTitle, setTaskTitle] = useState("");
    const [taskPriority, setTaskPriority] = useState("");
    const [taskType, setTaskType] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [responsiblePerson, setResponsiblePerson] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [dueTime, setDueTime] = useState(null);
    const [comments, setComments] = useState("");
    const [loading, setLoading] = useState(false);
    const [area, setArea] = useState("");
    const [discipline, setDiscipline] = useState("");
    const [disciplineOptions, setDisciplineOptions] = useState([]);

    const [attachements, setAttachements] = useState([]);
    const [attachmentsToDelete, setAttachmentsToDelete] = useState([]);
    const attachmentInputRef = useRef(null);
    const [pendingInsertAfterId, setPendingInsertAfterId] = useState(null);

    const [users, setUsers] = useState([]);

    const generateAttachmentId = () => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        return `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    };

    const getDisplayFileName = (fileName = "") => {
        const lastDotIndex = fileName.lastIndexOf(".");
        if (lastDotIndex <= 0) return fileName;
        return fileName.slice(0, lastDotIndex);
    };

    const handleOpenAttachmentPicker = (afterId = null) => {
        setPendingInsertAfterId(afterId);
        attachmentInputRef.current?.click();
    };

    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

    const handleAttachmentChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (!selectedFiles.length) return;

        setAttachements((prev) => {
            const existingNames = new Set(
                prev.map((item) => String(item.name || "").toLowerCase().trim())
            );

            const validFiles = [];

            selectedFiles.forEach((file) => {
                const normalizedName = String(file.name || "").toLowerCase().trim();

                const alreadyExists =
                    existingNames.has(normalizedName) ||
                    validFiles.some(
                        (item) =>
                            String(item.name || "").toLowerCase().trim() === normalizedName
                    );

                if (alreadyExists) {
                    toast.warn(`"${getDisplayFileName(file.name)}" was not added because a file with the same name already exists.`, {
                        autoClose: 2000,
                        closeButton: false,
                    });
                    return;
                }

                if (file.size > MAX_FILE_SIZE_BYTES) {
                    toast.warn(`"${getDisplayFileName(file.name)}" was not added because it is larger than 5 MB.`, {
                        autoClose: 2000,
                        closeButton: false,
                    });
                    return;
                }

                validFiles.push({
                    id: generateAttachmentId(),
                    file,
                    name: file.name,
                    displayName: getDisplayFileName(file.name),
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                    isNew: true,
                });

                existingNames.add(normalizedName);
            });

            if (!validFiles.length) {
                return prev;
            }

            if (!pendingInsertAfterId || prev.length === 0) {
                return [...prev, ...validFiles];
            }

            const insertIndex = prev.findIndex((item) => item.id === pendingInsertAfterId);

            if (insertIndex === -1) {
                return [...prev, ...validFiles];
            }

            const updated = [...prev];
            updated.splice(insertIndex + 1, 0, ...validFiles);
            return updated;
        });

        setPendingInsertAfterId(null);
        e.target.value = "";
    };

    const handleRemoveAttachment = (attachmentId) => {
        setAttachements((prev) => {
            const attachmentToRemove = prev.find((item) => item.id === attachmentId);

            if (attachmentToRemove && !attachmentToRemove.isNew && attachmentToRemove.attachmentId) {
                setAttachmentsToDelete((current) => {
                    if (current.includes(attachmentToRemove.attachmentId)) return current;
                    return [...current, attachmentToRemove.attachmentId];
                });
            }

            return prev.filter((item) => item.id !== attachmentId);
        });
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_URL}/api/complainceTasks/getUsers/assignable-users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();

            const sortedUsers = data.users.sort((a, b) => {
                return a.username.localeCompare(b.username);
            });

            setUsers(sortedUsers);
        } catch (error) {
            toast.error('Failed to fetch users.', {
                autoClose: 2000,
                closeButton: false,
            });
        }
    };

    const fetchDepartments = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/department/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data?.error || "Failed to fetch departments");
            }

            const sortedDepartments = [...data.departments].sort((a, b) =>
                String(a.department || "").localeCompare(
                    String(b.department || ""),
                    undefined,
                    { sensitivity: "base" }
                )
            );

            setDisciplineOptions(sortedDepartments);
        } catch (error) {
            console.error("Failed to fetch departments:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchDepartments();
    }, []);

    useEffect(() => {
        if (!task) return;
        console.log("Initializing ModifyAllocatedTaskPopup with task:", task);
        setTaskDescription(task.taskDescription || "");
        setResponsiblePerson(
            typeof task?.responsible === "object"
                ? task?.responsible?._id || ""
                : task?.responsible || ""
        );
        setTaskTitle(task.taskTitle || "");
        setTaskPriority(task.priority || "");
        setTaskType(task.taskType || "");
        setDueDate(
            task?.dueDate
                ? (() => {
                    const d = new Date(task.dueDate);
                    if (isNaN(d.getTime())) return String(task.dueDate).slice(0, 10);
                    const gmt2 = new Date(d.getTime() + 2 * 60 * 60 * 1000);
                    return gmt2.toISOString().slice(0, 10);
                })()
                : ""
        );
        setDueTime(null); // time picker hidden
        setComments(task.comments || "");
        setArea(task.area || "");
        setDiscipline(task.discipline || "");

        const existingAttachments = (task.attachments || []).map((attachment, index) => {
            const fileName =
                typeof attachment === "string"
                    ? attachment
                    : attachment?.fileName || attachment?.name || `Attachment ${index + 1}`;

            return {
                id: attachment?._id || `existing_${index}`,
                attachmentId: typeof attachment === "string" ? null : attachment?._id || null,
                name: fileName,
                displayName: getDisplayFileName(fileName),
                isNew: false,
            };
        });

        setAttachements(existingAttachments);
        setAttachmentsToDelete([]);
    }, [task]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!taskTitle.trim()) {
            toast.warn('Task title is required.', { autoClose: 2000, closeButton: false });
            return;
        }

        if (!taskPriority.trim()) {
            toast.warn('Task priority is required.', { autoClose: 2000, closeButton: false });
            return;
        }

        if (!taskType.trim()) {
            toast.warn('Task type is required.', { autoClose: 2000, closeButton: false });
            return;
        }

        if (!taskDescription.trim()) {
            toast.warn('Task description is required.', { autoClose: 2000, closeButton: false });
            return;
        }

        if (!responsiblePerson) {
            toast.warn('Responsible person is required.', { autoClose: 2000, closeButton: false });
            return;
        }

        if (!dueDate) {
            toast.warn('Due date is required.', { autoClose: 2000, closeButton: false });
            return;
        }

        if (!discipline.trim()) {
            toast.warn('Task discipline is required.', { autoClose: 2000, closeButton: false });
            return;
        }

        if (!area.trim()) {
            toast.warn('Task area is required.', { autoClose: 2000, closeButton: false });
            return;
        }


        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('You are not logged in.', { autoClose: 2000, closeButton: false });
            return;
        }

        if (!task?._id) {
            toast.error('Task ID is missing.', { autoClose: 2000, closeButton: false });
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('taskDescription', taskDescription.trim());
            formData.append('responsible', responsiblePerson);

            formData.append('responsibleName', responsiblePerson?.username || "");
            formData.append('taskType', taskType);
            formData.append('taskTitle', taskTitle);
            formData.append('taskPriority', taskPriority);

            // Date-only — store as start of day in GMT+2 (Africa/Johannesburg)
            const dueDateOnly = `${dueDate}T00:00:00+02:00`;
            formData.append('dueDate', dueDateOnly);
            formData.append('comments', comments.trim());
            formData.append('area', area);
            formData.append('discipline', discipline);

            attachements.forEach((attachment) => {
                if (attachment.isNew && attachment.file) {
                    formData.append('attachments', attachment.file);
                }
            });

            attachmentsToDelete.forEach((attachmentId) => {
                formData.append('attachmentsToDelete', attachmentId);
            });

            const response = await axios.put(
                `${process.env.REACT_APP_URL}/api/complainceTasks/${task._id}/update-allocated-task`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            toast.success('Allocated task updated successfully.', {
                autoClose: 2000,
                closeButton: false,
            });

            onTaskUpdated?.(response.data?.task);
            onClose?.();
        } catch (error) {
            toast.error(
                error?.response?.data?.error ||
                error?.response?.data?.details ||
                'Failed to update task.',
                { autoClose: 2500, closeButton: false }
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ibra-popup-page-container">
            <div className="ibra-popup-page-overlay">
                <div className="ibra-popup-page-popup-right">
                    <div className="ibra-popup-page-popup-header-right">
                        <h2>Modify Allocated Task</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="ibra-popup-page-form-group-main-container">
                        <div className="ibra-popup-page-form-group-main-container-2 scrollable-container-controlea">
                            <div className="cea-popup-page-component-wrapper">
                                <div className={`ibra-popup-page-form-group`}>
                                    <label>Title <span className="required-field">*</span></label>
                                    <textarea
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                        className="task-title-popup-page-textarea-full"
                                        placeholder="Title of task"
                                        style={{ resize: "none" }}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="cea-popup-page-component-wrapper">
                                <div className="ibra-popup-page-form-group">
                                    <label>Description <span className="required-field">*</span></label>
                                    <textarea
                                        value={taskDescription}
                                        onChange={(e) => setTaskDescription(e.target.value)}
                                        className="cea-popup-page-textarea-full"
                                        placeholder="Description of task"
                                        style={{ resize: "none" }}
                                    />
                                </div>
                            </div>

                            <div className="ibra-popup-page-additional-row">
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group`}>
                                            <label>Type <span className="required-field">*</span></label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={taskType}
                                                    onChange={(e) => setTaskType(e.target.value)}
                                                >
                                                    <option value="">Select Option</option>
                                                    <option value="Develop">Develop</option>
                                                    <option value="Evaluate">Evaluate</option>
                                                    <option value="Inspect">Inspect</option>
                                                    <option value="Investigate">Investigate</option>
                                                    <option value="Monitor">Monitor</option>
                                                    <option value="Review">Review</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group`}>
                                            <label>Priority <span className="required-field">*</span></label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={taskPriority}
                                                    onChange={(e) => setTaskPriority(e.target.value)}
                                                >
                                                    <option value="">Select Option</option>
                                                    <option value="Critical">Critical</option>
                                                    <option value="High">High</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-additional-row">
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group">
                                            <label>Area</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={area}
                                                    onChange={(e) => {
                                                        setArea(e.target.value);
                                                    }}
                                                >
                                                    <option value="">Select Area</option>
                                                    {AREAS.map((a) => (
                                                        <option key={a} value={a}>{a}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group">
                                            <label>Department</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={discipline}
                                                    onChange={(e) => setDiscipline(e.target.value)}
                                                >
                                                    <option value="">
                                                        {"Select Department"}
                                                    </option>
                                                    {disciplineOptions.map((d) => (
                                                        <option key={d.department} value={d.department}>{d.department}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-additional-row">
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group">
                                            <label>
                                                Responsible Person <span className="required-field">*</span>
                                            </label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={responsiblePerson}
                                                    onChange={(e) => setResponsiblePerson(e.target.value)}
                                                >
                                                    <option value="">Select Option</option>
                                                    {users.map((user) => (
                                                        <option key={user._id} value={user._id}>
                                                            {user.username}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group ibra-popup-page-form-group-test">
                                            <label style={{ fontSize: "15px", marginBottom: "10px" }}>
                                                Due Date <span className="required-field">*</span>
                                            </label>
                                            <div style={{ display: "flex", gap: "10px", width: "calc(100% - 0px)" }}>
                                                <div style={{ position: "relative", width: "100%" }}>
                                                    <DatePicker
                                                        value={dueDate || ""}
                                                        onChange={(val) =>
                                                            setDueDate(val?.format("YYYY-MM-DD"))
                                                        }
                                                        format="YYYY/MM/DD"
                                                        rangeHover={false}
                                                        highlightToday={false}
                                                        editable={false}
                                                        placeholder="YYYY-MM-DD"
                                                        hideIcon={false}
                                                        inputClass="add-task-popup-page-input"
                                                        style={{
                                                            width: "calc(100% - 0px)",
                                                            height: "23px",
                                                            marginBottom: "0px"
                                                        }}
                                                        portal
                                                        portalTarget={document.body}
                                                        zIndex={999999}
                                                        onOpenPickNewDate={false}
                                                        minDate={new Date()}
                                                    />
                                                    <FontAwesomeIcon
                                                        icon={faCalendarDays}
                                                        className="date-input-calendar-icon"
                                                    />
                                                </div>
                                                {false && (
                                                    <div style={{ position: "relative", width: "25%" }}>
                                                        <DatePicker
                                                            disableDayPicker
                                                            format="HH:mm"
                                                            value={dueTime}
                                                            onChange={(val) => setDueTime(val)}
                                                            inputClass="add-task-popup-page-input"
                                                            placeholder='HH:mm'
                                                            style={{
                                                                width: "calc(100% - 0px)",
                                                                height: "23px",
                                                                marginBottom: "0px"
                                                            }}
                                                            zIndex={999999}
                                                            portal
                                                            portalTarget={document.body}
                                                            plugins={[
                                                                <TimePicker hideSeconds />
                                                            ]}
                                                        />
                                                        <FontAwesomeIcon
                                                            icon={faClock}
                                                            className="date-input-calendar-icon"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-component-wrapper">
                                <div className="ibra-popup-page-form-group">
                                    <label style={{ fontSize: "15px" }}>Comments/ Notes</label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        className="cea-popup-page-textarea-full"
                                        placeholder="Add Comments or Notes"
                                        style={{ resize: "none" }}
                                    />
                                </div>
                            </div>

                            <div className="cea-popup-page-component-wrapper">
                                <div className="ibra-popup-page-form-group">
                                    <label style={{ fontSize: "15px" }}>Upload Supporting Information</label>

                                    <input
                                        ref={attachmentInputRef}
                                        type="file"
                                        multiple
                                        style={{ display: "none" }}
                                        onChange={handleAttachmentChange}
                                    />

                                    {attachements.length === 0 ? (
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                paddingTop: "8px",
                                                paddingBottom: "4px"
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className="ibra-popup-page-action-button-add-hazard"
                                                onClick={() => handleOpenAttachmentPicker(null)}
                                                title="Add Attachment"
                                                style={{ fontSize: "22px" }}
                                            >
                                                <FontAwesomeIcon icon={faCirclePlus} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {attachements.map((attachment) => (
                                                <div
                                                    key={attachment.id}
                                                    className="cea-popup-page-component-wrapper"
                                                    style={{
                                                        marginBottom: "0px",
                                                        padding: "10px 12px"
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            gap: "12px"
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                minWidth: 0,
                                                                flex: 1,
                                                                fontSize: "14px",
                                                                color: "#333",
                                                                wordBreak: "break-word"
                                                            }}
                                                        >
                                                            {attachment.displayName}
                                                        </div>

                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "6px"
                                                            }}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="ibra-popup-page-action-button"
                                                                onClick={() => handleRemoveAttachment(attachment.id)}
                                                                title="Remove Attachment"
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="ibra-popup-page-action-button-add-hazard"
                                                                onClick={() => handleOpenAttachmentPicker(attachment.id)}
                                                                title="Add Attachment Below"
                                                            >
                                                                <FontAwesomeIcon icon={faCirclePlus} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="ibra-popup-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="ibra-popup-page-upload-button"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModifyAllocatedTaskPopup;