const RejectReasonView = ({ rejectorName, rejectDate, rejectionReason, reviewDocument }) => {
    return (
        <div className="generate-incompletedraft-popup-overlay" style={{ fontFamily: "Arial" }}>
            <div className="generate-incompletedraft-popup-content">
                <div className="generate-incompletedraft-header">
                    <h2 className="generate-incompletedraft-title">Document Rejected</h2>
                </div>

                {/* Only this middle section scrolls - header and buttons stay fixed */}
                <div
                    className="generate-incompletedraft-scroll-area"
                    style={{
                        overflowY: "auto",
                        overflowX: "hidden",
                        maxHeight: "55vh",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        marginTop: "10px",
                    }}
                >
                    <div className="generate-incompletedraft-group" style={{ padding: "15px 0" }}>
                        <div className="generate-incompletedraft-text">{"Rejected By"}</div>
                        <div className="generate-incompletedraft-text" style={{ paddingTop: "5px", paddingBottom: "0px", fontWeight: "normal", fontSize: "16px" }}>
                            {rejectorName}
                        </div>
                    </div>

                    <div className="generate-incompletedraft-group" style={{ padding: "15px 0" }}>
                        <div className="generate-incompletedraft-text">{"Date Rejected"}</div>
                        <div className="generate-incompletedraft-text" style={{ paddingTop: "5px", paddingBottom: "0px", fontWeight: "normal", fontSize: "16px" }}>
                            {rejectDate}
                        </div>
                    </div>

                    <div className="generate-incompletedraft-group" style={{ padding: "15px 0", paddingBottom: "5px" }}>
                        <div className="generate-incompletedraft-text">{"Reason For Rejection"}</div>
                        <textarea
                            className="ibra-popup-page-input-table-2-square"
                            style={{ marginTop: "5px", marginBottom: "5px", width: "calc(100% - 60px)", marginTop: "10px" }}
                            value={rejectionReason}
                            readOnly
                        />
                    </div>
                </div>

                <div className="generate-incompletedraft-buttons" style={{ marginTop: "5px" }}>
                    <button className="generate-button" onClick={reviewDocument} style={{ width: "50%" }}>
                        {"Review Document"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectReasonView;