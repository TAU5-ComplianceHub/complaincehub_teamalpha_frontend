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
import { faFloppyDisk, faSpinner, faRotateLeft, faFolderOpen, faQuestionCircle, faShareNodes, faUpload, faRotateRight, faChevronLeft, faChevronRight, faInfoCircle, faTeeth, faTriangleCircleSquare, faTriangleExclamation, faUserTie, faHardHat, faMagicWandSparkles, faCircle, faPen, faSave, faArrowLeft, faArrowUp, faCaretLeft, faCaretRight, faCalendarDays, faCheckCircle, faBan, faTimesCircle, faCopy } from '@fortawesome/free-solid-svg-icons';
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
import GenerateDraftPopup from "../Popups/GenerateDraftPopup";
import DraftPopup from "../Popups/DraftPopup";
import { getCurrentUser, can, canIn, isAdmin } from "../../utils/auth";
import DatePicker from "react-multi-date-picker";
import ApproversPopup from "../VisitorsInduction/InductionCreation/ApproversPopup"
import ApproveApprovalProcessPopup from "../Popups/ApproveApprovalProcessPopup";
import SavingInProgress from "../DocumentCreationPages/SavingInProgress";
import PublishingInProgress from "../DocumentCreationPages/PublishingInProgress";
import RemoveFromApprovalPopup from "../Popups/RemoveFromApprovalPopup";
import RejectReason from "../Popups/RejectReason";
import RejectReasonView from "../Popups/RejectReasonView";

