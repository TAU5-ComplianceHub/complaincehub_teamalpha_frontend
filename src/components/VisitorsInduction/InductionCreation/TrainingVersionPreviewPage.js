import React from "react";
import { useParams } from "react-router-dom";
import InductionCreationPage from "./InductionCreationPage";
import OnlineCourseCreationPage from "../../OnlineTrainingModule/OnlineCourseCreationPage";


// Reuses each document type's normal create page rendering, but forces it
// into the historical-version loading path and read-only mode. Which editor
// is rendered depends on the :type route param, using the same type strings
// as VersionHistoryPage's VERSION_HISTORY_CONFIG.
const VERSION_PREVIEW_CONFIG = {
    "induction": InductionCreationPage,
    "onlineTraining": OnlineCourseCreationPage,
};

const TrainingVersionPreviewPage = () => {
    const { type } = useParams();
    const CreatePageComponent = VERSION_PREVIEW_CONFIG[type] || OnlineCourseCreationPage;

    return <CreatePageComponent versionPreview={true} />;
};

export default TrainingVersionPreviewPage;