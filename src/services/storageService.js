import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../firebase'; // Importamos la instancia inicializada

export const uploadFile = async (file, path) => {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error subiendo archivo:', error);
        throw error;
    }
};

export const uploadPDF = async (blob, ticketId) => {
    return uploadFile(blob, `dictamenes/dictamen_${ticketId}.pdf`);
};

export const uploadTicketPhoto = async (file, ticketId) => {
    const timestamp = Date.now();
    return uploadFile(file, `evidence/${ticketId}/${timestamp}_${file.name}`);
};

export const uploadQuoteImage = async (file) => {
    const timestamp = Date.now();
    return uploadFile(file, `quotes/images/${timestamp}_${file.name}`);
};
