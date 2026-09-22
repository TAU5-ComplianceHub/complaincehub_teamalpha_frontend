import React, { useState, useEffect } from 'react';
import './UploadPopup.css';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-multi-date-picker';

const UploadPopup = ({ onClose }) => {
    const [approver, setApprover] = useState('');
    const [reviewer, setReviewer] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [discipline, setDiscipline] = useState('');
    const [owner, setOwner] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [departmentHead, setDepartmentHead] = useState('');
    const [signedOffDate, setSignedOffDate] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [users, setUsers] = useState([]); // State to hold the list of users
    const [departments, setDepartments] = useState([]);
    const [docTypes, setDocTypes] = useState([]);
    const [disciplines, setDisciplines] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [userID, setUserID] = useState('');
    const [errors, setErrors] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [uploadedDocumentType, setUploadedDocumentType] = useState('');

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);

            setUserID(decodedToken.userId);
        }
    }, []);

    useEffect(() => {
        const fetchOwnerOptions = async () => {
            try {
                const [userRes] = await Promise.all([
                    fetch(`${process.env.REACT_APP_URL}/api/user/`),
                ]);

                if (!userRes.ok) {
                    throw new Error("Failed to fetch document owner options");
                }

                const userData = await userRes.json();

                const userNames = (userData.users || []).map((u) => (u.username ?? "").trim());

                const combined = Array.from(new Set([...userNames])).filter(Boolean);

                setUsers(combined);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchOwnerOptions();
    }, []);

    useEffect(() => {
        // Document types are loaded from their own backend route.
        // Just swap the URL below once the new route is ready — response is expected as { documentTypes: [...] }
        const fetchDocumentTypes = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_URL}/api/valuesUpload/documentTypes/`);
                if (!response.ok) {
                    throw new Error("Failed to fetch document types");
                }
                const data = await response.json();

                setDocTypes(data.documentTypes || []);
            } catch (error) {
                setError(error.message);
            }
        };
        fetchDocumentTypes();
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

    const selectedDocType = docTypes.find((dt) => dt.type === documentType);
    // Default to true (enabled) until document types have loaded / a type is selected
    const hasReview = selectedDocType ? selectedDocType.hasReview !== false : true;

    useEffect(() => {
        // Clear out any previously selected date once review is disabled for this document type
        if (!hasReview && signedOffDate) {
            setSignedOffDate('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasReview, documentType]);

    const validateForm = () => {
        const newErrors = {};

        if (!selectedFile) newErrors.file = true;
        if (!discipline) newErrors.discipline = true;
        if (!documentType) newErrors.documentType = true;
        if (!owner) newErrors.author = true;
        if (!departmentHead) newErrors.departmentHead = true;
        if (hasReview && !signedOffDate) newErrors.signedOffDate = true;
        if (!status) newErrors.status = true;
        if (!reviewer) newErrors.reviewer = true;
        if (!approver) newErrors.approver = true;

        return newErrors;
    };

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const newErrors = validateForm();
            setErrors(newErrors);
        }
    }, [selectedFile, discipline, documentType, owner, departmentHead, signedOffDate, status, reviewer, approver])

    const isFormValid = () => {
        const newErrors = validateForm();
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill in all required fields marked by a *", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }

            })

            return false;
        }

        return true;
    };

    const handleFileUpload = async (e) => {
        if (!isFormValid()) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('departmentHead', departmentHeadName);
        formData.append('owner', JSON.stringify(owner));
        formData.append('documentType', documentType);
        formData.append('discipline', discipline);
        formData.append('status', status);
        formData.append('userID', userID);
        formData.append('signedOffDate', signedOffDate);
        formData.append('reviewer', reviewer);
        formData.append('approver', approver);

        try {
            setLoading(true);

            const response = await fetch(`${process.env.REACT_APP_URL}/api/file/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = 'Could not upload file. Please try again or contact an administrator.';

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.details || errorData.error || errorData.message || errorMessage;
                } catch {
                    try {
                        const textError = await response.text();
                        errorMessage = textError || errorMessage;
                    } catch {
                        // Keep default message
                    }
                }

                throw new Error(errorMessage);
            }

            await response.json();

            setUploadedDocumentType(documentType);

            setSuccessMessage("Document uploaded successfully!");
            setShowPopup(true);
            setSelectedFile(null);
            setDiscipline('');
            setOwner([]);
            setDocumentType('');
            setDepartmentHead('');
            setStatus('');
            setSignedOffDate('');
            setApprover('');
            setReviewer('');
            setError(null);

            toast.success("Document Uploaded Successfully", {
                closeButton: false,
                autoClose: 800,
                style: {
                    textAlign: 'center'
                }
            });
        } catch (error) {
            const message = error?.message || "Could not upload file. Please try again or contact an administrator.";

            toast.error(message, {
                closeButton: false,
                autoClose: 5000,
                style: {
                    textAlign: 'center'
                }
            });

            setError(message);
            setSuccessMessage('');
        } finally {
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
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isFormValid()) {
            handleFileUpload();  // Call your function when the form is valid
        }
    };

    const handleFinishUploading = () => {
        const targetPath =
            `/FrontendDMS/documentManage/${encodeURIComponent(uploadedDocumentType)}/new`;

        window.location.assign(targetPath);
    };

    return (
        <div className="upload-file-page-container">
            <div className="upload-file-page-overlay">
                <div className="upload-file-page-popup-right">
                    <div className="review-date-header">
                        <h2 className="review-date-title">Upload Document</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="upload-file-page-form-group-container">
                        <div className="upload-file-name">{selectedFile ? selectedFile.name : "No Document Selected"}</div>
                        <div className="create-user-buttons">
                            <label className="choose-upload-file-button">
                                {'Select Document'}
                                <input
                                    type="file"
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
                                            {users
                                                .sort((a, b) => a.localeCompare(b)) // Sorts alphabetically
                                                .map((user, index) => (
                                                    <option key={index} value={user}>
                                                        {user}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={`upload-file-page-form-group ${errors.status ? "error-upload-required-up" : ""}`}>
                                    <label>Document Status <span className="required-field">*</span></label>
                                    <div className="upload-file-page-select-container">
                                        <select value={status} className="upload-file-page-select" onChange={(e) => setStatus(e.target.value)}>
                                            <option value="">Select Status</option>
                                            <option value="in_review">In Review</option>
                                            <option value="in_approval">In Approval</option>
                                            <option value="approved">Approved</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="upload-file-page-form-row">
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
                                <div className={`upload-file-page-form-group ${errors.documentType ? "error-upload-required-up" : ""}`}>
                                    <label>Document Type <span className="required-field">*</span></label>
                                    <div className="upload-file-page-select-container">
                                        <select value={documentType} className="upload-file-page-select" onChange={(e) => setDocumentType(e.target.value)}>
                                            <option>Select Document Type</option>
                                            {docTypes
                                                .slice()
                                                .sort((a, b) => (a.type || "").localeCompare(b.type || "", undefined, { sensitivity: "base" }))
                                                .map((type, index) => (
                                                    <option key={type._id ?? index} value={type.type}>
                                                        {type.type}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="upload-file-page-form-row">
                                <div className={`upload-file-page-form-group ${errors.signedOffDate ? "error-upload-required-up" : ""}`}>
                                    <label>Signed Off Date {hasReview && <span className="required-field">*</span>}</label>
                                    <div style={{ position: "relative", width: "calc(100% - 8.01px)" }}>
                                        <DatePicker
                                            value={signedOffDate || ""}
                                            format="YYYY-MM-DD"
                                            onChange={(val) =>
                                                setSignedOffDate(val?.format("YYYY-MM-DD"))
                                            }
                                            rangeHover={false}
                                            highlightToday={false}
                                            editable={false}
                                            disabled={!hasReview}
                                            inputClass="upload-file-page-date"
                                            placeholder={hasReview ? "YYYY-MM-DD" : "N/A"}
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
                                <div className={`upload-file-page-form-group ${errors.signedOffDate ? "error-upload-required-up" : ""}`}>
                                </div>
                                <div className={`upload-file-page-form-group ${errors.signedOffDate ? "error-upload-required-up" : ""}`}>
                                </div>
                            </div>

                            <div className="upload-file-page-form-row">

                            </div>
                        </form>
                    </div>

                    <div className="upload-file-page-form-footer">
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

                    {showPopup && (
                        <div className="download-popup-overlay">
                            <div className="download-popup-content">
                                <div className="download-file-group">
                                    <p className="upload-file-text">{successMessage}</p>
                                    <p className='upload-file-text'>Would you like to upload another Document?</p>
                                </div>
                                <div className="download-file-buttons">
                                    <button className="download-file-button-download" onClick={() => setShowPopup(false)}>
                                        Yes
                                    </button>
                                    <button className="download-file-button-cancel" onClick={handleFinishUploading}>
                                        No
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default UploadPopup;