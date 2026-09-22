const StartReviewPopup = ({
    startReview,
    cancel,
    reshare,
    doNotReshare,
    loading = false
}) => {
    const isStartReview = typeof startReview === "function";

    return (
        <div className="generate-incompletedraft-popup-overlay">
            <div className="generate-incompletedraft-popup-content">
                <div className="generate-incompletedraft-header">
                    <h2 className="generate-incompletedraft-title">
                        {isStartReview ? "Start Review" : "Reshare Draft"}
                    </h2>
                </div>

                <div className="generate-incompletedraft-group">
                    <div className="generate-incompletedraft-text">
                        {isStartReview
                            ? "Are you sure you want to review this document, a version of the document be created in the Under Revision folder?"
                            : "This draft was withdrawn from the approval process. Do you want to reshare it with the previous collaborators?"}
                    </div>
                </div>

                <div className="generate-incompletedraft-buttons">
                    <button
                        type="button"
                        className="generate-incompletedraft-button-delete"
                        onClick={isStartReview ? startReview : doNotReshare}
                        disabled={loading}
                    >
                        {isStartReview ? "Review" : "Don't Reshare"}
                    </button>
                    <button
                        type="button"
                        className="generate-incompletedraft-button-cancel"
                        onClick={isStartReview ? cancel : reshare}
                        disabled={loading}
                    >
                        {isStartReview ? "Cancel" : "Reshare"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StartReviewPopup;
