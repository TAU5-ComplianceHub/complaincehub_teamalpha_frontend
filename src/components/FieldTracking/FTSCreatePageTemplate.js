import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { saveAs } from "file-saver";
import DocumentSignaturesTable from "../CreatePage/DocumentSignaturesTable";
import TermTable from "../CreatePage/TermTable";
import AbbreviationTable from "../CreatePage/AbbreviationTable";
import ReferenceTable from "../CreatePage/ReferenceTable";
import PicturesTable from "../CreatePage/PicturesTable";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';  // Import CSS for styling
import LoadDraftPopup from "../CreatePage/LoadDraftPopup";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faChevronLeft, faChevronRight, faFileCirclePlus, faArrowLeft, faSort, faCircleUser, faBell, faShareNodes, faUpload, faRotateRight, faCircleExclamation, faPen, faSave, faArrowUp, faCaretLeft, faCaretRight, faMagicWandSparkles, faInfo, faCheckCircle, faCopy, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { faFolderOpen as faFolderOpenSolid } from "@fortawesome/free-regular-svg-icons"
import SharePage from "../CreatePage/SharePage";
import TopBarDD from "../Notifications/TopBarDD";
import ChapterTable from "../CreatePage/ChapterTable";
import StandardsTable from "../CreatePage/StandardsTable";
import SupportingDocumentTable from "../RiskRelated/SupportingDocumentTable";
import SaveAsPopup from "../Popups/SaveAsPopup";
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
import SavingInProgress from "../DocumentCreationPages/SavingInProgress";
import PublishingInProgress from "../DocumentCreationPages/PublishingInProgress";
import RevisionNumberField from "./RevisionNumberField";
import TemplateNumberField from "./TemplateNumberField";
import TemplateDocumentSignaturesTable from "./TemplateDocumentSignaturesTable";
import TemplateFieldsTable from "./TemplateFieldsTable";
import TemplateFieldsInfo from "./TemplateFieldsInfo";
import TemplateDescription from "./TemplateDescription";
import TemplatePreviewPopup from "./TemplatePreviewPopup";
import TemplatePreview from "./TemplatePreview";
import TaskDescriptionInfoBox from "./TaskDescriptionInfoBox";
import ResponsibilityInfoBox from "./ResponsibilityInfoBox";
import ResourcesInfoBox from "./ResourcesInfoBox";
import CloseOutInfoBox from "./CloseOutInfoBox";
import SafetyInfoBox from "./SafetyInfoBox";
import WorkOrderTable from "./WorkOrderTable";
import ActivityTaskTable from "./ActivityTaskTable";
import ActivityNamesField from "./ActivityNamesField";
import WorkOrderBasesSelection from "./WorkOrderBasesSelection";
import SiteAreaInfoBox from "./SiteAreaInfoBox";
import FrequencyTemplateCreation from "./FrequencyTemplateCreation";
import DepartmentInfoBox from "./DepartmentInfoBox";
import AssetInfoBox from "./AssetInfoBox";
import ManagementInfoBox from "./ManagementInfoBox";
import SubInformationField from "./SubInformationField";
import ManagementInformationField from "./ManagementInformationField";
import TemplateTitleField from "./TemplateTitleField";
import WorkOrderActionFields from "./WorkOrderActionFields";
import "./WorkOrderActionFields.css";
import SupportingDocumentTableFTS from "./SupportingDocumentTableFTS";
import PPETable from "../CreatePage/PPETable";
import HandToolTable from "../CreatePage/HandToolsTable";
import MaterialsTable from "../CreatePage/MaterialsTable";
import HazardsControlsTable from "../CreatePage/HazardsControlsTable";
import HazardsControlsTableFTS from "./HazardsControlsTableFTS";
import ReshareDraftPopup from "../Popups/ReshareDraftPopup";
import RejectReason from "../Popups/RejectReason";
import RejectReasonView from "../Popups/RejectReasonView";

// Backend dedup (see fieldTemplateDrafts.mjs) may append a " (n)" counter to
// formData.title when its auto-generated value collides with another of the
// user's drafts. Strips that counter back off so the auto-title-sync effect
// below can compare against the freshly computed templateTitle without
// mistaking "already has a counter" for "needs to be regenerated".
const stripTitleCounter = (title) => (title || "").replace(/ \(\d+\)$/, "").trim();

