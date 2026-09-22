import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import TermTable from "../../CreatePage/TermTable";
import AbbreviationTable from "../../CreatePage/AbbreviationTable";
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faArrowLeft, faShareNodes, faUpload, faRotateRight, faPen, faSave, faArrowUp, faCaretLeft, faCaretRight, faInfo, faL, faMagicWandSparkles, faEye, faCheckCircle, faBan, faTimesCircle, faCopy } from '@fortawesome/free-solid-svg-icons';
import TopBarDD from "../../Notifications/TopBarDD";
import { v4 as uuidv4 } from "uuid";
import { canIn, getCurrentUser } from "../../../utils/auth";
import InductionAssessment from "./InductionAssessment";
import InductionContent from "./InductionContent";
import InductionSummary from "./InductionSummary";
import InductionOutline from "./InductionOutline";
import SaveAsInductionPopup from "./SaveAsInductionPopup";
import LoadPublishedIndcutionPopup from "./LoadPublishedIndcutionPopup";
import PublishedInductionPreviewPage from "./PublishedInductionPreviewPage";
import RepublishInduction from "./RepublishInduction";
import ApproversPopup from "./ApproversPopup";
import RepublishInductionConfirmation from "./RepublishInductionConfirmation";
import SavingInProgress from "../../DocumentCreationPages/SavingInProgress";
import RemoveFromApprovalPopup from "../../Popups/RemoveFromApprovalPopup";
import RejectReason from "../../Popups/RejectReason";
import RejectReasonView from "../../Popups/RejectReasonView";

