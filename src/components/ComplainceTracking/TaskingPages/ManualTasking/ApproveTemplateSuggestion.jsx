import React, { useState, useEffect, useRef } from 'react';
import { jwtDecode } from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTrashAlt, faPlus, faInfoCircle, faCirclePlus, faCalendarDays, faTrash, faClock } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import { toast } from 'react-toastify';
import './AddTaskPopup.css';

const AREAS = [
    "All Areas",
    "Offices",
    "Plant",
    "Surface",
    "Underground",
];

const ApproveTemplateSuggestion = ({ onClose, onTaskAdded, data, approve, decline }) => {
    const [taskTitle, setTaskTitle] = useState("");
    const [taskPriority, setTaskPriority] = useState("");
    const [taskType, setTaskType] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [comments, setComments] = useState("");
    const [loading, setLoading] = useState(false);
    const [taskId, setTaskID] = useState("");
    const [area, setArea] = useState("");
    const [discipline, setDiscipline] = useState("");
    const [disciplineOptions, setDisciplineOptions] = useState([]);

    const handleApproveClick = () => {
        approve({
            ...data,
            _id: taskId,
            taskTitle,
            taskDescription,
            taskType,
            taskPriority,
            comment: comments,
            area: area,
            discipline: discipline
        });
    };

    useEffect(() => {
        setTaskDescription(data.taskDescription || "");
        setTaskTitle(data.taskTitle || "");
        setTaskType(data.taskType || "");
        setTaskPriority(data.taskPriority || "");
        setComments(data.comment || "");
        setDiscipline(data.discipline || "");
        setArea(data.area || "")
        setTaskID(data._id);
    }, [data])


    const fetchDepartments = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/department/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data?.error || "Failed to fetch departments");
            }

            const sortedDepartments = [...data.departments].sort((a, b) =>
                String(a.department || "").localeCompare(
                    String(b.department || ""),
                    undefined,
                    { sensitivity: "base" }
                )
            );

            setDisciplineOptions(sortedDepartments);
        } catch (error) {
            console.error("Failed to fetch departments:", error);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    return (
        <div className="ibra-popup-page-container">
            <div className="ibra-popup-page-overlay">
                <div className="ibra-popup-page-popup-right">
                    <div className="ibra-popup-page-popup-header-right">
                        <h2>Modify Task Template</h2>
                        <button className="review-date-close" onClick={onClose} title="Close Popup">×</button>
                    </div>

                    <div className="ibra-popup-page-form-group-main-container">
                        <div className="ibra-popup-page-form-group-main-container-2 scrollable-container-controlea">
                            <div className="cea-popup-page-component-wrapper">
                                <div className={`ibra-popup-page-form-group`}>
                                    <label>Title <span className="required-field">*</span></label>
                                    <textarea
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                        className="task-title-popup-page-textarea-full"
                                        placeholder="Title of task"
                                        style={{ resize: "none" }}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="cea-popup-page-component-wrapper">
                                <div className={`ibra-popup-page-form-group`}>
                                    <label>Description <span className="required-field">*</span></label>
                                    <textarea
                                        value={taskDescription}
                                        onChange={(e) => setTaskDescription(e.target.value)}
                                        className="cea-popup-page-textarea-full"
                                        placeholder="Description of task"
                                        style={{ resize: "none" }}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="ibra-popup-page-additional-row">
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group`}>
                                            <label>Type <span className="required-field">*</span></label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={taskType}
                                                    onChange={(e) => setTaskType(e.target.value)}
                                                >
                                                    <option value="">Select Option</option>
                                                    <option value="Develop">Develop</option>
                                                    <option value="Evaluate">Evaluate</option>
                                                    <option value="Inspect">Inspect</option>
                                                    <option value="Investigate">Investigate</option>
                                                    <option value="Monitor">Monitor</option>
                                                    <option value="Review">Review</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className={`ibra-popup-page-form-group`}>
                                            <label>Priority <span className="required-field">*</span></label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={taskPriority}
                                                    onChange={(e) => setTaskPriority(e.target.value)}
                                                >
                                                    <option value="">Select Option</option>
                                                    <option value="Critical">Critical</option>
                                                    <option value="High">High</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-additional-row">
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group">
                                            <label>Area</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={area}
                                                    onChange={(e) => {
                                                        setArea(e.target.value);
                                                    }}
                                                >
                                                    <option value="">Select Area</option>
                                                    {AREAS.map((a) => (
                                                        <option key={a} value={a}>{a}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ibra-popup-page-column-half">
                                    <div className="cea-popup-page-component-wrapper">
                                        <div className="ibra-popup-page-form-group">
                                            <label>Department</label>
                                            <div className="ibra-popup-page-select-container">
                                                <select
                                                    className="ibra-popup-page-select"
                                                    value={discipline}
                                                    onChange={(e) => setDiscipline(e.target.value)}
                                                >
                                                    <option value="">
                                                        {"Select Department"}
                                                    </option>
                                                    {disciplineOptions.map((d) => (
                                                        <option key={d.department} value={d.department}>{d.department}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ibra-popup-page-component-wrapper">
                                <div className="ibra-popup-page-form-group">
                                    <label style={{ fontSize: "15px" }}>Comments/ Notes</label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        className="cea-popup-page-textarea-full"
                                        placeholder="Add Comments or Notes"
                                        style={{ resize: "none" }}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>


                    <div className="ibra-popup-page-form-footer">
                        <div className="create-user-buttons">
                            <button
                                className="approve-suggestion-button-download"
                                onClick={handleApproveClick}
                            >
                                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : (`Approve`)}
                            </button>
                            <button
                                className="approve-suggestion-button-cancel"
                                style={{ marginLeft: "20px" }}
                                onClick={decline}
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ApproveTemplateSuggestion;