const RiskReviewPageJRA = () => {
    const navigate = useNavigate();
    const riskType = useParams().type;
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
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
    const [generatePopup, setGeneratePopup] = useState(false);
    const [azureFN, setAzureFN] = useState("");
    const fileID = useParams().fileId;
    const [change, setChange] = useState("");
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [draftNote, setDraftNote] = useState(null);
    const [approval, setApproval] = useState(false);
    const [inApproval, setInApproval] = useState(false);
    const [inReview, setInReview] = useState(false);
    const [approveState, setApproveState] = useState(false);
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

    const closeHelpRA = () => {
        setHelpRA(false);
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
            usedPPEOptions: usedPPEOptionsRef.current,
            usedEquipment: usedEquipmentRef.current,
            usedHandTools: usedHandToolsRef.current,
            usedMaterials: usedMaterialsRef.current,
            formData: formDataRef.current,
            userIDs: userIDsRef.current,
            creator: userIDRef.current,
            updater: null,
            dateUpdated: null
        };

        try {
            const body = buildReviewFormDataRequest(dataToStore, { skipFileUpload });

            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskDraft/jra/safe`, {
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
            usedPPEOptions: usedPPEOptionsRef.current,
            usedEquipment: usedEquipmentRef.current,
            usedHandTools: usedHandToolsRef.current,
            usedMaterials: usedMaterialsRef.current,
            formData: formDataRef.current
        };

        try {
            const body = buildReviewFormDataRequest(dataToStore, { skipFileUpload });

            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/jra/save/${fileID}`, {
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
            handleGenerateARegister();  // Call your function when the form is valid
        }
    };

    const handleClick3 = async () => {
        try {
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

        await handleGenerateJRADocument(updatedFormData);
    };

    const handleGenerateJRADocument = async (generateData) => {
        const dataToStore = {
            formData: generateData,
        };

        const documentName = (formData.title) + ' ' + formData.documentType + " and PTO";
        setLoading(true);

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
            setLoading(false);
            openDraftNote();
        } catch (error) {
            console.error("Error generating document:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (fileID) {
            loadData(fileID);
        }
    }, [fileID]);

    const getNewAzureFileName = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/fileGenDocs/jra/getFile/${fileID}`,
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

    const loadData = async (fileID) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/fileGenDocs/jra/getFile/${fileID}`,
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
            const storedData = data.files;
            const readOnly = data.readOnly || false;
            const canRemove = data.canRemove || false;
            const isRejectedFromServer = canRemove
                ? false
                : Boolean(storedData.isRejected || data.isRejected);
            const isRejectedForOwner = canRemove && Boolean(storedData.isRejected || data.isRejected);

            setReadOnly(Boolean(data.readOnly) || isRejectedFromServer);
            setIsRejected(isRejectedFromServer);
            setUsedAbbrCodes(storedData.usedAbbrCodes || []);
            setUsedTermCodes(storedData.usedTermCodes || []);
            setUsedPPEOptions(storedData.usedPPEOptions || []);
            setUsedHandTools(storedData.usedHandTools || []);
            setUsedEquipment(storedData.usedEquipment || []);
            setUsedMobileMachines(storedData.usedMobileMachine || []);
            setUsedMaterials(storedData.usedMaterials || []);
            setFormData(storedData.formData || {});
            setFormData(prev => ({ ...prev }));
            setTitleSet(true);
            setAzureFN(storedData.azureFileName || "");
            setInApproval(Boolean(data.statusApproval));
            setInReview(Boolean(data.statusReview));
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
            changeTable: [...lastCT, newChange]
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/start-approval-jra-published`, {
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/approve-published-jra`, {
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/reject-published-jra`, {
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/riskApprovals/remove-from-approval-jra-published`, {
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
            usedAbbrCodes: usedAbbrCodesRef.current,       // your current state values
            usedTermCodes: usedTermCodesRef.current,
            usedPPEOptions: usedPPEOptionsRef.current,
            usedEquipment: usedEquipmentRef.current,
            usedHandTools: usedHandToolsRef.current,
            usedMaterials: usedMaterialsRef.current,
            usedMobileMachine: usedMobileMachineRef.current,
            formData: formDataToStore,
            userID,
            azureFN: azureFN,
            draftID: ""
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/t/publish-jra-sheet1`, {
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
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/jra/resolveRejected/${fileID}`, {
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
                        <img src={`${process.env.PUBLIC_URL}/jra2.svg`} alt="Control Attributes" className="icon-risk-rm" />
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
                                    readOnly
                                    placeholder="Insert the Risk Assessment Title (E.g. Perform Earth Leakage Test on Electrical Circuits)"
                                />
                                <span className="type-risk-create-JRA">{formData.documentType + " and PTO"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="input-row-risk-create">
                        <div className="input-box-type-risk-create">
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
                        <div className="input-box-type-risk-create-date">
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

                    <DocumentSignaturesRiskTable readOnly={readOnly} rows={formData.rows} handleRowChange={handleRowChange} addRow={addRow} removeRow={removeRow} error={errors.signs} updateRows={updateSignatureRows} />
                    <AbbreviationTableRisk collapsible={true} readOnly={readOnly} risk={true} formData={formData} setFormData={setFormData} usedAbbrCodes={usedAbbrCodes} setUsedAbbrCodes={setUsedAbbrCodes} error={errors.abbrs} userID={userID} />
                    <TermTableRisk collapsible={true} readOnly={readOnly} risk={true} formData={formData} setFormData={setFormData} usedTermCodes={usedTermCodes} setUsedTermCodes={setUsedTermCodes} error={errors.terms} userID={userID} />
                    <IntroTaskInfo collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} />
                    <PPETableRisk collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedPPEOptions={usedPPEOptions} setUsedPPEOptions={setUsedPPEOptions} userID={userID} />
                    <HandToolsTableRisk collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedHandTools={usedHandTools} setUsedHandTools={setUsedHandTools} userID={userID} />
                    <MaterialsTableRisk collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedMaterials={usedMaterials} setUsedMaterials={setUsedMaterials} userID={userID} />
                    <EquipmentTableRisk collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedEquipment={usedEquipment} setUsedEquipment={setUsedEquipment} userID={userID} />
                    <MobileMachineTableRisk collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} usedMobileMachine={usedMobileMachine} setUsedMobileMachine={setUsedMobileMachines} userID={userID} />
                    <AttendanceTable collapsible={true} readOnly={readOnly} title={formData.title} documentType={formData.documentType} rows={formData.attendance} addRow={addAttendanceRow} error={errors.attendance} removeRow={removeAttendanceRow} updateRows={updateAttendanceRows} userID={userID} generateAR={handleClick} />
                    <JRATable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} isSidebarVisible={isSidebarVisible} />
                    <OtherTeam collapsible={false} readOnly={readOnly} formData={formData} />
                    <SupportingDocumentTable collapsible={true} readOnly={readOnly} formData={formData} setFormData={setFormData} />
                    <ReferenceTable collapsible={true} readOnly={readOnly} referenceRows={formData.references} addRefRow={addRefRow} removeRefRow={removeRefRow} updateRefRow={updateRefRow} updateRefRows={updateRefRows} />
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
                            onClick={handleGenerateDocument}
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
            {draftNote && (<DraftPopup closeModal={closeDraftNote} />)}
            <ToastContainer />

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
                    docType="JRA"
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

export default RiskReviewPageJRA;