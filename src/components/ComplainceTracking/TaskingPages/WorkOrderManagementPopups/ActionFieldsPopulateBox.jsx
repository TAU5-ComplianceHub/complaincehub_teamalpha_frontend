import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import AnswerFieldControl from "./AnswerFieldControl";
import CorrectiveActionEditor from "./CorrectiveActionEditor";
import AdditionalCommentsEditor from "./AdditionalCommentsEditor";
import SignatureCapture from "./SignatureCapture";
import PhotoFileCapture from "./PhotoFileCapture";

// ---------------------------------------------------------------------------
// ActionFieldsPopulateBox
//
// Editable counterpart to ActionFieldsPreviewBox, used by
// PopulateWorkOrderPreview (the desktop equivalent of populateWorkOrder.dart)
// rather than WorkOrderInfoPreview. Differences from ActionFieldsPreviewBox:
//
//   - No Status column and no Schedule Task column at all - those describe
//     the allocator's follow-up workflow (assigning/tracking a repair task
//     against a field), which has no place on the form the responsible
//     person actually fills in. Every field row is just [# + title, value].
//   - Every field is editable via AnswerFieldControl (photo/file included -
//     ActionFieldFileValue's read-only display isn't used here at all).
//   - A field whose answer doesn't match its expected value/range and is
//     Hazard Class A/B shows the same Fix Now/Schedule controls as mobile,
//     via CorrectiveActionEditor, instead of the plain read-only
//     CorrectiveActionPreview.
//   - Every field shows a collapsible "Additional Comment" box
//     (AdditionalCommentsEditor), not just ones with an already-saved
//     comment - matching what was asked for on this form specifically.
//   - The final "signature" row is an actual SignatureCapture pad rather
//     than ResponsibleSignaturePreview, and is only enabled once
//     `readyForSignature` is true - mirroring _isReadyForSignature() /
//     _buildSignatureSection on mobile, which only lets the responsible
//     person sign once every other requirement on the form is satisfied.
//   - A mandatory "PDF Evidence" row sits directly above the signature -
//     not tied to any action field, always required to submit alongside
//     the signature. Uses PhotoFileCapture (kind="file") so it looks and
//     behaves exactly like every other file upload on this form.
// ---------------------------------------------------------------------------
const ActionFieldsPopulateBox = ({
    taskId,
    actionFields = [],
    collapsible = false,
    disabled = false,

    answers = {},
    numberErrors = {},
    correctiveActions = {},
    scheduleChoice = {},
    comments = {},
    expandedCommentIds,

    attemptedSubmit = false,
    missingFieldIds,
    missingCorrectiveImageIds,
    missingResponseActionIds,

    isHazardClassA,
    isHazardClassB,
    expectedValueWarning,

    onAnswerChange,
    onCorrectiveChoose,
    onCorrectiveImageChange,
    onRemoveCorrectiveAction,
    onToggleComment,
    onCommentChange,

    pdfEvidence,
    missingPdfEvidence = false,
    onPdfEvidenceChange,

    readyForSignature = false,
    signatureRef,
    signatureMissing = false,
    onSignatureDrawnChange,
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCollapsed = collapsible ? collapsed : false;

    return (
        <div className="input-row">
            <div className="input-box-ref">
                <h3 className="font-fam-labels">Work Order Action Fields</h3>

                {collapsible && (
                    <div className="top-right-button-ibra" style={{ display: "flex", alignItems: "center" }}>
                        <button
                            title={collapsed ? "Expand Section" : "Collapse Section"}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ color: "gray", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
                            type="button"
                        >
                            <FontAwesomeIcon icon={collapsed ? faChevronDown : faChevronUp} />
                        </button>
                    </div>
                )}

                {!isCollapsed && (
                    <table className="table-borders-jra-info" style={{ tableLayout: "fixed", width: "100%" }}>
                        <colgroup>
                            <col style={{ width: "20%" }} />
                            <col />
                        </colgroup>
                        <tbody>
                            {actionFields.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="font-fam" style={{ textAlign: "center", padding: "10px", color: "#888" }}>
                                        No action fields have been added yet.
                                    </td>
                                </tr>
                            )}
                            {actionFields.map((field, index) => {
                                const id = field.id;
                                const value = answers[id];
                                const classA = isHazardClassA(field);
                                const classB = isHazardClassB(field);
                                const hasWarning = expectedValueWarning(field) !== null;
                                const showCorrectiveSection = hasWarning && (classA || classB);
                                const missingRequired = attemptedSubmit && missingFieldIds?.has(id);
                                const missingResponse = attemptedSubmit && missingResponseActionIds?.has(id);
                                const missingCorrective = attemptedSubmit && missingCorrectiveImageIds?.has(id);
                                const expanded = expandedCommentIds?.has(id) || false;

                                return (
                                    <tr key={id}>
                                        <th scope="row" className="jra-info-table-header" style={{ whiteSpace: "pre-wrap" }}>
                                            {index + 1}. {field.title || "Untitled Field"}
                                            {field.required && <span className="required-field" title="Required"> *</span>}
                                            {field.hazardClass && (
                                                <div className="font-fam" style={{ color: "#888", fontStyle: "italic", fontWeight: "normal", fontSize: "12px" }}>
                                                    Hazard Class: {field.hazardClass}
                                                </div>
                                            )}
                                        </th>
                                        <td>
                                            <AnswerFieldControl
                                                taskId={taskId}
                                                field={field}
                                                value={value}
                                                numberError={numberErrors[id]}
                                                disabled={disabled}
                                                onChange={(v) => onAnswerChange(field, v)}
                                            />

                                            {missingRequired && (
                                                <div className="font-fam" style={{ marginTop: "4px", fontSize: "12px", color: "#CB6F6F", fontWeight: 600 }}>
                                                    This field is required.
                                                </div>
                                            )}

                                            {showCorrectiveSection && (
                                                <CorrectiveActionEditor
                                                    taskId={taskId}
                                                    field={field}
                                                    isClassA={classA}
                                                    isClassB={classB}
                                                    choice={scheduleChoice[id] || null}
                                                    correctiveAction={correctiveActions[id]}
                                                    onChoose={(choice) => onCorrectiveChoose(field, choice)}
                                                    onImageChange={(slot, v) => onCorrectiveImageChange(id, slot, v)}
                                                    onRemoveCorrectiveAction={() => onRemoveCorrectiveAction(id)}
                                                    showMissingMessage={missingCorrective}
                                                    disabled={disabled}
                                                />
                                            )}

                                            {missingResponse && (
                                                <div className="font-fam" style={{ marginTop: "4px", fontSize: "12px", color: "#CB6F6F", fontWeight: 600 }}>
                                                    Select Fix Now or Schedule.
                                                </div>
                                            )}

                                            <AdditionalCommentsEditor
                                                fieldId={id}
                                                comment={comments[id]}
                                                expanded={expanded}
                                                onToggleExpand={() => onToggleComment(id)}
                                                onChange={onCommentChange}
                                                disabled={disabled}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Mandatory PDF Evidence upload - not tied to any
                                action field, always required alongside the
                                signature in order to submit. */}
                            <tr>
                                <th scope="row" className="jra-info-table-header" style={{ whiteSpace: "pre-wrap" }}>
                                    PDF Evidence <span className="required-field" title="Required">*</span>
                                </th>
                                <td>
                                    <PhotoFileCapture
                                        taskId={taskId}
                                        fieldId="pdfEvidence"
                                        kind="file"
                                        accept="application/pdf,.pdf"
                                        value={pdfEvidence}
                                        onChange={onPdfEvidenceChange}
                                        disabled={disabled}
                                    />
                                    {missingPdfEvidence && (
                                        <div className="font-fam" style={{ marginTop: "4px", fontSize: "12px", color: "#CB6F6F", fontWeight: 600 }}>
                                            This field is required.
                                        </div>
                                    )}
                                </td>
                            </tr>

                            {/* Mandatory sign-off - always the final row,
                                same position as ResponsibleSignaturePreview
                                on the read-only version, but here it's a
                                live pad that only becomes usable once
                                readyForSignature is true. */}
                            <tr>
                                <th scope="row" className="jra-info-table-header" style={{ whiteSpace: "pre-wrap" }}>
                                    Signature <span className="required-field" title="Required">*</span>
                                    <div className="font-fam" style={{ color: "#888", fontStyle: "italic", fontWeight: "normal", fontSize: "12px" }}>
                                        Sign to confirm and submit this work order.
                                    </div>
                                </th>
                                <td>
                                    {readyForSignature ? (
                                        <SignatureCapture
                                            ref={signatureRef}
                                            disabled={disabled}
                                            missing={signatureMissing}
                                            onDrawnChange={onSignatureDrawnChange}
                                        />
                                    ) : (
                                        <div
                                            className="font-fam"
                                            style={{
                                                padding: "16px",
                                                textAlign: "center",
                                                color: "#888",
                                                backgroundColor: "#f2f2f2",
                                                border: "1px dashed #ccc",
                                                borderRadius: "6px",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Complete every required field above (including any corrective actions
                                            and Fix Now / Schedule choices) to sign off on this work order.
                                        </div>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ActionFieldsPopulateBox;