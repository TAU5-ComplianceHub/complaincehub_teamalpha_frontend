import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faCaretRight, faDownload, faFolderOpen, faTrash, faSort, faSearch, faArrowLeft, faX, faColumns, faFilter } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';
import TopBar from "../../Notifications/TopBar";
import DeletePopup from "../../FileInfo/DeletePopup";
import StartReviewPopup from "../../Popups/StartReviewPopup";
import SignedOffDownloadConfirmPopup from "./SignedOffDownloadConfirmPopup";
import RiskPopupMenuSignedOffFiles from "./RiskPopupMenuSignedOffFiles";
import DownloadPopupMenuSignedOffFiles from "./DownloadPopupMenuSignedOffFiles";
import { toast, ToastContainer } from "react-toastify";
import { getCurrentUser, isAdmin, canIn } from "../../../utils/auth";

const SignedOffIBRA = () => {
    const access = getCurrentUser();
    const isSystemAdmin = isAdmin(access) || canIn(access, "RMS", ["systemAdmin"]);

    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [token, setToken] = useState('');
    const [hoveredFileId, setHoveredFileId] = useState(null);
    const [hoveredDownloadId, setHoveredDownloadId] = useState(null);
    const [downloadRequest, setDownloadRequest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userID, setUserID] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [fileToDelete, setFileToDelete] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState();
    const [uploadID, setUploadID] = useState("");
    const [uploadProcedurePDF, setUploadProcedurePDF] = useState(false);

    const openPDFUpload = (id) => {
        setUploadID(id);
        setUploadProcedurePDF(true);
    }

    const closePDFUpload = () => {
        setUploadID("");
        setUploadProcedurePDF(false);
    }

    const navigate = useNavigate();
    const [fileToReview, setFileToReview] = useState(null);
    const [reviewLoading, setReviewLoading] = useState(false);

    const openReviewPopup = (id) => {
        setFileToReview(id);
        setHoveredFileId(null);
    };

    const closeReviewPopup = () => {
        if (!reviewLoading) setFileToReview(null);
    };

    const startReview = async () => {
        if (!fileToReview || reviewLoading) return;
        let route = `${process.env.REACT_APP_URL}/api/riskGenerate/reviewSOIBRA/${fileToReview}`

        try {
            setReviewLoading(true);
            const response = await fetch(`${route}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) {
                throw new Error(response.error || 'Failed to upload file');
            }

            setFileToReview(null);
            toast.success("Document Version Created in Pending Sign Off", {
                closeButton: false,
                autoClose: 1500,
                style: {
                    textAlign: 'center'
                }

            })
        } catch (error) {
            setLoading(false);
        } finally {
            setReviewLoading(false);
        }
    }

    // --- Unified Sort ---
    const DEFAULT_SORT = { colId: null, direction: "desc" };
    const [sortConfig, setSortConfig] = useState(DEFAULT_SORT);

    // --- Excel Filter ---
    const [activeExcelFilters, setActiveExcelFilters] = useState({});
    const [excelFilter, setExcelFilter] = useState({ open: false, colId: null, anchorRect: null, pos: { top: 0, left: 0, width: 0 } });
    const [excelSearch, setExcelSearch] = useState("");
    const [excelSelected, setExcelSelected] = useState(new Set());
    const excelPopupRef = useRef(null);

    // --- Drag Scroll ---
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
    const deleteFile = async () => { if (!fileToDelete) return; try { setLoading(true); const r = await fetch(`${process.env.REACT_APP_URL}/api/fileGenDocs/signedOffIBRA/trashFile/${fileToDelete}`, { headers: { Authorization: `Bearer ${token}` }, method: 'POST', }); if (!r.ok) throw new Error('Failed'); setFileToDelete(""); setSelectedFileName(""); setIsModalOpen(false); fetchFiles(); } catch (e) { console.error(e); } finally { setLoading(false); } };
    const clearSearch = () => setSearchQuery("");
    const formatDate = (dateString) => { const date = new Date(dateString); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
    const getStatusClass = (s) => {
        switch (s?.toLowerCase()) {
            case 'published': return 'status-approved';
            case 'in revision': return 'status-pending';
            default: return 'status-default';
        }
    };
    const getStatus = (s) => (s?.toLowerCase() === 'published' ? 'Signed Off' : s);

    useEffect(() => { const t = localStorage.getItem('token'); if (t) { setToken(t); setUserID(jwtDecode(t).userId); } }, [navigate]);
    useEffect(() => { if (token) fetchFiles(); }, [token, isSystemAdmin]);
    const fetchFiles = async () => {
        const route = isSystemAdmin
            ? `${process.env.REACT_APP_URL}/api/fileGenDocs/signedOffIBRA/${userID}?isAdmin=true`
            : `${process.env.REACT_APP_URL}/api/fileGenDocs/signedOffIBRA/${userID}`;
        try { const r = await fetch(route); if (!r.ok) throw new Error('Failed'); const d = await r.json(); setFiles(d.files); console.log(d.files) } catch (e) { setError(e.message); }
    };
    const downloadFile = async (fileId, fileName) => { try { setLoading(true); const r = await fetch(`${process.env.REACT_APP_URL}/api/file/download/${fileId}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } }); if (!r.ok) throw new Error('Failed'); const blob = await r.blob(); const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.setAttribute('download', fileName || 'doc.pdf'); document.body.appendChild(link); link.click(); link.parentNode.removeChild(link); } catch (e) { alert('Error'); } finally { setLoading(false); } };
    // TODO: route to be provided later — placeholder handler for downloading the latest Word document
    const downloadWordFile = async (fileName, cleanFileName) => {
        try {
            setLoading(true);
            const r = await fetch(`${process.env.REACT_APP_URL}/api/file/generatedProcedureHistory`,
                {
                    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName })
                });

            if (!r.ok) throw new Error('Failed');
            const blob = await r.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.setAttribute('download', cleanFileName || 'document.docx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (e) {
            alert('Error');
        } finally {
            setLoading(false);
        }
    };

    const openDownloadConfirm = (file, type) => { setHoveredDownloadId(null); setDownloadRequest({ file, type }); };
    const closeDownloadConfirm = () => { if (!loading) setDownloadRequest(null); };
    const confirmDownloadAction = () => {
        if (!downloadRequest) return;
        const { file, type } = downloadRequest;
        if (type === "word") {
            downloadWordFile(file.azureFileName, file.fileName);
        } else {
            downloadFile(file.dmsId._id, file.dmsId.fileName);
        }
        setDownloadRequest(null);
    };
    const removeFileExtension = (n) => n.replace(/\.[^/.]+$/, "");

    // Excel Logic
    const getFilterValuesForCell = (row, colId, index) => {
        if (colId === "nr") return [String(index + 1)];
        if (colId === "name") return [(row.formData.title)];
        if (colId === "version") return [String(row.formData.version)];
        if (colId === "status") return [getStatus(row.documentStatus)];
        if (colId === "firstPublishedBy") return [row.publisher?.username || "N/A"];
        if (colId === "firstPublishedDate") return [formatDate(row.datePublished)];
        if (colId === "lastReviewedBy") return [row.reviewer?.username || "N/A"];
        if (colId === "lastReviewDate") return [formatDate(row.dateReviewed)];
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

        const effectiveColId = colId ?? "firstPublishedDate";

        const dir = direction === "desc" ? -1 : 1;
        if (effectiveColId !== "nr") {
            const normalize = (v) => { const s = v == null ? "" : String(v).trim(); return s === "" ? "(Blanks)" : s; };
            current.sort((a, b) => {
                let valA, valB;
                switch (effectiveColId) { case "name": valA = a.formData.title; valB = b.formData.title; break; case "version": valA = a.formData.version; valB = b.formData.version; break; case "status": valA = getStatus(a.documentStatus); valB = getStatus(b.documentStatus); break; case "firstPublishedBy": valA = a.publisher?.username; valB = b.publisher?.username; break; case "firstPublishedDate": valA = a.datePublished; valB = b.datePublished; break; case "lastReviewedBy": valA = a.reviewer?.username; valB = b.reviewer?.username; break; case "lastReviewDate": valA = a.dateReviewed; valB = b.dateReviewed; break; default: valA = a[colId]; valB = b[colId]; }
                if (["firstPublishedDate", "lastReviewDate"].includes(effectiveColId)) { return (new Date(valA) - new Date(valB)) * dir; }
                if (effectiveColId === "version") return (Number(valA) - Number(valB)) * dir;
                return normalize(valA).localeCompare(normalize(valB), undefined, { numeric: true, sensitivity: 'base' }) * dir;
            });
        }
        return current;
    }, [files, searchQuery, activeExcelFilters, sortConfig]);

    const allColumns = [
        { id: "nr", title: "Nr", thClass: "gen-th ibraGenNr", tdClass: "cent-values-gen gen-point", td: (f, i) => i + 1 },
        { id: "name", title: "Document Name", thClass: "gen-th ibraGenFN", tdClass: "gen-point", onCellClick: (f) => setHoveredFileId(hoveredFileId === f._id ? null : f._id), td: (f) => (<div className="popup-anchor"><span>{(f.formData.title)}</span>{(hoveredFileId === f._id) && (<RiskPopupMenuSignedOffFiles file={f} typeDoc={"ibra"} risk={false} isOpen={true} openDownloadModal={downloadFile} setHoveredFileId={setHoveredFileId} id={f._id} review={openReviewPopup} />)}</div>) },
        { id: "version", title: "Version", thClass: "gen-th ibraGenVer", tdClass: "cent-values-gen gen-point", td: (f) => f.formData.version },
        { id: "status", title: "Document Status", thClass: "gen-th ibraGenStatus", tdClass: "cent-values-gen gen-point", td: (f) => getStatus(f.documentStatus) },
        { id: "firstPublishedBy", title: "First Published By", thClass: "gen-th ibraGenPB", tdClass: "cent-values-gen gen-point", td: (f) => f.publisher.username },
        { id: "firstPublishedDate", title: "First Published Date", thClass: "gen-th ibraGenPD", tdClass: "cent-values-gen gen-point", td: (f) => formatDate(f.datePublished) },
        { id: "lastReviewedBy", title: "Last Reviewed By", thClass: "gen-th ibraGenRB", tdClass: "cent-values-gen gen-point", td: (f) => f.reviewer?.username || "N/A" },
        { id: "lastReviewDate", title: "Last Review Date", thClass: "gen-th ibraGenRD", tdClass: "cent-values-gen gen-point", td: (f) => f.dateReviewed ? formatDate(f.dateReviewed) : "N/A" },
        {
            id: "action",
            title: "Action",
            thClass: "gen-th ibraGenType",
            tdClass: "cent-values-gen gen-point",
            td: (f) => (
                <div className="action-buttons-fi">
                    <div className="popup-anchor">
                        <button
                            className="download-button-fi col-but-res"
                            onClick={() => setHoveredDownloadId(hoveredDownloadId === f._id ? null : f._id)}
                        >
                            <FontAwesomeIcon icon={faDownload} title="Download" />
                        </button>
                        {hoveredDownloadId === f._id && (
                            <DownloadPopupMenuSignedOffFiles
                                isOpen={true}
                                setHoveredDownloadId={setHoveredDownloadId}
                                file={f}
                                onDownloadPDF={() => openDownloadConfirm(f, "pdf")}
                                onDownloadWord={() => openDownloadConfirm(f, "word")}
                            />
                        )}
                    </div>
                    <button
                        className="delete-button-fi col-but"
                        onClick={() => fileDelete(f._id, f.formData.title)}
                    >
                        <FontAwesomeIcon icon={faTrash} title="Delete" />
                    </button>
                </div>
            ),
        }
    ];

    const [showColumns, setShowColumns] = useState(allColumns.map(c => c.id));
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const visibleColumns = allColumns.filter(c => showColumns.includes(c.id));
    const isWide = visibleColumns.length > 9;

    useEffect(() => { if (!excelFilter.open) return; const c = (e) => { if (!e.target.closest('.excel-filter-popup')) setExcelFilter(p => ({ ...p, open: false })); }; document.addEventListener('mousedown', c); window.addEventListener('scroll', c, true); return () => { document.removeEventListener('mousedown', c); window.removeEventListener('scroll', c, true); }; }, [excelFilter.open]);
    useEffect(() => { if (!excelFilter.open) return; const el = excelPopupRef.current; if (!el) return; const rect = el.getBoundingClientRect(); let { top, left } = excelFilter.pos; if (rect.bottom > window.innerHeight - 8) top = Math.max(8, excelFilter.anchorRect.top - rect.height - 4); if (rect.right > window.innerWidth - 8) left = Math.max(8, left - (rect.right - (window.innerWidth - 8))); if (top !== excelFilter.pos.top || left !== excelFilter.pos.left) setExcelFilter(p => ({ ...p, pos: { ...p.pos, top, left } })); }, [excelFilter.open, excelSearch]);

    const [filterMenu, setFilterMenu] = useState({ isOpen: false, anchorRect: null });
    const filterMenuTimerRef = useRef(null);

    const hasActiveFilters = useMemo(() => {
        const hasColumnFilters = Object.keys(activeExcelFilters).length > 0;
        // Assuming default sort is nr/asc. Change if your default differs.
        const hasSort = sortConfig.colId !== null || sortConfig.direction !== "desc";
        console.log(hasSort)
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
        setSortConfig({ colId: null, direction: "desc" });
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
                        <p className="logo-text-um">Document Development</p>
                    </div>

                    <div className="button-container-create">
                        <button className="but-um"
                            onClick={() => navigate('/FrontendDMS/deletedSignedOffIBRA')}>
                            <div className="button-content">
                                <FontAwesomeIcon icon={faFolderOpen} className="button-logo-custom" />
                                <span className="button-text">Deleted Documents</span>
                            </div>
                        </button>
                    </div>

                    <div className="sidebar-logo-dm-fi">
                        <img src={`${process.env.PUBLIC_URL}/ibra2.svg`} className="icon-risk-rm" /><p className="logo-text-dm-fi">{"Controlled IBRA"}</p>
                    </div>
                </div>)
            }
            {!isSidebarVisible && (<div className="sidebar-hidden"><div className="sidebar-toggle-icon" onClick={() => setIsSidebarVisible(true)}><FontAwesomeIcon icon={faCaretRight} /></div></div>)}

            <div className="main-box-gen-info">
                <div className="top-section-um">
                    <div className="burger-menu-icon-um">
                        <FontAwesomeIcon onClick={() => navigate(-1)} icon={faArrowLeft} />
                    </div>

                    <div className="um-input-container">
                        <input className="search-input-um"
                            type="text" placeholder="Search"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off"
                        />
                        {searchQuery ? <i><FontAwesomeIcon icon={faX} onClick={clearSearch} className="icon-um-search" /></i> : <i><FontAwesomeIcon icon={faSearch} className="icon-um-search" /></i>}
                    </div>

                    <div className={`info-box-fih`}>
                        Number of Documents: {processedFiles.length}
                    </div>

                    <div className="spacer"> </div>

                    <TopBar />
                </div>
                <div className="table-flameproof-card">
                    <div className="flameproof-table-header-label-wrapper">
                        <label className="risk-control-label">{"Controlled IBRA"}</label>
                        <FontAwesomeIcon icon={faColumns} className="top-right-button-control-att" onClick={() => setShowColumnSelector(v => !v)} />
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
                        {showColumnSelector && (<div className="column-selector-popup" onMouseDown={(e) => e.stopPropagation()}><div className="column-selector-header"><h4>Select Columns</h4><button className="close-popup-btn" onClick={() => setShowColumnSelector(false)}>×</button></div><div className="column-selector-content"><div className="select-all-container"><label className="select-all-checkbox"><input type="checkbox" checked={allColumns.every(c => showColumns.includes(c.id))} onChange={(e) => setShowColumns(e.target.checked ? allColumns.map(c => c.id) : ["nr", "action"])} /><span className="select-all-text">Select All</span></label></div><div className="column-checkbox-container">{allColumns.map(col => (<div className="column-checkbox-item" key={col.id}><label><input type="checkbox" checked={showColumns.includes(col.id)} disabled={col.id === "nr" || col.id === "action"} onChange={() => setShowColumns(p => p.includes(col.id) ? p.filter(x => x !== col.id) : [...p, col.id])} /><span>{col.title}</span></label></div>))}</div><div className="column-selector-footer"><p>{visibleColumns.length} columns selected</p><button className="apply-columns-btn" onClick={() => setShowColumnSelector(false)}>Apply</button></div></div></div>)}
                    </div>
                    <div className="table-container-file-flameproof-all-assets">
                        <div className={`limit-table-height-visitor-wrap ${isDraggingX ? 'dragging' : ''} ${isWide ? 'wide' : ''}`} ref={scrollerRef} onPointerDown={onPointerDownX} onPointerMove={onPointerMoveX} onPointerUp={endDragX} onPointerLeave={endDragX} onDragStart={(e) => e.preventDefault()} style={{ maxHeight: "calc(100% - 0px)", height: "100%" }}>
                            <table className={`limit-table-height-visitor ${isWide ? 'wide' : ''}`} style={{ height: "0" }}>
                                <thead className="gen-head"><tr>{visibleColumns.map(col => { const active = activeExcelFilters[col.id] || (sortConfig.colId === col.id && col.id !== "nr"); return (<th key={col.id} className={col.thClass} onClick={(e) => openExcelFilterPopup(col.id, e)} style={{ cursor: col.id === "action" ? "default" : "pointer" }}>{col.title} {active && <FontAwesomeIcon icon={faFilter} className="th-filter-icon" style={{ marginLeft: "8px", opacity: 0.8 }} />}</th>); })}</tr></thead>
                                <tbody>{processedFiles.length === 0 ? <tr><td colSpan={visibleColumns.length} className="cent-values-gen">No documents found.</td></tr> : processedFiles.map((file, index) => (<tr key={file._id} className="file-info-row-height gen-tr">{visibleColumns.map(col => (<td key={`${file._id}-${col.id}`} className={`${col.tdClass} ${col.id === "status" ? getStatusClass(file.documentStatus) : ""}`} onClick={col.onCellClick ? () => col.onCellClick(file) : undefined}>{col.td(file, index)}</td>))}</tr>))}</tbody>
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

            <ToastContainer />
            {isModalOpen && (<DeletePopup closeModal={closeModal} deleteFile={deleteFile} isTrashView={false} loading={loading} selectedFileName={selectedFileName} />)}
            {downloadRequest && (
                <SignedOffDownloadConfirmPopup
                    closeDownloadModal={closeDownloadConfirm}
                    confirmDownload={confirmDownloadAction}
                    downloadFileName={downloadRequest.type === "word" ? downloadRequest.file.fileName : downloadRequest.file.dmsId.fileName}
                    downloadType={downloadRequest.type}
                    loading={loading}
                />
            )}
            {fileToReview && (
                <StartReviewPopup
                    startReview={startReview}
                    cancel={closeReviewPopup}
                    loading={reviewLoading}
                />
            )}
        </div>
    );
};
export default SignedOffIBRA;