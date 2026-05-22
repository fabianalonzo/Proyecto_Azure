document.getElementById('btnEnviar').addEventListener('click', async () => {
    const contenedor = document.getElementById('resultado');
    const textoDelUsuario = document.getElementById('textoUsuario').value;

    // Capturar qué checkboxes están marcados en el momento del click
    const checkboxesMarcados = document.querySelectorAll('.filtro-entidad:checked');
    const categoriasFiltro = Array.from(checkboxesMarcados).map(cb => cb.value);

    // Validación básica
    if (!textoDelUsuario.trim()) {
        contenedor.innerHTML = `<p class="mensaje-estado">Por favor, escriba sus datos para analizar.</p>`;
        return;
    }

    if (categoriasFiltro.length === 0) {
        contenedor.innerHTML = `<p class="mensaje-estado">Seleccione al menos una categoría en el checklist derecho para filtrar.</p>`;
        return;
    }

    try {
        contenedor.innerHTML = `<p class="mensaje-estado">Enviando documento a Azure para extracción...</p>`;

        // Obtener credenciales de tu API interna
        const configRes = await fetch('/api/config');
        if (!configRes.ok) throw new Error("No se pudo obtener la configuración del servidor.");
        const config = await configRes.json();

        const endpoint = config.languageEndpoint;
        const suscriptionKey = config.languageKey;

        const url = `${endpoint}/language/:analyze-text?api-version=2023-04-01`;

        // Paso 1 - El documento que se desea analizar
        const documentoProcesar = {
            kind: "EntityRecognition",
            analysisInput: {
                documents: [{
                    id: "1",
                    language: "es",
                    text: textoDelUsuario
                }]
            }
        };

        // Paso 2 - Enviar documento
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                "Ocp-Apim-Subscription-Key": suscriptionKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(documentoProcesar)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error en: ${errorData.error.message}`);
        }

        // Paso 3 - Recibir respuesta
        const data = await response.json();

        if (data.results?.errors?.length > 0) {
            console.error(data.results.errors);
            throw new Error("Azure devolvió errores en el procesamiento del documento.");
        }

        // Extraer datos del único documento enviado
        const primerDocumento = data.results.documents[0];
        
        // Estructurar la tabla HTML solicitada
        let tablaHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Text</th>
                        <th>Categoría</th>
                        <th>% Confianza</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let contadorEntidades = 0;

        // Iterar las entidades devueltas e ir agregando filas (tr)
        primerDocumento.entities.forEach(entidad => {
            // Evaluar si la categoría pertenece a los filtros activos
            if (categoriasFiltro.includes(entidad.category)) {
                const porcentajeConfianza = (entidad.confidenceScore * 100).toFixed(1);
                
                tablaHTML += `
                    <tr>
                        <td><strong>${entidad.text}</strong></td>
                        <td>${entidad.category}</td>
                        <td>${porcentajeConfianza}%</td>
                    </tr>
                `;
                contadorEntidades++;
            }
        });

        tablaHTML += `
                </tbody>
            </table>
        `;

        // Si pasó el filtro pero Azure no encontró ninguna de las categorías seleccionadas
        if (contadorEntidades === 0) {
            contenedor.innerHTML = `<p class="mensaje-estado">No se encontraron datos que coincidan con las categorías seleccionadas.</p>`;
        } else {
            // Renderizar la tabla construida dentro del contenedor principal
            contenedor.innerHTML = tablaHTML;
        }

    } catch (error) {
        contenedor.innerHTML = `<p class="mensaje-estado" style="color: red;">Error: ${error.message}</p>`;
    }
});