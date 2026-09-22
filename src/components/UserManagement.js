import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import "./UserManagement.css";
import AddUserModal from './UserManagement/AddUserModal';
import EditUserModal from './UserManagement/EditUserModal';
import UserTable from "./UserManagement/UserTable";
import { toast, ToastContainer } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPeopleGroup, faX, faSort, faCircleUser, faBell, faArrowLeft, faSearch, faChevronLeft, faChevronRight, faCaretLeft, faCaretRight, faFolderOpen, faUserGroup, faTrashCan, faUserPlus, faPlus, faCircle } from '@fortawesome/free-solid-svg-icons';
import DeletePopupUM from "./UserManagement/DeletePopupUM";
import TopBar from "./Notifications/TopBar";
import { getCurrentUser, can, canIn, isAdmin } from "../utils/auth";
import BatchUploadUsers from "./UserManagement/BatchUploadUsers";
import DeletedUserTable from "./UserManagement/DeletedUserTable";
import DeletePopupUserManagement from "./UserManagement/DeletePopupUserManagement";
import ChangePasswordModal from "./UserManagement/ChangePasswordModal";

const UserManagement = () => {
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [users, setUsers] = useState([]);
    const access = getCurrentUser();
    const [loggedInUserId, setloggedInUserId] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState("");
    const [userToDelete, setUserToDelete] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', email: '', role: '', reportingTo: '', department: '', designation: '' });;
    const [formError, setFormError] = useState('');
    const [roles, setRoles] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [isOpenBatch, setIsOpenBatch] = useState(false);
    const navigate = useNavigate();
    const [deletedUsers, setDeletedUsers] = useState([]);
    const [isDeletedView, setIsDeletedView] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordUser, setPasswordUser] = useState(null);
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    const openPasswordModal = (user) => {
        setPasswordUser(user);
        setIsPasswordModalOpen(true);
    };

    const changePassword = async (password) => {

        try {

            const response = await fetch(
                `${process.env.REACT_APP_URL}/api/user/change-password/${passwordUser._id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        password
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Failed");
            }

            toast.success("Password Updated", {
                autoClose: 1500
            });

            setIsPasswordModalOpen(false);

        } catch (err) {
            toast.error("Failed to update password");
        }

    };

    const fetchDeletedUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/deleted`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch deleted users');
            }

            const data = await response.json();

            const sortedUsers = data.users.sort((a, b) => {
                return a.username.localeCompare(b.username);
            });

            setDeletedUsers(sortedUsers);
        } catch (error) {
            setError(error.message);
        }
    };

    const openBatch = () => {
        setIsOpenBatch(true);
    }

    const closeBatch = () => {
        setIsOpenBatch(false);
    }

    const clearSearch = () => {
        setSearchQuery("");
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/');
    };

    useEffect(() => {
        if (formError) {
            toast.error(formError, {
                closeButton: false,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }
            })
            setFormError('');
        }
    }, [formError]);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        setToken(storedToken);
        if (storedToken) {
            const decodedToken = jwtDecode(storedToken);
            console.log(decodedToken);
            setloggedInUserId(decodedToken.userId);
        }
    }, [navigate]);

    const roleMapping = {
        standarduser: 'Standard User',
        admin: 'Admin',
        superadmin: 'Super Admin',
    };

    const formatRole = (role) => roleMapping[role] || role;

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/`, {
                headers: {

                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            const data = await response.json();

            // Sort users by a specific property, e.g., 'name'
            const sortedUsers = data.users.sort((a, b) => {
                // Replace 'name' with the property you want to sort by
                return a.username.localeCompare(b.username);
            });

            const uniqueRoles = [...new Set(data.users.map(user => user.role))].sort();
            setRoles(uniqueRoles);
            setUsers(sortedUsers);
        } catch (error) {
            setError(error.message);
        }
    };

    useEffect(() => {
        if (loggedInUserId && token) {
            if (isDeletedView) {
                fetchDeletedUsers();
            } else {
                fetchUsers();
            }
        }
    }, [loggedInUserId, token, isDeletedView]);

    const normalizeUserPayload = (user) => ({
        ...user,
        username: user?.username?.trim() || "",
        email: user?.email?.trim() || "",
        role: user?.role?.trim() || "",
        designation: user?.designation?.trim() || "",
        department: user?.department?.trim() || "",
        reportingTo: user?.reportingTo?._id
            ? String(user.reportingTo._id)
            : user?.reportingTo
                ? String(user.reportingTo)
                : null,
        password: user?.password?.trim() || ""
    });

    const createUser = async () => {
        // Guards against double-submission (double-click, or Enter + click landing
        // in the same tick before the button's disabled state re-renders). Without
        // this, two requests can go out for one click: one succeeds, the duplicate
        // gets rejected by the server (e.g. duplicate email/username), and its error
        // toast pops up alongside the success toast, which is what looked "random".
        if (isCreatingUser) return;

        const payload = normalizeUserPayload(newUser);

        console.log(payload);

        if (!payload.username || !payload.email || !payload.role || !payload.designation) {
            setFormError('Username, email, role and position are required.');
            return;
        }

        setIsCreatingUser(true);

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const message = await response.text();

            if (!response.ok) {
                throw new Error(message || 'Failed to create user');
            }

            toast.success(message || "User account created.", {
                closeButton: false,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });

            setIsModalOpen(false);
            setNewUser({
                username: '',
                email: '',
                role: '',
                reportingTo: '',
                department: '',
                designation: ''
            });

            setFormError('');
            fetchUsers();

        } catch (error) {
            console.error('Error creating user:', error);
            setFormError(error.message);
        } finally {
            setIsCreatingUser(false);
        }
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearchQuery = (
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const matchesFilters = !selectedRole || selectedRole === user.role;

        return matchesSearchQuery && matchesFilters;
    });

    const filteredDeletedUsers = deletedUsers.filter((user) => {
        const matchesSearchQuery = (
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const matchesFilters = !selectedRole || selectedRole === user.role;

        return matchesSearchQuery && matchesFilters;
    });

    const openActiveUsersView = () => {
        setIsDeletedView(false);
    };

    const openDeletedUsersView = () => {
        setIsDeletedView(true);
    };

    const restoreUser = async (userId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/restore/${userId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) throw new Error('Failed to restore user');

            toast.success("User restored successfully.", {
                closeButton: false,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });

            fetchDeletedUsers();
            fetchUsers();
        } catch (error) {
            setError(error.message);
        }
    };

    const permanentlyDeleteUser = async (userId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/permanent-delete/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) throw new Error('Failed to permanently delete user');

            toast.success("User permanently deleted.", {
                closeButton: false,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });

            fetchDeletedUsers();
            fetchUsers();
        } catch (error) {
            setError(error.message);
        }

        setIsDeleteModalOpen(false);
    };

    const deleteUser = async (userId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/delete/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) throw new Error('Failed to delete user');

            toast.success("User deleted successfully.", {
                closeButton: false,
                autoClose: 1500,
                style: { textAlign: 'center' }
            });

            fetchUsers();
            fetchDeletedUsers();
        } catch (error) {
            setError(error.message);
        }
        setIsDeleteModalOpen(false);
    };

    const updateUser = async () => {
        const payload = normalizeUserPayload(userToEdit);

        if (!payload.username || !payload.role || !payload.designation) {
            toast.error('Username, role and position are required.', {
                closeButton: false,
                autoClose: 1500,
            });
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/user/update/${userToEdit._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to update user');

            setIsEditModalOpen(false);
            fetchUsers();
        } catch (error) {
            setFormError('Failed to update user.');
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormError('');
    };

    const openEditModal = (user) => {
        setUserToEdit({
            ...user,
            reportingTo: user?.reportingTo?._id || user?.reportingTo || "",
            password: ""
        });

        setIsEditModalOpen(true);
    };

    return (
        <div className="user-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Admin Page</p>
                    </div>


                    {!isDeletedView && (<div className="filter-fih">
                        <div className="button-container-dept">
                            <button className="but-um" onClick={openDeletedUsersView}>
                                <div className="button-content">
                                    <FontAwesomeIcon icon={faTrashCan} className="button-icon" />
                                    <span className="button-text">Deleted Users</span>
                                </div>
                            </button>
                        </div>
                    </div>)}

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/adminUsersInverted.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{`Manage Users`}</p>
                    </div>
                </div>
            )}

            {!isSidebarVisible && (
                <div className="sidebar-hidden">
                    <div className="sidebar-toggle-icon" title="Show Sidebar" onClick={() => setIsSidebarVisible(true)}>
                        <FontAwesomeIcon icon={faCaretRight} />
                    </div>
                </div>
            )}

            <div className="main-box-user">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => {
                            if (isDeletedView) {
                                openActiveUsersView()
                            } else {
                                navigate(-1)
                            }
                        }} icon={faArrowLeft} title="Back" />
                    </div>

                    {!isDeletedView && (
                        <div className="burger-menu-icon-um">
                            <span
                                className="fa-layers fa-fw"
                                style={{ fontSize: "28px" }}
                                title="Add User"
                                onClick={openModal}
                            >
                                {/* Main user icon */}
                                <FontAwesomeIcon icon={faUser} color="gray" />

                                {/* Outer "cut-out" circle (page background color) */}
                                <FontAwesomeIcon
                                    icon={faCircle}
                                    transform="shrink-6 down-4 right-7"
                                    color="white"   // match your page background
                                />

                                {/* Inner gray circle */}
                                <FontAwesomeIcon
                                    icon={faCircle}
                                    transform="shrink-8 down-4 right-7"
                                    color="gray"
                                />

                                {/* Plus icon */}
                                <FontAwesomeIcon
                                    icon={faPlus}
                                    transform="shrink-11 down-4 right-7"
                                    color="white"
                                />
                            </span>
                        </div>
                    )}

                    {!isDeletedView && (<div className="burger-menu-icon-um" onClick={openBatch}>
                        <span
                            className="fa-layers fa-fw"
                            style={{ fontSize: "28px", cursor: "pointer" }}
                            title="Batch Register Users"
                        >
                            {/* Main group icon */}
                            <FontAwesomeIcon icon={faUserGroup} color="gray" />

                            {/* Outer cut-out circle (match page background) */}
                            <FontAwesomeIcon
                                icon={faCircle}
                                transform="shrink-6 down-4 right-12"
                                color="white"
                            />

                            {/* Inner badge circle */}
                            <FontAwesomeIcon
                                icon={faCircle}
                                transform="shrink-8 down-4 right-12"
                                color="gray"
                            />

                            {/* Plus icon */}
                            <FontAwesomeIcon
                                icon={faPlus}
                                transform="shrink-11 down-4 right-12"
                                color="white"
                            />
                        </span>
                    </div>)}

                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" && (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)}
                        {searchQuery === "" && (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>

                    <div className={`info-box-um ${isDeletedView ? 'trashed' : ''}`}>
                        {isDeletedView ? `Number of Deleted Users: ${filteredDeletedUsers.length}` : `Number of Users: ${filteredUsers.length}`}
                    </div>

                    {/* This div creates the space in the middle */}
                    <div className="spacer"></div>

                    {/* Container for right-aligned icons */}
                    <TopBar />
                </div>
                {isDeletedView ? (
                    <DeletedUserTable
                        filteredUsers={filteredDeletedUsers}
                        restoreUser={restoreUser}
                        setUserToDelete={setUserToDelete}
                        setIsDeleteModalOpen={setIsDeleteModalOpen}
                        formatRole={formatRole}
                        loggedInUserId={loggedInUserId}
                    />
                ) : (
                    <UserTable
                        filteredUsers={filteredUsers}
                        openEditModal={openEditModal}
                        setUserToDelete={setUserToDelete}
                        setIsDeleteModalOpen={setIsDeleteModalOpen}
                        formatRole={formatRole}
                        loggedInUserId={loggedInUserId}
                        openPasswordModal={openPasswordModal}
                    />
                )}
            </div>

            <AddUserModal
                isModalOpen={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                createUser={createUser}
                formError={formError}
                newUser={newUser}
                setNewUser={setNewUser}
                current={access}
                isAdmin={isAdmin}
                isCreatingUser={isCreatingUser}
            />

            {
                isDeleteModalOpen && (
                    <DeletePopupUserManagement
                        deleteUser={isDeletedView ? permanentlyDeleteUser : deleteUser}
                        department={"none"}
                        form={isDeletedView ? "deleted" : "user"}
                        setIsDeleteModalOpen={setIsDeleteModalOpen}
                        userToDelete={userToDelete}
                    />
                )
            }

            <EditUserModal
                isEditModalOpen={isEditModalOpen}
                setIsEditModalOpen={setIsEditModalOpen}
                updateUser={updateUser}
                formError={formError}
                userToEdit={userToEdit}
                setUserToEdit={setUserToEdit}
                current={access}
                isAdmin={isAdmin}
            />

            {
                isPasswordModalOpen && (<ChangePasswordModal
                    isOpen={isPasswordModalOpen}
                    setIsOpen={setIsPasswordModalOpen}
                    changePassword={changePassword}
                    user={passwordUser}
                />)
            }

            {isOpenBatch && (<BatchUploadUsers onClose={closeBatch} refresh={fetchUsers} />)}
            <ToastContainer />
        </div >
    );
};

export default UserManagement;