import React, { useState } from 'react';
import { Save, User, Smartphone, AlertTriangle, Search, Building } from 'lucide-react';
import { searchCustomers } from '../services/customerService';

const TicketForm = ({ initialData = {}, onSubmit, isSubmitting }) => {
    const [formData, setFormData] = useState({
        customerName: initialData.customerName || '',
        customerCompany: initialData.customerCompany || '', // Nuevo campo
        customerEmail: initialData.customerEmail || '',
        customerPhone: initialData.customerPhone || '',
        deviceType: initialData.deviceType || 'Laptop',
        deviceModel: initialData.deviceModel || '',
        deviceSerial: initialData.deviceSerial || '',
        problemDescription: initialData.problemDescription || '',
        accessPassword: initialData.accessPassword || '',
        status: initialData.status || 'Pendiente',
        estimatedCost: initialData.estimatedCost || '',
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const performSearch = async () => {
        if (searchTerm.length < 3) return;
        setIsSearching(true);
        try {
            const results = await searchCustomers(searchTerm);
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectCustomer = (customer) => {
        setFormData(prev => ({
            ...prev,
            customerName: customer.name || '',
            customerCompany: customer.company || '', // Auto-rellenar empresa
            customerEmail: customer.email || '',
            customerPhone: customer.phone || ''
        }));
        setSearchResults([]);
        setSearchTerm('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sección Cliente */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative">
                <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                    <User className="mr-2 text-blue-500" size={20} />
                    Datos del Cliente
                </h3>

                {/* Buscador de Clientes */}
                <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                        ¿Cliente Recurrente? Buscar por Teléfono o Email
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Ej. 5551234567 o correo@ejemplo.com"
                            className="flex-1 px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            type="button"
                            onClick={performSearch}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <Search size={18} />
                        </button>
                    </div>
                    {searchResults.length > 0 && (
                        <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg absolute z-10 w-full left-0 max-w-md ml-6">
                            {searchResults.map(customer => (
                                <div
                                    key={customer.id}
                                    onClick={() => selectCustomer(customer)}
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 transition-colors"
                                >
                                    <p className="font-bold text-slate-800">{customer.name}</p>
                                    <p className="text-sm text-slate-500">
                                        {customer.company ? `${customer.company} - ` : ''}
                                        {customer.email}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                        <input
                            required
                            name="customerName"
                            value={formData.customerName}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                            <Building size={14} /> Empresa (Opcional)
                        </label>
                        <input
                            name="customerCompany"
                            value={formData.customerCompany}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. JJLAB S.A. de C.V."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="customerEmail"
                            value={formData.customerEmail}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="cliente@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                        <input
                            name="customerPhone"
                            value={formData.customerPhone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="+52 555..."
                        />
                    </div>
                </div>
            </div>

            {/* Resto del formulario igual... Sección Equipo */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                    <Smartphone className="mr-2 text-blue-500" size={20} />
                    Información del Equipo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Dispositivo</label>
                        <select
                            name="deviceType"
                            value={formData.deviceType}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                        <label className="block text-sm font-medium text-slate-700 mb-1">Marca/Modelo</label>
                        <input
                            required
                            name="deviceModel"
                            value={formData.deviceModel}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ej. iPhone 13 Pro"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Número de Serie (Opcional)</label>
                        <input
                            name="deviceSerial"
                            value={formData.deviceSerial}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="S/N..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña/Patrón</label>
                        <input
                            name="accessPassword"
                            value={formData.accessPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="1234 / Patrón Z"
                        />
                    </div>
                </div>
            </div>

            {/* Sección Falla */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="flex items-center text-lg font-semibold text-slate-800 mb-4 border-b pb-2">
                    <AlertTriangle className="mr-2 text-blue-500" size={20} />
                    Reporte de Falla
                </h3>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del Problema</label>
                    <textarea
                        required
                        name="problemDescription"
                        value={formData.problemDescription}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Describe detalladamente la falla reportada por el cliente..."
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={20} />
                    {isSubmitting ? 'Guardando...' : 'Registrar Equipo'}
                </button>
            </div>
        </form>
    );
};

export default TicketForm;
