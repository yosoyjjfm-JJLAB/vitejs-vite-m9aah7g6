import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { PlusCircle, LogOut, LayoutDashboard, FolderOpen, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    const isActive = (path) => {
        return location.pathname === path ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white';
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
            {/* Sidebar / Navbar */}
            <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="JJLAB Logo" className="w-12 h-12 object-contain" />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">JJLAB Admin</h1>
                            <p className="text-xs text-slate-400">Tecnología Creativa</p>
                        </div>
                    </div>
                </div>

                <nav className="p-4 space-y-2 flex-1">
                    <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/')}`}>
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Dashboard</span>
                    </Link>

                    <Link to="/nuevo" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/nuevo')}`}>
                        <PlusCircle size={20} />
                        <span className="font-medium">Nuevo Ingreso</span>
                    </Link>

                    <Link to="/cotizaciones" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/cotizaciones')}`}>
                        <FileText size={20} />
                        <span className="font-medium">Cotizaciones</span>
                    </Link>

                    <Link to="/archivos" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive('/archivos')}`}>
                        <FolderOpen size={20} />
                        <span className="font-medium">Galería / Archivos</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-sm"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 w-full">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-slate-800">
                            {location.pathname === '/' && 'Panel de Control'}
                            {location.pathname === '/nuevo' && 'Registrar Nuevo Equipo'}
                            {location.pathname === '/cotizaciones' && 'Historial de Cotizaciones'}
                            {location.pathname === '/cotizaciones/nueva' && 'Nueva Cotización'}
                            {location.pathname.includes('/cotizaciones/') && location.pathname !== '/cotizaciones/nueva' && 'Editar Cotización'}
                            {location.pathname === '/archivos' && 'Gestión de Archivos'}
                            {location.pathname.includes('/ticket/') && 'Detalle y Reparación'}
                        </h2>
                        <div className="text-sm text-slate-500">
                            Usuario: <span className="font-medium text-slate-700">{currentUser?.email || 'Técnico JJLAB'}</span>
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
