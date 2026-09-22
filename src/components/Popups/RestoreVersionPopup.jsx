
const RestoreVersionPopup = ({ closeModal, confirmRestore, versionLabel }) => {
    return (
        <div className="delete-draft-popup-overlay">
            <div className="delete-draft-popup-content">
                <div className="delete-draft-header">
                    <h2 className="delete-draft-title">Restore Version</h2>
                    <button className="delete-draft-close" onClick={closeModal} title="Close Popup">×</button>
                </div>

                <div className="delete-draft-group">
                    <div className="delete-draft-text">
                        {`The current working draft will be replaced by:`}
                    </div>
                    <div>{versionLabel}</div>
                </div>

                <div className="delete-draft-buttons">
                    <button className="delete-draft-button-delete" onClick={confirmRestore}>
                        Restore
                    </button>
                    <button className="delete-draft-button-cancel" onClick={closeModal}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestoreVersionPopup;
