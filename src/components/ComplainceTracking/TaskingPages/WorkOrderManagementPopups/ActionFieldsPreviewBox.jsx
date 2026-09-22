import React, { useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronDown,
    faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import ActionFieldControl from "../../../FieldTracking/ActionFieldControl";
import ActionFieldFileValue from "./ActionFieldFileValue";
import CorrectiveActionPreview from "./CorrectiveActionPreview";
import AdditionalCommentsPreview from "./AdditionalCommentsPreview";
import ScheduleTaskPopupFTS from "./ScheduleTaskPopupFTS";
import ResponsibleSignaturePreview from "./ResponsibleSignaturePreview";

// ---------------------------------------------------------------------------
// ActionFieldsPreviewBox
//
// Read-only counterpart to ActionFieldsInfoBox, used only by
// WorkOrderInfoPreview (the "View Work Order Information" popup shown for
// completed work orders on the allocator's Work Order Management table). It
// differs from ActionFieldsInfoBox in two ways:
//
//   1. It reads straight off each field's own `value`/`files` - the answer
//      actually submitted, as stored on the WorkOrderTask document itself
//      (see PUT /:id/populate) - rather than a separate
//      formData.actionFieldValues map. That map only exists for the
//      still-being-built create/template/assignment flows; this box is
//      only ever shown after a work order has already been completed, so
//      the submitted `task.actionFields` array (fetched fresh from
//      GET /:id) is the single source of truth here.
//   2. "photo" and "file" fields never render ActionFieldControl (which
//      would show an upload/capture control) - they render
//      ActionFieldFileValue instead, showing the submitted file name
//      (clickable, to download) and, for photos, the image itself.
//
// Every other field type (Text, Number, Dropdown, Yes/No, etc.) still goes
// through ActionFieldControl in readOnly mode, exactly as
// ActionFieldsInfoBox does, so their display stays in sync with the
// builder/preview.
// ---------------------------------------------------------------------------
// A field's "response status" - what the responsible user did about it on
// the Populate Work Order screen when its submitted value didn't match what
// was expected. The status depends on the field's hazardClass:
//
//   - Class A: isClassAFixNow -> "Stop and Fix Now" (handled immediately,
//     never needs a follow-up task); isClassASchedule -> "Stop and Schedule"
//     (needs a follow-up task).
//   - Class B: isClassBFixNow -> "Fix Now" (handled immediately);
//     isClassBSchedule -> "Schedule Repair" (needs a follow-up task).
//   - Class C, or no hazard class at all: isSchedule -> "Schedule Repair"
//     (needs a follow-up task). isSchedule is set automatically server-side
//     for these fields (see populateWorkOrder.dart's
//     _effectiveResponseActions) rather than user-chosen.
//
// The mobile app only ever lets a field collect a corrective action when
// "Fix Now" was chosen for a Class A/B field (see
// _buildCorrectiveActionSection/_scheduleStopFixChoice in
// populateWorkOrder.dart), so a field with a corrective action already has
// isClassAFixNow or isClassBFixNow set and would otherwise fall into "Stop
// and Fix Now" / "Fix Now" below on its own. Once the corrective action is
// actually implemented (i.e. it has a before or after image - see
// hasImplementedCorrectiveAction), the status column overrides that text
// with "Corrective action implemented" instead, since that's the more
// useful thing to show once the fix is done. The corrective action's
// before/after images still render underneath the field's value regardless
// (see CorrectiveActionPreview).
//
// isStopFix is kept only as a fallback for records saved before Class A/B
// got their own Fix Now/Schedule flags - it's no longer written by the
// client (see the schema comment on WorkOrderTask).
//
// Fields with none of the above (e.g. their value matched what was
// expected) have no status.
const getResponseStatus = (field) => {
    const hazardClass = field?.hazardClass;

    if (hazardClass === "Class A") {
        if (field?.isClassAFixNow) return "Stop and Fix Now";
        if (field?.isClassASchedule) return "Stop and Schedule";
    } else if (hazardClass === "Class B") {
        if (field?.isClassBFixNow) return "Fix Now";
        if (field?.isClassBSchedule) return "Schedule Repair";
    } else {
        // Hazard Class C, or blank/no hazard class.
        if (field?.isSchedule) return "Schedule Repair";
    }

    if (field?.isStopFix) return "Stop and Fix";

    return null;
};

// Whether field.correctiveAction actually has something to show - mirrors
// the same check CorrectiveActionPreview uses to decide whether to render
// its before/after box, so the status override below only fires exactly
// when that box would also appear.
const hasImplementedCorrectiveAction = (field) => {
    const correctiveAction = field?.correctiveAction;
    if (!correctiveAction) return false;
    return Boolean(correctiveAction.beforeImage || correctiveAction.afterImage);
};

// The text shown in the status column. Same as getResponseStatus, except an
// implemented corrective action takes over the display regardless of the
// underlying Fix Now / Stop and Fix Now status (see the comment above
// getResponseStatus) - "Corrective action implemented" is more useful to
// see at a glance than "Fix Now" once there's actually a fix on record.
const getDisplayStatus = (field) =>
    hasImplementedCorrectiveAction(field) ? "Corrective Action Implemented" : getResponseStatus(field);

// Statuses that mean "this field needs a follow-up task scheduled against
// it" as opposed to a "fix it immediately, no follow-up" status (Stop and
// Fix Now / Fix Now). Driving the Assign Task button off this - the same
// status the column displays - instead of a separate expectedValue
// comparison is what fixes blank-hazard-class fields (which often have no
// expectedValue set) never showing the button even when isSchedule was
// true.
const SCHEDULE_STATUSES = new Set(["Stop and Schedule", "Schedule Repair"]);

const needsScheduling = (field) => SCHEDULE_STATUSES.has(getResponseStatus(field));

// A field already has a scheduled follow-up task once the "Schedule Task"
// popup has successfully created one for it - see the ctsTaskID link set
// by POST /:id/action-fields/:fieldId/schedule-task on the work order route.
const hasScheduledTask = (field) => Boolean(field?.ctsTaskID);

// A field needs the "Schedule Task" button when its status is one of the
// "needs scheduling" statuses and it doesn't already have a follow-up task
// linked (clicking the button again would just create a duplicate).
const needsScheduleButton = (field) =>
    needsScheduling(field) && !hasScheduledTask(field);

// Status -> CSS className, kept empty for now so the status column renders
// without color. To bring color back for a given status, just fill in the
// className here (e.g. "status-worst" / "status-bad" / "status-good") -
// nothing else needs to change.
const STATUS_STYLES = {
    "Stop and Fix Now": "status-worst",
    "Stop and Schedule": "status-worst",
    "Fix Now": "status-bad",
    "Schedule Repair": "status-bad",
    "Stop and Fix": "status-worst",
};


// Exported so WorkOrderInfoPreview can block "Close Out Task" until every
// field that ever needed a follow-up task actually has one scheduled.
export const fieldStillNeedsScheduling = (field) => needsScheduleButton(field);

// Read-only display for the task-level "PDF Evidence" attachment (desktop-
// only, see ActionFieldsPopulateBox.jsx). Same download mechanics as
// ActionFieldFileValue's "file" branch - fetch the bytes with the auth
// header attached, then hand them to file-saver - just pointed at the
// task's own download endpoint instead of an action field's, since
// pdfEvidence lives directly on the WorkOrderTask rather than inside any
// one action field.
const PdfEvidenceValue = ({ taskId, pdfEvidence }) => {
    const downloadUrl = (pdfEvidence && taskId)
        ? `${process.env.REACT_APP_URL}/api/workOrderTasks/${taskId}/pdf-evidence/download`
        : null;

    const handleDownload = async () => {
        if (!downloadUrl || !pdfEvidence) return;
        try {
            const storedToken = localStorage.getItem("token");
            const response = await axios.get(downloadUrl, {
                headers: { Authorization: `Bearer ${storedToken}` },
                responseType: "blob",
            });
            saveAs(response.data, pdfEvidence.fileName || "PDF Evidence.pdf");
        } catch {
            // Same as ActionFieldFileValue - no toast context here, a
            // failed download simply does nothing and the user can retry.
        }
    };

    return (
        <button
            type="button"
            title="Click to download"
            onClick={handleDownload}
            style={{
                padding: 0,
                border: "none",
                background: "transparent",
                color: "#0B5ED7",
                textDecoration: "underline",
                cursor: "pointer",
                fontSize: "14px",
                textAlign: "left",
            }}
        >
            {pdfEvidence.fileName || "PDF Evidence.pdf"}
        </button>
    );
};

const ActionFieldsPreviewBox = ({
    taskId,
    actionFields = [],
    collapsible = false,
    area = "",
    department = "",
    workOrderType = "",
    workOrderTitle = "",
    priority = "",
    workOrderAttachments = [],
    pdfEvidence = null,
    responsibleSignature = null,
    onScheduleTask = () => { },
    onTaskAdded = () => { },
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;
    const toggleCollapse = () => setCollapsed(!collapsed);

    // Tracks which action field the "Schedule Task" button was clicked for
    // (null/closed when no popup should be shown). The popup's read-only
    // fields are populated straight off the parent work order (area,
    // department, workOrderType, priority) plus a title generated from the
    // action field that triggered it.
    const [scheduleTaskPopup, setScheduleTaskPopup] = useState({ open: false, field: null });

    const openScheduleTaskPopup = (field) => {
        setScheduleTaskPopup({ open: true, field });
        onScheduleTask(field);
    };

    const closeScheduleTaskPopup = () => {
        setScheduleTaskPopup({ open: false, field: null });
    };

    // The 1-based position of the field the "Schedule Task" popup was
    // opened for, within the full actionFields list - this is the same
    // number shown in the table's row header ({index + 1}. {field.title}),
    // so the two stay in sync.
    const scheduleTaskFieldIndex = scheduleTaskPopup.field
        ? actionFields.findIndex((field) => field.id === scheduleTaskPopup.field.id)
        : -1;

    // Leads with the parent work order's own title (when there is one),
    // separated by a dash - this is what ManualTaskingPage's taskTitle
    // cell renderer splits on to bold the work order title and put the
    // "Item (x) Corrective Action" label on its own line underneath.
    // "(Stop and Fix)" is appended at the end only when the field that
    // triggered the popup was flagged isStopFix (see getResponseStatus).
    const scheduleTaskWorkOrderTitle = scheduleTaskPopup.field
        ? [
            workOrderTitle?.trim() || null,
            `Item ${scheduleTaskFieldIndex + 1} - Corrective Action`,
        ].filter(Boolean).join(": ") + (scheduleTaskPopup.field?.isClassASchedule ? " (Stop and Schedule)" : "")
        : "";


    // Each corrective action can be hidden independently - this tracks
    // which field ids currently have theirs hidden (shown as a small grey
    // "Corrective Action" bar with an arrow to bring it back).
    const [hiddenCorrectiveActionIds, setHiddenCorrectiveActionIds] = useState(new Set());
    const toggleCorrectiveAction = (fieldId) => {
        setHiddenCorrectiveActionIds((prev) => {
            const next = new Set(prev);
            if (next.has(fieldId)) {
                next.delete(fieldId);
            } else {
                next.add(fieldId);
            }
            return next;
        });
    };

    // Only show the extra "Schedule Task" column at all if at least one
    // field ever needed it - checked against needsScheduling rather than
    // needsScheduleButton, so the column (and its "Task Assigned" label)
    // doesn't disappear the moment every outstanding field has actually
    // been scheduled. Same idea for the status column: only shown if at
    // least one field has a status to report.
    const showScheduleColumn = actionFields.some((field) => needsScheduling(field));
    const showStatusColumn = actionFields.some((field) => getDisplayStatus(field) !== null);

    return (
        <div className="input-row">
            <div className="input-box-ref">
                <h3 className="font-fam-labels">Work Order Action Fields</h3>

                {collapsible && (
                    <div
                        className="top-right-button-ibra"
                        style={{ display: "flex", alignItems: "center" }}
                    >
                        <button
                            title={collapsed ? "Expand Section" : "Collapse Section"}
                            onClick={toggleCollapse}
                            style={{
                                color: "gray",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                padding: 0,
                            }}
                            type="button"
                        >
                            <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                        </button>
                    </div>
                )}

                {(!isCollapsed) && (
                    <table className="table-borders-jra-info" style={{ tableLayout: "fixed", width: "100%" }}>
                        <colgroup>
                            <col style={{ width: "20%" }} />
                            <col />
                            {showStatusColumn && <col style={{ width: "130px" }} />}
                            {showScheduleColumn && <col style={{ width: "140px" }} />}
                        </colgroup>
                        <tbody>
                            {actionFields.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={2 + (showStatusColumn ? 1 : 0) + (showScheduleColumn ? 1 : 0)}
                                        className="font-fam"
                                        style={{ textAlign: "center", padding: "10px", color: "#888" }}
                                    >
                                        No action fields have been added yet.
                                    </td>
                                </tr>
                            )}
                            {actionFields.map((field, index) => {
                                const isFileField = field.type === "photo" || field.type === "file";
                                const showButton = showScheduleColumn && needsScheduleButton(field);
                                return (
                                    <tr key={field.id}>
                                        <th scope="row" className="jra-info-table-header" style={{ whiteSpace: "pre-wrap" }}>
                                            {index + 1}. {field.title}
                                            {field.required && (
                                                <span className="required-field" title="Required"> *</span>
                                            )}
                                            {field.hazardClass && (
                                                <div
                                                    className="font-fam"
                                                    style={{ color: "#888", fontStyle: "italic", fontWeight: "normal", fontSize: "12px" }}
                                                >
                                                    Hazard Class: {field.hazardClass}
                                                </div>
                                            )}
                                        </th>
                                        <td>
                                            {isFileField ? (
                                                <ActionFieldFileValue taskId={taskId} field={field} />
                                            ) : (
                                                <ActionFieldControl
                                                    field={field}
                                                    value={field.value}
                                                    onChange={() => { }}
                                                    readOnly={true}
                                                />
                                            )}
                                            <CorrectiveActionPreview taskId={taskId} field={field} />
                                            <AdditionalCommentsPreview field={field} />
                                        </td>
                                        {showStatusColumn && (
                                            <td
                                                className={`font-fam ${STATUS_STYLES[getDisplayStatus(field)] || ""}`}
                                                style={{
                                                    textAlign: "center",
                                                    alignContent: "center",
                                                    fontWeight: "normal",
                                                    ...(hasImplementedCorrectiveAction(field)
                                                        ? { backgroundColor: "#e0e0e0" }
                                                        : {}),
                                                }}
                                            >
                                                {getDisplayStatus(field)}
                                            </td>
                                        )}
                                        {showScheduleColumn && (
                                            <td style={{ textAlign: "center", alignContent: "center" }}>
                                                {showButton && (
                                                    <button
                                                        type="button"
                                                        className="generate-button font-fam"
                                                        onClick={() => openScheduleTaskPopup(field)}
                                                        style={{
                                                            width: "110px",
                                                            padding: "10px 0",
                                                            fontSize: "14px",
                                                            cursor: "pointer",
                                                            whiteSpace: "nowrap",
                                                            marginTop: "auto",
                                                            marginBottom: "auto"
                                                        }}
                                                    >
                                                        Assign Task
                                                    </button>
                                                )}
                                                {!showButton && needsScheduling(field) && hasScheduledTask(field) && (
                                                    <span className="font-fam" style={{ fontSize: "14px", color: "black" }}>
                                                        Task Assigned
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}

                            {/* Task-level "PDF Evidence" - desktop-only,
                                optional (see PUT :id/populate), so this row
                                only renders at all when the task actually
                                has one on record. Sits directly above the
                                signature row, same position as it has on
                                the editable Populate Work Order screen. */}
                            {pdfEvidence && (
                                <tr>
                                    <th scope="row" className="jra-info-table-header" style={{ whiteSpace: "pre-wrap" }}>
                                        PDF Evidence
                                    </th>
                                    <td colSpan={1 + (showStatusColumn ? 1 : 0) + (showScheduleColumn ? 1 : 0)}>
                                        <PdfEvidenceValue taskId={taskId} pdfEvidence={pdfEvidence} />
                                    </td>
                                </tr>
                            )}

                            {/* Responsible person's sign-off - always the
                                final row, regardless of how many action
                                fields there are (a work order can't be
                                submitted without one - see PUT
                                :id/populate). Unlike every row above, this
                                one carries no number: it isn't an action
                                field, just a fixed label. The value cell
                                spans whatever status/schedule columns exist
                                so the signature content isn't squeezed into
                                the narrow value column alone. */}
                            <tr>
                                <th scope="row" className="jra-info-table-header" style={{ whiteSpace: "pre-wrap" }}>
                                    Responsible Person Signature
                                </th>
                                <td colSpan={1 + (showStatusColumn ? 1 : 0) + (showScheduleColumn ? 1 : 0)}>
                                    <ResponsibleSignaturePreview signature={responsibleSignature} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>

            {scheduleTaskPopup.open && (
                <ScheduleTaskPopupFTS
                    onClose={closeScheduleTaskPopup}
                    onTaskAdded={() => {
                        onTaskAdded(scheduleTaskPopup.field);
                        closeScheduleTaskPopup();
                    }}
                    workOrderTaskId={taskId}
                    actionFieldId={scheduleTaskPopup.field?.id}
                    area={area}
                    department={department}
                    workOrderType={workOrderType}
                    workOrderTitle={scheduleTaskWorkOrderTitle}
                    priority={priority}
                    workOrderAttachments={workOrderAttachments}
                    relatedDocuments={scheduleTaskPopup.field?.relatedDocuments || []}
                    actionFieldTitle={scheduleTaskPopup.field?.title || ""}
                />
            )}
        </div>
    );
};

export default ActionFieldsPreviewBox;