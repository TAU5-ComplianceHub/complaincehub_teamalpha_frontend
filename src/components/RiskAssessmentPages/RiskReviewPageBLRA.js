import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4, validate } from 'uuid';
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import "./RiskManagementPage.css";
import TermTableRisk from "../RiskRelated/RiskComponents/TermTableRisk";
import AbbreviationTableRisk from "../RiskRelated/RiskComponents/AbbreviationTableRisk"
import ReferenceTable from "../CreatePage/ReferenceTable";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faShareNodes, faUpload, faRotateRight, faChevronLeft, faChevronRight, faInfoCircle, faMagicWandSparkles, faSave, faPen, faArrowLeft, faArrowUp, faCaretRight, faCaretLeft, faCalendarDays, faCheckCircle, faBan, faTimesCircle, faCopy } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons"
import TopBarDD from "../Notifications/TopBarDD";
import AttendanceTable from "../RiskRelated/AttendanceTable";
import DocumentSignaturesRiskTable from "../RiskRelated/DocumentSignaturesRiskTable";
import SupportingDocumentTable from "../RiskRelated/SupportingDocumentTable";
import ControlAnalysisTable from "../RiskRelated/ControlAnalysisTable";
import LoadRiskDraftPopup from "../RiskRelated/LoadRiskDraftPopup";
import SharePageRisk from "../RiskRelated/SharePageRisk";
import RiskAim from "../RiskRelated/RiskInfo/RiskAim";
import RiskScope from "../RiskRelated/RiskInfo/RiskScope";
import ExecutiveSummary from "../RiskRelated/ExecutiveSummary";
import PicturesTable from "../CreatePage/PicturesTable";
import SaveAsPopup from "../Popups/SaveAsPopup";
import SavePopup from "../Popups/SavePopup";
import BLRATable from "../RiskRelated/BLRAComponents/BLRATable";
import GenerateDraftPopup from "../Popups/GenerateDraftPopup";
import DraftPopup from "../Popups/DraftPopup";
import { getCurrentUser, can, canIn, isAdmin } from "../../utils/auth";
import DatePicker from "react-multi-date-picker";
import RelevantControlsTable from "../RiskRelated/RelevantControlsTable";
import ControlPopupNote from "../Popups/ControlPopupNote";
import UnusedControlsPopup from "../RiskRelated/UnusedControlsPopup";
import ApproversPopup from "../VisitorsInduction/InductionCreation/ApproversPopup"
import ApproveApprovalProcessPopup from "../Popups/ApproveApprovalProcessPopup";
import RiskAimComponent from "../RiskRelated/RiskAimComponent";
import RiskScopeIE from "../RiskRelated/RiskScopeIE";
import SavingInProgress from "../DocumentCreationPages/SavingInProgress";
import PublishingInProgress from "../DocumentCreationPages/PublishingInProgress";
import RemoveFromApprovalPopup from "../Popups/RemoveFromApprovalPopup";
import RejectReason from "../Popups/RejectReason";
import RejectReasonView from "../Popups/RejectReasonView";

