import React, { useState } from 'react';
import { RefreshCw, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

const STATUS_OPTIONS = [
    'Pendiente',
    'Diagnóstico',
    'En Reparación',
    'Listo',
    'Finalizado',
    'Entregado',
    'Baja'
];

const BulkStatusModal = ({ isOpen, onClose, selectedTickets = [], onStatusUpdated }) => {
    const [status, setStatus] = useState('Listo');
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen || selectedTickets.length === 0) return null;

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');

        try {
            const batch = writeBatch(db);
            selectedTickets.forEach((ticket) => {
                const ticketRef = doc(db, 'tickets', ticket.id);
                batch.update(ticketRef, { status: status });
            });

            await batch.commit();

            if (onStatusUpdated) {
                onStatusUpdated(status);
            }
            onClose();
        } catch (err) {
            console.error('Error al actualizar estados en lote:', err);
            setError('Error al actualizar los estados en la base de datos.');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                            <RefreshCw size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-white">Cambiar Estado en Lote</h3>
                            <p className="text-xs text-slate-300">
                                {selectedTickets.length} {selectedTickets.length === 1 ? 'equipo seleccionado' : 'equipos seleccionados'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={updating}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleUpdate} className="p-6 space-y-4 text-slate-700 text-sm">
                    <p className="text-xs text-slate-500">
                        Selecciona el nuevo estado que se aplicará a todos los <strong>{selectedTickets.length}</strong> equipos seleccionados:
                    </p>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Nuevo Estado
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            disabled={updating}
                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex justify-end items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={updating}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-xs transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={updating}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            {updating ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    Actualizando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={15} />
                                    Aplicar Cambio
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BulkStatusModal;
