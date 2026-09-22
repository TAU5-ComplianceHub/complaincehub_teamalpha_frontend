import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import { faRotate } from '@fortawesome/free-solid-svg-icons';
import { faSort, faSpinner, faX, faSearch, faArrowLeft, faBell, faCircleUser, faChevronLeft, faChevronRight, faColumns, faFilter } from "@fortawesome/free-solid-svg-icons";
import { jwtDecode } from 'jwt-decode';
import TopBar from "../Notifications/TopBar";
import DeletePopup from "../FileInfo/DeletePopup";

const FTSDeletedTemplateDocuments = () => {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [fileToDelete, setFileToDelete] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState();

    const navigate = useNavigate();
    const DEFAULT_SORT = { colId: "nr", direction: "asc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);
    const [activeExcelFilters, setActiveExcelFilters] = useState({});
    const [excelFilter, setExcelFilter] = useState({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const excelPopupRef = useRef(null);

    const scrollerRef = useRef(null);
    const dragRef = useRef({ active: false, startX: 0, startScrollLeft: 0, hasDragged: false });
    const [isDraggingX, setIsDraggingX] = useState(false);
    const DRAG_THRESHOLD = 5;

    const isInteractive = (el) => !!el.closest('button, a, input, textarea, select, [role="button"], .no-drag');
    const onPointerDownX = (e) => { const el = scrollerRef.current; if (!el || isInteractive(e.target)) return; dragRef.current.active = true; dragRef.current.hasDragged = false; dragRef.current.startX = e.clientX; dragRef.current.startScrollLeft = el.scrollLeft; };
    const onPointerMoveX = (e) => { const el = scrollerRef.current; if (!el || !dragRef.current.active) return; const dx = e.clientX - dragRef.current.startX; if (!dragRef.current.hasDragged) { if (Math.abs(dx) >= DRAG_THRESHOLD) { dragRef.current.hasDragged = true; setIsDraggingX(true); try { el.setPointerCapture?.(e.pointerId); } catch { } } else return; } el.scrollLeft = dragRef.current.startScrollLeft - dx; e.preventDefault(); };
    const endDragX = (e) => { const el = scrollerRef.current; if (dragRef.current.active && dragRef.current.hasDragged && e?.pointerId != null) { try { el?.releasePointerCapture?.(e.pointerId); } catch { } } dragRef.current.active = false; dragRef.current.hasDragged = false; setIsDraggingX(false); };

    const fileDelete = (id, fileName) => { setFileToDelete(id); setIsModalOpen(true); setSelectedFileName(fileName); }
    const closeModal = () => setIsModalOpen(null);

    const deleteFile = async () => { //*NB
        if (!fileToDelete) return;
        try {
            setLoading(true);
            const r = await fetch(`${process.env.REACT_APP_URL}/api/ftsGeneratedDocs/template/deleteFile/${fileToDelete}`,
                { headers: { Authorization: `Bearer ${token}` }, method: 'DELETE', });
            if (!r.ok) throw new Error('Failed');
            setFileToDelete("");
            setSelectedFileName("");
            setIsModalOpen(false);
            fetchFiles();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const restoreFile = async (fileId) => {//*NB
        try {
            const r = await fetch(`${process.env.REACT_APP_URL}/api/ftsGeneratedDocs/template/restoreFile/${fileId}`,
                { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (!r.ok) throw new Error('Failed');
            fetchFiles();
        } catch (e) {
            alert('Error restoring');
        }
    };

    const clearSearch = () => setSearchQuery("");
    const formatDate = (dateString) => { const date = new Date(dateString); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };

    useEffect(() => { const t = localStorage.getItem('token'); if (t) { setToken(t); setUserID(jwtDecode(t).userId); } }, [navigate]);
    useEffect(() => { if (token) fetchFiles(); }, [token]);

    const fetchFiles = async () => { //*NB
        try {
            const r = await fetch(`${process.env.REACT_APP_URL}/api/ftsGeneratedDocs/template/trash/getFiles`,
                { headers: { 'Authorization': `Bearer ${token}` } });

            if (!r.ok) throw new Error('Failed');
            const d = await r.json();
            setFiles(d.files);
        }
        catch (e) {
            setError(e.message);
        }
    };

    const removeFileExtension = (n) => n.replace(/\.[^/.]+$/, "");

    const getFilterValuesForCell = (row, colId, index) => {
        if (colId === "nr") return [String(index + 1)];
        if (colId === "name") return [(row.formData.title)];
        if (colId === "version") return [String(row.formData.version)];
        if (colId === "deletedBy") return [row.deleter?.username || "N/A"];
        if (colId === "dateDeleted") return [formatDate(row.dateDeleted)];
        if (colId === "expiryDate") return [formatDate(row.expiryDate)];
        return [row[colId] ? String(row[colId]).trim() : "N/A"];
    };

    const openExcelFilterPopup = (colId, e) => { if (colId === "action") return; const th = e.target.closest("th"); const rect = th.getBoundingClientRect(); const vals = Array.from(new Set((files || []).flatMap((r, i) => getFilterValuesForCell(r, colId, i)))).sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" })); const existing = activeExcelFilters[colId]; setExcelSelected(new Set(existing && Array.isArray(existing) ? existing : vals)); setExcelSearch(""); setExcelFilter({ open: true, colId, anchorRect: rect, pos: { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: Math.max(220, rect.width) } }); };
    const toggleSort = (colId, direction) => setSortConfig(p => (p?.colId === colId && p?.direction === direction) ? DEFAULT_SORT : { colId, direction });

    const processedFiles = useMemo(() => {
        let current = [...files];
        if (searchQuery) current = current.filter(f => f.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
        current = current.filter((r, i) => {
            for (const [c, s] of Object.entries(activeExcelFilters)) {
                if (!Array.isArray(s)) continue;

                // If user applied with nothing selected: show NO rows
                if (s.length === 0) return false;

                if (!getFilterValuesForCell(r, c, i).some(v => s.includes(v))) return false;
            }
            return true;
        });
        const { colId, direction } = sortConfig;
        const dir = direction === "desc" ? -1 : 1;
        if (colId !== "nr") {
            const normalize = (v) => { const s = v == null ? "" : String(v).trim(); return s === "" ? "(Blanks)" : s; };
            current.sort((a, b) => {
                let valA, valB;
                switch (colId) { case "name": valA = a.formData.title; valB = b.formData.title; break; case "version": valA = a.formData.version; valB = b.formData.version; break; case "deletedBy": valA = a.deleter?.username; valB = b.deleter?.username; break; case "dateDeleted": valA = a.dateDeleted; valB = b.dateDeleted; break; case "expiryDate": valA = a.expiryDate; valB = b.expiryDate; break; default: valA = a[colId]; valB = b[colId]; }
                if (["dateDeleted", "expiryDate"].includes(colId)) { return (new Date(valA) - new Date(valB)) * dir; }
                if (colId === "version") return (Number(valA) - Number(valB)) * dir;
                return normalize(valA).localeCompare(normalize(valB), undefined, { numeric: true, sensitivity: 'base' }) * dir;
            });
        }
        return current;
    }, [files, searchQuery, activeExcelFilters, sortConfig]);

    const allColumns = [
        { id: "nr", title: "Nr", thClass: "gen-th ibraGenDelNr", tdClass: "cent-values-gen gen-point", td: (f, i) => i + 1 },
        { id: "name", title: "Template Name", thClass: "gen-th ibraGenDelFN", tdClass: "gen-point", td: (f) => (<div className="popup-anchor"><span>{(f.formData.title)}</span></div>) },
        { id: "version", title: "Version", thClass: "gen-th ibraGenDelVer", tdClass: "cent-values-gen gen-point", td: (f) => f.formData.version },
        { id: "deletedBy", title: "Deleted By", thClass: "gen-th ibraGenDelDB", tdClass: "cent-values-gen gen-point", td: (f) => f.deleter.username },
        { id: "dateDeleted", title: "Date Deleted", thClass: "gen-th ibraGenDelDD", tdClass: "cent-values-gen gen-point", td: (f) => formatDate(f.dateDeleted) },
        { id: "expiryDate", title: "Expiry Date", thClass: "gen-th ibraGenDelED", tdClass: "cent-values-gen gen-point", td: (f) => formatDate(f.expiryDate) },
        { id: "action", title: "Action", thClass: "gen-th ibraGenDelAct", tdClass: "cent-values-gen trashed", td: (f) => (<><button className="delete-button-fi col-but trashed-color" onClick={() => fileDelete(f._id, f.formData.title)}><FontAwesomeIcon icon={faTrash} title="Delete Document" /></button><button className="delete-button-fi col-but-res trashed-color" onClick={() => restoreFile(f._id)}><FontAwesomeIcon icon={faRotate} title="Restore Document" /></button></>) }
    ];

    const [showColumns, setShowColumns] = useState(allColumns.map(c => c.id));
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const toggleColumn = (id) => { if (id !== "nr" && id !== "action") setShowColumns(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]); };
    const toggleAllColumns = (s) => setShowColumns(s ? allColumns.map(c => c.id) : ["nr", "action"]);
    const areAllSelected = () => allColumns.every(col => showColumns.includes(col.id));
    const visibleColumns = allColumns.filter(c => showColumns.includes(c.id));
    const isWide = visibleColumns.length > 9;

    useEffect(() => { if (!excelFilter.open) return; const c = (e) => { if (!e.target.closest('.excel-filter-popup')) setExcelFilter(p => ({ ...p, open: false })); }; document.addEventListener('mousedown', c); window.addEventListener('scroll', c, true); return () => { document.removeEventListener('mousedown', c); window.removeEventListener('scroll', c, true); }; }, [excelFilter.open]);

    // Popup positioning
    useEffect(() => {
        if (!excelFilter.open) return;
        const el = excelPopupRef.current; if (!el) return;
        const rect = el.getBoundingClientRect();
        let { top, left } = excelFilter.pos;
        if (rect.bottom > window.innerHeight - 8) top = Math.max(8, excelFilter.anchorRect.top - rect.height - 4);
        if (rect.right > window.innerWidth - 8) left = Math.max(8, left - (rect.right - (window.innerWidth - 8)));
        if (top !== excelFilter.pos.top || left !== excelFilter.pos.left) setExcelFilter(p => ({ ...p, pos: { ...p.pos, top, left } }));
    }, [excelFilter.open, excelSearch]);

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(activeExcelFilters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortConfig.colId !== "nr" || sortConfig.direction !== "asc";
        return hasColumnFilters || hasSort;
    }, [activeExcelFilters, sortConfig]);

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
        setActiveExcelFilters({});
        setSortConfig({ colId: "nr", direction: "asc" });
        setFilterMenu({ isOpen: false, anchorRect: null });
    };

    const getFilterBtnClass = () => {
        return "top-right-button-control-att-2";
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
        for (const [filterColId, selectedValues] of Object.entries(activeExcelFilters)) {
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

    if (error) return <div>Error: {error}</div>;

    return (
        <div className="gen-file-info-container">
            {isSidebarVisible && (
                <div className="sidebar-um">
                    <div className="sidebar-toggle-icon" onClick={() => setIsSidebarVisible(false)}>
                        <FontAwesomeIcon icon={faCaretLeft} />
                    </div>
                    <div className="sidebar-logo-um">
                        <img src={`${process.env.PUBLIC_URL}/CH_Logo.svg`} alt="Logo" className="logo-img-um" onClick={() => navigate('/FrontendDMS/home')} title="Home" />
                        <p className="logo-text-um">Field Template</p>
                    </div>
                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/blra2.svg`} className="icon-risk-rm" />
                        <p className="logo-text-dm-fi">{"Deleted Templates"}</p>
                    </div>
                </div>
            )}
            {!isSidebarVisible && (<div className="sidebar-hidden"><div className="sidebar-toggle-icon" onClick={() => setIsSidebarVisible(true)}><FontAwesomeIcon icon={faCaretRight} /></div></div>)}

            <div className="main-box-gen-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um"><FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} title="Back" /></div>
                    <div className="um-input-container"><input className="search-input-um" type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off" />{searchQuery ? <i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" /></i> : <i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>}</div>
                    <div className={`info-box-fih`}>Number of Templates: {processedFiles.length}</div>
                    <div className="spacer"></div>
                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Deleted Templates"}</label>
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
                        <FontAwesomeIcon icon={faColumns} className="top-right-button-control-att" onClick={() => setShowColumnSelector(v => !v)} />
                        {showColumnSelector && (<div className="column-selector-popup" onMouseDown={(e) => e.stopPropagation()}><div className="column-selector-header"><h4>Select Columns</h4><button className="close-popup-btn" onClick={() => setShowColumnSelector(false)}>×</button></div><div className="column-selector-content"><div className="select-all-container"><label className="select-all-checkbox"><input type="checkbox" checked={areAllSelected()} onChange={(e) => toggleAllColumns(e.target.checked)} /><span className="select-all-text">Select All</span></label></div><div className="column-checkbox-container">{allColumns.map(col => (<div className="column-checkbox-item" key={col.id}><label><input type="checkbox" checked={showColumns.includes(col.id)} disabled={col.id === "nr" || col.id === "action"} onChange={() => toggleColumn(col.id)} /><span>{col.title}</span></label></div>))}</div><div className="column-selector-footer"><p>{visibleColumns.length} columns selected</p><button className="apply-columns-btn" onClick={() => setShowColumnSelector(false)}>Apply</button></div></div></div>)}
                    </div>
                    <div className="table-container-file-flameproof-all-assets">
                        <div className={`limit-table-height-visitor-wrap ${isDraggingX ? 'dragging' : ''} ${isWide ? 'wide' : ''}`} ref={scrollerRef} onPointerDown={onPointerDownX} onPointerMove={onPointerMoveX} onPointerUp={endDragX} onPointerLeave={endDragX} onDragStart={(e) => e.preventDefault()} style={{ maxHeight: "calc(100% - 0px)", height: "100%" }}>
                            <table className={`limit-table-height-visitor ${isWide ? 'wide' : ''}`} style={{ height: "0" }}>
                                <thead className="gen-head-del"><tr>{visibleColumns.map(col => { const active = activeExcelFilters[col.id] || (sortConfig.colId === col.id && col.id !== "nr"); return (<th key={col.id} className={col.thClass} onClick={(e) => openExcelFilterPopup(col.id, e)} style={{ cursor: col.id === "action" ? "default" : "pointer" }}>{col.title} {active && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />}</th>); })}</tr></thead>
                                <tbody>{processedFiles.length === 0 ? <tr><td colSpan={visibleColumns.length} className="cent-values-gen">No documents found.</td></tr> : processedFiles.map((file, index) => (<tr key={file._id} className="file-info-row-height gen-tr">{visibleColumns.map(col => (<td key={`${file._id}-${col.id}`} className={col.tdClass} onClick={col.onCellClick ? () => col.onCellClick(file) : undefined}>{col.td(file, index)}</td>))}</tr>))}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

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

                            setActiveExcelFilters(prev => {
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

            {isModalOpen && (<DeletePopup closeModal={closeModal} deleteFile={deleteFile} isTrashView={false} loading={loading} selectedFileName={selectedFileName} />)}
        </div >
    );
};
export default FTSDeletedTemplateDocuments;