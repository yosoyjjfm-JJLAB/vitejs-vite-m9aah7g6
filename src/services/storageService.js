import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../firebase';

export const uploadFile = async (file, path, customContentType = null) => {
    try {
        const storageRef = ref(storage, path);
        const metadata = {};
        
        if (customContentType) {
            metadata.contentType = customContentType;
        } else if (file.type) {
            metadata.contentType = file.type;
        } else if (path.endsWith('.pdf')) {
            metadata.contentType = 'application/pdf';
        }

        const snapshot = await uploadBytes(storageRef, file, metadata);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error subiendo archivo a Firebase Storage:', error);
        throw error;
    }
};

export const uploadPDF = async (blob, ticketId) => {
    return uploadFile(blob, `dictamenes/dictamen_${ticketId}.pdf`, 'application/pdf');
};

export const uploadTicketPhoto = async (file, ticketId) => {
    const timestamp = Date.now();
    return uploadFile(file, `evidence/${ticketId}/${timestamp}_${file.name}`, file.type || 'image/jpeg');
};

export const uploadQuoteImage = async (file) => {
    const timestamp = Date.now();
    return uploadFile(file, `quotes/images/${timestamp}_${file.name}`, file.type || 'image/jpeg');
};
