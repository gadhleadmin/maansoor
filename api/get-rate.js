// api/get-rate.js

import { createClient } from '@supabase/supabase-js';

// Hubi in Vercel Environment Variables-ka la helay
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

// Hubinta degdegga ah (Haddii furayaashu maqan yihiin, wuxuu koodhku jabi doonaa bilowga)
if (!supabaseUrl || !supabaseServiceKey) {
  // Waxaa muhiim ah in aad Vercel Settings: Environment Variables ku darto labadan fure
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check Vercel settings.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);


export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Codsiga Supabase: Soo qaado rate-ka ugu dambeeyay
    const { data: rates, error } = await supabase
      .from('rates') // Xaqiiji magaca table-kaaga
      .select('rate') // Xaqiiji magaca column-ka 'rate'
      .order('created_at', { ascending: false }) // Ka soo qaad ka ugu dambeeyay (haddii uu jiro created_at)
      .limit(1) 
      .single(); 

    if (error) {
      console.error('Supabase Query Error:', error.message);
      // Ku soo celi 500 oo wata fariin JSON ah
      return res.status(500).json({ error: 'Fails to execute Supabase query', details: error.message });
    }

    // Soo dir rate-ka loo baahan yahay
    if (rates && rates.rate !== undefined) {
      return res.status(200).json({
        success: true,
        current_rate: rates.rate, 
        retrieved_at: new Date().toISOString()
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        error: 'Rate data not found or table is empty.' 
      });
    }

  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error occurred during data fetch.' });
  }
}