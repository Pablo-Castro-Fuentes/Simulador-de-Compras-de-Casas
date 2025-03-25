// Función para obtener el valor de la UF desde la API
async function fetchUFValue() {
    try {
        const response = await fetch('https://mindicador.cl/api/uf');
        const data = await response.json();
        const ufValue = data.serie[0].valor;
        document.getElementById('uf-value').value = ufValue.toFixed(2);
        return ufValue;
    } catch (error) {
        console.error('Error al obtener el valor de la UF:', error);
        return 0;
    }
}

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    const income = localStorage.getItem('income');
    const incomeDisplay = document.getElementById('income-display');
    
    if (income && !isNaN(income)) {
        incomeDisplay.textContent = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(income);
    } else {
        incomeDisplay.textContent = 'No se encontró sueldo. Por favor, regresa a "Subsidios según tu sueldo".';
        incomeDisplay.style.color = '#d9534f'; // Rojo para advertencia
    }

    fetchUFValue();
});

// Manejar el formulario
document.getElementById('ds1t1-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const income = parseFloat(localStorage.getItem('income'));
    const savingsUf = parseFloat(document.getElementById('savings-uf').value);
    const location = document.getElementById('location').value;
    const loanTerm = parseInt(document.getElementById('loan-term').value);
    const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100;
    const ufValue = parseFloat(document.getElementById('uf-value').value) || await fetchUFValue();

    const resultsDiv = document.getElementById('results');

    // Validar datos
    if (!income || isNaN(income)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">Error: No hay sueldo registrado. Vuelve a "Subsidios según tu sueldo".</p>`;
        return;
    }
    if (savingsUf < 30 || isNaN(savingsUf) || isNaN(loanTerm) || isNaN(interestRate) || isNaN(ufValue)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">Por favor, completa todos los campos correctamente (Ahorro mínimo: 30 UF).</p>`;
        return;
    }

    // Calcular monto máximo del crédito
    const monthlyIncomeAvailable = income / 4; // 25% del ingreso para el dividendo
    const monthlyRate = interestRate / 12;
    const totalPayments = loanTerm * 12;
    const maxLoanAmount = (monthlyIncomeAvailable * (1 - Math.pow(1 + monthlyRate, -totalPayments))) / monthlyRate;
    const maxLoanAmountUF = maxLoanAmount / ufValue;

    // Determinar subsidio según ubicación
    const subsidyUF = location === 'north' ? 700 : location === 'south' ? 750 : 600;

    // Calcular valor máximo de la vivienda
    let maxPropertyValue = maxLoanAmountUF + subsidyUF + savingsUf;
    const maxUF = location === 'north' ? 1200 : location === 'south' ? 1250 : 1100;
    if (maxPropertyValue > maxUF) {
        maxPropertyValue = maxUF;
    }

    // Formatear valores
    const formatCurrency = (value) => value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    const totalCLP = maxPropertyValue * ufValue;
    const subsidyCLP = subsidyUF * ufValue;

    // Mostrar resultados
    resultsDiv.innerHTML = `
        <p>Valor máximo de la vivienda: ${maxPropertyValue.toFixed(2)} UF (${formatCurrency(totalCLP)})</p>
        <p>Subsidio DS1 Tramo 1: ${subsidyUF} UF (${formatCurrency(subsidyCLP)})</p>
    `;
});