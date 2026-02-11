import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializar la API de Google Gemini
// Inicializar la API de Google Gemini
const API_KEY = "AIzaSyD7pXZg_ZKNiRH0byV9hl6tjwO9YBk0t4k";

const genAI = new GoogleGenerativeAI(API_KEY);

export const estimateLifespan = async (imageFile, deviceModel, problemDescription) => {
    try {
        // 1. Convertir la imagen a base64 para enviarla a Gemini
        const imageBase64 = await fileToGenerativePart(imageFile);

        // 2. Elegir el modelo (Gemini 1.5 Flash es rápido y económico)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 3. Crear el prompt (la pregunta para la IA)
        const prompt = `
            Actúa como un técnico experto en reparación de electrónica.
            Analiza esta imagen adjunta de un equipo (${deviceModel}) que tiene el siguiente problema reportado: "${problemDescription}".
            
            Basado en la apariencia visual del equipo y el problema, por favor proporciona:
            1. Una estimación breve del tiempo de vida útil restante si se repara correctamente.
            2. Una justificación muy breve (1 o 2 frases) de por qué.
            
            Formato de respuesta deseado: "Aprox. [X] años. [Justificación]."
            Mantén el tono profesional y técnico.
        `;

        // 4. Generar contenido
        const result = await model.generateContent([prompt, imageBase64]);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error("Error consultando a Gemini:", error);
        return "No se pudo calcular la estimación automáticamente.";
    }
};

// Helper para convertir File a Base64 compatible con Google AI SDK
async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });

    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
}