// Merges any number of string arrays into one distinct, A-Z sorted array.
// Case-insensitive for dedup purposes, but keeps the casing of whichever
// occurrence was seen first. Used to combine PPE/hand tools/materials from
// an imported JRA with whatever the user already has selected, and safe to
// re-run on every import even if the backend already sent back a deduped set.
const dedupeSortStrings = (...arraysOfStrings) => {
  const seen = new Map();
  for (const arr of arraysOfStrings) {
    if (!Array.isArray(arr)) continue;
    for (const value of arr) {
      const clean = String(value || "").trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (!seen.has(key)) seen.set(key, clean);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
};

// Same idea as dedupeSortStrings, but for hazardsControls rows
// ({ hazard, unwantedEvent, control }). Dedupes on the full triple and sorts
// A-Z by hazard, then unwantedEvent, then control - mirrors the grouping
// logic the backend uses (see docCreate.mjs) so re-importing (or importing
// from several JRAs across several clicks) never produces duplicate rows.
const dedupeSortHazardsControls = (...arraysOfRows) => {
  const seen = new Map();
  for (const arr of arraysOfRows) {
    if (!Array.isArray(arr)) continue;
    for (const row of arr) {
      const hazard = String(row?.hazard || "").trim();
      const unwantedEvent = String(row?.unwantedEvent || "").trim();
      const control = String(row?.control || "").trim();
      if (!hazard || !unwantedEvent) continue;
      const key = `${hazard}||${unwantedEvent}||${control}`.toLowerCase();
      if (!seen.has(key)) seen.set(key, { hazard, unwantedEvent, control });
    }
  }
  return [...seen.values()].sort((a, b) => {
    const byHazard = a.hazard.localeCompare(b.hazard, undefined, { sensitivity: "base" });
    if (byHazard !== 0) return byHazard;
    const byUnwantedEvent = a.unwantedEvent.localeCompare(b.unwantedEvent, undefined, { sensitivity: "base" });
    if (byUnwantedEvent !== 0) return byUnwantedEvent;
    return a.control.localeCompare(b.control, undefined, { sensitivity: "base" });
  });
};

const FTSCreatePageTemplate = ({ versionPreview = false }) => {
  const navigate = useNavigate();
  const type = useParams().type;
  const draftId = useParams().id;
  const versionNumber = useParams().version;
  const access = getCurrentUser();
  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [share, setShare] = useState(false);
  const [usedTemplateFields, setUsedTemplateFields] = useState([]);
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
  const loadedIDRef = useRef('');
  const [offlineDraft, setOfflineDraft] = useState(false);
  const [generatePopup, setGeneratePopup] = useState(false);
  const [previewPopup, setPreviewPopup] = useState(false);
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
  const [loadingAim, setLoadingAim] = useState(false);
  const [loadingScope, setLoadingScope] = useState(false);
  const [draftNote, setDraftNote] = useState(null);
  const [showWorkflow, setShowWorkflow] = useState(null);
  const [readOnly, setReadOnly] = useState(versionPreview);
  const [versionInfo, setVersionInfo] = useState(null);
  const [lockUser, setLockUser] = useState(null);
  const scrollBoxRef = useRef(null);
  const [owner, setOwner] = useState(false);
  const [approval, setApproval] = useState(false);
  const [inApproval, setInApproval] = useState(false);
  const [inReview, setInReview] = useState(false);
  const [approveState, setApproveState] = useState(false);
  const [isDuplicateName, setIsDuplicateName] = useState(false);
  const [loadingAimIndex, setLoadingAimIndex] = useState(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [saveConfirmTrigger, setSaveConfirmTrigger] = useState("back");
  const pendingActionRef = useRef(null);
  const [isViewer, setIsViewer] = useState(false);
  const [isPublisher, setIsPublisher] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // spinner state for the top "Save" icon
  const [isPublishing, setIsPublishing] = useState(false); // spinner state for the top "Publish" icon
  const [isSavingVersion, setIsSavingVersion] = useState(false);
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

  const closeApprovePopup = () => {
    setApproveState(false);
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

  const openSaveAs = () => {
    if (!titleSet) {
      toast.warn("Please fill in Frequency, the Work Order Basis field, and Work Order Type before saving.", {
        closeButton: false,
        autoClose: 2000, // 1.5 seconds
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
        autoClose: 2000,
        style: { textAlign: 'center' }
      });
      return;
    }

    if (!result?.ok) {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.error("Failed to save draft online. It was saved offline instead.", {
        closeButton: true,
        autoClose: 2000,
        style: { textAlign: 'center' }
      });
      return;
    }

    if (result?.id && !versionPreview) {
      await loadData(result.id);
    }

    toast.dismiss();
    toast.clearWaitingQueue();
    toast.success("New draft successfully saved.", {
      closeButton: false,
      autoClose: 2000,
      style: { textAlign: 'center' }
    });

    setIsSaveAsModalOpen(false);

    if (versionPreview && result?.id) {
      navigate(`/FrontendDMS/ftsCreateTemplate/${type}/${result.id}`);
    }
  };

  const openShare = () => {
    if (loadedIDRef.current || loadedID) {
      setShare(true);
    } else {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.warn("Please save a draft before sharing.", {
        closeButton: true,
        autoClose: 2000,
        style: {
          textAlign: 'center'
        }
      });
    }
  };
  const closeShare = () => { setShare(false); };

  const handleSave = async () => {
    if (versionPreview || readOnly) return;

    if (formData.title.trim() === "") {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.error("Please fill in Frequency, the Work Order Basis field, and Work Order Type before saving.", {
        closeButton: true,
        autoClose: 2000,
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
            autoClose: 2000,
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
          autoClose: 2000,
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
      toast.error("Please fill in Frequency, the Work Order Basis field, and Work Order Type before saving a version.", {
        closeButton: true,
        autoClose: 2000,
        style: { textAlign: "center" }
      });
      return;
    }

    setIsSavingVersion(true);

    try {
      let activeDraftId = loadedIDRef.current;

      // Persist the working copy first so the version snapshot represents
      // exactly what is currently shown on screen.
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
        `${process.env.REACT_APP_URL}/api/ftsDrafts/templates/versions/${activeDraftId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
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
      console.error("Error saving FTS template version:", error);
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
        autoClose: 2000,
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
        autoClose: 2000,
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
        autoClose: 2000,
        style: { textAlign: 'center' }
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

    const normalizedSharedUsers = normalizeSharedUsers(
      userIDsRef.current,
      userIDRef.current
    );

    const dataToStore = {
      usedTemplateFields: usedTemplateFieldsRef.current,
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

      const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsDrafts/templates/safe`, {
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
      usedTemplateFields: usedTemplateFieldsRef.current,
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

      const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsDrafts/templates/modifySafe/${loadedIDRef.current}`, {
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
      return { ok: false, error };
    }
  };

  const handleClick = () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      if (titleSet)
        setGeneratePopup(true);

      if (!titleSet) {
        toast.error("Please fill in a task name", {
          closeButton: true,
          autoClose: 2000, // 1.5 seconds
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
        autoClose: 2000, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });

      return;
    }

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields marked by a *", {
        closeButton: true,
        autoClose: 2000, // 1.5 seconds
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

      const loadUrl = versionPreview && versionNumber
        ? `${process.env.REACT_APP_URL}/api/ftsDrafts/templates/versions/${loadID}/${versionNumber}`
        : `${process.env.REACT_APP_URL}/api/ftsDrafts/templates/getDraft/${loadID}`;

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

      const storedData = data.draft || {};
      const serverReadOnly = data.readOnly || false;
      const isOwner = data.isOwner || false;
      const isViewer = data.isViewer || false;
      const isPublisher = data.isPublisher || false;
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

      setUsedTemplateFields(storedData.usedTemplateFields || []);
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
        actionFields: rawForm.actionFields || [],
        PPEItems: rawForm.PPEItems || [],
        HandTools: rawForm.HandTools || [],
        Materials: rawForm.Materials || [],
        hazardsControls: rawForm.hazardsControls || [],
      };

      suppressDirtyRef.current = true;
      setFormData(normalizedForm);
      setFormData(prev => ({ ...prev }));
      setTitleSet(true);
      loadedIDRef.current = loadID;
      setLoadedID(loadID);
      // This is what's on the server right now, so nothing is "dirty" yet.
      isDirtyRef.current = false;
      setReadOnly(Boolean(data.readOnly) || isRejectedFromServer);
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
    templateTitle: "",
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
    templateNumber: "",
    revisionNumber: "",
    templateFieldRows: [],
    templateFieldDetails: [],
    taskDescription: "",
    workOrderBases: "",
    workOrderType: "",
    workOrderDescription: "",
    site: "",
    mainArea: "",
    subArea: "",
    assetType: "",
    assetModel: "",
    component: "",
    department: "",
    codedArea: "",
    accountableLevel: "",
    personInCharge: "",
    minTeamExecutors: [],
    frequency: "",
    activityVerb: "",
    taskName: "",
    activityName: "",
    workOrderSubInformation: "",
    workOrderRACIInformation: "",
    actionFields: [],
    PPEItems: [],
    HandTools: [],
    Materials: [],
    hazardsControls: []
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

  const usedTemplateFieldsRef = useRef(usedTemplateFields);
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

  const [jraImporting, setJraImporting] = useState(false);

  const dedupeSortObjectsByKey = (key, ...arrays) => {
    const seen = new Map();

    for (const arr of arrays) {
      if (!Array.isArray(arr)) continue;

      for (const item of arr) {
        if (!item) continue;

        const value = String(item?.[key] || "").trim();
        if (!value) continue;

        const dedupeKey = value.toLowerCase();

        if (!seen.has(dedupeKey)) {
          seen.set(dedupeKey, item);
        }
      }
    }

    return [...seen.values()].sort((a, b) =>
      String(a?.[key] || "").localeCompare(
        String(b?.[key] || ""),
        undefined,
        { sensitivity: "base" }
      )
    );
  };

  // Looks across every action field's related documents for the ones whose
  // title contains both "JRA" and "PTO" - if there aren't any, falls back to
  // documents whose title just contains "JRA". Whichever set is found, any
  // document already recorded in formData.importedJra is filtered out so we
  // don't re-send JRAs that have already been imported.
  const jraDocsToImport = useMemo(() => {
    const allRelatedDocs = (formData.actionFields || []).flatMap(
      (field) => field.relatedDocuments || []
    );
    const jraAndPtoDocs = allRelatedDocs.filter(
      (doc) => /jra/i.test(doc.name || "") && /pto/i.test(doc.name || "")
    );
    const jraOnlyDocs = allRelatedDocs.filter((doc) => /jra/i.test(doc.name || ""));
    const matchedJraDocs = jraAndPtoDocs.length > 0 ? jraAndPtoDocs : jraOnlyDocs;

    const importedJraIds = formData.importedJra || [];
    return matchedJraDocs.filter((doc) => !importedJraIds.includes(doc.id));
  }, [formData.actionFields, formData.importedJra]);

  // Sends the ids of any not-yet-imported JRAs to the backend, then merges
  // the response back in:
  //  - the returned document list gets added to formData.importedJra (so we
  //    stop re-prompting/re-sending for them)
  //  - the returned usedPPEOptions/usedHandTools/usedMaterials get merged
  //    (distinct, A-Z) into the page's own used* state
  //  - the returned hazardsControls get merged (distinct, A-Z) into
  //    formData.hazardsControls
  // Route: POST /api/ftsGenerate/import-jra (see fieldTemplateCreation.mjs)
  const handleImportJra = async () => {
    if (jraDocsToImport.length === 0) return;

    console.log(jraDocsToImport)

    setJraImporting(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsGenerate/import-jra`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          dmsIds: jraDocsToImport.map((doc) => doc.id),
        }),
      });

      if (!response.ok) throw new Error("Failed to import JRA");

      const result = await response.json();
      // { importedDocuments: [{ id, name }, ...], importedData: { usedPPEOptions, usedHandTools, usedMaterials, hazardsControls } }
      const importedDocuments = result.importedDocuments || [];
      const importedData = result.importedData || {};

      console.log(importedData)

      setFormData((prev) => {
        const prevImportedJra = prev.importedJra || [];

        const newlyImportedIds = importedDocuments
          .map((doc) => doc.id)
          .filter((id) => !prevImportedJra.includes(id));

        return {
          ...prev,

          importedJra: [
            ...prevImportedJra,
            ...newlyImportedIds
          ],

          PPEItems: dedupeSortObjectsByKey(
            "ppe",
            prev.PPEItems,
            importedData.PPEItems
          ),

          HandTools: dedupeSortObjectsByKey(
            "tool",
            prev.HandTools,
            importedData.HandTools
          ),

          Materials: dedupeSortObjectsByKey(
            "mat",
            prev.Materials,
            importedData.Materials
          ),

          hazardsControls: dedupeSortHazardsControls(
            prev.hazardsControls,
            importedData.hazardsControls
          ),
        };
      });

      setUsedPPEOptions((prev) => dedupeSortStrings(prev, importedData.usedPPEOptions));
      setUsedHandTools((prev) => dedupeSortStrings(prev, importedData.usedHandTools));
      setUsedMaterials((prev) => dedupeSortStrings(prev, importedData.usedMaterials));

      toast.success("JRA values imported");
    } catch (error) {
      console.error("Error importing JRA:", error);
      toast.error("Failed to import JRA");
    } finally {
      setJraImporting(false);
    }
  };

  useEffect(() => {
    userIDRef.current = userID;
  }, [userID]);

  useEffect(() => {
    userIDsRef.current = userIDs;
  }, [userIDs]);

  useEffect(() => {
    usedTemplateFieldsRef.current = usedTemplateFields;
  }, [usedTemplateFields]);

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

  // The "title" field (used for save/auto-save/validation, and as the draft
  // name) now needs to mirror the auto-generated template title exactly, so
  // keep formData.title in sync with formData.templateTitle - once
  // TemplateTitleField has computed a title (Frequency, the WO Basis-driven
  // field, and Work Order Type are all filled in), that becomes the title.
  //
  // The backend may have appended a " (n)" counter to formData.title to
  // keep it unique among the user's drafts (see fieldTemplateDrafts.mjs).
  // Comparing against the *stripped* title here means reopening a draft (or
  // any re-render where the underlying fields haven't actually changed)
  // won't wipe that counter back out - formData.title is only overwritten
  // when the computed templateTitle genuinely differs from its current
  // base, i.e. when the user actually changed one of the fields that feeds
  // it, at which point the old counter is stale anyway and gets re-decided
  // on the next save.
  useEffect(() => {
    const templateTitleValue = formData.templateTitle || "";
    const currentTitleBase = stripTitleCounter(formData.title);

    if (templateTitleValue !== currentTitleBase) {
      setFormData((prev) => ({ ...prev, title: templateTitleValue }));
    }

    if (templateTitleValue.trim() !== "") {
      setTitleSet(true);
    }
  }, [formData.templateTitle]);

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
      usedTemplateFields,
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
  }, [formData, usedAbbrCodes, usedTermCodes, usedPPEOptions, usedHandTools, usedEquipment, usedMobileMachine, usedMaterials, usedTemplateFields]);

  // Detects form changes across all components with debounce
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(saveToHistory, 1000); // Only save after 1s of inactivity
  }, [formData, usedAbbrCodes, usedTermCodes, usedPPEOptions, usedHandTools, usedEquipment, usedMobileMachine, usedMaterials, usedTemplateFields]);

  const undoLastChange = () => {
    if (history.length > 1) {
      const lastState = history[history.length - 2]; // Get the last valid state
      const currentState = history[history.length - 1];

      // Restore the previous state
      setFormData(lastState.formData);
      setUsedAbbrCodes(lastState.usedAbbrCodes);
      setUsedTemplateFields(lastState.usedTemplateFields || []);
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
        autoClose: 2000, // 1.5 seconds
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
      setUsedTemplateFields(nextState.usedTemplateFields || []);
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
        autoClose: 2000,
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

    if (formData.rows.length === 0) {
      newErrors.signs = true;
    } else {
      formData.rows.forEach((row, index) => {
        if (!row.name) newErrors.signs = true;
      });
    }

    return newErrors;
  };

  const validateFormRevised = () => {
    const newErrors = errors;
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

  const handleWorkOrderBasesFocus = () => {
    setErrors((prev) => ({ ...prev, workOrderBases: false }));
  };

  // Work Order Basis drives whether the Asset Information box is shown at
  // all (see render below). Switching to Area Based / Department Based (or
  // back to nothing selected) hides that box, so any assetType/assetModel/
  // assetNumber values already entered are cleared out here rather than
  // being left in formData unseen.
  const handleWorkOrderBasesChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (value !== "assetBased") {
        next.assetType = "";
        next.assetModel = "";
        next.assetNumber = "";
      }

      return next;
    });

    setErrors((prev) => ({ ...prev, workOrderBases: false }));
  };

  const handleTemplateNumberChange = (value) => {
    setFormData((prev) => ({ ...prev, templateNumber: value }));
  };

  const handleWorkOrderTypeChange = (value) => {
    setFormData((prev) => ({ ...prev, workOrderType: value }));
    setErrors((prev) => ({ ...prev, workOrderType: false }));
  };

  const handleWorkOrderDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, workOrderDescription: value }));
    setErrors((prev) => ({ ...prev, workOrderDescription: false }));
  };

  const handleFrequencyChange = (e) => {
    setFormData((prev) => ({ ...prev, frequency: e.target.value }));
    setErrors((prev) => ({ ...prev, frequency: false }));
  };

  const handleFrequencyFocus = () => {
    setErrors((prev) => ({ ...prev, frequency: false }));
  };

  const handleActivityVerbChange = (value) => {
    setFormData((prev) => ({ ...prev, activityVerb: value }));
    setErrors((prev) => ({ ...prev, activityVerb: false }));
  };

  const handleTaskNameChange = (value) => {
    setFormData((prev) => ({ ...prev, taskName: value }));
    setErrors((prev) => ({ ...prev, taskName: false }));
  };

  const handleActivityNameChange = (value) => {
    setFormData((prev) => ({ ...prev, activityName: value }));
  };

  const handleWorkOrderSubInformationChange = (value) => {
    setFormData((prev) => ({ ...prev, workOrderSubInformation: value }));
  };

  const handleWorkOrderRACIInformationChange = (value) => {
    setFormData((prev) => ({ ...prev, workOrderRACIInformation: value }));
  };

  // The auto-generation logic for the derived template title now lives
  // inside TemplateTitleField itself (rendered further down with
  // showUI={false}) - it just reports the computed value back here.
  const handleTemplateTitleChange = (value) => {
    setFormData((prev) => ({ ...prev, templateTitle: value }));
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
          autoClose: 2000, // 1.5 seconds
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
        autoClose: 2000,
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
        autoClose: 2000, // 1.5 seconds
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
    ...sourceFormData
  });

  // Send data to backend to generate a Word document
  const handleGeneratePDF = async () => {
    const dataToStore = {
      usedAbbrCodes,
      usedTemplateFields,
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsGenerate/generate-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");

      const blob = await response.blob();
      saveAs(blob, `${documentName}.pdf`);
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
      usedTemplateFields,
      formData: getSanitizedFormData(formData),
      userID,
      azureFN: "",
      draftID: loadedIDRef.current,
      usedMaterials,
      usedPPEOptions,
      usedHandTools
    };

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsGenerate/publish-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");

      toast.success(`Template published`, {
        closeButton: true,
        autoClose: 2000, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });

      setLoading(false);
      setTimeout(() => {
        navigate('/FrontendDMS/ftsSignedOffTemplates'); // Redirect to the generated file info page
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsApproval/start-approval-template-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");
      const data = await response.json();

      toast.success(`Tempalte Publishing Approval Started.`, {
        closeButton: true,
        autoClose: 2000, // 1.5 seconds
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
        autoClose: 2000, // 1.5 seconds
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsApproval/approve-draft-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");
      const data = await response.json();

      toast.success(`Template Successfully Approved.`, {
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsApproval/reject-draft-template`, {
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

  const resolveWithdrawnDraft = async (reshare, options = {}) => {
    const { silent = false } = options;
    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsDrafts/templates/resolveWithdrawn/${loadedIDRef.current}`, {
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/ftsDrafts/templates/resolveRejected/${loadedIDRef.current}`, {
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

  const releaseLock = async () => {
    if (versionPreview) return true;
    if (!loadedIDRef.current) return true;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_URL}/api/ftsDrafts/templates/releaseLock/${loadedIDRef.current}`,
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

  const handleBackSaveConfirm = async () => {
    const result = await updateData(userIDsRef.current);

    if (!result) {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.error("Failed to save draft.", {
        closeButton: true,
        autoClose: 2000,
        style: { textAlign: "center" }
      });
      return;
    }

    toast.dismiss();
    toast.clearWaitingQueue();
    toast.success("Draft has been saved.", {
      closeButton: true,
      autoClose: 2000,
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

  return (
    <div className="file-create-container">
      {isSidebarVisible && (
        <div className="sidebar-um">
          <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
            <FontAwesomeIcon icon={faCaretLeft} />
          </div>
          <div className="sidebar-logo-um">
            <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={handleHomeNav} title="Home" />
            <p className="logo-text-um">Field Template</p>
          </div>

          <div className="button-container-create">
            <button className="but-um" onClick={() => navigate('/FrontendDMS/ftsDrafts/template')}>
              <div className="button-content">
                <span className="button-logo-custom" aria-hidden="true">
                  <FontAwesomeIcon icon={faFolderOpenSolid} className="icon-base-draft" />
                  <FontAwesomeIcon icon={faArrowUp} className="icon-badge-draft" />
                </span>
                <span className="button-text">Saved Drafts</span>
              </div>
            </button>
            {canIn(access, "FTS", ["systemAdmin", "contributor"]) && (
              <button className="but-um" onClick={() => navigate('/FrontendDMS/ftsGeneratedTemplates')}>
                <div className="button-content">
                  <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                  <span className="button-text">In Approval</span>
                </div>
              </button>
            )}
            {canIn(access, "FTS", ["systemAdmin", "contributor"]) && (
              <button className="but-um" onClick={() => navigate('/FrontendDMS/ftsSignedOffTemplates')}>
                <div className="button-content">
                  <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                  <span className="button-text">Approved</span>
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
                    <FontAwesomeIcon icon={faSave} />
                    <FontAwesomeIcon
                      icon={faPen}
                      transform="shrink-6 down-5 right-7"
                      color="gray"
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

            {!readOnly && !inReview && !inApproval && (isPublisher || owner) && canIn(access, "FTS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon icon={faUpload} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handlePubClick} title="Publish" />
            </div>)}

            {(inApproval || inReview) && !readOnly && canIn(access, "FTS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon style={{ color: "#7EAC89" }} icon={faCheckCircle} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleApproveClick} title="Approve Draft" />
            </div>)}

            {(inApproval || inReview) && !readOnly && canIn(access, "FTS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon style={{ color: "#CB6F6F" }} icon={faTimesCircle} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleRejectClick} title="Reject Document" />
            </div>)}
          </div>

          {/* This div creates the space in the middle */}
          <div className="spacer"></div>

          {/* Container for right-aligned icons */}
          <TopBarDD refreshable={false} canIn={canIn} access={access} menu={"1"} create={true} onHome={handleHomeNav} />

        </div>

        {isRejected && (<div className="input-row">
          <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#CB6F6F", color: "white", fontWeight: "bold" }}>
            This document is in Read Only Mode as it has been rejected and requires document owner intervention.
          </div>
        </div>)}

        {(!versionPreview && !isViewer && !readOnly && (inApproval || inReview)) && (<div className="input-row">
          <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#7EAC89", color: "white", fontWeight: "bold" }}>
            To approve this template, click on the green circle above.
          </div>
        </div>)}

        {(!versionPreview && isViewer && readOnly && !isRejected) && (<div className="input-row">
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

          {(!versionPreview && !isViewer && readOnly && !inReview && !inApproval && !isRejected) && (<div className="input-row">
            <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#CB6F6F", color: "white", fontWeight: "bold" }}>
              The draft is in Read Only Mode as the following user is modifying the draft: {lockUser}
            </div>
          </div>)}

          {(!versionPreview && !isViewer && readOnly && (inReview || inApproval) && !isRejected) && (<div className="input-row">
            <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#FFFF89", color: "black", fontWeight: "bold" }}>
              This template is currently in the approval process
            </div>
          </div>)}

          <TemplateTitleField
            value={formData.templateTitle}
            frequency={formData.frequency}
            workOrderBasis={formData.workOrderBases}
            assetType={formData.assetType}
            mainArea={formData.mainArea}
            department={formData.department}
            workOrderType={formData.workOrderType}
            onChange={handleTemplateTitleChange}
            readOnly={readOnly}
            showUI={true}
          />

          <WorkOrderTable
            workOrderType={formData.workOrderType}
            description={formData.workOrderDescription}
            onTypeChange={handleWorkOrderTypeChange}
            onDescriptionChange={handleWorkOrderDescriptionChange}
            readOnly={readOnly}
            error={errors.workOrderType || errors.workOrderDescription}
            userID={userID}
          />

          <div className="input-row-risk-create">
            <WorkOrderBasesSelection
              value={formData.workOrderBases}
              onChange={handleWorkOrderBasesChange}
              onFocus={handleWorkOrderBasesFocus}
              error={errors.workOrderBases}
              readOnly={readOnly}
            />
            <FrequencyTemplateCreation
              value={formData.frequency}
              onChange={handleFrequencyChange}
              onFocus={handleFrequencyFocus}
              error={errors.frequency}
              readOnly={readOnly}
            />
          </div>

          <TemplateDocumentSignaturesTable rows={formData.rows} handleRowChange={handleRowChange} addRow={addRow} removeRow={removeRow} error={errors.signs} updateRows={updateSignatureRows} setErrors={setErrors} readOnly={readOnly} />

          {(formData.workOrderBases === "assetBased" || formData.workOrderBases === "") && (<AssetInfoBox
            collapsible={true}
            formData={formData}
            setFormData={setFormData}
            error={errors.assetDetails}
            setErrors={setErrors}
            readOnly={readOnly}
            noOptions={false}
            workOrderBasis={formData.workOrderBases}
            viewMode="create"
          />)}

          <SiteAreaInfoBox
            collapsible={true}
            formData={formData}
            setFormData={setFormData}
            error={errors.siteAreaDetails}
            setErrors={setErrors}
            readOnly={readOnly}
            noOptions={false}
            viewMode="create"
          />

          <DepartmentInfoBox
            collapsible={true}
            formData={formData}
            setFormData={setFormData}
            error={errors.departmentDetails}
            setErrors={setErrors}
            readOnly={readOnly}
            noOptions={false}
            viewMode="create"
          />

          <ManagementInfoBox
            collapsible={true}
            formData={formData}
            setFormData={setFormData}
            error={errors.managementDetails}
            setErrors={setErrors}
            readOnly={readOnly}
            noOptions={false}
            isAssignmentView={false}
            viewMode="create"
          />

          <div className="input-row-risk-create">
            <TemplateNumberField
              value={formData.templateNumber}
              workOrderType={formData.workOrderType}
              department={formData.department}
              mainArea={formData.mainArea}
              onChange={handleTemplateNumberChange}
              showUI={false}
            />
            <RevisionNumberField onChange={handleInputChange} value={formData.revisionNumber} showUI={false} />
          </div>

          <SupportingDocumentTableFTS collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} />

          <WorkOrderActionFields collapsible={true} formData={formData} setFormData={setFormData} error={errors.actionFields} setErrors={setErrors} readOnly={readOnly} />

          {jraDocsToImport.length > 0 && (
            <div className="input-row">
              <div className="input-box-ref">
                <div
                  className="input-row-buttons"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: "12px",
                    marginTop: "0px"
                  }}
                >
                  <span className="font-fam" style={{ marginTop: "15px", marginBottom: "10px", fontWeight: "bold", fontFamily: "Arial" }}>
                    Values from a selected JRA can be imported into this Field Template. Do you want to import?
                  </span>

                  <button
                    type="button"
                    className="generate-button font-fam"
                    style={{
                      width: "15%",
                      minWidth: "100px",
                      marginTop: "0px"
                    }}
                    title="Import JRA"
                    disabled={jraImporting}
                    onClick={handleImportJra}
                  >
                    {jraImporting ? "Importing..." : "Import"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <PPETable collapsible={true} formData={formData} setFormData={setFormData} usedPPEOptions={usedPPEOptions} setUsedPPEOptions={setUsedPPEOptions} userID={userID} readOnly={readOnly} />
          <HandToolTable collapsible={true} formData={formData} setFormData={setFormData} usedHandTools={usedHandTools} setUsedHandTools={setUsedHandTools} userID={userID} readOnly={readOnly} />
          <MaterialsTable collapsible={true} formData={formData} setFormData={setFormData} usedMaterials={usedMaterials} setUsedMaterials={setUsedMaterials} userID={userID} readOnly={readOnly} />
          <HazardsControlsTableFTS
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

          {true && (<div className="input-row-buttons">
            {true && (<button
              className="generate-button font-fam"
              title="Preview Template"
              onClick={() => setTemplatePreviewOpen(true)}
            >
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Template Preview'}
            </button>)}
            {false && (<button
              className="generate-button font-fam"
              title="PDF Preview Template"
              onClick={() => setPreviewPopup(true)}
            >
              {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'PDF Template Preview'}
            </button>)}
          </div>)}
        </div>
        {isSaveAsModalOpen && (<SaveAsPopup readonlyTitle={true} saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.title} type={type} userID={userID} create={false} />)}
        {generatePopup && (<GenerateDraftPopup deleteDraft={handleGeneratePDF} closeModal={closeGenerate} cancel={cancelGenerate} />)}
        {templatePreviewOpen && (
          <TemplatePreview
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            readOnly={readOnly}
            onClose={() => setTemplatePreviewOpen(false)}
          />
        )}
        {previewPopup && (
          <TemplatePreviewPopup
            formData={formData}
            onClose={() => setPreviewPopup(false)}
            previewEndpoint={`${process.env.REACT_APP_URL}/api/ftsGenerate/preview-template`}
          />
        )}
        {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}
        {showWorkflow && (<DocumentWorkflow setClose={closeWorkflow} />)}
      </div>
      <ToastContainer />
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
      {isSaving && (
        <SavingInProgress />
      )}
      {isPublishing && (
        <PublishingInProgress />
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
    </div>
  );
};

export default FTSCreatePageTemplate;