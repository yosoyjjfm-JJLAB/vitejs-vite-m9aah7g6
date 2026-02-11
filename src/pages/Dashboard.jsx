import React, { useEffect, useState } from 'react';
import TicketList from '../components/TicketList';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const Dashboard = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        inWorkshop: 0,
        pending: 0,
        ready: 0
    });

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                // Consulta para la lista: Últimos 10 tickets
                const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"), limit(10));
                const querySnapshot = await getDocs(q);

                const loadedTickets = [];
                let newStats = { inWorkshop: 0, pending: 0, ready: 0 };

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const ticket = {
                        id: doc.id,
                        customer: data.customerName,
                        device: `${data.deviceType} ${data.deviceModel}`,
                        status: data.status,
                        // Formatear fecha desde Timestamp de Firestore
                        date: data.createdAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString()
                    };
                    loadedTickets.push(ticket);

                    // Cálculo básico de stats (solo de los últimos cargados, idealmente sería otra query)
                    if (data.status === 'En Reparación' || data.status === 'Diagnóstico') newStats.inWorkshop++;
                    if (data.status === 'Pendiente') newStats.pending++;
                    if (data.status === 'Finalizado' || data.status === 'Listo') newStats.ready++;
                });

                setTickets(loadedTickets);
                setStats(newStats); // Nota: Esto solo cuenta los últimos 10. Para stats reales de TODA la base se necesitaría otra query.
            } catch (error) {
                console.error("Error fetching tickets:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando tablero...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards - Mostrando datos parciales de los recientes */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">En Taller (Recientes)</p>
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Ingresos Recientes</h3>
                </div>
                {tickets.length > 0 ? (
                    <TicketList tickets={tickets} />
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        No hay tickets registrados aún.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
