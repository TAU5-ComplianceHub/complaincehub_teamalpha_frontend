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
import 'react-toastify/dist/ReactToastify.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faShareNodes, faUpload, faRotateRight, faChevronLeft, faChevronRight, faInfoCircle, faMagicWandSparkles, faSave, faPen, faArrowLeft, faArrowUp, faCaretLeft, faCaretRight, faInfo, faCalendarDays, faDownload, faCheckCircle, faBan, faCopy, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons"
import TopBarDD from "../Notifications/TopBarDD";
import AttendanceTable from "../RiskRelated/AttendanceTable";
import DocumentSignaturesRiskTable from "../RiskRelated/DocumentSignaturesRiskTable";
import IBRATable from "../RiskRelated/IBRATable";
import SupportingDocumentTable from "../RiskRelated/SupportingDocumentTable";
import ControlAnalysisTable from "../RiskRelated/ControlAnalysisTable";
import LoadRiskDraftPopup from "../RiskRelated/LoadRiskDraftPopup";
import SharePageRisk from "../RiskRelated/SharePageRisk";
import RiskAim from "../RiskRelated/RiskInfo/RiskAim";
import RiskScope from "../RiskRelated/RiskInfo/RiskScope";
import ExecutiveSummary from "../RiskRelated/ExecutiveSummary";
import PicturesTable from "../CreatePage/PicturesTable";
import SaveAsPopup from "../Popups/SaveAsPopup";
import RenameDraftPopup from "../Popups/RenameDraftPopup";
import SavePopup from "../Popups/SavePopup";
import GenerateDraftPopup from "../Popups/GenerateDraftPopup";
import DraftPopup from "../Popups/DraftPopup";
import DocumentWorkflow from "../Popups/DocumentWorkflow";
import { getCurrentUser, can, canIn, isAdmin } from "../../utils/auth";
import DatePicker from "react-multi-date-picker";
import RelevantControlsTable from "../RiskRelated/RelevantControlsTable";
import ControlPopupNote from "../Popups/ControlPopupNote";
import UnusedControlsPopup from "../RiskRelated/UnusedControlsPopup";
import ImportControlChanges from "../RiskRelated/ImportControlChanges";
import ControlChangesPopup from "../RiskRelated/ControlManagement/ControlChangesPopup";
import ApproversPopup from "../VisitorsInduction/InductionCreation/ApproversPopup"
import UpdatedControlsAvailable from "../RiskRelated/ControlManagement/UpdatedControlsAvailable";
import ApproveApprovalProcessPopup from "../Popups/ApproveApprovalProcessPopup";
import DuplicateName from "../Popups/DuplicateName";
import RiskAimComponent from "../RiskRelated/RiskAimComponent";
import RiskScopeIE from "../RiskRelated/RiskScopeIE";
import SaveConfirmationPopup from "../CreatePage/SaveConfirmationPopup";
import RemoveFromApprovalPopup from "../Popups/RemoveFromApprovalPopup";
import SavingInProgress from "../DocumentCreationPages/SavingInProgress";
import PublishingInProgress from "../DocumentCreationPages/PublishingInProgress";
import { useTauriCloseGuard } from "../../utils/useTauriCloseGuard";
import ReshareDraftPopup from "../Popups/ReshareDraftPopup";
import RejectReason from "../Popups/RejectReason";
import RejectReasonView from "../Popups/RejectReasonView";

