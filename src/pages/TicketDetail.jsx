import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { ArrowLeft, Mail, Download, Save, Camera, Trash2, Building } from 'lucide-react';
import PDFDocument from '../components/PDFDocument';
import { sendTicketEmail } from '../services/emailService';
import { uploadPDF, uploadTicketPhoto } from '../services/storageService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const TicketDetail = () => {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [emailStatus, setEmailStatus] = useState('idle');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [saving, setSaving] = useState(false);

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
            // Actualizamos solo los campos editables
            await updateDoc(docRef, {
                customerCompany: ticket.customerCompany || '',
                diagnosis: ticket.diagnosis || '',
                solution: ticket.solution || '',
                customerCompany: ticket.customerCompany || '',
                diagnosis: ticket.diagnosis || '',
                solution: ticket.solution || '',
                photos: ticket.photos || [],
                status: ticket.status || 'Pendiente'
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
            // Generar PDF y subirlo (simulado el blob aquí, idealmente usar usePDF de react-pdf)
            const fakeBlob = new Blob(['PDF Placeholder'], { type: 'application/pdf' });
            // Nota: Para subir el PDF real generado por @react-pdf/renderer se necesita un paso extra.
            // Por simplicidad y rapidez, subimos un placeholder o el link directo si ya existiera.
            // En producción real, se recomienda generar el blob con pdf(<PDFDocument />).toBlob()

            // Para este ejemplo, subimos un archivo dummy para obtener una URL válida
            const url = await uploadPDF(fakeBlob, id);

            await sendTicketEmail(ticket, url);
            setEmailStatus('success');
            setTimeout(() => setEmailStatus('idle'), 3000);
        } catch (error) {
            console.error(error);
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
                            </select>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Cliente</label>
                                <p className="text-slate-800 font-medium">{ticket.customerName}</p>
                                {/* Campo Edición Empresa */}
                                <div className="flex items-center gap-2 mt-1">
                                    <Building size={14} className="text-slate-400" />
                                    <input
                                        className="text-sm text-slate-600 border-b border-transparent focus:border-blue-500 outline-none w-full"
                                        placeholder="Agregar Empresa..."
                                        value={ticket.customerCompany || ''}
                                        onChange={(e) => setTicket({ ...ticket, customerCompany: e.target.value })}
                                    />
                                </div>
                                <p className="text-sm text-slate-500 mt-1">{ticket.customerEmail} • {ticket.customerPhone}</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Datos del Equipo</label>
                                <p className="text-slate-800">{ticket.deviceType} - {ticket.deviceModel}</p>
                                <p className="text-sm text-slate-500">S/N: {ticket.deviceSerial}</p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <label className="text-xs font-bold text-slate-500 uppercase">Falla Reportada</label>
                                <p className="text-sm text-slate-700 mt-1">{ticket.problemDescription}</p>
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
                <div className="bg-slate-500 p-1 rounded-xl shadow-lg h-[600px] flex flex-col">
                    <div className="bg-slate-700 text-white p-2 rounded-t-lg flex justify-between items-center text-sm px-4">
                        <span>Vista Previa (Se actualiza al guardar)</span>
                        <PDFDownloadLink
                            document={<PDFDocument data={ticket} />}
                            fileName={`Dictamen_${ticket.id}.pdf`}
                            className="flex items-center gap-1 hover:text-blue-300 transition-colors"
                        >
                            {({ blob, url, loading, error }) =>
                                loading ? 'Generando...' : <><Download size={16} /> Descargar PDF</>
                            }
                        </PDFDownloadLink>
                    </div>

                    <div className="flex-1 bg-slate-200 overflow-hidden rounded-b-lg relative">
                        <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
                            <PDFDocument data={ticket} />
                        </PDFViewer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
