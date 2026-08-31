import React, { useEffect, useState } from 'react';
import TicketList from '../components/TicketList';
import BulkEmailModal from '../components/BulkEmailModal';
import BulkStatusModal from '../components/BulkStatusModal';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Archive, FileText, Mail, RefreshCw, X, CheckSquare, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import PDFDocument from '../components/PDFDocument';
import CombinedPDFDocument from '../components/CombinedPDFDocument';
import { getTicketPdfFileName } from '../services/formatService';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const Dashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

    // Estados de selección múltiple
    const [selectedIds, setSelectedIds] = useState([]);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    // Estado de progreso para operaciones masivas de descarga
    const [bulkProgress, setBulkProgress] = useState({
        active: false,
        title: '',
        message: '',
        percent: 0
    });

    // Toast de notificaciones
    const [toast, setToast] = useState(null);

    const [stats, setStats] = useState({
        inWorkshop: 0,
        pending: 0,
        ready: 0
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchTickets = async () => {
        try {
            const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            const loadedTickets = [];
            let newStats = { inWorkshop: 0, pending: 0, ready: 0 };

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const ticket = {
                    id: doc.id,
                    ...data, // Conservamos todos los campos para alimentar los PDFs
                    customer: data.customerName || 'Sin Nombre',
                    company: data.customerCompany || '',
                    device: `${data.deviceType || ''} ${data.deviceModel || ''}`.trim() || 'Dispositivo desconocido',
                    deviceSerial: data.deviceSerial || '',
                    status: data.status || 'Pendiente',
                    date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX')
                };
                loadedTickets.push(ticket);

                if (data.status === 'En Reparación' || data.status === 'Diagnóstico') newStats.inWorkshop++;
                if (data.status === 'Pendiente') newStats.pending++;
                if (data.status === 'Finalizado' || data.status === 'Listo') newStats.ready++;
            });

            setTickets(loadedTickets);
            setStats(newStats);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            showToast("Error al cargar los tickets de Firestore.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // Reiniciar página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // Filtrar tickets
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = 
            ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.customerName || ticket.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.customerCompany || ticket.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.deviceModel || ticket.device || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.deviceSerial || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = 
            statusFilter === 'Todos' || 
            ticket.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Paginación
    const indexOfLastTicket = currentPage * ticketsPerPage;
    const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
    const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);
    const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    // Control de selección
    const handleToggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllVisible = (checked) => {
        if (checked) {
            const visibleIds = currentTickets.map(t => t.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
        } else {
            const visibleIds = new Set(currentTickets.map(t => t.id));
            setSelectedIds(prev => prev.filter(id => !visibleIds.has(id)));
        }
    };

    const handleSelectAllFiltered = () => {
        const allFilteredIds = filteredTickets.map(t => t.id);
        setSelectedIds(allFilteredIds);
        showToast(`Se seleccionaron los ${allFilteredIds.length} tickets filtrados.`);
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    const allVisibleSelected =
        currentTickets.length > 0 &&
        currentTickets.every(t => selectedIds.includes(t.id));

    // Obtener los objetos completos de los tickets seleccionados
    const selectedTickets = tickets.filter(t => selectedIds.includes(t.id));

    // ==========================================
    // ACCIÓN MASIVA 1: DESCARGAR PAQUETE EN ZIP
    // ==========================================
    const handleDownloadZip = async () => {
        if (selectedTickets.length === 0) return;

        setBulkProgress({
            active: true,
            title: 'Generando Paquete ZIP',
            message: 'Iniciando generación de dictámenes...',
            percent: 5
        });

        try {
            const zip = new JSZip();
            const total = selectedTickets.length;

            for (let i = 0; i < total; i++) {
                const ticket = selectedTickets[i];
                const percent = 5 + Math.round(((i + 1) / total) * 80);
                const fileName = getTicketPdfFileName(ticket);

                setBulkProgress({
                    active: true,
                    title: 'Generando Paquete ZIP',
                    message: `Generando PDF (${i + 1} de ${total}): ${fileName}...`,
                    percent: percent
                });

                const blob = await pdf(<PDFDocument data={ticket} />).toBlob();
                zip.file(fileName, blob);
            }

            setBulkProgress({
                active: true,
                title: 'Generando Paquete ZIP',
                message: 'Comprimiendo archivos en ZIP...',
                percent: 90
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const dateStr = new Date().toISOString().slice(0, 10);
            const zipFileName = `Dictamenes_JJLAB_${dateStr}.zip`;

            if (typeof saveAs === 'function') {
                saveAs(zipBlob, zipFileName);
            } else {
                const url = window.URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = zipFileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }

            setBulkProgress({
                active: true,
                title: 'Generando Paquete ZIP',
                message: '¡Descarga completada!',
                percent: 100
            });

            setTimeout(() => {
                setBulkProgress({ active: false, title: '', message: '', percent: 0 });
                showToast(`Se descargó el paquete con ${total} dictámenes en ZIP`, 'success');
            }, 1200);

        } catch (err) {
            console.error('Error al generar ZIP:', err);
            setBulkProgress({ active: false, title: '', message: '', percent: 0 });
            showToast('Error al generar el archivo ZIP.', 'error');
        }
    };

    // ==========================================
    // ACCIÓN MASIVA 2: DESCARGAR PDF UNIFICADO
    // ==========================================
    const handleDownloadUnifiedPdf = async () => {
        if (selectedTickets.length === 0) return;

        setBulkProgress({
            active: true,
            title: 'Generando PDF Unificado',
            message: `Consolidando ${selectedTickets.length} dictámenes en un solo documento...`,
            percent: 30
        });

        try {
            const blob = await pdf(<CombinedPDFDocument tickets={selectedTickets} />).toBlob();
            const dateStr = new Date().toISOString().slice(0, 10);
            const fileName = `Dictamenes_Unificados_JJLAB_${dateStr}.pdf`;

            setBulkProgress({
                active: true,
                title: 'Generando PDF Unificado',
                message: 'Descargando documento...',
                percent: 90
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setBulkProgress({
                active: true,
                title: 'Generando PDF Unificado',
                message: '¡Descarga completada!',
                percent: 100
            });

            setTimeout(() => {
                setBulkProgress({ active: false, title: '', message: '', percent: 0 });
                showToast(`Se descargó el PDF unificado con ${selectedTickets.length} equipos`, 'success');
            }, 1200);

        } catch (err) {
            console.error('Error al generar PDF Unificado:', err);
            setBulkProgress({ active: false, title: '', message: '', percent: 0 });
            showToast('Error al generar el PDF Unificado.', 'error');
        }
    };

    // ==========================================
    // ACCIÓN MASIVA 3: ACTUALIZAR ESTADO EN LOTE
    // ==========================================
    const handleStatusUpdated = (newStatus) => {
        setTickets(prev =>
            prev.map(t => (selectedIds.includes(t.id) ? { ...t, status: newStatus } : t))
        );
        showToast(`Se actualizó el estado a "${newStatus}" para ${selectedIds.length} equipos`, 'success');
        setSelectedIds([]);
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando tablero...</div>;
    }

    return (
        <div className="space-y-6 pb-16">
            {/* Toast Flotante */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 text-sm font-medium animate-slideUp ${
                    toast.type === 'error'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : 'bg-slate-900 text-white border-slate-800'
                }`}>
                    {toast.type === 'error' ? (
                        <AlertCircle size={18} className="text-red-500 shrink-0" />
                    ) : (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    )}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Modal de Progreso de Generación Masiva */}
            {bulkProgress.active && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Loader2 size={20} className="animate-spin" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-base">{bulkProgress.title}</h3>
                                <p className="text-xs text-slate-500">{bulkProgress.message}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                                <span>Progreso</span>
                                <span>{bulkProgress.percent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${bulkProgress.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modales de Envío por Correo y Estado en Lote */}
            <BulkEmailModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                selectedTickets={selectedTickets}
                onSendSuccess={(msg) => {
                    showToast(msg, 'success');
                    setSelectedIds([]);
                }}
            />

            <BulkStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                selectedTickets={selectedTickets}
                onStatusUpdated={handleStatusUpdated}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">En Taller (Total)</p>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{stats.inWorkshop}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Pendientes</p>
                    <p className="text-3xl font-bold text-orange-500 mt-2">{stats.pending}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Listos</p>
                    <p className="text-3xl font-bold text-green-500 mt-2">{stats.ready}</p>
                </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por Folio, Cliente, Empresa o Equipo..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <select
                        className="w-full md:w-48 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-600 bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="Todos">Todos los Estados</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Diagnóstico">Diagnóstico</option>
                        <option value="En Reparación">En Reparación</option>
                        <option value="Listo">Listo</option>
                        <option value="Finalizado">Finalizado</option>
                        <option value="Entregado">Entregado</option>
                        <option value="Baja">Baja</option>
                    </select>
                </div>
            </div>

            {/* BARRA DE ACCIONES MASIVAS (Se muestra cuando hay elementos seleccionados) */}
            {selectedIds.length > 0 && (
                <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-800 flex flex-wrap justify-between items-center gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded-lg text-xs tracking-wider">
                            {selectedIds.length} {selectedIds.length === 1 ? 'SELECCIONADO' : 'SELECCIONADOS'}
                        </span>
                        {filteredTickets.length > currentTickets.length && selectedIds.length < filteredTickets.length && (
                            <button
                                onClick={handleSelectAllFiltered}
                                className="text-xs text-blue-300 hover:text-white underline transition-colors"
                            >
                                Seleccionar los {filteredTickets.length} de esta búsqueda
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Descargar ZIP */}
                        <button
                            onClick={handleDownloadZip}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 hover:border-slate-600"
                            title="Descargar paquete ZIP con PDFs individuales"
                        >
                            <Archive size={15} className="text-blue-400" />
                            <span>Descargar ZIP</span>
                        </button>

                        {/* Descargar PDF Unificado */}
                        <button
                            onClick={handleDownloadUnifiedPdf}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 hover:border-slate-600"
                            title="Descargar un único PDF con todos los dictámenes consolidados"
                        >
                            <FileText size={15} className="text-indigo-400" />
                            <span>PDF Unificado</span>
                        </button>

                        {/* Enviar por Correo */}
                        <button
                            onClick={() => setIsEmailModalOpen(true)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/20"
                            title="Enviar dictámenes por correo a destinatario(s) personalizado(s)"
                        >
                            <Mail size={15} />
                            <span>Enviar por Correo</span>
                        </button>

                        {/* Cambiar Estado */}
                        <button
                            onClick={() => setIsStatusModalOpen(true)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                            title="Cambiar el estado de los equipos seleccionados"
                        >
                            <RefreshCw size={15} className="text-orange-400" />
                            <span>Cambiar Estado</span>
                        </button>

                        {/* Limpiar Selección */}
                        <button
                            onClick={handleClearSelection}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Deseleccionar todos"
                        >
                            <X size={17} />
                        </button>
                    </div>
                </div>
            )}

            {/* Tabla de Tickets */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">
                        {statusFilter === 'Todos' ? 'Todos los Ingresos' : `Ingresos: ${statusFilter}`}
                    </h3>
                    <span className="text-xs text-slate-500">
                        Total encontrados: {filteredTickets.length}
                    </span>
                </div>
                {currentTickets.length > 0 ? (
                    <>
                        <TicketList
                            tickets={currentTickets}
                            selectedIds={selectedIds}
                            onToggleSelect={handleToggleSelect}
                            onSelectAll={handleSelectAllVisible}
                            allVisibleSelected={allVisibleSelected}
                            onShowToast={showToast}
                        />

                        {/* Controles de Paginación */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-col sm:flex-row gap-3">
                                <span className="text-sm text-slate-500">
                                    Mostrando registros {indexOfFirstTicket + 1} al {Math.min(indexOfLastTicket, filteredTickets.length)} de {filteredTickets.length}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <span className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg">
                                        Pág. {currentPage} de {totalPages}
                                    </span>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        No se encontraron tickets con los criterios de búsqueda.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
