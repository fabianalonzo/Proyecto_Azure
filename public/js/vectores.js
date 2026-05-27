const contenedor = document.getElementById("resultado");

const btnEnviar = document.getElementById("btnEnviar");

const inputImagen = document.getElementById("imagenUsuario");

const canvas = document.getElementById("canvasResultado");

const ctx = canvas.getContext("2d");


// EVENTO
btnEnviar.addEventListener("click", async () => {

    const archivo = inputImagen.files[0];

    // VALIDACIÓN
    if (!archivo) {

        contenedor.innerHTML = `

            <p class="text-danger">

                Seleccione una imagen.

            </p>

        `;

        return;
    }

    try {

        contenedor.innerHTML = `

            <p class="text-muted">

                Procesando imagen con Azure...

            </p>

        `;

        // CONFIG
        const configRes = await fetch("/api/config");

        if (!configRes.ok) {

            throw new Error("No se pudo obtener la configuración.");
        }

        const config = await configRes.json();

        const suscriptionKey = config.visionKey;

        const endpoint = config.visionEndpoint;

        // URL AZURE
        const url = `${endpoint}/vision/v3.2/analyze?visualFeatures=Objects`;

        // FORM DATA
        const formData = new FormData();

        formData.append("file", archivo);

        // PETICIÓN
        const response = await fetch(url, {

            method: "POST",

            headers: {

                "Ocp-Apim-Subscription-Key": suscriptionKey,

                "Content-Type": "application/octet-stream"
            },

            body: archivo

        });

        // VALIDACIÓN
        if (!response.ok) {

            const errorData = await response.json();

            throw new Error(errorData.error.message);
        }

        // RESPUESTA
        const data = await response.json();

        // IMAGEN LOCAL
        const imagen = new Image();

        imagen.src = URL.createObjectURL(archivo);

        imagen.onload = () => {

            // TAMAÑO CANVAS
            canvas.width = imagen.width;

            canvas.height = imagen.height;

            // DIBUJAR IMAGEN
            ctx.drawImage(imagen, 0, 0);

            // LIMPIAR HTML
            contenedor.innerHTML = "";

            // RECORRER OBJETOS
            data.objects.forEach(obj => {

                const rect = obj.rectangle;

                const confidence = (obj.confidence * 100).toFixed(2);

                // RECTÁNGULO
                ctx.strokeStyle = "red";

                ctx.lineWidth = 3;

                ctx.strokeRect(

                    rect.x,
                    rect.y,
                    rect.w,
                    rect.h

                );

                // TEXTO
                ctx.fillStyle = "red";

                ctx.font = "18px Arial";

                ctx.fillText(

                    obj.object,
                    rect.x,
                    rect.y - 10

                );

                // HTML
                contenedor.innerHTML += `

                    <div class="border rounded p-3 mb-3 bg-light">

                        <h6 class="fw-bold mb-2">

                            ${obj.object}

                        </h6>

                        <p class="mb-1">

                            <strong>Confianza:</strong>
                            ${confidence}%

                        </p>

                        <p class="mb-0">

                            <strong>Posición:</strong>

                            X: ${rect.x},
                            Y: ${rect.y},
                            W: ${rect.w},
                            H: ${rect.h}

                        </p>

                    </div>

                `;
            });

            // SI NO HAY OBJETOS
            if (data.objects.length === 0) {

                contenedor.innerHTML = `

                    <p class="text-muted">

                        No se detectaron objetos.

                    </p>

                `;
            }

        };

    } catch (error) {

        contenedor.innerHTML = `

            <p class="text-danger">

                Error: ${error.message}

            </p>

        `;
    }

});