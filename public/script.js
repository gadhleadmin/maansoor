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
function updateStatistics(allRates) {
    // Shaandhee xogta si aad u hesho kaliya USD
    const usdRates = allRates.filter(d => d.currency === 'USD');

    if (usdRates.length === 0) {
        console.warn("No USD data found for statistics.");
        document.getElementById('all-time-high').innerText = 'N/A';
        document.getElementById('all-time-low').innerText = 'N/A';
        document.getElementById('last-24h-change').innerText = 'N/A';
        document.getElementById('last-7d-change').innerText = 'N/A';
        return;
    }

    // Xisaabi sicirka ugu sarreeya iyo kan ugu hooseeya
    const rateValues = usdRates.map(d => Number(d.rate));
    const allTimeHigh = Math.max(...rateValues);
    const allTimeLow = Math.min(...rateValues);

    document.getElementById('all-time-high').innerText = `${allTimeHigh.toLocaleString('so-SO')} SLSH`;
    document.getElementById('all-time-low').innerText = `${allTimeLow.toLocaleString('so-SO')} SLSH`;

    // Xisaabi isbeddelka 24-kii saac ee la soo dhaafay
    const now = new Date();
    const twentyFourHoursAgo = now.getTime() - (24 * 60 * 60 * 1000);
    const ratesLast24h = usdRates.filter(d => new Date(d.created_at).getTime() >= twentyFourHoursAgo);

    if (ratesLast24h.length >= 2) {
        const latestRate = Number(ratesLast24h[0].rate);
        const previousRate = Number(ratesLast24h[ratesLast24h.length - 1].rate);
        const change24h = (latestRate - previousRate) / previousRate * 100;
        const changeText = `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`;

        const changeElement = document.getElementById('last-24h-change');
        changeElement.innerText = changeText;
        changeElement.classList.remove('change-up', 'change-down');
        if (change24h > 0) changeElement.classList.add('change-up');
        else if (change24h < 0) changeElement.classList.add('change-down');
    } else {
        document.getElementById('last-24h-change').innerText = 'N/A';
    }

    // Xisaabi isbeddelka 7-dii maalmood ee la soo dhaafay
    const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const ratesLast7d = usdRates.filter(d => new Date(d.created_at).getTime() >= sevenDaysAgo);

    if (ratesLast7d.length >= 2) {
        const latestRate = Number(ratesLast7d[0].rate);
        const previousRate = Number(ratesLast7d[ratesLast7d.length - 1].rate);
        const change7d = (latestRate - previousRate) / previousRate * 100;
        const changeText = `${change7d > 0 ? '+' : ''}${change7d.toFixed(2)}%`;

        const changeElement = document.getElementById('last-7d-change');
        changeElement.innerText = changeText;
        changeElement.classList.remove('change-up', 'change-down');
        if (change7d > 0) changeElement.classList.add('change-up');
        else if (change7d < 0) changeElement.classList.add('change-down');
    } else {
        document.getElementById('last-7d-change').innerText = 'N/A';
    }
}


// ----------------------------------------------------
// Qaybta 5: Sariflayaasha (Render Exchangers)
// ----------------------------------------------------

function renderExchangersTable(exchangers) {
    const tableBody = document.getElementById('exchangersTableBody');
    tableBody.innerHTML = ''; // Nadiifi

    if (!exchangers || exchangers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">Wali ma jiraan wax sariflayaal ah oo la diiwaangeliyey.</td></tr>';
        return;
    }

    // Ku shub xogta la helay miiska
    exchangers.forEach(exchanger => {
        const row = tableBody.insertRow();
        
        let cell = row.insertCell();
        cell.textContent = exchanger.magaca || 'N/A';

        cell = row.insertCell();
        cell.textContent = exchanger.lam_sariflaha || 'N/A';

        cell = row.insertCell();
        const rateValue = exchanger.sarifle_rate;
        cell.textContent = rateValue ? parseFloat(rateValue).toLocaleString('en-US') : 'N/A';

        cell = row.insertCell();
        const whatsappLinkValue = exchanger.whatsapp;
        if (whatsappLinkValue && whatsappLinkValue.includes('wa.me')) {
            const whatsappLink = document.createElement('a');
            whatsappLink.href = whatsappLinkValue;
            whatsappLink.textContent = 'WhatsApp';
            whatsappLink.target = '_blank';
            whatsappLink.classList.add('whatsapp-link');
            cell.appendChild(whatsappLink);
        } else {
            cell.textContent = 'N/A';
        }
    });
}

