// api/index.js - Vercel + Supabase (body parsing seguro + CORS + logs)
const { createClient } = require('@supabase/supabase-js');

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(new Error('JSON inválido')); }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  try {
    // CORS básico para poder probar desde navegador y Tampermonkey
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();

    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Método no permitido' });
    }

    // Lee el body de forma segura
    const { apiKey, payload } = await readJsonBody(req);

    if (!apiKey) {
      return res.status(400).json({ ok: false, error: 'Falta apiKey' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      console.error('ENV faltantes');
      return res.status(500).json({ ok: false, error: 'Config del servidor incompleta' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // Verifica la apiKey
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, owner_name, active')
      .eq('key_text', apiKey)
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ ok: false, error: 'Error de base de datos' });
    }

    if (!data || data.length === 0) {
      return res.status(403).json({ ok: false, error: 'apiKey inválida' });
    }

    if (!data[0].active) {
      return res.status(403).json({ ok: false, error: 'apiKey desactivada' });
    }

    // 🔧 Aquí pondrás tu lógica real
    return res.status(200).json({
      ok: true,
      message: `Hola ${data[0].owner_name || 'cliente'}, la API está funcionando 🎉`,
      echo: payload ?? null
    });

  } catch (e) {
    console.error('Handler catch:', e);
    return res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
};
