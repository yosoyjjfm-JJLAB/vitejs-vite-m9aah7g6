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
      service_type: ticketData.serviceType || 'Servicio Técnico', // Para el asunto
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

export const sendQuoteEmail = async (quoteData, pdfUrl) => {
  try {
    console.log('Enviando cotización a:', quoteData.customerEmail);

    const templateParams = {
      email: quoteData.customerEmail,
      customer_name: quoteData.customerName,
      quote_link: pdfUrl, // En el template de EmailJS deberás usar {{quote_link}}
      total_amount: quoteData.total.toFixed(2),
      // Reutilizamos campos existentes o genéricos si es posible, o crea un nuevo template
      reply_to: "jjlab2020@gmail.com",
      subject: `Cotización JJLAB #${quoteData.id.slice(-6).toUpperCase()}`
    };

    // NOTA: Idealmente deberías crear un template específico en EmailJS para cotizaciones
    // y usar su ID aquí. Por ahora reusamos el servicio, pero asumimos un template ID nuevo o genérico.
    // Si no tienes uno nuevo, puedes intentar usar el mismo 'template_c6bwmes' pero asegurate
    // que tenga variables genéricas o crea uno nuevo en el panel de EmailJS.
    // Voy a usar un ID de placeholder, el usuario deberá actualizarlo o crear el template.
    // O mejor, intentamos usar el mismo template pero mapeando datos.

    // Mapeo al template existente (intentando que se vea decente)
    const paramsMap = {
      email: quoteData.customerEmail,
      customer_name: quoteData.customerName,
      device_model: "Cotización de Servicios", // Hack para reusar campo
      service_type: "Cotización #" + quoteData.id.slice(-6), // Hack para reusar campo
      pdf_link: pdfUrl,
      reply_to: "jjlab2020@gmail.com"
    };

    const response = await emailjs.send(
      'service_0dnuvku',   // Service ID (Mismo)
      'template_c6bwmes',  // Template ID (Mismo, reusado con astucia)
      paramsMap
    );

    console.log('Cotización enviada con éxito!', response.status, response.text);
    return response;

  } catch (error) {
    console.error('Error al enviar cotización:', error);
    throw error;
  }
};
