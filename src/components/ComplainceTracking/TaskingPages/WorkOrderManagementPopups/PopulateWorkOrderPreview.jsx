import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import ActionFieldsPopulateBox from "./ActionFieldsPopulateBox";

// ---------------------------------------------------------------------------
// PopulateWorkOrderPreview
//
// Desktop equivalent of the mobile app's Populate Work Order screen
// (populateWorkOrder.dart). Opened the same way WorkOrderInfoPreview is -
// as a popup - but instead of being permanently read-only, this lets the
// responsible person actually fill in the work order from a desktop
// browser: answer every action field, add corrective actions where needed,
// leave comments, and sign off, then Save Progress or Submit.
//
// It hits exactly the same backend routes, in exactly the same shape, as
// the mobile app:
//   - GET  /api/workOrderTasks/:id                fetch the task
//   - PUT  /api/workOrderTasks/:id/save-progress   save without validating
//   - PUT  /api/workOrderTasks/:id/populate        validate + submit
//
// Differences from mobile, both intentional (see child components for the
// reasoning behind each):
//   - No Status / Schedule Task columns (ActionFieldsPopulateBox) - those
//     belong to the allocator's follow-up workflow, not this form.
//   - Photo answers and corrective-action images use a plain file picker
//     (PhotoFileCapture) instead of always forcing the camera open.
//   - The "Additional Comment" box is shown under every field, not gated
//     behind a server-driven experiment flag.
//   - Signature is drawn with the mouse (SignatureCapture) rather than a
//     touch pad, but is gated behind the same "everything else is done"
//     rule as mobile (_isReadyForSignature).
// ---------------------------------------------------------------------------

const hazardClassIs = (field, target) => (field?.hazardClass || "").trim().toLowerCase() === target;

// Mirrors populateWorkOrder.dart's _expectedValueWarning: returns a message
// (truthy) when `value` doesn't match what's configured on the field, or
// null when there's nothing to warn about (no expectation configured, or
// the field simply isn't answered yet).
const expectedValueWarningFor = (field, value) => {
    const type = field?.type;
    const hasAnswer = value != null && String(value).trim() !== "";
    if (!hasAnswer) return null;

    switch (type) {
        case "dropdown":
        case "yesno":
        case "passfail":
        case "buttons": {
            const expected = field?.expectedValue;
            if (!expected) return null;
            return String(value) === String(expected) ? null : `Expected value is "${expected}".`;
        }
        case "number": {
            const { expectedMin, expectedMax } = field || {};
            if (expectedMin == null && expectedMax == null) return null;
            const parsed = Number.parseFloat(value);
            if (Number.isNaN(parsed)) return null;
            if (expectedMin != null && parsed < Number.parseFloat(expectedMin)) return `Expected at least ${expectedMin}.`;
            if (expectedMax != null && parsed > Number.parseFloat(expectedMax)) return `Expected at most ${expectedMax}.`;
            return null;
        }
        default:
            return null;
    }
};

const isFieldAnswered = (field, value) => {
    const type = field?.type;
    if (type === "photo" || type === "file") {
        return Boolean(value && (value.file || (value.existing && !value.removed)));
    }
    if (type === "gps") {
        return Boolean(value && value.lat != null && value.lng != null);
    }
    return value != null && String(value).trim() !== "";
};

const isImageAnswerPresent = (value) => Boolean(value && (value.file || (value.existing && !value.removed)));

const validateNumber = (raw) => {
    if (raw == null || raw === "") return null;
    if (!/^-?\d*\.?\d*$/.test(raw)) return "Please enter a valid number.";
    if (raw === "-" || raw === "." || raw === "-.") return "Please enter a valid number.";
    if (Number.isNaN(Number.parseFloat(raw))) return "Please enter a valid number.";
    return null;
};

