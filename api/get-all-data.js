// file: api/get-all-data.js

// Isticmaal Supabase Node.js SDK
import { createClient } from '@supabase/supabase-js';

// Hubi in variables-ka deegaanka (Environment Variables) lagu daray Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Halkan waxa loo adeegsaday furaha ANONYMOUS, laakiin
// haddii aad u baahan tahay sir, waa in la isticmaalaa furaha SERVICE ROLE KEY
// oo uu kaliya ku yaallo backend-ka.

export default async (req, res) => {
    try {
        // 1. Soo qaado dhammaan sicirka (Rates)
        const { data: rates, error: ratesError } = await supabase
            .from('rates')
            .select('currency, rate, created_at')
            .order('created_at', { ascending: false });

        if (ratesError) throw ratesError;

        // 2. Soo qaado Sariflayaasha (Exchangers)
        const { data: exchangers, error: exchangersError } = await supabase
            .from('sarifle') // Magaca jadwalka oo sax ah
            .select('magaca, lam_sariflaha, sarifle_rate, whatsapp')
            .limit(10)
            .order('sarifle_rate', { ascending: false });

        if (exchangersError) throw exchangersError;
        
        // 3. Soo qaado Wararka ugu dambeeyay (Latest News)
        const { data: news, error: newsError } = await supabase
            .from('news')
            .select('id, title, image_url, content')
            .order('created_at', { ascending: false })
            .limit(3);

        if (newsError) throw newsError;

        // Xisaabi sicirka ugu dambeeyay iyo kii hore (Sida ku jiray index.js)
        const latestRates = {};
        const previousRates = {};
        const seenCurrencies = new Set();
        
        for (const row of rates) {
            if (!seenCurrencies.has(row.currency)) {
                latestRates[row.currency] = row.rate;
                seenCurrencies.add(row.currency);
            } else if (!previousRates[row.currency]) {
                previousRates[row.currency] = row.rate;
            }
        }
        latestRates['SLSH'] = 1; // Ku dar rate-ka aasaasiga ah

        // Ku celceli dhammaan xogta hal JSON ah (Single Source of Truth)
        res.status(200).json({
            success: true,
            message: 'All data fetched successfully from Supabase.',
            allRates: rates,
            latestRates: latestRates,
            previousRates: previousRates,
            exchangers: exchangers,
            latestNews: news
        });

    } catch (error) {
        console.error('Serverless Function Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch all market data.',
            details: error.message 
        });
    }
};