import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-multi-date-picker';

const SignedOffUploadPopup = ({ onClose, docID, refresh, closeNavigate, type }) => {
    const [approver, setApprover] = useState('');
    const [reviewer, setReviewer] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [discipline, setDiscipline] = useState('');
    const [owner, setOwner] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [departmentHead, setDepartmentHead] = useState('');
    const [reviewDate, setReviewDate] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [docTypes, setDocTypes] = useState([]);
    const [disciplines, setDisciplines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [userID, setUserID] = useState('');
    const [errors, setErrors] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [showConfirmChangesPopup, setShowConfirmChangesPopup] = useState(false);
    const [showWordUploadPopup, setShowWordUploadPopup] = useState(false);
    const [wordFile, setWordFile] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
        }
    }, []);

    useEffect(() => {
        const fetchValues = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/valuesUpload/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                setDocTypes(data[0].documentType);
                const owners = Array.from(new Set([
                    ...data[0].owner,
                    ...data[0].departmentHeads
                ]));

                setUsers(owners); // This now contains owners + departmentHeads, with duplicates removed
            } catch (error) {
                setError(error.message);
            }
        };
        fetchValues();
    }, []);

    useEffect(() => {
        // Discipline options now come from the actual departments, not the static values list
        const fetchDepartments = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/department/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch departments");
                }
                const data = await response.json();

                const departmentList = data.departments || [];
                setDepartments(departmentList);
                setDisciplines(departmentList.map((dept) => dept.department));
            } catch (error) {
                setError(error.message);
            }
        };
        fetchDepartments();
    }, []);

    useEffect(() => {
        // Function to fetch users
        const fetchUsers = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }
                const data = await response.json();

                setUsersList(data.users);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        // The department head is no longer picked manually — it follows the selected discipline
        const matchedDepartment = departments.find((dept) => dept.department === discipline);
        setDepartmentHead(matchedDepartment?.departmentHead || '');
    }, [discipline, departments]);

    const departmentHeadName = usersList.find((user) => user._id === departmentHead)?.username || '';

    const validateForm = () => {
        const newErrors = {};

        if (!selectedFile) newErrors.file = true;
        if (!discipline) newErrors.discipline = true;
        if (!owner) newErrors.author = true;
        if (!departmentHead) newErrors.departmentHead = true;
        if (!reviewDate) newErrors.reviewDate = true;
        if (!reviewer) newErrors.reviewer = true;
        if (!approver) newErrors.approver = true;

        return newErrors;
    };

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const newErrors = validateForm();
            setErrors(newErrors);
        }
    }, [selectedFile, discipline, owner, departmentHead, reviewDate, reviewer, approver])

    const isFormValid = () => {
        const newErrors = validateForm();
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }

            })

            return false;
        }

        return true;
    };

    const handleFileUpload = async (updatedWordFile) => {
        if (!isFormValid()) return;

        let documentUploadType;

        switch (type) {
            case "procedure":
                documentUploadType = "Procedure"
                break;

            case "standard":
                documentUploadType = "Standard"
                break;

            case "special":
                documentUploadType = "Special Instruction"
                break;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('departmentHead', departmentHeadName);
        formData.append('owner', JSON.stringify(owner));
        formData.append('documentType', documentUploadType);
        formData.append('discipline', discipline);
        formData.append('status', "approved");
        formData.append('userID', userID);
        formData.append('reviewDate', reviewDate);
        formData.append('reviewer', reviewer);
        formData.append('approver', approver);

        // Kept as its own field so the backend never confuses it with the signed off PDF ('file')
        if (updatedWordFile) {
            formData.append('wordDocument', updatedWordFile);
        }

        try {
            setLoading(true);

            let route = "";

            if (type === "procedure") {
                route = `${process.env.REACT_APP_URL}/api/docCreate/signOffProcedure/${docID}`
            } else if (type === "standard") {
                route = `${process.env.REACT_APP_URL}/api/docCreate/signOffStandard/${docID}`
            }
            else if (type === "special") {
                route = `${process.env.REACT_APP_URL}/api/docCreate/signOffSpecialIns/${docID}`
            }

            const response = await fetch(`${route}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });
            if (!response.ok) {
                throw new Error(response.error || 'Failed to upload file');
            }
            await response.json();
            setSuccessMessage("Document uploaded successfully!");
            setSelectedFile(null);
            setDiscipline('');
            setOwner([]);
            setDocumentType('');
            setDepartmentHead('');
            setStatus('');
            setReviewDate('');
            setApprover('');
            setReviewer('');
            setWordFile(null);
            setError(null);

            setLoading(false); // Reset loading state after response
            toast.success("Document Uploaded Successfully", {
                closeButton: false,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }

            })

            setTimeout(() => {
                refresh();
                closeNavigate();
            }, 1500);
        } catch (error) {
            console.log(error.message)
            setError(error.message);
            setSuccessMessage('');
            setLoading(false);
        }
    };

    const handleFileSelect = (selectedFile) => {
        if (selectedFile) {
            // Check if it's a Word document
            setSelectedFile(selectedFile)
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

            if (!isPDF) {
                toast.error("Please select a PDF file", {
                    closeButton: false,
                    autoClose: 1500,
                    style: {
                        textAlign: 'center'
                    }
                });
                e.target.value = null;
                return;
            }

            handleFileSelect(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isFormValid()) {
            setShowConfirmChangesPopup(true); // Ask about word doc changes before uploading
        }
    };

    const handleConfirmChangesNo = () => {
        setShowConfirmChangesPopup(false);
        handleFileUpload(); // No word doc changes, upload as normal
    };

    const handleConfirmChangesYes = () => {
        setShowConfirmChangesPopup(false);
        setShowWordUploadPopup(true);
    };

    const handleWordFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const wordMimeTypes = [
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ];
            const isWord = wordMimeTypes.includes(file.type) || /\.(doc|docx)$/i.test(file.name);

            if (!isWord) {
                toast.error("Please select a Word document", {
                    closeButton: false,
                    autoClose: 1500,
                    style: {
                        textAlign: 'center'
                    }
                });
                e.target.value = null;
                return;
            }

            setWordFile(file);
        }
    };

    const handleWordUploadCancel = () => {
        setShowWordUploadPopup(false);
        setWordFile(null);
    };

    const handleWordUploadSubmit = () => {
        if (!wordFile) {
            toast.error("Please select the updated Word document", {
                closeButton: false,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            });
            return;
        }

        setShowWordUploadPopup(false);
        handleFileUpload(wordFile);
    };

    return (
        <div className="upload-file-page-container">
            <div className="upload-file-page-overlay">
                <div className="upload-file-signed-off-page-popup-right">
                    <div className="review-date-header">
                        <h2 className="review-date-title">Upload Signed Off Document</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="upload-file-page-form-group-container">
                        <div className="upload-file-name">{selectedFile ? selectedFile.name : "No Document Selected"}</div>
                        <div className="create-user-buttons">
                            <label className="choose-upload-file-button">
                                {'Select Document'}
                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="upload-file-page-form-group-main-container">
                        <div className="upload-file-page-popup-header">
                            <h2>Document Information</h2>
                        </div>

                        <form className="upload-file-page-form" onSubmit={handleSubmit}>
                            <div className="upload-file-page-form-row">
                                <div className={`upload-file-page-form-group ${errors.discipline ? "error-upload-required-up" : ""}`}>
                                    <label>Department <span className="required-field">*</span></label>
                                    <div className="upload-file-page-select-container">
                                        <select value={discipline} className="upload-file-page-select" onChange={(e) => setDiscipline(e.target.value)}>
                                            <option value="">Select Department</option>
                                            {disciplines
                                                .sort((a, b) => a.localeCompare(b)) // Sorts alphabetically
                                                .map((discipline, index) => (
                                                    <option key={index} value={discipline}>
                                                        {discipline}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={`upload-file-page-form-group ${errors.author ? "error-upload-required-up" : ""}`}>
                                    <label>Document Owner <span className="required-field">*</span></label>
                                    <div className="upload-file-page-select-container">
                                        <select value={owner} className="upload-file-page-select" onChange={(e) => setOwner(e.target.value)}>
                                            <option>Select Owner</option>
                                            {usersList.sort((a, b) => a.username.localeCompare(b.username)).map((approver, index) => (
                                                <option key={index} value={approver._id}>
                                                    {approver.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={`upload-file-page-form-group ${errors.reviewer ? "error-upload-required-up" : ""}`}>
                                    <label>Document Reviewer <span className="required-field">*</span></label>
                                    <div className="upload-file-page-select-container">
                                        <select value={reviewer} className="upload-file-page-select" onChange={(e) => setReviewer(e.target.value)}>
                                            <option value="">Select Reviewer</option>
                                            {usersList.sort((a, b) => a.username.localeCompare(b.username)).map((reviewer, index) => (
                                                <option key={index} value={reviewer._id}>
                                                    {reviewer.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="upload-file-page-form-row">
                                <div className={`upload-file-page-form-group ${errors.approver ? "error-upload-required-up" : ""}`}>
                                    <label>Document Approver <span className="required-field">*</span></label>
                                    <div className="upload-file-page-select-container">
                                        <select value={approver} className="upload-file-page-select" onChange={(e) => setApprover(e.target.value)}>
                                            <option value="">Select Approver</option>
                                            {usersList.sort((a, b) => a.username.localeCompare(b.username)).map((approver, index) => (
                                                <option key={index} value={approver._id}>
                                                    {approver.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={`upload-file-page-form-group ${errors.reviewDate ? "error-upload-required-up" : ""}`}>
                                    <label>Review Date <span className="required-field">*</span></label>
                                    <div style={{ position: "relative", width: "calc(100% - 8.01px)" }}>
                                        <DatePicker
                                            value={reviewDate || ""}
                                            format="YYYY-MM-DD"
                                            onChange={(val) =>
                                                setReviewDate(val?.format("YYYY-MM-DD"))
                                            }
                                            rangeHover={false}
                                            highlightToday={false}
                                            editable={false}
                                            inputClass="upload-file-page-date"
                                            placeholder="YYYY-MM-DD"
                                            hideIcon={false}
                                            onOpenPickNewDate={false}
                                            style={{ paddingBottom: "12px", paddingTop: "12px", "--rmdp-primary-color": "#002060" }}
                                        />
                                        <FontAwesomeIcon
                                            icon={faCalendarDays}
                                            className="date-input-calendar-icon"
                                        />
                                    </div>
                                </div>
                                <div className="upload-file-page-form-group">
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="upload-file-signed-off-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="upload-file-page-upload-button"
                                disabled={!selectedFile}
                                onClick={handleSubmit}
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Upload Document'}
                            </button>
                        </div>
                    </div>
                </div>

                {showConfirmChangesPopup && (
                    <div className="delete-draft-popup-overlay">
                        <div className="delete-draft-popup-content">
                            <div className="delete-draft-header">
                                <h2 className="delete-draft-title" style={{ marginBottom: "10px" }}>Document Changes</h2>
                                <button className="delete-draft-close" onClick={() => setShowConfirmChangesPopup(false)} title="Close Popup">×</button>
                            </div>

                            <div className="delete-draft-group">
                                <div className="delete-draft-text" style={{ marginBottom: "0px" }}>
                                    Have there been any changes made to the Word document?
                                </div>
                            </div>

                            <div className="delete-draft-buttons" style={{ marginTop: "10px" }}>
                                <button className="delete-draft-button-delete" onClick={handleConfirmChangesYes}>
                                    Yes
                                </button>
                                <button className="delete-draft-button-cancel" onClick={handleConfirmChangesNo}>
                                    No
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showWordUploadPopup && (
                    <div className="delete-draft-popup-overlay">
                        <div className="delete-draft-popup-content">
                            <div className="delete-draft-header" style={{ marginBottom: "10px" }}>
                                <h2 className="delete-draft-title">Upload Updated Word Document</h2>
                                <button className="delete-draft-close" onClick={handleWordUploadCancel} title="Close Popup">×</button>
                            </div>

                            <div className="upload-file-page-form-group-container">
                                <div className="upload-file-name">{wordFile ? wordFile.name : "No Document Selected"}</div>
                                <div className="create-user-buttons">
                                    <label className="choose-upload-file-button" style={{ width: "35%" }}>
                                        {'Select Document'}
                                        <input
                                            type="file"
                                            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            onChange={handleWordFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="delete-draft-buttons">
                                <button className="choose-upload-file-button" style={{ width: "37%" }} onClick={handleWordUploadSubmit}>
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default SignedOffUploadPopup;