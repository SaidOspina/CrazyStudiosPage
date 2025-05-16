
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Mostrar indicador de carga
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    // Obtener valores del formulario
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    // Crear un asunto detallado con toda la información del formulario
    const detailedSubject = `Nuevo contacto - ${subject} | Nombre: ${name} | Email: ${email} | Tel: ${phone}`;
    
    // Preparar los parámetros para el template
    const templateParams = {
        from_name: name,
        from_email: email,
        phone_number: phone,
        message: message,
        subject: detailedSubject, // Asunto detallado con toda la información
        detailed_subject: detailedSubject, // En caso de que quieras usarlo como variable separada en la plantilla
        reply_to: email,
        to_name: "Crazy Studios",
        // Campos adicionales para mostrar en el cuerpo del correo
        name_value: name,
        email_value: email,
        phone_value: phone,
        subject_value: subject,
        message_value: message
    };
    
    // Enviar el correo usando los IDs proporcionados
    emailjs.send('service_8dq6atk', 'template_7m02u1c', templateParams)
        .then(function(response) {
            console.log('ÉXITO!', response.status, response.text);
            
            // Mostrar mensaje de éxito
            alert('¡Gracias por tu mensaje! Te responderemos a la brevedad.');
            
            // Restablecer el formulario
            document.getElementById('contactForm').reset();
            
            // Restaurar el botón
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }, function(error) {
            console.log('FALLÓ...', error);
            
            // Mostrar mensaje de error
            alert('Lo sentimos, hubo un problema al enviar tu mensaje. Por favor, intenta nuevamente o contáctanos directamente por teléfono.');
            
            // Restaurar el botón
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        });
});