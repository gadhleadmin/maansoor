// api/get-rate.js
import { createClient } from '@supabase/supabase-js';

// **FURAYAASHA WAXAA LAGA SOO QAADANAYA ENVIRONMENT VARIABLES EE VERCEL**
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

// Hubi in Environment Variables-ka ay jiraan (Haddii Vercel uusan helin, wuu jabayaa deployment-ka)
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Isticmaal Service Role Key si loo dhaafo RLS (Row Level Security)
const supabase = createClient(supabaseUrl, supabaseServiceKey);


export default async function handler(req, res) {
  // Oggolow kaliya codsiyada GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Soo qaado rate-ka ugu dambeeyay ee table-ka 'rates'
    const { data: rates, error } = await supabase
      .from('rates') // Magaca table-kaaga
      .select('rate') // Column-ka aad doonayso
      .order('created_at', { ascending: false }) // Ka ugu dambeeyay
      .limit(1) 
      .single(); // Soo celi object keliya

    if (error) {
      console.error('Supabase Query Error:', error.message);
      return res.status(500).json({ error: 'Fails to execute Supabase query', details: error.message });
    }

    // 2. Soo dir rate-ka JSON ahaan
    if (rates && rates.rate !== undefined) {
      return res.status(200).json({
        success: true,
        current_rate: rates.rate, // Xogta la soo celinayo
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