document.getElementById('btnEnviar').addEventListener('click', async () => {
    const contenedor = document.getElementById('resultado');
    const textoDelUsuario = document.getElementById('textoUsuario').value;

    if (!textoDelUsuario.trim()) {
        contenedor.textContent = "Por favor, escribe una frase para analizar.";
        return;
    }

    try {
        contenedor.textContent = "Enviando documento a Azure...";

        const configRes = await fetch('/api/config');
        if (!configRes.ok) throw new Error("No se pudo obtener la configuración del servidor.");
        const config = await configRes.json();

        const endpoint = config.languageEndpoint;
        const suscriptionKey = config.languageKey;
        const URL = `${endpoint}/language/:analyze-text?api-version=2023-04-01`;

        const documentoAnalizar = {
            kind: "SentimentAnalysis",
            analysisInput: {
                documents: [
                    {
                        id: "1",
                        language: "es",
                        text: textoDelUsuario
                    }
                ]
            }
        };

        const response = await fetch(URL, {
            method: 'POST',
            headers: {
                "Ocp-Apim-Subscription-Key": suscriptionKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(documentoAnalizar)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message);
        }

        const data = await response.json();

        let resultadoHTML = "";
        data.results.documents.forEach(document => {
            resultadoHTML += `Documento # ${document.id}\n`;
            resultadoHTML += `Texto analizado: "${textoDelUsuario}"\n\n`;

            const scores = document.confidenceScores;
            resultadoHTML += `Puntuaciones de confianza:\n`;
            resultadoHTML += `- positivo: ${scores.positive}\n`;
            resultadoHTML += `- negativo: ${scores.negative}\n`;
            resultadoHTML += `- neutral: ${scores.neutral}\n`;
        });

        contenedor.textContent = resultadoHTML;

    } catch (error) {
        contenedor.textContent = `Error: ${error.message}`;
    }
});