import React from 'react';
import TicketList from '../components/TicketList';

const Dashboard = () => {
    // Datos mockeados para visualizar mientras no hay backend conectado
    const mockTickets = [
        { id: '1', customer: 'Juan Pérez', device: 'Laptop Dell Inspiron', status: 'En Reparación', date: '2023-10-25' },
        { id: '2', customer: 'María López', device: 'iPhone 13 Pro', status: 'Pendiente', date: '2023-10-26' },
        { id: '3', customer: 'Carlos Ruiz', device: 'Smart TV Samsung', status: 'Finalizado', date: '2023-10-24' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Equipos en Taller</p>
                    <p className="text-3xl font-bold text-slate-800 mt-2">12</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Pendientes de Revisión</p>
                    <p className="text-3xl font-bold text-orange-500 mt-2">4</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-500">Listos para Entrega</p>
                    <p className="text-3xl font-bold text-green-500 mt-2">3</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Ingresos Recientes</h3>
                </div>
                <TicketList tickets={mockTickets} />
            </div>
        </div>
    );
};

export default Dashboard;
