import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const TicketList = ({ tickets }) => {
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Finalizado':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" /> Listo</span>;
            case 'Pendiente':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertCircle size={12} className="mr-1" /> Pendiente</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock size={12} className="mr-1" /> En proceso</span>;
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Equipo</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">#{ticket.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ticket.customer}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{ticket.device}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{ticket.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ticket.status)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Link to={`/ticket/${ticket.id}`} className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                                    <Eye size={16} className="mr-1" /> Ver
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TicketList;