function setupEventListeners() {
    const viewAllBtn = document.getElementById('viewAllBtn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            alert('Wad shaqada "View All Sarifayaasha"');
        });
    }
}

// ----------------------------------------------------
// Qaybta 6: Wararka (Render News)
// ----------------------------------------------------

function getShortContent(content) {
    const words = content.split(' ');
    const shortWords = words.slice(0, 10);
    return shortWords.join(' ') + '...';
}

function renderLatestNews(news) {
    const latestNewsContainer = document.querySelector('#latest-news');
    latestNewsContainer.innerHTML = ''; // Nadiifi

    if (news && news.length > 0) {
        news.forEach(item => {
            const newsItem = document.createElement('a');
            newsItem.href = `/newspost?id=${item.id}`;
            newsItem.classList.add('news-item');

            const previewContent = getShortContent(item.content);

            newsItem.innerHTML = `
                <div class="news-image">
                    <img src="${item.image_url || '../images/newsicon.png'}" alt="${item.title}">
                </div>
                <div class="news-content">
                    <h4>${item.title}</h4>
                    <p>${previewContent}</p>
                </div>
            `;
            latestNewsContainer.appendChild(newsItem);
        });
    } else {
        latestNewsContainer.innerHTML = '<p>No news found.</p>';
    }
}

// ----------------------------------------------------
// Qaybta 7: Crypto Rates (Waa sidii hore, weli waxay toos ula xiriiraan CoinGecko)
// ----------------------------------------------------

async function fetchAndRenderCrypto() {
    const cryptoGrid = document.getElementById('crypto-cards-grid');
    if (!cryptoGrid) return;
    cryptoGrid.innerHTML = `<div class="loading-state"><p>Loading crypto data...</p></div>`;


    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=8&page=1&sparkline=false');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        renderCryptoCards(data); 

    } catch (error) {
        console.error("Error fetching crypto data:", error);
        if (cryptoGrid) {
            cryptoGrid.innerHTML = `<p class="error-state">Failed to load crypto data. Please try again later.</p>`;
        }
    }
}

function renderCryptoCards(cryptos) {
    const cryptoGrid = document.getElementById('crypto-cards-grid');
    if (!cryptoGrid) return;

    cryptoGrid.innerHTML = ''; // Nadiifi

    cryptos.forEach(crypto => {
        const priceChange = crypto.price_change_percentage_24h.toFixed(2);
        const card = document.createElement('div');
        card.className = 'crypto-card';
        card.innerHTML = `
            <img src="${crypto.image}" alt="${crypto.name}" class="crypto-icon">
            <div class="crypto-info">
                <h3>${crypto.name} (${crypto.symbol.toUpperCase()})</h3>
                <p class="crypto-price">$${crypto.current_price.toFixed(2)}</p>
                <p class="crypto-change ${priceChange >= 0 ? 'up' : 'down'}">
                    ${priceChange >= 0 ? '▲' : '▼'} ${priceChange}% (24h)
                </p>
            </div>
        `;
        cryptoGrid.appendChild(card);
    });
}


// ... (Koodhka kale: updateDateTime, updateChart, updatePrediction, sharing, search, dark mode, language, notifications) ...


// Xusuusin: Waa in aad ku xirtaa marka boggu shaqeeyo (Hadda waxay ku jiraan document.addEventListener('DOMContentLoaded', ...)-kii ugu horreeyay).