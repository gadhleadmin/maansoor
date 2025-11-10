// public/script.js

const rateDisplayElement = document.getElementById('main-rate');
const sourceInfoElement = document.getElementById('source-info');

async function fetchRate() {
    rateDisplayElement.textContent = 'Fetching...'; 
    sourceInfoElement.textContent = 'Xogta waxaa laga soo qabanayaa Supabase...';

    try {
        // Codsiga u dir Serverless Function-ka
        const response = await fetch('/api/get-rate');
        
     // public/script.js - Hagaajinta Response Reading Error
// ... (Koodhka hore) ...

        // Hubi in jawaabtu guulaysatay (Status 200-299)
        if (!response.ok) {
            let errorText = `HTTP error! Status: ${response.status}`;
            
            // 🛑 Tallaabada 1: Akhri jawaabta response-ka hal mar oo keliya text ahaan
            const bodyContent = await response.text(); 
            
            try {
                // Tallaabada 2: Isku day in aad u beddesho JSON content-ka la akhriyay
                const errorData = JSON.parse(bodyContent);
                // Haddii uu si guul leh u beddelo JSON, qaado fariinta error-ka
                errorText = errorData.error || errorData.details || bodyContent;
            } catch (jsonError) {
                // Tallaabada 3: Haddii aanu ahayn JSON (sida HTML/Text), isticmaal text-kaas oo dhan
                errorText = bodyContent;
            }
            
            // Ku tuur khaladka la hagaajiyay
            throw new Error(`Codsiga ma guulaysan: ${errorText.substring(0, 150)}...`);
        }
        
        // Hadda waa hubaal 200 OK, u beddel JSON
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