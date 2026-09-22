import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import Forbidden from './components/Forbidden';
import NotFound from './components/NotFound';
import FileInfo from './components/FileInfo';
import HomePage from './components/HomePage';
import CreatePage from './components/DocumentCreationPages/CreatePage';
import UserManagement from './components/UserManagement';
import PreviewPage from './components/PreviewPage';
import LoginPageMobile from './components/Mobile/LoginPageMobile';
import ForgotPassword from './components/ForgotPassword';
import ForgotPasswordMobile from './components/Mobile/ForgotPasswordMobile';
import MobileFileInfo from './components/Mobile/MobileFileInfo';
import MobileHomePage from './components/Mobile/MobileHomePage';
import VersionControlPage from './components/VersionControlPage';
import NewLogin from './components/NewLogin';
import ReviewPage from './components/ReviewPage';
import GeneratedFileInfo from './components/GeneratedFileInfo';
import AdminApprovalPage from './components/ValueChanges/AdminApprovalPage';
import FileInfoHome from './components/FileInfoHome';
import DepartmentHome from './components/DepartmentHome';
import DepartmentView from './components/DepartmentView';
import ConstructionCM from './components/ConstructionCM';
import ConstructionRM from './components/ConstructionRM';
import ConstructionTM from './components/ConstructionTM';
import AdminPage from './components/AdminPage';
import UserActivity from './components/UserActivity';
import VersionHistory from './components/FileInfo/VersionHistory';
import RiskManagementPageIBRA from './components/RiskAssessmentPages/RiskManagementPageIBRA';
import RiskManagementPageJRA from './components/RiskAssessmentPages/RiskManagementPageJRA';
import RiskHomePage from './components/RiskRelated/RiskHomePage';
import DCHomePage from './components/DCHomePage';
import TimeoutPopup from './components/AccountLockout/TimeoutPopup';
import ConstructionDDS from './components/Construction/ConstructionDDS';
import ConstructionRMS from './components/Construction/ConstructionRMS';
import ConstructionHelp from './components/Construction/ConstructionHelp';
import ControlAttributes from './components/RiskRelated/ControlAttributes';
import RiskDocumentsIBRA from './components/RiskRelated/RiskDocuments/RiskDocumentsIBRA';
import RiskDocumentsJRA from './components/RiskRelated/RiskDocuments/RiskDocumentsJRA';
import RiskDocumentsBLRA from './components/RiskRelated/RiskDocuments/RiskDocumentsBLRA';
import RiskManagementPageBTA from './components/RiskAssessmentPages/RiskManagementPageBTA';
import CreatePageStandards from './components/DocumentCreationPages/CreatePageStandards';
import RiskSIPage from './components/RiskRelated/RiskValueChanges/RiskSIPage';
import ConstructionJRA from './components/Construction/ConstructionJRA';
import RiskManagementPageBLRA from './components/RiskAssessmentPages/RiskManagementPageBLRA';
import FutureEnhancementPage from './components/FutureEnhancementPages/FutureEnhancementPage';
import FutureEnhancementPageRMS from './components/FutureEnhancementPages/FutureEnhancementPageRMS';
import CreatePageSI from './components/DocumentCreationPages/CreatePageSI';
import GeneratedStandardsInfo from './components/GeneratedStandardsInfo';
import RiskReviewPageIBRA from './components/RiskAssessmentPages/RiskReviewPageIBRA';
import RiskReviewPageJRA from './components/RiskAssessmentPages/RiskReviewPageJRA';
import GeneratedSpecialInfo from './components/GeneratedSpecialInfo';
import VersionHistoryIBRA from './components/RiskRelated/RiskDocuments/VersionHistoryIBRA';
import DeletedRiskDocumentsIBRA from './components/RiskRelated/RiskDocuments/DeletedRiskDocumentsIBRA';
import RiskReviewPageBLRA from './components/RiskAssessmentPages/RiskReviewPageBLRA';
import CreatePageStandardsReview from './components/DocumentCreationPages/CreatePageStandardsReview';
import CreatePageSIReview from './components/DocumentCreationPages/CreatePageSIReview';
import DeletedDocumentsSI from './components/DocumentCreationPages/DeletedDocumentsSI';
import VersionHistorySI from './components/DocumentCreationPages/VersionHistorySI';
import VersionHistoryStandard from './components/DocumentCreationPages/VersionHistoryStandard';
import DeletedDocumentsStandard from './components/DocumentCreationPages/DeletedDocumentsStandard';
import VersionHistoryBLRA from './components/RiskRelated/RiskDocuments/VersionHistoryBLRA';
import DeletedRiskDocumentsBLRA from './components/RiskRelated/RiskDocuments/DeletedRiskDocumentsBLRA';
import VersionHistoryJRA from './components/RiskRelated/RiskDocuments/VersionHistoryJRA';
import DeletedRiskDocumentsJRA from './components/RiskRelated/RiskDocuments/DeletedRiskDocumentsJRA';
import VersionHistoryProcedure from './components/DocumentCreationPages/VersionHistoryProcedure';
import DeletedDocumentsProcedure from './components/DocumentCreationPages/DeletedDocumentsProcedure';
import UserProfile from './components/UserProfile/UserProfile';
import CourseHome from './components/TrainingManagement/CourseHome';
import TMSAdminPage from './components/SystemAdmin/TMSAdminPage';
import CourseDetails from './components/TrainingManagement/CourseDetails';
import TrainersHome from './components/TrainingManagement/TrainerManagement/TrainersHome';
import TrainerDetails from './components/TrainingManagement/TrainerManagement/TrainerDetails';
import TraineesHome from './components/TrainingManagement/TraineeMangement/TraineesHome';
import TraineeDetails from './components/TrainingManagement/TraineeMangement/TraineeDetails';
import DMSAdminPage from './components/SystemAdmin/DMSAdminPage';
import RMSAdminPage from './components/SystemAdmin/RMSAdminPage';
import DDSAdminPage from './components/SystemAdmin/DDSAdminPage';
import TrainingAdminPage from './components/SystemAdmin/TrainingAdminPage';
import CourseCreationPage from './components/TrainingManagement/CourseCreation/CourseCreationPage';
import CourseViewPage from './components/TrainingManagement/CourseView/CourseViewPage';
import UserHomePageTMS from './components/TrainingManagement/UserView/UserHomePageTMS';
import FlameProofHome from './components/FlameproofDMS/FlameProofHome';
import FlameProofMain from './components/FlameproofDMS/FlameProofMain';
import FlameProofSub from './components/FlameproofDMS/FlameProofSub';
import FlameProofAllSites from './components/FlameproofDMS/FlameProofAllSites';
import FlameProofInfoAll from './components/FlameproofDMS/FlameProofInfoAll';
import FCMSAdminPage from './components/SystemAdmin/FCMSAdminPage';
import PreviewCertificate from './components/FlameproofDMS/PreviewCertificate';
import EPACSHome from './components/EPACS/EPACSHome';
import CertificateVersionHistory from './components/FlameproofDMS/CertificateVersionHistory';
import FlameProofTrash from './components/FlameproofDMS/FlameProofTrash';
import FCMSSiteAdmin from './components/SystemAdmin/FCMSSiteAdmin';
import VisitorsInductionHomePage from './components/VisitorsInduction/VisitorsInductionHomePage';
import VisitorsInductionSite from './components/VisitorsInductionSite';
import FCMSAssetTypes from './components/SystemAdmin/FCMSAssetTypes';
import InductionViewPage from './components/TrainingManagement/CourseView/InductionViewPage';
import VisitorInductionHomePage from './components/TrainingManagement/UserView/VisitorInductionHomePage';
import VisitorLogin from './components/VisitorsInduction/VisitorLogin';
import InductionCreationPage from './components/VisitorsInduction/InductionCreation/InductionCreationPage';
import GeneratedInductionInfo from './components/VisitorsInduction/InductionCreation/GeneratedInductionInfo';
import ManageComponentDates from './components/FlameproofDMS/ManageComponentDates';
import TMSHomePage from './components/TrainingManagement/TMSHomePage';
import ManageComponentAssets from './components/FlameproofDMS/ManageComponentAssets';
import FutureEnhancementPageEPAC from './components/FutureEnhancementPages/FutureEnhancementPageEPAC';
import VisitorInductionMainPage from './components/VisitorsInduction/VisitorInductionMainPage';
import FutureEnhancementPageTMS from './components/FutureEnhancementPages/FutureEnhancementPageTMS';
import InductionReviewPage from './components/VisitorsInduction/InductionCreation/InductionReviewPage';
import VersionHistoryInductions from './components/VisitorsInduction/InductionCreation/VersionHistoryInductions';
import PreviewCertificateInduction from './components/VisitorsInduction/PreviewCertificateInduction';
import VisitorPasswordSetup from './components/VisitorsInduction/VisitorPasswordSetup';
import ResetVisitorPassword from './components/VisitorsInduction/ResetVisitorPassword';
import InductionDrafts from './components/VisitorsInduction/InductionCreation/InductionDrafts';
import FlameProofCertifiers from './components/FlameproofDMS/FlameProofCertifiers';
import FlameProofDigitalWarehouse from './components/FlameproofDMS/FlameProofDigitalWarehouse';
import FlameProofHomeAllSites from './components/FlameproofDMS/FlameProofHomeAllSites';
import FlameProofMainAllSites from './components/FlameproofDMS/FlameProofMainAllSites';
import DigitalWarehouseRemoved from './components/FlameproofDMS/WarehousePages/DigitalWarehouseRemoved';
import PreviewCertifier from './components/FlameproofDMS/CertifiersPages/PreviewCertifier';
import InvalidPageMobile from './components/Mobile/InvalidPageMobile';
import RedirectLogin from './components/RedirectLogin';
import VersionHistoryAssets from './components/FlameproofDMS/VersionHistoryAssets';
import OnlineTrainingHomePage from './components/OnlineTrainingModule/OnlineTrainingHomePage';
import OnlineCourseCreationPage from './components/OnlineTrainingModule/OnlineCourseCreationPage';
import OnlineTrainingReviewPage from './components/OnlineTrainingModule/OnlineTrainingReviewPage';
import OnlineTrainingDrafts from './components/OnlineTrainingModule/OnlineTrainingDrafts';
import OnlineTrainingPublished from './components/OnlineTrainingModule/OnlineTrainingPublished';
import OnlineTrainingStudentProfiles from './components/OnlineTrainingModule/OnlineTrainingStudentProfiles';
import VersionHistoryOnlineTraining from './components/OnlineTrainingModule/VersionHistoryOnlineTraining';
import VisitorManagementPage from './components/VisitorManagement/VisitorManagementPage';
import VisitorManagementDevices from './components/VisitorManagement/VisitorManagementDevices';
import VisitorManagementDeletedDevices from './components/VisitorManagement/VisitorManagementDeletedDevices';
import VisitorRegisteredDevices from './components/TrainingManagement/UserView/VisitorRegisteredDevices';
import StudentProfileSetup from './components/OnlineTrainingModule/UserView/StudentProfileSetup';
import StudentInvalidPageMobile from './components/OnlineTrainingModule/UserView/StudentInvalidPageMobile';
import StudentPasswordSetup from './components/OnlineTrainingModule/UserView/StudentPasswordSetup';
import StudentLogin from './components/OnlineTrainingModule/UserView/StudentLogin';
import ResetStudentPassword from './components/OnlineTrainingModule/UserView/ResetStudentPassword';
import StudentProfileHomePage from './components/OnlineTrainingModule/UserView/StudentProfileHomePage';
import StudentCourseViewPage from './components/OnlineTrainingModule/UserView/StudentCourseViewPage';
import OnlineTrainingCourseManagement from './components/OnlineTrainingModule/OnlineTrainingCourseManagement';
import OTChatCourses from './components/OnlineTrainingModule/ChatBox/OTChatCourses';
import OTUnclaimedChats from './components/OnlineTrainingModule/ChatBox/OTUnclaimedChats';
import OTClaimedChats from './components/OnlineTrainingModule/ChatBox/OTClaimedChats';
import PreviewCertificateStudentProfile from './components/OnlineTrainingModule/UserView/PreviewCertificateStudentProfile';
import OnlineTrainingCourseGrading from './components/OnlineTrainingModule/OnlineTrainingCourseGrading';
import SuggestedControls from './components/RiskRelated/ControlManagement/SuggestedControls';
import ControlVersionHistory from './components/RiskRelated/ControlVersionHistory';
import StudentProfilePage from './components/OnlineTrainingModule/StudentProfile/StudentProfilePage';
import JRAAttributes from './components/RiskRelated/JRAAttributes';
import RiskDrafts from './components/RiskRelated/RiskDrafts/RiskDrafts';
import DDSDrafts from './components/CreatePage/DDSDrafts/DDSDrafts';
import MigrationPage from './components/SystemAdmin/MigrationPage';
import TrainingDrafts from './components/TrainingManagement/Drafts/TrainingDrafts';
import SignedOffProcedures from './components/CreatePage/SignedOffDocuments/SignedOffProcedures';
import ReviewPageSOProcedure from './components/CreatePage/SignedOffDocuments/ReviewPageSOProcedure';
import VersionHistorySOProcedure from './components/CreatePage/SignedOffDocuments/VersionHistorySOProcedure';
import SignedOffStandards from './components/CreatePage/SignedOffDocuments/SignedOffStandards';
import VersionHistorySOStandard from './components/CreatePage/SignedOffDocuments/VersionHistorySOStandard';
import ReviewPageSOStandard from './components/CreatePage/SignedOffDocuments/ReviewPageSOStandard';
import DeletedDocumentsSOStandard from './components/CreatePage/SignedOffDocuments/DeletedDocumentsSOStandard';
import ReviewPageSOSpecial from './components/CreatePage/SignedOffDocuments/ReviewPageSOSpecial';
import VersionHistorySOSpecial from './components/CreatePage/SignedOffDocuments/VersionHistorySOSpecial';
import SignedOffSpecial from './components/CreatePage/SignedOffDocuments/SignedOffSpecial';
import DeletedDocumentsSOSpecial from './components/CreatePage/SignedOffDocuments/DeletedDocumentsSOSpecial';
import SignedOffIBRA from './components/RiskRelated/SignedOffDocuments/SignedOffIBRA';
import ReviewPageSOIBRA from './components/RiskRelated/SignedOffDocuments/ReviewPageSOIBRA';
import VersionHistorySOIBRA from './components/RiskRelated/SignedOffDocuments/VersionHistorySOIBRA';
import DeletedDocumentsSOIBRA from './components/RiskRelated/SignedOffDocuments/DeletedDocumentsSOIBRA';
import DeletedDocumentsSOBLRA from './components/RiskRelated/SignedOffDocuments/DeletedDocumentsSOBLRA';
import SignedOffBLRA from './components/RiskRelated/SignedOffDocuments/SignedOffBLRA';
import VersionHistorySOBLRA from './components/RiskRelated/SignedOffDocuments/VersionHistorySOBLRA';
import ReviewPageSOBLRA from './components/RiskRelated/SignedOffDocuments/ReviewPageSOBLRA';
import SignedOffJRA from './components/RiskRelated/SignedOffDocuments/SignedOffJRA';
import DeletedDocumentsSOJRA from './components/RiskRelated/SignedOffDocuments/DeletedDocumentsSOJRA';
import VersionHistorySOJRA from './components/RiskRelated/SignedOffDocuments/VersionHistorySOJRA';
import ReviewPageSOJRA from './components/RiskRelated/SignedOffDocuments/ReviewPageSOJRA';
import DeletedDocumentsSOProcedure from './components/CreatePage/SignedOffDocuments/DeletedDocumentsSOProcedure';
import ScopeOnlyDocxTestPage from './components/ScopeOnlyDocxTestPage';
import SGIBackupHistory from './components/SystemAdmin/SGIBackupHistory';
import SGIAdminPage from './components/SystemAdmin/SGIAdminPage';
import SGIVersionHistory from './components/SystemAdmin/SGIVersionHistory';
import DeletedControlAttributes from './components/RiskRelated/DeletedControls/DeletedControlAttributes';
import DeletedControlVersionHistory from './components/RiskRelated/DeletedControls/DeletedControlVersionHistory';
import DraftsPage from './components/CreatePage/DraftsPage';
import RiskDraftsPage from './components/RiskRelated/RiskDraftsPage';
import DeletedRiskDraftsPage from './components/RiskRelated/DeletedRiskDraftsPage';
import DeletedDMSDraftsPage from './components/CreatePage/DeletedDMSDraftsPage';
import ProcedureHomePage from './components/CreatePage/HomePages/ProcedureHomePage';
import StandardHomePage from './components/CreatePage/HomePages/StandardHomePage';
import SpecialHomePage from './components/CreatePage/HomePages/SpecialHomePage';
import JRAHomePage from './components/RiskRelated/HomePages/JRAHomePage';
import BLRAHomePage from './components/RiskRelated/HomePages/BLRAHomePage';
import IBRAHomePage from './components/RiskRelated/HomePages/IBRAHomePage';
import DeletedTMSDraftsPage from './components/TrainingManagement/Drafts/DeletedTMSDraftsPage';
import CTSHome from './components/ComplainceTracking/CTSHome';
import TaskingHomePage from './components/ComplainceTracking/TaskingHomePage';
import ManualTaskingHomePage from './components/ComplainceTracking/TaskingPages/ManualTasking/ManualTaskingHomePage';
import ManualTaskingAllocationPage from './components/ComplainceTracking/TaskingPages/ManualTasking/ManualTaskingAllocationPage';
import ManualTaskingViewPage from './components/ComplainceTracking/TaskingPages/ManualTasking/ManualTaskingViewPage';
import ManualTaskingPage from './components/ComplainceTracking/TaskingPages/ManualTasking/ManualTaskingPage';
import TaskVersionHistoryPage from './components/ComplainceTracking/TaskingPages/ManualTasking/TaskVersionHistoryPage';
import TaskTemplatesPage from './components/ComplainceTracking/TaskingPages/ManualTasking/TaskTemplatesPage';
import DeletedTaskTemplates from './components/ComplainceTracking/TaskingPages/ManualTasking/DeletedTaskTemplates';
import SuggestedTaskTemplates from './components/ComplainceTracking/TaskingPages/ManualTasking/SuggestedTaskTemplates';
import InfoPage from './components/InfoPage';
import DMSDashboard from './components/DMSDashboard';
import DMSMainDash from './components/CTSDashboards/DMSMainDash';
import DDSMainDash from './components/CTSDashboards/DDSMainDash';
import RMSMainDash from './components/CTSDashboards/RMSMainDash';
import EPAMSMainDash from './components/CTSDashboards/EPAMSMainDash';
import CMMainDash from './components/CTSDashboards/CMMainDash';
import TrainingInfoPage from './components/TrainingInfoPage';
import DWMainDash from './components/CTSDashboards/DWMainDash';
import CTSMainDash from './components/CTSDashboards/CTSMainDash';
import TMSMainDash from './components/CTSDashboards/TMSMainDash';
import WorkManagement from './components/ComplainceTracking/TaskingPages/ManualTasking/WorkManagement';
import FieldTemplateHomePage from './components/FieldTracking/FieldTemplateHomePage';
import FTSCreateHomePage from './components/FieldTracking/FTSCreateHomePage';
import FTSTemplatesDraftsPage from './components/FieldTracking/FTSTemplatesDraftsPage';
import FTSSignedOffTemplates from './components/FieldTracking/FTSSignedOffTemplates';
import FTSDeletedTemplatesSO from './components/FieldTracking/FTSDeletedTemplatesSO';
import FTSVersionHistorySO from './components/FieldTracking/FTSVersionHistorySO';
import FTSTemplateDocuments from './components/FieldTracking/FTSTemplateDocuments';
import FTSDeletedTemplateDocuments from './components/FieldTracking/FTSDeletedTemplateDocuments';
import FTSVersionHistory from './components/FieldTracking/FTSVersionHistory';
import FTSCreatePageTemplate from './components/FieldTracking/FTSCreatePageTemplate';
import FTSCreatePageTemplatesReview from './components/FieldTracking/FTSCreatePageTemplatesReview';
import FTSDeletedTemplateDraftsPage from './components/FieldTracking/FTSDeletedTemplateDraftsPage';
import StandardFieldsFTS from './components/FieldTracking/StandardFieldsFTS';
import SuggestedStandardFieldsFTS from './components/FieldTracking/SuggestedStandardFieldsFTS';
import ApprovalsPage from './components/DocumentCreationPages/ApprovalsPage';
import ApprovalsRiskPage from './components/RiskRelated/ApprovalsRiskPage';
import InductionApprovalsPage from './components/VisitorsInduction/InductionCreation/InductionApprovalsPage';
import OnlineTrainingApprovalsPage from './components/OnlineTrainingModule/OnlineTrainingApprovalsPage';
import CreateRevisionPage from './components/DocumentCreationPages/CreateRevisionPage';
import RiskRevisionPage from './components/RiskRelated/RiskRevisionPage';
import UnderRevisionTemplateDocuments from './components/FieldTracking/UnderRevisionTemplateDocuments';
import GeneratedInductionInfoRevision from './components/VisitorsInduction/InductionCreation/GeneratedInductionInfoRevision';
import OnlineTrainingRevision from './components/OnlineTrainingModule/OnlineTrainingRevision';
import VersionHistoryPage from './components/DocumentCreationPages/VersionHistoryPage';
import VersionPreviewPage from './components/DocumentCreationPages/VersionPreviewPage';
import RiskVersionHistoryPage from './components/RiskAssessmentPages/RiskVersionHistoryPage';
import RiskVersionPreviewPage from './components/RiskAssessmentPages/RiskVersionPreviewPage';
import InductionVersionHistoryPage from './components/VisitorsInduction/InductionCreation/InductionVersionHistoryPage';
import OnlineTrainingVersionHistoryPage from './components/OnlineTrainingModule/OnlineTrainingVersionHistoryPage';
import TrainingVersionPreviewPage from './components/VisitorsInduction/InductionCreation/TrainingVersionPreviewPage';
import FTSVersionHistoryPage from './components/FieldTracking/FTSVersionHistoryPage';
import SignedOffPreviewDDS from './components/DocumentCreationPages/SignedOffPreviewDDS';
import SignedOffPreviewRMS from './components/RiskRelated/SignedOffPreviewRMS';

