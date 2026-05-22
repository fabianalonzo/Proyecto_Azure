document.getElementById('btnEnviar').addEventListener('click', async () => {
    const contenedor = document.getElementById('resultado');
    const imageURL = document.getElementById('urlUsuario').value;

    if (!imageURL.trim()) {
        contenedor.textContent = "Por favor, introduce una URL de imagen válida.";
        return;
    }

    try {
        contenedor.textContent = "Analizando imagen...";

        const configRes = await fetch('/api/config');
        if (!configRes.ok) throw new Error("No se pudo obtener la configuración del servidor.");
        const config = await configRes.json();

        const endpoint = config.visionEndpoint;
        const suscriptionKey = config.visionKey;
        const url = `${endpoint}/vision/v3.2/analyze?visualFeatures=Categories,Description,Color`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": suscriptionKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: imageURL })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error en: ${errorData.error.message}`);
        }

        const data = await response.json();
        const confianza = (data.description.captions[0].confidence * 100).toFixed(2);

        let resultadoHTML = "";
        resultadoHTML += `Descripción: ${data.description.captions[0].text}\n`;
        resultadoHTML += `Etiquetas: ${data.description.tags.join(", ")}\n`;
        resultadoHTML += `Confianza: ${confianza} %`;

        contenedor.textContent = resultadoHTML;

    } catch (error) {
        contenedor.textContent = `Error analizando imagen: ${error.message}`;
    }
});