const PopulateWorkOrderPreview = ({ open, taskId, onClose, onSubmitted }) => {
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingProgress, setIsSavingProgress] = useState(false);

    const [answers, setAnswers] = useState({});
    const [numberErrors, setNumberErrors] = useState({});
    const [correctiveActions, setCorrectiveActions] = useState({});
    const [scheduleChoice, setScheduleChoice] = useState({});
    const [comments, setComments] = useState({});
    const [expandedCommentIds, setExpandedCommentIds] = useState(new Set());

    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [missingFieldIds, setMissingFieldIds] = useState(new Set());
    const [missingCorrectiveImageIds, setMissingCorrectiveImageIds] = useState(new Set());
    const [missingResponseActionIds, setMissingResponseActionIds] = useState(new Set());
    const [hasSignature, setHasSignature] = useState(false);

    // Mandatory file upload sitting just above the signature row - same
    // {file} / {existing} / {removed} shape as a photo/file action field's
    // answer, so it can reuse isImageAnswerPresent for gating & validation.
    const [pdfEvidence, setPdfEvidence] = useState(null);
    const [missingPdfEvidence, setMissingPdfEvidence] = useState(false);

    const signatureRef = useRef(null);

    const actionFields = task?.actionFields || [];
    const isReadOnly = (task?.status === "Completed") || task?.closeStatus === true;

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
                if (cancelled) return;
                const fetchedTask = response.data?.task || null;
                setTask(fetchedTask);
                seedFromTask(fetchedTask);
            } catch {
                if (!cancelled) setError("Failed to load work order information. Please try again.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchTask();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, taskId]);

    // Pre-fills every piece of state from whatever's already saved on the
    // task - mirrors _seedAnswers on mobile, including restoring a
    // previously-picked Fix Now/Schedule choice and any in-progress
    // corrective action.
    const seedFromTask = (fetchedTask) => {
        const fields = fetchedTask?.actionFields || [];
        const nextAnswers = {};
        const nextComments = {};
        const nextCorrective = {};
        const nextChoice = {};

        for (const field of fields) {
            const id = field.id;
            if (!id) continue;

            nextComments[id] = field.comment || "";

            if (field.type === "photo" || field.type === "file") {
                const files = Array.isArray(field.files) ? field.files : [];
                nextAnswers[id] = files.length > 0 ? { existing: files[0] } : null;
            } else {
                nextAnswers[id] = field.value ?? null;
            }

            if (field.correctiveAction) {
                const { beforeImage, afterImage } = field.correctiveAction;
                nextCorrective[id] = {
                    beforeImage: beforeImage ? { existing: beforeImage } : null,
                    afterImage: afterImage ? { existing: afterImage } : null,
                };
            }

            if (field.isClassAFixNow || field.isClassBFixNow || field.isStopFix) {
                nextChoice[id] = "fixNow";
            } else if (field.isClassASchedule || field.isClassBSchedule) {
                nextChoice[id] = "schedule";
            }
        }

        setAnswers(nextAnswers);
        setComments(nextComments);
        setCorrectiveActions(nextCorrective);
        setScheduleChoice(nextChoice);
        setNumberErrors({});
        setExpandedCommentIds(new Set());
        setAttemptedSubmit(false);
        setMissingFieldIds(new Set());
        setMissingCorrectiveImageIds(new Set());
        setMissingResponseActionIds(new Set());
        setHasSignature(false);

        setPdfEvidence(fetchedTask?.pdfEvidence ? { existing: fetchedTask.pdfEvidence } : null);
        setMissingPdfEvidence(false);
    };

    const isHazardClassA = (field) => hazardClassIs(field, "class a");
    const isHazardClassB = (field) => hazardClassIs(field, "class b");
    const isHazardClassC = (field) => hazardClassIs(field, "class c");
    const expectedValueWarning = (field) => expectedValueWarningFor(field, answers[field.id]);

    // Whether every other requirement is satisfied - required fields
    // answered, started corrective actions complete, Hazard Class A/B
    // response actions picked. Gates the signature pad's visibility, same
    // as _isReadyForSignature on mobile.
    const readyForSignature = useMemo(() => {
        for (const field of actionFields) {
            const id = field.id;
            if (field.required && !isFieldAnswered(field, answers[id])) return false;

            const corrective = correctiveActions[id];
            if (corrective) {
                if (!isImageAnswerPresent(corrective.beforeImage) || !isImageAnswerPresent(corrective.afterImage)) return false;
            }

            if (expectedValueWarningFor(field, answers[id]) && (isHazardClassA(field) || isHazardClassB(field))) {
                if (!scheduleChoice[id]) return false;
            }
        }
        if (Object.values(numberErrors).some((e) => e)) return false;
        if (!isImageAnswerPresent(pdfEvidence)) return false;
        return true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actionFields, answers, correctiveActions, scheduleChoice, numberErrors, pdfEvidence]);

    // Combines the on-screen Hazard Class A/B choices with the automatic
    // "Schedule" flag for Class C / no-hazard-class fields whose answer
    // doesn't match what's expected - mirrors _effectiveResponseActions.
    const effectiveResponseActions = () => {
        const classAFixNow = [], classASchedule = [], classBFixNow = [], classBSchedule = [], scheduleFieldIds = [];
        for (const field of actionFields) {
            const id = field.id;
            if (!id) continue;
            if (isHazardClassA(field) || isHazardClassB(field)) {
                const choice = scheduleChoice[id];
                if (!choice) continue;
                if (isHazardClassA(field)) {
                    if (choice === "fixNow") classAFixNow.push(id); else if (choice === "schedule") classASchedule.push(id);
                } else {
                    if (choice === "fixNow") classBFixNow.push(id); else if (choice === "schedule") classBSchedule.push(id);
                }
                continue;
            }
            if (expectedValueWarningFor(field, answers[id])) scheduleFieldIds.push(id);
        }
        return { classAFixNow, classASchedule, classBFixNow, classBSchedule, scheduleFieldIds };
    };

    // Re-validates the whole form, populating the missing-* sets used for
    // inline messages, and returns a short list of problems for a toast.
    // Mirrors _validate() on mobile.
    const runValidation = () => {
        const nextMissingFields = new Set();
        const nextMissingCorrective = new Set();
        const nextMissingResponse = new Set();
        const problems = [];

        for (const field of actionFields) {
            const id = field.id;
            const title = field.title?.trim() || "Untitled Field";

            if (field.required && !isFieldAnswered(field, answers[id])) {
                nextMissingFields.add(id);
                problems.push(`"${title}" is required.`);
            }

            const corrective = correctiveActions[id];
            if (corrective) {
                if (!isImageAnswerPresent(corrective.beforeImage) || !isImageAnswerPresent(corrective.afterImage)) {
                    nextMissingCorrective.add(id);
                    problems.push(`Add before and after images to the corrective action for: ${title}`);
                }
            }

            if (expectedValueWarningFor(field, answers[id]) && (isHazardClassA(field) || isHazardClassB(field))) {
                if (!scheduleChoice[id]) {
                    nextMissingResponse.add(id);
                    problems.push(`Select Fix Now or Schedule for: ${title}`);
                }
            }
        }

        if (Object.values(numberErrors).some((e) => e)) {
            problems.push("One or more number fields contain an invalid value.");
        }

        const pdfMissing = !isImageAnswerPresent(pdfEvidence);
        if (pdfMissing) {
            problems.push('"PDF Evidence" is required.');
        }

        setMissingFieldIds(nextMissingFields);
        setMissingCorrectiveImageIds(nextMissingCorrective);
        setMissingResponseActionIds(nextMissingResponse);
        setMissingPdfEvidence(pdfMissing);

        return problems;
    };

    // Drops any in-progress corrective action / Fix Now-Schedule choice for
    // a field once its answer is satisfactory again - mirrors
    // _syncCorrectiveAction.
    const syncCorrectiveAction = (field, newValue) => {
        if (expectedValueWarningFor(field, newValue)) return;
        setCorrectiveActions((prev) => {
            if (!(field.id in prev)) return prev;
            const next = { ...prev };
            delete next[field.id];
            return next;
        });
        setScheduleChoice((prev) => {
            if (!(field.id in prev)) return prev;
            const next = { ...prev };
            delete next[field.id];
            return next;
        });
    };

    const handleAnswerChange = (field, value) => {
        setAnswers((prev) => ({ ...prev, [field.id]: value }));
        if (field.type === "number") {
            setNumberErrors((prev) => ({ ...prev, [field.id]: validateNumber(value) }));
        }
        syncCorrectiveAction(field, value);
        setMissingFieldIds((prev) => {
            if (!prev.has(field.id)) return prev;
            const next = new Set(prev);
            next.delete(field.id);
            return next;
        });
    };

    // Guards against anything other than a real .pdf being accepted -
    // browsers are inconsistent about setting `type` for less common
    // extensions, so this checks both the extension and (when present)
    // the MIME type rather than trusting either alone.
    const isPdfFile = (file) => {
        if (!file) return false;
        const nameLooksLikePdf = /\.pdf$/i.test(file.name || "");
        const typeLooksLikePdf = !file.type || file.type === "application/pdf";
        return nameLooksLikePdf && typeLooksLikePdf;
    };

    const handlePdfEvidenceChange = (value) => {
        if (value?.file instanceof File && !isPdfFile(value.file)) {
            toast.error("Please choose a PDF file for PDF Evidence.");
            return;
        }
        setPdfEvidence(value);
        setMissingPdfEvidence(false);
    };

    const handleCorrectiveChoose = (field, choice) => {
        const id = field.id;
        setScheduleChoice((prev) => {
            const next = { ...prev };
            if (choice) next[id] = choice; else delete next[id];
            return next;
        });
        setCorrectiveActions((prev) => {
            const next = { ...prev };
            if (choice === "fixNow") {
                next[id] = next[id] || { beforeImage: null, afterImage: null };
            } else {
                delete next[id];
            }
            return next;
        });
    };

    const handleCorrectiveImageChange = (fieldId, slot, value) => {
        setCorrectiveActions((prev) => ({
            ...prev,
            [fieldId]: { ...(prev[fieldId] || {}), [slot]: value },
        }));
    };

    const handleRemoveCorrectiveAction = (fieldId) => {
        setCorrectiveActions((prev) => {
            const next = { ...prev };
            delete next[fieldId];
            return next;
        });
        setScheduleChoice((prev) => {
            const next = { ...prev };
            delete next[fieldId];
            return next;
        });
    };

    const handleToggleComment = (fieldId) => {
        setExpandedCommentIds((prev) => {
            const next = new Set(prev);
            if (next.has(fieldId)) next.delete(fieldId); else next.add(fieldId);
            return next;
        });
    };

    const handleCommentChange = (fieldId, text) => {
        setComments((prev) => ({ ...prev, [fieldId]: text }));
    };

    // Builds the multipart payload shared by Save Progress and Submit -
    // identical field/file naming convention to populateWorkOrder.dart so
    // the existing backend routes need no changes.
    const buildFormData = () => {
        const formData = new FormData();
        const answersForServer = {};
        const removedFieldIds = [];

        for (const field of actionFields) {
            const id = field.id;
            const value = answers[id];
            if (field.type === "photo" || field.type === "file") {
                if (value?.file instanceof File) {
                    formData.append(`field_${id}`, value.file);
                } else if (value?.removed) {
                    removedFieldIds.push(id);
                }
            } else {
                answersForServer[id] = value;
            }
        }

        const correctiveActionFieldIds = [];
        for (const [fieldId, slots] of Object.entries(correctiveActions)) {
            correctiveActionFieldIds.push(fieldId);
            for (const slot of ["beforeImage", "afterImage"]) {
                const value = slots?.[slot];
                if (value?.file instanceof File) {
                    formData.append(`correctiveAction_${slot}_${fieldId}`, value.file);
                }
            }
        }

        if (pdfEvidence?.file instanceof File) {
            formData.append("pdfEvidence", pdfEvidence.file);
        } else if (pdfEvidence?.removed) {
            formData.append("removedPdfEvidence", "true");
        }

        formData.append("answers", JSON.stringify(answersForServer));
        if (removedFieldIds.length) formData.append("removedFieldIds", JSON.stringify(removedFieldIds));
        if (correctiveActionFieldIds.length) formData.append("correctiveActionFieldIds", JSON.stringify(correctiveActionFieldIds));

        const effective = effectiveResponseActions();
        if (effective.classAFixNow.length) formData.append("classAFixNowFieldIds", JSON.stringify(effective.classAFixNow));
        if (effective.classASchedule.length) formData.append("classAScheduleFieldIds", JSON.stringify(effective.classASchedule));
        if (effective.classBFixNow.length) formData.append("classBFixNowFieldIds", JSON.stringify(effective.classBFixNow));
        if (effective.classBSchedule.length) formData.append("classBScheduleFieldIds", JSON.stringify(effective.classBSchedule));
        if (effective.scheduleFieldIds.length) formData.append("scheduleFieldIds", JSON.stringify(effective.scheduleFieldIds));

        // Every field's comment goes in, blank or not - a blank entry is
        // how a cleared comment gets cleared server-side too (see
        // _commentsForServer on mobile).
        const commentsForServer = {};
        for (const field of actionFields) {
            commentsForServer[field.id] = (comments[field.id] || "").trim();
        }
        formData.append("comments", JSON.stringify(commentsForServer));

        return formData;
    };

    const handleSaveProgress = async () => {
        if (!task || isReadOnly || isSavingProgress || isSubmitting) return;
        setIsSavingProgress(true);
        try {
            const storedToken = localStorage.getItem("token");
            const formData = buildFormData();
            await axios.put(
                `${process.env.REACT_APP_URL}/api/workOrderTasks/${taskId}/save-progress`,
                formData,
                { headers: { Authorization: `Bearer ${storedToken}` } }
            );
            toast.success("Progress Saved", { autoClose: 1200, closeButton: false });

            setTimeout(() => {
                onClose();
            }, 1200);
        } catch {
            toast.error("Could not save progress. Please try again.");
        } finally {
            setIsSavingProgress(false);
        }
    };

    const handleSubmit = async () => {
        setAttemptedSubmit(true);
        const problems = runValidation();

        if (problems.length > 0) {
            toast.error(problems.length === 1 ? problems[0] : `Please complete ${problems.length} required item(s) before submitting.`);
            return;
        }

        if (!readyForSignature) {
            toast.error("Please complete every field before signing.");
            return;
        }

        const signatureDataUrl = signatureRef.current?.getDataUrl?.();
        if (!signatureDataUrl) {
            toast.error("Please sign to submit this work order.");
            return;
        }

        setIsSubmitting(true);
        try {
            const storedToken = localStorage.getItem("token");
            const formData = buildFormData();
            formData.append("responsibleSignature", JSON.stringify({ signature: signatureDataUrl }));

            const response = await axios.put(
                `${process.env.REACT_APP_URL}/api/workOrderTasks/${taskId}/populate`,
                formData,
                { headers: { Authorization: `Bearer ${storedToken}` } }
            );

            toast.success("Work order submitted successfully.");
            onSubmitted?.(response.data?.task || null);
            onClose?.();
        } catch (err) {
            const serverMissing = err?.response?.data?.missingFields;
            if (Array.isArray(serverMissing) && serverMissing.length) {
                setMissingFieldIds((prev) => {
                    const next = new Set(prev);
                    actionFields.forEach((f) => {
                        if (serverMissing.includes(f.title)) next.add(f.id);
                    });
                    return next;
                });
                toast.error(`Missing required fields: ${serverMissing.join(", ")}`);
            } else {
                toast.error(err?.response?.data?.error || "Could not submit work order.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <div className="template-preview-overlay">
            <div className="template-preview-panel">
                <div className="template-preview-header">
                    <h2 className="font-fam-labels">Populate Work Order</h2>
                    <FontAwesomeIcon icon={faTimes} className="template-preview-close" onClick={onClose} title="Close" />
                </div>

                <div className="scrollable-box-preview template-preview-body" style={{ overflowY: "auto" }}>
                    {loading && (
                        <p style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                            Loading work order information...
                        </p>
                    )}

                    {!loading && error && (
                        <p style={{ textAlign: "center", padding: "20px", color: "#CB6F6F" }}>{error}</p>
                    )}

                    {!loading && !error && task && (
                        <ActionFieldsPopulateBox
                            taskId={task._id}
                            actionFields={actionFields}
                            collapsible={false}
                            disabled={isReadOnly || isSubmitting}
                            answers={answers}
                            numberErrors={numberErrors}
                            correctiveActions={correctiveActions}
                            scheduleChoice={scheduleChoice}
                            comments={comments}
                            expandedCommentIds={expandedCommentIds}
                            attemptedSubmit={attemptedSubmit}
                            missingFieldIds={missingFieldIds}
                            missingCorrectiveImageIds={missingCorrectiveImageIds}
                            missingResponseActionIds={missingResponseActionIds}
                            isHazardClassA={isHazardClassA}
                            isHazardClassB={isHazardClassB}
                            expectedValueWarning={expectedValueWarning}
                            onAnswerChange={handleAnswerChange}
                            onCorrectiveChoose={handleCorrectiveChoose}
                            onCorrectiveImageChange={handleCorrectiveImageChange}
                            onRemoveCorrectiveAction={handleRemoveCorrectiveAction}
                            onToggleComment={handleToggleComment}
                            onCommentChange={handleCommentChange}
                            pdfEvidence={pdfEvidence}
                            missingPdfEvidence={attemptedSubmit && missingPdfEvidence}
                            onPdfEvidenceChange={handlePdfEvidenceChange}
                            readyForSignature={readyForSignature}
                            signatureRef={signatureRef}
                            signatureMissing={attemptedSubmit && readyForSignature && !hasSignature}
                            onSignatureDrawnChange={setHasSignature}
                        />
                    )}
                </div>

                {!isReadOnly && (
                    <div className="input-row-buttons" style={{ marginBottom: "15px", marginTop: "5px" }}>
                        <button
                            type="button"
                            className="generate-button font-fam"
                            onClick={handleSaveProgress}
                            disabled={isSavingProgress || isSubmitting || loading}
                        >
                            {isSavingProgress ? "Saving..." : "Save Progress"}
                        </button>
                        <button
                            type="button"
                            className="generate-button font-fam"
                            onClick={handleSubmit}
                            disabled={isSubmitting || isSavingProgress || loading}
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
};

export default PopulateWorkOrderPreview;