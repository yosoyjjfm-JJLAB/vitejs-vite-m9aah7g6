import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit } from 'lucide-react';

const QuotesList = () => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                // Fetch all quotes ordered by date
                const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);

                const loadedQuotes = [];
                querySnapshot.forEach((doc) => {
                    loadedQuotes.push({ id: doc.id, ...doc.data() });
                });

                setQuotes(loadedQuotes);
            } catch (error) {
                console.error("Error fetching quotes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuotes();
    }, []);

    // Filter by search term
    const filteredQuotes = quotes.filter(quote =>
        (quote.customerName && quote.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (quote.id && quote.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando cotizaciones...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Cotizaciones</h1>
                    <p className="text-slate-500">Historial y gestión de propuestas</p>
                </div>
                <Link
                    to="/cotizaciones/nueva"
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                    <Plus size={20} /> Nueva Cotización
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
                <Search size={20} className="text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por cliente o folio..."
                    className="flex-1 outline-none text-slate-700 bg-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                                <th className="p-4 font-semibold">Folio</th>
                                <th className="p-4 font-semibold">Cliente</th>
                                <th className="p-4 font-semibold">Fecha</th>
                                <th className="p-4 font-semibold text-right">Total</th>
                                <th className="p-4 font-semibold text-center">Estado</th>
                                <th className="p-4 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredQuotes.length > 0 ? (
                                filteredQuotes.map((quote) => (
                                    <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-slate-700">
                                            #{quote.id ? quote.id.slice(0, 6).toUpperCase() : '---'}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-slate-800">{quote.customerName || 'Sin Nombre'}</div>
                                            {quote.customerCompany && (
                                                <div className="text-xs text-slate-500">{quote.customerCompany}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {quote.createdAt?.toDate ? quote.createdAt.toDate().toLocaleDateString('es-MX') : '---'}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-800 text-right">
                                            {formatCurrency(quote.total)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${quote.status === 'Enviada'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {quote.status || 'Borrador'}
                                            </span>
                                        </td>
                                        <td className="p-4 flex justify-center">
                                            <Link
                                                to={`/cotizaciones/${quote.id}`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar / Ver"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        No se encontraron cotizaciones.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default QuotesList;
