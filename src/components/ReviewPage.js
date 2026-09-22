import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import "./ReviewPage.css";
import DocumentSignaturesTable from "./CreatePage/DocumentSignaturesTable";
import TermTable from "./CreatePage/TermTable";
import AbbreviationTable from "./CreatePage/AbbreviationTable";
import ChapterTable from "./CreatePage/ChapterTable";
import ProcedureTable from "./CreatePage/ProcedureTable";
import ReferenceTable from "./CreatePage/ReferenceTable";
import PPETable from "./CreatePage/PPETable";
import HandToolTable from "./CreatePage/HandToolsTable";
import EquipmentTable from "./CreatePage/EquipmentTable";
import MaterialsTable from "./CreatePage/MaterialsTable";
import MobileMachineTable from "./CreatePage/MobileMachineTable";
import PicturesTable from "./CreatePage/PicturesTable";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling
import LoadDraftPopup from "./CreatePage/LoadDraftPopup";
import SaveAsPopup from "./Popups/SaveAsPopup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faCheckCircle, faRotateLeft, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight, faRotateRight, faSave, faPen, faUpload, faBan, faTimesCircle, faCopy } from '@fortawesome/free-solid-svg-icons';
import TopBarDD from "./Notifications/TopBarDD";
import SupportingDocumentTable from "./RiskRelated/SupportingDocumentTable";
import DraftPopup from "./Popups/DraftPopup";
import { getCurrentUser, can, canIn, isAdmin } from "../utils/auth";
import ApproversPopup from "./VisitorsInduction/InductionCreation/ApproversPopup";
import ApproveApprovalProcessPopup from "./Popups/ApproveApprovalProcessPopup";
import { v4 as uuidv4 } from "uuid";
import AimBulletComponent from "./CreatePage/AimBulletComponent";
import ScopeBulletComponent from "./CreatePage/ScopeBulletComponent";
import HazardsControlsTable from "./CreatePage/HazardsControlsTable";
import SavingInProgress from "./DocumentCreationPages/SavingInProgress";
import PublishingInProgress from "./DocumentCreationPages/PublishingInProgress";
import RemoveFromApprovalPopup from "./Popups/RemoveFromApprovalPopup";
import RejectReason from "./Popups/RejectReason";
import RejectReasonView from "./Popups/RejectReasonView";

