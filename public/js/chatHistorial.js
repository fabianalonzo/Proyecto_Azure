const contenedor = document.getElementById("resultado");

const inputPregunta = document.getElementById("preguntaUsuario");

const btnEnviar = document.getElementById("btnEnviar");


// CONTADOR VISUAL
const contadorTokens = document.createElement("div");

contadorTokens.className = "text-muted small mt-2";

contadorTokens.innerHTML = `Tokens usados: 0`;

contenedor.parentElement.appendChild(contadorTokens);


// HISTORIAL GLOBAL
let historialConversacion = [];


// TOKENS ACUMULADOS
let tokensTotales = 0;


// EVENTO
btnEnviar.addEventListener("click", async () => {

    let preguntaDelUsuario = inputPregunta.value;

    // VALIDACIÓN
    if (!preguntaDelUsuario.trim()) {

        return;
    }

    // MOSTRAR MENSAJE USUARIO
    contenedor.innerHTML += `

        <div class="mensaje-usuario">
            ${preguntaDelUsuario}
        </div>

    `;

    // LIMPIAR INPUT
    inputPregunta.value = "";

    // SCROLL
    contenedor.scrollTop = contenedor.scrollHeight;

    try {

        // MENSAJE TEMPORAL
        contenedor.innerHTML += `

            <div class="mensaje-ia" id="mensajeTemporal">
                Procesando pregunta...
            </div>

        `;

        contenedor.scrollTop = contenedor.scrollHeight;

        // CONFIG
        const configRes = await fetch("/api/config");

        if (!configRes.ok) {

            throw new Error("No se pudo obtener la configuración.");
        }

        const config = await configRes.json();

        // DATOS AZURE
        const AZURE_ENDPOINT = config.azure_Endpoint;

        const DEPLOYMENT_NAME = config.deployment_name;

        const API_KEY = config.chatsuscriptionKey;

        const API_VERSION = config.api_version;

        // URL
        const url = `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}/chat/completions?api-version=${API_VERSION}`;

        // OPTIMIZAR TOKENS
        preguntaDelUsuario += ", responde breve.";

        // SOLO ÚLTIMOS MENSAJES
        const historialReducido = historialConversacion.slice(-4);

        // BODY
        const body = {

            messages: [

                {
                    role: "system",
                    content: "Responde corto y claro."
                },

                ...historialReducido,

                {
                    role: "user",
                    content: preguntaDelUsuario
                }

            ],

            max_completion_tokens: 120,

            temperature: 0.3

        };

        // PETICIÓN
        const response = await fetch(url, {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                "api-key": API_KEY
            },

            body: JSON.stringify(body)

        });

        // VALIDAR
        if (!response.ok) {

            const errorData = await response.json();

            throw new Error(errorData.error.message);
        }

        // RESPUESTA
        const data = await response.json();

        // ELIMINAR TEMPORAL
        document.getElementById("mensajeTemporal").remove();

        // VALIDAR RESPUESTA
        if (data.choices && data.choices.length > 0) {

            const respuestaIA = data.choices[0].message.content;

            // MOSTRAR RESPUESTA
            contenedor.innerHTML += `

                <div class="mensaje-ia">
                    ${respuestaIA}
                </div>

            `;

            // GUARDAR HISTORIAL
            historialConversacion.push({

                role: "user",

                content: preguntaDelUsuario

            });

            historialConversacion.push({

                role: "assistant",

                content: respuestaIA

            });

            // MANTENER HISTORIAL PEQUEÑO
            historialConversacion = historialConversacion.slice(-4);

            // TOKENS
            const tokensUsados = data.usage.total_tokens || 0;

            tokensTotales += tokensUsados;

            contadorTokens.innerHTML = `

                Tokens último mensaje: ${tokensUsados}
                <br>
                Tokens acumulados: ${tokensTotales}

            `;

        } else {

            contenedor.innerHTML += `

                <div class="mensaje-ia">
                    No se encontró respuesta.
                </div>

            `;
        }

        // SCROLL
        contenedor.scrollTop = contenedor.scrollHeight;

    } catch (error) {

        // ELIMINAR TEMPORAL
        const temporal = document.getElementById("mensajeTemporal");

        if (temporal) {

            temporal.remove();
        }

        // ERROR
        contenedor.innerHTML += `

            <div class="mensaje-ia text-danger">
                Error: ${error.message}
            </div>

        `;

        contenedor.scrollTop = contenedor.scrollHeight;
    }

});