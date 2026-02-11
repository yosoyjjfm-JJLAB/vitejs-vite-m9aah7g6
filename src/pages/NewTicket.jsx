import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketForm from '../components/TicketForm';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { saveCustomer } from '../services/customerService';

const NewTicket = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleCreateTicket = async (data) => {
        setIsSubmitting(true);
        setError(null);
        try {
            // 1. Guardar o actualizar datos del cliente (incluyendo Empresa)
            const customerData = {
                name: data.customerName,
                company: data.customerCompany,
                email: data.customerEmail,
                phone: data.customerPhone
            };

            if (data.customerEmail || data.customerPhone) {
                try {
                    await saveCustomer(customerData);
                    console.log('Cliente actualizado/guardado');
                } catch (e) {
                    console.warn('No se pudo guardar el cliente (posiblemente falta config de Firebase):', e);
                }
            }

            // 2. Crear el Ticket
            const ticketData = {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'Pendiente',
                history: [
                    {
                        date: new Date().toISOString(),
                        action: 'Ingreso',
                        note: 'Equipo ingresado al taller',
                    }
                ]
            };

            console.log('Simulando guardado de Ticket:', ticketData);

            setTimeout(() => {
                alert('Ticket creado y cliente actualizado (Simulación).');
                navigate('/');
            }, 1000);

        } catch (err) {
            console.error("Error adding document: ", err);
            setError('Hubo un error al guardar el registro. Revisa la consola.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Nuevo Ingreso</h1>
                <p className="text-slate-500">Registra un nuevo equipo para su reparación</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
                    {error}
                </div>
            )}

            <TicketForm onSubmit={handleCreateTicket} isSubmitting={isSubmitting} />
        </div>
    );
};

export default NewTicket;
