import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';
import Login from './pages/Login';
import StorageGallery from './pages/StorageGallery';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = true;
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
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
                    <Route path="archivos" element={<StorageGallery />} />
                    <Route path="ticket/:id" element={<TicketDetail />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
