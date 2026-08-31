import React, { useState, useEffect } from 'react';
import { Mail, X, CheckCircle, AlertCircle, Loader2, FileText, Layers, Send } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import PDFDocument from './PDFDocument';
import CombinedPDFDocument from './CombinedPDFDocument';
import { uploadFile, uploadPDF } from '../services/storageService';
import { sendTicketEmail, sendBulkTicketEmail } from '../services/emailService';
import { getTicketPdfFileName } from '../services/formatService';

const BulkEmailModal = ({ isOpen, onClose, selectedTickets = [], onSendSuccess }) => {
    const [recipientEmail, setRecipientEmail] = useState('');
    const [ccEmails, setCcEmails] = useState('');
    const [sendMode, setSendMode] = useState('unified_pdf'); // 'unified_pdf' | 'separate_emails'
    const [status, setStatus] = useState('idle'); // 'idle' | 'processing' | 'success' | 'error'
    const [progressMessage, setProgressMessage] = useState('');
    const [progressPercent, setProgressPercent] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const total = selectedTickets.length;

    // Sugerir el correo del cliente al abrir
    useEffect(() => {
        if (isOpen && selectedTickets.length > 0) {
            const firstEmail = selectedTickets.find(t => t.customerEmail)?.customerEmail || '';
            const firstCc = selectedTickets.find(t => t.ccEmails)?.ccEmails || '';
            setRecipientEmail(firstEmail);
            setCcEmails(firstCc);
            setSendMode(total === 1 ? 'unified_pdf' : 'unified_pdf');
            setStatus('idle');
            setProgressMessage('');
            setProgressPercent(0);
            setErrorMessage('');
        }
    }, [isOpen, selectedTickets, total]);

    if (!isOpen || selectedTickets.length === 0) return null;

    const customerName = selectedTickets[0]?.customerName || selectedTickets[0]?.customer || 'Cliente';

    const handleSend = async (e) => {
        e.preventDefault();
        if (!recipientEmail.trim()) {
            setErrorMessage('Por favor ingresa al menos un correo destinatario.');
            return;
        }

        setStatus('processing');
        setErrorMessage('');
        setProgressPercent(5);

        try {
            if (total === 1) {
                // CASO 1 EQUIPO: Generar PDF individual y enviar correo directo con enlace limpio
                const ticket = selectedTickets[0];
                setProgressMessage(`Generando dictamen de ${ticket.deviceModel || ticket.device || 'Equipo'}...`);
                setProgressPercent(30);

                const blob = await pdf(<PDFDocument data={ticket} />).toBlob();
                const fileName = getTicketPdfFileName(ticket);
                const path = `dictamenes/${Date.now()}_${fileName}`;

                setProgressMessage('Subiendo PDF a almacenamiento...');
                setProgressPercent(65);

                const pdfUrl = await uploadFile(blob, path, 'application/pdf');

                setProgressMessage(`Enviando correo a ${recipientEmail}...`);
                setProgressPercent(85);

                await sendTicketEmail(ticket, pdfUrl, {
                    recipientEmail: recipientEmail.trim(),
                    ccEmails: ccEmails.trim(),
                    deviceModel: ticket.deviceModel || ticket.device || 'Equipo',
                    serviceType: ticket.serviceType || 'Servicio Técnico'
                });

                setProgressPercent(100);
                setStatus('success');
                setTimeout(() => {
                    if (onSendSuccess) onSendSuccess(`Dictamen enviado con éxito a ${recipientEmail}`);
                    onClose();
                }, 1800);

            } else if (sendMode === 'unified_pdf') {
                // CASO MÚLTIPLES EQUIPOS (MODALIDAD: 1 SOLO CORREO CON PDF UNIFICADO)
                setProgressMessage(`Consolidando ${total} dictámenes en un solo PDF...`);
                setProgressPercent(30);

                const blob = await pdf(<CombinedPDFDocument tickets={selectedTickets} />).toBlob();
                const timestamp = Date.now();
                const path = `dictamenes/dictamen_unificado_${timestamp}.pdf`;

                setProgressMessage('Subiendo PDF unificado...');
                setProgressPercent(70);

                const pdfUrl = await uploadFile(blob, path, 'application/pdf');

                setProgressMessage(`Enviando correo a ${recipientEmail}...`);
                setProgressPercent(90);

                const deviceSummary = `Lote de ${total} equipos (${selectedTickets.slice(0, 3).map(t => t.deviceModel || t.device || 'Equipo').join(', ')}${total > 3 ? '...' : ''})`;

                await sendBulkTicketEmail({
                    recipientEmail: recipientEmail.trim(),
                    customerName: customerName,
                    deviceSummary: deviceSummary,
                    serviceType: `Dictamen Técnico Consolidado (${total} equipos)`,
                    pdfLink: pdfUrl, // URL limpia directa para el botón del correo
                    ccEmails: ccEmails.trim()
                });

                setProgressPercent(100);
                setStatus('success');
                setTimeout(() => {
                    if (onSendSuccess) onSendSuccess(`Dictamen unificado de los ${total} equipos enviado a ${recipientEmail}`);
                    onClose();
                }, 1800);

            } else if (sendMode === 'separate_emails') {
                // CASO MÚLTIPLES EQUIPOS (MODALIDAD: CORREOS INDIVIDUALES SEPARADOS)
                for (let i = 0; i < total; i++) {
                    const ticket = selectedTickets[i];
                    const percent = 10 + Math.round(((i + 1) / total) * 85);
                    setProgressPercent(percent);
                    setProgressMessage(`Enviando dictamen ${i + 1} de ${total} (${ticket.deviceModel || ticket.device || 'Equipo'})...`);

                    const blob = await pdf(<PDFDocument data={ticket} />).toBlob();
                    const fileName = getTicketPdfFileName(ticket);
                    const path = `dictamenes/${Date.now()}_${fileName}`;
                    const pdfUrl = await uploadFile(blob, path, 'application/pdf');

                    await sendTicketEmail(ticket, pdfUrl, {
                        recipientEmail: recipientEmail.trim(),
                        ccEmails: ccEmails.trim(),
                        deviceModel: ticket.deviceModel || ticket.device || 'Equipo',
                        serviceType: ticket.serviceType || 'Servicio Técnico'
                    });
                }

                setProgressPercent(100);
                setStatus('success');
                setTimeout(() => {
                    if (onSendSuccess) onSendSuccess(`Se enviaron ${total} correos individuales a ${recipientEmail}`);
                    onClose();
                }, 1800);
            }
        } catch (error) {
            console.error('Error en envío por correo:', error);
            setStatus('error');
            setErrorMessage('Hubo un problema al generar o enviar el correo. Verifica tu conexión y configuración.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-white">
                                {total === 1 ? 'Enviar Dictamen por Correo' : 'Enviar Dictámenes en Lote'}
                            </h3>
                            <p className="text-xs text-slate-300">
                                {total} {total === 1 ? 'equipo seleccionado' : 'equipos seleccionados'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={status === 'processing'}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSend} className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700 text-sm">
                    {/* Lista resumida de equipos seleccionados */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                {total === 1 ? 'Equipo a despachar' : `Equipos a despachar (${total})`}
                            </span>
                            <span className="text-xs text-blue-600 font-medium">
                                Cliente: {customerName}
                            </span>
                        </div>
                        <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs text-slate-600">
                            {selectedTickets.map((t, idx) => (
                                <div key={t.id || idx} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-none">
                                    <span className="font-medium text-slate-800">
                                        • {t.deviceModel || t.device || 'Equipo'}
                                    </span>
                                    <span className="text-slate-500 font-mono">
                                        SN: {t.deviceSerial || 'S/N'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inputs de Correo */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Correo(s) Destinatario(s) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                disabled={status === 'processing'}
                                placeholder="ej. cliente@empresa.com, direccion@empresa.com"
                                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-100"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                                Puedes ingresar uno o varios correos separados por coma.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Correos en Copia (CC - Opcional)
                            </label>
                            <input
                                type="text"
                                disabled={status === 'processing'}
                                placeholder="ej. contabilidad@empresa.com, supervisor@empresa.com"
                                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-slate-100"
                                value={ccEmails}
                                onChange={(e) => setCcEmails(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Selección de Modalidad de Envío (solo si hay más de 1 equipo) */}
                    {total > 1 && (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">
                                Modalidad de Entrega para {total} Equipos
                            </label>
                            <div className="space-y-2">
                                {/* Opción 1: 1 PDF Unificado (Recomendado) */}
                                <label
                                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                        sendMode === 'unified_pdf'
                                            ? 'border-blue-500 bg-blue-50/50'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="sendMode"
                                        value="unified_pdf"
                                        checked={sendMode === 'unified_pdf'}
                                        disabled={status === 'processing'}
                                        onChange={(e) => setSendMode(e.target.value)}
                                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                            <FileText size={15} className="text-blue-600" />
                                            1 Solo Correo con PDF Unificado Consolidado (Recomendado)
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Genera un único documento PDF con todos los dictámenes y envía el enlace directo al botón del correo.
                                        </p>
                                    </div>
                                </label>

                                {/* Opción 2: Correos separados */}
                                <label
                                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                        sendMode === 'separate_emails'
                                            ? 'border-blue-500 bg-blue-50/50'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="sendMode"
                                        value="separate_emails"
                                        checked={sendMode === 'separate_emails'}
                                        disabled={status === 'processing'}
                                        onChange={(e) => setSendMode(e.target.value)}
                                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                            <Mail size={15} className="text-slate-600" />
                                            Correos individuales separados ({total} correos)
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Envía un correo independiente para cada equipo hacia el destinatario especificado.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Mensaje de error si falla */}
                    {errorMessage && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Estado de Progreso en Vivo */}
                    {status === 'processing' && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold text-blue-900">
                                <span className="flex items-center gap-2">
                                    <Loader2 size={14} className="animate-spin text-blue-600" />
                                    {progressMessage}
                                </span>
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Confirmación de Éxito */}
                    {status === 'success' && (
                        <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2.5 text-green-800 text-sm font-medium">
                            <CheckCircle size={18} className="text-green-600 shrink-0" />
                            <span>¡Envío completado exitosamente! Cerrando ventana...</span>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex justify-end items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={status === 'processing'}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-xs transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'processing' || status === 'success'}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'processing' ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Procesando envío...
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Enviar {total === 1 ? 'Dictamen' : 'Dictámenes'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkEmailModal;
