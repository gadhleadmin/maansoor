// file: public/script.js (La hagaajiyay si uu ula shaqeeyo Vercel Function)

// ----------------------------------------------------
// Qaybta AASAASIGA AH: Isbeddelada Guud
// ----------------------------------------------------

// Isbeddelada guud si ay u kaydiyaan xogta iyo noocyada sawirrada
let allRates = [];
let chartInstance = null;
let latestRates = {};
let previousRates = {};


document.addEventListener('DOMContentLoaded', async () => {
    // U wac shaqadan cusub si ay u soo qaadato DHAMMAAN xogta
    await fetchAllDataAndRender();
    
    // Ku wac shaqadan crypto-ga (Waa inuu weli si toos ah ula xiriiro CoinGecko API)
    await fetchAndRenderCrypto();

    // Ku wac shaqadan saadaasha si loo helo saadaalinta
    updatePrediction();
    
    // Deji Listeners-ka (Waa inuu ku jiraa halkan hadda, sababtoo ah 'convertCurrency' wuxuu u baahan yahay latestRates)
    setupConverterListeners();
    setupEventListeners(); // Sariflayaasha 'View All'

    // Bilow saacadda
    setInterval(updateDateTime, 1000);
    updateDateTime();
});


// ----------------------------------------------------
// Qaybta 1: Soo Xog-qaadista Vercel Serverless Function
// ----------------------------------------------------

async function fetchAllDataAndRender() {
    try {
        // Ku beddel qoraalka 'Loading...' inta xogta la sugayo
        const loadingElements = document.querySelectorAll('.stat-value, #main-rate, .news-placeholder, #exchangersTableBody');
        loadingElements.forEach(el => el.innerText = 'Loading...');
        document.getElementById('source-info').textContent = 'Xogta waxaa laga soo qabanayaa Server...';


        // 🛑 Wac Vercel Serverless Function 🛑
        const response = await fetch('/api/get-all-data'); 

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Serverless function returned unsuccessful status.');
        }

        // Ku kaydi xogta la helay isbeddelada guud
        allRates = data.allRates;
        latestRates = data.latestRates;
        previousRates = data.previousRates;

        // Cusboonaysii bogga HTML
        updateUI(latestRates, previousRates);
        
        // Cusboonaysii qaybta tirakoobyada
        updateStatistics(allRates);
        
        // U wac shaqada Sariflayaasha
        renderExchangersTable(data.exchangers);
        
        // U wac shaqada Wararka
        renderLatestNews(data.latestNews);

        // U wac shaqada si ay u abuurto jadwalka (chart)
        const defaultCurrency = 'USD';
        updateChart(defaultCurrency);
        
        document.getElementById('source-info').textContent = 'Xogta waxaa si guul ah loo helay.';


    } catch (err) {
        console.error("Error fetching all data from Vercel Function:", err);
        const errorElements = document.querySelectorAll('.stat-value, #main-rate');
        errorElements.forEach(el => el.innerText = 'Error');
        document.getElementById('source-info').textContent = `Khalad xog-qabad: ${err.message.substring(0, 50)}...`;
    }
}


// ----------------------------------------------------
// Qaybta 2: Cusboonaysiinta UI (User Interface) iyo Isbeddelka Lacagaha
// ----------------------------------------------------

function updateUI(latestRates, previousRates) {
    const getSafeRate = (rate, decimals = 0) => {
        if (rate === null || typeof rate === 'undefined') return 'N/A';
        return Number(rate).toFixed(decimals);
    };

    // Muuji qiimaha aasaasiga ah ee SLSH (USD/SLSH)
    document.getElementById('main-rate').innerText = latestRates['USD'] ? 
        Number(latestRates['USD']).toLocaleString('so-SO') : 'N/A';

    const currencies = ['USD', 'EUR', 'GBP', 'ETB', 'KES', 'SOS', 'SAR', 'AED'];
    currencies.forEach(currency => {
        const valueElement = document.getElementById(`${currency.toLowerCase()}-rate-value`);
        // *Qaybta ChangeElement waa laga saaray HTML-kii hore, laakiin haddii aad dib u hesho isticmaal*

        // Halkan waxaan ku hagaajinaynaa in kaararka yaryar ay tusaan qiimaha
        // (Waa in loo qeybiyaa USD si loo helo qiimaha USD-da ku salaysan)
        if (valueElement && currency !== 'USD') {
            // SLSH / EUR = X
            const rateValue = latestRates[currency] ? latestRates['USD'] / latestRates[currency] : null; 
            valueElement.innerText = rateValue ? `1 USD = ${rateValue.toFixed(2)} ${currency}` : 'N/A';
        } else if (valueElement && currency === 'USD') {
             // USD/SLSH rate wuxuu ku jiraa main-rate
             valueElement.innerText = latestRates['USD'] ? `1 USD = ${Number(latestRates['USD']).toLocaleString('so-SO')} SLSH` : 'N/A';
        }

    });
}


// ----------------------------------------------------
// Qaybta 3: SHAQADA CONVERTER-KA (U beddelidda)
// ----------------------------------------------------

