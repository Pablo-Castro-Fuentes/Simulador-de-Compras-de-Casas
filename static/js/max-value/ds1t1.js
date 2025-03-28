async function fetchUFValue() {
    try {
        const response = await fetch('https://mindicador.cl/api/uf');
        const data = await response.json();
        const ufValue = data.serie[0].valor;
        document.getElementById('uf-value').value = ufValue.toFixed(2);
        return ufValue;
    } catch (error) {
        console.error('Error al obtener el valor de la UF:', error);
        return 37396.77;
    }
}

function convertToUF() {
    const ufValue = parseFloat(document.getElementById('uf-value').value);
    const incomeCLP = parseFloat(document.getElementById('income-clp').value);
    if (!isNaN(ufValue) && !isNaN(incomeCLP) && ufValue > 0) {
        const incomeUF = incomeCLP / ufValue;
        document.getElementById('income-uf').value = incomeUF.toFixed(2);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchUFValue();
});

document.getElementById('max-value-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const incomeUF = parseFloat(document.getElementById('income-uf').value);
    const savingsUf = parseFloat(document.getElementById('savings-uf').value);
    const location = document.getElementById('location').value;
    const ufValue = parseFloat(document.getElementById('uf-value').value) || await fetchUFValue();
    const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100;
    const loanTerm = parseInt(document.getElementById('loan-term').value);
    const isYoungSingle = document.getElementById('is-young-single').checked;

    const resultsDiv = document.getElementById('results');

    // Validaciones
    if (savingsUf < 30 || isNaN(savingsUf)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El ahorro debe ser de al menos 30 UF.</p>`;
        return;
    }
    const maxPropertyValue = location === 'north' ? 1200 : location === 'south' ? 1250 : 1100;
    if (isNaN(incomeUF) || isNaN(interestRate) || isNaN(loanTerm) || isNaN(ufValue)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">Por favor, completa todos los campos correctamente.</p>`;
        return;
    }

    // Determinar el subsidio fijo basado en la ubicación
    let baseSubsidy;
    if (location === 'north') {
        baseSubsidy = 700;
    } else if (location === 'south') {
        baseSubsidy = 750;
    } else {
        baseSubsidy = 600;
    }

    const subsidy = baseSubsidy + savingsUf;

    // Calcular el dividendo máximo según el sueldo
    const incomeMultiplier = isYoungSingle ? 3 : 4;
    const maxMonthlyPayment = incomeUF / incomeMultiplier;

    // Calcular el monto máximo del crédito
    const monthlyRate = interestRate / 12;
    const totalPayments = loanTerm * 12;
    const loanAmount = maxMonthlyPayment * (1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate;

    // Calcular el valor máximo de la vivienda
    let maxPropertyValuePossible = loanAmount + subsidy;
    maxPropertyValuePossible = Math.min(maxPropertyValuePossible, maxPropertyValue);

    // Formatear valores
    const formatCurrency = (value) => value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

    // Mostrar resultados
    resultsDiv.innerHTML = `
        <p>Subsidio total: ${subsidy.toFixed(2)} UF (${formatCurrency(subsidy * ufValue)})</p>
        <p>Monto máximo del crédito: ${loanAmount.toFixed(2)} UF (${formatCurrency(loanAmount * ufValue)})</p>
        <p>Dividendo mensual máximo: ${maxMonthlyPayment.toFixed(2)} UF (${formatCurrency(maxMonthlyPayment * ufValue)})</p>
        <p>Valor máximo de la vivienda: ${maxPropertyValuePossible.toFixed(2)} UF (${formatCurrency(maxPropertyValuePossible * ufValue)})</p>
    `;
});