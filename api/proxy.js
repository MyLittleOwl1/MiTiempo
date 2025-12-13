export default async function handler(req, res) {
  const { endpoint } = req.query;
  const API_KEY = process.env.AEMET_API_KEY;

  if (!endpoint) {
    return res.status(400).json({ error: "Falta endpoint" });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://mylittleowl1.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // PASO 1: Meta
    const urlMeta = `https://opendata.aemet.es/opendata${endpoint}?api_key=${API_KEY}`;
    const resMeta = await fetch(urlMeta);
    const jsonMeta = await resMeta.json();

    // PASO 2: Datos
    const resDatos = await fetch(jsonMeta.datos);
    const datos = await resDatos.json();

    return res.status(200).json(datos);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
