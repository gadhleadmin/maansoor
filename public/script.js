// public/script.js

const rateDisplayElement = document.getElementById('main-rate');

async function fetchRate() {
    rateDisplayElement.textContent = 'Fetching rate...'; // Muuji "Fetching" inta la sugayo

    try {
        // Codsiga u dir Serverless Function-ka aad samaysay
        const response = await fetch('/api/get-rate');
        
        // Hubi in jawaabtu guulaysatay
        if (!response.ok) {
            // Haddii jawaab celintu aanay ahayn 200, soo qabso error message-ka
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.success && data.current_rate !== undefined) {
            // Ku qor rate-ka bogga
            const formattedRate = new Intl.NumberFormat('so-SO').format(data.current_rate);
            rateDisplayElement.textContent = formattedRate;
        } else {
            rateDisplayElement.textContent = 'N/A';
            console.error('Data format incorrect:', data);
        }

    } catch (error) {
        console.error("Error fetching the rate:", error);
        rateDisplayElement.textContent = 'Error!';
        // Si aad u tusid fariin cad:
        // rateDisplayElement.textContent = 'Unable to load rate.';
    }
}

// Wac shaqada si ay u bilowdo soo bandhigidda rate-ka marka boggu furmo
fetchRate();