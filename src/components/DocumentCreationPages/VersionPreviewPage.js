import React from "react";
import { useParams } from "react-router-dom";
import CreatePage from "./CreatePage";
import CreatePageSI from "./CreatePageSI";
import CreatePageStandards from "./CreatePageStandards";

// Reuses each document type's normal create page rendering, but forces it
// into the historical-version loading path and read-only mode. Which editor
// is rendered depends on the :type route param, using the same type strings
// as VersionHistoryPage's VERSION_HISTORY_CONFIG.
const VERSION_PREVIEW_CONFIG = {
    Procedure: CreatePage,
    Standard: CreatePageStandards,
    "Special Instruction": CreatePageSI,
};

const VersionPreviewPage = () => {
    const { type } = useParams();
    const CreatePageComponent = VERSION_PREVIEW_CONFIG[type] || CreatePage;

    return <CreatePageComponent versionPreview={true} />;
};

export default VersionPreviewPage;