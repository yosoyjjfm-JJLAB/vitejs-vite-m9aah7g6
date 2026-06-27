import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PDFDownloadLink, PDFViewer, pdf } from '@react-pdf/renderer';
import { ArrowLeft, Mail, Download, Save, Camera, Trash2, Building } from 'lucide-react';
import PDFDocument from '../components/PDFDocument';
import { sendTicketEmail } from '../services/emailService';
import { uploadPDF, uploadTicketPhoto } from '../services/storageService';
import { estimateLifespan } from '../services/aiService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const TicketDetail = () => {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [emailStatus, setEmailStatus] = useState('idle');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [saving, setSaving] = useState(false);
    const [estimating, setEstimating] = useState(false);
    const [debouncedTicket, setDebouncedTicket] = useState(null);

    // Debounce ticket data for "Live" PDF preview
    useEffect(() => {
        if (!ticket) return;
        const timer = setTimeout(() => {
            setDebouncedTicket(ticket);
        }, 800); // 800ms debounce
        return () => clearTimeout(timer);
    }, [ticket]);

    // Cargar datos reales de Firestore
    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const docRef = doc(db, "tickets", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setTicket({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.error("No such document!");
                }
            } catch (error) {
                console.error("Error fetching ticket:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [id]);

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, "tickets", id);
            // Actualizamos todos los campos editables
            await updateDoc(docRef, {
                customerName: ticket.customerName || '',
                customerCompany: ticket.customerCompany || '',
                customerPuesto: ticket.customerPuesto || '',
                customerEmail: ticket.customerEmail || '',
                customerPhone: ticket.customerPhone || '',
                deviceType: ticket.deviceType || 'Laptop',
                deviceModel: ticket.deviceModel || '',
                deviceSerial: ticket.deviceSerial || '',
                accessPassword: ticket.accessPassword || '',
                problemDescription: ticket.problemDescription || '',
                diagnosis: ticket.diagnosis || '',
                solution: ticket.solution || '',
                photos: ticket.photos || [],
                status: ticket.status || 'Pendiente',
                estimatedLife: ticket.estimatedLife || '',
                serviceType: ticket.serviceType || 'Mantenimiento Correctivo',
                ccEmails: ticket.ccEmails || '',
                showSignature: ticket.showSignature || false,
                technicianName: ticket.technicianName || 'José Juan Flores Martinez',
                technicianRole: ticket.technicianRole || 'Tecnico emisor'
            });
            alert('Cambios guardados correctamente');
        } catch (error) {
            console.error("Error updating ticket:", error);
            alert("Error al guardar cambios");
        } finally {
            setSaving(false);
        }
    };

    const handleSendEmail = async () => {
        setEmailStatus('sending');
        try {
            // Generar el BLOB real del PDF usando @react-pdf
            const blob = await pdf(<PDFDocument data={ticket} />).toBlob();

            // Subir el PDF real a Firebase Storage
            const url = await uploadPDF(blob, id);

            await sendTicketEmail(ticket, url);
            setEmailStatus('success');
            setTimeout(() => setEmailStatus('idle'), 3000);
        } catch (error) {
            console.error("Error al generar/enviar PDF:", error);
            setEmailStatus('error');
        }
    };

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingPhoto(true);
        try {
            const newPhotos = [];
            for (const file of files) {
                const url = await uploadTicketPhoto(file, id);
                newPhotos.push(url);
            }

            const updatedPhotos = [...(ticket.photos || []), ...newPhotos];

            // Actualizar estado local
            setTicket(prev => ({
                ...prev,
                photos: updatedPhotos
            }));

            // Guardar automáticamente en Firestore al subir foto
            const docRef = doc(db, "tickets", id);
            await updateDoc(docRef, { photos: updatedPhotos });

        } catch (error) {
            console.error("Error upload:", error);
            alert("Error al subir imagen");
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleEstimateLife = async () => {
        if (!ticket.photos || ticket.photos.length === 0) {
            alert("Sube al menos una foto para que la IA pueda analizar el equipo.");
            return;
        }

        setEstimating(true);
        try {
            // Tomamos la primera foto para el análisis (por simplicidad)
            // Nota: En un entorno real, tendríamos que pasar el File object o descargar la imagen.
            // Como las fotos son URLs de Firebase, necesitamos obtener el Blob primero.
            const response = await fetch(ticket.photos[0]);
            const blob = await response.blob();
            const file = new File([blob], "evidence.jpg", { type: blob.type });

            const estimation = await estimateLifespan(file, `${ticket.deviceType} ${ticket.deviceModel}`, ticket.problemDescription);

            setTicket(prev => ({
                ...prev,
                estimatedLife: estimation
            }));
        } catch (error) {
            console.error("Error estimando vida útil:", error);
            alert("No se pudo conectar con la IA. Verifica tu conexión o la API Key.");
        } finally {
            setEstimating(false);
        }
    };

    const removePhoto = async (indexToRemove) => {
        const updatedPhotos = ticket.photos.filter((_, index) => index !== indexToRemove);

        setTicket(prev => ({
            ...prev,
            photos: updatedPhotos
        }));

        // Actualizar en Firestore
        try {
            const docRef = doc(db, "tickets", id);
            await updateDoc(docRef, { photos: updatedPhotos });
        } catch (error) {
            console.error("Error deleting photo ref:", error);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando detalles del ticket...</div>;
    if (!ticket) return <div className="p-8 text-center text-red-500">Ticket no encontrado.</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Volver al Dashboard
                </Link>
                <div className="flex gap-2">
                    <button
                        onClick={handleSendEmail}
                        disabled={emailStatus === 'sending'}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        {emailStatus === 'sending' ? 'Enviando...' : emailStatus === 'success' ? 'Enviado!' : <><Mail size={18} /> Enviar PDF por Correo</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Izquierda: Información Editable */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Detalles del Servicio</h2>
                                <p className="text-sm text-slate-400">ID: {ticket.id}</p>
                                {/* Selector Tipo de Servicio */}
                                <select
                                    className="mt-1 text-xs font-semibold bg-blue-50 text-blue-700 border-none rounded focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer p-1"
                                    value={ticket.serviceType || 'Mantenimiento Correctivo'}
                                    onChange={(e) => setTicket({ ...ticket, serviceType: e.target.value })}
                                >
                                    <option value="Mantenimiento Correctivo">Mantenimiento Correctivo</option>
                                    <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
                                    <option value="Diagnóstico General">Diagnóstico General</option>
                                    <option value="Dictamen">Dictamen</option>
                                </select>
                            </div>
                            <select
                                className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border-none focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
                                value={ticket.status}
                                onChange={(e) => setTicket({ ...ticket, status: e.target.value })}
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Diagnóstico">Diagnóstico</option>
                                <option value="En Reparación">En Reparación</option>
                                <option value="Listo">Listo</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="Entregado">Entregado</option>
                                <option value="Baja">Baja</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Datos del Cliente</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Nombre Completo</label>
                                        <input
                                            className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-blue-500 outline-none"
                                            value={ticket.customerName || ''}
                                            onChange={(e) => setTicket({ ...ticket, customerName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Empresa</label>
                                        <input
                                            className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-blue-500 outline-none"
                                            placeholder="Agregar Empresa..."
                                            value={ticket.customerCompany || ''}
                                            onChange={(e) => setTicket({ ...ticket, customerCompany: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Puesto</label>
                                        <input
                                            className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-blue-500 outline-none"
                                            placeholder="Ej. Gerente de TI"
                                            value={ticket.customerPuesto || ''}
                                            onChange={(e) => setTicket({ ...ticket, customerPuesto: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Email</label>
                                        <input
                                            className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-blue-500 outline-none"
                                            value={ticket.customerEmail || ''}
                                            onChange={(e) => setTicket({ ...ticket, customerEmail: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Teléfono</label>
                                        <input
                                            className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-blue-500 outline-none"
                                            value={ticket.customerPhone || ''}
                                            onChange={(e) => setTicket({ ...ticket, customerPhone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">CC Correos (separados por comas)</label>
                                        <input
                                            className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-blue-500 outline-none"
                                            placeholder="jefe@empresa.com, socio@empresa.com"
                                            value={ticket.ccEmails || ''}
                                            onChange={(e) => setTicket({ ...ticket, ccEmails: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Datos del Equipo</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Tipo de Dispositivo</label>
                                        <select
                                            className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-blue-500 outline-none"
                                            value={ticket.deviceType || 'Laptop'}
                                            onChange={(e) => setTicket({ ...ticket, deviceType: e.target.value })}
                                        >
                                            <option value="Laptop">Laptop</option>
                                            <option value="Smartphone">Smartphone/Tablet</option>
                                            <option value="Cámara">Cámara/Objetivo</option>
                                            <option value="SmartTV">Smart TV</option>
                                            <option value="Consola">Consola de Videojuegos</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Marca / Modelo</label>
                                        <input
                                            className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-blue-500 outline-none"
                                            value={ticket.deviceModel || ''}
                                            onChange={(e) => setTicket({ ...ticket, deviceModel: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Número de Serie</label>
                                        <input
                                            className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-blue-500 outline-none"
                                            placeholder="S/N..."
                                            value={ticket.deviceSerial || ''}
                                            onChange={(e) => setTicket({ ...ticket, deviceSerial: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-slate-400 uppercase">Contraseña / Patrón</label>
                                        <input
                                            className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-blue-500 outline-none"
                                            placeholder="Ninguna..."
                                            value={ticket.accessPassword || ''}
                                            onChange={(e) => setTicket({ ...ticket, accessPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Falla Reportada</label>
                                <textarea
                                    className="w-full p-2 border border-slate-300 rounded-md text-sm text-slate-700 bg-white"
                                    rows="3"
                                    value={ticket.problemDescription || ''}
                                    onChange={(e) => setTicket({ ...ticket, problemDescription: e.target.value })}
                                    placeholder="Describe detalladamente la falla reportada..."
                                ></textarea>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Diagnóstico Técnico</label>
                                <textarea
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm"
                                    rows="3"
                                    value={ticket.diagnosis || ''}
                                    onChange={(e) => setTicket({ ...ticket, diagnosis: e.target.value })}
                                ></textarea>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Solución / Reparación</label>
                                <textarea
                                    className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm"
                                    rows="3"
                                    value={ticket.solution || ''}
                                    onChange={(e) => setTicket({ ...ticket, solution: e.target.value })}
                                ></textarea>
                            </div>

                            {/* Nuevo Campo: Vida Útil Estimada */}
                            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                <label className="flex justify-between items-center text-xs font-bold text-indigo-800 uppercase">
                                    <span>Tiempo de Vida Estimado (IA)</span>
                                    <button
                                        onClick={handleEstimateLife}
                                        disabled={estimating}
                                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded flex items-center gap-1 transition-colors"
                                    >
                                        {estimating ? 'Analizando...' : '✨ Calcular con IA'}
                                    </button>
                                </label>
                                <textarea
                                    className="w-full mt-2 p-2 border border-indigo-200 rounded-md text-sm text-slate-700 bg-white"
                                    rows="1"
                                    placeholder="Ej. 2 años si se mantiene el mantenimiento..."
                                    value={ticket.estimatedLife || ''}
                                    onChange={(e) => setTicket({ ...ticket, estimatedLife: e.target.value })}
                                ></textarea>
                            </div>

                            {/* Firma del Técnico */}
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                        checked={ticket.showSignature || false}
                                        onChange={(e) => setTicket({ ...ticket, showSignature: e.target.checked })}
                                    />
                                    <span>Incluir mi Firma en el Dictamen</span>
                                </label>

                                {ticket.showSignature && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Nombre del Técnico</label>
                                            <input
                                                type="text"
                                                className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-indigo-500 outline-none"
                                                value={ticket.technicianName ?? 'José Juan Flores Martinez'}
                                                onChange={(e) => setTicket({ ...ticket, technicianName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Cargo / Puesto</label>
                                            <input
                                                type="text"
                                                className="text-sm text-slate-800 border rounded p-1.5 w-full bg-white border-slate-200 focus:border-indigo-500 outline-none"
                                                value={ticket.technicianRole ?? 'Tecnico emisor'}
                                                onChange={(e) => setTicket({ ...ticket, technicianRole: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* FOTOS */}
                            <div className="pt-4 border-t border-slate-100">
                                <label className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase mb-3">
                                    <span>Evidencia Fotográfica</span>
                                    <label className="cursor-pointer flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                        <Camera size={14} />
                                        <span>Agregar</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                    </label>
                                </label>

                                {uploadingPhoto && <div className="text-xs text-blue-500 mb-2">Subiendo...</div>}

                                <div className="grid grid-cols-4 gap-2">
                                    {ticket.photos && ticket.photos.map((photo, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                                            <img src={photo} alt="Evidencia" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removePhoto(idx)}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!ticket.photos || ticket.photos.length === 0) && (
                                        <div className="col-span-4 text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                            Sin fotos adjuntas
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleSaveChanges}
                                disabled={saving}
                                className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg transition-colors mt-4"
                            >
                                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Vista Previa del PDF */}
                <div className="bg-slate-500 p-1 rounded-xl shadow-lg h-[800px] flex flex-col">
                    <div className="bg-slate-700 text-white p-2 rounded-t-lg flex justify-between items-center text-sm px-4">
                        <span>Vista Previa (Se actualiza automáticamente)</span>
                        <PDFDownloadLink
                            document={<PDFDocument data={debouncedTicket || ticket} />}
                            fileName={`Dictamen_${ticket.id}.pdf`}
                            className="flex items-center gap-1 hover:text-blue-300 transition-colors"
                        >
                            {({ blob, url, loading, error }) =>
                                loading ? 'Generando...' : <><Download size={16} /> Descargar PDF</>
                            }
                        </PDFDownloadLink>
                    </div>

                    <div className="flex-1 bg-slate-200 overflow-hidden rounded-b-lg relative">
                        <PDFViewer key={debouncedTicket ? JSON.stringify(debouncedTicket) : 'initial'} width="100%" height="100%" showToolbar={false} className="border-none">
                            <PDFDocument data={debouncedTicket || ticket} />
                        </PDFViewer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
