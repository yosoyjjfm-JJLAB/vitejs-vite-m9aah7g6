import React, { useEffect, useState } from 'react';
import TicketList from '../components/TicketList';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Search } from 'lucide-react';

const Dashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

    const [stats, setStats] = useState({
        inWorkshop: 0,
        pending: 0,
        ready: 0
    });

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                // Consulta para la lista de todos los tickets
                const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);

                const loadedTickets = [];
                let newStats = { inWorkshop: 0, pending: 0, ready: 0 };

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const ticket = {
                        id: doc.id,
                        customer: data.customerName || 'Sin Nombre',
                        company: data.customerCompany || '',
                        device: `${data.deviceType || ''} ${data.deviceModel || ''}`.trim() || 'Dispositivo desconocido',
                        deviceSerial: data.deviceSerial || '',
                        status: data.status || 'Pendiente',
                        // Formatear fecha desde Timestamp de Firestore
                        date: data.createdAt?.toDate().toLocaleDateString('es-MX') || new Date().toLocaleDateString('es-MX')
                    };
                    loadedTickets.push(ticket);

                    // Cálculo real de stats sobre todos los registros
                    if (data.status === 'En Reparación' || data.status === 'Diagnóstico') newStats.inWorkshop++;
                    if (data.status === 'Pendiente') newStats.pending++;
                    if (data.status === 'Finalizado' || data.status === 'Listo') newStats.ready++;
                });

                setTickets(loadedTickets);
                setStats(newStats);
            } catch (error) {
                console.error("Error fetching tickets:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

    // Reiniciar a la página 1 cuando cambia el filtro o la búsqueda
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // Filtrar tickets por término de búsqueda y por estado
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = 
            ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.deviceSerial.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = 
            statusFilter === 'Todos' || 
            ticket.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Paginación
    const indexOfLastTicket = currentPage * ticketsPerPage;
    const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
    const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);
    const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando tablero...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards - Mostrando datos reales de toda la base */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">En Taller (Total)</p>
                    <p className="text-3xl font-bold text-slate-800 mt-2">{stats.inWorkshop}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Pendientes</p>
                    <p className="text-3xl font-bold text-orange-500 mt-2">{stats.pending}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Listos</p>
                    <p className="text-3xl font-bold text-green-500 mt-2">{stats.ready}</p>
                </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por Folio, Cliente, Empresa o Equipo..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div>
                    <select
                        className="w-full md:w-48 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-600 bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="Todos">Todos los Estados</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Diagnóstico">Diagnóstico</option>
                        <option value="En Reparación">En Reparación</option>
                        <option value="Listo">Listo</option>
                        <option value="Finalizado">Finalizado</option>
                        <option value="Entregado">Entregado</option>
                        <option value="Baja">Baja</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">
                        {statusFilter === 'Todos' ? 'Todos los Ingresos' : `Ingresos: ${statusFilter}`}
                    </h3>
                    <span className="text-xs text-slate-500">
                        Total encontrados: {filteredTickets.length}
                    </span>
                </div>
                {currentTickets.length > 0 ? (
                    <>
                        <TicketList tickets={currentTickets} />
                        {/* Controles de Paginación */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center flex-col sm:flex-row gap-3">
                                <span className="text-sm text-slate-500">
                                    Mostrando registros {indexOfFirstTicket + 1} al {Math.min(indexOfLastTicket, filteredTickets.length)} de {filteredTickets.length}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Anterior
                                    </button>
                                    <span className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg">
                                        Pág. {currentPage} de {totalPages}
                                    </span>
                                    <button
                                        onClick={handleNextPage}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        No se encontraron tickets con los criterios de búsqueda.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
