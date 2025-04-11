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

// **********************************************
// ** NEW MULTILINEAR REGRESSION FUNCTION      **
// **********************************************

/**
 * Performs Multilinear Regression using the 'regression-js' library.
 * Finds coefficients (β₁, β₂, ...) and intercept (β₀) for the model:
 * Y = β₀ + β₁X₁ + β₂X₂ + ... + β<0xE2><0x82><0x99>X<0xE2><0x82><0x99>
 *
 * @param {number[][]} independentVars - An array of arrays. Each inner array holds the data
 *                                      for one independent variable (X₁, X₂, ...).
 *                                      Example: [[x1_1, x1_2,...], [x2_1, x2_2,...], ...]
 * @param {number[]} dependentVar - An array holding the data for the dependent variable (Y).
 *                                  Example: [y1, y2, y3,...]
 * @param {number} [precision=6] - Optional number of decimal places for coefficients.
 *
 * @returns {object|null} An object containing:
 *                        - `coefficients`: An array of coefficients [β₁, β₂, ...] corresponding
 *                          to the order of `independentVars`.
 *                        - `intercept`: The calculated intercept (β₀).
 *                        - `r2`: The R-squared value (coefficient of determination).
 *                        - `equation`: The raw equation array from the library [β₁, β₂, ..., β₀].
 *                        - `string`: A string representation of the equation.
 *                        Or null if regression cannot be performed (e.g., insufficient data, library missing).
 */
function multilinearRegression(independentVars, dependentVar, precision = 6) {

    // ****** DEBUG LOG ADDED ******
    console.log("DEBUG multilinearRegression: Received independentVars with length:", independentVars ? independentVars.length : 'undefined/null');
    if (independentVars && independentVars.length > 0) {
         console.log("DEBUG multilinearRegression: Length of first independent var array:", independentVars[0] ? independentVars[0].length : 'undefined/null');
    }
     if (independentVars && independentVars.length > 1) {
         console.log("DEBUG multilinearRegression: Length of second independent var array:", independentVars[1] ? independentVars[1].length : 'undefined/null');
     }
     console.log("DEBUG multilinearRegression: Received dependentVar with length:", dependentVar ? dependentVar.length : 'undefined/null');
    // ******************************

    // 1. Check if the regression library is available
    if (typeof regression === 'undefined') {
        console.error("Multilinear Regression Error: The 'regression-js' library is not loaded. Please ensure it's included via <script> tag or imported via npm.");
        return null;
    }

    // 2. Input Validation
    if (!independentVars || independentVars.length === 0) {
        console.error("Multilinear Regression Error: No independent variables provided.");
        return null;
    }
    if (!dependentVar) {
        console.error("Multilinear Regression Error: No dependent variable provided.");
        return null;
    }

    const numIndependentVars = independentVars.length;
    const numDataPoints = dependentVar.length;

    console.log("DEBUG multilinearRegression: Calculated numIndependentVars =", numIndependentVars); 

    if (numDataPoints < numIndependentVars + 1) {
        console.error(`Multilinear Regression Error: Insufficient data points (${numDataPoints}) for ${numIndependentVars} independent variables. Need at least ${numIndependentVars + 1}.`);
        return null;
    }
    if (numDataPoints > 3000) {
        console.warn(`Multilinear Regression Warning: Dataset size (${numDataPoints}) exceeds the stated maximum of 3000. Performance might be affected.`);
        // Continue anyway, regression-js can likely handle more, but good to note.
    }


    // Check if all independent variable arrays have the same length as the dependent variable array
    for (let i = 0; i < numIndependentVars; i++) {
        if (!independentVars[i] || independentVars[i].length !== numDataPoints) {
            console.error(`Multilinear Regression Error: Independent variable #${i + 1} has length ${independentVars[i]?.length ?? 'undefined'}, but dependent variable has length ${numDataPoints}. All arrays must have the same length.`);
            return null;
        }
         // Optional: Check for non-numeric values within arrays (can cause issues)
         /*
         for (let j = 0; j < numDataPoints; j++) {
             if (typeof independentVars[i][j] !== 'number' || isNaN(independentVars[i][j])) {
                 console.error(`Multilinear Regression Error: Non-numeric value found in independent variable #${i+1} at index ${j}.`);
                 return null;
             }
             if (typeof dependentVar[j] !== 'number' || isNaN(dependentVar[j])) {
                  console.error(`Multilinear Regression Error: Non-numeric value found in dependent variable at index ${j}.`);
                 return null;
             }
         }
         */
    }


    // 3. Prepare data for regression-js format
    // It expects an array of data points, where each point is an array:
    // [indepVar1_value, indepVar2_value, ..., indepVarK_value, depVar_value]
    const data = [];
    for (let i = 0; i < numDataPoints; i++) {
        const dataPoint = [];
        // Add independent variable values for this point
        for (let j = 0; j < numIndependentVars; j++) {
            dataPoint.push(independentVars[j][i]);
        }
        // Add the dependent variable value for this point
        dataPoint.push(dependentVar[i]);
        data.push(dataPoint);
    }

     // ****** DEBUG LOG ADDED ******
    // Log the structure of the first couple of points prepared for the library
    if (data.length > 0) {
        console.log("DEBUG multilinearRegression: Sample data point prepared for regression.linear():", JSON.stringify(data[0]));
        console.log(`DEBUG multilinearRegression: Expecting ${numIndependentVars + 1} elements per point.`);
    } else {
         console.log("DEBUG multilinearRegression: No data points prepared.");
    }
    // ******************************

    // 4. Perform Regression
    try {
        // The 'linear' method handles multilinear regression when input points have >2 values
        const result = regression.linear(data, { precision: precision });

         // ****** DEBUG LOG ADDED ******
         console.log("DEBUG multilinearRegression: Raw result from regression.linear:", JSON.stringify(result));
      
         // ******************************

        // The result.equation array contains [coeff1, coeff2, ..., coeffN, intercept]
        const intercept = result.equation.pop(); // Remove and get the last element (intercept)
        const coefficients = result.equation; // The remaining elements are the coefficients

        console.log("DEBUG multilinearRegression: Extracted coefficients:", JSON.stringify(coefficients));
        console.log("DEBUG multilinearRegression: Extracted intercept:", intercept);

        return {
            coefficients: coefficients, // [β₁, β₂, ...]
            intercept: intercept,       // β₀
            r2: result.r2,
            equation: [...coefficients, intercept], // Reconstruct original array if needed
            string: result.string // Optional: Equation as string "y = β₁x₁ + β₂x₂ + ... + β₀"
        };

    } catch (error) {
        console.error("Error during multilinear regression calculation:", error);
        // Common errors might involve collinearity or other data issues.
        return null;
    }
}