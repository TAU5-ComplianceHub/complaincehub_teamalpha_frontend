import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faTrash, faRotate, faX, faSearch, faArrowLeft, faFilter } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import TopBar from "../../Notifications/TopBar";
import DeletePopup from "../../FileInfo/DeletePopup";

const DeletedDocumentsSOJRA = () => {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [fileToDelete, setFileToDelete] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState();

    // --- Excel Filter State ---
    const excelPopupRef = useRef(null);
    const [filters, setFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ colId: null, direction: null });
    const [excelFilter, setExcelFilter] = useState({
        open: false,
        colId: null,
        anchorRect: null,
        pos: { top: 0, left: 0, width: 0 }
    });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    // ---------------------------

    const navigate = useNavigate();

    const fileDelete = (id, fileName) => {
        setFileToDelete(id);
        setIsModalOpen(true);
        setSelectedFileName(fileName);
    }

    const closeModal = () => {
        setIsModalOpen(null);
    }

    const deleteFile = async () => {
        if (!fileToDelete) return;
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/signedOffJRA/deleteFile/${fileToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete the file');

            setFileToDelete("");
            setSelectedFileName("");
            setIsModalOpen(false);
            fetchFiles();
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setLoading(false);
        }
    };

    const restoreFile = async (fileId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/signedOffJRA/restoreFile/${fileId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch files');
            fetchFiles();
        } catch (error) {
            alert('Error restoring the file. Please try again.');
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            jwtDecode(storedToken);
        }
    }, [navigate]);

    useEffect(() => {
        if (token) fetchFiles();
    }, [token]);

    const fetchFiles = async () => {
        const route = `/api/fileGenDocs/signedOffJRA/trash/getFiles`;
        try {
            const response = await fetch(`${process.env.REACT_APP_URL}${route}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch files');
            const data = await response.json();
            setFiles(data.files);
        } catch (error) {
            setError(error.message);
        }
    };

    const removeFileExtension = (fileName) => {
        return fileName.replace(/\.[^/.]+$/, "");
    };

    // --- Excel Logic ---

    const getFilterValuesForCell = (file, colId) => {
        let val = "";
        switch (colId) {
            case "fileName":
                val = (file.formData.title);
                break;
            case "version":
                val = file.formData.version;
                break;
            case "deletedBy":
                val = file.deleter.username;
                break;
            case "dateDeleted":
                val = formatDate(file.dateDeleted);
                break;
            case "expiryDate":
                val = formatDate(file.expiryDate);
                break;
            default:
                return [];
        }
        return [String(val).trim()];
    };

    const toggleSort = (colId, direction) => {
        setSortConfig(prev => {
            if (prev?.colId === colId && prev?.direction === direction) {
                return { colId: null, direction: null };
            }
            return { colId, direction };
        });
    };

    function openExcelFilterPopup(colId, e) {
        if (colId === "nr" || colId === "action") return;

        const th = e.target.closest("th");
        const rect = th.getBoundingClientRect();

        const values = Array.from(
            new Set((files || []).flatMap(r => getFilterValuesForCell(r, colId)))
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

        const existing = filters?.[colId]?.selected;
        const initialSelected = new Set(existing && Array.isArray(existing) ? existing : values);

        setExcelSelected(initialSelected);
        setExcelSearch("");

        setExcelFilter({
            open: true,
            colId,
            anchorRect: rect,
            pos: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: Math.max(220, rect.width),
            },
        });
    }

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.excel-filter-popup') && !e.target.closest('th')) {
                setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
            }
        };
        if (excelFilter.open) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', () => setExcelFilter({ open: false, colId: null, anchorRect: null, pos: {} }), true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [excelFilter.open]);

    useEffect(() => {
        if (!excelFilter.open || !excelPopupRef.current) return;
        const el = excelPopupRef.current;
        const popupRect = el.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const margin = 8;

        let newTop = excelFilter.pos.top;
        let newLeft = excelFilter.pos.left;

        if (popupRect.bottom > viewportH - margin && excelFilter.anchorRect) {
            newTop = Math.max(margin, excelFilter.anchorRect.top - popupRect.height - 4);
        }
        if (popupRect.right > viewportW - margin) {
            newLeft = Math.max(margin, newLeft - (popupRect.right - (viewportW - margin)));
        }

        if (newTop !== excelFilter.pos.top || newLeft !== excelFilter.pos.left) {
            el.style.top = `${newTop}px`;
            el.style.left = `${newLeft}px`;
        }
    }, [excelFilter.open, excelSearch, excelSelected]);

    const filteredFiles = useMemo(() => {
        let current = [...files];
        if (searchQuery) {
            current = current.filter(file => file.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        current = current.filter((r, i) => {
            for (const [c, s] of Object.entries(filters)) {
                if (!Array.isArray(s)) continue;

                // If user applied with nothing selected: show NO rows
                if (s.length === 0) return false;

                if (!getFilterValuesForCell(r, c, i).some(v => s.includes(v))) return false;
            }
            return true;
        });

        const { colId, direction } = sortConfig;
        if (colId) {
            const dir = direction === 'desc' ? -1 : 1;
            current.sort((a, b) => {
                const valA = getFilterValuesForCell(a, colId)[0];
                const valB = getFilterValuesForCell(b, colId)[0];
                return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * dir;
            });
        } else {
            // Default Sort: Date Deleted Descending
            current.sort((a, b) => new Date(b.dateDeleted) - new Date(a.dateDeleted));
        }
        return current;
    }, [files, searchQuery, filters, sortConfig]);

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(filters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortConfig.colId !== null || sortConfig.direction !== null;
        return hasColumnFilters || hasSort;
    }, [filters, sortConfig]);

    const openFilterMenu = (e) => {
        if (!hasActiveFilters) return;
        if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
        const rect = e.currentTarget.getBoundingClientRect();
        setFilterMenu({ isOpen: true, anchorRect: rect });
    };

    const closeFilterMenuWithDelay = () => {
        filterMenuTimerRef.current = setTimeout(() => {
            setFilterMenu(prev => ({ ...prev, isOpen: false }));
        }, 200);
    };

    const cancelCloseFilterMenu = () => {
        if (filterMenuTimerRef.current) clearTimeout(filterMenuTimerRef.current);
    };

    const handleClearFilters = () => {
        setFilters({});
        setSortConfig({ colId: null, direction: null });
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getFilterBtnClass = () => {
        return "top-right-button-control-att";
    };

    // --- NEW: Helper to get options filtered by OTHER columns ---
    const getAvailableOptions = (colId) => {
        // Start with all files
        let filtered = files;

        // 1. Apply Global Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            // Matching the logic in processedFiles (assuming fileName or formData.title)
            filtered = filtered.filter(f =>
                (f.fileName || f.formData?.title || "").toLowerCase().includes(lowerQ)
            );
        }

        // 2. Apply filters from ALL OTHER active columns
        for (const [filterColId, selectedValues] of Object.entries(filters)) {
            if (filterColId === colId) continue; // Don't filter a column by itself
            if (!selectedValues || !Array.isArray(selectedValues)) continue;

            filtered = filtered.filter((row, index) => {
                const cellValues = getFilterValuesForCell(row, filterColId, index);
                // Keep row if ANY of its cell values match the selection
                return cellValues.some(v => selectedValues.includes(v));
            });
        }

        // 3. Extract unique values for the requested column from the filtered subset
        return Array.from(
            new Set(filtered.flatMap((r, i) => getFilterValuesForCell(r, colId, i)))
        ).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
    };

    const renderTh = (colId, label, className) => (
        <th
            className={`${className} ${filters[colId] || sortConfig.colId === colId ? 'active-filter-header' : ''}`}
            onClick={(e) => openExcelFilterPopup(colId, e)}
            style={{ cursor: 'pointer', position: 'relative' }}
        >
            {label}
            {(filters[colId] || sortConfig.colId === colId) && (
                <FontAwesomeIcon icon={faFilter} className="active-filter-icon" style={{ marginLeft: "8px" }} />
            )}
        </th>
    );

    return (
        <div className="gen-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" title="Hide Sidebar" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Document Development</p>
                    </div>
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/jra2.svg`} alt="Control Attributes" className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Deleted Controlled JRAs"}</p>
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

            <div className="main-box-gen-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" />
                    </div>
                    <div className="um-input-container">
                        <input
                            className="search-input-um"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            autoComplete="off"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery !== "" ? (<i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" title="Clear Search" /></i>)
                            : (<i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>)}
                    </div>
                    <div className={`info-box-fih`}>Number of Documents: {filteredFiles.length}</div>
                    <div className="spacer"></div>
                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Deleted Controlled JRAs"}</label>
                        <FontAwesomeIcon
                            icon={faFilter}
                            className={getFilterBtnClass()} // Calculated class (e.g., ibra4, ibra5, ibra6)
                            title={hasActiveFilters ? "Filters Active (Double Click to Clear)" : "Table is filter enabled."}
                            style={{
                                cursor: hasActiveFilters ? "pointer" : "default",
                                color: hasActiveFilters ? "#002060" : "gray"
                            }}
                            onMouseEnter={(e) => {
                                if (hasActiveFilters) openFilterMenu(e);
                            }}
                            onMouseLeave={closeFilterMenuWithDelay}
                            onDoubleClick={handleClearFilters}
                        />
                    </div>
                    <div className="table-container-file-flameproof-all-assets">
                        <table className="gen-table">
                            <thead className="gen-head-del">
                                <tr>
                                    <th className="gen-th ibraGenDelNr">Nr</th>
                                    {renderTh("fileName", "Document Name", "gen-th ibraGenDelFN")}
                                    {renderTh("version", "Version", "gen-th ibraGenDelVer")}
                                    {renderTh("deletedBy", "Deleted By", "gen-th ibraGenDelDB")}
                                    {renderTh("dateDeleted", "Date Deleted", "gen-th ibraGenDelDD")}
                                    {renderTh("expiryDate", "Expiry Date", "gen-th ibraGenDelED")}
                                    <th className="gen-th ibraGenDelAct">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFiles.map((file, index) => (
                                    <tr key={file._id} className={`file-info-row-height gen-tr`}>
                                        <td className="cent-values-gen gen-point">{index + 1}</td>
                                        <td className=" gen-point">
                                            <div className="popup-anchor">
                                                <span>{(file.formData.title)}</span>
                                            </div>
                                        </td>
                                        <td className="cent-values-gen gen-point">{file.formData.version}</td>
                                        <td className="cent-values-gen gen-point">{file.deleter.username}</td>
                                        <td className="cent-values-gen gen-point">{formatDate(file.dateDeleted)}</td>
                                        <td className="cent-values-gen gen-point">{formatDate(file.expiryDate)}</td>
                                        <td className={"cent-values-gen trashed"}>
                                            <button
                                                className={"delete-button-fi col-but trashed-color"}
                                                onClick={() => fileDelete(file._id, file.formData.title)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} title="Delete Document" />
                                            </button>
                                            <button
                                                className={"delete-button-fi col-but-res trashed-color"}
                                                onClick={() => restoreFile(file._id)}
                                            >
                                                <FontAwesomeIcon icon={faRotate} title="Restore Document" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (<DeletePopup closeModal={closeModal} deleteFileFromTrash={deleteFile} isTrashView={true} loading={loading} selectedFileName={selectedFileName} />)}

            {/* Excel Filter Popup */}
            {excelFilter.open && (
                <div
                    className="excel-filter-popup"
                    ref={excelPopupRef}
                    style={{
                        position: "fixed",
                        top: excelFilter.pos.top,
                        left: excelFilter.pos.left,
                        width: excelFilter.pos.width,
                        zIndex: 9999,
                    }}
                    onWheel={(e) => e.stopPropagation()}
                >
                    <div className="excel-filter-sortbar">
                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                sortConfig.direction === "asc" ? "active" : ""
                                }`}
                            onClick={() => toggleSort(excelFilter.colId, "asc")}
                        >
                            Sort Acsending
                        </button>

                        <button
                            type="button"
                            className={`excel-sort-btn ${sortConfig.colId === excelFilter.colId &&
                                sortConfig.direction === "desc" ? "active" : ""
                                }`}
                            onClick={() => toggleSort(excelFilter.colId, "desc")}
                        >
                            Sort Descending
                        </button>
                    </div>

                    <input
                        type="text"
                        className="excel-filter-search"
                        placeholder="Search"
                        value={excelSearch}
                        onChange={(e) => setExcelSearch(e.target.value)}
                    />

                    {(() => {
                        const colId = excelFilter.colId;

                        // Use the new helper to get context-aware options
                        const allValues = getAvailableOptions(colId);

                        const visibleValues = allValues.filter(v =>
                            String(v).toLowerCase().includes(excelSearch.toLowerCase())
                        );

                        const isAllVisibleSelected =
                            visibleValues.length > 0 && visibleValues.every(v => excelSelected.has(v));

                        const toggleAll = (checked) => {
                            setExcelSelected(prev => {
                                const next = new Set(prev);
                                if (checked) {
                                    visibleValues.forEach(v => next.add(v));
                                } else {
                                    visibleValues.forEach(v => next.delete(v));
                                }
                                return next;
                            });
                        };

                        const toggleValue = (v) => {
                            setExcelSelected(prev => {
                                const next = new Set(prev);
                                if (next.has(v)) next.delete(v);
                                else next.add(v);
                                return next;
                            });
                        };

                        const onOk = () => {
                            let finalSelection = new Set(excelSelected);

                            // If searching, only apply changes to the visible items
                            if (excelSearch.trim() !== "") {
                                const visibleSet = new Set(visibleValues);
                                finalSelection = new Set(
                                    Array.from(excelSelected).filter(v => visibleSet.has(v))
                                );
                            }

                            const selectedArr = Array.from(finalSelection);

                            // Check if this is a "Select All" (Reset) scenario
                            const isTotalReset = allValues.length > 0 &&
                                allValues.length === selectedArr.length &&
                                selectedArr.every(v => finalSelection.has(v));

                            setFilters(prev => {
                                const next = { ...prev };
                                if (isTotalReset) {
                                    delete next[colId];
                                } else {
                                    next[colId] = selectedArr;
                                }
                                return next;
                            });

                            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                        };

                        const onCancel = () => {
                            setExcelFilter({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
                        };

                        return (
                            <>
                                <div className="excel-filter-list">
                                    <label className="excel-filter-item">
                                        <span className="excel-filter-checkbox">
                                            <input
                                                type="checkbox"
                                                className="checkbox-excel-attend"
                                                checked={isAllVisibleSelected}
                                                onChange={(e) => toggleAll(e.target.checked)}
                                            />
                                        </span>
                                        <span className="excel-filter-text">
                                            {excelSearch === "" ? "(Select All)" : "(Select All Search Results)"}
                                        </span>
                                    </label>

                                    {visibleValues.map(v => (
                                        <label className="excel-filter-item" key={String(v)}>
                                            <span className="excel-filter-checkbox">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox-excel-attend"
                                                    checked={excelSelected.has(v)}
                                                    onChange={() => toggleValue(v)}
                                                />
                                            </span>
                                            <span className="excel-filter-text">{v}</span>
                                        </label>
                                    ))}

                                    {visibleValues.length === 0 && (
                                        <div style={{ padding: "8px", color: "#888", fontStyle: "italic", fontSize: "12px" }}>
                                            No matches found
                                        </div>
                                    )}
                                </div>
                                <div className="excel-filter-actions">
                                    <button type="button" className="excel-filter-btn" onClick={onOk}>Apply</button>
                                    <button type="button" className="excel-filter-btn-cnc" onClick={onCancel}>Cancel</button>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div >
    );
};

export default DeletedDocumentsSOJRA;