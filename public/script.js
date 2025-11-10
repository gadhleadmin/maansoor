// public/script.js

const rateDisplayElement = document.getElementById('main-rate');
const sourceInfoElement = document.getElementById('source-info');

async function fetchRate() {
    rateDisplayElement.textContent = 'Fetching...'; 
    sourceInfoElement.textContent = 'Xogta waxaa laga soo qabanayaa Supabase...';

    try {
        // Codsiga u dir Serverless Function-ka
        const response = await fetch('/api/get-rate');
        
        // Hubi in jawaabtu guulaysatay (Status 200-299)
        if (!response.ok) {
            let errorText = `HTTP error! Status: ${response.status}`;
            
            try {
                // Isku day in aad u beddesho JSON haddii Serverless Function-ka uu soo celiyay JSON error
                const errorData = await response.json();
                errorText = errorData.error || JSON.stringify(errorData);
            } catch (jsonError) {
                // Haddii uusan ahayn JSON (sida 404 HTML page), qaado text ahaan
                errorText = await response.text();
            }
            
            throw new Error(`Codsiga ma guulaysan: ${errorText.substring(0, 150)}...`);
        }
        
        // U beddel JSON
        const data = await response.json();

        if (data.success && data.current_rate !== undefined) {
            // Halkan waxaan ku isticmaalaynaa 'current_rate'
            
            // Xaqiiji qaabka lacagta (Comma separator)
            const formattedRate = new Intl.NumberFormat('so-SO').format(data.current_rate);
            
            rateDisplayElement.textContent = formattedRate;
            sourceInfoElement.textContent = `Xogta la soo qabtay: ${new Date().toLocaleTimeString('so-SO')}`;

        } else {
            rateDisplayElement.textContent = 'N/A';
            sourceInfoElement.textContent = 'Khalad ku jira xogta la helay.';
            console.error('Data format incorrect:', data);
        }

    } catch (error) {
        console.error("Error fetching the rate:", error);
        rateDisplayElement.textContent = 'Error!';
        sourceInfoElement.textContent = `Waxa dhacay khalad: ${error.message.substring(0, 50)}...`;
    }
}

// Wac shaqada marka boggu furmo
fetchRate();