function convertCurrency() {
    const fromAmountInput = document.getElementById('from-amount');
    const toAmountInput = document.getElementById('to-amount');
    const fromCurrencySelect = document.getElementById('from-currency');
    const toCurrencySelect = document.getElementById('to-currency');

    const fromAmount = parseFloat(fromAmountInput.value);
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;

    if (isNaN(fromAmount) || Object.keys(latestRates).length === 0) {
        toAmountInput.value = 'N/A';
        return;
    }

    // Qiimaha sarrifka ugu weyn ee USD
    const mainUSDRate = latestRates['USD'];

    // Qiimaha SLSH: 1, Lacagaha kale: SLSH / Ratekaas
    const getRateInSLSH = (currency) => {
        if (currency === 'SLSH') return 1;
        // Tusaale: USD wuxuu qiimihiisu yahay 25000 SLSH
        return latestRates[currency]; // Waa qiimaha: 1 unit = X SLSH
    };

    const fromRateInSLSH = getRateInSLSH(fromCurrency);
    const toRateInSLSH = getRateInSLSH(toCurrency);
    
    let convertedAmount;

    // Xisaabinta gaarka ah ee sarrifka u dhexeeya SLSH iyo USD
    if (fromCurrency === 'SLSH' && toCurrency === 'USD') {
        // SLSH loo sarrifayo USD (Iibsi)
        convertedAmount = fromAmount / mainUSDRate; 
    } else if (fromCurrency === 'USD' && toCurrency === 'SLSH') {
        // USD loo sarrifayo SLSH (Iibin)
        const adjustedRate = mainUSDRate - 100; // Tusaale: laga jarayo 100 SLSH
        convertedAmount = fromAmount * adjustedRate;
    } else if (fromCurrency === toCurrency) {
        convertedAmount = fromAmount;
    }
    else {
        // Xisaabinta caadiga ah ee lacagaha kale
        // 1. U beddel SLSH
        const amountInSLSH = fromAmount * fromRateInSLSH;
        // 2. U beddelo lacagta la rabo (SLSH / ToRateInSLSH)
        convertedAmount = amountInSLSH / toRateInSLSH;
    }

    toAmountInput.value = convertedAmount.toFixed(2);
}

function setupConverterListeners() {
    const fromAmountInput = document.getElementById('from-amount');
    const fromCurrencySelect = document.getElementById('from-currency');
    const toCurrencySelect = document.getElementById('to-currency');

    // Dhageystayaasha waxa ay la socdaan isbeddelada ka dhaca foomka lacagaha
    fromAmountInput.addEventListener('input', convertCurrency);
    fromCurrencySelect.addEventListener('change', convertCurrency);
    toCurrencySelect.addEventListener('change', convertCurrency);
    convertCurrency(); // U wac bilowga
}

// ... (Qaybaha kale ee koodhka hore ee `index.js` ee aan u baahnayn in la beddelo) ...
// (updateDateTime, updateStatistics, updateChart, updatePrediction, shareBtn listener,
// darkModeToggle, languageSwitcher, notifications, search)

// ----------------------------------------------------
// Qaybta 4: Xisaabinta Tirakoobyada (Waa sidii hore)
// ----------------------------------------------------
function updateChart(currency) {
    const ctx = document.getElementById('rateChart');
    if (!ctx) return;

    // Shaandhee xogta lacagta la doortay oo ku kala saar taariikh ahaan
    const chartData = allRates
        .filter(d => d.currency === currency)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Diyaarinta xogta jadwalka
    const labels = chartData.map(d => new Date(d.created_at).toLocaleDateString());
    const dataPoints = chartData.map(d => d.rate);

    // Burburi jadwalkii hore haddii uu jiro
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Abuur jadwalka cusub ee Chart.js
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${currency}/SLSH Rate`,
                data: dataPoints,
                borderColor: '#1e40af',
                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}


// ----------------------------------------------------
// Qaybta 5: Saadaalinta Isbeddelka Sicirka Lacagta ⬅️ HAGAAJIN (Waa inuu jiraa)
// ----------------------------------------------------
function updatePrediction() {
    const today = new Date();
    const dayOfMonth = today.getDate(); 

    const upPercentElement = document.getElementById('up-percent');
    const downPercentElement = document.getElementById('down-percent');
    const upButton = document.getElementById('up-prediction-btn');
    const downButton = document.getElementById('down-prediction-btn');

    if (!upPercentElement || !downPercentElement || !upButton || !downButton) {
        console.error("One or more prediction elements not found.");
        return;
    }

    const randomPrediction = (Math.random() * 2.4 + 0.1).toFixed(1);

    if (dayOfMonth >= 28 || dayOfMonth <= 10) {
        upPercentElement.innerText = randomPrediction;
        downPercentElement.innerText = '...';
        upButton.disabled = false;
        downButton.disabled = true;
    } else {
        downPercentElement.innerText = randomPrediction;
        upPercentElement.innerText = '...';
        upButton.disabled = true;
        downButton.disabled = false;
    }
}


// ----------------------------------------------------
// Qaybta 6: Taariikhda iyo Waqtiga ⬅️ HAGAAJIN (Waa inuu jiraa)
// ----------------------------------------------------
function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    document.getElementById('real-date').innerText = now.toLocaleDateString('en-US', dateOptions);
    document.getElementById('real-time').innerText = now.toLocaleTimeString('en-US', timeOptions);
}