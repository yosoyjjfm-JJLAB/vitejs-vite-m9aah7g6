import emailjs from 'emailjs-com';

// Inicializa con tu User ID de EmailJS
// emailjs.init("YOUR_USER_ID");

export const sendTicketEmail = async (ticketData, pdfUrl) => {
    try {
        console.log('Intentando enviar correo a:', ticketData.customerEmail);
        console.log('Link del PDF:', pdfUrl);

        // Descomentar y configurar para usar EmailJS real
        /*
        const templateParams = {
          to_email: ticketData.customerEmail,
          customer_name: ticketData.customerName,
          device_model: ticketData.deviceModel,
          pdf_link: pdfUrl,
          reply_to: "tecnico@jjlabtecnologiacreativa.com"
        };
    
        const response = await emailjs.send(
          'YOUR_SERVICE_ID',
          'YOUR_TEMPLATE_ID',
          templateParams
        );
        return response;
        */

        // Simulación exitosa
        return { status: 200, text: 'OK (Simulado)' };
    } catch (error) {
        console.error('Error al enviar correo:', error);
        throw error;
    }
};
