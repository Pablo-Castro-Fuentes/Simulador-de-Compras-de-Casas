document.getElementById('subsidy-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const income = parseFloat(document.getElementById('total-income').value);
    const householdSize = parseInt(document.getElementById('household-size').value);
    const rent = parseFloat(document.getElementById('rent').value);

    localStorage.setItem('income', income);
    localStorage.setItem('rent', rent);

    const adjustedIncome = (income - rent) / householdSize;
    const percentile = calculatePercentile(adjustedIncome);

    let resultHTML = `<p>Tu percentil de ingreso es: ${percentile}%</p>`;
    resultHTML += '<div class="subsidy-options">';
    resultHTML += getAvailableSubsidies(percentile);
    resultHTML += '</div>';

    document.getElementById('results').innerHTML = resultHTML;
});

function calculatePercentile(income) {
    const thresholds = [
        { max: 69518, percentile: 10 },
        { max: 109984, percentile: 20 },
        { max: 145631, percentile: 30 },
        { max: 181532, percentile: 40 },
        { max: 221249, percentile: 50 },
        { max: 278403, percentile: 60 },
        { max: 353729, percentile: 70 },
        { max: 476523, percentile: 80 },
        { max: 774525, percentile: 90 },
        { max: Infinity, percentile: 100 }
    ];
    return thresholds.find(threshold => income < threshold.max).percentile;
}

function getAvailableSubsidies(percentile) {
    let subsidies = '';
    if (percentile <= 40) {
        subsidies += `
            <article class="subsidy-card">
                <a href="../pages/percentile/ds49.html">
                    <h2>Subsidio DS49</h2>
                    <p>Para el 40% más vulnerable.</p>
                </a>
            </article>
        `;
    }
    if (percentile <= 60) {
        subsidies += `
            <article class="subsidy-card">
                <a href=../pages/percentile/ds1t1.html">
                    <h2>Subsidio DS1 Tramo 1</h2>
                    <p>Compra de viviendas hasta 1.100 UF (hasta 60% de vulnerabilidad).</p>
                </a>
            </article>
        `;
    }
    if (percentile <= 70) {
        subsidies += `
            <article class="subsidy-card">
                <a href="../pages/percentile/ds1t2.html">
                    <h2>Subsidio DS1 Tramo 2</h2>
                    <p>Compra de viviendas hasta 1.600 UF (hasta 70% de vulnerabilidad).</p>
                </a>
            </article>
        `;
    }
    if (percentile <= 100) {
        subsidies += `
            <article class="subsidy-card">
                <a href="../pages/percentile/ds1t3.html">
                    <h2>Subsidio DS1 Tramo 3</h2>
                    <p>Compra de viviendas hasta 2.200 UF (solo requiere RHS).</p>
                </a>
            </article>
        `;
    }
    return subsidies;
}