const RiskManagementPageIBRA = ({ versionPreview = false, signedOffPreview = false }) => {
    const navigate = useNavigate();
    const [owner, setOwner] = useState(false);
    const riskType = useParams().type;
    const riskId = useParams().id;
    const versionNumber = useParams().version;
    const [share, setShare] = useState(false);
    const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [usedTermCodes, setUsedTermCodes] = useState([]);
    const access = getCurrentUser();
    const [lastAiRewrites, setLastAiRewrites] = useState({});
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
    const [loadingAimIndex, setLoadingAimIndex] = useState(null);
    const [loadingAim, setLoadingAim] = useState(false);
    const [loadingScope, setLoadingScope] = useState(false);
    const [loadingScopeI, setLoadingScopeI] = useState(false);
    const [loadingScopeE, setLoadingScopeE] = useState(false);
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [isRenamePopupOpen, setIsRenamePopupOpen] = useState(false);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
    const [controls, setControls] = useState([]);
    const [generatePopup, setGeneratePopup] = useState(false);
    const [unusedPopup, setUnusedPopup] = useState(false);
    const [draftNote, setDraftNote] = useState(null);
    const [showWorkflow, setShowWorkflow] = useState(null);
    const previewOnly = versionPreview || signedOffPreview;
    const [readOnly, setReadOnly] = useState(previewOnly);
    const [lockUser, setLockUser] = useState(null);
    const scrollableRef = useRef(null);
    const [allSystemControls, setAllSystemControls] = useState([]);
    const [importPopup, setImportPopup] = useState(false);
    const [diffsToImport, setDiffsToImport] = useState([]);
    const [controlsUpdatableCurrent, setControlsUpdatableCurrent] = useState([]);
    const [controlsUpdatableLatest, setControlsUpdatableLatest] = useState([]);
    const [importSelections, setImportSelections] = useState({});
    const [highlightedRows, setHighlightedRows] = useState([]);
    const [approval, setApproval] = useState(false);
    const [inApproval, setInApproval] = useState(false);
    const [unusedRelevantControlsHighlight, setUnusedRelevantControlsHighlight] = useState([]);
    const [updatedControlsPopup, setUpdatedControlsPopup] = useState(false);
    const shownUpdatedControlsForDraftRef = useRef(null);
    const [inReview, setInReview] = useState(false);
    const [approveState, setApproveState] = useState(false);
    const relevantControlsRef = useRef(null);
    const [isDuplicateName, setIsDuplicateName] = useState(false);
    const [loadingScopeIRewriteIndex, setLoadingScopeIRewriteIndex] = useState(null);
    const [loadingScopeERewriteIndex, setLoadingScopeERewriteIndex] = useState(null);
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

    const justLoadedDraftRef = useRef(false);

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

    const openWorkflow = () => {
        setShowWorkflow(true);
    }

    const closeWorkflow = () => {
        setShowWorkflow(false);
    }

    const openDraftNote = () => {
        setDraftNote(true);
    }

    const closeDraftNote = () => {
        setDraftNote(false);
    }

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

    const openRenamePopup = () => setIsRenamePopupOpen(true);
    const closeRenamePopup = () => setIsRenamePopupOpen(false);

    // Renames the currently loaded draft in place (title only) via the
    // dedicated rename endpoint, rather than re-saving the whole draft.
    const handleRenameDraft = async (newTitle) => {
        const activeId = loadedIDRef.current || loadedID;
        if (!activeId) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/ibra/rename/${activeId}`, {
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
                `${process.env.REACT_APP_URL}/api/riskDraft/ibra/versions/${activeDraftId}`,
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

    const saveDraft = async () => {
        if (!loadedIDRef.current) {
            await saveData();
        } else {
            await updateData(userIDsRef.current);
        }
    }

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

            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/ibra/safe`, {
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
            formData: formDataRef.current,
            userIDs: normalizedSharedUsers,
            updater: userIDRef.current,
            dateUpdated: new Date().toISOString(),
            userID
        };

        try {
            const body = buildDraftFormDataRequest(dataToStore, { skipFileUpload });

            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/ibra/modifySafe/${loadedIDRef.current}`, {
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

            if (hasUnusedControls()) {
                setUnusedPopup(true);
                return;
            }

            if (!readOnly) {
                toast.info("Saving draft…", { autoClose: false });
                await saveDraft();
                toast.dismiss();
                toast.success("Draft saved");
            }

            await handleGenerateIBRADocument();

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

    const closeUnused = () => {
        setUnusedPopup(false);
    }

    const handlePubClick = async () => {
        const newErrors = validateForm();
        setErrors(newErrors);

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

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: true,
                autoClose: 1500, // 1.5 seconds
                style: {
                    textAlign: 'center'
                }
            });
        } else {
            setIsPublishing(true);
            try {
                await handlePublishApprovalFlow();
            } finally {
                setIsPublishing(false);
            }
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

    const loadData = async (loadID) => {
        try {
            const token = localStorage.getItem("token");

            const loadUrl = signedOffPreview
                ? `${process.env.REACT_APP_URL}/api/fileGenDocs/signedOffIBRA/getFile/${loadID}`
                : versionPreview && versionNumber
                    ? `${process.env.REACT_APP_URL}/api/riskDraft/ibra/versions/${loadID}/${versionNumber}`
                    : `${process.env.REACT_APP_URL}/api/riskDraft/ibra/getDraft/${loadID}`;

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
            setUserIDs(normalizedSharedUsers);
            userIDsRef.current = normalizedSharedUsers;
            setLockUser(isViewer ? null : storedData.lockOwner?.username || null);

            const raw = storedData.formData || {};
            const patched = normalizeIbraFormData(raw);
            suppressDirtyRef.current = true;
            setFormData(patched);

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
            setInApproval(Boolean(data.statusApproval));
            setInReview(Boolean(data.statusReview));
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

            justLoadedDraftRef.current = true;
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
                id: uuidv4(), uniqueId: null, nr: 1, control: "", critical: "", act: "", activation: "", hierarchy: "", cons: "", quality: "", cer: "", notes: "", description: "", performance: "", dueDate: "", responsible: "", action: ""
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
        isRelevantControlsCollapsed: false
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
    // O(1) dirty flag: true once the user has actually edited formData since
    // the last successful sync with the server (initial load, manual save,
    // or auto-save). Checked as a plain ref read at navigation time.
    const isDirtyRef = useRef(false);
    // Set right before we overwrite formData ourselves (load / after a save)
    // so the [formData] effect below knows to skip marking it dirty.
    const suppressDirtyRef = useRef(true); // true so the initial mount doesn't count as a user edit

    useEffect(() => {
        if (suppressDirtyRef.current) {
            suppressDirtyRef.current = false;
            return;
        }
        isDirtyRef.current = true;
    }, [formData]);

    const usedAbbrCodesRef = useRef(usedAbbrCodes);
    const usedTermCodesRef = useRef(usedTermCodes);
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
        if (readOnlyRef.current) return;
        if (readOnly) return;
        if (formData.title.trim() === "") return;

        if (loadedIDRef.current === '') {
            if (riskType === "IBRA") {
                saveData(null, { skipFileUpload: false });
            }
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
            if (riskType === "IBRA") {
                updateData(userIDsRef.current, { skipFileUpload: false });
            }
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
        if (!formData.aim) newErrors.aim = true;
        if (!formData.scope) newErrors.scope = true;
        if (formData.abbrRows.length === 0) newErrors.abbrs = true;
        if (formData.termRows.length === 0) newErrors.terms = true;

        if (formData.rows.length === 0) {
            newErrors.signs = true;
        } else {
            formData.rows.forEach((row, index) => {
                if (!row.name) newErrors.signs = true;
            });
        }

        if (formData.attendance.length === 0) {
            newErrors.attend = true;
        } else {
            formData.attendance.forEach((row, index) => {
                if (!row.name) newErrors.attend = true;
                if (!row.site) newErrors.attend = true;
                if (!row.designation) newErrors.attend = true;
            });
        }

        if (formData.ibra.length === 0) {
            newErrors.ibra = true;
        } else {
            formData.ibra.forEach((row, index) => {
                if (!row.main) newErrors.ibra = true;
                if (!row.hazards) newErrors.ibra = true;
                if (!row.controls) newErrors.ibra = true;
                if (!row.UE) newErrors.ibra = true;
                if (!row.source) newErrors.ibra = true;
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

    const handleGenerateIncomplete = () => {
        setGeneratePopup(false);

        if (hasUnusedControls()) {
            setUnusedPopup(true);
            return;
        }

        handleGenerateIBRADocument();
    }

    const handleGenerateUnused = () => {
        setUnusedPopup(false);

        handleGenerateIBRADocument();
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

    const getSanitizedFormData = (sourceFormData) => ({
        ...sourceFormData,
        aim: sanitizeAimForStorage(sourceFormData.aim),
        scopeInclusions: sanitizeStructuredScopeField(sourceFormData.scopeInclusions),
        scopeExclusions: sanitizeStructuredScopeField(sourceFormData.scopeExclusions),
        execSummary: sanitizeExecSummaryForValidation(sourceFormData.execSummary)
    });

    // Send data to backend to generate a Word document
    const handleGenerateIBRADocument = async () => {
        const dataToStore = {
            formData: getSanitizedFormData(formData),
        };

        const documentName = (formData.title) + ' ' + formData.documentType;
        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/generate-ibra`, {
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

    const handleIBRAPublish = async () => {
        const dataToStore = {
            usedAbbrCodes,
            usedTermCodes,
            formData: getSanitizedFormData(formData),
            userID,
            azureFN: "",
            draftID: loadedIDRef.current,
        };

        setLoading(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskGenerate/publish-ibra`, {
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
                navigate('/FrontendDMS/generatedIBRADocs'); // Redirect to the generated file info page
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/start-approval-ibra-draft`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");
            const data = await response.json();

            toast.success(`IBRA Publishing Approval Started.`, {
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/approve-draft-ibra`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to generate document");
            const data = await response.json();

            toast.success(`IBRA Successfully Approved.`, {
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
                handleIBRAPublish()
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/reject-draft-ibra`, {
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/remove-from-approval-ibra-draft`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(dataToStore),
            });

            if (!response.ok) throw new Error("Failed to remove document from the approval process");

            toast.success(`IBAR Removed From The Approval Process.`, {
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

            suppressDirtyRef.current = true;
            setFormData(prev => ({
                ...prev,
                relevantControls: [...(prev.relevantControls || []), ...newRelevantRows]
            }));
        }
    }, [formData.ibra, allSystemControls]);

    // Helper: normalize control name
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
            category: pick("category"),
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

            const findSystemId = (name) => {
                const match = allSystemControls.find(sc => sc.control.trim().toLowerCase() === name.trim().toLowerCase());
                return match ? match._id : null;
            };

            // Build rows to add for missing controls
            const addedRows = missingNames.map(name => {
                const b = backendMap.get(name) || {};
                const sysId = findSystemId(name);

                const relevantMatch = (formData.relevantControls || []).find(
                    rc => norm(rc.control) === norm(name)
                );

                return {
                    id: uuidv4(),
                    control: name,
                    uniqueId: sysId || null,
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

            suppressDirtyRef.current = true;
            setFormData(prev => ({
                ...prev,
                cea: mergedInOrder
            }));
        };

        syncCEAFromIBRA();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.ibra]);

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
            suppressDirtyRef.current = true;
            setFormData(prev => ({
                ...prev,
                relevantControls: relevantChanged ? nextRelevantControls : prev.relevantControls,
                cea: ceaChanged ? nextCEA : prev.cea
            }));
        }
    }, [allSystemControls, formData.relevantControls, formData.cea]);

    const resolveWithdrawnDraft = async (reshare, options = {}) => {
        const { silent = false } = options;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/ibra/resolveWithdrawn/${loadedIDRef.current}`, {
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/ibra/resolveRejected/${loadedIDRef.current}`, {
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


    // Track which draft we've already checked (so we don't spam logs on every state change)
    const lastCheckedDraftIdRef = useRef(null);

    // Compare CEA rows against system controls and log differences
    const logCeaVsSystemControlDifferences = useCallback((ceaRows = [], systemControls = [], draftId = "") => {
        if (!Array.isArray(ceaRows) || !Array.isArray(systemControls)) return;

        const fieldsToCompare = [
            "description",
            "critical",
            "act",
            "activation",
            "hierarchy",
            "cons",
            "quality",
            "cer",
            "notes",
            "performance",
            "dueDate",
            "responsible",
            "action",
        ];

        const normalizeVal = (v) => (v == null ? "" : String(v).trim());

        // Map system controls by normalized control name
        const sysMap = new Map(
            systemControls
                .filter(c => c && normalizeVal(c.control))
                .map(c => [normalizeVal(c.control), c])
        );

        const diffs = [];

        ceaRows.forEach((row) => {
            const controlName = normalizeVal(row?.control);
            if (!controlName) return;

            const sys = sysMap.get(controlName);
            if (!sys) return; // only check rows that have a corresponding system control

            const mismatches = {};

            fieldsToCompare.forEach((key) => {
                const ceaVal = normalizeVal(row?.[key]);
                const sysVal = normalizeVal(sys?.[key]);

                // If system has a value (or even if it's blank) and it's not the same as draft -> log it.
                // (This catches "system updated" OR "draft diverged".)
                if (ceaVal !== sysVal) {
                    mismatches[key] = { cea: ceaVal, system: sysVal };
                }
            });

            if (Object.keys(mismatches).length > 0) {
                diffs.push({
                    draftId,
                    ceaRowId: row?.id,
                    nr: row?.nr,
                    control: controlName,
                    mismatches,
                });
            }
        });

        if (diffs.length > 0) {
            console.groupCollapsed(`🟧 CEA vs System Controls differences (${diffs.length}) [draft: ${draftId}]`);
            diffs.forEach(d => console.log(d));
            console.groupEnd();
        } else {
            console.log(`✅ CEA matches System Controls [draft: ${draftId}]`);
        }
    }, []);

    // Compare CEA rows against system controls and Trigger Popup
    useEffect(() => {
        if (readOnly) return;
        if (showReshareDraft) return;
        const draftId = loadedIDRef.current;

        console.log("Running CEA vs System Control check...", {
            draftId,
            ceaCount: formData?.cea?.length || 0,
            lastCheckedDraftId: lastCheckedDraftIdRef.current,
            diffsToImportCount: diffsToImport.length
        });

        if (!draftId) return;
        if (!formData?.cea || formData.cea.length === 0) return;

        const checkForUpdates = async () => {
            console.log("Checking for system control updates against CEA...");
            lastCheckedDraftIdRef.current = draftId;

            try {
                const res = await fetch(`${process.env.REACT_APP_URL}/api/riskInfo/controls-sync-map`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const { controls: syncData } = await res.json();

                console.log("Fetched system controls for sync check:", syncData);

                if (!syncData || !Array.isArray(syncData)) return;

                const normalizeVal = (v) => (v == null ? "" : String(v).trim());
                const normalizeKey = (v) => normalizeVal(v).toLowerCase();

                const fieldsToCompare = [
                    "description",
                    "critical",
                    "act",
                    "activation",
                    "hierarchy",
                    "cons",
                    "quality",
                    "performance",
                    "category"
                ];

                const mapIdToLatest = new Map();
                const mapNameToLatest = new Map();

                syncData.forEach(latestCtrl => {
                    mapIdToLatest.set(latestCtrl._id, latestCtrl);

                    if (Array.isArray(latestCtrl.previousIds)) {
                        latestCtrl.previousIds.forEach(prevId => {
                            mapIdToLatest.set(prevId, latestCtrl);
                        });
                    }

                    mapNameToLatest.set(normalizeKey(latestCtrl.control), latestCtrl);
                });

                const diffs = [];
                const silentIdUpdates = new Map();

                formData.cea.forEach((row) => {
                    const rowControlName = normalizeVal(row?.control);
                    const rowControlKey = normalizeKey(row?.control);
                    let sys = null;
                    let matchType = 'none';

                    if (row.uniqueId && mapIdToLatest.has(row.uniqueId)) {
                        sys = mapIdToLatest.get(row.uniqueId);
                        matchType = 'id';
                    }

                    if (!sys && rowControlKey && mapNameToLatest.has(rowControlKey)) {
                        sys = mapNameToLatest.get(rowControlKey);
                        matchType = 'name';
                    }

                    if (!sys) return;

                    const mismatches = {};
                    let hasDiff = false;

                    if (row.uniqueId !== sys._id) {
                        mismatches['uniqueId'] = { cea: row.uniqueId, system: sys._id };
                        hasDiff = true;
                    }

                    const sysControlName = normalizeVal(sys.control);
                    if (sysControlName !== rowControlName) {
                        mismatches['control'] = { cea: rowControlName, system: sysControlName };
                        hasDiff = true;
                    }

                    fieldsToCompare.forEach((key) => {
                        const ceaVal = normalizeVal(row?.[key]);
                        const sysVal = normalizeVal(sys?.[key]);
                        if (ceaVal !== sysVal) {
                            mismatches[key] = { cea: ceaVal, system: sysVal };
                            hasDiff = true;
                        }
                    });

                    const mismatchKeys = Object.keys(mismatches);
                    const idOnlyMismatch = mismatchKeys.length === 1 && mismatchKeys[0] === "uniqueId";

                    if (idOnlyMismatch) {
                        silentIdUpdates.set(row.id, sys._id);
                        return;
                    }

                    if (hasDiff) {
                        diffs.push({
                            ceaRowId: row.id,
                            currentName: rowControlName,
                            mismatches,
                            matchType,
                            systemLatestId: sys._id
                        });
                    }
                });

                if (silentIdUpdates.size > 0) {
                    suppressDirtyRef.current = true;
                    setFormData(prev => ({
                        ...prev,
                        cea: (prev.cea || []).map(row =>
                            silentIdUpdates.has(row.id)
                                ? { ...row, uniqueId: silentIdUpdates.get(row.id) }
                                : row
                        )
                    }));
                }

                if (diffs.length > 0) {
                    setDiffsToImport(diffs);

                    const fieldsToStore = [
                        "control",
                        "uniqueId",
                        "description",
                        "critical",
                        "act",
                        "activation",
                        "hierarchy",
                        "cons",
                        "quality",
                        "performance",
                        "category"
                    ];

                    const currentList = [];
                    const latestList = [];
                    const defaultSelections = {};

                    diffs.forEach(d => {
                        const ceaRow = formData.cea.find(r => r.id === d.ceaRowId);
                        if (!ceaRow) return;

                        const sys = syncData.find(c => c._id === d.systemLatestId) || null;
                        if (!sys) return;

                        const currentValues = {};
                        const latestValues = {};

                        fieldsToStore.forEach(f => {
                            if (f === "uniqueId") {
                                currentValues.uniqueId = ceaRow.uniqueId ?? "";
                                latestValues.uniqueId = sys._id ?? "";
                            } else if (f === "control") {
                                currentValues.control = (ceaRow.control ?? "").trim();
                                latestValues.control = (sys.control ?? "").trim();
                            } else {
                                currentValues[f] = ceaRow?.[f] ?? "";
                                latestValues[f] = sys?.[f] ?? "";
                            }
                        });

                        const lastUpdatedAt = sys.lastUpdatedAt ?? null;
                        const lastUpdatedBy = sys.lastUpdatedBy ?? null;

                        currentList.push({
                            ceaRowId: d.ceaRowId,
                            control: currentValues.control,
                            values: currentValues,
                            mismatches: d.mismatches,
                            lastUpdatedAt,
                            lastUpdatedBy,
                        });

                        latestList.push({
                            ceaRowId: d.ceaRowId,
                            control: latestValues.control,
                            values: latestValues,
                            mismatches: d.mismatches,
                            systemLatestId: d.systemLatestId,
                            lastUpdatedAt,
                            lastUpdatedBy,
                        });

                        defaultSelections[d.ceaRowId] = {};
                        Object.keys(d.mismatches).forEach(field => {
                            defaultSelections[d.ceaRowId][field] = true;
                        });
                    });

                    setControlsUpdatableCurrent(currentList);
                    setControlsUpdatableLatest(latestList);
                    setImportSelections(defaultSelections);

                    if (
                        justLoadedDraftRef.current &&
                        shownUpdatedControlsForDraftRef.current !== draftId
                    ) {
                        shownUpdatedControlsForDraftRef.current = draftId;
                        setUpdatedControlsPopup(true);
                        justLoadedDraftRef.current = false;
                    }
                } else {
                    setDiffsToImport([]);
                    setControlsUpdatableCurrent([]);
                    setControlsUpdatableLatest([]);
                    setImportSelections({});
                    setImportPopup(false);
                }
            } catch (error) {
                console.error("Error checking for control updates:", error);
            }
        };

        checkForUpdates();
    }, [loadedIDRef.current]);

    const handleImportConfirm = () => {
        if (diffsToImport.length === 0) {
            setImportPopup(false);
            return;
        }

        const updatesMap = {};
        const changedIds = [];
        const renames = [];

        diffsToImport.forEach(diff => {
            updatesMap[diff.ceaRowId] = diff.mismatches;
            changedIds.push(diff.ceaRowId);

            // Detect if this update involves a Rename
            if (diff.mismatches.control) {
                renames.push({
                    oldName: diff.mismatches.control.cea,
                    newName: diff.mismatches.control.system
                });
            }
        });

        // 1. Update CEA Table (The Source of Truth)
        const updatedCEA = formData.cea.map(row => {
            const updates = updatesMap[row.id];
            if (!updates) return row;

            const newRow = { ...row };

            // Apply all mismatched fields (Description, Hierarchy, etc.)
            Object.keys(updates).forEach(field => {
                if (updates[field]?.system !== undefined) {
                    newRow[field] = updates[field].system;
                }
            });

            // Explicitly ensure the uniqueId is updated to the latest System ID
            // (This "upgrades" the row from an old version ID to the current one)
            if (updates.uniqueId) {
                newRow.uniqueId = updates.uniqueId.system;
            }

            return newRow;
        });

        // 2. Propagate Renames to other tables
        let updatedIBRA = formData.ibra;
        let updatedRelevant = formData.relevantControls;

        if (renames.length > 0) {
            console.log("Applying Control Renames to IBRA/Relevant:", renames);

            renames.forEach(({ oldName, newName }) => {
                const normOld = oldName.trim();
                const normNew = newName.trim();

                // A. Update IBRA (The usage table)
                updatedIBRA = updatedIBRA.map(r => ({
                    ...r,
                    controls: r.controls.map(c => {
                        const cName = typeof c === 'string' ? c : c.control;
                        // If exact match, swap it
                        if (cName && cName.trim() === normOld) {
                            return normNew;
                        }
                        return c;
                    })
                }));

                // B. Update Relevant Controls (The selection list)
                updatedRelevant = updatedRelevant.map(r => ({
                    ...r,
                    control: r.control.trim() === normOld ? normNew : r.control
                }));
            });
        }

        // 3. Save State
        setFormData(prev => ({
            ...prev,
            cea: updatedCEA,
            ibra: updatedIBRA,
            relevantControls: updatedRelevant
        }));

        setHighlightedRows(changedIds);
        setImportPopup(false);
        setDiffsToImport([]);

        toast.success("Controls updated to latest system versions");
    };

    const handleImportCancel = () => {
        setImportPopup(false);
    };

    // NEW: Backfill uniqueId for legacy drafts (Normalization for IDs only)
    useEffect(() => {
        if (!allSystemControls.length || !formData.cea.length) return;

        let hasChanges = false;

        // Map system controls for fast lookup by Name
        const sysNameMap = new Map(
            allSystemControls.map(c => [c.control.trim().toLowerCase(), c._id])
        );

        const updatedCEA = formData.cea.map(row => {
            // If row already has an ID, skip
            if (row.uniqueId) return row;

            // If no ID, try to find a match by name in the system
            const sysId = sysNameMap.get((row.control || '').trim().toLowerCase());

            if (sysId) {
                hasChanges = true;
                return { ...row, uniqueId: sysId }; // Only assign the ID
            }
            return row;
        });

        if (hasChanges) {
            console.log("Backfilled uniqueIds for legacy CEA rows.");
            suppressDirtyRef.current = true;
            setFormData(prev => ({ ...prev, cea: updatedCEA }));
        }
    }, [allSystemControls, loadedIDRef.current]);

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
            suppressDirtyRef.current = true;
            setFormData(prev => ({
                ...prev,
                relevantControls: nextRelevantControls,
            }));
        }
    }, [allSystemControls, formData.relevantControls]);

    const hasControlUpdates = diffsToImport.length > 0;

    const importIconTitle = hasControlUpdates
        ? "Import updated controls"
        : "No new controls";

    const openImportPopup = () => {
        if (!hasControlUpdates) return;
        setImportPopup(true);
    };

    // selectedRows = array of rows from prevData (or your popup rows)
    // each row must contain: { ceaRowId, mismatches }
    const importNew = (selectedRows = []) => {
        if (!Array.isArray(selectedRows) || selectedRows.length === 0) {
            toast.info("No controls selected to import.");
            return;
        }

        const updatesMap = {};
        const changedIds = [];
        const renames = [];

        selectedRows.forEach(row => {
            if (!row?.ceaRowId || !row?.mismatches) return;

            updatesMap[row.ceaRowId] = row.mismatches;
            changedIds.push(row.ceaRowId);

            // Rename propagation if the control name changed
            if (row.mismatches.control) {
                renames.push({
                    oldName: row.mismatches.control.cea,
                    newName: row.mismatches.control.system
                });
            }
        });

        // 1) Update CEA table
        const updatedCEA = formData.cea.map(ceaRow => {
            const updates = updatesMap[ceaRow.id];
            if (!updates) return ceaRow;

            const newRow = { ...ceaRow };

            // Apply all changed fields (excluding uniqueId logic handled below)
            Object.keys(updates).forEach(field => {
                if (updates[field]?.system !== undefined) {
                    newRow[field] = updates[field].system;
                }
            });

            // Ensure uniqueId is upgraded to latest system id
            if (updates.uniqueId) {
                newRow.uniqueId = updates.uniqueId.system;
            }

            return newRow;
        });

        let updatedIBRA = formData.ibra;
        let updatedRelevant = formData.relevantControls;

        if (renames.length > 0) {
            renames.forEach(({ oldName, newName }) => {
                const normOld = (oldName ?? "").trim();
                const normNew = (newName ?? "").trim();

                updatedIBRA = updatedIBRA.map(r => ({
                    ...r,
                    controls: r.controls.map(c => {
                        const cName = typeof c === "string" ? c : c?.control;
                        if (cName && cName.trim() === normOld) return normNew;
                        return c;
                    })
                }));

                updatedRelevant = updatedRelevant.map(r => ({
                    ...r,
                    control: (r.control ?? "").trim() === normOld ? normNew : r.control
                }));
            });
        }

        setFormData(prev => ({
            ...prev,
            cea: updatedCEA,
            ibra: updatedIBRA,
            relevantControls: updatedRelevant
        }));

        // --- NEW: remove imported items from "pending updates" so they do not show again
        const importedIds = selectedRows.map(r => r.ceaRowId).filter(Boolean);
        const importedSet = new Set(importedIds);

        // 1) Remove from diffsToImport
        const remainingDiffs = diffsToImport.filter(d => !importedSet.has(d.ceaRowId));
        setDiffsToImport(remainingDiffs);

        // 2) Remove from the popup lists
        setControlsUpdatableCurrent(prev => prev.filter(r => !importedSet.has(r.ceaRowId)));
        setControlsUpdatableLatest(prev => prev.filter(r => !importedSet.has(r.ceaRowId)));

        // 3) Remove selections for imported rows
        setImportSelections(prev => {
            const next = { ...prev };
            importedIds.forEach(id => delete next[id]);
            return next;
        });

        // 4) Close popup only if nothing left to import
        if (remainingDiffs.length === 0) {
            setImportPopup(false);
            toast.success("All control updates imported.", { autoClose: 2000, closeButton: false });
        } else {
            toast.success("Selected controls imported.", { autoClose: 2000, closeButton: false });
        }

        setHighlightedRows(changedIds);
        setTimeout(() => {
            handleImportCancel();
        }, 2000);
    };


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

    const closeUpdatedControlsPopup = () => {
        setUpdatedControlsPopup(false);
        justLoadedDraftRef.current = false;
    };

    const importUpdatedControlsFromDraftLoad = () => {
        setUpdatedControlsPopup(false);
        justLoadedDraftRef.current = false;
        openImportPopup(); // same function used by Fetch Controls button
    };

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
    };

    const handleScopeSectionChange = (sectionKey, index, value) => {
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

    const releaseLock = async () => {
        if (versionPreview) return true;
        if (!loadedIDRef.current) return true;

        try {
            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/riskDraft/ibra/releaseLock/${loadedIDRef.current}`,
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

    const requiresSavePrompt = () => !versionPreview && !readOnly && !!loadedIDRef.current && isDirtyRef.current;

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

        if (!result) {
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
            shouldCleanup: () => !versionPreview && !readOnly && !!loadedIDRef.current,
            onSilentClose: (closeWindow) => { leaveWithoutPrompt(closeWindow); },
        }
    );

    return (
        <div className="risk-create-container">
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
                        <button className="but-um" onClick={() => navigate('/FrontendDMS/riskManagementDrafts/ibra')}>
                            <div className="button-content">
                                <span className="button-logo-custom" aria-hidden="true">
                                    <FontAwesomeIcon icon={faFolderOpenSolid} className="icon-base-draft" />
                                    <FontAwesomeIcon icon={faArrowUp} className="icon-badge-draft" />
                                </span>
                                <span className="button-text">Saved Drafts</span>
                            </div>
                        </button>

                        {canIn(access, "RMS", ["systemAdmin", "contributor"]) && (
                            <button className="but-um" onClick={() => navigate('/FrontendDMS/generatedIBRADocs')}>
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                                    <span className="button-text">Pending Sign Off</span>
                                </div>
                            </button>
                        )}

                        {canIn(access, "RMS", ["systemAdmin", "contributor"]) && (
                            <button className="but-um" onClick={() => navigate('/FrontendDMS/signedOffIBRA')}>
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
                        <img src={`${process.env.PUBLIC_URL}/ibra2.svg`} alt="Control Attributes" className="icon-risk-rm" />
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

                        {(!readOnly && owner && !inApproval) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon
                                icon={faDownload}
                                title={importIconTitle}
                                onClick={openImportPopup}
                                style={{
                                    cursor: hasControlUpdates ? "pointer" : "not-allowed",
                                    opacity: hasControlUpdates ? 1 : 0.4,
                                    userSelect: "none"
                                }}
                            />
                        </div>)}

                        {false && canRemove && (inApproval || inReview) && (<div className="burger-menu-icon-risk-create-page-1">
                            <FontAwesomeIcon icon={faBan} onClick={openRemoveApproval} title="Remove From Approval Process" style={{ color: "#CB6F6F" }} />
                        </div>)}
                    </div>

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

                    <div className="input-row-risk-create">
                        <div className={`input-box-title-risk-create ${errors.title ? "error-create" : ""}`}>
                            <h3 className="font-fam-labels" onClick={() => console.log(formData)}>Risk Assessment Title <span className="required-field">*</span></h3>
                            <div className="input-group-risk-create">
                                <input
                                    spellCheck="true"
                                    type="text"
                                    name="title"
                                    className="font-fam title-input"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Insert Risk Assessment Title (e.g., Working at Heights)"
                                    readOnly={readOnly || Boolean(loadedID)}
                                />
                                <span className="type-risk-create">{formData.documentType}</span>
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
                        readOnly={readOnly}
                        globalControls={allSystemControls}
                        onControlRename={handleControlRename}
                        isCollapsed={formData.isRelevantControlsCollapsed}
                        highlightedControlNames={unusedRelevantControlsHighlight}
                    />

                    <AbbreviationTableRisk collapsible={true} readOnly={readOnly} risk={true} formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} error={errors.abbrs} userID={userID} setError={setErrors} />
                    <TermTableRisk collapsible={true} readOnly={readOnly} risk={true} formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} error={errors.terms} userID={userID} setError={setErrors} />
                    <AttendanceTable collapsible={true} title={formData.title} documentType={formData.documentType} readOnly={readOnly} rows={formData.attendance} addRow={addAttendanceRow} error={errors.attend} removeRow={removeAttendanceRow} updateRows={updateAttendanceRows} userID={userID} generateAR={handleClick} setErrors={setErrors} />
                    {formData.documentType === "IBRA" && (<IBRATable collapsible={true} relevantControls={formData.relevantControls} readOnly={readOnly} rows={formData.ibra} error={errors.ibra} updateRows={updateIbraRows} updateRow={updateIBRARows} addRow={addIBRARow} removeRow={removeIBRARow} generate={handleClick2} isSidebarVisible={isSidebarVisible} setErrors={setErrors} />)}
                    {(["IBRA"].includes(formData.documentType)) && (<ControlAnalysisTable collapsible={true} readOnly={readOnly} error={errors.cea} rows={formData.cea} highlightedRows={highlightedRows} ibra={formData.ibra} updateRows={updateCEARows} onControlRename={handleControlRename} addRow={addCEARow} updateRow={updateCeaRows} removeRow={removeCEARow} title={formData.title} isSidebarVisible={isSidebarVisible} relevantControls={formData.relevantControls} />)}

                    <ExecutiveSummary
                        collapsible={true}
                        readOnly={readOnly}
                        formData={formData}
                        setFormData={setFormData}
                        setErrors={setErrors}
                        error={errors.execSummary}
                    />

                    <SupportingDocumentTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} />
                    <ReferenceTable collapsible={true} readOnly={readOnly} referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} setErrors={setErrors} error={errors.reference} required={false} />
                    <PicturesTable collapsible={true} readOnly={readOnly} picturesRows={formData.pictures} addPicRow={addPicRow} updatePicRow={updatePicRow} removePicRow={removePicRow} />

                    <div className="input-row-buttons-risk-create">
                        {/* Generate File Button */}
                        <button
                            className="generate-button font-fam"
                            disabled={useParams().type !== "IBRA"}
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
            <ToastContainer />
            {isSaveAsModalOpen && (<SaveAsPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.title} type={riskType} userID={userID} create={false} />)}
            {isRenamePopupOpen && (
                <RenameDraftPopup
                    onClose={closeRenamePopup}
                    onRename={handleRenameDraft}
                    current={formData.title}
                    draftId={loadedIDRef.current || loadedID}
                    siblingDraftsRoute={`${process.env.REACT_APP_URL}/api/riskDraft/ibra/drafts/${userID}`}
                    titleField="title"
                />
            )}
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
            {generatePopup && (<GenerateDraftPopup deleteDraft={handleGenerateIncomplete} closeModal={closeGenerate} cancel={cancelGenerate} />)}
            {unusedPopup && (<UnusedControlsPopup generate={handleGenerateUnused} closeModal={closeUnused} cancel={cancelGenerateUnused} />)}
            {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}
            {showWorkflow && (<DocumentWorkflow setClose={closeWorkflow} />)}
            {importPopup && (<ControlChangesPopup importNew={importNew} newData={controlsUpdatableLatest} prevData={controlsUpdatableCurrent} onClose={handleImportCancel} />)}
            {approval && (<ApproversPopup closeModal={closeApproval} handleSubmit={handlePublishApprovalFlow} />)}
            {updatedControlsPopup && owner && !inApproval && hasControlUpdates && (
                <UpdatedControlsAvailable
                    close={closeUpdatedControlsPopup}
                    importControls={importUpdatedControlsFromDraftLoad}
                    loading={loading}
                />
            )}
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
                    docType="IBRA draft"
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

export default RiskManagementPageIBRA;