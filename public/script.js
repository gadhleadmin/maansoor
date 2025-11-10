async function fetchData() {
    const response = await fetch('/api/my-function'); // U codso Serverless Function
    const data = await response.json();

    document.getElementById('message').textContent = data.message;
}

// Si toos ah u wac marka boggu furmo (haddii loo baahdo)
fetchData();