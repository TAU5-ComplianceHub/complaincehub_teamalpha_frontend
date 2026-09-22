import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import "./RiskManagementPage.css";
import TermTableRisk from "../RiskRelated/RiskComponents/TermTableRisk";
import AbbreviationTableRisk from "../RiskRelated/RiskComponents/AbbreviationTableRisk"
import ReferenceTable from "../CreatePage/ReferenceTable";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faShareNodes, faUpload, faRotateRight, faChevronLeft, faChevronRight, faInfoCircle, faMagicWandSparkles, faSave, faPen, faArrowLeft, faArrowUp, faCaretRight, faCaretLeft, faInfo, faCalendarDays, faDownload, faCheckCircle, faBan, faCopy, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons"
import TopBarDD from "../Notifications/TopBarDD";
import AttendanceTable from "../RiskRelated/AttendanceTable";
import DocumentSignaturesRiskTable from "../RiskRelated/DocumentSignaturesRiskTable";
import PPETableRisk from "../RiskRelated/RiskComponents/PPETableRisk";
import EquipmentTableRisk from "../RiskRelated/RiskComponents/EquipmentTableRisk";
import HandToolsTableRisk from "../RiskRelated/RiskComponents/HandToolsTableRisk";
import MaterialsTableRisk from "../RiskRelated/RiskComponents/MaterialsTableRisk";
import MobileMachineTableRisk from "../RiskRelated/RiskComponents/MobileMachineTableRisk";
import SupportingDocumentTable from "../RiskRelated/SupportingDocumentTable";
import JRATable from "../RiskRelated/JRATable";
import LoadRiskDraftPopup from "../RiskRelated/LoadRiskDraftPopup";
import SharePageRisk from "../RiskRelated/SharePageRisk";
import RiskAim from "../RiskRelated/RiskInfo/RiskAim";
import RiskScope from "../RiskRelated/RiskInfo/RiskScope";
import IntroTaskInfo from "../RiskRelated/IntroTaskInfo";
import PicturesTable from "../CreatePage/PicturesTable";
import OtherTeam from "../RiskRelated/OtherTeam";
import SavePopup from "../Popups/SavePopup";
import SaveAsPopup from "../Popups/SaveAsPopup";
import RenameDraftPopup from "../Popups/RenameDraftPopup";
import GenerateDraftPopup from "../Popups/GenerateDraftPopup";
import DraftPopup from "../Popups/DraftPopup";
import DocumentWorkflow from "../Popups/DocumentWorkflow";
import { getCurrentUser, can, canIn, isAdmin } from "../../utils/auth";
import DatePicker from "react-multi-date-picker";
import ApproversPopup from "../VisitorsInduction/InductionCreation/ApproversPopup";
import ApproveApprovalProcessPopup from "../Popups/ApproveApprovalProcessPopup";
import DuplicateName from "../Popups/DuplicateName";
import SaveConfirmationPopup from "../CreatePage/SaveConfirmationPopup";
import RemoveFromApprovalPopup from "../Popups/RemoveFromApprovalPopup";
import SavingInProgress from "../DocumentCreationPages/SavingInProgress";
import PublishingInProgress from "../DocumentCreationPages/PublishingInProgress";
import { useTauriCloseGuard } from "../../utils/useTauriCloseGuard";
import ReshareDraftPopup from "../Popups/ReshareDraftPopup";
import RejectReason from "../Popups/RejectReason";
import RejectReasonView from "../Popups/RejectReasonView";