const AUTO_LOGOUT_TIME = 45 * 60 * 1000;
const WARNING_TIME = 5 * 60 * 1000;

function App() {
  const navigate = useNavigate();
  const timer = useRef(null);
  const warningTimer = useRef(null);
  const isLoggedIn = !!localStorage.getItem('token');
  const [showWarning, setShowWarning] = useState(false);

  const logout = () => {
    const localToken = localStorage.getItem('token');
    const sessionToken = sessionStorage.getItem('visitorToken');

    if (localToken) {
      localStorage.removeItem('token');
      console.log('Logged out (localStorage token) due to inactivity');
      navigate('/FrontendDMS/');
    } else if (sessionToken) {
      sessionStorage.removeItem('token');
      console.log('Logged out (sessionStorage token) due to inactivity');
      navigate('/FrontendDMS/visitorLogin');
    } else {
      console.log('No token found to log out.');
      navigate('/FrontendDMS/');
    }

    // Common cleanup
    setShowWarning(false);
  };

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);

    warningTimer.current = setTimeout(() => {
      setShowWarning(true);
    }, AUTO_LOGOUT_TIME - WARNING_TIME);

    timer.current = setTimeout(() => {
      logout();
    }, AUTO_LOGOUT_TIME);
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // Start timer on mount

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [isLoggedIn]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    resetTimer();
  };

  const handleLogoutNow = () => {
    setShowWarning(false);
    logout();
  };

  return (
    <>
      <Routes>
        {/* Desktop Routes */}
        <Route path="FrontendDMS/" element={isMobile ? <Navigate to="/FrontendDMS/mobileLogin" /> : <NewLogin />} />
        <Route path="FrontendDMS/visitorLogin" element={isMobile ? <Navigate to="/FrontendDMS/invalidDevice" /> : <VisitorLogin />} />
        <Route path="FrontendDMS/home" element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <HomePage />} />
        <Route path='FrontendDMS/documentCreateHome' element={<DCHomePage />} />
        <Route path="FrontendDMS/documentCreateProc/:type/:id" element={isMobile ? <Navigate to="/mobileHome" /> : <CreatePage />} />
        <Route path="FrontendDMS/documentCreateStand/:type/:id" element={isMobile ? <Navigate to="/mobileHome" /> : <CreatePageStandards />} />
        <Route path="FrontendDMS/documentCreateSI/:type/:id" element={isMobile ? <Navigate to="/mobileHome" /> : <CreatePageSI />} />
        <Route path='FrontendDMS/userManagement' element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <UserManagement />} />
        <Route path='FrontendDMS/403' element={<Forbidden />} />
        <Route path="FrontendDMS/preview/:fileId" element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <PreviewPage />} />
        <Route path='FrontendDMS/forgot' element={isMobile ? <Navigate to="/FrontendDMS/mobileForgot" /> : <ForgotPassword />} />
        <Route path='FrontendDMS/updateFile' element={isMobile ? <Navigate to="/FrontendDMS/mobileHome" /> : <VersionControlPage />} />
        <Route path='FrontendDMS/generatedFileInfo' element={<GeneratedFileInfo />} />
        <Route path='FrontendDMS/deletedProcedureDocs' element={<DeletedDocumentsProcedure />} />
        <Route path='FrontendDMS/generatedSpecialFiles' element={<GeneratedSpecialInfo />} />
        <Route path='FrontendDMS/deletedSIDocs' element={<DeletedDocumentsSI />} />
        <Route path='FrontendDMS/generatedStandardFiles' element={<GeneratedStandardsInfo />} />
        <Route path='FrontendDMS/deletedStandardDocs' element={<DeletedDocumentsStandard />} />
        <Route path='FrontendDMS/adminApprover/:id' element={<AdminApprovalPage />} />
        <Route path='FrontendDMS/review/:fileId' element={<ReviewPage />} />
        <Route path='FrontendDMS/reviewIBRA/:fileId/:type' element={<RiskReviewPageIBRA />} />
        <Route path='FrontendDMS/reviewJRA/:fileId/:type' element={<RiskReviewPageJRA />} />
        <Route path='FrontendDMS/reviewBLRA/:fileId/:type' element={<RiskReviewPageBLRA />} />
        <Route path='FrontendDMS/reviewStandard/:fileId/:type' element={<CreatePageStandardsReview />} />
        <Route path='FrontendDMS/reviewSpecial/:fileId/:type' element={<CreatePageSIReview />} />
        <Route path="FrontendDMS/documentManageHome" element={<FileInfoHome />} />
        <Route path="FrontendDMS/documentManage/:type/:fileIds" element={isMobile ? <Navigate to="/mobileFI" /> : <FileInfo />} />
        <Route path="FrontendDMS/EPACSHome" element={<EPACSHome />} />
        <Route path="FrontendDMS/flameManageSites" element={<FlameProofAllSites />} />
        <Route path="FrontendDMS/flameTrash" element={<FlameProofTrash />} />
        <Route path="FrontendDMS/flameManageHome/:site" element={<FlameProofHome />} />
        <Route path="FrontendDMS/flameAllMineAsset" element={<FlameProofInfoAll />} />
        <Route path="FrontendDMS/flameManage/:type/:site" element={<FlameProofMain />} />
        <Route path="FrontendDMS/flameManageSub/:type/:assetId/:certIDs" element={<FlameProofSub />} />
        <Route path="FrontendDMS/flameComponents/:id" element={<ManageComponentDates />} />
        <Route path="FrontendDMS/flameVersionHistory/:id/:image/:text" element={<CertificateVersionHistory />} />
        <Route path="FrontendDMS/flameSites/" element={<FCMSSiteAdmin />} />
        <Route path="FrontendDMS/flameAssets/" element={<FCMSAssetTypes />} />
        <Route path="FrontendDMS/previewCertificate/:fileId" element={<PreviewCertificate />} />
        <Route path="FrontendDMS/departmentManage" element={<DepartmentHome />} />
        <Route path="FrontendDMS/department/:deptId" element={<DepartmentView />} />
        <Route path="FrontendDMS/constructionCM" element={<ConstructionCM />} />
        <Route path="FrontendDMS/constructionTM" element={<ConstructionTM />} />
        <Route path="FrontendDMS/constructionRM" element={<ConstructionRM />} />
        <Route path="FrontendDMS/constructionDDS" element={<ConstructionDDS />} />
        <Route path="FrontendDMS/constructionJRA" element={<ConstructionJRA />} />
        <Route path="FrontendDMS/constructionRMS/:type" element={<ConstructionRMS />} />
        <Route path="FrontendDMS/constructionHelp" element={<ConstructionHelp />} />
        <Route path="FrontendDMS/admin" element={<AdminPage />} />
        <Route path="FrontendDMS/userActivity/:id" element={<UserActivity />} />
        <Route path="FrontendDMS/versionHistory/:id" element={<VersionHistory />} />
        <Route path="FrontendDMS/versionHistoryIBRA/:id" element={<VersionHistoryIBRA />} />
        <Route path="FrontendDMS/versionHistorySpecial/:id" element={<VersionHistorySI />} />
        <Route path="FrontendDMS/versionHistoryStandard/:id" element={<VersionHistoryStandard />} />
        <Route path="FrontendDMS/versionHistoryProcedure/:id" element={<VersionHistoryProcedure />} />
        <Route path="FrontendDMS/versionHistoryBLRA/:id" element={<VersionHistoryBLRA />} />
        <Route path="FrontendDMS/versionHistoryJRA/:id" element={<VersionHistoryJRA />} />
        <Route path='FrontendDMS/riskHome' element={<RiskHomePage />} />
        <Route path="FrontendDMS/riskIBRA/:type/:id" element={<RiskManagementPageIBRA />} />
        <Route path="FrontendDMS/riskJRA/:type/:id" element={<RiskManagementPageJRA />} />
        <Route path="FrontendDMS/riskBTA/:type" element={<RiskManagementPageBTA />} />
        <Route path="FrontendDMS/riskBLRA/:type/:id" element={<RiskManagementPageBLRA />} />
        <Route path="FrontendDMS/controls" element={<ControlAttributes />} />
        <Route path='FrontendDMS/generatedIBRADocs' element={<RiskDocumentsIBRA />} />
        <Route path='FrontendDMS/deletedIBRADocs' element={<DeletedRiskDocumentsIBRA />} />
        <Route path='FrontendDMS/generatedJRADocs' element={<RiskDocumentsJRA />} />
        <Route path='FrontendDMS/deletedJRADocs' element={<DeletedRiskDocumentsJRA />} />
        <Route path='FrontendDMS/generatedBLRADocs' element={<RiskDocumentsBLRA />} />
        <Route path='FrontendDMS/deletedBLRADocs' element={<DeletedRiskDocumentsBLRA />} />
        <Route path='FrontendDMS/riskApprover/:id' element={<RiskSIPage />} />
        <Route path='FrontendDMS/futureEnhancement' element={<FutureEnhancementPage />} />
        <Route path='FrontendDMS/futureEnhancementRMS' element={<FutureEnhancementPageRMS />} />
        <Route path='FrontendDMS/futureEnhancementEPAC' element={<FutureEnhancementPageEPAC />} />
        <Route path='FrontendDMS/futureEnhancementTMS' element={<FutureEnhancementPageTMS />} />
        <Route path='FrontendDMS/userProfile' element={<UserProfile />} />
        <Route path='FrontendDMS/tmsAdmin' element={<TMSAdminPage />} />
        <Route path='FrontendDMS/tmsAdmin/manageTraining' element={<TrainingAdminPage />} />
        <Route path='FrontendDMS/dmsAdmin' element={<DMSAdminPage />} />
        <Route path='FrontendDMS/rmsAdmin' element={<RMSAdminPage />} />
        <Route path='FrontendDMS/ddsAdmin' element={<DDSAdminPage />} />
        <Route path='FrontendDMS/fcmsAdmin' element={<FCMSAdminPage />} />
        <Route path='FrontendDMS/trainingHomePage' element={<TMSHomePage />} />
        <Route path='FrontendDMS/courseMangement' element={<CourseHome />} />
        <Route path='FrontendDMS/courseDetails/:courseCode' element={<CourseDetails />} />
        <Route path='FrontendDMS/trainerManagement' element={<TrainersHome />} />
        <Route path='FrontendDMS/trainerDetails/:trainerName' element={<TrainerDetails />} />
        <Route path='FrontendDMS/traineeManagement' element={<TraineesHome />} />
        <Route path='FrontendDMS/traineeDetails/:traineeName' element={<TraineeDetails />} />
        <Route path='FrontendDMS/courseCreate' element={<CourseCreationPage />} />
        <Route path='FrontendDMS/courseView/:courseCode' element={<CourseViewPage />} />
        <Route path='FrontendDMS/inductionView/:id' element={<InductionViewPage />} />
        <Route path='FrontendDMS/courseHomeViewPage' element={<UserHomePageTMS />} />
        <Route path='FrontendDMS/visitorView' element={<VisitorsInductionHomePage />} />
        <Route path='FrontendDMS/visitorHomePage' element={<VisitorInductionHomePage />} />
        <Route path='FrontendDMS/visitor-profile' element={isMobile ? <Navigate to="/FrontendDMS/invalidDevice" /> : <VisitorsInductionSite />} />
        <Route path='FrontendDMS/visitorPasswordSetup/:id' element={<VisitorPasswordSetup />} />
        <Route path='FrontendDMS/resetVisitorPassword' element={<ResetVisitorPassword />} />
        <Route path='FrontendDMS/inductionCreation/:id' element={<InductionCreationPage />} />
        <Route path='FrontendDMS/inductionDrafts' element={<InductionDrafts />} />
        <Route path='FrontendDMS/inductionReview/:fileId' element={<InductionReviewPage />} />
        <Route path='FrontendDMS/inductionHistory/:id' element={<VersionHistoryInductions />} />
        <Route path="FrontendDMS/inductionPreview" element={<PreviewCertificateInduction />} />
        <Route path='FrontendDMS/visitorInductionHome' element={<VisitorInductionMainPage />} />
        <Route path='FrontendDMS/generatedInductionInfo' element={<GeneratedInductionInfo />} />
        <Route path='FrontendDMS/flameproofComponents/:type/:id' element={<ManageComponentAssets />} />
        <Route path='FrontendDMS/flameCertifiers' element={<FlameProofCertifiers />} />
        <Route path='FrontendDMS/flameDigitalWarehouse/:site' element={<FlameProofDigitalWarehouse />} />
        <Route path='FrontendDMS/flameAllMineHome/:site' element={<FlameProofHomeAllSites />} />
        <Route path='FrontendDMS/flameManageAllMine/:type' element={<FlameProofMainAllSites />} />
        <Route path='FrontendDMS/flameReplacedComponents' element={<DigitalWarehouseRemoved />} />
        <Route path='FrontendDMS/previewCertifier/:fileId' element={<PreviewCertifier />} />
        <Route path='FrontendDMS/invalidDevice' element={<InvalidPageMobile />} />
        <Route path='FrontendDMS/invalidDeviceStudent' element={<StudentInvalidPageMobile />} />
        <Route path="FrontendDMS/loginRedirect/:module/:action/:id/:type" element={isMobile ? <Navigate to="/mobileLogin" /> : <RedirectLogin />} />
        <Route path="FrontendDMS/assetVersionHistory/:id" element={<VersionHistoryAssets />} />
        <Route path='FrontendDMS/onlineTrainingHome' element={<OnlineTrainingHomePage />} />
        <Route path='FrontendDMS/onlineCreateCourse/:id' element={<OnlineCourseCreationPage />} />
        <Route path='FrontendDMS/onlineReviewCourse/:fileId' element={<OnlineTrainingReviewPage />} />
        <Route path='FrontendDMS/onlineDraftCourses' element={<OnlineTrainingDrafts />} />
        <Route path='FrontendDMS/onlinePublishedCourses' element={<OnlineTrainingPublished />} />
        <Route path='FrontendDMS/onlineProfiles' element={<OnlineTrainingStudentProfiles />} />
        <Route path='FrontendDMS/onlineTrainingHistory/:id' element={<VersionHistoryOnlineTraining />} />
        <Route path='FrontendDMS/visitorManagementPage' element={<VisitorManagementPage />} />
        <Route path='FrontendDMS/visitorDevices/:id' element={<VisitorManagementDevices />} />
        <Route path='FrontendDMS/visitorDeletedDevices/:id' element={<VisitorManagementDeletedDevices />} />
        <Route path='FrontendDMS/visitorRegisteredDevices' element={<VisitorRegisteredDevices />} />
        <Route path='FrontendDMS/student-profile' element={isMobile ? <Navigate to="/FrontendDMS/invalidDeviceStudent" /> : <StudentProfileSetup />} />
        <Route path="FrontendDMS/studentLogin" element={isMobile ? <Navigate to="/FrontendDMS/invalidDeviceStudent" /> : <StudentLogin />} />
        <Route path='FrontendDMS/studentPasswordSetup/:id' element={<StudentPasswordSetup />} />
        <Route path='FrontendDMS/resetStudentPassword' element={<ResetStudentPassword />} />
        <Route path='FrontendDMS/studentHomePage' element={<StudentProfileHomePage />} />
        <Route path='FrontendDMS/studentCourseView/:id' element={<StudentCourseViewPage />} />
        <Route path='FrontendDMS/onlineTrainingCourseManagement/:id' element={<OnlineTrainingCourseManagement />} />
        <Route path='FrontendDMS/chatBoxCourses' element={<OTChatCourses />} />
        <Route path='FrontendDMS/unclaimedChats/:courseID' element={<OTUnclaimedChats />} />
        <Route path='FrontendDMS/claimedChats' element={<OTClaimedChats />} />
        <Route path="FrontendDMS/studentPreview" element={<PreviewCertificateStudentProfile />} />
        <Route path="FrontendDMS/gradeSubmission/:studentID/:courseID" element={<OnlineTrainingCourseGrading />} />
        <Route path="FrontendDMS/suggestedControls/:id" element={<SuggestedControls />} />
        <Route path="FrontendDMS/controlsHistory/:id" element={<ControlVersionHistory />} />
        <Route path="FrontendDMS/myStudentProfile" element={<StudentProfilePage />} />
        <Route path="FrontendDMS/myNewTest" element={<JRAAttributes />} />
        <Route path="FrontendDMS/allRiskDrafts" element={<RiskDrafts />} />
        <Route path="FrontendDMS/allDDSDrafts" element={<DDSDrafts />} />
        <Route path="FrontendDMS/allTMSDrafts" element={<TrainingDrafts />} />
        <Route path="FrontendDMS/migrationPage" element={<MigrationPage />} />
        <Route path="FrontendDMS/signedOffProcedures" element={<SignedOffProcedures />} />
        <Route path='FrontendDMS/deletedSignedOffProcedures' element={<DeletedDocumentsSOProcedure />} />
        <Route path="FrontendDMS/versionHistorySOProcedures/:id" element={<VersionHistorySOProcedure />} />
        <Route path="FrontendDMS/reviewSOProcedure/:fileId" element={<ReviewPageSOProcedure />} />
        <Route path="FrontendDMS/signedOffStandards" element={<SignedOffStandards />} />
        <Route path='FrontendDMS/deletedSignedOffStandards' element={<DeletedDocumentsSOStandard />} />
        <Route path="FrontendDMS/versionHistorySOStandards/:id" element={<VersionHistorySOStandard />} />
        <Route path="FrontendDMS/reviewSOStandards/:fileId/:type" element={<ReviewPageSOStandard />} />
        <Route path="FrontendDMS/signedOffSpecial" element={<SignedOffSpecial />} />
        <Route path='FrontendDMS/deletedSignedOffSpecial' element={<DeletedDocumentsSOSpecial />} />
        <Route path="FrontendDMS/versionHistorySOSpecial/:id" element={<VersionHistorySOSpecial />} />
        <Route path="FrontendDMS/reviewSOSpecial/:fileId/:type" element={<ReviewPageSOSpecial />} />
        <Route path="FrontendDMS/signedOffIBRA" element={<SignedOffIBRA />} />
        <Route path='FrontendDMS/deletedSignedOffIBRA' element={<DeletedDocumentsSOIBRA />} />
        <Route path="FrontendDMS/versionHistorySOIBRA/:id" element={<VersionHistorySOIBRA />} />
        <Route path="FrontendDMS/reviewSOIBRA/:fileId/:type" element={<ReviewPageSOIBRA />} />
        <Route path="FrontendDMS/signedOffBLRA" element={<SignedOffBLRA />} />
        <Route path='FrontendDMS/deletedSignedOffBLRA' element={<DeletedDocumentsSOBLRA />} />
        <Route path="FrontendDMS/versionHistorySOBLRA/:id" element={<VersionHistorySOBLRA />} />
        <Route path="FrontendDMS/reviewSOBLRA/:fileId/:type" element={<ReviewPageSOBLRA />} />
        <Route path="FrontendDMS/signedOffJRA" element={<SignedOffJRA />} />
        <Route path='FrontendDMS/deletedSignedOffJRA' element={<DeletedDocumentsSOJRA />} />
        <Route path="FrontendDMS/versionHistorySOJRA/:id" element={<VersionHistorySOJRA />} />
        <Route path="FrontendDMS/reviewSOJRA/:fileId/:type" element={<ReviewPageSOJRA />} />
        <Route path="/test" element={<ScopeOnlyDocxTestPage />} />
        <Route path="FrontendDMS/sgiBackups" element={<SGIBackupHistory />} />
        <Route path="FrontendDMS/sgiAdminPage" element={<SGIAdminPage />} />
        <Route path="FrontendDMS/sgiVersionHistory" element={<SGIVersionHistory />} />
        <Route path="FrontendDMS/deletedControls" element={<DeletedControlAttributes />} />
        <Route path="FrontendDMS/deletedControlsHistory/:id" element={<DeletedControlVersionHistory />} />
        <Route path="FrontendDMS/documentDevelopmentDrafts/:type" element={<DraftsPage />} />
        <Route path="FrontendDMS/riskManagementDrafts/:type" element={<RiskDraftsPage />} />
        <Route path="FrontendDMS/deletedRiskDrafts/:type" element={<DeletedRiskDraftsPage />} />
        <Route path="FrontendDMS/deletedDDSDrafts/:type" element={<DeletedDMSDraftsPage />} />
        <Route path="FrontendDMS/deletedTMSDrafts/:type" element={<DeletedTMSDraftsPage />} />
        <Route path="FrontendDMS/procedureHome" element={<ProcedureHomePage />} />
        <Route path="FrontendDMS/standardHome" element={<StandardHomePage />} />
        <Route path="FrontendDMS/specialHome" element={<SpecialHomePage />} />
        <Route path="FrontendDMS/jraHome" element={<JRAHomePage />} />
        <Route path="FrontendDMS/ibraHome" element={<IBRAHomePage />} />
        <Route path="FrontendDMS/blraHome" element={<BLRAHomePage />} />
        <Route path="FrontendDMS/ctsHome" element={<CTSHome />} />
        <Route path="FrontendDMS/taskingHome" element={<TaskingHomePage />} />
        <Route path="FrontendDMS/manualTasking" element={<ManualTaskingHomePage />} />
        <Route path="FrontendDMS/manualTaskingAllocate" element={<ManualTaskingAllocationPage />} />
        <Route path="FrontendDMS/manualTaskingTasks" element={<ManualTaskingViewPage />} />
        <Route path="FrontendDMS/manualTaskingPage" element={<ManualTaskingPage />} />
        <Route path="FrontendDMS/manual-tasks-history/:taskId" element={<TaskVersionHistoryPage />} />
        <Route path="FrontendDMS/taskTemplates" element={<TaskTemplatesPage />} />
        <Route path="FrontendDMS/deletedTaskTemplates" element={<DeletedTaskTemplates />} />
        <Route path="FrontendDMS/suggestedTaskTemplates/:taskID" element={<SuggestedTaskTemplates />} />
        <Route path="FrontendDMS/infoHelp/:id" element={<InfoPage />} />
        <Route path="FrontendDMS/mainDash" element={<DMSDashboard />} />
        <Route path="FrontendDMS/dmsDash" element={<DMSMainDash />} />
        <Route path="FrontendDMS/ddsDash" element={<DDSMainDash />} />
        <Route path="FrontendDMS/rmsDash" element={<RMSMainDash />} />
        <Route path="FrontendDMS/cmsDash" element={<CMMainDash />} />
        <Route path="FrontendDMS/dwDash" element={<DWMainDash />} />
        <Route path="FrontendDMS/epamsDash" element={<EPAMSMainDash />} />
        <Route path="FrontendDMS/ctsDash" element={<CTSMainDash />} />
        <Route path="FrontendDMS/tmsDash" element={<TMSMainDash />} />
        <Route path="FrontendDMS/infoTraining/:id" element={<TrainingInfoPage />} />
        <Route path="FrontendDMS/workManagement" element={<WorkManagement />} />
        <Route path="FrontendDMS/ftsHome" element={<FieldTemplateHomePage />} />
        <Route path="FrontendDMS/ftsDevelopHome" element={<FTSCreateHomePage />} />
        <Route path="FrontendDMS/ftsDrafts/:type" element={<FTSTemplatesDraftsPage />} />
        <Route path="FrontendDMS/ftsSignedOffTemplates" element={<FTSSignedOffTemplates />} />
        <Route path='FrontendDMS/ftsDeletedSignedOffTemplates' element={<FTSDeletedTemplatesSO />} />
        <Route path="FrontendDMS/ftsSOTemplateVersionHistory/:id" element={<FTSVersionHistorySO />} />
        <Route path='FrontendDMS/ftsGeneratedTemplates' element={<FTSTemplateDocuments />} />
        <Route path='FrontendDMS/ftsDeletedTemplates' element={<FTSDeletedTemplateDocuments />} />
        <Route path="FrontendDMS/ftsTemplateVersionHistory/:id" element={<FTSVersionHistory />} />
        <Route path="FrontendDMS/ftsCreateTemplate/:type/:id" element={<FTSCreatePageTemplate />} />
        <Route path='FrontendDMS/ftsReviewTemplate/:fileId/:type' element={<FTSCreatePageTemplatesReview />} />
        <Route path="FrontendDMS/ftsDeletedTemplateDrafts/:type" element={<FTSDeletedTemplateDraftsPage />} />
        <Route path="FrontendDMS/standardFieldsFTS" element={<StandardFieldsFTS />} />
        <Route path="FrontendDMS/suggestedFields/:id" element={<SuggestedStandardFieldsFTS />} />
        <Route path="FrontendDMS/documentDevelopmentApprovals/:type" element={<ApprovalsPage />} />
        <Route path="FrontendDMS/riskManagementApprovals/:type" element={<ApprovalsRiskPage />} />
        <Route path="FrontendDMS/inductionApprovals" element={<InductionApprovalsPage />} />
        <Route path="FrontendDMS/onlineTrainingApprovals" element={<OnlineTrainingApprovalsPage />} />
        <Route path="FrontendDMS/documentDevelopmentRevisions/:type" element={<CreateRevisionPage />} />
        <Route path="FrontendDMS/riskManagementRevisions/:type" element={<RiskRevisionPage />} />
        <Route path="FrontendDMS/fieldTemplateRevision" element={<UnderRevisionTemplateDocuments />} />
        <Route path="FrontendDMS/inductionRevisionInfo" element={<GeneratedInductionInfoRevision />} />
        <Route path="FrontendDMS/trainingRevisionInfo" element={<OnlineTrainingRevision />} />
        <Route path="FrontendDMS/ddsDraftHistory/:type/:id" element={isMobile ? <Navigate to="/mobileHome" /> : <VersionHistoryPage />} />
        <Route path="FrontendDMS/documentVersionPreview/:type/:id/:version" element={isMobile ? <Navigate to="/mobileHome" /> : <VersionPreviewPage />} />
        <Route path="FrontendDMS/rmsDraftHistory/:type/:id" element={<RiskVersionHistoryPage />} />
        <Route path="FrontendDMS/riskVersionPreview/:type/:id/:version" element={isMobile ? <Navigate to="/mobileHome" /> : <RiskVersionPreviewPage />} />
        <Route path="FrontendDMS/tmsDraftHistory/induction/:id" element={<InductionVersionHistoryPage />} />
        <Route path="FrontendDMS/tmsDraftHistory/onlineTraining/:id" element={<OnlineTrainingVersionHistoryPage />} />
        <Route path="FrontendDMS/tmsDraftVersionPreview/:type/:id/:version" element={isMobile ? <Navigate to="/mobileHome" /> : <TrainingVersionPreviewPage />} />
        <Route path="FrontendDMS/ftsDraftHistory/:type/:id" element={<FTSVersionHistoryPage />} />
        <Route path="FrontendDMS/ftsDraftVersionPreview/:type/:id/:version" element={<FTSCreatePageTemplate versionPreview />} />
        <Route path="FrontendDMS/ddsSignedOffPreview/:type/:id" element={<SignedOffPreviewDDS />} />
        <Route path="FrontendDMS/rmsSignedOffPreview/:type/:id" element={<SignedOffPreviewRMS />} />

        {/* Mobile Routes */}
        <Route path='FrontendDMS/mobileLogin' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <LoginPageMobile />} />
        <Route path='FrontendDMS/mobileForgot' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <ForgotPasswordMobile />} />
        <Route path='FrontendDMS/mobileFI' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <MobileFileInfo />} />
        <Route path='FrontendDMS/mobileHome' element={!isMobile ? <Navigate to="FrontendDMS/" /> : <MobileHomePage />} />

        {/* Not Found Page */}
        <Route path='*' element={<NotFound />} />
      </Routes>

      {showWarning && (<TimeoutPopup closeTimeoutModal={handleStayLoggedIn} remain={handleStayLoggedIn} quit={handleLogoutNow} />)}
    </>
  );
}

export default App;