const ReshareDraftPopup = ({ reshare, doNotReshare }) => {
    return (
        <div className="generate-incompletedraft-popup-overlay">
            <div className="generate-incompletedraft-popup-content">
                <div className="generate-incompletedraft-header">
                    <h2 className="generate-incompletedraft-title">Reshare Draft</h2>
                </div>

                <div className="generate-incompletedraft-group">
                    <div className="generate-incompletedraft-text">{`This draft was withdrawn from the approval process. Do you want to reshare it with the previous collaborators?`}</div>
                </div>

                <div className="generate-incompletedraft-buttons">
                    <button className="generate-incompletedraft-button-delete" onClick={doNotReshare}>
                        {"Don't Reshare"}
                    </button>
                    <button className="generate-incompletedraft-button-cancel" onClick={reshare}>
                        {"Reshare"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReshareDraftPopup;