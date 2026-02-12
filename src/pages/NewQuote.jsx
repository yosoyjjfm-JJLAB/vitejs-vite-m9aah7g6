import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PDFDownloadLink, PDFViewer, pdf } from '@react-pdf/renderer';
import QuotePDF from '../components/QuotePDF';
import { sendQuoteEmail } from '../services/emailService';
import { suggestItemDetails } from '../services/aiService';
import { uploadPDF, uploadQuoteImage } from '../services/storageService';
import { Plus, Trash2, Wand2, Save, Mail, FileText, Search, Calculator, ArrowLeft, Upload, Loader2 } from 'lucide-react';

const NewQuote = () => {
    const { id } = useParams(); // Get ID from URL if editing
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [generatingAI, setGeneratingAI] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(null);

    // Customer Data
    const [customer, setCustomer] = useState({
        name: '',
        company: '',
        email: '',
        phone: ''
    });

    // Quote Settings
    const [settings, setSettings] = useState({
        taxRate: 16,
        validUntil: '',
        notes: ''
    });

    // Items
    const [items, setItems] = useState([
        { name: '', description: '', quantity: 1, unitPrice: 0, total: 0, image: '', searchUrl: '' }
    ]);

    // Computed Totals
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const taxAmount = subtotal * (settings.taxRate / 100);
    const total = subtotal + taxAmount;

    // Load Data if ID exists
    useEffect(() => {
        if (id) {
            const fetchQuote = async () => {
                setLoading(true);
                try {
                    const docRef = doc(db, "quotes", id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setCustomer({
                            name: data.customerName || '',
                            company: data.customerCompany || '',
                            email: data.customerEmail || '',
                            phone: data.customerPhone || ''
                        });
                        setItems(data.items || []);
                        setSettings({
                            taxRate: (data.taxRate || 0.16) * 100,
                            validUntil: data.validUntil || '',
                            notes: data.notes || ''
                        });
                    } else {
                        alert("No se encontró la cotización");
                        navigate('/cotizaciones');
                    }
                } catch (error) {
                    console.error("Error loading quote:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchQuote();
        }
    }, [id, navigate]);


    // Handlers
    const handleCustomerChange = (e) => {
        setCustomer({ ...customer, [e.target.name]: e.target.value });
    };

    const handleSettingsChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'quantity' || field === 'unitPrice') {
            const qty = parseFloat(field === 'quantity' ? value : newItems[index].quantity) || 0;
            const price = parseFloat(field === 'unitPrice' ? value : newItems[index].unitPrice) || 0;
            newItems[index].total = qty * price;
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { name: '', description: '', quantity: 1, unitPrice: 0, total: 0, image: '', searchUrl: '' }]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleAIAssist = async (index) => {
        const itemName = items[index].name;
        if (!itemName) return alert("Escribe el nombre del producto primero.");

        setGeneratingAI(index);
        try {
            const { description, searchUrl } = await suggestItemDetails(itemName);
            const newItems = [...items];
            newItems[index].description = description;
            newItems[index].searchUrl = searchUrl;
            setItems(newItems);
        } catch (error) {
            console.error("Error AI:", error);
            alert("Error al generar descripción con IA.");
        } finally {
            setGeneratingAI(null);
        }
    };

    const handleImageUpload = async (index, file) => {
        if (!file) return;

        setUploadingImage(index);
        try {
            const imageUrl = await uploadQuoteImage(file);
            const newItems = [...items];
            newItems[index].image = imageUrl;
            setItems(newItems);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error al subir la imagen.");
        } finally {
            setUploadingImage(null);
        }
    };

    const handlePaste = async (index, e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                await handleImageUpload(index, file);
                break;
            }
        }
    };

    const handleSaveQuote = async (sendEmail = false) => {
        if (!customer.name) return alert("El nombre del cliente es obligatorio.");
        if (items.length === 0) return alert("Agrega al menos un ítem.");

        setLoading(true);
        try {
            const quoteData = {
                customerName: customer.name,
                customerCompany: customer.company,
                customerEmail: customer.email,
                customerPhone: customer.phone,
                items: items,
                subtotal: subtotal,
                taxRate: settings.taxRate / 100,
                taxAmount: taxAmount,
                total: total,
                notes: settings.notes,
                validUntil: settings.validUntil,
                status: sendEmail ? 'Enviada' : 'Borrador',
                updatedAt: serverTimestamp()
            };

            if (!id) {
                quoteData.createdAt = serverTimestamp();
            }

            let quoteId = id;

            if (id) {
                // Update existing
                const docRef = doc(db, "quotes", id);
                await updateDoc(docRef, quoteData);
            } else {
                // Create new
                const docRef = await addDoc(collection(db, "quotes"), quoteData);
                quoteId = docRef.id;
            }

            console.log("Cotización guardada ID:", quoteId);

            // Generate & Upload PDF (Always update PDF on save)
            const pdfBlob = await pdf(<QuotePDF data={{ ...quoteData, quoteNumber: quoteId.slice(-6).toUpperCase() }} />).toBlob();
            const pdfUrl = await uploadPDF(pdfBlob, `Q-${quoteId}`);

            if (sendEmail) {
                if (!customer.email) throw new Error("El cliente no tiene email.");
                await sendQuoteEmail({ ...quoteData, id: quoteId, pdfUrl }, pdfUrl);
                alert("Cotización actualizada y enviada.");
            } else {
                alert("Cotización guardada exitosamente.");
            }

            navigate('/cotizaciones');
        } catch (error) {
            console.error("Error:", error);
            alert("Hubo un error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Format Currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    if (loading && id && !customer.name) {
        return <div className="p-8 text-center text-slate-500">Cargando datos de la cotización...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => navigate('/cotizaciones')} className="text-slate-500 hover:text-slate-700">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-bold text-slate-800">
                    {id ? 'Editar Cotización' : 'Nueva Cotización'}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Customer Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <FileText size={20} /> Datos del Cliente
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                name="name"
                                placeholder="Nombre del Cliente *"
                                className="p-2 border rounded-md"
                                value={customer.name}
                                onChange={handleCustomerChange}
                            />
                            <input
                                name="company"
                                placeholder="Empresa"
                                className="p-2 border rounded-md"
                                value={customer.company}
                                onChange={handleCustomerChange}
                            />
                            <input
                                name="email"
                                placeholder="Correo Electrónico"
                                className="p-2 border rounded-md"
                                value={customer.email}
                                onChange={handleCustomerChange}
                            />
                            <input
                                name="phone"
                                placeholder="Teléfono"
                                className="p-2 border rounded-md"
                                value={customer.phone}
                                onChange={handleCustomerChange}
                            />
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                <Calculator size={20} /> Ítems y Productos
                            </h2>
                            <button onClick={addItem} className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 font-medium">
                                <Plus size={16} /> Agregar Ítem
                            </button>
                        </div>

                        <div className="space-y-6">
                            {items.map((item, index) => (
                                <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative">
                                    <button onClick={() => removeItem(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="grid grid-cols-12 gap-3 mb-2">
                                        <div className="col-span-12 md:col-span-5">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Producto / Servicio</label>
                                            <div className="flex gap-2 mt-1">
                                                <input
                                                    placeholder="Ej. Cambio de Pantalla"
                                                    className="w-full p-2 border rounded text-sm"
                                                    value={item.name}
                                                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleAIAssist(index)}
                                                    disabled={generatingAI === index}
                                                    className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition-colors"
                                                    title="Generar Descripción con IA"
                                                >
                                                    {generatingAI === index ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Wand2 size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Cant.</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full mt-1 p-2 border rounded text-sm"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Precio Unit.</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full mt-1 p-2 border rounded text-sm"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-3">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Total</label>
                                            <div className="mt-1 p-2 bg-slate-200 rounded text-sm font-bold text-right text-slate-700">
                                                {formatCurrency(item.total)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description & Image Row */}
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-12 md:col-span-8">
                                            <input
                                                placeholder="Descripción (Generada por IA o manual)"
                                                className="w-full p-2 border rounded text-sm text-slate-600 bg-white"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            />
                                            {item.searchUrl && (
                                                <a href={item.searchUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                                                    <Search size={10} /> Ver en Google para más detalles o imágenes
                                                </a>
                                            )}
                                        </div>
                                        <div className="col-span-12 md:col-span-4">
                                            <div className="flex gap-2">
                                                <input
                                                    placeholder="URL de Imagen (Miniatura)"
                                                    className="w-full p-2 border rounded text-xs text-slate-500"
                                                    value={item.image}
                                                    onChange={(e) => handleItemChange(index, 'image', e.target.value)}
                                                    onPaste={(e) => handlePaste(index, e)}
                                                />
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        id={`file-upload-${index}`}
                                                        onChange={(e) => handleImageUpload(index, e.target.files[0])}
                                                    />
                                                    <label
                                                        htmlFor={`file-upload-${index}`}
                                                        className={`flex items-center justify-center p-2 rounded cursor-pointer transition-colors ${uploadingImage === index ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                                    >
                                                        {uploadingImage === index ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Upload size={16} />
                                                        )}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Settings & Notes */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-700 mb-4">Configuración y Notas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">IVA (%)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    value={settings.taxRate}
                                    onChange={handleSettingsChange}
                                    name="taxRate"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Válido Hasta</label>
                                <input
                                    type="text"
                                    placeholder="Ej. 15 días hábiles"
                                    className="w-full p-2 border rounded"
                                    value={settings.validUntil}
                                    onChange={handleSettingsChange}
                                    name="validUntil"
                                />
                            </div>
                        </div>
                        <textarea
                            className="w-full p-2 border rounded h-24 text-sm"
                            placeholder="Términos, condiciones y notas adicionales..."
                            value={settings.notes}
                            onChange={handleSettingsChange}
                            name="notes"
                        ></textarea>
                    </div>

                </div>

                {/* Right Column: Summary & Actions */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 sticky top-24">
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Resumen</h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>IVA ({settings.taxRate}%)</span>
                                <span>{formatCurrency(taxAmount)}</span>
                            </div>
                            <div className="flex justify-between text-slate-900 font-bold text-lg pt-4 border-t">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>


                        <div className="space-y-3">
                            <button
                                onClick={() => handleSaveQuote(false)}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-lg hover:bg-slate-900 transition-colors"
                            >
                                <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Solo'}
                            </button>
                            <button
                                onClick={() => handleSaveQuote(true)}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Mail size={18} /> {loading ? 'Procesando...' : 'Guardar y Enviar Email'}
                            </button>

                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-slate-700 mb-2">Vista Previa</h3>
                                <div className="h-64 bg-slate-100 rounded border overflow-hidden">
                                    <PDFViewer width="100%" height="100%" showToolbar={false} className="border-none">
                                        <QuotePDF data={{
                                            quoteNumber: id ? id.slice(-6).toUpperCase() : 'BORRADOR',
                                            createdAt: new Date(),
                                            customerName: customer.name || 'Cliente',
                                            customerCompany: customer.company,
                                            customerEmail: customer.email,
                                            customerPhone: customer.phone,
                                            items: items,
                                            subtotal: subtotal,
                                            taxRate: settings.taxRate / 100,
                                            taxAmount: taxAmount,
                                            total: total,
                                            notes: settings.notes,
                                            validUntil: settings.validUntil
                                        }} />
                                    </PDFViewer>
                                </div>
                                <div className="text-center mt-2">
                                    <PDFDownloadLink
                                        document={<QuotePDF data={{
                                            quoteNumber: id ? id.slice(-6).toUpperCase() : 'BORRADOR',
                                            createdAt: new Date(),
                                            customerName: customer.name || 'Cliente',
                                            customerCompany: customer.company,
                                            customerEmail: customer.email,
                                            customerPhone: customer.phone,
                                            items: items,
                                            subtotal: subtotal,
                                            taxRate: settings.taxRate / 100,
                                            taxAmount: taxAmount,
                                            total: total,
                                            notes: settings.notes,
                                            validUntil: settings.validUntil
                                        }} />}
                                        fileName="cotizacion.pdf"
                                        className="text-xs text-blue-500 hover:text-blue-700 underline flex items-center justify-center gap-1"
                                    >
                                        {({ blob, url, loading, error }) =>
                                            loading ? 'Generando...' : 'Descargar PDF'
                                        }
                                    </PDFDownloadLink>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewQuote;
