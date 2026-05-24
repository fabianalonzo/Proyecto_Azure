document.getElementById("btnEnviar").addEventListener("click", async () => {
  const contenedor = document.getElementById("resultado");
  let preguntaDelUsuario = document.getElementById("preguntaUsuario").value;

  // Validación básica
  if (!preguntaDelUsuario.trim()) {
    contenedor.innerHTML = `<p class="mensaje-estado">Por favor, escriba al menos una pregnta para analizar.</p>`;
    return;
  }

  //Validar las credenciales de azure
  try {
    contenedor.innerHTML = `<p class="mensaje-estado">Procesando tu pregunta en azure...</p>`;

    //Obterner credenciales de la API interna
    const configRes = await fetch("/api/config");
    if (!configRes.ok) throw new Error("No se pudo obtener la configuración del servidor.");

    const config = await configRes.json();
    
    const endPointURL = config.chatEndpoint
    const token = config.chatsuscriptionKey

    // Concatenamos texto para que no gaste muchos tokens
    preguntaDelUsuario += ', dame una respuesta corta.'

    const configuracion = {
        model: 'Phi-4',
        messages: [
            { role: 'user', content: preguntaDelUsuario }
        ]
    }

    const response = await fetch(endPointURL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `application/json`
        },
        body: JSON.stringify(configuracion)
    })

    if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error en: ${errorData.error.message}`);
    }

    //Recibimos la respuesta
    const data = await response.json();
    // console.log(`Respuesta completa: ${data}`);

    if (data.choices && data.choices.length > 0) {
        contenedor.innerHTML = `<p class="mensaje-estado">Respuesta corta: ${data.choices[0].message.content}</p>`;
        //console.log(`Respuesta corta: ${data.choices[0].message.content}`)
    } else {
        contenedor.innerHTML = `<p class="mensaje-estado">No se encontró contenido para la respuesta</p>`;
        //console.log(`No se encontró contenido para la respuesta`)
    }


  } catch (error) {
    contenedor.innerHTML = `<p class="mensaje-estado" style="color: red;">Error: ${error.message}</p>`;
  }
});
