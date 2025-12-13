import https from 'https';

export default async function handler(req, res) {
    // 1. Configuración CORS
    res.setHeader('Access-Control-Allow-Origin', 'https://mylittleowl1.github.io');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejo de preflight request (OPTIONS)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { endpoint } = req.query;
    const API_KEY = process.env.AEMET_API_KEY;

    if (!endpoint) {
        res.status(400).json({ error: "Falta parámetro endpoint" });
        return;
    }

    // Función auxiliar para hacer peticiones https nativas (sin fetch)
    const nativeFetch = (url) => {
        return new Promise((resolve, reject) => {
            https.get(url, (resp) => {
                let data = '';

                // Un chunk de datos ha sido recibido.
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                // La respuesta completa ha sido recibida.
                resp.on('end', () => {
                    if (resp.statusCode >= 200 && resp.statusCode < 300) {
                        try {
                            // AEMET a veces devuelve ISO-8859-15, intentamos parsear
                            resolve(JSON.parse(data));
                        } catch (e) {
                            reject(new Error('Error parseando JSON de AEMET'));
                        }
                    } else {
                        reject(new Error(`Error HTTP ${resp.statusCode}`));
                    }
                });

            }).on("error", (err) => {
                reject(err);
            });
        });
    };

    try {
        console.log(`[Proxy] Solicitando meta para: ${endpoint}`);
        
        // PASO 1: Obtener URL de metadatos
        const urlMeta = `https://opendata.aemet.es/opendata${endpoint}?api_key=${API_KEY}`;
        const jsonMeta = await nativeFetch(urlMeta);

        if (!jsonMeta.datos) {
            throw new Error('AEMET no devolvió URL de datos: ' + JSON.stringify(jsonMeta));
        }

        // PASO 2: Obtener datos reales
        console.log(`[Proxy] Solicitando datos reales a: ${jsonMeta.datos}`);
        const datosReales = await nativeFetch(jsonMeta.datos);

        // PASO 3: Devolver al cliente
        res.status(200).json(datosReales);

    } catch (error) {
        console.error("[Proxy Error]", error.message);
        res.status(500).json({ 
            error: "Error interno del proxy", 
            mensaje: error.message 
        });
    }
}

