import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCalendarDays, faDownload } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import './AddTaskPopup.css';

const AREAS = [
    "All Areas",
    "Offices",
    "Plant",
    "Surface",
    "Underground",
];

// Props applied to every <select> so it behaves as read-only without ever
// getting the greyed-out "disabled" look — the dropdown simply can't be
// opened or changed.
const readOnlySelectProps = {
    onChange: () => { },
    onMouseDown: (e) => e.preventDefault(),
    onKeyDown: (e) => e.preventDefault(),
    tabIndex: -1,
    style: { pointerEvents: "none" },
};

const ViewMainTask = ({ onClose, subTaskId }) => {
    const [loading, setLoading] = useState(false);
    const [mainTask, setMainTask] = useState(null);

    const [taskTitle, setTaskTitle] = useState("");
    const [taskPriority, setTaskPriority] = useState("");
    const [taskType, setTaskType] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [responsiblePerson, setResponsiblePerson] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [comments, setComments] = useState("");
    const [area, setArea] = useState("");
    const [discipline, setDiscipline] = useState("");
    const [disciplineOptions, setDisciplineOptions] = useState([]);
    const [users, setUsers] = useState([]);
    const [attachements, setAttachements] = useState([]);

    const getDisplayFileName = (fileName = "") => {
        const lastDotIndex = fileName.lastIndexOf(".");
        if (lastDotIndex <= 0) return fileName;
        return fileName.slice(0, lastDotIndex);
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
            // Non-fatal — only affects how the read-only Responsible Person
            // select renders its label.
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

    // Given only the id of a sub-task, this fetches the main task it belongs to.
    const fetchMainTask = async () => {
        if (!subTaskId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/complainceTasks/${subTaskId}/main-task`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data?.error || 'Failed to fetch main task');
            }

            setMainTask(data.task);
        } catch (error) {
            toast.error(error.message || 'Failed to fetch main task.', {
                autoClose: 2500,
                closeButton: false,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchMainTask();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subTaskId]);

    useEffect(() => {
        if (!mainTask) return;

        setTaskTitle(mainTask.taskTitle || "");
        setTaskDescription(mainTask.taskDescription || "");
        setTaskPriority(mainTask.priority || "");
        setTaskType(mainTask.taskType || "");
        setResponsiblePerson(
            typeof mainTask?.responsible === "object"
                ? mainTask?.responsible?._id || ""
                : mainTask?.responsible || ""
        );
        setDueDate(
            mainTask?.dueDate
                ? (() => {
                    const d = new Date(mainTask.dueDate);
                    if (isNaN(d.getTime())) return String(mainTask.dueDate).slice(0, 10);
                    const gmt2 = new Date(d.getTime() + 2 * 60 * 60 * 1000);
                    return gmt2.toISOString().slice(0, 10);
                })()
                : ""
        );
        setComments(mainTask.comments || "");
        setArea(mainTask.area || "");
        setDiscipline(mainTask.discipline || "");

        const existingAttachments = (mainTask.attachments || []).map((attachment, index) => {
            const fileName =
                typeof attachment === "string"
                    ? attachment
                    : attachment?.fileName || attachment?.name || `Attachment ${index + 1}`;

            return {
                id: attachment?._id || `existing_${index}`,
                attachmentId: typeof attachment === "string" ? null : attachment?._id || null,
                name: fileName,
                displayName: getDisplayFileName(fileName),
            };
        });

        setAttachements(existingAttachments);
    }, [mainTask]);

    const handleDownloadAttachment = async (attachmentId, fileName) => {
        const token = localStorage.getItem('token');
        if (!token || !mainTask?._id || !attachmentId) return;

        try {
            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/complainceTasks/${mainTask._id}/attachments/${attachmentId}/download`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!response.ok) throw new Error("Failed to download attachment");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName || "attachment";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Failed to download file. Please try again.", {
                autoClose: 3000,
                closeButton: false,
            });
        }
    };

    return (
        <div className="ibra-popup-page-container">
            <div className="ibra-popup-page-overlay">
                <div className="ibra-popup-page-popup-right">
                    <div className="ibra-popup-page-popup-header-right">
                        <h2>Main Task Information</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="ibra-popup-page-form-group-main-container">
                        <div className="ibra-popup-page-form-group-main-container-2 scrollable-container-controlea">
                            {loading ? (
                                <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                                    <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                                </div>
                            ) : (
                                <>
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group">
                                            <label>Title</label>
                                            <textarea
                                                readOnly
                                                value={taskTitle}
                                                className="task-title-popup-page-textarea-full"
                                                placeholder="Title of task"
                                                style={{ resize: "none" }}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="cea-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group">
                                            <label>Description</label>
                                            <textarea
                                                readOnly
                                                value={taskDescription}
                                                className="cea-popup-page-textarea-full"
                                                placeholder="Description of task"
                                                style={{ resize: "none" }}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="ibra-popup-page-additional-row">
                                        <div className="ibra-popup-page-column-half">
                                            <div className="cea-popup-page-component-wrapper">
                                                <div className="ibra-popup-page-form-group">
                                                    <label>Type</label>
                                                    <div className="ibra-popup-page-select-container">
                                                        <select
                                                            className="ibra-popup-page-select"
                                                            value={taskType}
                                                            {...readOnlySelectProps}
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
                                                <div className="ibra-popup-page-form-group">
                                                    <label>Priority</label>
                                                    <div className="ibra-popup-page-select-container">
                                                        <select
                                                            className="ibra-popup-page-select"
                                                            value={taskPriority}
                                                            {...readOnlySelectProps}
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
                                                            {...readOnlySelectProps}
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
                                                            {...readOnlySelectProps}
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
                                                    <label>Responsible Person</label>
                                                    <div className="ibra-popup-page-select-container">
                                                        <select
                                                            className="ibra-popup-page-select"
                                                            value={responsiblePerson}
                                                            {...readOnlySelectProps}
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
                                            <div className="ibra-popup-page-component-wrapper">
                                                <div className="ibra-popup-page-form-group ibra-popup-page-form-group-test">
                                                    <label style={{ fontSize: "15px", marginBottom: "10px" }}>Due Date</label>
                                                    <div style={{ display: "flex", gap: "10px", width: "calc(100% - 22px)" }}>
                                                        <div style={{ position: "relative", width: "100%" }}>
                                                            <input
                                                                readOnly
                                                                type="text"
                                                                value={dueDate || ""}
                                                                placeholder="YYYY-MM-DD"
                                                                className="add-task-popup-page-input"
                                                                style={{
                                                                    width: "calc(100% - 0px)",
                                                                    height: "23px",
                                                                    marginBottom: "0px",
                                                                    textAlign: "center",
                                                                }}
                                                            />
                                                            <FontAwesomeIcon
                                                                icon={faCalendarDays}
                                                                style={{ right: "-7px" }}
                                                                className="date-input-calendar-icon"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ibra-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group">
                                            <label style={{ fontSize: "15px" }}>Comments/ Notes</label>
                                            <textarea
                                                readOnly
                                                value={comments}
                                                className="cea-popup-page-textarea-full"
                                                placeholder="Add Comments or Notes"
                                                style={{ resize: "none" }}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="cea-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group">
                                            <label style={{ fontSize: "15px" }}>Supporting Information</label>

                                            {attachements.length === 0 ? (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        paddingTop: "8px",
                                                        paddingBottom: "4px",
                                                        fontSize: "14px",
                                                        color: "#777",
                                                    }}
                                                >
                                                    No attachments
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
                                                                        className="ibra-popup-page-action-button-add-hazard"
                                                                        onClick={() => handleDownloadAttachment(attachment.attachmentId, attachment.name)}
                                                                        title="Download Attachment"
                                                                        disabled={!attachment.attachmentId}
                                                                    >
                                                                        <FontAwesomeIcon icon={faDownload} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewMainTask;
