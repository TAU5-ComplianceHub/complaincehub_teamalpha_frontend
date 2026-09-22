import React, { useEffect, useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import PhotoFileCapture from "./PhotoFileCapture";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

// ---------------------------------------------------------------------------
// CorrectiveActionEditor
//
// Editable counterpart to CorrectiveActionPreview, shown under a Hazard
// Class A or B field once its answer doesn't match its expected
// value/range - mirrors _buildCorrectiveActionSection /
// _buildScheduleStopFixSection / _buildCorrectiveActionBlock in
// populateWorkOrder.dart:
//
//   - "Stop and Fix Now" / "Stop and Schedule" (Class A, red) or
//     "Fix Now" / "Schedule Repair" (Class B, orange) buttons - mutually
//     exclusive, tapping the selected one again clears it.
//   - Choosing the "fix now" option opens the corrective action block:
//     Related Documents (read-only, same as before) plus Before/After
//     image capture. Choosing "schedule" (or clearing the choice) removes
//     it.
//
// The one deliberate behaviour change from mobile: before/after images use
// PhotoFileCapture, a plain file picker, instead of always forcing the
// device camera open (_captureCorrectiveImage always uses
// ImageSource.camera on mobile) - so the person can choose an existing
// photo already on their computer.
// ---------------------------------------------------------------------------
const STOP_FIX_RED = "#CB6F6F";
const STOP_FIX_RED_INACTIVE = "#757575";
const BAD_ORANGE = "#FFC000";

const choiceButtonStyle = (selected, isClassB) => {
    const activeColor = isClassB ? BAD_ORANGE : STOP_FIX_RED;
    const inactiveColor = STOP_FIX_RED_INACTIVE;
    return {
        flex: 1,
        padding: "10px 14px",
        fontSize: "13px",
        fontWeight: 900,
        borderRadius: "6px",
        border: `1px solid ${selected ? activeColor : inactiveColor}`,
        color: selected ? (isClassB ? "#000" : "#fff") : inactiveColor,
        backgroundColor: selected ? activeColor : "transparent",
        cursor: "pointer",
    };
};

const RelatedDocumentLink = ({ taskId, doc }) => {
    const docId = doc?.id?.toString() || "";
    const name = doc?.name?.trim() || "Untitled document";
    const [loading, setLoading] = useState(false);

    const handleOpen = async () => {
        if (!docId) return;
        setLoading(true);
        try {
            const storedToken = localStorage.getItem("token");
            const response = await axios.get(
                `${process.env.REACT_APP_URL}/api/file/download/${docId}`,
                { headers: { Authorization: `Bearer ${storedToken}` }, responseType: "blob" }
            );
            const objectUrl = URL.createObjectURL(response.data);
            window.open(objectUrl, "_blank", "noopener,noreferrer");
        } catch {
            saveAsFallback();
        } finally {
            setLoading(false);
        }
    };

    const saveAsFallback = async () => {
        try {
            const storedToken = localStorage.getItem("token");
            const response = await axios.get(
                `${process.env.REACT_APP_URL}/api/file/download/${docId}`,
                { headers: { Authorization: `Bearer ${storedToken}` }, responseType: "blob" }
            );
            saveAs(response.data, name);
        } catch {
            // Nothing more to do - the link simply won't open.
        }
    };

    return (
        <div style={{ padding: "2px 0" }}>
            <span className="font-fam" style={{ fontSize: "13px" }}>{"\u2022  "}</span>
            {docId ? (
                <button
                    type="button"
                    onClick={handleOpen}
                    disabled={loading}
                    className="font-fam"
                    style={{
                        padding: 0, border: "none", background: "transparent",
                        color: "#003080", textDecoration: "underline", cursor: "pointer", fontSize: "13px",
                    }}
                >
                    {name}
                </button>
            ) : (
                <span className="font-fam" style={{ fontSize: "13px" }}>{name}</span>
            )}
        </div>
    );
};

const CorrectiveActionEditor = ({
    taskId,
    field,
    isClassA,
    isClassB,
    choice, // 'fixNow' | 'schedule' | null
    correctiveAction, // { beforeImage, afterImage } | undefined
    onChoose,
    onImageChange,
    onRemoveCorrectiveAction,
    showMissingMessage,
    disabled = false,
}) => {
    const fixNowLabel = isClassA ? "Stop and Fix Now" : "Fix Now";
    const scheduleLabel = isClassA ? "Stop and Schedule" : "Schedule Repair";
    const relatedDocuments = Array.isArray(field?.relatedDocuments) ? field.relatedDocuments : [];
    const showBlock = choice === "fixNow" && Boolean(correctiveAction);

    return (
        <div style={{ marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChoose(choice === "fixNow" ? null : "fixNow")}
                    style={choiceButtonStyle(choice === "fixNow", isClassB)}
                >
                    {fixNowLabel}
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChoose(choice === "schedule" ? null : "schedule")}
                    style={choiceButtonStyle(choice === "schedule", isClassB)}
                >
                    {scheduleLabel}
                </button>
            </div>

            {showBlock && (
                <div
                    style={{
                        marginTop: "10px",
                        padding: "12px",
                        backgroundColor: "#e6e6e6",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className="font-fam" style={{ fontSize: "13px", fontWeight: 600 }}>
                            Related Documents
                        </span>
                        {!disabled && (
                            <button
                                type="button"
                                title="Remove corrective action"
                                onClick={onRemoveCorrectiveAction}
                                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "13px" }}
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        )}
                    </div>

                    {relatedDocuments.length === 0 ? (
                        <div className="font-fam" style={{ fontSize: "12px", color: "#666", fontStyle: "italic", marginTop: "4px" }}>
                            No related documents
                        </div>
                    ) : (
                        <div style={{ marginTop: "4px" }}>
                            {relatedDocuments.map((doc, i) => (
                                <RelatedDocumentLink key={doc?.id || i} taskId={taskId} doc={doc} />
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: "12px" }}>
                        <PhotoFileCapture
                            taskId={taskId}
                            fieldId={field?.id}
                            kind="photo"
                            label="Before Image *"
                            value={correctiveAction?.beforeImage}
                            onChange={(v) => onImageChange("beforeImage", v)}
                            disabled={disabled}
                        />
                    </div>
                    <div style={{ marginTop: "12px" }}>
                        <PhotoFileCapture
                            taskId={taskId}
                            fieldId={field?.id}
                            kind="photo"
                            label="After Image *"
                            value={correctiveAction?.afterImage}
                            onChange={(v) => onImageChange("afterImage", v)}
                            disabled={disabled}
                        />
                    </div>

                    {showMissingMessage && (
                        <div className="font-fam" style={{ marginTop: "8px", fontSize: "12px", color: "#B00020", fontWeight: 600 }}>
                            Before and after images are required for this corrective action.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CorrectiveActionEditor;
