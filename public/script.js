// =================================================================
// SECTION 1: XULASHADA ELEMENT-YADA HTML (ELEMENT SELECTION)
// =================================================================

// Element-yada Soo Bandhigidda Rate-ka
const rateDisplayElement = document.getElementById('main-rate');
const sourceInfoElement = document.getElementById('source-info');

// Element-yada Soo Bandhigidda Waqtiga/Taariikhda
const dateElement = document.getElementById('real-date');
const timeElement = document.getElementById('real-time');


// =================================================================
// SECTION 2: SHAQADA CUSBOONAYSINATA WAQTIGA & TAARIIKHDA (REAL-TIME CLOCK)
// =================================================================

function updateDateTime() {
    const now = new Date();
    
    // Qaabka Taariikhda: Tusaale: Monday, November 10, 2025
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    // Qaabka Waqtiga: Tusaale: 06:03:59 PM
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
    };

    // Isticmaal 'en-US' ama 'so-SO' (luqadda Soomaaliga)
    const locale = 'en-US'; 

    const formattedDate = now.toLocaleDateString(locale, dateOptions);
    const formattedTime = now.toLocaleTimeString(locale, timeOptions);

    // Hubi in element-yada ay jiraan ka hor inta aan la cusboonaysiinin
    if (dateElement) {
        dateElement.textContent = formattedDate;
    }
    if (timeElement) {
        timeElement.textContent = formattedTime;
    }
}


// =================================================================
// SECTION 3: SHAQADA SOO QABASHADA RATE-KA (SUPABASE FETCH FUNCTION)
// =================================================================
async function fetchRate() {
    // ... (Koodhka hubinta bilowga) ...

    try {
        const response = await fetch('/api/get-rate');
        
        // ... (Koodhka error handling-ka ee hore waa la ilaalinayaa) ...
        
        // U beddel JSON
        const data = await response.json();

        // Xaqiijinta Xogta
        if (data.success && data.current_rate !== undefined) {
            const formattedRate = new Intl.NumberFormat('so-SO').format(data.current_rate);
            
            rateDisplayElement.textContent = formattedRate;
            
            // 🛑 HAGAAGINTA WAXAA LAGA SAARAY WAQTIGII 🛑
            sourceInfoElement.textContent = ''; 

        } else {
            rateDisplayElement.textContent = 'N/A';
            sourceInfoElement.textContent = 'Khalad ku jira xogta la helay.';
            console.error('Data format incorrect:', data);
        }

    } catch (error) {
        // ... (Koodhka catch-ka waa la ilaalinayaa) ...
        console.error("Error fetching the rate:", error);
        rateDisplayElement.textContent = 'Error!';
        sourceInfoElement.textContent = `Waxa dhacay khalad server: ${error.message.substring(0, 50)}...`;
    }
}

// =================================================================
// SECTION 4: BILOWGA SHAQADA (INITIALIZATION)
// =================================================================

// Bilow cusboonaysiinta waqtiga isla markiiba
updateDateTime(); 

// Cusboonaysii waqtiga daqiiqad kasta (1000ms = 1 second)
setInterval(updateDateTime, 1000); 

// Wac shaqada rate-ka 
fetchRate();