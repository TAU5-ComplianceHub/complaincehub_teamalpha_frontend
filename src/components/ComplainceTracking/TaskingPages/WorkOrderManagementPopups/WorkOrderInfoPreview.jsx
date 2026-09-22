import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import ActionFieldsPreviewBox, { fieldStillNeedsScheduling } from "./ActionFieldsPreviewBox";

// ---------------------------------------------------------------------------
// WorkOrderInfoPreview
//
// "View Work Order Information" popup. Opened from the Preview button on
// the allocator's Work Order Management table, only once a work order's
// status is "Completed". Unlike TemplatePreview (which reuses the shared
// create-page field set from a formData object already held in memory),
// this popup only ever needs to show the Action Fields (and the responsible
// person's sign-off) the responsible person actually submitted, so rather
// than reusing TemplatePreviewContent it fetches the task fresh from
// GET /api/workOrderTasks/:id and renders just ActionFieldsPreviewBox,
// permanently read-only.
//
// The popup body scrolls (it shouldn't usually need to - action fields are
// rarely long enough to overflow - but nothing is clipped if they do).
//
// Closing (the X) does nothing beyond closing this popup - formData/tasks
// upstream are never touched. The "Close Out Task" button also just closes
// this popup; it hands off to onCloseOut, which the caller (WorkManagement)
// uses to open the existing CloseAllocatedWorkOrder confirmation popup for
// this task - the very same one already used by the closeStatus checkbox
// elsewhere in the table. This popup never calls the close-out API itself.
// ---------------------------------------------------------------------------
const WorkOrderInfoPreview = ({ open, taskId, onClose, onCloseOut }) => {
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open || !taskId) return;

        let cancelled = false;
        setTask(null);
        setError("");
        setLoading(true);

        const fetchTask = async () => {
            try {
                const storedToken = localStorage.getItem("token");
                const response = await axios.get(
                    `${process.env.REACT_APP_URL}/api/workOrderTasks/${taskId}`,
                    { headers: { Authorization: `Bearer ${storedToken}` } }
                );
                if (!cancelled) setTask(response.data?.task || null);
            } catch {
                if (!cancelled) setError("Failed to load work order information. Please try again.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchTask();

        return () => { cancelled = true; };
    }, [open, taskId]);

    // Re-fetches the task in place (no loading/error state changes) so the
    // popup can silently refresh itself after a Schedule Task action -
    // without this, a newly-linked ctsTaskID on the action field wouldn't
    // show up until the popup was closed and reopened.
    const refreshTask = async () => {
        if (!taskId) return;
        try {
            const storedToken = localStorage.getItem("token");
            const response = await axios.get(
                `${process.env.REACT_APP_URL}/api/workOrderTasks/${taskId}`,
                { headers: { Authorization: `Bearer ${storedToken}` } }
            );
            setTask(response.data?.task || null);
        } catch {
            // Silent - the popup already has the pre-schedule data on
            // screen, so a failed refresh just means it stays slightly
            // stale rather than breaking the view.
        }
    };

    // A work order can't be closed out while any action field that needed a
    // follow-up task still doesn't have one scheduled - see
    // fieldStillNeedsScheduling / ctsTaskID in ActionFieldsPreviewBox.
    const pendingScheduleCount = (task?.actionFields || []).filter(fieldStillNeedsScheduling).length;
    const canCloseOut = pendingScheduleCount === 0;

    // "Save" is just a friendlier-looking way to close the popup - nothing
    // is actually persisted here (there's nothing to persist; the popup is
    // permanently read-only). It shows a brief confirmation toast and then
    // calls onClose, exactly like the X button up top.
    const handleSave = () => {
        toast.success("Progress Saved", { autoClose: 1200, closeButton: false });
        onClose();
    };

    if (!open) return null;

    return (
        <div className="template-preview-overlay">
            <div className="template-preview-panel">
                <div className="template-preview-header">
                    <h2 className="font-fam-labels">View Work Order Information</h2>
                    <FontAwesomeIcon
                        icon={faTimes}
                        className="template-preview-close"
                        onClick={onClose}
                        title="Close"
                    />
                </div>

                <div
                    className="scrollable-box-preview template-preview-body"
                    style={{ overflowY: "auto" }}
                >
                    {loading && (
                        <p style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                            Loading work order information...
                        </p>
                    )}

                    {!loading && error && (
                        <p style={{ textAlign: "center", padding: "20px", color: "#CB6F6F" }}>
                            {error}
                        </p>
                    )}

                    {!loading && !error && task && (
                        <div className="input-row">
                            <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#7EAC89", color: "white", fontWeight: "bold" }}>
                                {`This work order was completed on the ${task.pdfEvidence ? "desktop application." : "mobile application."}`}
                            </div>
                        </div>
                    )}

                    {!loading && !error && task && (
                        <ActionFieldsPreviewBox
                            taskId={task._id}
                            actionFields={task.actionFields || []}
                            collapsible={false}
                            area={task.mainArea || ""}
                            department={task.department || ""}
                            workOrderType={task.workOrderType || ""}
                            workOrderTitle={task.taskTitle || ""}
                            priority={task.priority || ""}
                            workOrderAttachments={task.attachments || []}
                            pdfEvidence={task.pdfEvidence || null}
                            responsibleSignature={task.responsibleSignature || null}
                            onTaskAdded={refreshTask}
                        />
                    )}
                </div>

                <div className="input-row-buttons" style={{ marginBottom: "15px", marginTop: "5px" }}>
                    <button
                        type="button"
                        className="generate-button font-fam"
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        className="generate-button font-fam"
                        onClick={onCloseOut}
                        disabled={!canCloseOut}
                        title={!canCloseOut ? "Assign a task for every outstanding action field first." : undefined}
                        style={!canCloseOut ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                    >
                        Close Out Task
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkOrderInfoPreview;