import React from "react";
import PhotoFileCapture from "./PhotoFileCapture";

// ---------------------------------------------------------------------------
// AnswerFieldControl
//
// Editable control for a single action field, chosen by field.type - the
// desktop/web equivalent of the type switch in populateWorkOrder.dart's
// _buildField (_buildTextControl / _buildDropdown / _buildSingleSelectButtons
// / _buildDateTimeControl / _buildPhotoControl / _buildFileControl /
// _buildGpsControl / _buildBarcodeControl).
//
// Two differences from the mobile controls, both intentional:
//   - photo/file fields use PhotoFileCapture, which opens a plain file
//     picker rather than forcing the device camera open (see that
//     component's own comment for why).
//   - barcode is a plain text input rather than a camera scanner. Desktop
//     workstations normally read barcodes with a handheld USB/Bluetooth
//     scanner that types the scanned value directly into whatever field is
//     focused, so a text input already supports that workflow; there's no
//     camera-based scan needed (or, on most desktops, available) here.
//
// `value` / `onChange` follow the exact same shape as the mobile app's
// `_answers[id]` so the parent's submit payload logic can stay in sync with
// populateWorkOrder.dart: plain string for text/number/dropdown/yesno/
// passfail/buttons/barcode/datetime, {lat,lng} for gps, and the
// {file}/{existing}/{removed} shape (see PhotoFileCapture) for photo/file.
// ---------------------------------------------------------------------------
const POSITIVE_COLOR = "#7EAC89";
const NEGATIVE_COLOR = "#CB6F6F";
const NEUTRAL_COLOR = "#002060";

const FIXED_YES_NO = ["Yes", "No"];
const FIXED_PASS_FAIL = ["Pass", "Fail"];

const choiceColor = (option) => {
    if (option === "Yes" || option === "Pass") return POSITIVE_COLOR;
    if (option === "No" || option === "Fail") return NEGATIVE_COLOR;
    return NEUTRAL_COLOR;
};

const SingleSelectButtons = ({ options, value, onChange, disabled }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {options.map((option) => {
            const selected = value === option;
            const color = choiceColor(option);
            return (
                <button
                    key={option}
                    type="button"
                    className="font-fam"
                    disabled={disabled}
                    onClick={() => onChange(selected ? null : option)}
                    style={{
                        padding: "8px 16px",
                        fontSize: "13px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        border: `1px solid ${color}`,
                        color: selected ? "#fff" : color,
                        backgroundColor: selected ? color : "transparent",
                        cursor: disabled ? "not-allowed" : "pointer",
                    }}
                >
                    {option}
                </button>
            );
        })}
    </div>
);

const AnswerFieldControl = ({
    taskId,
    field,
    value,
    onChange,
    numberError,
    disabled = false,
}) => {
    const id = field?.id;
    const type = field?.type;
    const options = Array.isArray(field?.options) ? field.options : [];

    switch (type) {
        case "number":
            return (
                <div>
                    <input
                        type="text"
                        inputMode="decimal"
                        className="waf-control"
                        value={value ?? ""}
                        disabled={disabled}
                        onChange={(e) => {
                            const v = e.target.value;
                            // Only allow characters that could be part of a
                            // (possibly negative, possibly decimal) number,
                            // same allowance as the mobile app's
                            // FilteringTextInputFormatter.
                            if (v !== "" && !/^-?\d*\.?\d*$/.test(v)) return;
                            onChange(v);
                        }}
                        style={{ width: "calc(100% - 20px)" }}
                    />
                    {numberError && (
                        <div className="font-fam" style={{ color: "#CB6F6F", fontSize: "12px", marginTop: "4px" }}>
                            {numberError}
                        </div>
                    )}
                </div>
            );

        case "dropdown":
            return (
                <select
                    className="waf-control waf-select"
                    value={value ?? ""}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value || null)}
                    style={{ width: "100%" }}
                >
                    <option value="">Select Option</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );

        case "yesno":
            return <SingleSelectButtons options={FIXED_YES_NO} value={value} onChange={onChange} disabled={disabled} />;

        case "passfail":
            return <SingleSelectButtons options={FIXED_PASS_FAIL} value={value} onChange={onChange} disabled={disabled} />;

        case "buttons":
            return <SingleSelectButtons options={options} value={value} onChange={onChange} disabled={disabled} />;

        case "datetime":
            return (
                <input
                    type="datetime-local"
                    className="waf-control"
                    disabled={disabled}
                    value={value ? toLocalDateTimeInputValue(value) : ""}
                    onChange={(e) => {
                        const v = e.target.value;
                        onChange(v ? new Date(v).toISOString() : null);
                    }}
                    style={{ width: "calc(100% - 20px)" }}
                />
            );

        case "photo":
            return (
                <PhotoFileCapture
                    taskId={taskId}
                    fieldId={id}
                    kind="photo"
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            );

        case "file":
            return (
                <PhotoFileCapture
                    taskId={taskId}
                    fieldId={id}
                    kind="file"
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            );

        case "barcode":
            return (
                <div>
                    <input
                        type="text"
                        className="waf-control"
                        placeholder="Scan or type a barcode / QR value..."
                        value={value ?? ""}
                        disabled={disabled}
                        onChange={(e) => onChange(e.target.value || null)}
                    />
                    {value && (
                        <div className="font-fam" style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>
                            Scanned: {value}
                        </div>
                    )}
                </div>
            );

        case "gps": {
            const lat = value?.lat;
            const lng = value?.lng;
            const captureLocation = () => {
                if (!navigator.geolocation) {
                    window.alert("Location is not available in this browser.");
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (position) => onChange({ lat: position.coords.latitude, lng: position.coords.longitude }),
                    (err) => window.alert(`Could not get location: ${err.message}`)
                );
            };
            return (
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                            type="button"
                            className="font-fam"
                            disabled={disabled}
                            onClick={captureLocation}
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
                            {lat != null && lng != null ? "Update Location" : "Capture Location"}
                        </button>
                        {lat != null && lng != null && !disabled && (
                            <button
                                type="button"
                                onClick={() => onChange(null)}
                                style={{ padding: 0, border: "none", background: "transparent", color: "#CB6F6F", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                    {lat != null && lng != null && (
                        <div className="font-fam" style={{ fontSize: "12px", color: "#555", marginTop: "6px" }}>
                            Lat: {Number(lat).toFixed(6)}, Lng: {Number(lng).toFixed(6)}
                        </div>
                    )}
                </div>
            );
        }

        case "text":
        default:
            return (
                <textarea
                    className="waf-control waf-textarea"
                    value={value ?? ""}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ resize: "none" }}
                />
            );
    }
};

// Converts a stored ISO string to the "yyyy-MM-ddThh:mm" shape the native
// datetime-local input expects, in local time (matching the mobile app's
// use of the device's local date/time pickers).
function toLocalDateTimeInputValue(isoString) {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default AnswerFieldControl;
