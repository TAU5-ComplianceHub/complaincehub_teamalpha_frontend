import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ImageLightbox from "./ImageLightbox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

// ---------------------------------------------------------------------------
// PhotoFileCapture
//
// Desktop equivalent of populateWorkOrder.dart's _buildPhotoControl /
// _buildFileControl / _buildCorrectiveImageField. On mobile, a "photo" type
// field always forces the device camera open (ImagePicker.pickImage with
// ImageSource.camera) - there is no way to pick an existing photo from the
// gallery. On desktop there's no camera to force open in the first place,
// so this always uses a plain <input type="file"> with NO `capture`
// attribute, which lets the user browse to and choose any existing photo
// (or any file, for "file" type fields) already on their device rather than
// only ever taking a brand new one.
//
// Used for:
//   - A field's own answer, when field.type is "photo" or "file"
//   - Each corrective-action image slot ("beforeImage"/"afterImage"), which
//     on mobile also always forces the camera (_captureCorrectiveImage) -
//     same fix applies here.
//
// value shape (mirrors _answers[id] / _correctiveActions[id][slot] on
// mobile so the submit payload-building logic can stay identical):
//   { file: File }                      - newly chosen this session, not
//                                          uploaded yet
//   { existing: { _id, fileName, ... } } - already uploaded/submitted
//                                          previously
//   { removed: true }                   - user cleared a previously-
//                                          uploaded file and hasn't picked
//                                          a replacement
//   null                                - unanswered
// ---------------------------------------------------------------------------
const PhotoFileCapture = ({
    taskId,
    fieldId,
    kind = "photo", // "photo" | "file"
    value,
    onChange,
    disabled = false,
    label,
    accept
}) => {
    const inputRef = useRef(null);
    const isPhoto = kind === "photo";

    const localFile = value?.file instanceof File ? value.file : null;
    const existing = value?.existing || null;
    const removed = value?.removed === true;

    const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
    const [existingPreviewUrl, setExistingPreviewUrl] = useState(null);
    const [existingFailed, setExistingFailed] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Local object URL for a just-picked file (photo type only - a "file"
    // type field just shows its name, same as ActionFieldFileValue).
    useEffect(() => {
        if (!isPhoto || !localFile) {
            setLocalPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(localFile);
        setLocalPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [isPhoto, localFile]);

    // Fetch bytes for an already-uploaded photo, same auth-header + blob
    // approach as ActionFieldFileValue/CorrectiveActionPreview - the
    // download endpoint requires a bearer token so a plain <img src> can't
    // be used.
    useEffect(() => {
        if (!isPhoto || localFile || !existing || removed || !taskId || !fieldId) {
            setExistingPreviewUrl(null);
            return;
        }
        let cancelled = false;
        let objectUrl = null;
        setExistingFailed(false);

        const load = async () => {
            try {
                const storedToken = localStorage.getItem("token");
                const downloadUrl = `${process.env.REACT_APP_URL}/api/workOrderTasks/${taskId}/action-fields/${fieldId}/files/${existing._id}/download`;
                const response = await axios.get(downloadUrl, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                    responseType: "blob",
                });
                if (cancelled) return;
                objectUrl = URL.createObjectURL(response.data);
                setExistingPreviewUrl(objectUrl);
            } catch {
                if (!cancelled) setExistingFailed(true);
            }
        };
        load();

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [isPhoto, localFile, existing, removed, taskId, fieldId]);

    const hasValue = Boolean(localFile) || (Boolean(existing) && !removed);
    const previewUrl = localPreviewUrl || existingPreviewUrl;
    const displayName = localFile?.name || existing?.fileName || "";

    const handlePick = () => {
        if (disabled) return;
        inputRef.current?.click();
    };

    const handleFileSelected = (e) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow picking the same file again later
        if (!file) return;
        onChange({ file });
    };

    const handleRemove = () => {
        onChange(existing ? { removed: true } : null);
    };

    const chooseLabel = hasValue
        ? (isPhoto ? "Replace Photo" : "Replace File")
        : (isPhoto ? "Select Photo" : "Select File");

    return (
        <div>
            {label && (
                <div className="font-fam" style={{ fontSize: "13px", fontWeight: 600, color: "#000", marginBottom: "4px" }}>
                    {label}
                </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                    ref={inputRef}
                    type="file"
                    accept={isPhoto ? "image/*" : accept}
                    // Deliberately no `capture` attribute - that's what
                    // forces a camera to open on mobile browsers instead of
                    // letting the user pick an existing file.
                    onChange={handleFileSelected}
                    style={{ display: "none" }}
                />
                <button
                    type="button"
                    className="font-fam"
                    onClick={handlePick}
                    disabled={disabled}
                    style={{
                        padding: "8px 14px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: disabled ? "#999" : "#002060",
                        background: "transparent",
                        border: `1px solid ${disabled ? "#ccc" : "#002060"}`,
                        borderRadius: "6px",
                        cursor: disabled ? "not-allowed" : "pointer",
                    }}
                >
                    {chooseLabel}
                </button>

                {hasValue && !disabled && (
                    <button
                        type="button"
                        title={isPhoto ? "Remove photo" : "Remove file"}
                        onClick={handleRemove}
                        style={{
                            padding: 0,
                            border: "none",
                            background: "transparent",
                            color: "#CB6F6F",
                            cursor: "pointer",
                            fontSize: "13px",
                            textDecoration: "underline",
                        }}
                    >

                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                )}
            </div>

            {!isPhoto && hasValue && (
                <div className="font-fam" style={{ fontSize: "13px", color: "#333", marginTop: "6px" }}>
                    {displayName}
                </div>
            )}

            {isPhoto && hasValue && (
                <div style={{ marginTop: "8px" }}>
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={displayName || "Preview"}
                            title="Click to view larger"
                            onClick={() => setIsPreviewOpen(true)}
                            style={{
                                maxWidth: "220px",
                                width: "40%",
                                height: "auto",
                                display: "block",
                                borderRadius: "4px",
                                cursor: "zoom-in",
                            }}
                        />
                    ) : existingFailed ? (
                        <span className="font-fam" style={{ fontSize: "12px", color: "#888" }}>
                            Preview unavailable
                        </span>
                    ) : (
                        <span className="font-fam" style={{ fontSize: "12px", color: "#888" }}>
                            Loading...
                        </span>
                    )}
                </div>
            )}

            {isPhoto && previewUrl && isPreviewOpen && (
                <ImageLightbox
                    isOpen={isPreviewOpen}
                    imageUrl={previewUrl}
                    altText={displayName}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}
        </div>
    );
};

export default PhotoFileCapture;
