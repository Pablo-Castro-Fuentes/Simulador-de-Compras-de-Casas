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
        return 0; // Valor por defecto en caso de error
    }
}

// Cargar UF al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    fetchUFValue();
});

// Manejar el formulario
document.getElementById('ds49-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const savingsUf = parseInt(document.getElementById('savings-uf').value);
    const zoneType = document.getElementById('zone-type').value;
    const ufValue = parseFloat(document.getElementById('uf-value').value) || await fetchUFValue();

    // Validar el ahorro
    if (savingsUf > 60) {
        document.getElementById('results').innerHTML = '<p>El ahorro no puede exceder 60 UF.</p>';
        return;
    }

    // Cálculo del subsidio
    const baseSubsidy = 800; // UF
    let totalSubsidy = baseSubsidy;

    if (zoneType === 'urban') {
        totalSubsidy += 100; // Bono adicional para zonas urbanas
    }

    const savingBonus = (savingsUf - 10) * 5; // Premio al ahorro
    totalSubsidy += savingBonus + savingsUf;

    // Formatear en CLP
    const formatCurrency = (value) => value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    const totalCLP = totalSubsidy * ufValue;

    // Mostrar resultado
    document.getElementById('results').innerHTML = `
        <p>Subsidio total: ${totalSubsidy} UF (${formatCurrency(totalCLP)})</p>
    `;
});