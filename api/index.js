// api/index.js - Tu primera API en Vercel conectada a Supabase

const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  try {
    // Solo aceptar peticiones POST
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Método no permitido' });
    }

    const { apiKey, payload } = req.body || {};
    if (!apiKey) {
      return res.status(400).json({ ok: false, error: 'Falta apiKey' });
    }

    // Inicializa Supabase con las variables de entorno (las que ya creaste)
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    // Busca la apiKey en la tabla api_keys
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, owner_name, active')
      .eq('key_text', apiKey)
      .limit(1);

    if (error) {
      console.error(error);
      return res.status(500).json({ ok: false, error: 'Error de base de datos' });
    }

    if (!data || data.length === 0) {
      return res.status(403).json({ ok: false, error: 'apiKey inválida' });
    }

    if (!data[0].active) {
      return res.status(403).json({ ok: false, error: 'apiKey desactivada' });
    }

    // Si todo está bien:
    return res.status(200).json({
      ok: true,
      message: `Hola ${data[0].owner_name || 'cliente'}, la API está funcionando 🎉`,
      payload_recibido: payload || null
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
};
