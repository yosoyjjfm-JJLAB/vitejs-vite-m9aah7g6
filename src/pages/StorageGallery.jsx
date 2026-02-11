import React, { useState } from 'react';
import { Search, Calendar, FileText, Image as ImageIcon, Download, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

const StorageGallery = () => {
    // Estado para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // Datos simulados (mock) que en realidad vendrían de Firestore
    const mockFiles = [
        { id: '1', date: '2023-10-25', customer: 'Juan Pérez', company: 'Tech Solutions', device: 'Laptop Dell', photos: 2 },
        { id: '2', date: '2023-10-26', customer: 'María López', company: '', device: 'iPhone 13', photos: 0 },
        { id: '3', date: '2023-10-24', customer: 'Carlos Ruiz', company: 'Hotel Las Palmas', device: 'Smart TV', photos: 5 },
        { id: '4', date: '2023-11-01', customer: 'Ana García', company: 'Tech Solutions', device: 'Tablet Samsung', photos: 1 },
    ];

    // Lógica de filtrado
    const filteredFiles = mockFiles.filter(file => {
        const matchesSearch =
            file.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.device.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDate = dateFilter ? file.date === dateFilter : true;

        return matchesSearch && matchesDate;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Galería de Archivos</h1>
                    <p className="text-slate-500">Historial de reportes y evidencia fotográfica</p>
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por Cliente, Empresa o Equipo..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="date"
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                </div>
                {(searchTerm || dateFilter) && (
                    <button
                        onClick={() => { setSearchTerm(''); setDateFilter(''); }}
                        className="text-sm text-red-500 hover:text-red-700 px-2"
                    >
                        Limpiar Filtros
                    </button>
                )}
            </div>

            {/* Grid de Archivos */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente / Empresa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Equipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Evidencia</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredFiles.map((file) => (
                            <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{file.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-slate-900">{file.customer}</div>
                                    {file.company && <div className="text-xs text-blue-600 flex items-center gap-1"><Building size={10} /> {file.company}</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{file.device}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {file.photos > 0 ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            <ImageIcon size={12} className="mr-1" /> {file.photos} Fotos
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400">Sin fotos</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-3">
                                        <Link to={`/ticket/${file.id}`} className="text-slate-600 hover:text-blue-600 flex items-center gap-1" title="Ver Detalles">
                                            <FileText size={16} /> <span className="hidden md:inline">Ver</span>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredFiles.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        No se encontraron archivos con esos filtros.
                    </div>
                )}
            </div>
        </div>
    );
};

export default StorageGallery;
