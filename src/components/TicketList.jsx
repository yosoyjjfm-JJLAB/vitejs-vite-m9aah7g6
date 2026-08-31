import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Download, Mail, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import PDFDocument from './PDFDocument';
import { getTicketPdfFileName } from '../services/formatService';
import { uploadPDF } from '../services/storageService';
import { sendTicketEmail } from '../services/emailService';

const TicketList = ({
    tickets = [],
    selectedIds = [],
    onToggleSelect = () => {},
    onSelectAll = () => {},
    allVisibleSelected = false,
    onShowToast = () => {}
}) => {
    const [downloadingId, setDownloadingId] = useState(null);
    const [sendingEmailId, setSendingEmailId] = useState(null);
    const [sentEmailSuccessId, setSentEmailSuccessId] = useState(null);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Finalizado':
            case 'Listo':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={12} className="mr-1" /> {status}
                    </span>
                );
            case 'Pendiente':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <AlertCircle size={12} className="mr-1" /> Pendiente
                    </span>
                );
            case 'Entregado':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <CheckCircle size={12} className="mr-1" /> Entregado
                    </span>
                );
            case 'Baja':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertCircle size={12} className="mr-1" /> Baja
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Clock size={12} className="mr-1" /> {status || 'En proceso'}
                    </span>
                );
        }
    };

    // Descarga rápida individual con el nuevo nombre estandarizado
    const handleQuickDownload = async (e, ticket) => {
        e.stopPropagation();
        setDownloadingId(ticket.id);
        try {
            const blob = await pdf(<PDFDocument data={ticket} />).toBlob();
            const fileName = getTicketPdfFileName(ticket);

            // Descargar mediante Blob URL
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            if (onShowToast) {
                onShowToast(`Descargando ${fileName}`, 'success');
            }
        } catch (err) {
            console.error('Error al generar PDF individual:', err);
            if (onShowToast) {
                onShowToast('Error al generar el PDF.', 'error');
            }
        } finally {
            setDownloadingId(null);
        }
    };

    // Envío rápido por correo al correo registrado en el ticket
    const handleQuickEmail = async (e, ticket) => {
        e.stopPropagation();
        if (!ticket.customerEmail || !ticket.customerEmail.trim()) {
            if (onShowToast) {
                onShowToast(`El ticket #${ticket.id.slice(-6)} no tiene correo registrado. Usa la opción masiva para ingresar uno manualmente.`, 'error');
            }
            return;
        }

        setSendingEmailId(ticket.id);
        try {
            const blob = await pdf(<PDFDocument data={ticket} />).toBlob();
            const pdfUrl = await uploadPDF(blob, ticket.id);
            await sendTicketEmail(ticket, pdfUrl);

            setSentEmailSuccessId(ticket.id);
            setTimeout(() => setSentEmailSuccessId(null), 3000);

            if (onShowToast) {
                onShowToast(`Dictamen enviado con éxito a ${ticket.customerEmail}`, 'success');
            }
        } catch (err) {
            console.error('Error al enviar correo:', err);
            if (onShowToast) {
                onShowToast('Error al enviar correo vía EmailJS.', 'error');
            }
        } finally {
            setSendingEmailId(null);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left w-10">
                            <input
                                type="checkbox"
                                checked={allVisibleSelected && tickets.length > 0}
                                onChange={(e) => onSelectAll(e.target.checked)}
                                title="Seleccionar todos los visibles"
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipo / Modelo</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Serie</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {tickets.map((ticket) => {
                        const isSelected = selectedIds.includes(ticket.id);
                        const isDownloading = downloadingId === ticket.id;
                        const isSendingEmail = sendingEmailId === ticket.id;
                        const isEmailSuccess = sentEmailSuccessId === ticket.id;

                        return (
                            <tr
                                key={ticket.id}
                                className={`transition-colors cursor-pointer ${
                                    isSelected ? 'bg-blue-50/70 hover:bg-blue-100/60' : 'hover:bg-slate-50'
                                }`}
                                onClick={() => onToggleSelect(ticket.id)}
                            >
                                {/* Checkbox */}
                                <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleSelect(ticket.id)}
                                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                    />
                                </td>

                                {/* ID */}
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                    #{ticket.id ? ticket.id.slice(-6).toUpperCase() : '---'}
                                </td>

                                {/* Cliente */}
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-slate-900">{ticket.customerName || ticket.customer || 'Sin Nombre'}</div>
                                    {(ticket.customerCompany || ticket.company) && (
                                        <div className="text-xs text-slate-500">{ticket.customerCompany || ticket.company}</div>
                                    )}
                                </td>

                                {/* Equipo */}
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                                    {ticket.deviceModel || ticket.device || 'Dispositivo'}
                                </td>

                                {/* Serie */}
                                <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                                    {ticket.deviceSerial || 'S/N'}
                                </td>

                                {/* Fecha */}
                                <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                                    {ticket.date}
                                </td>

                                {/* Estado */}
                                <td className="px-4 py-4 whitespace-nowrap">
                                    {getStatusBadge(ticket.status)}
                                </td>

                                {/* Acciones Rápidas */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1.5">
                                        {/* Botón Ver */}
                                        <Link
                                            to={`/ticket/${ticket.id}`}
                                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center text-xs gap-1 font-medium"
                                            title="Ver Detalle del Reporte"
                                        >
                                            <Eye size={15} />
                                            <span className="hidden sm:inline">Ver</span>
                                        </Link>

                                        {/* Botón Descarga Rápida Individual */}
                                        <button
                                            onClick={(e) => handleQuickDownload(e, ticket)}
                                            disabled={isDownloading}
                                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center text-xs gap-1 font-medium disabled:opacity-50"
                                            title="Descargar PDF Directo (con nombre descriptivo)"
                                        >
                                            {isDownloading ? (
                                                <Loader2 size={15} className="animate-spin text-indigo-600" />
                                            ) : (
                                                <Download size={15} />
                                            )}
                                            <span className="hidden sm:inline">PDF</span>
                                        </button>

                                        {/* Botón Envío Rápido por Correo */}
                                        <button
                                            onClick={(e) => handleQuickEmail(e, ticket)}
                                            disabled={isSendingEmail}
                                            className={`p-1.5 rounded-lg transition-colors inline-flex items-center text-xs gap-1 font-medium disabled:opacity-50 ${
                                                isEmailSuccess
                                                    ? 'text-green-600 bg-green-50'
                                                    : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                                            }`}
                                            title={
                                                ticket.customerEmail
                                                    ? `Enviar dictamen a ${ticket.customerEmail}`
                                                    : 'Sin correo registrado (Usa selección masiva para enviar)'
                                            }
                                        >
                                            {isSendingEmail ? (
                                                <Loader2 size={15} className="animate-spin text-emerald-600" />
                                            ) : isEmailSuccess ? (
                                                <CheckCircle size={15} className="text-green-600" />
                                            ) : (
                                                <Mail size={15} />
                                            )}
                                            <span className="hidden sm:inline">
                                                {isEmailSuccess ? 'Enviado' : 'Correo'}
                                            </span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default TicketList;
