// public/script.js

const rateDisplayElement = document.getElementById('main-rate');
const sourceInfoElement = document.getElementById('source-info');

async function fetchRate() {
    rateDisplayElement.textContent = 'Fetching...'; 
    sourceInfoElement.textContent = 'Xogta waxaa laga soo qabanayaa Server...';

    try {
        const response = await fetch('/api/get-rate');
        
        // Hubi in jawaabtu guulaysatay (Status 200-299)
        if (!response.ok) {
            let errorText = `HTTP error! Status: ${response.status}`;
            
            // 🛑 Akhri jawaabta response-ka hal mar oo keliya text ahaan
            const bodyContent = await response.text(); 
            
            try {
                // Isku day in aad u beddesho JSON
                const errorData = JSON.parse(bodyContent);
                errorText = errorData.error || errorData.details || bodyContent;
            } catch (jsonError) {
                // Haddii aanu ahayn JSON, isticmaal text-kaas oo dhan
                errorText = bodyContent;
            }
            
            throw new Error(`Codsiga ma guulaysan: ${errorText.substring(0, 150)}...`);
        }
        
        // Hadda waa hubaal 200 OK, u beddel JSON
        const data = await response.json();

        if (data.success && data.current_rate !== undefined) {
            // Xaqiiji qaabka lacagta (Comma separator)
            const formattedRate = new Intl.NumberFormat('so-SO').format(data.current_rate);
            
            rateDisplayElement.textContent = formattedRate;
            sourceInfoElement.textContent = `Rate-ka La Helay: ${new Date().toLocaleTimeString('so-SO')}`;

        } else {
            rateDisplayElement.textContent = 'N/A';
            sourceInfoElement.textContent = 'Khalad ku jira xogta la helay.';
            console.error('Data format incorrect:', data);
        }

    } catch (error) {
        console.error("Error fetching the rate:", error);
        rateDisplayElement.textContent = 'Error!';
        sourceInfoElement.textContent = `Waxa dhacay khalad server: ${error.message.substring(0, 50)}...`;
    }
}

// Wac shaqada marka boggu furmo
fetchRate();

