import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import "./CreatePage.css";
import DocumentSignaturesTable from "../CreatePage/DocumentSignaturesTable";
import TermTable from "../CreatePage/TermTable";
import AbbreviationTable from "../CreatePage/AbbreviationTable";
import ReferenceTable from "../CreatePage/ReferenceTable";
import PicturesTable from "../CreatePage/PicturesTable";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling
import LoadDraftPopup from "../CreatePage/LoadDraftPopup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faChevronLeft, faChevronRight, faFileCirclePlus, faArrowLeft, faSort, faCircleUser, faBell, faShareNodes, faUpload, faRotateRight, faCircleExclamation, faPen, faSave, faArrowUp, faCaretLeft, faCaretRight, faMagicWandSparkles, faInfo, faCheckCircle, faBan, faCopy, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons"
import BurgerMenu from "../CreatePage/BurgerMenu";
import SharePage from "../CreatePage/SharePage";
import TopBarDD from "../Notifications/TopBarDD";
import ChapterTable from "../CreatePage/ChapterTable";
import StandardsTable from "../CreatePage/StandardsTable";
import SupportingDocumentTable from "../RiskRelated/SupportingDocumentTable";
import SaveAsPopup from "../Popups/SaveAsPopup";
import RenameDraftPopup from "../Popups/RenameDraftPopup";
import GenerateDraftPopup from "../Popups/GenerateDraftPopup";
import DraftPopup from "../Popups/DraftPopup";
import DocumentWorkflow from "../Popups/DocumentWorkflow";
import { getCurrentUser, can, canIn, isAdmin } from "../../utils/auth";
import ApproversPopup from "../VisitorsInduction/InductionCreation/ApproversPopup";
import ApproveApprovalProcessPopup from "../Popups/ApproveApprovalProcessPopup";
import DuplicateName from "../Popups/DuplicateName";
import AimBulletComponent from "../CreatePage/AimBulletComponent";
import ScopeBulletComponent from "../CreatePage/ScopeBulletComponent";
import SaveConfirmationPopup from "../CreatePage/SaveConfirmationPopup";
import RemoveFromApprovalPopup from "../Popups/RemoveFromApprovalPopup";
import SavingInProgress from "./SavingInProgress";
import PublishingInProgress from "./PublishingInProgress";
import { useTauriCloseGuard } from "../../utils/useTauriCloseGuard";
import ReshareDraftPopup from "../Popups/ReshareDraftPopup";
import RejectReason from "../Popups/RejectReason";
import RejectReasonView from "../Popups/RejectReasonView";

