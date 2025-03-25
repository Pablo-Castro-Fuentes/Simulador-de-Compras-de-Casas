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
        return 37396.77; // Valor por defecto
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
        incomeDisplay.style.color = '#d9534f';
    }

    fetchUFValue();
});

// Manejar el formulario
document.getElementById('ds1t3-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const income = parseFloat(localStorage.getItem('income'));
    const isYoungSingle = document.getElementById('is-young-single').checked;
    const savingsUf = parseFloat(document.getElementById('savings-uf').value);
    const isNewHome = document.getElementById('is-new-home').checked;
    const location = document.getElementById('location').value;
    const loanTerm = parseInt(document.getElementById('loan-term').value);
    const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100;
    const ufValue = parseFloat(document.getElementById('uf-value').value) || await fetchUFValue();

    const resultsDiv = document.getElementById('results');

    // Validaciones
    if (!income || isNaN(income)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">Error: No hay sueldo registrado. Vuelve a "Subsidios según tu sueldo".</p>`;
        return;
    }
    if (savingsUf < 80 || isNaN(savingsUf) || isNaN(loanTerm) || isNaN(interestRate) || isNaN(ufValue)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">Por favor, completa todos los campos correctamente (Ahorro mínimo: 80 UF).</p>`;
        return;
    }

    // Calcular monto máximo del crédito
    const incomeMultiplier = isYoungSingle ? 3 : 4;
    const monthlyIncomeAvailable = income / incomeMultiplier; 
    const monthlyRate = interestRate / 12;
    const totalPayments = loanTerm * 12;
    const maxLoanAmount = (monthlyIncomeAvailable * (1 - Math.pow(1 + monthlyRate, -totalPayments))) / monthlyRate;
    const maxLoanAmountUF = maxLoanAmount / ufValue;

    // Determinar subsidio y valor máximo según ubicación
    let subsidyUF, initialSubsidyUF, maxPropertyValue;
    if (location === 'north') {
        initialSubsidyUF = 950;
        maxPropertyValue = savingsUf >= 160 && isNewHome ? 3000 : 2600;
        subsidyUF = calculateSubsidy(maxLoanAmountUF + savingsUf + 950, 500, 350, 1200, 1600);
    } else if (location === 'south') {
        initialSubsidyUF = 1000;
        maxPropertyValue = savingsUf >= 160 && isNewHome ? 3000 : 2600;
        subsidyUF = calculateSubsidy(maxLoanAmountUF + savingsUf + 1000, 550, 400, 1200, 1600);
    } else {
        initialSubsidyUF = 850;
        maxPropertyValue = savingsUf >= 160 && isNewHome ? 3000 : 2200;
        subsidyUF = calculateSubsidy(maxLoanAmountUF + savingsUf + 850, 400, 250, 1200, 1600);
    }

    // Ajustar por vivienda nueva y ahorro >= 160 UF
    const additionalSubsidyUF = (savingsUf >= 160 && isNewHome) ? 150 : 0;
    let totalSubsidyUF = subsidyUF + additionalSubsidyUF;

    // Calcular valor máximo de la propiedad
    let propertyValue = maxLoanAmountUF + savingsUf + totalSubsidyUF;
    if (propertyValue < 800) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">No calificas para este subsidio (valor mínimo: 800 UF).</p>`;
        return;
    }
    if (propertyValue > maxPropertyValue) {
        propertyValue = maxPropertyValue;
        totalSubsidyUF = location === 'north' ? 350 : location === 'south' ? 400 : 250;
        totalSubsidyUF += additionalSubsidyUF;
    }

    // Formatear valores
    const formatCurrency = (value) => value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    const totalCLP = propertyValue * ufValue;
    const subsidyCLP = totalSubsidyUF * ufValue;
    const loanCLP = maxLoanAmountUF * ufValue;

    // Mostrar resultados
    resultsDiv.innerHTML = `
        <p>Valor máximo de la vivienda: ${propertyValue.toFixed(2)} UF (${formatCurrency(totalCLP)})</p>
        <p>Crédito máximo: ${maxLoanAmountUF.toFixed(2)} UF (${formatCurrency(loanCLP)})</p>
        <p>Subsidio total: ${totalSubsidyUF.toFixed(2)} UF (${formatCurrency(subsidyCLP)})</p>
    `;
});

// Función para calcular el subsidio variable
function calculateSubsidy(totalValue, maxSubsidy, minSubsidy, minRange, maxRange) {
    const propertyValue = totalValue / 1.375; // Ajuste según tu lógica
    if (propertyValue <= minRange) return maxSubsidy;
    if (propertyValue >= maxRange) return minSubsidy;
    const slope = (maxSubsidy - minSubsidy) / (minRange - maxRange);
    return maxSubsidy + slope * (propertyValue - minRange);
}