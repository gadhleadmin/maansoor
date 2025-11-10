// api/get-rate.js
import { createClient } from '@supabase/supabase-js';

// **HUBI IN ENV VARIABLES-KA LAGA HELAY VERCEL**
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseServiceKey) {
  // Waxaa muhiim ah in khaladaadkan la qabto
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Soo qaado xogta 'rates' table-ka
    const { data: rates, error } = await supabase
      .from('rates') // Xaqiiji magaca table-ka
      .select('rate') // Xaqiiji magaca column-ka 'rate'
      .order('created_at', { ascending: false }) // Ka soo qaad ka ugu dambeeyay
      .limit(1) 
      .single(); 

    if (error) {
      console.error('Supabase Error:', error.message);
      return res.status(500).json({ error: 'Supabase Query failed', details: error.message });
    }

    // 2. Soo dir rate-ka loo baahan yahay
    if (rates && rates.rate !== undefined) {
      // Tani waa jawaab celinta uu script.js filayo
      return res.status(200).json({
        success: true,
        current_rate: rates.rate 
      });
    } else {
      return res.status(404).json({ error: 'Rate data not found in table.' });
    }

  } catch (error) {
    console.error('Unhandled Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}