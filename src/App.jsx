import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewTicket from './pages/NewTicket';
import NewQuote from './pages/NewQuote';
import QuotesList from './pages/QuotesList';
import TicketDetail from './pages/TicketDetail';
import Login from './pages/Login';
import StorageGallery from './pages/StorageGallery';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return currentUser ? children : <Navigate to="/login" replace />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="nuevo" element={<NewTicket />} />
                        <Route path="cotizaciones" element={<QuotesList />} />
                        <Route path="cotizaciones/nueva" element={<NewQuote />} />
                        <Route path="cotizaciones/:id" element={<NewQuote />} />
                        <Route path="archivos" element={<StorageGallery />} />
                        <Route path="ticket/:id" element={<TicketDetail />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