const RiskReviewPageBLRA = () => {
    const navigate = useNavigate();
    const riskType = useParams().type;
    const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [usedTermCodes, setUsedTermCodes] = useState([]);
    const access = getCurrentUser();
    const [loadedID, setLoadedID] = useState('');
    const [isLoadPopupOpen, setLoadPopupOpen] = useState(false);
    const [titleSet, setTitleSet] = useState(false);
    const [userID, setUserID] = useState('');
    const [userIDs, setUserIDs] = useState([]);
    const autoSaveInterval = useRef(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const loadedIDRef = useRef('');
    const [offlineDraft, setOfflineDraft] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [helpRA, setHelpRA] = useState(false);
    const [helpScope, setHelpScope] = useState(false);
    const [loadingAim, setLoadingAim] = useState(false);
    const [loadingScope, setLoadingScope] = useState(false);
    const [loadingScopeI, setLoadingScopeI] = useState(false);
    const [loadingScopeE, setLoadingScopeE] = useState(false);
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
    const [controls, setControls] = useState([]);
    const [generatePopup, setGeneratePopup] = useState(false);
    const [unusedPopup, setUnusedPopup] = useState(false);
    const [azureFN, setAzureFN] = useState("");
    const fileID = useParams().fileId;
    const [change, setChange] = useState("");
    const [draftNote, setDraftNote] = useState(null);
    const [readOnly, setReadOnly] = useState(false);
    const [allSystemControls, setAllSystemControls] = useState([]);
    const [approval, setApproval] = useState(false);
    const [inApproval, setInApproval] = useState(false);
    const [unusedRelevantControlsHighlight, setUnusedRelevantControlsHighlight] = useState([]);
    const [inReview, setInReview] = useState(false);
    const [approveState, setApproveState] = useState(false);
    const relevantControlsRef = useRef(null);
    const [loadingAimIndex, setLoadingAimIndex] = useState(null);
    const [loadingScopeIRewriteIndex, setLoadingScopeIRewriteIndex] = useState(null);
    const [loadingScopeERewriteIndex, setLoadingScopeERewriteIndex] = useState(null);
    const [isSaving, setIsSaving] = useState(false); // spinner state for the top "Save" icon
    const [isPublishing, setIsPublishing] = useState(false); // spinner state for the top "Publish" icon
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

    const openSaveAs = () => {
        if (!titleSet) {
            toast.warn("Please fill in at least the title field before saving.", {
                closeButton: false,
                autoClose: 1500, // 1.5 seconds
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

    const openHelpRA = () => {
        setHelpRA(true);
    };

    const closeHelpRA = () => {
        setHelpRA(false);
    };

    const openHelpScope = () => {
        setHelpScope(true);
    };

    const closeHelpScope = () => {
        setHelpScope(false);
    };

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
            usedAbbrCodes: usedAbbrCodesRef.current,
            usedTermCodes: usedTermCodesRef.current,
            formData: formDataRef.current,
            userIDs: userIDsRef.current,
            creator: userIDRef.current,
            updater: null,
            dateUpdated: null
        };

        try {
            const body = buildReviewFormDataRequest(dataToStore, { skipFileUpload });

            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/blra/safe`, {
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
            usedAbbrCodes: usedAbbrCodesRef.current,
            usedTermCodes: usedTermCodesRef.current,
            formData: formDataRef.current
        };

        try {
            const body = buildReviewFormDataRequest(dataToStore, { skipFileUpload });

            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/blra/save/${fileID}`, {
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

    const handleClick = () => {
        if (formData.title === "") {
            toast.error("Please fill in the title field", {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            handleGenerateARegister();
        }
    };

    const handleClick2 = () => {
        if (formData.title === "") {
            toast.error("Please fill in the title field", {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            handleGenerateIBRA();  // Call your function when the form is valid
        }
    };

    const handleClick3 = async () => {
        try {
            if (hasUnusedControls()) {
                setUnusedPopup(true);
            }

            setIsPublishing(true);
            try {
                await handlePublishApprovalFlow();
            } finally {
                setIsPublishing(false);
            }
        } catch (err) {
            toast.error("Could not save draft, generation aborted." + err);
        }
    };

    const handleClick4 = async () => {
        try {
            if (hasUnusedControls()) {
                setUnusedPopup(true);
                return;
            }

            await handleGenerateDocument();
        } catch (err) {
            toast.error("Could not save draft, generation aborted." + err);
        }
    };

    const closeUnused = () => {
        setUnusedPopup(false);
    }

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
            changeTable: [...lastCT, newChange],
            aim: sanitizeAimForStorage(formData.aim),
            scopeInclusions: sanitizeStructuredScopeField(formData.scopeInclusions),
            scopeExclusions: sanitizeStructuredScopeField(formData.scopeExclusions),
            execSummary: sanitizeExecSummaryForValidation(formData.execSummary)
        };

        await handleGenerateBLRADocument(updatedFormData);
    };

    const handleGenerateBLRADocument = async (generateData) => {
        const dataToStore = {
            formData: generateData,
        };

        const documentName = (formData.title) + ' ' + formData.documentType;
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-blra`, {
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

    const AiRewriteScope = async () => {
        try {
            const prompt = formData.scope;

            pushAiRewriteHistory('scope');
            setLoadingScope(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatScope/ibra`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ prompt }),
            });

            const { response: newText } = await response.json();
            setLoadingScope(false);
            setFormData(fd => ({ ...fd, scope: newText }));
        } catch (error) {
            setLoadingScope(false);
            console.error('Error saving data:', error);
        }
    }

    useEffect(() => {
        if (fileID) {
            loadData(fileID);
        }
    }, [fileID]);

    const getNewAzureFileName = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/fileGenDocs/blra/getFile/${fileID}`,
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

    function normalizeIbraFormData(formData = {}) {
        if (!Array.isArray(formData.ibra)) return formData;

        const normalizedAim = Array.isArray(formData.aim)
            ? formData.aim.map(item => {
                const type = item?.type === "bullet" ? "bullet" : "text";

                if (type === "text") {
                    return {
                        type: "text",
                        text: item?.text || ""
                    };
                }

                const bullets = Array.isArray(item?.bullets)
                    ? item.bullets.map(b => ({
                        id: b?.id || uuidv4(),
                        text: b?.text || ""
                    }))
                    : String(item?.text || "")
                        .split(/\r?\n/)
                        .map(line => line.trim())
                        .filter(Boolean)
                        .map(line => ({
                            id: uuidv4(),
                            text: line
                        }));

                return {
                    type: "bullet",
                    bullets: bullets.length > 0 ? bullets : [{ id: uuidv4(), text: "" }],
                    text: bullets.map(b => b.text).join("\n")
                };
            })
            : typeof formData.aim === "string"
                ? [{ type: "text", text: formData.aim }]
                : [{ type: "text", text: "" }];

        const normalizedScopeInclusions = normalizeStructuredScopeField(formData.scopeInclusions);
        const normalizedScopeExclusions = normalizeStructuredScopeField(formData.scopeExclusions);

        // 1. Existing Normalization Logic (Keep this)
        const normalized = {
            ...formData,
            aim: normalizedAim,
            scopeInclusions: normalizedScopeInclusions,
            scopeExclusions: normalizedScopeExclusions,
            ibra: formData.ibra.map(row => {
                // ... existing row mapping logic ...
                const possible = Array.isArray(row.possible) ? row.possible : [];
                return {
                    ...row,
                    mainFlag: row.mainFlag ?? false,
                    subFlag: row.subFlag ?? false,
                    ownerFlag: row.ownerFlag ?? false,
                    oddsFlag: row.oddsFlag ?? false,
                    riskRankFlag: row.riskRankFlag ?? false,
                    hazardFlag: row.hazardFlag ?? false,
                    controlFlag: row.controlFlag ?? false,
                    ueFlag: row.ueFlag ?? false,
                    additionalFlag: row.additionalFlag ?? false,
                    maxConsequenceFlag: row.maxConsequenceFlag ?? false,
                    sourceFlag: row.sourceFlag ?? false,
                    materialFlag: row.materialFlag ?? false,
                    priorityFlag: row.priorityFlag ?? false,
                    possible: possible.map(block => {
                        // ... (keep existing possible logic)
                        const possibleId = block?.id ?? uuidv4();
                        const count = block?.actions?.length;

                        const actions = Array.from({ length: count }, (_, i) => {
                            const a = block?.actions?.[i];
                            return {
                                id: a?.id ?? uuidv4(),
                                action: a?.action ?? ''
                            };
                        });

                        const responsible = Array.from({ length: count }, (_, i) => {
                            const r = block?.responsible?.[i];
                            return {
                                id: r?.id ?? uuidv4(),
                                person: r?.person ?? ''
                            };
                        });

                        // Normalize dueDate to match actions count, each with id
                        const dueDate = Array.from({ length: count }, (_, i) => {
                            const d = block?.dueDate?.[i];
                            return {
                                id: d?.id ?? uuidv4(),
                                date: d?.date ?? ''
                            };
                        });

                        return { ...block, id: possibleId, actions, responsible, dueDate };
                    })
                };
            })
        };

        // ——— Normalize CEA: just add missing plain fields ———
        if (Array.isArray(normalized.cea)) {
            normalized.cea = normalized.cea.map(block => ({
                ...block,
                uniqueId: block.uniqueId ?? null,
                action: block.action !== undefined ? block.action : '',
                responsible: block.responsible !== undefined ? block.responsible : '',
                dueDate: block.dueDate !== undefined ? block.dueDate : ''
            }));
        }

        // ============================================================
        // 2. NEW: SAFETY MIGRATION FOR OLD DRAFTS
        // ============================================================

        // Check if relevantControls exists. If not, generate it from the CEA/IBRA data.
        if (!normalized.relevantControls || normalized.relevantControls.length === 0) {

            // Step A: Collect unique control names from IBRA
            const ibraControls = new Set();
            normalized.ibra.forEach(row => {
                if (Array.isArray(row.controls)) {
                    row.controls.forEach(c => {
                        const name = typeof c === 'string' ? c : c.control;
                        if (name && name.trim()) ibraControls.add(name.trim());
                    });
                }
            });

            // Step B: Collect unique control names from CEA (often more accurate/detailed)
            const ceaControls = new Set();
            if (Array.isArray(normalized.cea)) {
                normalized.cea.forEach(row => {
                    if (row.control && row.control.trim()) ceaControls.add(row.control.trim());
                });
            }

            // Step C: Combine them
            const allControls = Array.from(new Set([...ibraControls, ...ceaControls]));

            // Step D: Create the relevantControls array
            normalized.relevantControls = allControls.map(name => {
                const ceaRow = normalized.cea?.find(c => c.control === name);
                const systemRow = allSystemControls?.find(
                    c => (c?.control || "").trim().toLowerCase() === name.trim().toLowerCase()
                );

                return {
                    id: uuidv4(),
                    control: name,
                    description: ceaRow ? ceaRow.description : "",
                    category: ceaRow?.category || systemRow?.category
                };
            });

            console.log(`[Migration] Auto-generated ${normalized.relevantControls.length} relevant controls for old draft.`);
        }

        normalized.execSummaryGen = normalized.execSummaryGen ?? "";
        normalized.execSummary = normalizeStructuredScopeField(normalized.execSummary);

        return normalized;
    }

    const loadData = async (fileID) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/fileGenDocs/blra/getFile/${fileID}`,
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

            setUsedAbbrCodes(storedData.usedAbbrCodes || []);
            setUsedTermCodes(storedData.usedTermCodes || []);

            const raw = storedData.formData || {};
            const patched = normalizeIbraFormData(raw);
            setFormData(patched);

            setInApproval(Boolean(data.statusApproval));
            setInReview(Boolean(data.statusReview));

            setReadOnly(Boolean(data.readOnly) || isRejectedFromServer);
            setIsRejected(isRejectedFromServer);
            setFormData(prev => ({ ...prev }));
            setTitleSet(true);
            setAzureFN(storedData.azureFileName || "");
            setCanRemove(canRemove);
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
            console.error("Error loading data:", error);
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

    const updateIbraRows = (idToUpdate, newValues) => {
        setFormData(prev => ({
            ...prev,
            ibra: prev.ibra.map(item =>
                item.id === idToUpdate
                    ? { ...item, ...newValues }
                    : item
            )
        }));
    };

    const updateCEARows = (idToUpdate, newValues) => {
        setFormData(prev => {
            const oldRow = prev.cea.find(item => item.id === idToUpdate);
            if (!oldRow) return prev;

            const updatedCEA = prev.cea.map(item =>
                item.id === idToUpdate
                    ? { ...item, ...newValues }
                    : item
            );

            const oldControlName = oldRow.control;
            const newControlName = newValues.control ?? oldControlName;
            const nextCategory = (newValues.category ?? oldRow.category ?? "").toString().trim();

            const updatedRelevantControls = prev.relevantControls.map(item => {
                if (norm(item.control) !== norm(oldControlName)) return item;

                return {
                    ...item,
                    control: newControlName,
                    category: nextCategory
                };
            });

            return {
                ...prev,
                cea: updatedCEA,
                relevantControls: updatedRelevantControls
            };
        });
    };

    const addIBRARow = () => {
        setFormData(prevFormData => ({
            ...prevFormData,
            ibra: [
                ...prevFormData.ibra,
                {
                    id: uuidv4(),
                    nr: prevFormData.ibra.length + 1,
                    main: "", sub: "", owner: "", odds: "", riskRank: "",
                    hazards: [], controls: [], S: "-", H: "-", E: "-", C: "-", LR: "-", M: "-",
                    R: "-", source: "", material: "", priority: "",
                    mainFlag: false, subFlag: false, ownerFlag: false, oddsFlag: false, riskRankFlag: false, hazardFlag: false, controlFlag: false, ueFlag: false, additionalFlag: false, maxConsequenceFlag: false, sourceFlag: false, materialFlag: false, priorityFlag: false,
                    possible: [{ id: uuidv4(), actions: [{ id: uuidv4(), action: "" }], responsible: [{ id: uuidv4(), person: "" }], dueDate: [{ id: uuidv4(), date: "" }] }],
                    UE: "", additional: "", maxConsequence: ""
                }
            ]
        }));
    };

    const addCEARow = () => {
        setFormData(prevFormData => ({
            ...prevFormData,
            cea: [
                ...prevFormData.cea,
                {
                    id: uuidv4(), nr: prevFormData.cea.length + 1, control: "", critical: "", act: "", activation: "", hierarchy: "", cons: "", quality: "", cer: "", notes: ""
                }
            ]
        }));
    };

    const [formData, setFormData] = useState({
        title: "",
        documentType: useParams().type,
        aim: [{ type: "text", text: "" }],
        execSummaryGen: "",
        execSummary: [{ type: "text", text: "" }],
        scope: "",
        scopeInclusions: [{ type: "text", text: "" }],
        scopeExclusions: [{ type: "text", text: "" }],
        date: new Date().toLocaleDateString(),
        version: "1",
        site: "",
        dateConducted: "",
        rows: [
            { auth: "Facilitator", name: "", pos: "", num: 1 },
            { auth: "Owner", name: "", pos: "", num: 2 },
            { auth: "Reviewer", name: "", pos: "", num: 3 },
            { auth: "Approver", name: "", pos: "", num: 4 }
        ],
        ibra: [
            {
                id: uuidv4(), nr: 1, main: "", sub: "", owner: "", odds: "", riskRank: "",
                hazards: [], controls: [], S: "-", H: '-', E: "-", C: "-",
                LR: "-", M: "-", R: "-", source: "", material: "", priority: "",
                mainFlag: false, subFlag: false, ownerFlag: false, oddsFlag: false, riskRankFlag: false, hazardFlag: false, controlFlag: false, ueFlag: false, additionalFlag: false, maxConsequenceFlag: false, sourceFlag: false, materialFlag: false, priorityFlag: false,
                possible: [{ id: uuidv4(), actions: [{ id: uuidv4(), action: "" }], responsible: [{ id: uuidv4(), person: "" }], dueDate: [{ id: uuidv4(), date: "" }] }],
                UE: "", additional: "", maxConsequence: ""
            }
        ],
        cea: [
            {
                id: uuidv4(), nr: 1, control: "", critical: "", act: "", activation: "", hierarchy: "", cons: "", quality: "", cer: "", notes: "", description: "", performance: "", dueDate: "", responsible: "", action: ""
            }
        ],
        abbrRows: [],
        termRows: [],
        attendance: [
            {
                name: "", site: "", designation: "Facilitator", num: "", presence: "Absent"
            }
        ],
        supportingDocuments: [],
        references: [],
        pictures: [],
        reviewDate: 0,
        changeTable: [
            { changeVersion: "1", change: "New Document.", changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
        ],
        relevantControls: [],
        isRelevantControlsCollapsed: false,
    });

    useEffect(() => {
        const fetchControls = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/getValues`);
                const data = await res.json();
                setAllSystemControls(data.controls || []);
            } catch (err) {
                console.error("Error fetching controls", err);
            }
        };
        fetchControls();
    }, []);

    const fetchSites = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/sites`);
            if (!response.ok) {
                throw new Error("Failed to fetch values");
            }
            const data = await response.json();
            setCompanies(data.sites.map(s => s.site));
        } catch (error) {
            console.error("Error fetching designations:", error);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const closeAllDropdowns = () => {
        setShowSiteDropdown(null);
    };

    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [filteredSites, setFilteredSites] = useState([]);
    const [showSiteDropdown, setShowSiteDropdown] = useState(false);
    const sitesInputRef = useRef(null);

    const handleSiteInput = (value) => {
        closeAllDropdowns();
        setFormData(prev => ({
            ...prev,
            site: value
        }));

        const matches = companies
            .filter(opt => opt.toLowerCase().includes(value.toLowerCase()));
        setFilteredSites(matches);
        setShowSiteDropdown(true);

        const el = sitesInputRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // On focus, show all options
    const handleSiteFocus = () => {
        closeAllDropdowns();

        const matches = companies;
        setFilteredSites(matches);
        setShowSiteDropdown(true);

        const el = sitesInputRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    // When they pick one
    const selectSiteSuggestion = (value) => {
        setFormData(prev => ({
            ...prev,
            site: value
        }));
        setShowSiteDropdown(false);
    };

    useEffect(() => {
        const popupSelector = '.floating-dropdown';

        const handleClickOutside = (e) => {
            const outside =
                !e.target.closest(popupSelector) &&
                !e.target.closest('input');
            if (outside) {
                closeDropdowns();
            }
        };

        const handleScroll = (e) => {
            const isInsidePopup = e.target.closest(popupSelector);
            if (!isInsidePopup) {
                closeDropdowns();
            }

            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        };

        const closeDropdowns = () => {
            setShowSiteDropdown(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true); // capture scroll events from nested elements

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [showSiteDropdown]);

    const [rewriteHistory, setRewriteHistory] = useState({
        aim: {},
        scope: [],
        scopeInclusions: {},
        scopeExclusions: {},
    });

    const pushAimRewriteHistory = (index, oldValue) => {
        setRewriteHistory(prev => ({
            ...prev,
            aim: {
                ...prev.aim,
                [index]: [...(prev.aim[index] || []), oldValue]
            }
        }));
    };

    const undoAimRewrite = (index) => {
        setRewriteHistory(prev => {
            const currentHistory = [...(prev.aim[index] || [])];
            if (currentHistory.length === 0) return prev;

            const lastValue = currentHistory.pop();

            setFormData(fd => ({
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

            const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatAim/ibra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();
            const newText = data?.response || "";

            setFormData(fd => ({
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

    const pushAiRewriteHistory = (field, index = null) => {
        setRewriteHistory(prev => {
            if (index === null) {
                const currentValue = formData[field];
                const snapshot = Array.isArray(currentValue)
                    ? JSON.parse(JSON.stringify(currentValue))
                    : currentValue;

                return {
                    ...prev,
                    [field]: [...prev[field], snapshot]
                };
            }

            const currentItems = Array.isArray(formData[field]) ? formData[field] : [];
            const currentItem = currentItems[index];

            return {
                ...prev,
                [field]: {
                    ...(prev[field] || {}),
                    [index]: [
                        ...((prev[field] && prev[field][index]) || []),
                        currentItem?.text || ""
                    ]
                }
            };
        });
    };

    const undoAiRewrite = (field, index = null) => {
        if (index === null) {
            setRewriteHistory(prev => {
                const fieldHistory = prev[field];
                if (!fieldHistory || fieldHistory.length === 0) return prev;

                const previousValue = fieldHistory[fieldHistory.length - 1];

                setFormData(current => ({
                    ...current,
                    [field]: previousValue
                }));

                return {
                    ...prev,
                    [field]: fieldHistory.slice(0, -1)
                };
            });

            return;
        }

        setRewriteHistory(prev => {
            const itemHistory = prev[field]?.[index] || [];
            if (!itemHistory.length) return prev;

            const previousText = itemHistory[itemHistory.length - 1];

            setFormData(current => ({
                ...current,
                [field]: current[field].map((item, i) =>
                    i === index ? { ...item, text: previousText } : item
                )
            }));

            return {
                ...prev,
                [field]: {
                    ...(prev[field] || {}),
                    [index]: itemHistory.slice(0, -1)
                }
            };
        });
    };

    const AiRewriteScopeTextItem = async (sectionKey, index) => {
        try {
            const items = Array.isArray(formData[sectionKey]) ? formData[sectionKey] : [];
            const item = items[index];

            if (!item || item.type !== "text" || !item.text?.trim()) return;

            pushAiRewriteHistory(sectionKey, index);

            if (sectionKey === "scopeInclusions") {
                setLoadingScopeI(true);
                setLoadingScopeIRewriteIndex(index);
            } else {
                setLoadingScopeE(true);
                setLoadingScopeERewriteIndex(index);
            }

            const endpoint =
                sectionKey === "scopeInclusions"
                    ? `${process.env.REACT_APP_URL}/api/openai/chatScopeI/ibra`
                    : `${process.env.REACT_APP_URL}/api/openai/chatScopeE/ibra`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ prompt: item.text }),
            });

            const data = await response.json();
            const newText = data?.response || "";

            setFormData(prev => ({
                ...prev,
                [sectionKey]: prev[sectionKey].map((row, i) =>
                    i === index ? { ...row, text: newText } : row
                )
            }));
        } catch (error) {
            console.error("Error saving data:", error);
        } finally {
            if (sectionKey === "scopeInclusions") {
                setLoadingScopeI(false);
                setLoadingScopeIRewriteIndex(null);
            } else {
                setLoadingScopeE(false);
                setLoadingScopeERewriteIndex(null);
            }
        }
    };

    const formDataRef = useRef(formData);
    const usedAbbrCodesRef = useRef(usedAbbrCodes);
    const usedTermCodesRef = useRef(usedTermCodes);
    const userIDsRef = useRef(userIDs);
    const userIDRef = useRef(userID);
    const readOnlyRef = useRef(readOnly);

    useEffect(() => {
        userIDRef.current = userID;
    }, [userID]);

    useEffect(() => {
        userIDsRef.current = userIDs;
    }, [userIDs]);

    useEffect(() => {
        usedAbbrCodesRef.current = usedAbbrCodes;
    }, [usedAbbrCodes]);

    useEffect(() => {
        usedTermCodesRef.current = usedTermCodes;
    }, [usedTermCodes]);

    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        readOnlyRef.current = readOnly;
    }, [readOnly]);

    useEffect(() => {
        if (offlineDraft) return;
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
        if (formData.title.trim() === "") return;
        saveData(fileID, { skipFileUpload: false });
    };

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
        };

        setHistory((prev) => {
            if (prev.length > 0 && JSON.stringify(prev[prev.length - 1]) === JSON.stringify(currentState)) {
                return prev; // Prevent duplicate saves
            }
            return [...prev, currentState]; // Save the new state
        });
    }, [formData, usedAbbrCodes, usedTermCodes]);

    // Detects form changes across all components with debounce
    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(saveToHistory, 1000); // Only save after 1s of inactivity
    }, [formData, usedAbbrCodes, usedTermCodes]);

    const undoLastChange = () => {
        if (history.length > 1) {
            const lastState = history[history.length - 2]; // Get the last valid state
            const currentState = history[history.length - 1];

            // Restore the previous state
            setFormData(lastState.formData);
            setUsedAbbrCodes(lastState.usedAbbrCodes);
            setUsedTermCodes(lastState.usedTermCodes);

            setHistory((prev) => prev.slice(0, -1)); // Remove last history entry
            setRedoHistory((prev) => [...prev, currentState]);

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Undo successful!", {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("No changes to undo.", {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
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

            // Push back into history
            setHistory((prev) => [...prev, nextState]);
            setRedoHistory((prev) => prev.slice(0, -1));

            toast.success("Redo successful!", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
        } else {
            toast.warn("Nothing to redo.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title) newErrors.title = true;
        if (!formData.site) newErrors.site = true;
        if (!formData.dateConducted) newErrors.dateConducted = true;

        return newErrors;
    };

    // Authentication check
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
            setUserIDs([decodedToken.userId]);
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

    const handleDateInput = (value) => {
        setFormData({ ...formData, dateConducted: value });
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
        if (rowToChange.auth === "Facilitator") {
            rowToChange.num = 1;
        } else if (rowToChange.auth === "Owner") {
            rowToChange.num = 2;
        } else if (rowToChange.auth === "Reviewer") {
            rowToChange.num = 3;
        } else if (rowToChange.auth === "Approver") {
            rowToChange.num = 4;
        }

        // Only perform validation if the 'auth' field was modified
        if (field === "auth") {
            // Check if the current 'Author', 'Reviewer', or 'Approved By' is being removed or modified
            const requiredRoles = ["Owner", "Reviewer", "Approver", "Facilitator"];

            // Check if there is at least one row with each required auth type
            const isValid = requiredRoles.every(role => {
                return formData.rows.filter((row) => row.auth === role).length > 0 || rowToChange.auth === role;
            });

            if (!isValid) {
                toast.error(`You must have at least one ${requiredRoles.find(role => formData.rows.filter((row) => row.auth === role).length === 0)}.`, {
                    closeButton: true,
                    autoClose: 1500, // 1.5 seconds
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

    // Add a new row to the table
    const addRow = () => {
        setFormData({
            ...formData,
            rows: [
                ...formData.rows,
                { auth: "Owner", name: "", pos: "", num: 1 }
            ]
        });
    };

    const addAttendanceRow = () => {
        setFormData({
            ...formData,
            attendance: [
                ...formData.attendance,
                { name: "", site: "", designation: "", num: "" }
            ]
        });
    };

    const updateSignatureRows = (newSignatureRows) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            rows: newSignatureRows, // Update procedureRows with new data
        }));
    };

    const updateAttendanceRows = (newAttendanceRows) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            attendance: newAttendanceRows, // Update procedureRows with new data
        }));
    };

    const updateIBRARows = (newIbra) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            ibra: newIbra, // Update procedureRows with new data
        }));
    };

    const updateRefRows = (newRef) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            references: newRef, // Update procedureRows with new data
        }));
    };

    const updateCeaRows = (newCEA) => {
        const withCER = newCEA.map(r => ({
            ...r,
            cer: (r.quality && r.hierarchy)
                ? calculateCER(r.hierarchy, r.quality)
                : r.cer
        }));
        setFormData((prevFormData) => ({
            ...prevFormData,
            cea: withCER, // Update procedureRows with new data
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
        const initialRequiredRows = ["Owner", "Reviewer", "Approver", "Facilitator"];
        if (
            initialRequiredRows.includes(rowToRemove.auth) &&
            formData.rows.filter((row) => row.auth === rowToRemove.auth).length === 1
        ) {
            toast.error(`You must keep at least one ${rowToRemove.auth}.`, {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
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

    const removeIBRARow = (idToRemove) => {
        if (formData.ibra.length === 1) {
            toast.error("You must keep at least one row.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            return;
        }

        const updatedRows = formData.ibra.filter(row => row.id !== idToRemove);

        if (updatedRows.length === formData.ibra.length) {
            toast.error("Row not found.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            return;
        }

        // Re-number the rows in ascending order starting from 1
        const reNumberedRows = updatedRows.map((ibra, index) => ({
            ...ibra,
            nr: index + 1
        }));

        console.log('After re-numbering:', reNumberedRows);

        setFormData({
            ...formData,
            ibra: reNumberedRows,
        });
    };

    const removeCEARow = (idToRemove) => {
        // Prevent deleting the very last CEA row
        if (formData.cea.length === 1) {
            toast.error("You must keep at least one row.", {
                position: "top-right",
                autoClose: 1500,
            });
            return;
        }

        // Grab the control text we're about to delete
        const removedRow = formData.cea.find(row => row.id === idToRemove);
        const removedControl = removedRow?.control;

        // Remove that row from CEA
        const updatedRows = formData.cea.filter(row => row.id !== idToRemove);

        if (updatedRows.length === formData.cea.length) {
            toast.error("Row not found.", {
                position: "top-right",
                autoClose: 1500,
            });
            return;
        }

        // Re-number the remaining CEA rows
        const reNumberedCEA = updatedRows.map((cea, index) => ({
            ...cea,
            nr: index + 1
        }));

        // Also purge this control from every IBRA row
        const updatedIBRA = formData.ibra.map(ibraRow => ({
            ...ibraRow,
            controls: ibraRow.controls.filter(ctrl => ctrl !== removedControl)
        }));

        // Push both new arrays into state at once
        setFormData(prev => ({
            ...prev,
            cea: reNumberedCEA,
            ibra: updatedIBRA
        }));
    };

    const removeAttendanceRow = (indexToRemove) => {
        // Prevent removal if there's only one row left
        if (formData.attendance.length === 1) {
            toast.error(`You must have at least one attendance row.`, {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        // Proceed with removal if conditions are met
        setFormData({
            ...formData,
            attendance: formData.attendance.filter((_, index) => index !== indexToRemove),
        });
    };

    const handleGenerateUnused = () => {
        setUnusedPopup(false);

        handleGenerateDocument();
    }

    const cancelGenerateUnused = () => {
        setUnusedPopup(false);

        const unused = getUnusedControls();

        setFormData(prev => ({
            ...prev,
            isRelevantControlsCollapsed: false
        }));

        setUnusedRelevantControlsHighlight(unused.map(n => n.toLowerCase()));
    };

    useEffect(() => {
        if (unusedRelevantControlsHighlight.length > 0) {
            relevantControlsRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }, [unusedRelevantControlsHighlight]);

    const handleGenerateARegister = async () => {
        const dataToStore = {
            attendance: formData.attendance
        };

        if (formData.attendance.some(row => !row.name.trim())) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All attedees names must have a value.", {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (formData.attendance.some(row => !row.site.trim())) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All attedees company/site must have a value.", {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        if (formData.attendance.some(row => !row.designation.trim())) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("All attedees designation must have a value.", {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        const documentName = (formData.title) + ' ' + formData.documentType + " Attendance Register";
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-attend-xlsx`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `${documentName}.xlsx`);
            setLoading(false);
            //saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const handleGenerateIBRA = async () => {
        const dataToStore = {
            formData
        };

        const documentName = (formData.title) + ' ' + formData.documentType + " Output Register";
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-xlsx`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            const blob = await response.blob();
            saveAs(blob, `${documentName}.xlsx`);
            setLoading(false);
            //saveAs(blob, `${documentName}.pdf`);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const sanitizeExecSummaryForValidation = (items = []) => {
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

    const handleGeneratePublish = async () => {
        const documentName = `${formData.title} ${formData.documentType}`;

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
            changeTable: [...lastCT, newChange],
            aim: sanitizeAimForStorage(formData.aim),
            scopeInclusions: sanitizeStructuredScopeField(formData.scopeInclusions),
            scopeExclusions: sanitizeStructuredScopeField(formData.scopeExclusions),
            execSummary: sanitizeExecSummaryForValidation(formData.execSummary)
        };

        setFormData(updatedFormData);

        await sendUpdatedFormData(updatedFormData, documentName);
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
        await saveData(fileID);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/start-approval-blra-published`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");
            const data = await response.json();

            toast.success(`BLRA Publishing Approval Started.`, {
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

            if (data.readOnly) {
                setReadOnly(data.readOnly)
            }

            setInReview(data.reviewState);
            setInApproval(data.approvalStatus);

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
        await saveData(fileID);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/approve-published-blra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");
            const data = await response.json();

            toast.success(`BLRA Successfully Approved.`, {
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

            setReadOnly(true);
            setLoading(false);
            setApproveState(false);

            if (data.fullyApproved) {
                await handleGeneratePublish()
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/reject-published-blra`, {
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/remove-from-approval-blra-published`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to remove document from the approval process");

            toast.success(`BLRA Removed From The Approval Process.`, {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
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
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            });
        } finally {
            setRemovingApproval(false);
        }
    };

    const sendUpdatedFormData = async (formDataToStore, documentName) => {
        setLoading(true);

        const dataToStore = {
            usedAbbrCodes: usedAbbrCodesRef.current,
            usedTermCodes: usedTermCodesRef.current,
            formData: formDataToStore,
            userID,
            azureFN: azureFN,
            draftID: ""
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/publish-blra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });
            if (response.status === 404) throw new Error("Failed to generate document")

            if (!response.ok) throw new Error("Failed to generate document");

            setLoading(false);
            getNewAzureFileName();

            toast.success(`Document published`, {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });

            setLoading(false);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const prevControlsRef = useRef([]);  // hold last‐seen list so we only fetch on real changes

    const calculateCER = (hierarchy, quality) => {
        const ratingMatrix = [
            ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
            ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
            ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
            ['Very Effective', 'Could Improve', 'Not Effective', 'Not Effective'],
            ['Could Improve', 'Could Improve', 'Not Effective', 'Not Effective'],
            ['Not Effective', 'Not Effective', 'Not Effective', 'Not Effective']
        ];
        const hIndex = parseInt(hierarchy.split('. ')[0], 10) - 1;
        const qMap = { '> 90%': 0, '60-90%': 1, '30-59%': 2, '< 30%': 3 };
        const cIndex = qMap[quality];
        return (hIndex >= 0 && cIndex >= 0)
            ? ratingMatrix[hIndex][cIndex]
            : "";
    };

    const handleControlRename = (oldName, newName) => {
        const oldTrim = oldName.trim();
        const newTrim = newName.trim();

        // 1. Rename in IBRA rows (usage)
        const updatedIBRA = formData.ibra.map(r => ({
            ...r,
            controls: r.controls.map(c =>
                c.trim() === oldTrim ? newTrim : c
            )
        }));

        // 2. Rename in CEA rows — and break the system-control link,
        //    since a renamed control is no longer the same control.
        const updatedCEA = formData.cea.map(r =>
            r.control.trim() === oldTrim
                ? { ...r, control: newTrim, uniqueId: "" }
                : r
        );

        // 3. Rename in Relevant Controls list (Source)
        const updatedRelevant = formData.relevantControls.map(r => ({
            ...r,
            control: r.control.trim() === oldTrim ? newTrim : r.control
        }));

        setFormData(prev => ({
            ...prev,
            ibra: updatedIBRA,
            cea: updatedCEA,
            relevantControls: updatedRelevant
        }));
    };

    useEffect(() => {
        const distinctControls = Array.from(
            new Set(
                formData.ibra
                    .flatMap(item => item.controls || [])
                    .map(c => typeof c === "string" ? c.trim() : c?.control?.trim())
                    .filter(name => name && name.length > 0)
            )
        );

        if (distinctControls.length === 0) return;

        const currentRelevantNames = (formData.relevantControls || []).map(rc => rc.control);
        const missingInRelevant = distinctControls.filter(c => !currentRelevantNames.includes(c));

        if (missingInRelevant.length > 0) {

            // 🔹 Build lookup for system controls by name
            const systemByName = new Map(
                (allSystemControls || [])
                    .filter(c => (c?.control || "").trim())
                    .map(c => [c.control.trim().toLowerCase(), c])
            );

            const newRelevantRows = missingInRelevant.map(name => {
                const matchedSystemControl = systemByName.get(name.toLowerCase());

                return {
                    id: uuidv4(),
                    control: name,
                    description: "",
                    category: (matchedSystemControl?.category ?? "").toString().trim()
                };
            });

            setFormData(prev => ({
                ...prev,
                relevantControls: [...(prev.relevantControls || []), ...newRelevantRows]
            }));
        }
    }, [formData.ibra, allSystemControls]);

    const norm = (s) => (s == null ? "" : String(s).trim());

    // Helper: extract distinct used controls from IBRA
    const getUsedControlsFromIBRA = (ibraRows = []) => {
        const used = new Set();
        (ibraRows || []).forEach(row => {
            (row.controls || []).forEach(c => {
                const name = typeof c === "string" ? c : c?.control;
                const n = norm(name);
                if (n) used.add(n);
            });
        });
        return Array.from(used);
    };

    // Helper: merge backend fields ONLY if local field is empty
    const mergeIfEmpty = (localRow, backendRow) => {
        const pick = (key, fallback = "") => {
            const localVal = localRow?.[key];
            if (localVal != null && String(localVal).trim() !== "") return localVal;
            const backendVal = backendRow?.[key];
            if (backendVal != null && String(backendVal).trim() !== "") return backendVal;
            return fallback;
        };

        return {
            ...localRow,
            description: pick("description"),
            critical: pick("critical"),
            act: pick("act"),
            activation: pick("activation"),
            hierarchy: pick("hierarchy"),
            cons: pick("cons"),
            quality: pick("quality"),
            cer: pick("cer"),
            notes: pick("notes"),
            performance: pick("performance"),
            dueDate: pick("dueDate"),
            responsible: pick("responsible"),
            action: pick("action"),
        };
    };

    useEffect(() => {
        const syncCEAFromIBRA = async () => {
            const usedControls = getUsedControlsFromIBRA(formData.ibra);

            const currentCEA = formData.cea || [];

            // Keep only CEA rows whose control is still used in IBRA
            const keep = currentCEA.filter(r => usedControls.includes(norm(r.control)));

            // Which used controls are missing in CEA?
            const keepNames = new Set(keep.map(r => norm(r.control)));
            const missingNames = usedControls.filter(n => !keepNames.has(n));

            // (Optional hydration) which kept rows look "empty" and should be hydrated?
            const needsHydrateNames = keep
                .filter(r =>
                    !norm(r.description) ||
                    !norm(r.critical) ||
                    !norm(r.act) ||
                    !norm(r.activation) ||
                    !norm(r.hierarchy) ||
                    !norm(r.cons) ||
                    !norm(r.quality) ||
                    !norm(r.cer) ||
                    !norm(r.category)
                )
                .map(r => norm(r.control));

            // Nothing to do?
            if (missingNames.length === 0 && needsHydrateNames.length === 0 && keep.length === currentCEA.length) {
                return;
            }

            // Fetch backend data for missing + hydrate-needed
            const namesToFetch = Array.from(new Set([...missingNames, ...needsHydrateNames]));
            let backendMap = new Map();

            if (namesToFetch.length > 0) {
                try {
                    const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/getControls`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ controls: namesToFetch }),
                    });

                    const data = await res.json();
                    const returned = data?.controls || [];

                    returned.forEach(b => backendMap.set(norm(b.control), b));
                } catch (e) {
                    console.error("CEA hydrate fetch failed:", e);
                }
            }

            // Build rows to add for missing controls
            const addedRows = missingNames.map(name => {
                const b = backendMap.get(name) || {};
                const relevantMatch = (formData.relevantControls || []).find(
                    rc => norm(rc.control) === norm(name)
                );

                return {
                    id: uuidv4(),
                    control: name,
                    nr: 0, // set later
                    description: b.description || "",
                    critical: b.critical || "",
                    act: b.act || "",
                    activation: b.activation || "",
                    hierarchy: b.hierarchy || "",
                    cons: b.cons || "",
                    quality: b.quality || "",
                    cer: b.cer || "",
                    notes: b.notes || "",
                    performance: b.performance || "",
                    dueDate: b.dueDate || "",
                    responsible: b.responsible || "",
                    action: b.action || "",
                    category:
                        (b.category ?? "").toString().trim() ||
                        (relevantMatch?.category ?? "").toString().trim()
                };
            });

            // Hydrate kept rows (only fill blanks)
            const hydratedKeep = keep.map(row => {
                const b = backendMap.get(norm(row.control));
                return b ? mergeIfEmpty(row, b) : row;
            });

            // Merge in IBRA order (so CEA order matches what’s actually used)
            const byName = new Map([...hydratedKeep, ...addedRows].map(r => [norm(r.control), r]));
            const mergedInOrder = usedControls
                .map(name => byName.get(name))
                .filter(Boolean)
                .map((r, i) => ({ ...r, nr: i + 1 }));

            setFormData(prev => ({
                ...prev,
                cea: mergedInOrder
            }));
        };

        syncCEAFromIBRA();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.ibra]);

    const hasUnusedControls = () => {
        const relevant = formData.relevantControls || [];
        // If no relevant controls defined, nothing to check
        if (relevant.length === 0) return false;

        // 1. Get all control names that MUST be used
        const definedControlNames = relevant.map(r => r.control.trim());

        // 2. Collect all controls ACTUALLY used in IBRA rows
        const usedControlNames = new Set();
        (formData.ibra || []).forEach(row => {
            if (Array.isArray(row.controls)) {
                row.controls.forEach(c => {
                    const name = typeof c === 'string' ? c : c.control;
                    if (name) usedControlNames.add(name.trim());
                });
            }
        });

        // 3. Return true if any defined control is missing from the used set
        return definedControlNames.some(name => !usedControlNames.has(name));
    };


    useEffect(() => {
        if (!Array.isArray(allSystemControls) || allSystemControls.length === 0) return;

        const systemByName = new Map(
            allSystemControls
                .filter(c => (c?.control || "").trim())
                .map(c => [
                    (c.control || "").toString().trim().toLowerCase(),
                    c
                ])
        );

        let relevantChanged = false;
        let ceaChanged = false;

        const nextRelevantControls = (formData.relevantControls || []).map(row => {
            const currentCategory = (row?.category ?? "").toString().trim();
            if (currentCategory) return row;

            const match = systemByName.get(
                (row?.control || "").toString().trim().toLowerCase()
            );

            const matchedCategory = (match?.category ?? "").toString().trim();
            if (!matchedCategory) return row;

            relevantChanged = true;
            return {
                ...row,
                category: matchedCategory
            };
        });

        const nextCEA = (formData.cea || []).map(row => {
            const currentCategory = (row?.category ?? "").toString().trim();
            if (currentCategory) return row;

            const match = systemByName.get(
                (row?.control || "").toString().trim().toLowerCase()
            );

            const matchedCategory = (match?.category ?? "").toString().trim();
            if (!matchedCategory) return row;

            ceaChanged = true;
            return {
                ...row,
                category: matchedCategory
            };
        });

        if (relevantChanged || ceaChanged) {
            setFormData(prev => ({
                ...prev,
                relevantControls: relevantChanged ? nextRelevantControls : prev.relevantControls,
                cea: ceaChanged ? nextCEA : prev.cea
            }));
        }
    }, [allSystemControls, formData.relevantControls, formData.cea]);


    const getUnusedControls = () => {
        const relevant = formData.relevantControls || [];
        if (relevant.length === 0) return [];

        const definedControlNames = relevant
            .map(r => (r?.control ?? "").toString().trim())
            .filter(Boolean);

        const usedControlNames = new Set();
        (formData.ibra || []).forEach(row => {
            if (Array.isArray(row.controls)) {
                row.controls.forEach(c => {
                    const name = typeof c === "string" ? c : c?.control;
                    if (name) usedControlNames.add(String(name).trim());
                });
            }
        });

        return definedControlNames.filter(name => !usedControlNames.has(name));
    };

    useEffect(() => {
        if (!unusedRelevantControlsHighlight?.length) return;

        const relevant = formData.relevantControls || [];
        const ibraRows = formData.ibra || [];

        // Collect all used controls from IBRA
        const usedControlNames = new Set();

        ibraRows.forEach(row => {
            if (Array.isArray(row.controls)) {
                row.controls.forEach(c => {
                    const name = typeof c === "string" ? c : c?.control;
                    if (name) {
                        usedControlNames.add(String(name).trim().toLowerCase());
                    }
                });
            }
        });

        // Remove any highlighted control that is now used
        const updatedHighlights = unusedRelevantControlsHighlight.filter(
            ctrlName => !usedControlNames.has(ctrlName.toLowerCase())
        );

        if (updatedHighlights.length !== unusedRelevantControlsHighlight.length) {
            setUnusedRelevantControlsHighlight(updatedHighlights);
        }

    }, [formData.ibra, unusedRelevantControlsHighlight]);

    const createScopeBulletRow = () => ({
        id: uuidv4(),
        text: ""
    });

    const normalizeStructuredScopeField = (value) => {
        if (Array.isArray(value)) {
            const normalizedItems = value.map((item) => {
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
                        .map(line => line.trim())
                        .filter(Boolean)
                        .map(line => ({
                            id: uuidv4(),
                            text: line
                        }));

                return {
                    type: "bullet",
                    bullets: bullets.length > 0 ? bullets : [createScopeBulletRow()],
                    text: bullets.map(b => b.text).join("\n")
                };
            });

            return normalizedItems.length > 0 ? normalizedItems : [{ type: "text", text: "" }];
        }

        if (typeof value === "string") {
            return [{ type: "text", text: value }];
        }

        return [{ type: "text", text: "" }];
    };

    const sanitizeStructuredScopeField = (items = []) => {
        if (!Array.isArray(items)) return [];

        return items
            .map((item) => {
                const type = item?.type === "bullet" ? "bullet" : "text";

                if (type === "text") {
                    return {
                        ...item,
                        type: "text",
                        text: typeof item?.text === "string" ? item.text : ""
                    };
                }

                const bulletItems = Array.isArray(item?.bullets)
                    ? item.bullets
                    : typeof item?.text === "string"
                        ? item.text
                            .split(/\r?\n/)
                            .map(line => ({ id: uuidv4(), text: line }))
                        : [];

                const cleanedBullets = bulletItems
                    .map(b => ({
                        id: b?.id || uuidv4(),
                        text: typeof b?.text === "string" ? b.text.trim() : ""
                    }))
                    .filter(b => b.text !== "");

                return {
                    ...item,
                    type: "bullet",
                    bullets: cleanedBullets,
                    text: cleanedBullets.map(b => b.text).join("\n")
                };
            })
            .filter(item => item.text.trim() !== "");
    };

    const createAimBulletRow = () => ({
        id: uuidv4(),
        text: ""
    });

    const sanitizeAimForStorage = (aim = []) => {
        if (!Array.isArray(aim)) return [];

        return aim
            .map((item) => {
                const type = item?.type === "bullet" ? "bullet" : "text";

                if (type === "text") {
                    return {
                        ...item,
                        type: "text",
                        text: typeof item?.text === "string" ? item.text : ""
                    };
                }

                const bulletItems = Array.isArray(item?.bullets)
                    ? item.bullets
                    : typeof item?.text === "string"
                        ? item.text
                            .split(/\r?\n/)
                            .map(line => ({ id: uuidv4(), text: line }))
                        : [];

                const cleanedBullets = bulletItems
                    .map(b => ({
                        id: b?.id || uuidv4(),
                        text: typeof b?.text === "string" ? b.text.trim() : ""
                    }))
                    .filter(b => b.text !== "");

                return {
                    ...item,
                    type: "bullet",
                    bullets: cleanedBullets,
                    text: cleanedBullets.map(b => b.text).join("\n")
                };
            })
            .filter(item => {
                if (item.type === "text") {
                    return item.text.trim() !== "";
                }

                return item.text.trim() !== "";
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

    const handleAimBulletChange = (aimIndex, bulletId, value) => {
        setFormData((prev) => ({
            ...prev,
            aim: prev.aim.map((item, i) => {
                if (i !== aimIndex || item?.type !== "bullet") return item;

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
            const currentAims = Array.isArray(prev.aim) ? prev.aim : [{ type: "text", text: "" }];
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
        setFormData(prev => {
            const currentAim = Array.isArray(prev.aim) ? prev.aim : [];
            const updatedAim = currentAim.filter((_, index) => index !== indexToRemove);

            return {
                ...prev,
                aim: updatedAim.length > 0 ? updatedAim : [{ type: "text", text: "" }]
            };
        });
    };

    const handleAddAimBullet = (aimIndex, insertAtIndex = null) => {
        setFormData((prev) => ({
            ...prev,
            aim: prev.aim.map((item, i) => {
                if (i !== aimIndex || item?.type !== "bullet") return item;

                const currentBullets = Array.isArray(item.bullets) ? item.bullets : [];
                const newBullet = createAimBulletRow();

                if (insertAtIndex === null || insertAtIndex < 0 || insertAtIndex > currentBullets.length) {
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

    const handleRemoveAimBullet = (aimIndex, bulletId) => {
        setFormData((prev) => ({
            ...prev,
            aim: prev.aim.map((item, i) => {
                if (i !== aimIndex || item?.type !== "bullet") return item;

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

    const handleRemoveAimSection = (textIndex) => {
        setFormData((prev) => {
            const currentAim = Array.isArray(prev.aim) ? prev.aim : [];

            const sectionStartIndexes = currentAim
                .map((item, index) => (item?.type === "text" ? index : null))
                .filter(index => index !== null);

            // Do not allow deleting the last remaining section
            if (sectionStartIndexes.length <= 1) {
                return prev;
            }

            const updatedAim = currentAim.filter((_, index) => {
                return index !== textIndex && index !== textIndex + 1;
            });

            return {
                ...prev,
                aim: updatedAim
            };
        });
    }; const handleScopeSectionChange = (sectionKey, index, value) => {
        setFormData((prev) => ({
            ...prev,
            [sectionKey]: prev[sectionKey].map((item, i) =>
                i === index ? { ...item, text: value } : item
            )
        }));
    };

    const handleScopeSectionBulletChange = (sectionKey, itemIndex, bulletId, value) => {
        setFormData((prev) => ({
            ...prev,
            [sectionKey]: prev[sectionKey].map((item, i) => {
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

    const handleAddScopeSectionItem = (sectionKey) => {
        setFormData((prev) => {
            const currentItems = Array.isArray(prev[sectionKey])
                ? prev[sectionKey]
                : [{ type: "text", text: "" }];

            const lastType = currentItems[currentItems.length - 1]?.type || "text";
            const nextType = lastType === "text" ? "bullet" : "text";

            return {
                ...prev,
                [sectionKey]: [
                    ...currentItems,
                    nextType === "bullet"
                        ? { type: "bullet", bullets: [createScopeBulletRow()], text: "" }
                        : { type: "text", text: "" }
                ]
            };
        });
    };

    const handleRemoveScopeSectionItem = (sectionKey, indexToRemove) => {
        setFormData((prev) => {
            const currentItems = Array.isArray(prev[sectionKey]) ? prev[sectionKey] : [];
            const updatedItems = currentItems.filter((_, index) => index !== indexToRemove);

            return {
                ...prev,
                [sectionKey]: updatedItems.length > 0 ? updatedItems : [{ type: "text", text: "" }]
            };
        });
    };

    const handleAddScopeSectionBullet = (sectionKey, itemIndex, insertAtIndex = null) => {
        setFormData((prev) => ({
            ...prev,
            [sectionKey]: prev[sectionKey].map((item, i) => {
                if (i !== itemIndex || item?.type !== "bullet") return item;

                const currentBullets = Array.isArray(item.bullets) ? item.bullets : [];
                const newBullet = createScopeBulletRow();

                if (insertAtIndex === null || insertAtIndex < 0 || insertAtIndex > currentBullets.length) {
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

    const handleRemoveScopeSectionBullet = (sectionKey, itemIndex, bulletId) => {
        setFormData((prev) => ({
            ...prev,
            [sectionKey]: prev[sectionKey].map((item, i) => {
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

    const handleRemoveScopeSectionGroup = (sectionKey, textIndex) => {
        setFormData((prev) => {
            const currentItems = Array.isArray(prev[sectionKey]) ? prev[sectionKey] : [];

            const sectionStartIndexes = currentItems
                .map((item, index) => (item?.type === "text" ? index : null))
                .filter(index => index !== null);

            if (sectionStartIndexes.length <= 1) {
                return prev;
            }

            const updatedItems = currentItems.filter((_, index) => {
                return index !== textIndex && index !== textIndex + 1;
            });

            return {
                ...prev,
                [sectionKey]: updatedItems.length > 0 ? updatedItems : [{ type: "text", text: "" }]
            };
        });
    };


    useEffect(() => {
        if (!allSystemControls.length) return;
        if (!Array.isArray(formData.relevantControls) || formData.relevantControls.length === 0) return;

        const systemByName = new Map(
            allSystemControls
                .filter(c => (c?.control || "").trim())
                .map(c => [String(c.control).trim().toLowerCase(), c])
        );

        let hasChanges = false;

        const nextRelevantControls = formData.relevantControls.map(controlRow => {
            const currentCategory = (controlRow?.category ?? "").toString().trim();
            if (currentCategory) return controlRow;

            const matchedSystemControl = systemByName.get(
                (controlRow?.control || "").toString().trim().toLowerCase()
            );

            const matchedCategory = (matchedSystemControl?.category ?? "").toString().trim();
            if (!matchedCategory) return controlRow;

            hasChanges = true;
            return {
                ...controlRow,
                category: matchedCategory,
            };
        });

        if (hasChanges) {
            setFormData(prev => ({
                ...prev,
                relevantControls: nextRelevantControls,
            }));
        }
    }, [allSystemControls, formData.relevantControls]);

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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/blra/resolveRejected/${fileID}`, {
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
        <div className="risk-create-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Risk Management</p>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/blra2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{riskType.toUpperCase()}</p>
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

            <div className="main-box-risk-create">
                <div className="top-section-risk-create-page">
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

                        {!readOnly && !inReview && !inApproval && canIn(access, "RMS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faUpload} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleClick3} title="Publish" />
                        </div>)}

                        {(inApproval || inReview) && !readOnly && canIn(access, "RMS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon style={{ color: "#7EAC89" }} icon={faCheckCircle} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleApproveClick} title="Approve Draft" />
                        </div>)}

                        {(inApproval || inReview) && !readOnly && canIn(access, "RMS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon style={{ color: "#CB6F6F" }} icon={faTimesCircle} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleRejectClick} title="Reject Document" />
                        </div>)}

                        {false && canIn(access, "RMS", ["systemAdmin", "contributor"]) && (
                            <div className="burger-menu-icon-risk-create-page-1">
                                <FontAwesomeIcon icon={faUpload} onClick={handleClick3} className={`${!loadedID ? "disabled-share" : ""}`} title="Publish" />
                            </div>
                        )}

                        {false && canRemove && (inApproval || inReview) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faBan} onClick={openRemoveApproval} title="Remove From Approval Process" style={{ color: "#CB6F6F" }} />
                        </div>)}
                    </div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBarDD refreshable={false} canIn={canIn} access={access} menu={"1"} create={true} risk={true} />
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

                <div className={`scrollable-box-risk-create`}>
                    {(readOnly && (inReview || inApproval) && !isRejected) && (<div className="input-row">
                        <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#FFFF89", color: "black", fontWeight: "bold" }}>
                            This document is currently in the approval process
                        </div>
                    </div>)}

                    <div className="input-row-risk-create">
                        <div className={`input-box-title-risk-create ${errors.title ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Risk Assessment Title <span className="required-field">*</span></h3>
                            <div className="input-group-risk-create">
                                <input
                                    spellCheck="true"
                                    type="text"
                                    name="title"
                                    className="font-fam title-input"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    readOnly
                                    placeholder="Insert Risk Assessment Title (e.g., Working at Heights)"
                                />
                                <span className="type-risk-create">{formData.documentType}</span>
                            </div>
                        </div>
                    </div>

                    <div className="input-row-risk-create">
                        <div className={`input-box-type-risk-create ${errors.site ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Operation / Site <span className="required-field">*</span></h3>
                            <div className="jra-info-popup-page-select-container">
                                <input
                                    type="text"
                                    value={formData.site}
                                    className="jra-info-popup-page-input-table jra-info-popup-page-row-input"
                                    ref={sitesInputRef}
                                    placeholder="Select Site"
                                    onChange={e => handleSiteInput(e.target.value)}
                                    onFocus={handleSiteFocus}
                                    readOnly={readOnly}
                                />
                            </div>
                        </div>
                        <div className={`input-box-type-risk-create-date ${errors.dateConducted ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels">Date Conducted <span className="required-field">*</span></h3>

                            <div className="date-input-risk-create-container" style={{ position: "relative" }}>
                                <DatePicker
                                    value={formData.dateConducted || ""}
                                    format="YYYY-MM-DD"
                                    onChange={(val) =>
                                        handleDateInput(val?.format("YYYY-MM-DD"))
                                    }
                                    rangeHover={false}
                                    highlightToday={false}
                                    editable={false}
                                    placeholder="YYYY-MM-DD"
                                    hideIcon={false}
                                    readOnly={readOnly}
                                    inputClass='date-input-risk-create'
                                    onFocus={() => {
                                        setErrors(prev => ({
                                            ...prev,
                                            dateConducted: false
                                        }))
                                    }}
                                    style={{ width: "100%" }}
                                    onOpenPickNewDate={false}
                                />
                                <FontAwesomeIcon
                                    icon={faCalendarDays}
                                    className="date-input-calendar-icon"
                                />
                            </div>
                        </div>
                    </div>

                    <DocumentSignaturesRiskTable readOnly={readOnly} rows={formData.rows} handleRowChange={handleRowChange} addRow={addRow} removeRow={removeRow} error={errors.signs} updateRows={updateSignatureRows} setErrors={setErrors} />

                    <RiskAimComponent
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
                        onHelp={openHelpRA}
                        onAiRewrite={AiRewriteAim}
                        onUndo={undoAimRewrite}
                        onAddAim={handleAddAim}
                        onRemoveAim={handleRemoveAim}
                        onRemoveAimSection={handleRemoveAimSection}
                        onAddBullet={handleAddAimBullet}
                        onRemoveBullet={handleRemoveAimBullet}
                        collapsible={true}
                    />

                    <RiskScopeIE
                        readOnly={readOnly}
                        error={errors.scope}
                        formData={formData}
                        setErrors={setErrors}

                        onIntroChange={handleInputChange}

                        onSectionChange={handleScopeSectionChange}
                        onSectionBulletChange={handleScopeSectionBulletChange}
                        onAddSectionItem={handleAddScopeSectionItem}
                        onRemoveSectionItem={handleRemoveScopeSectionItem}
                        onRemoveSectionGroup={handleRemoveScopeSectionGroup}
                        onAddSectionBullet={handleAddScopeSectionBullet}
                        onRemoveSectionBullet={handleRemoveScopeSectionBullet}

                        onHelp={openHelpScope}

                        loadingScope={loadingScope}
                        loadingScopeRewriteIndex={null}
                        loadingScopeI={loadingScopeI}
                        loadingScopeIRewriteIndex={loadingScopeIRewriteIndex}
                        loadingScopeE={loadingScopeE}
                        loadingScopeERewriteIndex={loadingScopeERewriteIndex}

                        rewriteHistory={rewriteHistory}

                        onAiRewriteScope={AiRewriteScope}
                        onAiRewriteScopeTextItem={AiRewriteScopeTextItem}
                        onUndoScope={() => undoAiRewrite("scope")}
                        onUndoScopeTextItem={(sectionKey, index) => undoAiRewrite(sectionKey, index)}

                        collapsible={true}
                    />

                    <RelevantControlsTable
                        ref={relevantControlsRef}
                        relevantControls={formData.relevantControls}
                        setFormData={setFormData}
                        globalControls={allSystemControls}
                        onControlRename={handleControlRename}
                        isCollapsed={formData.isRelevantControlsCollapsed}
                        readOnly={readOnly}
                        highlightedControlNames={unusedRelevantControlsHighlight}
                    />

                    <AbbreviationTableRisk collapsible={true} readOnly={readOnly} risk={true} formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} error={errors.abbrs} userID={userID} />
                    <TermTableRisk collapsible={true} risk={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} error={errors.terms} userID={userID} />
                    <AttendanceTable collapsible={true} readOnly={readOnly} title={formData.title} documentType={formData.documentType} rows={formData.attendance} addRow={addAttendanceRow} error={errors.attend} removeRow={removeAttendanceRow} updateRows={updateAttendanceRows} userID={userID} generateAR={handleClick} />
                    {formData.documentType === "BLRA" && (<BLRATable collapsible={true} readOnly={readOnly} relevantControls={formData.relevantControls} rows={formData.ibra} error={errors.ibra} updateRows={updateIbraRows} updateRow={updateIBRARows} addRow={addIBRARow} removeRow={removeIBRARow} generate={handleClick2} isSidebarVisible={isSidebarVisible} setErrors={setErrors} />)}
                    {(["BLRA"].includes(formData.documentType)) && (<ControlAnalysisTable collapsible={true} readOnly={readOnly} error={errors.cea} rows={formData.cea} ibra={formData.ibra} updateRows={updateCEARows} onControlRename={handleControlRename} addRow={addCEARow} updateRow={updateCeaRows} removeRow={removeCEARow} title={formData.title} isSidebarVisible={isSidebarVisible} relevantControls={formData.relevantControls} />)}

                    <ExecutiveSummary
                        collapsible={true}
                        readOnly={readOnly}
                        formData={formData}
                        setFormData={setFormData}
                        setErrors={setErrors}
                        error={errors.execSummary}
                    />

                    <SupportingDocumentTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} />
                    <ReferenceTable collapsible={true} readOnly={readOnly} referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} setErrors={setErrors} error={errors.reference} required={true} />
                    <PicturesTable collapsible={true} readOnly={readOnly} picturesRows={formData.pictures} addPicRow={addPicRow} updatePicRow={updatePicRow} removePicRow={removePicRow} />

                    <div className="input-row">
                        <div className={`input-box-aim-cp`}>
                            <h3 className="font-fam-labels">Document Change Reason <span className="required-field">*</span></h3>
                            <textarea
                                spellcheck="true"
                                name="aim"
                                className="aim-textarea font-fam"
                                value={change}
                                readOnly={readOnly}
                                onChange={(e) => setChange(e.target.value)}
                                rows="4"   // Adjust the number of rows for initial height
                                placeholder="Insert the reason for the document update..." // Optional placeholder text
                            />
                        </div>
                    </div>

                    <div className="input-row-buttons-risk-create">
                        {/* Generate File Button */}
                        <button
                            className="generate-button font-fam"
                            onClick={handleClick4}
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
                </div>
            </div>
            {helpRA && (<RiskAim setClose={closeHelpRA} />)}
            {helpScope && (<RiskScope setClose={closeHelpScope} />)}
            <ToastContainer />
            {isSaveAsModalOpen && (<SaveAsPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.title} type={riskType} userID={userID} create={false} />)}
            {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}
            {unusedPopup && (<UnusedControlsPopup generate={handleGenerateUnused} closeModal={closeUnused} cancel={cancelGenerateUnused} />)}

            {showSiteDropdown && !readOnly && filteredSites.length > 0 && (
                <ul
                    className="floating-dropdown"
                    style={{
                        position: 'fixed',
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        zIndex: 1000
                    }}
                >
                    {filteredSites.sort().map((term, i) => (
                        <li
                            key={i}
                            onMouseDown={() => selectSiteSuggestion(term)}
                        >
                            {term}
                        </li>
                    ))}
                </ul>
            )}
            {approval && (<ApproversPopup closeModal={closeApproval} handleSubmit={handlePublishApprovalFlow} />)}
            {approveState && (<ApproveApprovalProcessPopup approveDraft={approveDraft} closeModal={closeApprovePopup} loading={loading} />)}
            {removeApprovalState && (
                <RemoveFromApprovalPopup
                    closeModal={closeRemoveApproval}
                    removeApproval={removeFromApprovalProcess}
                    docType="BLRA"
                    title={formData.title}
                    loading={removingApproval}
                />
            )}
            {rejectState && (<RejectReason isOpen={rejectState} onClose={closeRejectPopup} onSubmit={rejectDraft} loading={rejecting} />)}
            {isSaving && (
                <SavingInProgress />
            )}
            {isPublishing && (
                <PublishingInProgress />
            )}
            {showRejectReasonView && (
                <RejectReasonView
                    rejectorName={rejectionInfo.rejectorName}
                    rejectDate={formatRejectDate(rejectionInfo.rejectDate)}
                    rejectionReason={rejectionInfo.rejectionMessage}
                    reviewDocument={handleReviewRejectedDraft}
                />
            )}
        </div>
    );
};

export default RiskReviewPageBLRA;