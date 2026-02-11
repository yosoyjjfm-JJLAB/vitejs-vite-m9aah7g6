import emailjs from 'emailjs-com';

// Inicializa con tu Public Key de EmailJS
emailjs.init("09tN9vhFRcwNh08qC");

export const sendTicketEmail = async (ticketData, pdfUrl) => {
  try {
    console.log('Enviando correo a:', ticketData.customerEmail);

    const templateParams = {
      email: ticketData.customerEmail, // Cambiado de to_email porque tu template usa {{email}}
      customer_name: ticketData.customerName,
      device_model: ticketData.deviceModel,
      pdf_link: pdfUrl,
      cc_emails: ticketData.ccEmails, // Nuevo campo para CC
      // Variables opcionales si las usaste en el template
      reply_to: "jjlab2020@gmail.com"
    };

    const response = await emailjs.send(
      'service_0dnuvku',   // Service ID
      'template_c6bwmes',  // Template ID
      templateParams
    );

    console.log('Correo enviado con éxito!', response.status, response.text);
    return response;

  } catch (error) {
    console.error('Error al enviar correo:', error);
    throw error;
  }
};
