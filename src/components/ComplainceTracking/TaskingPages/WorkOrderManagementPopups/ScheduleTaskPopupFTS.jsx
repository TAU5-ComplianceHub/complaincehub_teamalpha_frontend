import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrashAlt, faPlus, faInfoCircle, faCirclePlus, faCalendarDays, faTrash, faClock } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { toast } from 'react-toastify';

const ScheduleTaskPopupFTS = ({
    onClose,
    onTaskAdded,
    workOrderTaskId,
    actionFieldId,
    area: areaProp,
    department,
    workOrderType,
    workOrderTitle,
    priority,
    workOrderAttachments = [],
    relatedDocuments = [],
    actionFieldTitle = "",
}) => {
    const [taskTitle, setTaskTitle] = useState(workOrderTitle || "");
    const [taskPriority, setTaskPriority] = useState("");
    const [taskType, setTaskType] = useState(workOrderType || "");
    const [taskDescription, setTaskDescription] = useState(actionFieldTitle || "");
    const [responsiblePerson, setResponsiblePerson] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [dueTime, setDueTime] = useState(null);
    const [comments, setComments] = useState("");
    const [loading, setLoading] = useState(false);
    const [attachements, setAttachements] = useState([]);
    const attachmentInputRef = useRef(null);
    const [pendingInsertAfterId, setPendingInsertAfterId] = useState(null);
    const [users, setUsers] = useState([]);
    const [area, setArea] = useState(areaProp || "");
    const [discipline, setDiscipline] = useState(department || "");
    const [removedSupportingInfoKeys, setRemovedSupportingInfoKeys] = useState(new Set());

    // Keep the read-only fields in sync in case the props arrive/change
    // after the popup has already mounted.
    useEffect(() => {
        setTaskTitle(workOrderTitle || "");
    }, [workOrderTitle]);

    useEffect(() => {
        setTaskDescription(actionFieldTitle || "");
    }, [actionFieldTitle]);

    useEffect(() => {
        setArea(areaProp || "");
    }, [areaProp]);

    useEffect(() => {
        setDiscipline(department || "");
    }, [department]);

    // Supporting info carried over from the work order - shown read-only
    // (no download) since it's just here so the person scheduling
    // the follow-up task can see what's already on record, though it can
    // be unlinked from this task via the trash icon. Two sources:
    //   - workOrderAttachments: the parent work order's own attachments
    //     (full attachmentSchema objects - fileName/azureFileName/etc. are
    //     already on hand, so they can be copied straight onto the new
    //     task's attachments without the backend re-fetching anything).
    //   - relatedDocuments: the specific action field's linked documents.
    //     These only carry {id, name} on the work order (id references a
    //     FileRevised document) - not enough to build an attachment record
    //     on the frontend, so only the id is sent and the backend resolves
    //     it against FileRevised.
    const linkedWorkOrderAttachments = Array.isArray(workOrderAttachments) ? workOrderAttachments : [];
    const linkedRelatedDocuments = Array.isArray(relatedDocuments) ? relatedDocuments : [];

    // Keys are computed against the original (unfiltered) arrays first so
    // that removing one item doesn't shift the index-based fallback key of
    // the ones after it.
    const workOrderAttachmentItems = linkedWorkOrderAttachments.map((attachment, index) => ({
        key: `wo-${attachment._id || attachment.azureFileName || attachment.fileName || index}`,
        attachment,
    }));

    const relatedDocumentItems = linkedRelatedDocuments.map((doc, index) => ({
        key: `rd-${doc.id || index}`,
        doc,
    }));

    const linkedSupportingInfo = [
        ...workOrderAttachmentItems
            .filter(({ key }) => !removedSupportingInfoKeys.has(key))
            .map(({ key, attachment }) => ({
                key,
                name: attachment.fileName || "Untitled file",
                source: "Work Order  Supporting Information",
            })),
        ...relatedDocumentItems
            .filter(({ key }) => !removedSupportingInfoKeys.has(key))
            .map(({ key, doc }) => ({
                key,
                name: doc.name || doc.id || "Untitled document",
                source: "Related Document",
            })),
    ];

    const handleRemoveLinkedSupportingInfo = (key) => {
        setRemovedSupportingInfoKeys((prev) => {
            const updated = new Set(prev);
            updated.add(key);
            return updated;
        });
    };

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
        setAttachements((prev) => prev.filter((item) => item.id !== attachmentId));
    };

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

        if (!workOrderTaskId || !actionFieldId) {
            toast.error('This task could not be linked back to its work order. Please close and reopen the popup.', { autoClose: 2500, closeButton: false });
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('You are not logged in.', { autoClose: 2000, closeButton: false });
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('taskDescription', taskDescription.trim());
            formData.append('responsible', responsiblePerson);
            formData.append('responsibleName', responsiblePerson);
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
                if (attachment.file) {
                    formData.append('attachments', attachment.file);
                }
            });

            // Existing work order attachments are sent as full attachment
            // records (fileName/azureFileName/fileSize/mimeType) since we
            // already have them in hand - the backend just needs to copy
            // them onto the new task's own attachments array. Any items the
            // user removed from the "Linked Supporting Information" list are
            // excluded here too.
            const includedWorkOrderAttachments = workOrderAttachmentItems
                .filter(({ key }) => !removedSupportingInfoKeys.has(key))
                .map(({ attachment }) => attachment);

            if (includedWorkOrderAttachments.length > 0) {
                formData.append(
                    'linkedWorkOrderAttachments',
                    JSON.stringify(
                        includedWorkOrderAttachments.map(({ fileName, azureFileName, fileSize, mimeType }) => ({
                            fileName,
                            azureFileName,
                            fileSize,
                            mimeType,
                        }))
                    )
                );
            }

            // Related documents only carry a FileRevised id + display name
            // on the work order, so just the ids go over - the backend
            // needs to look each one up (FileRevised.findById) to pull the
            // fileURL/azureFileName needed to attach it to the new task.
            // Same removal filtering applies here.
            const includedRelatedDocuments = relatedDocumentItems
                .filter(({ key }) => !removedSupportingInfoKeys.has(key))
                .map(({ doc }) => doc);

            if (includedRelatedDocuments.length > 0) {
                formData.append(
                    'relatedDocumentIds',
                    JSON.stringify(includedRelatedDocuments.map((doc) => doc.id).filter(Boolean))
                );
            }

            await axios.post(
                `${process.env.REACT_APP_URL}/api/workOrderTasks/${workOrderTaskId}/action-fields/${actionFieldId}/schedule-task`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            toast.success('Task created successfully.', { autoClose: 2000, closeButton: false });
            onTaskAdded?.();
            onClose?.();
        } catch (error) {
            toast.error(
                error?.response?.data?.error ||
                error?.response?.data?.details ||
                'Failed to create task.',
                { autoClose: 2500, closeButton: false }
            );
        } finally {
            setLoading(false);
        }
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
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="ibra-popup-page-container">
            <div className="ibra-popup-page-overlay">
                <div className="ibra-popup-page-popup-right">
                    <div className="ibra-popup-page-popup-header-right">
                        <h2>Assign Task</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="ibra-popup-page-form-group-main-container">
                        <div className="ibra-popup-page-form-group-main-container-2 scrollable-container-controlea">
                            <div className="cea-popup-page-component-wrapper">
                                <div className={`ibra-popup-page-form-group`}>
                                    <label>Title </label>
                                    <input
                                        type="text"
                                        value={taskTitle}
                                        readOnly
                                        className="add-task-popup-page-input"
                                        placeholder="Title of task"
                                    />
                                </div>
                            </div>

                            <div className="cea-popup-page-component-wrapper">
                                <div className={`ibra-popup-page-form-group`}>
                                    <label>Description <span className="required-field">*</span></label>
                                    <textarea
                                        value={taskDescription}
                                        onChange={(e) => setTaskDescription(e.target.value)}
                                        className="cea-popup-page-textarea-full"
                                        placeholder="Description of task"
                                        style={{ resize: "none" }}
                                    ></textarea>
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
                                                    <option value="Maintain">Maintain</option>
                                                    <option value="Monitor">Monitor</option>
                                                    <option value="Repair">Repair</option>
                                                    <option value="Review">Review</option>
                                                    <option value="Test">Test</option>
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
                                            <input
                                                type="text"
                                                value={area}
                                                readOnly
                                                className="add-task-popup-page-input"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group">
                                            <label>Department</label>
                                            <input
                                                type="text"
                                                value={discipline}
                                                readOnly
                                                className="add-task-popup-page-input"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-additional-row">
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group`}>
                                            <label>Responsible Person <span className="required-field">*</span></label>
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
                                    <div className="ibra-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group ibra-popup-page-form-group-test">
                                            <label style={{ fontSize: "15px", marginBottom: "10px" }}>Due Date <span className="required-field">*</span>
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
                                                            marginBottom: "0px",
                                                            textAlign: "center",
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
                                                    <div style={{ position: "relative", width: "50%" }}>
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
                                                                marginBottom: "0px",
                                                                textAlign: "center",
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
                                    <label style={{ fontSize: "15px" }}>Comments/ Notes <span className="required-field">*</span></label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        className="cea-popup-page-textarea-full"
                                        placeholder="Add Comments or Notes"
                                        style={{ resize: "none" }}
                                    ></textarea>
                                </div>
                            </div>

                            {linkedSupportingInfo.length > 0 && (
                                <div className="cea-popup-page-component-wrapper">
                                    <div className="ibra-popup-page-form-group">
                                        <label style={{ fontSize: "15px" }}>Linked Supporting Information</label>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {linkedSupportingInfo.map((item) => (
                                                <div
                                                    key={item.key}
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
                                                            {item.name}
                                                        </div>

                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "10px"
                                                            }}
                                                        >
                                                            <div style={{ fontSize: "11px", color: "#aaa", whiteSpace: "nowrap" }}>
                                                                {item.source}
                                                            </div>

                                                            <button
                                                                type="button"
                                                                className="ibra-popup-page-action-button"
                                                                onClick={() => handleRemoveLinkedSupportingInfo(item.key)}
                                                                title="Remove Item"
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(<div className="cea-popup-page-component-wrapper">
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
                            </div>)}
                        </div>
                    </div>


                    <div className="ibra-popup-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="ibra-popup-page-upload-button"
                                onClick={handleSubmit}
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : (`Submit`)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ScheduleTaskPopupFTS;