const CreatePageStandards = ({ versionPreview = false, signedOffPreview = false }) => {
  const navigate = useNavigate();
  const type = useParams().type;
  const draftId = useParams().id;
  const versionNumber = useParams().version;
  const access = getCurrentUser();
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [share, setShare] = useState(false);
  const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
  const [usedTermCodes, setUsedTermCodes] = useState([]);
  const [usedPPEOptions, setUsedPPEOptions] = useState([]);
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
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isRenamePopupOpen, setIsRenamePopupOpen] = useState(false);
  const loadedIDRef = useRef('');
  const [offlineDraft, setOfflineDraft] = useState(false);
  const [generatePopup, setGeneratePopup] = useState(false);
  const [loadingAim, setLoadingAim] = useState(false);
  const [loadingScope, setLoadingScope] = useState(false);
  const [draftNote, setDraftNote] = useState(null);
  const [showWorkflow, setShowWorkflow] = useState(null);
  const previewOnly = versionPreview || signedOffPreview;
  const [readOnly, setReadOnly] = useState(previewOnly);
  const [lockUser, setLockUser] = useState(null);
  const scrollBoxRef = useRef(null);
  const [owner, setOwner] = useState(false);
  const [approval, setApproval] = useState(false);
  const [inApproval, setInApproval] = useState(false);
  const [inReview, setInReview] = useState(false);
  const [approveState, setApproveState] = useState(false);
  const [rejectState, setRejectState] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [isDuplicateName, setIsDuplicateName] = useState(false);
  const [loadingAimIndex, setLoadingAimIndex] = useState(null);
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

  const closeApproval = () => {
    setApproval(false);
  }

  const openRemoveApproval = () => {
    setRemoveApprovalState(true);
  }

  const closeRemoveApproval = () => {
    setRemoveApprovalState(false);
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

  const [rewriteHistory, setRewriteHistory] = useState({
    aim: {},
    scope: {}
  });

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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/standards/rename/${activeId}`, {
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
  const closeShare = () => { setShare(false); };
  const openLoadPopup = () => setLoadPopupOpen(true);
  const closeLoadPopup = () => setLoadPopupOpen(false);

  // handleSave: this is the ONLY place a save/update toast should be shown from.
  // saveData()/updateData() are called from lots of other places (autosave,
  // save-before-navigate, etc.) where we intentionally do NOT want a toast, so
  // the success/failure messaging lives here, not inside saveData/updateData.
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
        `${process.env.REACT_APP_URL}/api/draft/standards/versions/${activeDraftId}`,
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

  const saveDataOffline = async (id) => {
    const ownerId = draftOwnerIdRef.current || userIDRef.current;

    const normalizedSharedUsers = normalizeSharedUsers(
      userIDsRef.current,
      ownerId
    );

    const dataToStore = {
      usedAbbrCodes: usedAbbrCodesRef.current,
      usedTermCodes: usedTermCodesRef.current,
      usedPPEOptions: usedPPEOptionsRef.current,
      usedHandTools: usedHandToolsRef.current,
      usedEquipment: usedEquipmentRef.current,
      usedMobileMachine: usedMobileMachineRef.current,
      usedMaterials: usedMaterialsRef.current,
      formData: formDataRef.current,
      userIDs: normalizedSharedUsers,
      creator: userIDRef.current,
      updater: null,
      dateUpdated: null,
      loadedID: id,
      date: Date.now()
    };

    localStorage.setItem('draftData', JSON.stringify(dataToStore));
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

    const normalizedSharedUsers = normalizeSharedUsers(
      userIDsRef.current,
      userIDRef.current
    );

    const dataToStore = {
      usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
      usedTermCodes: usedTermCodesRef.current,
      usedPPEOptions: usedPPEOptionsRef.current,
      usedHandTools: usedHandToolsRef.current,
      usedEquipment: usedEquipmentRef.current,
      usedMobileMachine: usedMobileMachineRef.current,
      usedMaterials: usedMaterialsRef.current,
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

      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/standards/safe`, {
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

      setOfflineDraft(false);
      localStorage.removeItem("draftData");

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
      saveDataOffline(""); // Fallback to offline save
      return { ok: false, duplicate: false, error };
    }
  };

  const updateData = async (selectedUserIDs, options = {}) => {
    const { skipFileUpload = false } = options;

    const ownerId = draftOwnerIdRef.current || userIDRef.current;

    const normalizedSharedUsers = normalizeSharedUsers(
      selectedUserIDs,
      ownerId
    );

    const dataToStore = {
      usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
      usedTermCodes: usedTermCodesRef.current,
      usedPPEOptions: usedPPEOptionsRef.current,
      usedHandTools: usedHandToolsRef.current,
      usedEquipment: usedEquipmentRef.current,
      usedMobileMachine: usedMobileMachineRef.current,
      usedMaterials: usedMaterialsRef.current,
      formData: formDataRef.current,
      userIDs: normalizedSharedUsers,
      updater: userIDRef.current,
      dateUpdated: new Date().toISOString(),
      userID
    };

    try {
      const body = buildDraftFormDataRequest(dataToStore, { skipFileUpload });

      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/standards/modifySafe/${loadedIDRef.current}`, {
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

      setOfflineDraft(false);
      localStorage.removeItem("draftData");

      console.log(result.message);
      return { ok: true, ...result };
    } catch (error) {
      console.error('Error saving data:', error);
      saveDataOffline(loadedIDRef.current);
      return { ok: false, error };
    }
  };

  const handleClick = () => {
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
    } else {
      handleGeneratePDF();  // Call your function when the form is valid
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
    const newErrors = validateForm();
    setErrors(newErrors);

    if (loadedID === '') {
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

  const loadData = async (loadID) => {
    try {
      const token = localStorage.getItem("token");

      const loadUrl = signedOffPreview
        ? `${process.env.REACT_APP_URL}/api/fileGenDocs/signedOffStandard/getFile/${loadID}`
        : versionPreview && versionNumber
          ? `${process.env.REACT_APP_URL}/api/draft/standards/versions/${loadID}/${versionNumber}`
          : `${process.env.REACT_APP_URL}/api/draft/standards/getDraft/${loadID}`;

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

      const rawForm = storedData.formData || {};
      const normalizedForm = {
        ...rawForm,
        aim: normalizeProcedureAim(rawForm.aim),
        scope: normalizeProcedureScope(rawForm.scope)
      };

      suppressDirtyRef.current = true;
      setFormData(normalizedForm);
      setFormData(prev => ({ ...prev }));
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
        scrollBoxRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
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
    aim: [{ type: "text", text: "The aim of the document is " }],
    scope: [{ type: "text", text: "" }],
    date: new Date().toLocaleDateString(),
    version: "1",
    rows: [
      { auth: "Author", name: "", pos: "", num: 1 },
      { auth: "Reviewer", name: "", pos: "", num: 2 },
      { auth: "Approver", name: "", pos: "", num: 3 },
    ],
    standard: [{
      id: uuidv4(), nr: 1, mainSection: "", details: [{ id: uuidv4(), nr: "1.1", minRequirement: "", reference: "", notes: "" }]
    }],
    abbrRows: [],
    termRows: [],
    chapters: [],
    references: [],
    supportingDocuments: [],
    pictures: [],
    reviewDate: 0,
    changeTable: [
      { changeVersion: "1", change: "New Document.", changeDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
    ],
  });

  useEffect(() => {
    const hasActiveError = Object.values(errors).some(val => val === true);

    if (hasActiveError) {
      const newErrors = validateFormRevised();
      setErrors(newErrors);
    }
  }, [formData]);

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

  const updateRefRows = (newRef) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      references: newRef, // Update procedureRows with new data
    }));
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

    if (formData.standard.length === 0) {
      newErrors.standard = true;
    } else {
      formData.standard.forEach((row, index) => {
        if (!row.mainSection) newErrors.standard = true;
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

    return newErrors;
  };

  const validateFormRevised = () => {
    const newErrors = errors;
    if (!formData.reviewDate) { newErrors.reviewDate = true } else {
      newErrors.reviewDate = false;
    };
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
        autoClose: 1500,
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
    const dataToStore = {
      usedAbbrCodes,
      usedTermCodes,
      usedPPEOptions,
      usedHandTools,
      usedEquipment,
      usedMobileMachine,
      usedMaterials,
      formData: getSanitizedFormData(formData),
      userID,
      azureFN: ""
    };

    if (generatePopup) {
      setGeneratePopup(false);
    }
    const documentName = capitalizeWords(formData.title) + ' ' + formData.documentType;
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/generate-standard`, {
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

  const handlePublish = async () => {
    const dataToStore = {
      usedAbbrCodes,
      usedTermCodes,
      formData: getSanitizedFormData(formData),
      userID,
      azureFN: "",
      draftID: loadedIDRef.current
    };

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/docCreate/publish-standard`, {
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
        navigate('/FrontendDMS/generatedStandardFiles'); // Redirect to the generated file info page
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/documentApprovals/start-approval-stand-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");
      const data = await response.json();

      toast.success(`Standard Publishing Approval Started.`, {
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/documentApprovals/approve-draft-stand`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");
      const data = await response.json();

      toast.success(`Standard Successfully Approved.`, {
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
        handlePublish()
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/documentApprovals/reject-draft-stand`, {
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/documentApprovals/remove-from-approval-stand-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to remove document from the approval process");

      toast.success(`Standard Removed From The Approval Process.`, {
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
      loadData(draftId);
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/standards/resolveWithdrawn/${loadedIDRef.current}`, {
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
      loadData(draftId);
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/draft/standard/resolveRejected/${loadedIDRef.current}`, {
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
    if (draftId === "new") {
      return;
    }
    else {
      loadData(draftId);
    }
    // loadData intentionally reads the current route mode/version.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, versionPreview, versionNumber])


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

  const releaseLock = async () => {
    if (versionPreview) return true;
    if (!loadedIDRef.current) return true;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_URL}/api/draft/standards/releaseLock/${loadedIDRef.current}`,
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
    <div className="file-create-container">
      {isSidebarVisible && (
        <div className="sidebar-um">
          <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
            <FontAwesomeIcon icon={faCaretLeft} />
          </div>
          <div className="sidebar-logo-um">
            <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={handleHomeNav} title="Home" />
            <p className="logo-text-um">Document Development</p>
          </div>

          <div className="button-container-create">
            <button className="but-um" onClick={() => navigate('/FrontendDMS/documentDevelopmentDrafts/standard')}>
              <div className="button-content">
                <span className="button-logo-custom" aria-hidden="true">
                  <FontAwesomeIcon icon={faFolderOpenSolid} className="icon-base-draft" />
                  <FontAwesomeIcon icon={faArrowUp} className="icon-badge-draft" />
                </span>
                <span className="button-text">Saved Drafts</span>
              </div>
            </button>
            {canIn(access, "DDS", ["systemAdmin", "contributor"]) && (
              <button className="but-um" onClick={() => navigate('/FrontendDMS/generatedStandardFiles')}>
                <div className="button-content">
                  <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                  <span className="button-text">Pending Sign Off</span>
                </div>
              </button>
            )}
            {canIn(access, "DDS", ["systemAdmin", "contributor"]) && (
              <button className="but-um" onClick={() => navigate('/FrontendDMS/signedOffStandards')}>
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
            <img src={`${process.env.PUBLIC_URL}/standardsDMSInverted.svg`} alt="Control Attributes" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{type}s</p>
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
      {share && <SharePage closePopup={closeShare} userID={userID} userIDs={userIDs} popupVisible={share} saveData={updateData} setUserIDs={setUserIDs} />}
      {isLoadPopupOpen && <LoadDraftPopup isOpen={isLoadPopupOpen} onClose={closeLoadPopup} setLoadedID={setLoadedID} loadData={loadData} userID={userID} type={type.toLowerCase()} />}
      <div className="main-box-create">
        <div className="top-section-create-page">
          <div className="icons-container-create-page">
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

            {!readOnly && (<div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon icon={faFloppyDisk} onClick={handleSave} title="Save" />
            </div>)}

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
          <TopBarDD refreshable={true} canIn={canIn} access={access} menu={"1"} create={true} onHome={handleHomeNav} />

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

        <div className={`scrollable-box`} ref={scrollBoxRef}>
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

          <div className="input-row">
            <div className={`input-box-title ${errors.title ? "error-create" : ""}`}>
              <h3 className="font-fam-labels">Document Title <span className="required-field">*</span></h3>
              <div className="input-group-cpt">
                <input
                  spellcheck="true"
                  type="text"
                  name="title"
                  className="font-fam title-input"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Title of your document (e.g. Working at Heights)"
                  readOnly={readOnly || Boolean(loadedID)}
                />
                <span className="type-create-page">{formData.documentType}</span>
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

          <DocumentSignaturesTable rows={formData.rows} handleRowChange={handleRowChange} addRow={addRow} removeRow={removeRow} error={errors.signs} updateRows={updateSignatureRows} setErrors={setErrors} readOnly={readOnly} />

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

          <AbbreviationTable collapsible={true} formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} error={errors.abbrs} userID={userID} setErrors={setErrors} readOnly={readOnly} />
          <TermTable collapsible={true} formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} error={errors.terms} userID={userID} setErrors={setErrors} readOnly={readOnly} />
          <StandardsTable collapsible={true} formData={formData} setFormData={setFormData} error={errors.standard} setErrors={setErrors} readOnly={readOnly} />
          <ChapterTable collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} />
          <ReferenceTable collapsible={true} referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} setErrors={setErrors} error={errors.reference} required={true} readOnly={readOnly} />
          <SupportingDocumentTable collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} />

          <div className="input-row">
            <div className={`input-box-3 ${errors.reviewDate ? "error-create" : ""}`}>
              <h3 className="font-fam-labels">Review Period (Months) <span className="required-field">*</span></h3>
              <input
                type="number"
                name="reviewDate"
                className="aim-textarea cent-create font-fam"
                value={formData.reviewDate}
                onChange={handleInputChange}
                onFocus={() => {
                  setErrors(prev => ({
                    ...prev,
                    reviewDate: false
                  }))
                }}
                placeholder="Insert the review period in months"
                readOnly={readOnly}
              />
            </div>
          </div>

          <PicturesTable collapsible={true} picturesRows={formData.pictures} addPicRow={addPicRow} updatePicRow={updatePicRow} removePicRow={removePicRow} readOnly={readOnly} />

          <div className="input-row-buttons">
            {/* Generate File Button */}
            <button
              className="generate-button font-fam"
              onClick={handleClick}
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
        </div>
        {isSaveAsModalOpen && (<SaveAsPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.title} type={type} userID={userID} create={false} standard={true} />)}
        {isRenamePopupOpen && (
          <RenameDraftPopup
            onClose={closeRenamePopup}
            onRename={handleRenameDraft}
            current={formData.title}
            draftId={loadedIDRef.current || loadedID}
            siblingDraftsRoute={`${process.env.REACT_APP_URL}/api/draft/standards/drafts/${userID}`}
            titleField="title"
          />
        )}
        {generatePopup && (<GenerateDraftPopup deleteDraft={handleGeneratePDF} closeModal={closeGenerate} cancel={cancelGenerate} />)}
        {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}
        {showWorkflow && (<DocumentWorkflow setClose={closeWorkflow} />)}
        {approval && (<ApproversPopup closeModal={closeApproval} handleSubmit={handlePublishApprovalFlow} />)}
        {showReshareDraft && (<ReshareDraftPopup reshare={handleReshareDraft} doNotReshare={handleDoNotReshareDraft} />)}
        {showRejectReasonView && (
          <RejectReasonView
            rejectorName={rejectionInfo.rejectorName}
            rejectDate={formatRejectDate(rejectionInfo.rejectDate)}
            rejectionReason={rejectionInfo.rejectionMessage}
            reviewDocument={handleReviewRejectedDraft}
          />
        )}
      </div>
      <ToastContainer />
      {approveState && (<ApproveApprovalProcessPopup approveDraft={approveDraft} closeModal={closeApprovePopup} loading={loading} />)}
      {rejectState && (<RejectReason isOpen={rejectState} onClose={closeRejectPopup} onSubmit={rejectDraft} loading={rejecting} />)}
      {removeApprovalState && (
        <RemoveFromApprovalPopup
          closeModal={closeRemoveApproval}
          removeApproval={removeFromApprovalProcess}
          docType="standard draft"
          title={formData.title}
          loading={removingApproval}
        />
      )}
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
      {isSaving && (
        <SavingInProgress />
      )}
      {isPublishing && (
        <PublishingInProgress />
      )}
    </div>
  );
};

export default CreatePageStandards;