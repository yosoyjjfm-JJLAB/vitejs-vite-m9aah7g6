import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';

const COLLECTION_NAME = 'customers';

export const searchCustomers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 3) return [];

    const customersRef = collection(db, COLLECTION_NAME);

    // Búsqueda simple por teléfono o email
    const qPhone = query(customersRef, where('phone', '==', searchTerm), limit(1));
    const qEmail = query(customersRef, where('email', '==', searchTerm), limit(1));

    try {
        const [phoneSnap, emailSnap] = await Promise.all([
            getDocs(qPhone),
            getDocs(qEmail)
        ]);

        let results = [];
        phoneSnap.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
        emailSnap.forEach(doc => {
            if (!results.find(r => r.id === doc.id)) {
                results.push({ id: doc.id, ...doc.data() });
            }
        });

        return results;
    } catch (error) {
        console.error("Error searching customers:", error);
        return [];
    }
};

export const saveCustomer = async (customerData) => {
    if (!customerData.email && !customerData.phone) return null;

    const customersRef = collection(db, COLLECTION_NAME);

    // Intentar encontrar cliente existente
    let existingId = null;
    if (customerData.email) {
        const q = query(customersRef, where('email', '==', customerData.email), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) existingId = snap.docs[0].id;
    }

    if (!existingId && customerData.phone) {
        const q = query(customersRef, where('phone', '==', customerData.phone), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) existingId = snap.docs[0].id;
    }

    const dataToSave = {
        name: customerData.name,
        company: customerData.company || '', // Nuevo campo Empresa
        email: customerData.email,
        phone: customerData.phone,
        lastVisit: serverTimestamp(),
        keywords: customerData.name ? customerData.name.toLowerCase().split(' ') : []
    };

    try {
        if (existingId) {
            await updateDoc(doc(db, COLLECTION_NAME, existingId), dataToSave);
            return existingId;
        } else {
            const docRef = await addDoc(customersRef, {
                ...dataToSave,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        }
    } catch (error) {
        console.error("Error saving customer:", error);
        throw error;
    }
};