const ReviewPage = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isOpenMenu, setIsOpenMenu] = useState(false);
    const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
    const [usedTermCodes, setUsedTermCodes] = useState([]);
    const [usedPPEOptions, setUsedPPEOptions] = useState([]);
    const access = getCurrentUser();
    const [userIDs, setUserIDs] = useState([]);
    const [usedHandTools, setUsedHandTools] = useState([]);
    const [usedEquipment, setUsedEquipment] = useState([]);
    const [usedMobileMachine, setUsedMobileMachines] = useState([]);
    const [usedMaterials, setUsedMaterials] = useState([]);
    const [loadedID, setLoadedID] = useState('');
    const [isLoadPopupOpen, setLoadPopupOpen] = useState(false);
    const [titleSet, setTitleSet] = useState(false);
    const [userID, setUserID] = useState('');
    const autoSaveInterval = useRef(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // spinner state for the top "Save" icon
    const [isPublishing, setIsPublishing] = useState(false); // spinner state for the top "Publish" icon
    const [errors, setErrors] = useState([]);
    const loadedIDRef = useRef('');
    const [change, setChange] = useState("");
    const [azureFN, setAzureFN] = useState("");
    const fileID = useParams().fileId;
    const type = useParams().type;
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [draftNote, setDraftNote] = useState(null);
    const procedureTableRef = useRef(null);
    const [readOnly, setReadOnly] = useState(false);
    const [approval, setApproval] = useState(false);
    const [inApproval, setInApproval] = useState(false);
    const [inReview, setInReview] = useState(false);
    const [approveState, setApproveState] = useState(false);
    const [loadingAimIndex, setLoadingAimIndex] = useState(null);
    const [loadingScope, setLoadingScope] = useState(false);
    const [removeApprovalState, setRemoveApprovalState] = useState(false);
    const [removingApproval, setRemovingApproval] = useState(false);
    const [canRemove, setCanRemove] = useState(false);
    const [rejectState, setRejectState] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [isRejected, setIsRejected] = useState(false);
    const [showRejectReasonView, setShowRejectReasonView] = useState(false);
    const [rejectionInfo, setRejectionInfo] = useState({ rejectorName: "", rejectDate: null, rejectionMessage: "" });

    const openApproval = () => {
        setApproval(true);
    }

    const closeApprovePopup = () => {
        setApproveState(false);
    }

    const openRemoveApproval = () => {
        setRemoveApprovalState(true);
    }

    const closeRemoveApproval = () => {
        setRemoveApprovalState(false);
    }

    const closeApproval = () => {
        setApproval(false);
    }

    const openDraftNote = () => {
        setDraftNote(true);
    }

    const closeDraftNote = () => {
        setDraftNote(false);
    }

    const [rewriteHistory, setRewriteHistory] = useState({
        aim: {},
        scope: {}
    });

    const openSaveAs = () => {
        if (!titleSet) {
            toast.warn("Please fill in at least the title field before saving.", {
                closeButton: false,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }
        setIsSaveAsModalOpen(true);
    };

    const closeSaveAs = () => {
        setIsSaveAsModalOpen(false);
    };

    const confirmSaveAs = (newTitle) => {
        // apply the new title, clear loadedID, then save
        const me = userIDRef.current;
        const newFormData = {
            ...formDataRef.current,        // your current formData
            title: newTitle,             // override title
        };

        setFormData(newFormData);
        formDataRef.current = newFormData;

        setUserIDs([me]);
        userIDsRef.current = [me];

        loadedIDRef.current = '';
        setLoadedID('');

        saveAsData();

        toast.dismiss();
        toast.clearWaitingQueue();
        toast.success("New Draft Successfully Saved", {
            closeButton: false,
            autoClose: 1500, // 1.5 seconds
            style: {
                textAlign: 'center'
            }
        });

        setIsSaveAsModalOpen(false);
    };

    const addHazardControlRow = () => {
        setFormData((prev) => ({
            ...prev,
            hazardsControls: [
                ...(Array.isArray(prev.hazardsControls) ? prev.hazardsControls : []),
                { hazard: "", unwantedEvent: "", control: "" }
            ]
        }));
    };

    const removeHazardControlRow = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            hazardsControls: (Array.isArray(prev.hazardsControls) ? prev.hazardsControls : []).filter(
                (_, index) => index !== indexToRemove
            )
        }));
    };

    const updateHazardControlRow = (index, field, value) => {
        setFormData((prev) => {
            const updatedRows = [...(Array.isArray(prev.hazardsControls) ? prev.hazardsControls : [])];
            updatedRows[index] = {
                ...updatedRows[index],
                [field]: value
            };
            return {
                ...prev,
                hazardsControls: updatedRows
            };
        });
    };

    const updateHazardControlRows = (newRows) => {
        setFormData((prev) => ({
            ...prev,
            hazardsControls: newRows
        }));
    };

    const [formData, setFormData] = useState({
        title: "",
        documentType: type,
        aim: [{ type: "text", text: "The aim of the document is " }],
        scope: [{ type: "text", text: "" }],
        date: new Date().toLocaleDateString(),
        version: "1",
        rows: [
            { auth: "Author", name: "", pos: "", num: 1 },
            { auth: "Reviewer", name: "", pos: "", num: 2 },
            { auth: "Approver", name: "", pos: "", num: 3 },
        ],
        procedureRows: [{
            nr: 1, mainStep: "", SubStep: "", accountable: "", responsible: "", prevStep: "-"
        }],
        abbrRows: [],
        termRows: [],
        chapters: [],
        hazardsControls: [],
        references: [],
        PPEItems: [],
        HandTools: [],
        Equipment: [],
        MobileMachine: [],
        Materials: [],
        pictures: [],
        supportingDocuments: [],
        reviewDate: 0,
        changeTable: [
            { changeVersion: "1", change: "New Document.", changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
        ],
    });

    useEffect(() => {
        if (fileID) {
            loadData(fileID);
        }
    }, []);

    const getNewAzureFileName = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/fileGenDocs//getFile/${fileID}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) throw new Error("Failed to fetch file");

            const storedData = await response.json();
            setAzureFN(storedData.files?.azureFileName || "");

        } catch (error) {
            console.error("Error loading data:", error);
        }
    };

    const updateRow = (index, field, value) => {
        const updatedProcedureRows = formData.procedureRows.map((row, i) =>
            i === index ? { ...row, [field]: value } : row
        );

        setFormData(prevFormData => ({
            ...prevFormData,
            procedureRows: updatedProcedureRows,
        }));
    };

    // handleSave: this is the ONLY place a save toast should be shown from.
    // saveData() is called from lots of other places (autosave, save-before-navigate,
    // etc.) where we intentionally do NOT want a toast, so the success/failure
    // messaging lives here, not inside saveData.
    const handleSave = async () => {
        if (formData.title === "") {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please fill in at least the title field before saving.", {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }
            })
            return;
        }

        setIsSaving(true);
        try {
            const result = await saveData(fileID);

            toast.dismiss();
            toast.clearWaitingQueue();
            if (result?.ok) {
                toast.success("Draft has been successfully saved", {
                    closeButton: false,
                    autoClose: 1500, // 1.5 seconds
                    style: {
                        textAlign: 'center'
                    }
                });
            } else {
                toast.error("Failed to save draft. Please try again.", {
                    closeButton: false,
                    autoClose: 2000,
                    style: {
                        textAlign: 'center'
                    }
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (readOnlyRef.current) return;

        if (!autoSaveInterval.current && formData.title.trim() !== "") {
            console.log("✅ Auto-save interval set");

            autoSaveInterval.current = setInterval(() => {
                console.log("⏳ Auto-saving...");
                autoSaveDraft();
            }, 120000); // Auto-save every 30 seconds
        }

        return () => {
            if (autoSaveInterval.current) {
                clearInterval(autoSaveInterval.current);
                autoSaveInterval.current = null;
                console.log("🧹 Auto-save interval cleared");
            }
        };
    }, [formData.title]);

    const autoSaveDraft = () => {
        if (readOnlyRef.current) return;
        if (readOnly) return;
        saveData(fileID, { skipFileUpload: false });
        toast.dismiss();
        toast.clearWaitingQueue();
        toast.success("Draft has been auto-saved", {
            closeButton: true,
            style: {
                textAlign: 'center'
            }
        });
    };

    const addPicRow = () => {
        setFormData((prevData) => {
            const totalFigures = prevData.pictures.length * 2 + 1; // Count total fields

            return {
                ...prevData,
                pictures: [
                    ...prevData.pictures,
                    {
                        pic1: `Figure 1.${totalFigures}: `, // Assign next available number
                        pic2: `Figure 1.${totalFigures + 1}: `
                    }
                ]
            };
        });
    };

    const updatePicRow = (index, field, value) => {
        const updatedPicRows = [...formData.pictures];
        updatedPicRows[index][field] = value;  // Update the specific field in the row

        setFormData({
            ...formData,
            pictures: updatedPicRows,  // Update the procedure rows in state
        });
    };

    const removePicRow = (indexToRemove) => {
        setFormData({
            ...formData,
            pictures: formData.pictures.filter((_, index) => index !== indexToRemove),
        });
    };

    const buildSupportingDocumentPayload = (documents = []) => {
        return documents.map((doc, index) => ({
            nr: index + 1,
            name: doc.name,
            note: doc.note || "",
            saved: Boolean(doc.storageId),
            storageId: doc.storageId || null,
            size: doc.size || doc.file?.size || 0,
            mimeType: doc.mimeType || doc.file?.type || "",
        }));
    };

    const buildReviewFormDataRequest = (dataToStore, options = {}) => {
        const { skipFileUpload = false } = options;

        const multipart = new FormData();
        const supportingDocuments = dataToStore.formData.supportingDocuments || [];

        const payload = {
            ...dataToStore,
            formData: {
                ...dataToStore.formData,
                supportingDocuments: buildSupportingDocumentPayload(supportingDocuments),
            },
            skipFileUpload,
        };

        multipart.append("payload", JSON.stringify(payload));

        if (!skipFileUpload) {
            supportingDocuments.forEach((doc, index) => {
                if (doc?.file instanceof File && !doc?.storageId) {
                    multipart.append("supportingFiles", doc.file);
                    multipart.append(
                        "supportingFilesMeta",
                        JSON.stringify({
                            rowIndex: index,
                            nr: doc.nr ?? index + 1,
                            name: doc.name,
                            note: doc.note || "",
                        })
                    );
                }
            });
        }

        return multipart;
    };

    const saveAsData = async (options = {}) => {
        const { skipFileUpload = false } = options;

        const dataToStore = {
            usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
            usedTermCodes: usedTermCodesRef.current,
            usedPPEOptions: usedPPEOptionsRef.current,
            usedHandTools: usedHandToolsRef.current,
            usedEquipment: usedEquipmentRef.current,
            usedMobileMachine: usedMobileMachineRef.current,
            usedMaterials: usedMaterialsRef.current,
            formData: formDataRef.current,
            userIDs: userIDsRef.current,
            creator: userIDRef.current,
            updater: null,
            dateUpdated: null
        };

        try {
            const body = buildReviewFormDataRequest(dataToStore, { skipFileUpload });

            const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/safe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error || 'Failed to save draft');
            }

            if (result.id) {
                setLoadedID(result.id);
                loadedIDRef.current = result.id;
            }

            if (result.formData) {
                setFormData(result.formData);
                formDataRef.current = result.formData;
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const saveData = async (fileID, options = {}) => {
        const { skipFileUpload = false } = options;

        const dataToStore = {
            usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
            usedTermCodes: usedTermCodesRef.current,
            usedPPEOptions: usedPPEOptionsRef.current,
            usedHandTools: usedHandToolsRef.current,
            usedEquipment: usedEquipmentRef.current,
            usedMobileMachine: usedMobileMachineRef.current,
            usedMaterials: usedMaterialsRef.current,
            formData: formDataRef.current
        };

        try {
            const body = buildReviewFormDataRequest(dataToStore, { skipFileUpload });

            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/procedure/save/${fileID}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error || 'Failed to save review file');
            }

            if (result?.draft?.formData) {
                setFormData(result.draft.formData);
                formDataRef.current = result.draft.formData;
            }

            return { ok: true };
        } catch (error) {
            console.error('Error saving data:', error);
            return { ok: false, error };
        }
    };

    const handleClick = async () => {
        const newErrors = validateForm();
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }
            })

            console.log("Validation errors:", newErrors);
        } else {
            setIsPublishing(true);
            try {
                await handlePublishApprovalFlow();
            } finally {
                setIsPublishing(false);
            }
        }
    };

    const loadData = async (fileID) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/fileGenDocs/getFile/${fileID}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) throw new Error("Failed to fetch file");

            const data = await response.json();
            const storedData = data.files || {};
            const readOnly = data.readOnly || false;
            const canRemove = data.canRemove || false;
            const isRejectedFromServer = canRemove
                ? false
                : Boolean(storedData.isRejected || data.isRejected);
            // Owner-facing view of the same flag: the owner doesn't get the
            // read-only "rejected" banner (they're the one meant to fix it), but
            // they do need to see who rejected it, when, and why.
            const isRejectedForOwner = canRemove && Boolean(storedData.isRejected || data.isRejected);

            // Update your states as needed:
            setUsedAbbrCodes(storedData.usedAbbrCodes || []);
            setUsedTermCodes(storedData.usedTermCodes || []);
            setUsedPPEOptions(storedData.usedPPEOptions || []);
            setUsedHandTools(storedData.usedHandTools || []);
            setUsedEquipment(storedData.usedEquipment || []);
            setUsedMobileMachines(storedData.usedMobileMachine || []);
            setUsedMaterials(storedData.usedMaterials || []);
            setInApproval(Boolean(data.statusApproval));
            setInReview(Boolean(data.statusReview));

            setReadOnly(Boolean(data.readOnly) || isRejectedFromServer);
            setIsRejected(isRejectedFromServer);
            setCanRemove(canRemove);
            const rawForm = storedData.formData || {};
            const normalizedForm = {
                ...rawForm,
                supportingDocuments: Array.isArray(rawForm.supportingDocuments)
                    ? rawForm.supportingDocuments
                    : [],
                aim: normalizeProcedureAim(rawForm.aim),
                scope: normalizeProcedureScope(rawForm.scope)
            };
            setFormData(normalizedForm);
            setFormData(prev => ({ ...prev }));
            setTitleSet(true);
            setAzureFN(storedData.azureFileName || "");
            if (isRejectedForOwner) {
                // The rejection view takes priority over the reshare popup. The
                // reshare decision (if any) happens after the owner clicks
                // "Review Document" — see resolveRejectedDraft.
                setRejectionInfo({
                    rejectorName: storedData.rejectorUser || "N/A",
                    rejectDate: storedData.rejectDate || null,
                    rejectionMessage: storedData.rejectionMessage || "",
                });
                setShowRejectReasonView(true);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const updateRefRow = (index, field, value) => {
        const updatedRefRows = [...formData.references];
        updatedRefRows[index][field] = value;  // Update the specific field in the row

        setFormData({
            ...formData,
            references: updatedRefRows,  // Update the procedure rows in state
        });
    };

    const updateRefRows = (newRef) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            references: newRef, // Update procedureRows with new data
        }));
    };

    const formDataRef = useRef(formData);
    const usedAbbrCodesRef = useRef(usedAbbrCodes);
    const usedTermCodesRef = useRef(usedTermCodes);
    const usedPPEOptionsRef = useRef(usedPPEOptions);
    const usedHandToolsRef = useRef(usedHandTools);
    const usedEquipmentRef = useRef(usedEquipment);
    const usedMobileMachineRef = useRef(usedMobileMachine);
    const usedMaterialsRef = useRef(usedMaterials);
    const userIDsRef = useRef(userIDs);
    const userIDRef = useRef(userID);
    const readOnlyRef = useRef(readOnly);

    useEffect(() => {
        userIDRef.current = userID;
    }, [userID]);

    useEffect(() => {
        userIDs.current = userIDs;
    }, [userIDs]);

    useEffect(() => {
        usedAbbrCodesRef.current = usedAbbrCodes;
    }, [usedAbbrCodes]);

    useEffect(() => {
        usedTermCodesRef.current = usedTermCodes;
    }, [usedTermCodes]);

    useEffect(() => {
        usedPPEOptionsRef.current = usedPPEOptions;
    }, [usedPPEOptions]);

    useEffect(() => {
        usedHandToolsRef.current = usedHandTools;
    }, [usedHandTools]);

    useEffect(() => {
        usedMobileMachineRef.current = usedMobileMachine;
    }, [usedMobileMachine]);

    useEffect(() => {
        usedMaterialsRef.current = usedMaterials;
    }, [usedMaterials]);

    useEffect(() => {
        usedEquipmentRef.current = usedEquipment;
    }, [usedEquipment]);

    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        readOnlyRef.current = readOnly;
    }, [readOnly]);

    const [history, setHistory] = useState([]);
    const timeoutRef = useRef(null);
    const previousFormData = useRef(formData);
    const [redoHistory, setRedoHistory] = useState([]);

    // Function to save to history with a limit
    const saveToHistory = useCallback(() => {
        const currentState = {
            formData,
            usedAbbrCodes,
            usedTermCodes,
            usedPPEOptions,
            usedHandTools,
            usedEquipment,
            usedMobileMachine,
            usedMaterials,
        };

        setHistory((prev) => {
            if (prev.length > 0 && JSON.stringify(prev[prev.length - 1]) === JSON.stringify(currentState)) {
                return prev; // Prevent duplicate saves
            }
            return [...prev, currentState]; // Save the new state
        });
    }, [formData, usedAbbrCodes, usedTermCodes, usedPPEOptions, usedHandTools, usedEquipment, usedMobileMachine, usedMaterials]);

    // Detects form changes across all components with debounce
    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(saveToHistory, 1000); // Only save after 1s of inactivity
    }, [formData, usedAbbrCodes, usedTermCodes, usedPPEOptions, usedHandTools, usedEquipment, usedMobileMachine, usedMaterials]);

    const undoLastChange = () => {
        if (history.length > 1) {
            const lastState = history[history.length - 2]; // Get the last valid state
            const currentState = history[history.length - 1];

            // Restore the previous state
            setFormData(lastState.formData);
            setUsedAbbrCodes(lastState.usedAbbrCodes);
            setUsedTermCodes(lastState.usedTermCodes);
            setUsedPPEOptions(lastState.usedPPEOptions);
            setUsedHandTools(lastState.usedHandTools);
            setUsedEquipment(lastState.usedEquipment);
            setUsedMobileMachines(lastState.usedMobileMachine);
            setUsedMaterials(lastState.usedMaterials);

            setHistory((prev) => prev.slice(0, -1)); // Remove last history entry
            setRedoHistory((prev) => [...prev, currentState]);

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Undo successful!", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("No changes to undo.", {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        }
    };

    const redoChange = () => {
        if (redoHistory.length > 0) {
            const nextState = redoHistory[redoHistory.length - 1];

            // Apply redo state
            setFormData(nextState.formData);
            setUsedAbbrCodes(nextState.usedAbbrCodes);
            setUsedTermCodes(nextState.usedTermCodes);
            setUsedPPEOptions(nextState.usedPPEOptions);
            setUsedHandTools(nextState.usedHandTools);
            setUsedEquipment(nextState.usedEquipment);
            setUsedMobileMachines(nextState.usedMobileMachine);
            setUsedMaterials(nextState.usedMaterials);

            // Push back into history
            setHistory((prev) => [...prev, nextState]);
            setRedoHistory((prev) => prev.slice(0, -1));

            toast.success("Redo successful!", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: 'center' }
            });
        } else {
            toast.warn("Nothing to redo.", {
                closeButton: true,
                autoClose: 800,
                style: { textAlign: 'center' }
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title) newErrors.title = true;
        if (!formData.documentType) newErrors.documentType = true;
        const validAim = sanitizeAimForValidation(formData.aim);
        if (validAim.length === 0) {
            newErrors.aim = true;
        }
        const validScope = sanitizeScopeForStorage(normalizeProcedureScope(formData.scope));
        if (validScope.length === 0) newErrors.scope = true;
        if (!formData.reviewDate) newErrors.reviewDate = true;
        if (formData.abbrRows.length === 0) newErrors.abbrs = true;
        if (formData.termRows.length === 0) newErrors.terms = true;

        if (formData.procedureRows.length === 0) {
            newErrors.procedureRows = true;
        } else {
            formData.procedureRows.forEach((row, index) => {
                if (!row.mainStep) newErrors.procedureRows = true;
                if (!row.SubStep) newErrors.procedureRows = true;
                if (!row.accountable) newErrors.procedureRows = true;
                if (!row.responsible) newErrors.procedureRows = true;
            });
        }

        if (formData.rows.length === 0) {
            newErrors.signs = true;
        } else {
            formData.rows.forEach((row, index) => {
                if (!row.name) newErrors.signs = true;
            });
        }

        if (formData.references.length === 0) {
            newErrors.reference = true;
        } else {
            formData.references.forEach((row, index) => {
                if (!row.ref) newErrors.reference = true;
                if (!row.refDesc) newErrors.reference = true;
            });
        }

        if (change === "") {
            newErrors.change = true;
        }

        return newErrors;
    };

    // Authentication check
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
        }
    }, [navigate]);

    // Handle input changes for normal fields
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        console.log(formData)

        if (e.target.name === "title" && e.target.value.trim() !== "") {
            setTitleSet(true); // Enable auto-save only after title is entered
        }
    };

    // Handle input changes for the table rows
    const handleRowChange = (e, index, field) => {
        const newRows = [...formData.rows];
        const rowToChange = newRows[index];

        // Save the previous value of 'auth' before change for validation
        const previousAuth = rowToChange.auth;

        // Update the field value
        rowToChange[field] = e.target.value;

        // Automatically set num based on the auth type
        if (rowToChange.auth === "Author") {
            rowToChange.num = 1;
        } else if (rowToChange.auth === "Reviewer") {
            rowToChange.num = 2;
        } else if (rowToChange.auth === "Approver") {
            rowToChange.num = 3;
        }

        // Only perform validation if the 'auth' field was modified
        if (field === "auth") {
            // Check if the current 'Author', 'Reviewer', or 'Approved By' is being removed or modified
            const requiredRoles = ["Author", "Reviewer", "Approver"];

            // Check if there is at least one row with each required auth type
            const isValid = requiredRoles.every(role => {
                return formData.rows.filter((row) => row.auth === role).length > 0 || rowToChange.auth === role;
            });

            if (!isValid) {
                toast.error(`You must have at least one ${requiredRoles.find(role => formData.rows.filter((row) => row.auth === role).length === 0)}.`, {
                    closeButton: true,
                    autoClose: 800, // 1.5 seconds
                    style: {
                        textAlign: 'center'
                    }
                });

                // Revert the change if invalid
                rowToChange.auth = previousAuth;  // Revert to previous auth
                rowToChange[field] = previousAuth; // Revert the field to its previous value

                setFormData((prevFormData) => ({
                    ...prevFormData,
                    rows: newRows,
                }));
                return; // Prevent the update if invalid
            }
        }

        // Update formData with the new rows
        setFormData((prevFormData) => ({
            ...prevFormData,
            rows: newRows,
        }));
    };

    useEffect(() => {
        if (userID) {
            console.log("User ID is set:", userID);
            // Perform actions that depend on userID here
        }
    }, [userID]);

    // Add a new row to the table
    const addRow = () => {
        setFormData({
            ...formData,
            rows: [
                ...formData.rows,
                { auth: "Author", name: "", pos: "", num: 1 }
            ]
        });
    };

    const addProRow = () => {
        const lastNr = formData.procedureRows.length > 0 && typeof formData.procedureRows[formData.procedureRows.length - 1].nr === 'number'
            ? formData.procedureRows[formData.procedureRows.length - 1].nr
            : 0; // Safely get the last nr value or 0 if no rows exist or nr is not a number

        setFormData({
            ...formData,
            procedureRows: [
                ...formData.procedureRows,
                {
                    nr: lastNr + 1,
                    mainStep: "",
                    SubStep: "",
                    discipline: "Engineering",       // Default value for discipline
                    accountable: "",      // Default value for accountable
                    responsible: "",
                    prevStep: "-",
                }
            ]
        });
    };

    const removeProRow = (indexToRemove) => {
        if (formData.procedureRows.length <= 1) {
            toast.warn("At least one procedure step is required.", {
                autoClose: 800,
                closeButton: true,
                style: { textAlign: "center" },
            });
            return;
        }

        const newRows = formData.procedureRows
            .filter((_, index) => index !== indexToRemove)
            .map((row, idx) => ({ ...row, nr: idx + 1 })); // Renumber after removal

        setFormData({
            ...formData,
            procedureRows: newRows,
        });
    };


    const updateProcedureRows = (newProcedureRows) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            procedureRows: newProcedureRows, // Update procedureRows with new data
        }));
    };

    const updateSignatureRows = (newSignatureRows) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            rows: newSignatureRows, // Update procedureRows with new data
        }));
    };

    const addRefRow = () => {
        const lastNr = formData.references.length > 0 && typeof formData.references[formData.references.length - 1].nr === 'number'
            ? formData.references[formData.references.length - 1].nr
            : 0; // Safely get the last nr value or 0 if no rows exist or nr is not a number

        setFormData({
            ...formData,
            references: [
                ...formData.references,
                {
                    nr: lastNr + 1,
                    ref: '',
                    refDesc: ''
                }
            ]
        });
    };

    const removeRefRow = (indexToRemove) => {
        setFormData({
            ...formData,
            references: formData.references.filter((_, index) => index !== indexToRemove),
        });
    };

    const removeRow = (indexToRemove) => {
        const rowToRemove = formData.rows[indexToRemove];

        // Prevent removal of the initial required rows
        const initialRequiredRows = ["Author", "Reviewer", "Approver"];
        if (
            initialRequiredRows.includes(rowToRemove.auth) &&
            formData.rows.filter((row) => row.auth === rowToRemove.auth).length === 1
        ) {
            toast.error(`You must keep at least one ${rowToRemove.auth}.`, {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        // Proceed with removal if conditions are met
        setFormData({
            ...formData,
            rows: formData.rows.filter((_, index) => index !== indexToRemove),
        });
    };

    const sanitizeAimForStorage = (items = []) => {
        if (!Array.isArray(items)) return [];

        return items
            .map((item) => {
                const type = item?.type === "bullet" ? "bullet" : "text";

                if (type === "text") {
                    return {
                        ...item,
                        type: "text",
                        text: typeof item?.text === "string" ? item.text.trim() : ""
                    };
                }

                const cleanedBullets = (Array.isArray(item?.bullets) ? item.bullets : [])
                    .map((b) => ({
                        id: b?.id || uuidv4(),
                        text: typeof b?.text === "string" ? b.text.trim() : ""
                    }))
                    .filter((b) => b.text !== "");

                return {
                    ...item,
                    type: "bullet",
                    bullets: cleanedBullets,
                    text: cleanedBullets.map((b) => b.text).join("\n")
                };
            })
            .filter((item) => item.text.trim() !== "");
    };

    const getSanitizedFormData = (sourceFormData) => ({
        ...sourceFormData,
        aim: sanitizeAimForStorage(normalizeProcedureAim(sourceFormData.aim)),
        scope: sanitizeScopeForStorage(normalizeProcedureScope(sourceFormData.scope))
    });

    // Send data to backend to generate a Word document
    const handleGeneratePDF = async () => {
        const documentName = (formData.title) + ' ' + formData.documentType;

        const updatedChangeTable = [...formData.changeTable];

        const newChange = {
            changeVersion: parseInt(formData.changeTable[formData.changeTable.length - 1].changeVersion) + 1,
            change: change,
            changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };

        updatedChangeTable.push(newChange);


        let flowchartImages = [];

        // 1. Fetch Images from Flowchart
        if (procedureTableRef.current) {
            console.log("Generating flowchart images for backend...");
            try {
                flowchartImages = await procedureTableRef.current.getFlowchartImages();
                console.log(`Captured ${flowchartImages.length} images.`);
            } catch (err) {
                console.error("Error capturing flowchart images:", err);
                // Optional: Decide if you want to stop or continue without images
            }
        }

        setFormData((prevFormData) => {
            const updatedFormData = {
                ...prevFormData,
                changeTable: updatedChangeTable,
                version: parseInt(prevFormData.version) + 1
            };

            const dataToStore = {
                usedAbbrCodes,
                usedTermCodes,
                usedPPEOptions,
                usedHandTools,
                usedEquipment,
                usedMobileMachine,
                usedMaterials,
                formData: getSanitizedFormData(updatedFormData),
                userID,
                azureFN,
                flowchartImages: flowchartImages
            };

            sendUpdatedFormData(dataToStore, documentName);

            return updatedFormData; // Ensure state is updated correctly
        });
    };


    const handlePublishApprovalFlow = async (approversValue) => {
        const dataToStore = {
            draftID: fileID,
            authorizations: (formDataRef.current?.rows ?? []).map(r => ({
                auth: r.auth,     // "Author" | "Reviewer" | "Approver" etc
                name: r.name,     // username
                pos: r.pos,       // position
                num: r.num
            })),
        };

        setLoading(true);
        saveData(fileID);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/documentApprovals/start-approval-proc-published`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");
            const data = await response.json();

            toast.success(`Procedure Publishing Approval Started.`, {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });

            if (autoSaveInterval.current) {
                clearInterval(autoSaveInterval.current);
                autoSaveInterval.current = null;
            }

            if (data.readOnly) {
                setReadOnly(data.readOnly)
            }

            setInApproval(data.approvalStatus);
            setInReview(data.reviewState);

            setLoading(false);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const handleApproveClick = () => {
        const newErrors = validateForm();
        setErrors(newErrors);


        setApproveState(true);
    };

    const approveDraft = async () => {
        const dataToStore = {
            draftID: fileID
        };

        setLoading(true);
        saveData(fileID);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/documentApprovals/approve-published-proc`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");
            const data = await response.json();

            toast.success(`Procedure Successfully Approved.`, {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });

            if (autoSaveInterval.current) {
                clearInterval(autoSaveInterval.current);
                autoSaveInterval.current = null;
            }

            setReadOnly(true);
            setLoading(false);
            setApproveState(false);

            if (data.fullyApproved) {
                await handleGeneratePDF()
            }
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const handleRejectClick = () => {
        setRejectState(true);
    };

    const closeRejectPopup = () => {
        setRejectState(false);
    };

    const rejectDraft = async (message) => {
        setRejecting(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/documentApprovals/reject-published-proc`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ draftID: fileID, message }),
            });

            if (!response.ok) throw new Error("Failed to reject document");

            toast.success(`Successfully Rejected.`, {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });

            if (autoSaveInterval.current) {
                clearInterval(autoSaveInterval.current);
                autoSaveInterval.current = null;
            }

            setIsRejected(true);
            setReadOnly(true);
            setRejectState(false);

            setTimeout(() => {
                navigate(-1);
            }, 1500);
        } catch (error) {
            console.error("Error rejecting document:", error);
            toast.error("Failed to reject document", {
                closeButton: true,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            });
        } finally {
            setRejecting(false);
        }
    };

    const removeFromApprovalProcess = async () => {
        const dataToStore = {
            draftID: fileID
        };

        setRemovingApproval(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/documentApprovals/remove-from-approval-proc-published`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to remove document from the approval process");

            toast.success(`Procedure Removed From The Approval Process.`, {
                closeButton: true,
                autoClose: 800, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });

            setInApproval(false);
            setInReview(false);
            setReadOnly(false);
            setRemoveApprovalState(false);
        } catch (error) {
            console.error("Error removing document from the approval process:", error);
            toast.error("Failed to remove document from the approval process", {
                closeButton: true,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            });
        } finally {
            setRemovingApproval(false);
        }
    };

    const sendUpdatedFormData = async (dataToStore, documentName) => {
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/publish-document`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore), // Now sending the correct dataToStore
            });
            if (response.status === 404) throw new Error("Failed to generate document")

            if (!response.ok) throw new Error("Failed to generate document");

            setLoading(false);
            getNewAzureFileName();

            toast.success("File has been reviewed.", {
                closeButton: false,
                style: {
                    textAlign: 'center'
                }
            })
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const handleGenerateDocument = async () => {
        // 1) Build the updated changeTable and version from the latest state
        const lastCT = formData.changeTable;
        const lastVersion = parseInt(formData.version, 10);
        const lastChangeVer = parseInt(lastCT[lastCT.length - 1].changeVersion, 10);

        const newChange = {
            changeVersion: (lastChangeVer + 1).toString(),
            change,
            changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };

        const updatedFormData = {
            ...formData,
            version: (lastVersion + 1).toString(),
            changeTable: [...lastCT, newChange]
        };

        await handleGenerateProcedureDocument(updatedFormData);
    };

    const handleGenerateProcedureDocument = async (generateData) => {
        let flowchartImages = [];

        // 1. Fetch Images from Flowchart
        if (procedureTableRef.current) {
            console.log("Generating flowchart images for backend...");
            try {
                flowchartImages = await procedureTableRef.current.getFlowchartImages();
                console.log(`Captured ${flowchartImages.length} images.`);
            } catch (err) {
                console.error("Error capturing flowchart images:", err);
                // Optional: Decide if you want to stop or continue without images
            }
        }
        const dataToStore = {
            formData: getSanitizedFormData(generateData),
            flowchartImages: flowchartImages
        };

        const documentName = (formData.title) + ' ' + formData.documentType;
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/generate-docx`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `${documentName}.docx`);
            setLoading(false);
            openDraftNote();
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const createAimBulletRow = () => ({
        id: uuidv4(),
        text: ""
    });

    const normalizeProcedureAim = (value) => {
        if (Array.isArray(value) && value.length > 0) {
            return value.map((item) => {
                const type = item?.type === "bullet" ? "bullet" : "text";

                if (type === "text") {
                    return {
                        type: "text",
                        text: item?.text || ""
                    };
                }

                const bullets = Array.isArray(item?.bullets)
                    ? item.bullets.map((b) => ({
                        id: b?.id || uuidv4(),
                        text: b?.text || ""
                    }))
                    : String(item?.text || "")
                        .split(/\r?\n/)
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => ({
                            id: uuidv4(),
                            text: line
                        }));

                return {
                    type: "bullet",
                    bullets: bullets.length > 0 ? bullets : [createAimBulletRow()],
                    text: bullets.map((b) => b.text).join("\n")
                };
            });
        }

        if (typeof value === "string" && value.trim() !== "") {
            return [{ type: "text", text: value }];
        }

        return [{ type: "text", text: "" }];
    };

    const sanitizeAimForValidation = (items = []) => {
        if (!Array.isArray(items)) return [];

        return items
            .map((item) => {
                const type = item?.type === "bullet" ? "bullet" : "text";

                if (type === "text") {
                    return {
                        ...item,
                        type: "text",
                        text: typeof item?.text === "string" ? item.text.trim() : ""
                    };
                }

                const cleanedBullets = (Array.isArray(item?.bullets) ? item.bullets : [])
                    .map((b) => ({
                        id: b?.id || uuidv4(),
                        text: typeof b?.text === "string" ? b.text.trim() : ""
                    }))
                    .filter((b) => b.text !== "");

                return {
                    ...item,
                    type: "bullet",
                    bullets: cleanedBullets,
                    text: cleanedBullets.map((b) => b.text).join("\n")
                };
            })
            .filter((item) => item.text.trim() !== "");
    };

    const pushAimRewriteHistory = (index, oldValue) => {
        setRewriteHistory((prev) => ({
            ...prev,
            aim: {
                ...prev.aim,
                [index]: [...(prev.aim[index] || []), oldValue]
            }
        }));
    };

    const undoAimRewrite = (index) => {
        setRewriteHistory((prev) => {
            const currentHistory = [...(prev.aim[index] || [])];
            if (currentHistory.length === 0) return prev;

            const lastValue = currentHistory.pop();

            setFormData((fd) => ({
                ...fd,
                aim: fd.aim.map((item, i) =>
                    i === index ? { ...item, text: lastValue } : item
                )
            }));

            return {
                ...prev,
                aim: {
                    ...prev.aim,
                    [index]: currentHistory
                }
            };
        });
    };

    const handleAimChange = (index, value) => {
        setFormData((prev) => ({
            ...prev,
            aim: prev.aim.map((item, i) =>
                i === index ? { ...item, text: value } : item
            )
        }));
    };

    const handleAimBulletChange = (itemIndex, bulletId, value) => {
        setFormData((prev) => ({
            ...prev,
            aim: prev.aim.map((item, i) => {
                if (i !== itemIndex || item?.type !== "bullet") return item;

                const updatedBullets = (item.bullets || []).map((bullet) =>
                    bullet.id === bulletId ? { ...bullet, text: value } : bullet
                );

                return {
                    ...item,
                    bullets: updatedBullets
                };
            })
        }));
    };

    const handleAddAim = () => {
        setFormData((prev) => {
            const currentAims =
                Array.isArray(prev.aim) && prev.aim.length > 0
                    ? prev.aim
                    : [{ type: "text", text: "" }];

            const lastType = currentAims[currentAims.length - 1]?.type || "text";
            const nextType = lastType === "text" ? "bullet" : "text";

            return {
                ...prev,
                aim: [
                    ...currentAims,
                    nextType === "bullet"
                        ? { type: "bullet", bullets: [createAimBulletRow()], text: "" }
                        : { type: "text", text: "" }
                ]
            };
        });
    };

    const handleRemoveAim = (indexToRemove) => {
        setFormData((prev) => {
            const currentAims = Array.isArray(prev.aim) ? prev.aim : [];
            const updatedAims = currentAims.filter((_, index) => index !== indexToRemove);

            return {
                ...prev,
                aim: updatedAims.length > 0 ? updatedAims : [{ type: "text", text: "" }]
            };
        });
    };

    const handleRemoveAimSection = (textIndex) => {
        setFormData((prev) => {
            const currentAims = Array.isArray(prev.aim) ? prev.aim : [];

            const textIndexes = currentAims
                .map((item, index) => (item?.type === "text" ? index : null))
                .filter((index) => index !== null);

            if (textIndexes.length <= 1) {
                return prev;
            }

            const updatedAims = currentAims.filter((_, index) => {
                return index !== textIndex && index !== textIndex + 1;
            });

            return {
                ...prev,
                aim: updatedAims.length > 0 ? updatedAims : [{ type: "text", text: "" }]
            };
        });
    };

    const handleAddAimBullet = (itemIndex, insertAtIndex = null) => {
        setFormData((prev) => ({
            ...prev,
            aim: prev.aim.map((item, i) => {
                if (i !== itemIndex || item?.type !== "bullet") return item;

                const currentBullets = Array.isArray(item.bullets) ? item.bullets : [];
                const newBullet = createAimBulletRow();

                if (
                    insertAtIndex === null ||
                    insertAtIndex < 0 ||
                    insertAtIndex > currentBullets.length
                ) {
                    return {
                        ...item,
                        bullets: [...currentBullets, newBullet]
                    };
                }

                return {
                    ...item,
                    bullets: [
                        ...currentBullets.slice(0, insertAtIndex + 1),
                        newBullet,
                        ...currentBullets.slice(insertAtIndex + 1)
                    ]
                };
            })
        }));
    };

    const handleRemoveAimBullet = (itemIndex, bulletId) => {
        setFormData((prev) => ({
            ...prev,
            aim: prev.aim.map((item, i) => {
                if (i !== itemIndex || item?.type !== "bullet") return item;

                const updatedBullets = (item.bullets || []).filter(
                    (bullet) => bullet.id !== bulletId
                );

                return {
                    ...item,
                    bullets: updatedBullets
                };
            })
        }));
    };

    const AiRewriteAim = async (index) => {
        try {
            const currentAim = formData.aim?.[index];
            const prompt = currentAim?.text || "";

            if (!prompt.trim()) {
                toast.warn("Please enter some aim text before using AI rewrite.", {
                    closeButton: true,
                    autoClose: 1000,
                    style: { textAlign: "center" }
                });
                return;
            }

            pushAimRewriteHistory(index, prompt);
            setLoadingAimIndex(index);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatAim/procedure`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();
            const newText = data?.response || "";

            setFormData((fd) => ({
                ...fd,
                aim: fd.aim.map((item, i) =>
                    i === index ? { ...item, text: newText } : item
                )
            }));
        } catch (error) {
            console.error("Error rewriting aim:", error);
            toast.error("AI rewrite failed.", {
                closeButton: true,
                autoClose: 1200,
                style: { textAlign: "center" }
            });
        } finally {
            setLoadingAimIndex(null);
        }
    };

    const createScopeBulletRow = () => ({
        id: uuidv4(),
        text: ""
    });

    const normalizeProcedureScope = (value) => {
        if (Array.isArray(value) && value.length > 0) {
            return value.map((item) => {
                const type = item?.type === "bullet" ? "bullet" : "text";

                if (type === "text") {
                    return {
                        type: "text",
                        text: item?.text || ""
                    };
                }

                const bullets = Array.isArray(item?.bullets)
                    ? item.bullets.map((b) => ({
                        id: b?.id || uuidv4(),
                        text: b?.text || ""
                    }))
                    : String(item?.text || "")
                        .split(/\r?\n/)
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => ({
                            id: uuidv4(),
                            text: line
                        }));

                return {
                    type: "bullet",
                    bullets: bullets.length > 0 ? bullets : [createScopeBulletRow()],
                    text: bullets.map((b) => b.text).join("\n")
                };
            });
        }

        if (typeof value === "string" && value.trim() !== "") {
            return [{ type: "text", text: value }];
        }

        return [{ type: "text", text: "" }];
    };

    const sanitizeScopeForValidation = (items = []) => {
        if (!Array.isArray(items)) return [];

        return items
            .map((item) => {
                const type = item?.type === "bullet" ? "bullet" : "text";

                if (type === "text") {
                    return {
                        ...item,
                        type: "text",
                        text: typeof item?.text === "string" ? item.text.trim() : ""
                    };
                }

                const cleanedBullets = (Array.isArray(item?.bullets) ? item.bullets : [])
                    .map((b) => ({
                        id: b?.id || uuidv4(),
                        text: typeof b?.text === "string" ? b.text.trim() : ""
                    }))
                    .filter((b) => b.text !== "");

                return {
                    ...item,
                    type: "bullet",
                    bullets: cleanedBullets,
                    text: cleanedBullets.map((b) => b.text).join("\n")
                };
            })
            .filter((item) => item.text.trim() !== "");
    };

    const sanitizeScopeForStorage = (items = []) => {
        if (!Array.isArray(items)) return [];

        return items
            .map((item) => {
                const type = item?.type === "bullet" ? "bullet" : "text";

                if (type === "text") {
                    return {
                        ...item,
                        type: "text",
                        text: typeof item?.text === "string" ? item.text.trim() : ""
                    };
                }

                const cleanedBullets = (Array.isArray(item?.bullets) ? item.bullets : [])
                    .map((b) => ({
                        id: b?.id || uuidv4(),
                        text: typeof b?.text === "string" ? b.text.trim() : ""
                    }))
                    .filter((b) => b.text !== "");

                return {
                    ...item,
                    type: "bullet",
                    bullets: cleanedBullets,
                    text: cleanedBullets.map((b) => b.text).join("\n")
                };
            })
            .filter((item) => item.text.trim() !== "");
    };

    const pushScopeRewriteHistory = (index, oldValue) => {
        setRewriteHistory((prev) => ({
            ...prev,
            scope: {
                ...prev.scope,
                [index]: [...(prev.scope[index] || []), oldValue]
            }
        }));
    };

    const undoScopeRewrite = (index) => {
        setRewriteHistory((prev) => {
            const currentHistory = [...(prev.scope[index] || [])];
            if (currentHistory.length === 0) return prev;

            const lastValue = currentHistory.pop();

            setFormData((fd) => ({
                ...fd,
                scope: fd.scope.map((item, i) =>
                    i === index ? { ...item, text: lastValue } : item
                )
            }));

            return {
                ...prev,
                scope: {
                    ...prev.scope,
                    [index]: currentHistory
                }
            };
        });
    };

    const handleScopeChange = (index, value) => {
        setFormData((prev) => ({
            ...prev,
            scope: prev.scope.map((item, i) =>
                i === index ? { ...item, text: value } : item
            )
        }));
    };

    const handleScopeBulletChange = (itemIndex, bulletId, value) => {
        setFormData((prev) => ({
            ...prev,
            scope: prev.scope.map((item, i) => {
                if (i !== itemIndex || item?.type !== "bullet") return item;

                const updatedBullets = (item.bullets || []).map((bullet) =>
                    bullet.id === bulletId ? { ...bullet, text: value } : bullet
                );

                return {
                    ...item,
                    bullets: updatedBullets
                };
            })
        }));
    };

    const handleAddScope = () => {
        setFormData((prev) => {
            const currentScopes =
                Array.isArray(prev.scope) && prev.scope.length > 0
                    ? prev.scope
                    : [{ type: "text", text: "" }];

            const lastType = currentScopes[currentScopes.length - 1]?.type || "text";
            const nextType = lastType === "text" ? "bullet" : "text";

            return {
                ...prev,
                scope: [
                    ...currentScopes,
                    nextType === "bullet"
                        ? { type: "bullet", bullets: [createScopeBulletRow()], text: "" }
                        : { type: "text", text: "" }
                ]
            };
        });
    };

    const handleRemoveScope = (indexToRemove) => {
        setFormData((prev) => {
            const currentScopes = Array.isArray(prev.scope) ? prev.scope : [];
            const updatedScopes = currentScopes.filter((_, index) => index !== indexToRemove);

            return {
                ...prev,
                scope: updatedScopes.length > 0 ? updatedScopes : [{ type: "text", text: "" }]
            };
        });
    };

    const handleRemoveScopeSection = (textIndex) => {
        setFormData((prev) => {
            const currentScopes = Array.isArray(prev.scope) ? prev.scope : [];

            const textIndexes = currentScopes
                .map((item, index) => (item?.type === "text" ? index : null))
                .filter((index) => index !== null);

            if (textIndexes.length <= 1) {
                return prev;
            }

            const updatedScopes = currentScopes.filter((_, index) => {
                return index !== textIndex && index !== textIndex + 1;
            });

            return {
                ...prev,
                scope: updatedScopes.length > 0 ? updatedScopes : [{ type: "text", text: "" }]
            };
        });
    };

    const handleAddScopeBullet = (itemIndex, insertAtIndex = null) => {
        setFormData((prev) => ({
            ...prev,
            scope: prev.scope.map((item, i) => {
                if (i !== itemIndex || item?.type !== "bullet") return item;

                const currentBullets = Array.isArray(item.bullets) ? item.bullets : [];
                const newBullet = createScopeBulletRow();

                if (
                    insertAtIndex === null ||
                    insertAtIndex < 0 ||
                    insertAtIndex > currentBullets.length
                ) {
                    return {
                        ...item,
                        bullets: [...currentBullets, newBullet]
                    };
                }

                return {
                    ...item,
                    bullets: [
                        ...currentBullets.slice(0, insertAtIndex + 1),
                        newBullet,
                        ...currentBullets.slice(insertAtIndex + 1)
                    ]
                };
            })
        }));
    };

    const handleRemoveScopeBullet = (itemIndex, bulletId) => {
        setFormData((prev) => ({
            ...prev,
            scope: prev.scope.map((item, i) => {
                if (i !== itemIndex || item?.type !== "bullet") return item;

                const updatedBullets = (item.bullets || []).filter(
                    (bullet) => bullet.id !== bulletId
                );

                return {
                    ...item,
                    bullets: updatedBullets
                };
            })
        }));
    };

    const AiRewriteScope = async (index) => {
        try {
            const currentScope = formData.scope?.[index];
            const prompt = currentScope?.text || "";

            if (!prompt.trim()) {
                toast.warn("Please enter some scope text before using AI rewrite.", {
                    closeButton: true,
                    autoClose: 1000,
                    style: { textAlign: "center" }
                });
                return;
            }

            pushScopeRewriteHistory(index, prompt);
            setLoadingScope(index);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatScope/procedure`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();
            const newText = data?.response || "";

            setFormData((fd) => ({
                ...fd,
                scope: fd.scope.map((item, i) =>
                    i === index ? { ...item, text: newText } : item
                )
            }));
        } catch (error) {
            console.error("Error rewriting scope:", error);
            toast.error("AI rewrite failed.", {
                closeButton: true,
                autoClose: 1200,
                style: { textAlign: "center" }
            });
        } finally {
            setLoadingScope(null);
        }
    };

    const formatRejectDate = (dateValue) => {
        if (!dateValue) return "N/A";
        const parsed = new Date(dateValue);
        if (isNaN(parsed.getTime())) return "N/A";

        const datePart = parsed.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
        const timePart = parsed.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        return `${datePart}`;
    };

    const resolveRejectedDraft = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/resolveRejected/${fileID}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
            });

            if (!response.ok) throw new Error("Failed to update draft");

            setShowRejectReasonView(false);
            setIsRejected(false);
            setReadOnly(false);
        } catch (error) {
            console.error("Error resolving rejected draft:", error);
            toast.error("Failed to update draft", {
                closeButton: true,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            });
        }
    };

    const handleReviewRejectedDraft = () => resolveRejectedDraft();

    return (
        <div className="file-create-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Review Document</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="main-box-create">
                <div className="top-section-create-page">
                    <div className="icons-container-risk-create-page">
                        <div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faArrowLeft} onClick={() => navigate(-1)} title="Back" />
                        </div>

                        {!readOnly && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faFloppyDisk} title="Save" onClick={handleSave} />
                        </div>)}

                        {(
                            <div className="burger-menu-icon-risk-create-page-1">
                                <FontAwesomeIcon icon={faCopy} onClick={openSaveAs} title="Create Copy" />
                            </div>
                        )}

                        {!readOnly && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faRotateLeft} onClick={undoLastChange} title="Undo" />
                        </div>)}

                        {!readOnly && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faRotateRight} onClick={redoChange} title="Redo" />
                        </div>)}

                        {!readOnly && !inReview && !inApproval && canIn(access, "DDS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faUpload} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleClick} title="Publish" />
                        </div>)}

                        {(inApproval || inReview) && !readOnly && canIn(access, "DDS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon style={{ color: "#7EAC89" }} icon={faCheckCircle} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleApproveClick} title="Approve Draft" />
                        </div>)}

                        {(inApproval || inReview) && !readOnly && canIn(access, "DDS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon style={{ color: "#CB6F6F" }} icon={faTimesCircle} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleRejectClick} title="Reject Document" />
                        </div>)}

                        {false && canRemove && (inApproval || inReview) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faBan} onClick={openRemoveApproval} title="Remove From Approval Process" style={{ color: "#CB6F6F" }} />
                        </div>)}
                    </div>
                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBarDD refreshable={false} canIn={canIn} access={access} menu={"1"} create={true} />
                </div>

                {isRejected && (<div className="input-row">
                    <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#CB6F6F", color: "white", fontWeight: "bold" }}>
                        This document is in Read Only Mode as it has been rejected and requires document owner intervention.
                    </div>
                </div>)}

                {(!readOnly && (inApproval || inReview)) && (<div className="input-row">
                    <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#7EAC89", color: "white", fontWeight: "bold" }}>
                        To approve this document, click on the green circle above.
                    </div>
                </div>)}

                <div className={`scrollable-box`}>
                    {(readOnly && (inReview || inApproval) && !isRejected) && (<div className="input-row">
                        <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#FFFF89", color: "black", fontWeight: "bold" }}>
                            This document is currently in the approval process
                        </div>
                    </div>)}

                    <div className="input-row">
                        <div className={`review-page-input-box-title ${errors.title ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Document Title <span className="required-field">*</span></h3>
                            <div className="input-group-review-page">
                                <input
                                    name="title"
                                    className="font-fam title-input-review-page"
                                    value={formData.title + " " + formData.documentType}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    <DocumentSignaturesTable readOnly={readOnly} rows={formData.rows} handleRowChange={handleRowChange} addRow={addRow} removeRow={removeRow} error={errors.signs} updateRows={updateSignatureRows} setErrors={setErrors} />

                    <AimBulletComponent
                        readOnly={readOnly}
                        aims={formData.aim}
                        errors={errors.aim || []}
                        loadingIndex={loadingAimIndex}
                        rewriteHistory={rewriteHistory}
                        onChange={handleAimChange}
                        onBulletChange={handleAimBulletChange}
                        onFocus={(index) =>
                            setErrors((prev) => {
                                const nextAimErrors = Array.isArray(prev.aim)
                                    ? [...prev.aim]
                                    : [];

                                nextAimErrors[index] = false;

                                return {
                                    ...prev,
                                    aim: nextAimErrors,
                                };
                            })
                        }
                        onHelp={() => { }}
                        onAiRewrite={AiRewriteAim}
                        onUndo={undoAimRewrite}
                        onAddAim={handleAddAim}
                        onRemoveAim={handleRemoveAim}
                        onRemoveAimSection={handleRemoveAimSection}
                        onAddBullet={handleAddAimBullet}
                        onRemoveBullet={handleRemoveAimBullet}
                        collapsible={true}
                    />

                    <ScopeBulletComponent
                        readOnly={readOnly}
                        scopes={formData.scope}
                        errors={errors.scope || []}
                        loadingIndex={loadingScope}
                        rewriteHistory={rewriteHistory}
                        onChange={handleScopeChange}
                        onBulletChange={handleScopeBulletChange}
                        onFocus={(index) =>
                            setErrors((prev) => {
                                const nextScopeErrors = Array.isArray(prev.scope)
                                    ? [...prev.scope]
                                    : [];

                                nextScopeErrors[index] = false;

                                return {
                                    ...prev,
                                    scope: nextScopeErrors,
                                };
                            })
                        }
                        onHelp={() => { }}
                        onAiRewrite={AiRewriteScope}
                        onUndo={undoScopeRewrite}
                        onAddScope={handleAddScope}
                        onRemoveScope={handleRemoveScope}
                        onRemoveScopeSection={handleRemoveScopeSection}
                        onAddBullet={handleAddScopeBullet}
                        onRemoveBullet={handleRemoveScopeBullet}
                        collapsible={true}
                    />

                    <PPETable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedPPEOptions={usedPPEOptions} setUsedPPEOptions={setUsedPPEOptions} userID={userID} />
                    <HandToolTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedHandTools={usedHandTools} setUsedHandTools={setUsedHandTools} userID={userID} />
                    <EquipmentTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedEquipment={usedEquipment} setUsedEquipment={setUsedEquipment} userID={userID} />
                    <MobileMachineTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedMobileMachine={usedMobileMachine} setUsedMobileMachine={setUsedMobileMachines} userID={userID} />
                    <MaterialsTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedMaterials={usedMaterials} setUsedMaterials={setUsedMaterials} userID={userID} />
                    <AbbreviationTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} error={errors.abbrs} userID={userID} setErrors={setErrors} />
                    <TermTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} error={errors.terms} userID={userID} setErrors={setErrors} />
                    <HazardsControlsTable
                        collapsible={true}
                        defaultCollapsed={true}
                        hazardControlRows={formData.hazardsControls || []}
                        addHazardControlRow={addHazardControlRow}
                        removeHazardControlRow={removeHazardControlRow}
                        updateHazardControlRow={updateHazardControlRow}
                        updateHazardControlRows={updateHazardControlRows}
                        readOnly={readOnly}
                        required={false}
                    />
                    <ProcedureTable collapsible={true} readOnly={readOnly} ref={procedureTableRef} procedureRows={formData.procedureRows} addRow={addProRow} removeRow={removeProRow} updateRow={updateRow} error={errors.procedureRows} title={formData.title} documentType={formData.documentType} updateProcRows={updateProcedureRows} setErrors={setErrors} />
                    <ChapterTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} />
                    <ReferenceTable collapsible={true} readOnly={readOnly} referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} setErrors={setErrors} error={errors.reference} required={true} />
                    <SupportingDocumentTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} />

                    <div className={`input-row`} style={{ marginTop: "10px" }}>
                        <div className={`input-box-3-review ${errors.reviewDate ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Review Period (Months) <span className="required-field">*</span></h3>
                            <input
                                type="number"
                                name="reviewDate"
                                readOnly={readOnly}
                                className="aim-textarea cent-create font-fam"
                                value={formData.reviewDate}
                                onChange={handleInputChange}
                                placeholder="Insert the review period in months" // Optional placeholder text
                            />
                        </div>
                    </div>

                    <PicturesTable collapsible={true} readOnly={readOnly} picturesRows={formData.pictures} addPicRow={addPicRow} updatePicRow={updatePicRow} removePicRow={removePicRow} />

                    <div className="input-row">
                        <div className={`input-box-aim-cp ${errors.change ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Document Change Reason <span className="required-field">*</span></h3>
                            <textarea
                                spellcheck="true"
                                name="aim"
                                readOnly={readOnly}
                                className="aim-textarea font-fam"
                                value={change}
                                onChange={(e) => setChange(e.target.value)}
                                rows="4"   // Adjust the number of rows for initial height
                                placeholder="Insert the reason for the document update..." // Optional placeholder text
                            />
                        </div>
                    </div>

                    <div className="input-row-buttons">
                        {/* Generate File Button */}
                        <button
                            className="generate-button font-fam"
                            onClick={handleGenerateDocument}
                            title={validateForm() ? "" : "Fill in all fields marked by a * before generating the file"}
                        >
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Generate Document'}
                        </button>
                        {false && (
                            <button
                                className="pdf-button font-fam"
                                disabled
                            >
                                Generate PDF
                            </button>
                        )}
                    </div>
                    {isSaveAsModalOpen && (<SaveAsPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.title} type={type} userID={userID} create={true} />)}
                    {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}
                </div>
            </div>
            <ToastContainer />
            {approval && (<ApproversPopup closeModal={closeApproval} handleSubmit={handlePublishApprovalFlow} />)}
            {approveState && (<ApproveApprovalProcessPopup approveDraft={approveDraft} closeModal={closeApprovePopup} loading={loading} />)}
            {isSaving && (
                <SavingInProgress />
            )}
            {rejectState && (<RejectReason isOpen={rejectState} onClose={closeRejectPopup} onSubmit={rejectDraft} loading={rejecting} />)}
            {removeApprovalState && (
                <RemoveFromApprovalPopup
                    closeModal={closeRemoveApproval}
                    removeApproval={removeFromApprovalProcess}
                    docType="procedure"
                    title={formData.title}
                    loading={removingApproval}
                />
            )}
            {isPublishing && (
                <PublishingInProgress />
            )}
        </div>
    );
};

export default ReviewPage;