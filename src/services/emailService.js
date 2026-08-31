import emailjs from 'emailjs-com';

// Inicializa con tu Public Key de EmailJS
emailjs.init("09tN9vhFRcwNh08qC");

export const sendTicketEmail = async (ticketData, pdfUrl, options = {}) => {
  try {
    const targetEmail = options.recipientEmail || ticketData.customerEmail;
    console.log('Enviando correo a:', targetEmail);

    const templateParams = {
      email: targetEmail, // Destinatario principal (personalizable)
      customer_name: ticketData.customerName || ticketData.customer || 'Cliente',
      device_model: options.deviceModel || ticketData.deviceModel || ticketData.device || 'Equipo',
      service_type: options.serviceType || ticketData.serviceType || 'Servicio Técnico',
      pdf_link: pdfUrl,
      pdf_url: pdfUrl,
      link: pdfUrl,
      url: pdfUrl,
      cc_emails: options.ccEmails !== undefined ? options.ccEmails : (ticketData.ccEmails || ''),
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

export const sendBulkTicketEmail = async ({
  recipientEmail,
  customerName,
  deviceSummary,
  serviceType = 'Dictámenes Técnicos',
  pdfLink,
  ccEmails = ''
}) => {
  try {
    console.log('Enviando correo masivo a:', recipientEmail);

    const templateParams = {
      email: recipientEmail,
      customer_name: customerName || 'Cliente',
      device_model: deviceSummary || 'Lote de Equipos',
      service_type: serviceType,
      pdf_link: pdfLink,
      pdf_url: pdfLink,
      link: pdfLink,
      url: pdfLink,
      cc_emails: ccEmails,
      reply_to: "jjlab2020@gmail.com"
    };

    const response = await emailjs.send(
      'service_0dnuvku',
      'template_c6bwmes',
      templateParams
    );

    console.log('Correo masivo enviado con éxito!', response.status, response.text);
    return response;
  } catch (error) {
    console.error('Error al enviar correo masivo:', error);
    throw error;
  }
};

export const sendQuoteEmail = async (quoteData, pdfUrl) => {
  try {
    console.log('Enviando cotización a:', quoteData.customerEmail);

    const templateParams = {
      email: quoteData.customerEmail,
      customer_name: quoteData.customerName,
      quote_link: pdfUrl,
      total_amount: quoteData.total ? quoteData.total.toFixed(2) : '0.00',
      reply_to: "jjlab2020@gmail.com",
      subject: `Cotización JJLAB #${quoteData.id ? quoteData.id.slice(-6).toUpperCase() : ''}`
    };

    const paramsMap = {
      email: quoteData.customerEmail,
      customer_name: quoteData.customerName,
      device_model: "Cotización de Servicios",
      service_type: "Cotización #" + (quoteData.id ? quoteData.id.slice(-6) : ''),
      pdf_link: pdfUrl,
      pdf_url: pdfUrl,
      link: pdfUrl,
      url: pdfUrl,
      reply_to: "jjlab2020@gmail.com"
    };

    const response = await emailjs.send(
      'service_0dnuvku',
      'template_c6bwmes',
      paramsMap
    );

    console.log('Cotización enviada con éxito!', response.status, response.text);
    return response;

  } catch (error) {
    console.error('Error al enviar cotización:', error);
    throw error;
  }
};
