const contenedor = document.getElementById("resultado");

const btnEnviar = document.getElementById("btnEnviar");

const inputArchivo = document.getElementById("imagenUsuario");


// EVENTO
btnEnviar.addEventListener("click", async () => {

    const archivo = inputArchivo.files[0];

    // VALIDACIÓN
    if (!archivo) {

        contenedor.innerHTML = `

            <p class="text-danger">

                Seleccione un archivo.

            </p>

        `;

        return;
    }

    try {

        contenedor.innerHTML = `

            <p class="text-muted">

                Enviando archivo a Azure...

            </p>

        `;

        // OBTENER CONFIG
        const configRes = await fetch("/api/config");

        if (!configRes.ok) {

            throw new Error("No se pudo obtener la configuración.");
        }

        const config = await configRes.json();

        const suscriptionKey = config.visionKey;

        const endpoint = config.visionEndpoint;

        // URL OCR
        const url = `${endpoint}/vision/v3.2/read/analyze`;

        // PETICIÓN
        const response = await fetch(url, {

            method: "POST",

            headers: {

                "Ocp-Apim-Subscription-Key": suscriptionKey,

                "Content-Type": "application/octet-stream"
            },

            body: archivo

        });

        // VALIDAR
        if (!response.ok) {

            const errorData = await response.json();

            throw new Error(errorData.error.message);
        }

        // OPERATION LOCATION
        const operationLocation = response.headers.get("operation-location");

        // ESPERAR RESULTADO
        let result = null;

        while (true) {

            const checkResponse = await fetch(operationLocation, {

                headers: {

                    "Ocp-Apim-Subscription-Key": suscriptionKey
                }

            });

            result = await checkResponse.json();

            if (result.status === "succeeded") {

                break;
            }

            if (result.status === "failed") {

                throw new Error("Error analizando documento.");
            }

            // ESPERA
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // EXTRAER TEXTO
        let textoDetectado = "";

        result.analyzeResult.readResults.forEach(page => {

            page.lines.forEach(line => {

                textoDetectado += `${line.text}\n`;

            });

        });

        // MOSTRAR RESULTADO
        contenedor.innerHTML = `

            <div class="w-100">

                <p class="mb-0 text-break">

                    ${textoDetectado.replace(/\n/g, "<br>")}

                </p>

            </div>

        `;

    } catch (error) {

        contenedor.innerHTML = `

            <p class="text-danger">

                Error: ${error.message}

            </p>

        `;
    }

});