const InductionReviewPage = () => {
  const navigate = useNavigate();
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [usedAbbrCodes, setUsedAbbrCodes] = useState([]);
  const [usedTermCodes, setUsedTermCodes] = useState([]);
  const access = getCurrentUser();
  const [loadedID, setLoadedID] = useState('');
  const [titleSet, setTitleSet] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // spinner state for the top "Save" icon
  const [userID, setUserID] = useState('');
  const [userIDs, setUserIDs] = useState([]);
  const autoSaveInterval = useRef(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const loadedIDRef = useRef('');
  const [loadingIntro, setLoadingIntro] = useState(false);
  const [loadingObj, setLoadingObj] = useState(false);
  const [publishable, setPublishable] = useState(true);
  const [showPublishLoader, setShowPublishLoader] = useState(false);
  const fileID = useParams().fileId;
  const [preview, setPreview] = useState(false);
  const [confrimation, setConfirmation] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [approval, setApproval] = useState(false);
  const [retakeConfirmation, setRetakeConfirmation] = useState(false);
  const [inApproval, setInApproval] = useState(false);
  const [publishType, setPublishType] = useState(false);
  const [removeApprovalState, setRemoveApprovalState] = useState(false);
  const [removingApproval, setRemovingApproval] = useState(false);
  const [canRemove, setCanRemove] = useState(false);
  const [rejectState, setRejectState] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [showRejectReasonView, setShowRejectReasonView] = useState(false);
  const [rejectionInfo, setRejectionInfo] = useState({ rejectorName: "", rejectDate: null, rejectionMessage: "" });

  const readOnlyRef = useRef(false);

  const stopAutoSave = () => {
    if (autoSaveInterval.current) {
      clearInterval(autoSaveInterval.current);
      autoSaveInterval.current = null;
    }
  };

  const enableReadOnlyImmediately = () => {
    readOnlyRef.current = true;
    setReadOnly(true);
    stopAutoSave();
  };

  const openApproval = () => {
    setApproval(true);
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

  const openRetakeConfirm = () => {
    setRetakeConfirmation(true);
  }

  const closeRetakeConfirm = () => {
    setRetakeConfirmation(false);
  }

  const openConfirmation = () => {
    setConfirmation(true);
  }

  const closeConfirmation = () => {
    setConfirmation(false);
  }

  const retakeInduction = () => {
    closeConfirmation();
    openRetakeConfirm();
  }

  const confirmRetakeConfirmation = () => {
    closeRetakeConfirm();
    handlePublish(true);
  }

  const cancelRetakeConfirmation = () => {
    closeRetakeConfirm();
    openConfirmation();
  }

  const normalPublish = () => {
    closeConfirmation();
    handlePublish(false);
  }

  const closePreview = () => {
    setPreview(false);
  }

  useEffect(() => {
    if (fileID) {
      loadData(fileID);
    }
  }, [fileID]);

  const [rewriteHistory, setRewriteHistory] = useState({
    intorduction: [],
    courseObjectives: []
  });

  const pushAiRewriteHistory = (field) => {
    setRewriteHistory(prev => ({
      ...prev,
      [field]: [...prev[field], formData[field]]
    }));
  };

  const undoAiRewrite = (field) => {
    setRewriteHistory(prev => {
      const hist = [...prev[field]];
      if (hist.length === 0) return prev;         // nothing to undo
      const lastValue = hist.pop();
      setFormData(fd => ({ ...fd, [field]: lastValue }));
      return { ...prev, [field]: hist };
    });
  };


  const AiRewriteIntro = async () => {
    try {
      const prompt = formData.intorduction;

      pushAiRewriteHistory('intorduction');
      setLoadingIntro(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatInduction/intro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt }),
      });

      const { response: newText } = await response.json();
      setLoadingIntro(false);
      setFormData(fd => ({ ...fd, intorduction: newText }));
    } catch (error) {
      setLoadingIntro(false);
      console.error('Error saving data:', error);
    }
  }

  const AiRewriteObjectives = async () => {
    try {
      const prompt = formData.courseObjectives;

      pushAiRewriteHistory('courseObjectives');
      setLoadingObj(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/openai/chatInduction/objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt }),
      });

      const { response: newText } = await response.json();
      setLoadingObj(false);
      setFormData(fd => ({ ...fd, courseObjectives: newText }));
    } catch (error) {
      setLoadingObj(false);
    }
  }

  const objectUrlCacheRef = useRef(new Map());

  function revokeAllObjectUrls() {
    for (const url of objectUrlCacheRef.current.values()) URL.revokeObjectURL(url);
    objectUrlCacheRef.current.clear();
  }

  async function hydrateDraftMediaPreviews(draft) {
    const apiBase = process.env.REACT_APP_URL;
    const token = localStorage.getItem("token") || "";

    // helper: fetch blob once per fileId and cache an object URL
    const fetchPreview = async (fileId, fallbackType = "") => {
      const cached = objectUrlCacheRef.current.get(fileId);
      if (cached) return { url: cached, mime: fallbackType || "" };

      const url = `${apiBase}/api/visitorDrafts/mediaNew/${encodeURIComponent(fileId)}`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(`media ${fileId} ${res.status}`);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      objectUrlCacheRef.current.set(fileId, objUrl);
      return { url: objUrl, mime: blob.type || fallbackType || "" };
    };

    const jobs = [];

    for (const mod of draft.courseModules || []) {
      for (const topic of mod.topics || []) {
        for (const slide of topic.slides || []) {
          // --- MIGRATE legacy single-media -> array ---
          if (!Array.isArray(slide.mediaItems)) {
            if (slide.media?.fileId) {
              slide.mediaItems = [{ media: { ...slide.media } }];
            } else {
              slide.mediaItems = [];
            }
            // keep the legacy field around only if you still read it elsewhere; otherwise clear:
            slide.media = undefined;
          }

          // hydrate each media item slot
          slide.mediaItems = (slide.mediaItems || []).map((it) => {
            const m = it?.media;
            // normalize structure so callers don't crash
            const next = { media: m || null, mediaFile: null, mediaPreview: null, mediaType: "" };

            if (!m?.fileId) {
              // empty slot
              return next;
            }

            // schedule fetch/hydration
            jobs.push(
              (async () => {
                try {
                  const { url, mime } = await fetchPreview(m.fileId, m.contentType || "");
                  next.mediaPreview = url;
                  next.mediaType = mime;
                } catch (err) {
                  console.warn("Hydrate media failed:", m.fileId, err.message);
                  next.mediaPreview = null;
                  next.mediaType = "";
                }
              })()
            );

            return next;
          });
        }
      }
    }

    await Promise.all(jobs);
    return draft;
  }

  useEffect(() => {
    return () => revokeAllObjectUrls();
  }, []);

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

  const confirmSaveAs = async (newTitle) => {
    // apply the new title, clear loadedID, then save
    const me = userIDRef.current;
    const newFormData = {
      ...formDataRef.current,        // your current formData
      courseTitle: newTitle,             // override title
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
    toast.success("New Draft Successfully Loaded", {
      closeButton: false,
      autoClose: 1500, // 1.5 seconds
      style: {
        textAlign: 'center'
      }
    });

    setIsSaveAsModalOpen(false);
  };

  function buildDraftFormData(currentForm) {
    // deep clone so we can mutate a wire copy
    const wire = structuredClone(currentForm);
    const fd = new FormData();

    // walk modules → topics → slides; collect files
    for (const mod of wire.courseModules || []) {
      for (const topic of mod.topics || []) {
        for (const slide of topic.slides || []) {
          slide.mediaItems = (slide.mediaItems || []).map((it) => {
            if (!it) return { media: null };   // preserve empty slot safely
            const f = it.mediaFile;
            if (f instanceof File) {
              const fileId = it.media?.fileId || crypto.randomUUID();
              fd.append(`files[${fileId}]`, f, f.name);
              return {
                ...it,
                media: { fileId, filename: f.name, contentType: f.type, size: f.size },
                mediaFile: undefined,          // remove transient
                mediaPreview: undefined,       // not sent
              };
            }
            return { ...it, mediaFile: undefined, mediaPreview: undefined };
          });
        }
      }
    }

    // You already send other wrapper data; mirror your current payload shape
    const payload = {
      usedAbbrCodes: usedAbbrCodesRef.current,
      usedTermCodes: usedTermCodesRef.current,
      formData: wire,                       // the cleaned form
      userIDs: userIDsRef.current,
      creator: userIDRef.current,
      updater: null,
      dateUpdated: null
    };

    fd.append("draft", JSON.stringify(payload)); // <- string, not Blob
    return fd;
  }

  // handleSave: this is the ONLY place a save toast should be shown from.
  // updateData() is called from lots of other places (autosave, save-before-
  // navigate, etc.) where we intentionally do NOT want a toast, so the
  // success/failure messaging lives here, not inside updateData.
  const handleSave = async () => {
    if (formData.courseTitle === "") {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.error("Please fill in at least the title field before saving.", {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateData();

      // updateData() already shows its own error toast internally on
      // failure, so we only need to handle the success case here.
      if (updated) {
        toast.dismiss();
        toast.clearWaitingQueue();
        toast.success("Draft has been successfully saved", {
          closeButton: true,
          autoClose: 1500, // 1.5 seconds
          style: {
            textAlign: 'center'
          }
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.error("Failed to save draft. Please try again.", {
        closeButton: true,
        autoClose: 2000,
        style: {
          textAlign: 'center'
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveAsData = async () => {
    const fd = buildDraftFormData(formDataRef.current);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/safe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: fd,
      });
      const result = await response.json();
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  async function updateData() {
    if (readOnly) return;
    const wire = structuredClone(formDataRef.current);
    const fd = new FormData();

    const payload = {
      usedAbbrCodes: usedAbbrCodesRef.current,
      usedTermCodes: usedTermCodesRef.current,
      formData: wire,
      updater: userIDRef.current,
      dateUpdated: new Date().toISOString(),
      userID
    };

    for (const mod of wire.courseModules || []) {
      for (const topic of mod.topics || []) {
        for (const slide of topic.slides || []) {
          slide.mediaItems = (slide.mediaItems || []).map((it) => {
            const f = it.mediaFile;
            if (f instanceof File) {
              const fileId = it.media?.fileId || crypto.randomUUID();
              fd.append(`files[${fileId}]`, f, f.name);
              return {
                ...it,
                media: { fileId, filename: f.name, contentType: f.type, size: f.size },
                mediaFile: undefined,          // remove transient
                mediaPreview: undefined,       // not sent
              };
            }
            return { ...it, mediaFile: undefined, mediaPreview: undefined };
          });
        }
      }
    }

    fd.append("draft", JSON.stringify(payload));

    const res = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/modifyPublishedInduction/${loadedIDRef.current}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` },
      body: fd
    });

    if (!res.ok) {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.error("Failure when saving draft", {
        closeButton: true,
        autoClose: 800,
        style: { textAlign: "center" }
      });

      return false;
    }

    return true;
  }

  const handlePubClick = () => {
    const newErrors = validateForm();
    setErrors(newErrors);

    if (loadedID === '') {
      toast.dismiss();
      toast.clearWaitingQueue();
      toast.warn("Please load a draft before publishing.", {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });

      return;
    }

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields marked by a *", {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });
    } else {
      openApproval();
    }
  };

  const handleApproveClick = () => {
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields marked by a *", {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });
    } else {
      approveDraft();  // Call your function when the form is valid
    }
  };

  const approveDraft = async () => {
    const dataToStore = {
      draftID: loadedIDRef.current
    };

    setLoading(true);
    stopAutoSave();

    const saved = await updateData(userIDsRef.current);
    if (saved === false) {
      setLoading(false);
      return;
    }

    enableReadOnlyImmediately();

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/approve-publishDoc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");
      const data = await response.json();

      toast.success(`Course successfully approved. The course is now read-only.`, {
        closeButton: true,
        autoClose: 1200,
        style: {
          textAlign: 'center'
        }
      });

      enableReadOnlyImmediately();
      setLoading(false);

      if (data.fullyApproved) {
        openConfirmation()
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/reject-publishDoc`, {
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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/remove-from-approval-publishedDoc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to remove document from the approval process");

      toast.success(`Visitor Induction Removed From The Approval Process.`, {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });

      setInApproval(false);
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

  const loadData = async (loadID) => {
    try {
      setShowPublishLoader(true);

      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/loadPublishedInduction/${loadID}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } // if your load route is protected
      });
      const storedData = await response.json();

      setUsedAbbrCodes(storedData.usedAbbrCodes || []);
      setUsedTermCodes(storedData.usedTermCodes || []);
      setUserIDs(storedData.userIDs || []);

      const rawForm = storedData.formData || {};
      const normalizedForm = {
        ...rawForm,
        supportingDocuments: Array.isArray(rawForm.supportingDocuments) ? rawForm.supportingDocuments : []
      };

      // IMPORTANT: hydrate media previews for any saved files
      revokeAllObjectUrls(); // clear any previous draft's object URLs
      const hydrated = await hydrateDraftMediaPreviews(normalizedForm);

      setFormData(hydrated);
      setTitleSet(true);
      loadedIDRef.current = loadID;
      setLoadedID(loadID);

      setInApproval(Boolean(storedData.statusApproval));
      const canRemove = storedData.canRemove || false;
      const isRejectedFromServer = canRemove
        ? false
        : Boolean(storedData.isRejected);
      const isRejectedForOwner = canRemove && Boolean(storedData.isRejected);

      if (storedData.statusApproval && storedData.readOnly) {
        enableReadOnlyImmediately();
      }
      else if (isRejectedFromServer) {
        enableReadOnlyImmediately();
      } else {
        setReadOnly(storedData.readOnly);
      }

      setShowPublishLoader(false);
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
      console.error('Error loading data:', error);
      setShowPublishLoader(false);
    }
  };

  const [formData, setFormData] = useState({
    courseTitle: "",
    intorduction: "",
    courseObjectives: "",
    abbrRows: [],
    termRows: [],
    references: [],
    courseSummary: "",
    courseOutline: "",
    additionalResources: [],
    chapters: [],
    summary: "",
    courseOutline: {
      department: "",
      duration: "",
      audience: "",
      table: []
    },
    assessment: [
      { id: uuidv4(), question: "", answer: "", options: ["", "", ""] }
    ]
  });

  useEffect(() => {
    const hasActiveError = Object.values(errors).some(val => val === true);

    if (hasActiveError) {
      const newErrors = validateFormRevised();
      setErrors(newErrors);
    }
  }, [formData]);

  const formDataRef = useRef(formData);
  const usedAbbrCodesRef = useRef(usedAbbrCodes);
  const usedTermCodesRef = useRef(usedTermCodes);
  const userIDsRef = useRef(userIDs);
  const userIDRef = useRef(userID);

  useEffect(() => {
    readOnlyRef.current = readOnly;

    if (readOnly) {
      stopAutoSave();
    }
  }, [readOnly]);

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
    if (
      !readOnlyRef.current &&
      !autoSaveInterval.current &&
      formData.courseTitle.trim() !== ""
    ) {
      autoSaveInterval.current = setInterval(() => {
        autoSaveDraft();
      }, 120000);
    }

    return () => {
      stopAutoSave();
    };
  }, [formData.courseTitle, readOnly]);

  const autoSaveDraft = () => {
    if (readOnlyRef.current) return;
    if (formData.courseTitle.trim() === "") return;
    if (preview) return;

    if (loadedIDRef.current !== '') {

      updateData();
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
    return newErrors;
  };

  const validateFormRevised = () => {
    const newErrors = errors;
    if (!formData.reviewDate) { newErrors.reviewDate = true } else {
      newErrors.reviewDate = false;
    };
    return newErrors;
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      const decodedToken = jwtDecode(storedToken);

      setUserID(decodedToken.userId);
      setUserIDs([decodedToken.userId]);
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "courseTitle" && e.target.value.trim() !== "") {
      setTitleSet(true); // Enable auto-save only after title is entered
    }
  };

  const handlePublish = async (retakeRequired) => {
    await updateData();

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/republishInduction/${fileID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ retakeRequired })
      });

      if (!response.ok) throw new Error("Failed to generate document");

      toast.success(`Induction Published`, {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
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

  const handlePublishApprovalFlow = async (approversValue) => {
    const dataToStore = {
      draftID: loadedIDRef.current,
      approvers: approversValue,
      publishType: true
    };

    setLoading(true);
    stopAutoSave();

    const saved = await updateData(userIDsRef.current);
    if (saved === false) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/start-approval-publishedDoc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(dataToStore),
      });

      if (!response.ok) throw new Error("Failed to generate document");
      const data = await response.json();

      toast.success(`The approval process has started for this online training course.`, {
        closeButton: true,
        autoClose: 800, // 1.5 seconds
        style: {
          textAlign: 'center'
        }
      });

      if (!data.currentApprover) {
        enableReadOnlyImmediately();
      }

      setInApproval(data.approvalStatus);

      setLoading(false);
    } catch (error) {
      console.error("Error generating document:", error);
      setLoading(false);
    }
  };

  const openPreview = async () => {
    await updateData();
    setPreview(true);
  }

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
      const response = await fetch(`${process.env.REACT_APP_URL}/api/visitorDrafts/resolveRejected-publishedDoc/${fileID}`, {
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
            <p className="logo-text-um" onClick={() => console.log(formData)}>Training Management</p>
          </div>

          <div className="button-container-create">
            {loadedIDRef.current && (<button className="but-um" style={{ marginTop: "10px" }} onClick={openPreview}>
              <div className="button-content" >
                <FontAwesomeIcon icon={faEye} className="button-logo-custom" />
                <span className="button-text">Preview Visitor Induction</span>
              </div>
            </button>)}
          </div>

          <div className="sidebar-logo-dm-fi">
            <img src={`${process.env.PUBLIC_URL}/tmsCreateCourse2.svg`} alt="Control Attributes" className="icon-risk-rm" />
            <p className="logo-text-dm-fi">{"Review Visitor Induction"}</p>
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

      <div className="main-box-create">
        <div className="top-section-create-page">
          <div className="icons-container-create-page">
            <div className="burger-menu-icon-risk-create-page-1">
              <FontAwesomeIcon icon={faArrowLeft} onClick={() => navigate(-1)} title="Back" />
            </div>

            {!readOnly && (
              <>
                <div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faFloppyDisk} onClick={handleSave} title="Save" />
                </div>

                {(
                  <div className="burger-menu-icon-risk-create-page-1">
                    <FontAwesomeIcon icon={faCopy} onClick={openSaveAs} title="Create Copy" />
                  </div>
                )}

                <div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faRotateLeft} onClick={undoLastChange} title="Undo" />
                </div>

                <div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faRotateRight} onClick={redoChange} title="Redo" />
                </div>

                {!inApproval && canIn(access, "TMS", ["systemAdmin"]) && (<div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faUpload} onClick={handlePubClick} className={`${!loadedID ? "disabled-share" : ""}`} title="Publish" />
                </div>)}

                {inApproval && canIn(access, "TMS", ["systemAdmin"]) && (<div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faCheckCircle} onClick={handleApproveClick} className={`${(!loadedID) ? "disabled-share" : ""}`} title="Approve Draft" />
                </div>)}

                {(inApproval) && !readOnly && canIn(access, "TMS", ["systemAdmin", "contributor"]) && (<div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon style={{ color: "#CB6F6F" }} icon={faTimesCircle} className={`${(!loadedID) ? "disabled-share" : ""}`} onClick={handleRejectClick} title="Reject Document" />
                </div>)}

                {false && canRemove && inApproval && (<div className="burger-menu-icon-risk-create-page-1">
                  <FontAwesomeIcon icon={faBan} onClick={openRemoveApproval} title="Remove From Approval Process" style={{ color: "#CB6F6F" }} />
                </div>)}
              </>
            )}
          </div>

          <div className="spacer"></div>

          <TopBarDD refreshable={false} canIn={canIn} access={access} menu={"1"} create={true} />
        </div>

        {isRejected && (<div className="input-row">
          <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#CB6F6F", color: "white", fontWeight: "bold" }}>
            This document is in Read Only Mode as it has been rejected and requires document owner intervention.
          </div>
        </div>)}

        <div className={`scrollable-box`}>
          {showPublishLoader && (
            <div className="file-info-loading" role="status" aria-live="polite" aria-label="Loading">
              <div className="file-info-loading__spinner" />
              <div className="file-info-loading__text">Loading Published Induction</div>
            </div>
          )}
          {!showPublishLoader && (
            <>
              {readOnly && !isRejected && (<div className="input-row">
                <div className={`input-box-aim-cp`} style={{ marginBottom: "10px", background: "#CB6F6F", color: "white" }}>
                  <strong>Read-only mode:</strong> This document is currently in its publishing phase and cannot be edited at this time.
                </div>
              </div>)}

              <div className="input-row">
                <div className={`input-box-title ${errors.title ? "error-create" : ""}`} style={{ marginBottom: "0px" }}>
                  <h3 className="font-fam-labels" onClick={() => console.log(formData)}>Title <span className="required-field">*</span></h3>
                  <div className="input-group-cpt">
                    <input
                      spellcheck="true"
                      style={{ fontSize: "14px" }}
                      type="text"
                      name="courseTitle"
                      className="font-fam title-input"
                      value={formData.courseTitle}
                      onChange={handleInputChange}
                      placeholder="Insert Visitor Induction Title"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="input-row">
                <div className={`input-box-aim-cp ${errors.aim ? "error-create" : ""}`}>
                  <h3 className="font-fam-labels">Introduction <span className="required-field">*</span></h3>
                  <textarea
                    style={{ fontSize: "14px" }}
                    spellcheck="true"
                    name="intorduction"
                    className="aim-textarea font-fam expanding-textarea"
                    value={formData.intorduction}
                    onChange={handleInputChange}
                    readOnly={readOnly}
                    rows="5"
                    placeholder="Insert Visitor Induction Introduction"
                  />

                  {!readOnly && (
                    <>
                      {loadingIntro ? (<FontAwesomeIcon icon={faSpinner} className="aim-textarea-icon-ibra spin-animation" />) : (
                        <FontAwesomeIcon
                          icon={faMagicWandSparkles}
                          className="aim-textarea-icon-ibra"
                          title="AI Rewrite"
                          style={{ fontSize: "15px" }}
                          onClick={() => AiRewriteIntro()}
                        />
                      )}

                      <FontAwesomeIcon
                        icon={faRotateLeft}
                        className="aim-textarea-icon-ibra-undo"
                        title="Undo AI Rewrite"
                        onClick={() => undoAiRewrite('intorduction')}
                        style={{
                          marginLeft: '8px',
                          opacity: rewriteHistory.intorduction.length ? 1 : 0.3,
                          cursor: rewriteHistory.intorduction.length ? 'pointer' : 'not-allowed',
                          fontSize: "15px"
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="input-row">
                <div className={`input-box-aim-cp ${errors.scope ? "error-create" : ""}`}>
                  <h3 className="font-fam-labels">Objectives <span className="required-field">*</span></h3>
                  <textarea
                    style={{ fontSize: "14px" }}
                    spellcheck="true"
                    name="courseObjectives"
                    className="aim-textarea font-fam expanding-textarea"
                    value={formData.courseObjectives}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="The objective of the visitor induction is to: "
                  />

                  {!readOnly && (
                    <>
                      {loadingObj ? (<FontAwesomeIcon icon={faSpinner} className="aim-textarea-icon-ibra spin-animation" />) : (
                        <FontAwesomeIcon
                          icon={faMagicWandSparkles}
                          className="aim-textarea-icon-ibra"
                          title="AI Rewrite"
                          style={{ fontSize: "15px" }}
                          onClick={() => AiRewriteObjectives()}
                        />
                      )}

                      <FontAwesomeIcon
                        icon={faRotateLeft}
                        className="aim-textarea-icon-ibra-undo"
                        title="Undo AI Rewrite"
                        onClick={() => undoAiRewrite('courseObjectives')}
                        style={{
                          marginLeft: '8px',
                          opacity: rewriteHistory.courseObjectives.length ? 1 : 0.3,
                          cursor: rewriteHistory.courseObjectives.length ? 'pointer' : 'not-allowed',
                          fontSize: "15px"
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              <AbbreviationTable collapsible={true} formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} error={errors.abbrs} userID={userID} setErrors={setErrors} readOnly={readOnly} />
              <TermTable collapsible={true} formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} error={errors.terms} userID={userID} setErrors={setErrors} readOnly={readOnly} />
              <InductionContent collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} />
              <InductionOutline collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} />
              <InductionSummary collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} />
              <InductionAssessment collapsible={true} formData={formData} setFormData={setFormData} readOnly={readOnly} />
            </>
          )}
        </div>
        {isSaveAsModalOpen && (<SaveAsInductionPopup saveAs={confirmSaveAs} onClose={closeSaveAs} current={formData.courseTitle} type={""} userID={userID} create={true} />)}
      </div>
      {preview && (<PublishedInductionPreviewPage draftID={loadedIDRef.current} closeModal={closePreview} />)}
      {confrimation && (<RepublishInduction closeModal={closeConfirmation} normalPublish={normalPublish} retakeInduction={retakeInduction} />)}
      {approval && (<ApproversPopup closeModal={closeApproval} handleSubmit={handlePublishApprovalFlow} />)}
      {removeApprovalState && (
        <RemoveFromApprovalPopup
          closeModal={closeRemoveApproval}
          removeApproval={removeFromApprovalProcess}
          docType="visitor induction"
          title={formData.courseTitle}
          loading={removingApproval}
        />
      )}
      {rejectState && (<RejectReason isOpen={rejectState} onClose={closeRejectPopup} onSubmit={rejectDraft} loading={rejecting} />)}
      {retakeConfirmation && (<RepublishInductionConfirmation closeModal={cancelRetakeConfirmation} normalPublish={cancelRetakeConfirmation} retakeInduction={confirmRetakeConfirmation} />)}
      <ToastContainer />
      {isSaving && (
        <SavingInProgress />
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

export default InductionReviewPage;