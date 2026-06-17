import React, { useState } from 'react';
import { Save, User, Smartphone, AlertTriangle, Search, Building, Camera } from 'lucide-react';
import { searchCustomers } from '../services/customerService';
import { analyzeDevicePhoto, resizeImage } from '../services/aiService';

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

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scannedPhotoFile, setScannedPhotoFile] = useState(null);
    const [scannedPhotoPreview, setScannedPhotoPreview] = useState('');

    const handleAiScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsAnalyzing(true);
        try {
            console.log("[AI Scan] Comprimiendo imagen del equipo...");
            const compressed = await resizeImage(file, 600, 600);
            
            setScannedPhotoFile(compressed);
            setScannedPhotoPreview(URL.createObjectURL(compressed));

            console.log("[AI Scan] Iniciando análisis de foto del equipo...");
            const result = await analyzeDevicePhoto(compressed);
            console.log("[AI Scan] Resultado obtenido:", result);

            // Auto-rellenar campos obtenidos (incluyendo activo fijo en contraseña/patrón)
            setFormData(prev => ({
                ...prev,
                deviceType: result.deviceType || prev.deviceType,
                deviceModel: result.deviceModel || prev.deviceModel,
                deviceSerial: result.deviceSerial || prev.deviceSerial,
                accessPassword: result.accessPassword || prev.accessPassword,
                problemDescription: result.problemDescription 
                    ? (prev.problemDescription ? `${prev.problemDescription}\n${result.problemDescription}` : result.problemDescription)
                    : prev.problemDescription
            }));

            alert(`Escaneo completado. Se identificó: ${result.deviceModel || 'Dispositivo desconocido'}`);
        } catch (error) {
            console.error("[AI Scan] Error al escanear equipo:", error);
            alert("No se pudo analizar la imagen. Intenta con otra foto o completa los campos manualmente.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData, scannedPhotoFile);
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

                {/* Escáner de Equipo con IA */}
                <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-bold text-slate-700">Autocompletar Ingreso con Foto</h4>
                            <p className="text-xs text-slate-500">Sube una foto del equipo o de su etiqueta/S/N para extraer la marca, modelo y serie usando IA.</p>
                        </div>
                        <label className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all shadow-sm ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Camera size={18} />
                            {isAnalyzing ? 'Analizando con IA...' : 'Subir Foto / Escanear'}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAiScan}
                                disabled={isAnalyzing}
                            />
                        </label>
                    </div>
                    {isAnalyzing && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-indigo-600 font-medium animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
                            Procesando imagen y extrayendo textos...
                        </div>
                    )}
                    {scannedPhotoPreview && (
                        <div className="mt-4 flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-100 shadow-sm max-w-md animate-fade-in">
                            <img
                                src={scannedPhotoPreview}
                                alt="Vista previa del equipo"
                                className="h-14 w-14 object-cover rounded-lg border border-slate-200"
                            />
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-slate-700">Foto del equipo cargada</p>
                                <p className="text-[10px] text-slate-400">Esta imagen se guardará automáticamente en el reporte del ticket al registrarlo.</p>
                            </div>
                        </div>
                    )}
                </div>

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
