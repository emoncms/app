/**
 * Performs linear regression on paired data.
 * y = mx + b
 * @param {number[]} x - Array of x values (independent variable, e.g., time in seconds).
 * @param {number[]} y - Array of y values (dependent variable, e.g., ln(deltaT/deltaT0)).
 * @returns {object|null} Object with 'slope' (m) and 'intercept' (b), or null if regression is not possible.
 */
function linearRegression(x, y) {
    const n = x.length;
    if (n < 2 || n !== y.length) {
        console.error("Linear regression requires at least 2 points and equal length arrays.");
        return null; // Not enough data or mismatched arrays
    }

    let sum_x = 0;
    let sum_y = 0;
    let sum_xy = 0;
    let sum_xx = 0;
    let sum_yy = 0; // Needed for R-squared, not strictly required for slope/intercept

    for (let i = 0; i < n; i++) {
        sum_x += x[i];
        sum_y += y[i];
        sum_xy += x[i] * y[i];
        sum_xx += x[i] * x[i];
        sum_yy += y[i] * y[i];
    }

    const denominator = (n * sum_xx - sum_x * sum_x);
    if (Math.abs(denominator) < 1e-10) { // Avoid division by zero if all x are the same
         console.error("Linear regression failed: Denominator is zero (all x values are likely the same).");
         return null;
    }

    const slope = (n * sum_xy - sum_x * sum_y) / denominator;
    const intercept = (sum_y - slope * sum_x) / n;

    // Optional: Calculate R-squared (coefficient of determination)
    let ssr = 0;
    for (let i = 0; i < n; i++) {
        const fit = slope * x[i] + intercept;
        ssr += (fit - sum_y / n) ** 2;
    }
    const sst = sum_yy - (sum_y * sum_y) / n;
    const r2 = (sst === 0) ? 1 : ssr / sst; // Handle case where all y are the same

    return {
        slope: slope,
        intercept: intercept,
        r2: r2 // Uncomment if you want R-squared
    };
}



/**
 * Performs Multilinear Regression using matrix calculations via math.js.
 * Calculates coefficients, standard errors, t-stats, p-values, and confidence intervals.
 * Finds coefficients (β₁, β₂, ...) and intercept (β₀) for the model:
 * Y = β₀ + β₁X₁ + β₂X₂ + ... + β<0xE2><0x82><0x99>X<0xE2><0x82><0x99>
 * Calculates β = (XᵀX)⁻¹XᵀY
 *
 * @param {number[][]} independentVars - Array of arrays for independent variables (X₁, X₂, ...).
 * @param {number[]} dependentVar - Array for the dependent variable (Y).
 * @param {number} [confidenceLevel=0.95] - The desired confidence level for intervals (e.g., 0.95 for 95%).
 *
 * @returns {object|null} An object containing regression results including:
 *                        - `coefficients`: Array [β₁, β₂, ...].
 *                        - `intercept`: The intercept (β₀).
 *                        - `beta`: Full coefficient vector [β₀, β₁, β₂, ...].
 *                        - `r2`: R-squared value.
 *                        - `standardErrors`: Array of SEs for [β₀, β₁, β₂, ...].
 *                        - `tStats`: Array of t-statistics for [β₀, β₁, β₂, ...].
 *                        - `pValues`: Array of p-values for [β₀, β₁, β₂, ...].
 *                        - `confidenceIntervals`: Array of CIs [[lower, upper], ...] for [β₀, β₁, β₂, ...].
 *                        - `degreesOfFreedom`: Error degrees of freedom (n-p).
 *                        Or null if regression fails.
 */