const RiskManagementPageJRA = ({ versionPreview = false, signedOffPreview = false }) => {
    const navigate = useNavigate();
    const riskType = useParams().type;
    const riskId = useParams().id;
    const versionNumber = useParams().version;
    const [share, setShare] = useState(false);
    const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
    const [usedTermCodes, setUsedTermCodes] = useState([]);
    const [usedPPEOptions, setUsedPPEOptions] = useState([]);
    const access = getCurrentUser();
    const [usedHandTools, setUsedHandTools] = useState([]);
    const [usedEquipment, setUsedEquipment] = useState([]);
    const [usedMobileMachine, setUsedMobileMachines] = useState([]);
    const [usedMaterials, setUsedMaterials] = useState([]);
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
    const [companies, setCompanies] = useState([]);
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [isRenamePopupOpen, setIsRenamePopupOpen] = useState(false);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
    const [generatePopup, setGeneratePopup] = useState(false);
    const [draftNote, setDraftNote] = useState(null);
    const [showWorkflow, setShowWorkflow] = useState(null);
    const previewOnly = versionPreview || signedOffPreview;
    const [readOnly, setReadOnly] = useState(previewOnly);
    const [lockUser, setLockUser] = useState(null);
    const scrollableRef = useRef(null);
    const [owner, setOwner] = useState(false);
    const [approval, setApproval] = useState(false);
    const [inApproval, setInApproval] = useState(false);
    const [inReview, setInReview] = useState(false);
    const [approveState, setApproveState] = useState(false);
    const [isDuplicateName, setIsDuplicateName] = useState(false);
    const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
    const [saveConfirmTrigger, setSaveConfirmTrigger] = useState("back");
    const pendingActionRef = useRef(null);
    const [isViewer, setIsViewer] = useState(false);
    const [isPublisher, setIsPublisher] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // spinner state for the top "Save" icon
    const [isPublishing, setIsPublishing] = useState(false); // spinner state for the top "Publish" icon
    const [removeApprovalState, setRemoveApprovalState] = useState(false);
    const [removingApproval, setRemovingApproval] = useState(false);
    const [canRemove, setCanRemove] = useState(false);
    const [isSavingVersion, setIsSavingVersion] = useState(false);
    const [versionInfo, setVersionInfo] = useState(null);
    const [showReshareDraft, setShowReshareDraft] = useState(false);
    const [rejectState, setRejectState] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [isRejected, setIsRejected] = useState(false);
    const [showRejectReasonView, setShowRejectReasonView] = useState(false);
    const [rejectionInfo, setRejectionInfo] = useState({ rejectorName: "", rejectDate: null, rejectionMessage: "" });

    const SHARE_ROLES = ["collaborator", "viewer", "publisher"];
    const ALL_ALLOWED_ROLES = ["owner", ...SHARE_ROLES];

    const normalizeSharedUsers = (value, ownerId) => {
        const rawItems = Array.isArray(value)
            ? value
            : value == null
                ? []
                : [value];

        const mapped = rawItems
            .map((item) => {
                if (typeof item === "string") {
                    return {
                        userId: item,
                        role: item === ownerId ? "owner" : "collaborator"
                    };
                }

                if (item && typeof item === "object") {
                    const userId =
                        item.userId ||
                        item.userID ||
                        item._id ||
                        item.id ||
                        "";

                    if (!userId) return null;

                    let role = String(item.role || "").toLowerCase().trim();

                    if (!ALL_ALLOWED_ROLES.includes(role)) {
                        role = userId === ownerId ? "owner" : "collaborator";
                    }

                    if (userId === ownerId) {
                        role = "owner";
                    }

                    return { userId, role };
                }

                return null;
            })
            .filter(Boolean);

        const seen = new Set();
        const deduped = [];

        mapped.forEach((entry) => {
            if (seen.has(entry.userId)) return;
            seen.add(entry.userId);
            deduped.push(entry);
        });

        if (ownerId && !deduped.some((entry) => entry.userId === ownerId)) {
            deduped.unshift({ userId: ownerId, role: "owner" });
        }

        return deduped.map((entry) => ({
            userId: entry.userId,
            role: entry.userId === ownerId ? "owner" : entry.role
        }));
    };

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

    const openWorkflow = () => {
        setShowWorkflow(true);
    }

    const closeWorkflow = () => {
        setShowWorkflow(false);
    }

    const closeHelpRA = () => {
        setHelpRA(false);
    };

    const closeHelpScope = () => {
        setHelpScope(false);
    };

    const closeShare = () => { setShare(false); };
    const openLoadPopup = () => setLoadPopupOpen(true);
    const closeLoadPopup = () => setLoadPopupOpen(false);

    const handleSave = async () => {
        if (formData.title.trim() === "") {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please fill in at least the title field before saving.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            return;
        }

        setIsSaving(true);
        try {
            if (loadedIDRef.current === '') {
                const result = await saveData();

                if (result?.duplicate) {
                    setIsDuplicateName(true);
                    toast.dismiss();
                    toast.clearWaitingQueue();
                    toast.warn("A draft with this name already exists. Please enter a new draft name.", {
                        closeButton: true,
                        autoClose: 2000,
                        style: { textAlign: 'center' }
                    });
                    return;
                }

                toast.dismiss();
                toast.clearWaitingQueue();
                if (result?.ok) {
                    toast.success("Draft has been successfully saved", {
                        closeButton: true,
                        autoClose: 1500,
                        style: { textAlign: 'center' }
                    });
                } else {
                    toast.error("Failed to save draft. Please try again.", {
                        closeButton: true,
                        autoClose: 2000,
                        style: { textAlign: 'center' }
                    });
                }

                return;
            }

            const result = await updateData(userIDsRef.current);

            toast.dismiss();
            toast.clearWaitingQueue();
            if (result?.ok) {
                toast.success("Draft has been successfully updated", {
                    closeButton: true,
                    autoClose: 1500,
                    style: { textAlign: 'center' }
                });
            } else {
                toast.error("Failed to update draft. Please try again.", {
                    closeButton: true,
                    autoClose: 2000,
                    style: { textAlign: 'center' }
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveVersion = async () => {
        if (versionPreview || readOnly) return;

        if (userIDsRef.current.length <= 1) {
            toast.error("Only drafts shared with more than one person can have versions saved.", {
                closeButton: true,
                autoClose: 2200,
                style: { textAlign: "center" }
            });
            return;
        }

        if (formDataRef.current.title.trim() === "") {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Please fill in at least the title field before saving a version.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: "center" }
            });
            return;
        }

        setIsSavingVersion(true);

        try {
            let activeDraftId = loadedIDRef.current;

            // A version must represent exactly what is currently on screen.
            // Persist the working copy first, but do not create history during a normal save.
            if (!activeDraftId) {
                const saveResult = await saveData();

                if (saveResult?.duplicate) {
                    setIsDuplicateName(true);
                    toast.warn("A draft with this name already exists. Please enter a new draft name.", {
                        closeButton: true,
                        autoClose: 2000,
                        style: { textAlign: "center" }
                    });
                    return;
                }

                if (!saveResult?.ok || !saveResult?.id) {
                    throw new Error("The draft could not be saved before creating the version.");
                }

                activeDraftId = saveResult.id;
            } else {
                const updateResult = await updateData(userIDsRef.current);
                if (!updateResult?.ok) {
                    throw new Error("The latest draft changes could not be saved before creating the version.");
                }
            }

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/riskDraft/jra/versions/${activeDraftId}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result?.error || "Failed to save version");
            }

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success(`${result.label} saved successfully`, {
                closeButton: true,
                autoClose: 1800,
                style: { textAlign: "center" }
            });
        } catch (error) {
            console.error("Error saving version:", error);
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(error.message || "Failed to save version", {
                closeButton: true,
                autoClose: 2200,
                style: { textAlign: "center" }
            });
        } finally {
            setIsSavingVersion(false);
        }
    };

    const saveDraftName = async (newTitle) => {
        const trimmedTitle = (newTitle || "").trim();

        if (!trimmedTitle) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("Please enter a draft name.", {
                closeButton: true,
                autoClose: 1000,
                style: { textAlign: 'center' }
            });
            return;
        }

        const me = userIDRef.current;
        draftOwnerIdRef.current = me;

        const newFormData = {
            ...formDataRef.current,
            title: trimmedTitle,
        };

        setFormData(newFormData);
        formDataRef.current = newFormData;

        const normalizedOwnerOnly = normalizeSharedUsers([], me);
        setUserIDs(normalizedOwnerOnly);
        userIDsRef.current = normalizedOwnerOnly;

        loadedIDRef.current = '';
        setLoadedID('');

        const result = await saveData(trimmedTitle);

        if (result?.duplicate) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("That draft name already exists. Please choose a different name.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            return; // keep popup open
        }

        if (result?.ok) {
            setIsDuplicateName(false);

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Draft has been successfully saved", {
                closeButton: false,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
        }
    };

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

    const confirmSaveAs = async (newTitle) => {
        // apply the new title, clear loadedID, then save
        const me = userIDRef.current;
        draftOwnerIdRef.current = me;

        const newFormData = {
            ...formDataRef.current,
            title: newTitle,
        };

        setFormData(newFormData);
        formDataRef.current = newFormData;

        const normalizedOwnerOnly = normalizeSharedUsers([], me);
        setUserIDs(normalizedOwnerOnly);
        userIDsRef.current = normalizedOwnerOnly;

        loadedIDRef.current = '';
        setLoadedID('');

        const result = await saveData(newTitle);

        if (result?.duplicate) {
            setIsDuplicateName(true);
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("That draft name already exists. Please choose a different name.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            return;
        }

        if (!result?.ok) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Failed to save draft online. It was saved offline instead.", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            return;
        }

        if (result?.id) {
            await loadData(result.id);
        }

        toast.dismiss();
        toast.clearWaitingQueue();
        toast.success("New draft successfully saved.", {
            closeButton: false,
            autoClose: 1500,
            style: { textAlign: 'center' }
        });

        setIsSaveAsModalOpen(false);
    };

    const openShare = () => {
        if (loadedIDRef.current || loadedID) {
            setShare(true);
        } else {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("Please save a draft before sharing.", {
                closeButton: true,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            });
        }
    };

    const closeSaveAs = () => {
        setIsSaveAsModalOpen(false);
    };

    const openRenamePopup = () => setIsRenamePopupOpen(true);
    const closeRenamePopup = () => setIsRenamePopupOpen(false);

    // Renames the currently loaded draft in place (title only) via the
    // dedicated rename endpoint, rather than re-saving the whole draft.
    const handleRenameDraft = async (newTitle) => {
        const activeId = loadedIDRef.current || loadedID;
        if (!activeId) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/jra/rename/${activeId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ title: newTitle }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to rename draft");
            }

            const newFormData = { ...formDataRef.current, title: newTitle };
            setFormData(newFormData);
            formDataRef.current = newFormData;

            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Draft renamed successfully.", {
                closeButton: false,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
        } catch (err) {
            console.error("Failed to rename draft:", err);
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error(err.message || "Failed to rename draft", {
                closeButton: true,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });
            throw err;
        }
    };

    const openSaveMenu = () => {
        setIsSaveMenuOpen(true);
    };

    const closeSaveMenu = () => {
        setIsSaveMenuOpen(false);
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

    const buildDraftFormDataRequest = (dataToStore, options = {}) => {
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

    const saveData = async (overrideTitle = null, options = {}) => {
        const { skipFileUpload = false } = options;

        draftOwnerIdRef.current = userIDRef.current;

        const normalizedSharedUsers = normalizeSharedUsers(
            userIDsRef.current,
            userIDRef.current
        );

        const dataToStore = {
            usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
            usedTermCodes: usedTermCodesRef.current,
            usedPPEOptions: usedPPEOptionsRef.current,
            usedEquipment: usedEquipmentRef.current,
            usedHandTools: usedHandToolsRef.current,
            usedMaterials: usedMaterialsRef.current,
            usedMobileMachine: usedMobileMachineRef.current,
            formData: {
                ...formDataRef.current,
                ...(overrideTitle ? { title: overrideTitle } : {})
            },
            userIDs: normalizedSharedUsers,
            creator: userIDRef.current,
            updater: null,
            dateUpdated: null
        };

        try {
            const body = buildDraftFormDataRequest(dataToStore, { skipFileUpload });

            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/jra/safe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body,
            });

            const result = await response.json();

            if (response.status === 409 && result?.duplicate) {
                return {
                    ok: false,
                    duplicate: true,
                    message: result.error,
                };
            }

            if (!response.ok) {
                throw new Error(result?.error || 'Failed to save draft');
            }

            if (result.id) {
                setLoadedID(result.id);
                loadedIDRef.current = result.id;
            }

            if (result.formData) {
                suppressDirtyRef.current = true;
                setFormData(result.formData);
                formDataRef.current = result.formData;
            }
            // Mark this as the latest persisted state so a follow-up
            // back/home/refresh doesn't re-prompt for nothing.
            isDirtyRef.current = false;

            return { ok: true, id: result.id };
        } catch (error) {
            console.error('Error saving data:', error);
            return { ok: false, duplicate: false, error };
        }
    };

    const updateData = async (selectedUserIDs, options = {}) => {
        const { skipFileUpload = false } = options;

        const normalizedSharedUsers = normalizeSharedUsers(
            selectedUserIDs,
            draftOwnerIdRef.current || userIDRef.current
        );

        const dataToStore = {
            usedAbbrCodes: usedAbbrCodesRef.current,
            usedTermCodes: usedTermCodesRef.current,
            usedPPEOptions: usedPPEOptionsRef.current,
            usedEquipment: usedEquipmentRef.current,
            usedHandTools: usedHandToolsRef.current,
            usedMaterials: usedMaterialsRef.current,
            usedMobileMachine: usedMobileMachineRef.current,
            formData: formDataRef.current,
            userIDs: normalizedSharedUsers,
            updater: userIDRef.current,
            dateUpdated: new Date().toISOString(),
            userID
        };

        try {
            const body = buildDraftFormDataRequest(dataToStore, { skipFileUpload });

            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/jra/modifySafe/${loadedIDRef.current}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error || 'Failed to update draft');
            }

            if (result.formData) {
                suppressDirtyRef.current = true;
                setFormData(result.formData);
                formDataRef.current = result.formData;
            }
            // Mark this as the latest persisted state (covers both manual
            // saves and auto-saves, since both funnel through updateData).
            isDirtyRef.current = false;

            console.log(result.message);
            return { ok: true, ...result };
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
            handleGenerateARegister();  // Call your function when the form is valid
        }
    };

    const saveDraft = async () => {
        if (!loadedIDRef.current) {
            await saveData();
        } else {
            await updateData(userIDsRef.current);
        }
    }

    const handleClick3 = async () => {
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            if (titleSet)
                setGeneratePopup(true);

            if (!titleSet) {
                toast.error("Please fill in a title", {
                    closeButton: true,
                    autoClose: 1500, // 1.5 seconds
                    style: {
                        textAlign: 'center'
                    }
                });
            }

            return;
        }

        try {
            if (!readOnly) {
                toast.info("Saving draft…", { autoClose: false });
                await saveDraft();
                toast.dismiss();
                toast.success("Draft saved");
            }

            await handleGenerateJRADocument();

        } catch (err) {
            toast.error("Could not save draft, generation aborted.");
            console.error(err);
        }

    };

    const cancelGenerate = () => {
        const newErrors = validateForm();
        setErrors(newErrors);
        setGeneratePopup(false);
    }

    const closeGenerate = () => {
        setGeneratePopup(false);
    }

    const handlePubClick = async () => {
        if (loadedIDRef.current === '') {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.warn("Please load a draft before publishing.", {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });

            return;
        }

        setIsPublishing(true);
        try {
            await handlePublishApprovalFlow();
        } finally {
            setIsPublishing(false);
        }
    }

    const loadData = async (loadID) => {
        try {
            const token = localStorage.getItem("token");

            const loadUrl = signedOffPreview
                ? `${process.env.REACT_APP_URL}/api/fileGenDocs/signedOffJRA/getFile/${loadID}`
                : versionPreview && versionNumber
                    ? `${process.env.REACT_APP_URL}/api/riskDraft/jra/versions/${loadID}/${versionNumber}`
                    : `${process.env.REACT_APP_URL}/api/riskDraft/jra/getDraft/${loadID}`;

            const response = await fetch(
                loadUrl,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            const storedData = signedOffPreview
                ? data.files || {}
                : data.draft || {};
            const readOnly = data.readOnly || false;
            const isOwner = data.isOwner || false;
            const isViewer = data.isViewer || false;
            const isPublisher = data.isPublisher || false;
            const canRemove = data.canRemove || false;
            const isWithdrawn = data.isWithdrawn || false;
            const isRejectedFromServer = isOwner
                ? false
                : Boolean(storedData.isRejected || data.isRejected);
            // Owner-facing view of the same flag: the owner doesn't get the
            // read-only "rejected" banner (they're the one meant to fix it), but
            // they do need to see who rejected it, when, and why.
            const isRejectedForOwner = isOwner && Boolean(storedData.isRejected || data.isRejected);

            const ownerId =
                storedData.creator ||
                storedData.userID ||
                userIDRef.current;

            draftOwnerIdRef.current = ownerId;

            const normalizedSharedUsers = normalizeSharedUsers(
                storedData.userIDs,
                ownerId
            );

            setUsedAbbrCodes(storedData.usedAbbrCodes || []);
            setUsedTermCodes(storedData.usedTermCodes || []);
            setUsedPPEOptions(storedData.usedPPEOptions || []);
            setUsedHandTools(storedData.usedHandTools || []);
            setUsedEquipment(storedData.usedEquipment || []);
            setUsedMobileMachines(storedData.usedMobileMachine || []);
            setUsedMaterials(storedData.usedMaterials || []);
            setUserIDs(normalizedSharedUsers);
            userIDsRef.current = normalizedSharedUsers;
            setLockUser(isViewer ? null : storedData.lockOwner?.username || null);
            setInApproval(Boolean(data.statusApproval));
            setInReview(Boolean(data.statusReview));

            // Suspend dirty tracking while the loaded JRA and its child tables
            // hydrate/normalise their persisted state.
            beginDirtyHydration();
            setFormData(storedData.formData || {});
            // Do not force a second formData write here. The first setFormData
            // already re-renders the page; a second write can consume the
            // dirty-suppression flag and make a freshly loaded draft look edited.
            setTitleSet(true);
            loadedIDRef.current = loadID;
            setLoadedID(loadID);
            // This is what's on the server right now, so nothing is "dirty" yet.
            isDirtyRef.current = false;
            setCanRemove(canRemove);
            setReadOnly(previewOnly || Boolean(data.readOnly) || isRejectedFromServer);
            setIsRejected(isRejectedFromServer);
            setVersionInfo(versionPreview ? (data.version || null) : null);
            setOwner(isOwner)
            setIsViewer(isViewer);
            setIsPublisher(isPublisher);
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
                setShowReshareDraft(false);
            } else if (isWithdrawn && normalizedSharedUsers.length <= 1) {
                // Only the owner is on this draft, so there's no one to reshare with —
                // silently take the "do not reshare" path instead of showing the popup.
                setShowReshareDraft(false);
                resolveWithdrawnDraft(false, { silent: true });
            } else {
                setShowReshareDraft(isWithdrawn);
            }

            requestAnimationFrame(() => {
                scrollableRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
            });
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const capitalizeWords = (text) =>
        text
            .toLowerCase()
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    const updateRefRow = (index, field, value) => {
        const updatedRefRows = [...formData.references];
        updatedRefRows[index][field] = value;  // Update the specific field in the row

        setFormData({
            ...formData,
            references: updatedRefRows,  // Update the procedure rows in state
        });
    };

    const [formData, setFormData] = useState({
        title: "",
        documentType: useParams().type,
        introInfo: {
            description: "", start: "", end: "", mainArea: "", subArea: "", owner: "", inCharge: "", members: [{ id: uuidv4(), member: "" }],
            otherAffected: "", howAffected: "", isProcedure: "", procedures: { id: uuidv4(), procedure: "", ref: "", version: "", issueDate: "" }
        },
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
        jra: [
            {
                id: uuidv4(),
                nr: 1,
                main: "",
                rowFlagged: false,
                jraBody: [
                    {
                        idBody: uuidv4(),
                        subStepFlagged: false,
                        hazards: [{ hazard: "Work Execution", flagged: false }],            // now an array, one hazard per sub-step
                        UE: [{ ue: "Non-adherence to task step requirements / specifications", flagged: false }],                 // array of unwanted-events
                        sub: [{ task: "" }],    // array of sub-step objects
                        taskExecution: [{          // keep as object, A and R dropdowns
                            R: ""
                        }],
                        controls: [{ control: "" }],
                        go_noGo: [{ go: "" }]
                    }     // single textarea for notes
                ]
            }
        ],
        abbrRows: [],
        termRows: [],
        attendance: [
            {
                name: "", site: "", designation: "Facilitator", num: "", presence: "Absent"
            }
        ],
        PPEItems: [],
        HandTools: [],
        Equipment: [],
        MobileMachine: [],
        Materials: [],
        supportingDocuments: [],
        references: [],
        changeTable: [
            { changeVersion: "1", change: "New Document.", changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
        ],
    });

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
        if (readOnly) return;
        setErrors(prev => ({
            ...prev,
            site: false
        }))
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

    const formDataRef = useRef(formData);
    // True only when persisted JRA content has changed since the last successful
    // load/save. This is intentionally a ref so navigation/close checks are
    // immediate and do not depend on a state re-render.
    const isDirtyRef = useRef(false);

    // One-shot suppression is still useful for a server response that replaces
    // formData after save/update.
    const suppressDirtyRef = useRef(true); // true so the initial mount doesn't count as a user edit

    // JRA child tables initialise/normalise several persisted collections after
    // a draft is loaded (PPE, tools, equipment, materials, etc.). Those updates
    // are application hydration, not user edits. Keep dirty tracking suspended
    // until the loaded JRA has been quiet for a short period. Each automatic
    // persisted-state change during hydration restarts the quiet-period timer.
    const dirtyHydrationRef = useRef(false);
    const dirtyHydrationTimerRef = useRef(null);

    const finishDirtyHydrationAfterQuietPeriod = () => {
        if (dirtyHydrationTimerRef.current) {
            clearTimeout(dirtyHydrationTimerRef.current);
        }

        dirtyHydrationTimerRef.current = setTimeout(() => {
            dirtyHydrationRef.current = false;
            suppressDirtyRef.current = false;
            isDirtyRef.current = false;
            dirtyHydrationTimerRef.current = null;
        }, 250);
    };

    const beginDirtyHydration = () => {
        dirtyHydrationRef.current = true;
        suppressDirtyRef.current = true;
        isDirtyRef.current = false;
        finishDirtyHydrationAfterQuietPeriod();
    };

    // If the user starts editing while the JRA is still in its hydration window,
    // immediately end the suppression so their edit is never lost. Native input
    // and change events cover text fields, selects, dates, checkboxes, etc.
    const markUserEdit = () => {
        if (readOnlyRef.current) return;

        if (dirtyHydrationTimerRef.current) {
            clearTimeout(dirtyHydrationTimerRef.current);
            dirtyHydrationTimerRef.current = null;
        }

        dirtyHydrationRef.current = false;
        suppressDirtyRef.current = false;
        isDirtyRef.current = true;
    };

    useEffect(() => {
        return () => {
            if (dirtyHydrationTimerRef.current) {
                clearTimeout(dirtyHydrationTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (dirtyHydrationRef.current) {
            // Automatic JRA child-component normalisation can arrive in more
            // than one render. Wait until those persisted updates have settled.
            finishDirtyHydrationAfterQuietPeriod();
            return;
        }

        if (suppressDirtyRef.current) {
            suppressDirtyRef.current = false;
            return;
        }

        isDirtyRef.current = true;
    }, [
        formData,
        usedAbbrCodes,
        usedTermCodes,
        usedPPEOptions,
        usedHandTools,
        usedEquipment,
        usedMobileMachine,
        usedMaterials
    ]);

    const usedAbbrCodesRef = useRef(usedAbbrCodes);
    const usedTermCodesRef = useRef(usedTermCodes);
    const usedPPEOptionsRef = useRef(usedPPEOptions);
    const usedHandToolsRef = useRef(usedHandTools);
    const usedEquipmentRef = useRef(usedEquipment);
    const usedMobileMachineRef = useRef(usedMobileMachine);
    const usedMaterialsRef = useRef(usedMaterials);
    const userIDsRef = useRef(userIDs);
    const userIDRef = useRef(userID);
    const draftOwnerIdRef = useRef('');
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

    useEffect(() => {
        if (versionPreview) return;
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
    }, [formData.title, versionPreview]);

    const autoSaveDraft = () => {
        if (versionPreview) return;
        if (readOnly) return;
        if (readOnlyRef.current) return;
        if (formData.title.trim() === "") return; // Don't save without a valid title

        if (loadedIDRef.current === '') {
            saveData(null, { skipFileUpload: false });
            console.log("📝 autoSaveDraft() triggered 1");
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Draft has been auto-saved", {
                closeButton: true,
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            updateData(userIDsRef.current, { skipFileUpload: false });
            console.log("📝 autoSaveDraft() triggered 2");
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.success("Draft has been auto-saved", {
                closeButton: true,
                style: {
                    textAlign: 'center'
                }
            });
        }
    };

    const [history, setHistory] = useState([]);
    const timeoutRef = useRef(null);
    const previousFormData = useRef(formData);
    const [redoHistory, setRedoHistory] = useState([]);

    // Function to save to history with a limit
    const saveToHistory = useCallback(() => {
        const currentState = {
            formData: JSON.parse(JSON.stringify(formData)),
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
        if (formData.abbrRows.length === 0) newErrors.abbrs = true;
        if (formData.termRows.length === 0) newErrors.terms = true;

        if (formData.rows.length === 0) {
            newErrors.signs = true;
        } else {
            formData.rows.forEach((row, index) => {
                if (!row.name) newErrors.signs = true;
            });
        }

        ["description", "start", "end", "mainArea", "subArea", "owner", "inCharge"].forEach(field => {
            if (!formData.introInfo[field]) {
                newErrors.introInfo = true;
            }
        });

        if (formData.attendance.length === 0) {
            newErrors.attend = true;
        } else {
            formData.attendance.forEach((row, index) => {
                if (!row.name) newErrors.attend = true;
                if (!row.site) newErrors.attend = true;
                if (!row.designation) newErrors.attend = true;
            });
        }

        if (formData.jra.length === 0) {
            newErrors.jra = true;
        } else {
            formData.jra.forEach((row, index) => {
                if (!row.main) newErrors.jra = true;
            });
        }

        return newErrors;
    };

    // Authentication check
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
            setUserIDs(normalizeSharedUsers([], decodedToken.userId));
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

    const updateRefRows = (newRef) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            references: newRef, // Update procedureRows with new data
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

    // Send data to backend to generate a Word document
    const handleGenerateJRADocument = async () => {
        const dataToStore = {
            formData: formData,
        };

        if (generatePopup) {
            setGeneratePopup(false);
        }
        const documentName = (formData.title) + ' ' + formData.documentType + " and PTO";

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/t/generate-jra-sheet1`, {
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
            openDraftNote();
        } catch (error) {
            console.error("Error generating document:", error);
        }
    };

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

        const documentName = capitalizeWords(formData.title) + ' ' + formData.documentType + " Attendance Register";
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

    const handleJRAPublish = async () => {
        const dataToStore = {
            usedAbbrCodes,       // your current state values
            usedTermCodes,
            usedEquipment,
            usedHandTools,
            usedMaterials,
            usedMobileMachine,
            usedPPEOptions,
            formData,
            userID,
            azureFN: "",
            draftID: loadedIDRef.current,
        };

        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/t/publish-jra-sheet1`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");

            toast.success(`Document published`, {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });

            setLoading(false);

            setTimeout(() => {
                navigate('/FrontendDMS/generatedJRADocs'); // Redirect to the generated file info page
            }, 1000);
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    const handlePublishApprovalFlow = async (approversValue) => {
        const dataToStore = {
            draftID: loadedIDRef.current,
            authorizations: (formDataRef.current?.rows ?? []).map(r => ({
                auth: r.auth,     // "Author" | "Reviewer" | "Approver" etc
                name: r.name,     // username
                pos: r.pos,       // position
                num: r.num
            })),
        };

        setLoading(true);
        await updateData(userIDsRef.current);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/start-approval-jra-draft`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");
            const data = await response.json();

            toast.success(`JRA Publishing Approval Started.`, {
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

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            setApproveState(true);
        }
    };

    const approveDraft = async () => {
        const dataToStore = {
            draftID: loadedIDRef.current
        };

        setLoading(true);
        await updateData(userIDsRef.current);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/approve-draft-jra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");
            const data = await response.json();

            toast.success(`JRA Successfully Approved.`, {
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
                handleJRAPublish()
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/reject-draft-jra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ draftID: loadedIDRef.current, message }),
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
            draftID: loadedIDRef.current
        };

        setRemovingApproval(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/remove-from-approval-jra-draft`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to remove document from the approval process");

            toast.success(`JRA Removed From The Approval Process.`, {
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
            setCanRemove(false);
            loadData(riskId);
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

    const resolveWithdrawnDraft = async (reshare, options = {}) => {
        const { silent = false } = options;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/blra/resolveWithdrawn/${loadedIDRef.current}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ reshare }),
            });

            if (!response.ok) throw new Error("Failed to update draft");

            if (!silent) {
                toast.success(
                    reshare
                        ? `Draft reshared with previous collaborators.`
                        : `Draft has not been reshared with previous collaborators.`,
                    {
                        closeButton: true,
                        autoClose: 1500,
                        style: {
                            textAlign: 'center'
                        }
                    }
                );
            }

            // Refresh so userIDs/share role/etc. reflect the server's decision.
            loadData(riskId);
        } catch (error) {
            console.error("Error resolving withdrawn draft:", error);
            if (!silent) {
                toast.error("Failed to update draft", {
                    closeButton: true,
                    autoClose: 1500,
                    style: {
                        textAlign: 'center'
                    }
                });
            }
        } finally {
            setShowReshareDraft(false);
        }
    };

    const handleReshareDraft = () => resolveWithdrawnDraft(true);
    const handleDoNotReshareDraft = () => resolveWithdrawnDraft(false);

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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/jra/resolveRejected/${loadedIDRef.current}`, {
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

            // Regardless of whether this draft was ever withdrawn, the owner now
            // needs to decide whether to keep working with the previous
            // collaborators — unless there's no one to reshare with in the first
            // place (same guard used for withdrawn drafts).
            setShowReshareDraft(userIDsRef.current.length > 1);
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

    useEffect(() => {
        if (riskId === "new") {
            return;
        }
        else {
            loadData(riskId);
        }
    }, [riskId, versionPreview, versionNumber])

    const releaseLock = async () => {
        if (versionPreview) return true;
        if (!loadedIDRef.current) return true;

        try {
            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/riskDraft/jra/releaseLock/${loadedIDRef.current}`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Failed to release lock");
            }

            return true;
        } catch (error) {
            console.error("Error releasing lock:", error);
            return false;
        }
    };

    // ── Navigation guard helpers ────────────────────────────────────────────
    const openSaveConfirm = (triggerType, action) => {
        setSaveConfirmTrigger(triggerType);
        pendingActionRef.current = action;
        setIsSaveConfirmOpen(true);
    };

    const requiresSavePrompt = () => !versionPreview && !readOnlyRef.current && !!loadedIDRef.current && isDirtyRef.current;

    // Skips the save-confirmation popup entirely: releases the lock (so the
    // document isn't left checked out) and runs the pending navigation
    // action directly. This is the "no save needed" / silent-no path.
    const leaveWithoutPrompt = async (action) => {
        await releaseLock();
        loadedIDRef.current = '';
        setLoadedID('');
        isDirtyRef.current = false;
        action();
    };

    const handleBack = () => {
        if (!requiresSavePrompt()) { leaveWithoutPrompt(() => navigate(-1)); return; }
        openSaveConfirm("back", () => navigate(-1));
    };

    const handleHomeNav = () => {
        if (!requiresSavePrompt()) { leaveWithoutPrompt(() => navigate("/FrontendDMS/home")); return; }
        openSaveConfirm("home", () => navigate("/FrontendDMS/home"));
    };

    const handleRefreshNav = () => {
        if (!requiresSavePrompt()) { leaveWithoutPrompt(() => window.location.reload()); return; }
        openSaveConfirm("refresh", () => window.location.reload());
    };

    const handleBackSaveConfirm = async () => {
        const result = await updateData(userIDsRef.current);

        if (!result?.ok) {
            toast.dismiss();
            toast.clearWaitingQueue();
            toast.error("Failed to save draft.", {
                closeButton: true,
                autoClose: 1200,
                style: { textAlign: "center" }
            });
            return;
        }

        toast.dismiss();
        toast.clearWaitingQueue();
        toast.success("Draft has been saved.", {
            closeButton: true,
            autoClose: 1200,
            style: { textAlign: "center" }
        });

        await releaseLock();

        setTimeout(() => {
            loadedIDRef.current = '';
            setLoadedID('');
            setIsSaveConfirmOpen(false);
            if (pendingActionRef.current) pendingActionRef.current();
            pendingActionRef.current = null;
        }, 1500);
    };

    const handleBackDiscard = async () => {
        await releaseLock();
        loadedIDRef.current = '';
        setLoadedID('');
        setIsSaveConfirmOpen(false);
        if (pendingActionRef.current) pendingActionRef.current();
        pendingActionRef.current = null;
    };

    const handleCancelSave = async () => {
        setIsSaveConfirmOpen(false);
        pendingActionRef.current = null;
    };

    useTauriCloseGuard(
        requiresSavePrompt,
        (closeWindow) => openSaveConfirm("close", closeWindow),
        {
            // Even when there's nothing to save, a loaded draft still holds a
            // server-side lock that must be released before the window closes.
            shouldCleanup: () => !versionPreview && !readOnlyRef.current && !!loadedIDRef.current,
            onSilentClose: (closeWindow) => { leaveWithoutPrompt(closeWindow); },
        }
    );

    return (
        <div
            className="risk-create-container"
            onInputCapture={markUserEdit}
            onChangeCapture={markUserEdit}
        >
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={handleHomeNav} title="Home" />
                        <p className="logo-text-um">Risk Management</p>
                    </div>

                    <div className="button-container-create">
                        <button className="but-um" onClick={() => navigate('/FrontendDMS/riskManagementDrafts/jra')}>
                            <div className="button-content">
                                <span className="button-logo-custom" aria-hidden="true">
                                    <FontAwesomeIcon icon={faFolderOpenSolid} className="icon-base-draft" />
                                    <FontAwesomeIcon icon={faArrowUp} className="icon-badge-draft" />
                                </span>
                                <span className="button-text">Saved Drafts</span>
                            </div>
                        </button>

                        {canIn(access, "RMS", ["systemAdmin", "contributor"]) && (
                            <button className="but-um" onClick={() => navigate('/FrontendDMS/generatedJRADocs')}>
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                                    <span className="button-text">Pending Sign Off</span>
                                </div>
                            </button>
                        )}

                        {canIn(access, "RMS", ["systemAdmin", "contributor"]) && (
                            <button className="but-um" onClick={() => navigate('/signedOffJRA')}>
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                                    <span className="button-text">Controlled</span>
                                </div>
                            </button>
                        )}

                        <div className="horizontal-divider-with-icon">
                            <hr />
                            <div className="divider-icon">
                                <FontAwesomeIcon icon={faInfo} onClick={openWorkflow} />
                            </div>
                            <hr />
                        </div>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={"/jra2.svg"} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{riskType}</p>
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

            {share && <SharePageRisk closePopup={closeShare} userID={userID} userIDs={userIDs} popupVisible={share} saveData={updateData} setUserIDs={setUserIDs} />}
            {isLoadPopupOpen && <LoadRiskDraftPopup riskType={riskType} isOpen={isLoadPopupOpen} onClose={closeLoadPopup} setLoadedID={setLoadedID} loadData={loadData} userID={userID} />}
            <div className="main-box-risk-create">
                <div className="top-section-risk-create-page">
                    <div className="icons-container-risk-create-page">
                        <div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faArrowLeft} onClick={handleBack} title="Back" />
                        </div>

                        {!versionPreview && !readOnly && userIDs.length > 1 && (
                            <div className="burger-menu-icon-risk-create-page-1">
                                {isSavingVersion ? (
                                    <FontAwesomeIcon icon={faSpinner} spin title="Saving Version" />
                                ) : (
                                    <span className="fa-layers fa-fw" style={{ fontSize: "24px" }} onClick={handleSaveVersion} title="Save As New Version">
                                        {/* base floppy-disk, full size */}
                                        <FontAwesomeIcon icon={faSave} />
                                        {/* pen, shrunk & nudged down/right into corner */}
                                        <FontAwesomeIcon
                                            icon={faPen}
                                            transform="shrink-6 down-5 right-7"
                                            color="gray"   /* or whatever contrast you need */
                                        />
                                    </span>
                                )}
                            </div>
                        )}

                        {!readOnly && (
                            <div className="burger-menu-icon-risk-create-page-1">
                                <FontAwesomeIcon icon={faFloppyDisk} title="Save" onClick={handleSave} />
                            </div>
                        )}

                        {(
                            <div className="burger-menu-icon-risk-create-page-1">
                                <FontAwesomeIcon icon={faCopy} onClick={openSaveAs} title="Create Copy" />
                            </div>
                        )}

                        {!readOnly && (
                            <div className="burger-menu-icon-risk-create-page-1">
                                <FontAwesomeIcon icon={faRotateLeft} onClick={undoLastChange} title="Undo" />
                            </div>
                        )}

                        {!readOnly && (
                            <div className="burger-menu-icon-risk-create-page-1">
                                <FontAwesomeIcon icon={faRotateRight} onClick={redoChange} title="Redo" />
                            </div>
                        )}

                        {(!readOnly && owner) && (
                            <div className="burger-menu-icon-risk-create-page-1">
                                <FontAwesomeIcon icon={faShareNodes} onClick={openShare} className={`${!loadedID ? "disabled-share" : ""}`} title="Share" />
                            </div>
                        )}

                        {!readOnly && !inReview && !inApproval && (isPublisher || owner) && canIn(access, "DDS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faUpload} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handlePubClick} title="Publish" />
                        </div>)}

                        {(inApproval || inReview) && !readOnly && canIn(access, "RMS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon style={{ color: "#7EAC89" }} icon={faCheckCircle} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleApproveClick} title="Approve Draft" />
                        </div>)}

                        {(inApproval || inReview) && !readOnly && canIn(access, "RMS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon style={{ color: "#CB6F6F" }} icon={faTimesCircle} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleRejectClick} title="Reject Document" />
                        </div>)}

                        {false && canRemove && (inApproval || inReview) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faBan} onClick={openRemoveApproval} title="Remove From Approval Process" style={{ color: "#CB6F6F" }} />
                        </div>)}
                    </div>

                    {isSaveMenuOpen && (<SavePopup isOpen={isSaveMenuOpen} closeSaveMenu={closeSaveMenu} save={handleSave} openSaveAs={openSaveAs} />)}

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBarDD refreshable={false} canIn={canIn} access={access} menu={"1"} create={true} risk={true} onHome={handleHomeNav} onRefresh={handleRefreshNav} />
                </div>

                {isRejected && (<div className="input-row">
                    <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#CB6F6F", color: "white", fontWeight: "bold" }}>
                        This document is in Read Only Mode as it has been rejected and requires document owner intervention.
                    </div>
                </div>)}

                {(!isViewer && !readOnly && (inApproval || inReview)) && (<div className="input-row">
                    <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#7EAC89", color: "white", fontWeight: "bold" }}>
                        To approve this document, click on the green circle above.
                    </div>
                </div>)}

                {(isViewer && readOnly && !isRejected) && (<div className="input-row">
                    <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#FFFF89", color: "black", fontWeight: "bold" }}>
                        View-only access. Please contact the owner to request edit access.
                    </div>
                </div>)}

                <div className={`scrollable-box-risk-create`} ref={scrollableRef}>
                    {versionPreview && versionInfo && (
                        <div className="input-row">
                            <div
                                className="input-box-aim-cp"
                                style={{ marginBottom: "10px", background: "#002060", color: "white", fontWeight: "bold" }}
                            >
                                Viewing {versionInfo.label} - read only historical version.
                            </div>
                        </div>
                    )}

                    {(!signedOffPreview && !versionPreview && !isViewer && readOnly && !inReview && !inApproval && !isRejected) && (<div className="input-row">
                        <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#CB6F6F", color: "white", fontWeight: "bold" }}>
                            The draft is in Read Only Mode as the following user is modifying the draft: {lockUser}
                        </div>
                    </div>)}

                    {(!versionPreview && !isViewer && readOnly && (inReview || inApproval) && !isRejected) && (<div className="input-row">
                        <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#FFFF89", color: "black", fontWeight: "bold" }}>
                            This document is currently in the approval process
                        </div>
                    </div>)}

                    <div className="input-row-risk-create" onClick={() => console.log(formData)}>
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
                                    placeholder="Insert the Risk Assessment Title (E.g. Perform Earth Leakage Test on Electrical Circuits)"
                                    readOnly={readOnly || Boolean(loadedID)}
                                />
                                <span className="type-risk-create-JRA">{formData.documentType + " and PTO"}</span>
                            </div>
                            {Boolean(loadedID) && !readOnly && (
                                <button
                                    type="button"
                                    className="generate-button font-fam"
                                    onClick={openRenamePopup}
                                    disabled={readOnly}
                                    title={readOnly ? "This draft is currently locked" : "Rename this draft"}
                                    style={{ marginTop: "15px" }}
                                >
                                    Rename Document
                                </button>
                            )}
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
                                    inputClass='date-input-risk-create'
                                    readOnly={readOnly}
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
                    <AbbreviationTableRisk collapsible={true} readOnly={readOnly} risk={true} formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} error={errors.abbrs} userID={userID} setError={setErrors} />
                    <TermTableRisk collapsible={true} readOnly={readOnly} risk={true} formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} error={errors.terms} userID={userID} setError={setErrors} />
                    <IntroTaskInfo collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} error={errors.introInfo} setErrors={setErrors} />
                    <PPETableRisk collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedPPEOptions={usedPPEOptions} setUsedPPEOptions={setUsedPPEOptions} userID={userID} />
                    <HandToolsTableRisk collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedHandTools={usedHandTools} setUsedHandTools={setUsedHandTools} userID={userID} />
                    <MaterialsTableRisk collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedMaterials={usedMaterials} setUsedMaterials={setUsedMaterials} userID={userID} />
                    <EquipmentTableRisk collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedEquipment={usedEquipment} setUsedEquipment={setUsedEquipment} userID={userID} />
                    <MobileMachineTableRisk collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedMobileMachine={usedMobileMachine} setUsedMobileMachine={setUsedMobileMachines} userID={userID} />
                    <AttendanceTable collapsible={true} title={formData.title} documentType={formData.documentType} readOnly={readOnly} rows={formData.attendance} addRow={addAttendanceRow} error={errors.attend} removeRow={removeAttendanceRow} updateRows={updateAttendanceRows} userID={userID} generateAR={handleClick} setErrors={setErrors} />
                    <JRATable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} isSidebarVisible={isSidebarVisible} error={errors.jra} setErrors={setErrors} />
                    <OtherTeam collapsible={false} formData={formData} />
                    <SupportingDocumentTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} />
                    <ReferenceTable collapsible={true} readOnly={readOnly} referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} setErrors={setErrors} error={errors.reference} required={false} />

                    <div className="input-row-buttons-risk-create">
                        {/* Generate File Button */}
                        <button
                            className="generate-button font-fam"
                            onClick={handleClick3}
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
            {isSaveAsModalOpen && (<SaveAsPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.title} type={riskType} userID={userID} create={false} />)}
            {isRenamePopupOpen && (
                <RenameDraftPopup
                    onClose={closeRenamePopup}
                    onRename={handleRenameDraft}
                    current={formData.title}
                    draftId={loadedIDRef.current || loadedID}
                    siblingDraftsRoute={`${process.env.REACT_APP_URL}/api/riskDraft/jra/drafts/${userID}`}
                    titleField="title"
                />
            )}
            <ToastContainer />

            {showSiteDropdown && filteredSites.length > 0 && (
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
            {generatePopup && (<GenerateDraftPopup deleteDraft={handleGenerateJRADocument} closeModal={closeGenerate} cancel={cancelGenerate} />)}
            {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}
            {showWorkflow && (<DocumentWorkflow setClose={closeWorkflow} />)}
            {approval && (<ApproversPopup closeModal={closeApproval} handleSubmit={handlePublishApprovalFlow} />)}
            {approveState && (<ApproveApprovalProcessPopup approveDraft={approveDraft} closeModal={closeApprovePopup} loading={loading} />)}
            {isDuplicateName && (<DuplicateName current={formDataRef.current.title} saveAs={saveDraftName} />)}
            {isSaveConfirmOpen && (
                <SaveConfirmationPopup
                    setIsSaveModalOpen={setIsSaveConfirmOpen}
                    onConfirmSave={handleBackSaveConfirm}
                    onDiscard={handleBackDiscard}
                    onCancel={handleCancelSave}
                    draftTitle={formData.title}
                    triggerType={saveConfirmTrigger}
                />
            )}
            {rejectState && (<RejectReason isOpen={rejectState} onClose={closeRejectPopup} onSubmit={rejectDraft} loading={rejecting} />)}
            {removeApprovalState && (
                <RemoveFromApprovalPopup
                    closeModal={closeRemoveApproval}
                    removeApproval={removeFromApprovalProcess}
                    docType="JRA draft"
                    title={formData.title}
                    loading={removingApproval}
                />
            )}
            {isSaving && (
                <SavingInProgress />
            )}
            {showReshareDraft && (<ReshareDraftPopup reshare={handleReshareDraft} doNotReshare={handleDoNotReshareDraft} />)}
            {showRejectReasonView && (
                <RejectReasonView
                    rejectorName={rejectionInfo.rejectorName}
                    rejectDate={formatRejectDate(rejectionInfo.rejectDate)}
                    rejectionReason={rejectionInfo.rejectionMessage}
                    reviewDocument={handleReviewRejectedDraft}
                />
            )}
            {isPublishing && (
                <PublishingInProgress />
            )}
        </div>
    );
};

export default RiskManagementPageJRA;