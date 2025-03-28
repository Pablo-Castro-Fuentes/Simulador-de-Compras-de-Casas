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

// Convertir CLP a UF
function convertToUF() {
    const ufValue = parseFloat(document.getElementById('uf-value').value);
    const incomeCLP = parseFloat(document.getElementById('income-clp').value);
    if (!isNaN(ufValue) && !isNaN(incomeCLP) && ufValue > 0) {
        const incomeUF = incomeCLP / ufValue;
        document.getElementById('income-uf').value = incomeUF.toFixed(2);
    }
}

// Ajustar el valor máximo de la propiedad según las condiciones
function adjustMaxPropertyValue() {
    const savingsUf = parseFloat(document.getElementById('savings-uf').value);
    const isNewHome = document.getElementById('is-new-home').checked;
    const location = document.getElementById('location').value;
    const maxUF = (isNewHome && savingsUf >= 160) ? 3000 : (location === 'north' || location === 'south') ? 2600 : 2200;
    return maxUF;
}

// Función para calcular el subsidio variable
function calculateSubsidy(totalValue, maxSubsidy, minSubsidy, minRange, maxRange) {
    const propertyValue = totalValue / 1.375; // Ajuste según la lógica del DS1 Tramo 2
    if (propertyValue <= minRange) return maxSubsidy;
    if (propertyValue >= maxRange) return minSubsidy;
    const slope = (maxSubsidy - minSubsidy) / (minRange - maxRange);
    return maxSubsidy + slope * (propertyValue - minRange);
}

// Cargar UF al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    fetchUFValue();
});

// Manejar el formulario
document.getElementById('max-value-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const incomeUF = parseFloat(document.getElementById('income-uf').value);
    const savingsUf = parseFloat(document.getElementById('savings-uf').value);
    const location = document.getElementById('location').value;
    const ufValue = parseFloat(document.getElementById('uf-value').value) || await fetchUFValue();
    const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100;
    const loanTerm = parseInt(document.getElementById('loan-term').value);
    const isNewHome = document.getElementById('is-new-home').checked;
    const isYoungSingle = document.getElementById('is-young-single').checked;

    const resultsDiv = document.getElementById('results');

    // Validaciones
    if (savingsUf < 80 || isNaN(savingsUf)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El ahorro debe ser de al menos 80 UF.</p>`;
        return;
    }
    const maxPropertyValueLimit = (isNewHome && savingsUf >= 160) ? 3000 : (location === 'north' || location === 'south') ? 2600 : 2200;
    if (isNaN(incomeUF) || isNaN(interestRate) || isNaN(loanTerm) || isNaN(ufValue)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">Por favor, completa todos los campos correctamente.</p>`;
        return;
    }

    // Calcular el dividendo máximo según el sueldo
    const incomeMultiplier = isYoungSingle ? 3 : 4;
    const maxMonthlyPayment = incomeUF / incomeMultiplier;

    // Calcular el monto máximo del crédito
    const monthlyRate = interestRate / 12;
    const totalPayments = loanTerm * 12;
    const loanAmount = maxMonthlyPayment * (1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate;

    // Determinar subsidio y valor máximo según ubicación
    let subsidyUF, initialSubsidyUF, maxPropertyValue;
    if (location === 'north') {
        initialSubsidyUF = 950;
        maxPropertyValue = (isNewHome && savingsUf >= 160) ? 3000 : 2600;
        subsidyUF = calculateSubsidy(loanAmount + savingsUf + 950, 500, 350, 1200, 1600);
    } else if (location === 'south') {
        initialSubsidyUF = 1000;
        maxPropertyValue = (isNewHome && savingsUf >= 160) ? 3000 : 2600;
        subsidyUF = calculateSubsidy(loanAmount + savingsUf + 1000, 550, 400, 1200, 1600);
    } else {
        initialSubsidyUF = 850;
        maxPropertyValue = (isNewHome && savingsUf >= 160) ? 3000 : 2200;
        subsidyUF = calculateSubsidy(loanAmount + savingsUf + 850, 400, 250, 1200, 1600);
    }

    // Ajustar por vivienda nueva y ahorro >= 160 UF
    const additionalSubsidyUF = (savingsUf >= 160 && isNewHome) ? 150 : 0;
    let totalSubsidyUF = subsidyUF + additionalSubsidyUF;

    // Calcular valor máximo de la propiedad
    let maxPropertyValuePossible = loanAmount + savingsUf + totalSubsidyUF;
    if (maxPropertyValuePossible < 800) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">No calificas para este subsidio (valor mínimo: 600 UF).</p>`;
        return;
    }
    if (maxPropertyValuePossible > maxPropertyValue) {
        maxPropertyValuePossible = maxPropertyValue;
        totalSubsidyUF = location === 'north' ? 350 : location === 'south' ? 400 : 250;
        totalSubsidyUF += additionalSubsidyUF;
    }

    // Formatear valores
    const formatCurrency = (value) => value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

    // Mostrar resultados
    resultsDiv.innerHTML = `
        <p>Subsidio total estimado: ${totalSubsidyUF.toFixed(2)} UF (${formatCurrency(totalSubsidyUF * ufValue)})</p>
        <p>Monto máximo del crédito: ${loanAmount.toFixed(2)} UF (${formatCurrency(loanAmount * ufValue)})</p>
        <p>Dividendo mensual máximo: ${maxMonthlyPayment.toFixed(2)} UF (${formatCurrency(maxMonthlyPayment * ufValue)})</p>
        <p>Valor máximo de la vivienda: ${maxPropertyValuePossible.toFixed(2)} UF (${formatCurrency(maxPropertyValuePossible * ufValue)})</p>
    `;
});