const OPENCODE_ZEN_KEY = "sk-JcaYy3PxfTKK1KYio4svot1xnqbglUttxlISrAUlHeSI3bMIneJOsQEhrLES1WWp";
const ZEN_API_ENDPOINT = "/api-zen/chat/completions";
const MODEL_NAME = "mimo-v2.5-free";

// Helper para convertir el archivo de imagen a un Data URI Base64
async function fileToDataUri(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Helper para redimensionar la imagen antes de enviarla (evita caídas por tamaño en el proxy de WebContainer)
export async function resizeImage(file, maxWidth = 600, maxHeight = 600) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const reader = new FileReader();
        reader.onload = (e) => { image.src = e.target.result; };
        image.onload = () => {
            const canvas = document.createElement('canvas');
            let width = image.width;
            let height = image.height;
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (blob) {
                    console.log(`[AI Service] Imagen original: ${(file.size / 1024).toFixed(1)} KB. Redimensionada a JPEG: ${(blob.size / 1024).toFixed(1)} KB.`);
                    resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" }));
                } else {
                    reject(new Error("Error al redimensionar la imagen"));
                }
            }, "image/jpeg", 0.6); // Forzar JPEG y 60% de calidad para máxima compresión
        };
        image.onerror = reject;
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Estima el tiempo de vida útil de un equipo analizando su imagen mediante OpenCode Zen API
 */
export const estimateLifespan = async (imageFile, deviceModel, problemDescription) => {
    try {
        // 1. Redimensionar y comprimir la imagen para evitar socket hang up
        const compressedFile = await resizeImage(imageFile, 600, 600);
        
        // 2. Convertir la imagen a base64 Data URI
        const imageDataUri = await fileToDataUri(compressedFile);

        // 3. Crear el prompt
        const prompt = `
            Actúa como un técnico experto en reparación de electrónica.
            Analiza esta imagen de un equipo (${deviceModel}) con el problema: "${problemDescription}".
            
            Proporciona de forma DIRECTA, MUY BREVE y sin saludos ni explicaciones introductorias:
            1. Estimación de vida útil restante (en años) si se repara.
            2. Justificación técnica de por qué (máximo 15 palabras).
            
            Formato de respuesta: "Aprox. [X] años. [Justificación corta]."
            No agregues ningún otro texto.
        `;

        const response = await fetch(ZEN_API_ENDPOINT, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENCODE_ZEN_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageDataUri
                                }
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            return `Error HTTP ${response.status}: ${errText.substring(0, 150)}`;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const errText = await response.text();
            return `Error: La API no devolvió JSON (tipo: ${contentType || 'desconocido'}). Asegúrate de iniciar el servidor Vite local. Detalle: ${errText.substring(0, 80)}`;
        }

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        } else {
            console.error("Respuesta vacía o inesperada de OpenCode Zen:", data);
            return "Error: Respuesta de API vacía.";
        }
    } catch (error) {
        console.error("Error consultando a OpenCode Zen:", error);
        return `Error: no se pudo analizar la imagen. Detalles: ${error.message || error}`;
    }
};

/**
 * Sugiere detalles breves sobre un artículo/servicio
 */
export const suggestItemDetails = async (itemName) => {
    try {
        const response = await fetch(ZEN_API_ENDPOINT, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENCODE_ZEN_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {
                        role: "user",
                        content: `
                            Actúa como un asistente de ventas técnico.
                            El usuario quiere cotizar el siguiente producto/servicio: "${itemName}".
                            
                            Genera una descripción comercial y técnica breve (máximo 15 palabras) atractiva para una cotización profesional.
                            
                            Formato de respuesta: Solo el texto de la descripción. Nada más.
                        `
                    }
                ]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Error HTTP ${response.status}: ${errText.substring(0, 80)}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const errText = await response.text();
            throw new Error(`La API no devolvió JSON (tipo: ${contentType || 'desconocido'})`);
        }

        const data = await response.json();
        const description = data.choices && data.choices.length > 0 
            ? data.choices[0].message.content.trim() 
            : "Descripción no disponible.";

        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(itemName)}`;

        return {
            description,
            searchUrl
        };
    } catch (error) {
        console.error("Error en suggestItemDetails mediante OpenCode Zen:", error);
        return {
            description: "Descripción no disponible.",
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(itemName)}`
        };
    }
};

/**
 * Analiza la foto de un equipo para identificar tipo, modelo y extraer número de serie (OCR)
 */
export const analyzeDevicePhoto = async (imageFile) => {
    try {
        // 1. Redimensionar y comprimir la imagen
        const compressedFile = await resizeImage(imageFile, 600, 600);
        
        // 2. Convertir a Base64 Data URI
        const imageDataUri = await fileToDataUri(compressedFile);

        const prompt = `
            Actúa como un asistente técnico experto y un extractor de texto OCR de alta precisión.
            Analiza esta imagen de un dispositivo electrónico (especialmente cualquier etiqueta con especificaciones, marca, modelo, códigos de barra o pegatinas de inventario).
            
            Reglas de identificación:
            1. Si el equipo NO es convencional o comercial (ej. es un equipo armado a medida para tareas específicas, caja de control industrial, equipo especial de laboratorio personalizado, etc.), debes dejar el campo "deviceModel" como una cadena vacía "" y también el campo "problemDescription" como una cadena vacía "" para que el usuario los ingrese manualmente de forma práctica.
            2. Si el equipo SÍ es comercial y estándar (ej. laptop Dell, smartphone Samsung, etc.), identifica su marca y modelo en "deviceModel" de forma normal.
            3. Busca activamente la frase o etiqueta de "Activo Fijo" o "ACTIVO FIJO". Si encuentras un código o número asociado a este término, extráelo y colócalo en el campo "accessPassword" con el formato: "Activo Fijo: [código]". Si no existe o no es visible, deja "accessPassword" vacío.
            
            Identifica y extrae los datos. Responde ÚNICAMENTE en formato JSON válido (sin delimitadores de markdown de código de bloque, sin prefijos ni sufijos):
            {
              "deviceType": "Laptop" | "Smartphone" | "Cámara" | "SmartTV" | "Consola" | "Otro",
              "deviceModel": "Modelo comercial estándar (o cadena vacía si es un equipo de manufactura especial/armado)",
              "deviceSerial": "Número de serie o S/N (o cadena vacía si no se encuentra)",
              "accessPassword": "Activo Fijo: [código] (si se encuentra, de lo contrario cadena vacía)",
              "problemDescription": "Daño físico evidente si el equipo es comercial estándar (o cadena vacía si el equipo es especial/armado o no hay daño obvio)"
            }
            
            El campo "deviceType" debe ser estrictamente uno de los siguientes valores: "Laptop", "Smartphone", "Cámara", "SmartTV", "Consola", "Otro".
            
            No incluyas explicaciones adicionales, devuelve solo el texto JSON puro.
        `;

        const response = await fetch(ZEN_API_ENDPOINT, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENCODE_ZEN_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageDataUri
                                }
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Error HTTP ${response.status}: ${errText.substring(0, 100)}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("La respuesta de la API no es JSON.");
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            const content = data.choices[0].message.content.trim();
            // Eliminar bloques de código markdown si el modelo los devuelve
            const cleanJson = content.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
            
            console.log("[AI Service] JSON limpio recibido:", cleanJson);
            return JSON.parse(cleanJson);
        } else {
            throw new Error("La API devolvió un resultado vacío.");
        }
    } catch (error) {
        console.error("Error en analyzeDevicePhoto mediante OpenCode Zen:", error);
        throw error;
    }
};
