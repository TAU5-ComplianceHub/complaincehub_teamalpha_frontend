import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// SignatureCapture
//
// Desktop (mouse-drawn) equivalent of populateWorkOrder.dart's
// _buildSignatureSection / _SignaturePainter. Sits as the very last item on
// the form, exactly like mobile, and is only ever rendered enabled once
// _isReadyForSignature()'s desktop equivalent (see PopulateWorkOrderPreview)
// is true - every required field answered, every started corrective action
// complete, every Hazard Class A/B response chosen. Until then the parent
// shows a disabled placeholder instead of mounting this at all.
//
// Exposes getDataUrl()/clear()/isEmpty via ref so the parent can pull the
// signature out only at submit time (same reasoning as mobile's
// _captureSignatureBase64 - rendering to a data URL on every stroke would
// be wasteful).
// ---------------------------------------------------------------------------
const SignatureCapture = forwardRef(({ disabled = false, missing = false, onDrawnChange }, ref) => {
    const canvasRef = useRef(null);
    const drawingRef = useRef(false);
    const lastPointRef = useRef(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useImperativeHandle(ref, () => ({
        isEmpty: () => isEmpty,
        clear: () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setIsEmpty(true);
            onDrawnChange?.(false);
        },
        getDataUrl: () => {
            if (isEmpty) return null;
            try {
                return canvasRef.current?.toDataURL("image/png") || null;
            } catch {
                return null;
            }
        },
    }), [isEmpty, onDrawnChange]);

    // Keep the canvas's internal pixel size matched to its rendered CSS
    // size so strokes land where the mouse actually is, and re-scale for
    // device pixel ratio for a crisp line.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ratio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        const ctx = canvas.getContext("2d");
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000";
    }, []);

    const getPoint = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handlePointerDown = (e) => {
        if (disabled) return;
        drawingRef.current = true;
        lastPointRef.current = getPoint(e);
        canvasRef.current?.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (disabled || !drawingRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const point = getPoint(e);
        const last = lastPointRef.current;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        lastPointRef.current = point;
        if (isEmpty) {
            setIsEmpty(false);
            onDrawnChange?.(true);
        }
    };

    const endStroke = (e) => {
        drawingRef.current = false;
        if (e?.pointerId != null) canvasRef.current?.releasePointerCapture?.(e.pointerId);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
        onDrawnChange?.(false);
    };

    return (
        <div>
            <div
                style={{
                    height: "160px",
                    width: "100%",
                    border: `1px solid ${missing ? "#CB6F6F" : "#bbb"}`,
                    borderRadius: "6px",
                    backgroundColor: disabled ? "#f2f2f2" : "#fff",
                    overflow: "hidden",
                }}
            >
                <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endStroke}
                    onPointerLeave={endStroke}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        cursor: disabled ? "not-allowed" : "crosshair",
                        touchAction: "none",
                    }}
                />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                <span className="font-fam" style={{ fontSize: "12px", color: "#CB6F6F", fontWeight: 600 }}>
                    {missing ? "Signature is required." : ""}
                </span>
                {!disabled && (
                    <button
                        type="button"
                        onClick={clear}
                        style={{ border: "none", background: "transparent", color: "#555", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
});

export default SignatureCapture;