function multilinearRegression(independentVars, dependentVar, confidenceLevel = 0.95) {
    // 1. Check if libraries are available
    if (typeof math === 'undefined') {
        console.error("Multilinear Regression Error: The 'math.js' library is not loaded.");
        return null;
    }
     if (typeof jStat === 'undefined') {
        console.error("Multilinear Regression Error: The 'jStat' library is not loaded (needed for confidence intervals).");
        // Optionally, proceed without CIs, or return null
         // return null;
         console.warn("  >> Proceeding without calculating confidence intervals, p-values, etc.");
    }


    // 2. Input Validation
    if (!independentVars || independentVars.length === 0 || !dependentVar) { /* ... */ return null; }
    const numIndependentVars = independentVars.length;
    const numDataPoints = dependentVar.length;
    const p = numIndependentVars + 1; // Number of parameters (coefficients + intercept)

    if (numDataPoints <= p) { // Need more points than parameters estimated
        console.error(`Multilinear Regression Error: Insufficient data points (${numDataPoints}). Need more than ${p} for ${numIndependentVars} independent vars + intercept.`);
        return null;
    }
    // Check array lengths consistency... (same as before)

    try {
        // 3. Construct Design Matrix X (with intercept column)
        const X_data = [];
        for (let i = 0; i < numDataPoints; i++) {
            const row = [1]; // Intercept column
            for (let j = 0; j < numIndependentVars; j++) {
                row.push(independentVars[j][i]);
            }
            X_data.push(row);
        }
        const X = math.matrix(X_data);

        // 4. Create Dependent Variable Vector Y
        const Y = math.matrix(dependentVar);

        // 5. Calculate Coefficients: β = (XᵀX)⁻¹XᵀY
        const XT = math.transpose(X);
        const XTX = math.multiply(XT, X);
        const XTX_inv = math.inv(XTX); // (XᵀX)⁻¹
        const XTY = math.multiply(XT, Y);
        const beta_vector = math.multiply(XTX_inv, XTY); // Result is a column matrix
        const beta = beta_vector.valueOf().flat(); // .valueOf().flat() converts math.js matrix to plain 1D array

        // beta array is [intercept, coeff_X1, coeff_X2, ...]
        const intercept = beta[0];
        const coefficients = beta.slice(1);

        // 6. Calculate Residuals and SSE
        const Y_predicted_vector = math.multiply(X, beta_vector);
        const residuals_vector = math.subtract(Y, Y_predicted_vector);
        const residuals = residuals_vector.valueOf().flat(); // Plain 1D array of residuals
        const ss_res = residuals.reduce((sum, r) => sum + r * r, 0); // Sum of Squared Errors (SSE)

        // 7. Calculate R-squared
        const Y_mean = math.mean(dependentVar);
        const ss_tot = dependentVar.reduce((sum, y) => sum + Math.pow(y - Y_mean, 2), 0);
        const r2 = (ss_tot === 0) ? 1 : 1 - (ss_res / ss_tot);

        // --- Statistical Inference Calculations ---
        let standardErrors = null, tStats = null, pValues = null, confidenceIntervals = null;
        const degreesOfFreedom = numDataPoints - p;

        if (degreesOfFreedom <= 0) {
            console.warn("Multilinear Regression Warning: Degrees of freedom is not positive. Cannot calculate standard errors or confidence intervals.");
        } else if (typeof jStat !== 'undefined') { // Only proceed if jStat is loaded and df > 0
            try {
                // Estimate variance of residuals: s² = SSE / (n - p)
                const residual_variance = ss_res / degreesOfFreedom;

                // Standard Errors: sqrt(diagonal elements of s² * (XᵀX)⁻¹)
                // math.diag extracts the diagonal from the matrix
                const diag_XTX_inv = math.diag(XTX_inv).valueOf(); // Get diagonal as plain array
                standardErrors = diag_XTX_inv.map(d => math.sqrt(residual_variance * d));

                // t-statistics: coefficient / standard_error
                tStats = beta.map((b, i) => standardErrors[i] === 0 ? NaN : b / standardErrors[i]); // Avoid division by zero

                // p-values (two-tailed test: H0: βj = 0)
                pValues = tStats.map(t => isNaN(t) ? NaN : jStat.studentt.cdf(-Math.abs(t), degreesOfFreedom) * 2);

                // Confidence Intervals: coeff ± t_crit * SE
                const alpha = 1 - confidenceLevel;
                const t_crit = jStat.studentt.inv(1 - alpha / 2, degreesOfFreedom); // Critical t-value

                confidenceIntervals = beta.map((b, i) => {
                    const marginOfError = t_crit * standardErrors[i];
                    return [b - marginOfError, b + marginOfError];
                });

             } catch (statError) {
                 console.error("Error during statistical inference calculations (SE, CI):", statError);
                 // Set inference results to null if calculation fails
                 standardErrors = null; tStats = null; pValues = null; confidenceIntervals = null;
             }
        } // End if jStat available and df > 0


        return {
            coefficients: coefficients, // [β₁, β₂, ...]
            intercept: intercept,       // β₀
            beta: beta,                 // Full vector [β₀, β₁, β₂, ...]
            r2: r2,
            standardErrors: standardErrors, // SE for [β₀, β₁, β₂, ...] or null
            tStats: tStats,             // t-stats for [β₀, β₁, β₂, ...] or null
            pValues: pValues,           // p-values for [β₀, β₁, β₂, ...] or null
            confidenceIntervals: confidenceIntervals, // CIs for [β₀, β₁, β₂, ...] or null
            degreesOfFreedom: degreesOfFreedom,
            sse: ss_res,
            n: numDataPoints,
            p: p
        };

    } catch (error) {
        console.error("Error during multilinear regression calculation using math.js:", error);
        if (error.message && error.message.includes("Cannot calculate inverse")) {
             console.error("  >> This often indicates perfect multicollinearity among independent variables.");
        }
        return null;
    }
}