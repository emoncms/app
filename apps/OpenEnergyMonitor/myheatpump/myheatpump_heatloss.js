/* Plotly Heat Loss Plot Implementation */

// --- Color Management (Optional but helps match scatter/line) ---
const plotColors = [
    '#FF6347', // Tomato
    '#4682B4', // SteelBlue
    '#32CD32', // LimeGreen
    '#FFD700', // Gold
    '#6A5ACD', // SlateBlue
    '#DAA520', // GoldenRod
    '#8A2BE2', // BlueViolet
    '#5F9EA0', // CadetBlue
    '#D2691E', // Chocolate
    '#FF7F50', // Coral
];
let colorIndex = 0;

function getNextPlotColor() {
    const color = plotColors[colorIndex % plotColors.length];
    colorIndex++;
    return color;
}
function resetPlotColorIndex() {
    colorIndex = 0;
}

/**
 * Reads and validates inputs from the Heat Loss plot settings UI.
 * (Identical to original - no changes needed here)
 * @returns {object|null} An object containing validated configuration, or null if validation fails.
 */
function getHeatLossInputs() {
    const config = {};

    // Basic settings
    config.bargraph_mode = bargraph_mode; // Use global bargraph_mode
    config.minDeltaT = parseFloat($("#heatloss_min_deltaT").val());
    if (isNaN(config.minDeltaT)) {
        console.warn("Heat Loss Plot: Invalid Minimum ΔT input, using no minimum.");
        config.minDeltaT = -Infinity;
    }

    // Fixed Room Temperature settings
    config.useFixedRoomT_input = $("#heatloss_fixed_roomT_check").is(":checked");
    config.fixedRoomTValue_input = parseFloat($("#heatloss_fixed_roomT_value").val());
    if (isNaN(config.fixedRoomTValue_input)) {
        config.fixedRoomTValue_input = 20; // Default if invalid
        console.warn("Heat Loss Plot: Invalid Fixed Room Temp input, using default 20°C.");
    }
    // Determine actual value to use (considering feed availability later)
    config.fixedRoomTValue = config.fixedRoomTValue_input;

    // Feed configuration status
    config.roomTempFeedConfigured = !!feeds["heatpump_roomT"];
    config.outsideTempFeedConfigured = !!feeds["heatpump_outsideT"];

    // Decide if fixed T should be used
    config.shouldUseFixedRoomT = config.useFixedRoomT_input || !config.roomTempFeedConfigured;

    // Splitting settings
    config.splitDataEnabled = $("#heatloss_split_data_check").is(":checked");
    config.splitByValue = null;
    if (config.splitDataEnabled) {
        var $checkedRadio = $('input[name="heatloss_split_by"]:checked');
        if ($checkedRadio.length > 0) {
            config.splitByValue = $checkedRadio.val(); // 'year' or 'season'
        } else {
            console.warn("Heat Loss Plot: Split data enabled, but no split dimension selected. Disabling split.");
            config.splitDataEnabled = false; // Disable if no dimension selected
        }
    }
    config.splitRegressionEnabled = config.splitDataEnabled && $("#heatloss_split_regression_check").is(":checked"); // Regression split only possible if data is split

     // Color by solar gain?
    config.solarColoringEnabled = $("#heatloss_solar_gain_color").is(":checked");

    // Keys for accessing data
    config.heatKey = config.bargraph_mode + "_heat_kwh";
    config.insideTKey = "combined_roomT_mean";
    config.outsideTKey = "combined_outsideT_mean";
    config.solarEKey = "combined_solar_kwh";

    console.log("Heat Loss Inputs:", config);
    return config;
}


/**
 * Checks if the necessary data is available for plotting based on the configuration.
 * (Identical to original - no changes needed here)
 * @param {object} config - The configuration object from getHeatLossInputs.
 * @param {object} daily_data - The global daily_data object.
 * @returns {{sufficient: boolean, messages: string[]}} An object indicating sufficiency and any error/warning messages.
 */
function checkDataSufficiency(config, daily_data) {
    let isDataSufficient = true;
    const messages = [];

    if (typeof daily_data === 'undefined' || $.isEmptyObject(daily_data)) {
        return { sufficient: false, messages: ["Daily data not loaded yet."] };
    }

    // 1. Check Heat Data
    if (!daily_data[config.heatKey] || daily_data[config.heatKey].length === 0) {
        isDataSufficient = false;
        messages.push(`Heat data ('${config.heatKey}') not found for the selected mode.`);
        console.log("Heat Loss Plot: Missing or empty data for key:", config.heatKey);
    }

    // 2. Check Outside Temp Data
    if (!config.outsideTempFeedConfigured) {
        isDataSufficient = false;
        messages.push("Outside Temperature feed not configured.");
        console.log("Heat Loss Plot: Outside Temperature feed not configured.");
    } else if (!daily_data[config.outsideTKey] || daily_data[config.outsideTKey].length === 0) {
        isDataSufficient = false;
        messages.push(`Outside temperature data ('${config.outsideTKey}') not found or empty.`);
        console.log("Heat Loss Plot: Missing or empty data for key:", config.outsideTKey);
    }

    // 3. Check Inside Temp Data (Only if needed)
    if (!config.shouldUseFixedRoomT) {
        if (!config.roomTempFeedConfigured) {
            isDataSufficient = false;
            messages.push("Room Temperature feed not configured (and fixed value not selected).");
            console.log("Heat Loss Plot: Room Temperature feed not configured (and fixed value not selected).");
        } else if (!daily_data[config.insideTKey] || daily_data[config.insideTKey].length === 0) {
            isDataSufficient = false;
            messages.push(`Inside temperature data ('${config.insideTKey}') not found or empty (and fixed value not selected).`);
            console.log("Heat Loss Plot: Missing or empty inside temp data (and fixed value not selected):", config.insideTKey);
        }
    }

    return { sufficient: isDataSufficient, messages: messages };
}

/**
 * Prepares the data for the heat loss scatter plot, handling splitting if enabled.
 * MODIFIED: Added 'timestamps' array to groups. Removed color assignment here.
 * @param {object} config - The configuration object.
 * @param {object} daily_data - The global daily_data object.
 * @returns {object|null} An object containing grouped data { groupKey: { xValues:[], yValues:[], timestamps:[], label:'' } },
 *                        and overallMinX, overallMaxX, totalPoints. Returns null if no valid points found.
 */
function prepareHeatLossPlotData(config, daily_data) {
    console.log("Heat Loss Plot: Preparing data...");
    if (config.shouldUseFixedRoomT) {
        console.log("Heat Loss Plot: Using fixed room temperature:", config.fixedRoomTValue, "°C");
        if (!config.roomTempFeedConfigured && config.useFixedRoomT_input) {
            console.log("Heat Loss Plot: Note - Fixed room temperature is being used because the Room Temperature feed is not configured.");
        }
    } else {
        console.log("Heat Loss Plot: Using dynamic room temperature feed data ('" + config.insideTKey + "').");
    }

    const outsideTMap = new Map(daily_data[config.outsideTKey]);
    const insideTMap = (!config.shouldUseFixedRoomT && daily_data[config.insideTKey]) ? new Map(daily_data[config.insideTKey]) : null;
    const heatDataArray = daily_data[config.heatKey];
    
    // --- START: Fetch and Map Solar Data ---
    const solarDataArray = daily_data[config.solarEKey];
    let solarDataMap = null;
    let solarDataAvailable = false;
    if (solarDataArray && solarDataArray.length > 0) {
        solarDataMap = new Map(solarDataArray);
        solarDataAvailable = true;
        console.log("Heat Loss Plot: Solar data found and mapped for key:", config.solarEKey);
    } else {
        console.log("Heat Loss Plot: Solar data not found or empty for key:", config.solarEKey);
        // Continue without solar data, coloring will default later if enabled
    }
    // --- END: Fetch and Map Solar Data ---

    console.log("Heat Loss Plot: Processing", heatDataArray.length, "days of data for mode", config.bargraph_mode);

    // --- Data Grouping Logic ---
    const groupedData = {};
    let overallMinX = Infinity;
    let overallMaxX = -Infinity;
    let totalPoints = 0;
    // Color assignment moved to plotting stage

    for (let i = 0; i < heatDataArray.length; i++) {
        const timestamp = heatDataArray[i][0]; // Assuming timestamp is in milliseconds
        const heatValue = heatDataArray[i][1] / 24.0; // kWh to kW

        const outsideTValue = outsideTMap.get(timestamp);
        let insideTValue;

        if (config.shouldUseFixedRoomT) {
            insideTValue = config.fixedRoomTValue;
        } else if (insideTMap) {
            insideTValue = insideTMap.get(timestamp);
        } else {
            insideTValue = null; // Should not happen if sufficiency check passed
        }

        // --- START: Get Solar Value ---
        let solarValue = null; // Default to null if not available or not found
        if (solarDataAvailable && solarDataMap.has(timestamp)) {
            const rawSolarValue = solarDataMap.get(timestamp);
            // Ensure it's a valid number, otherwise keep it null
            if (rawSolarValue !== null && typeof rawSolarValue === 'number' && !isNaN(rawSolarValue)) {
                solarValue = rawSolarValue;
            }
        }
        // --- END: Get Solar Value ---

        // Check validity
        if (heatValue !== null && typeof heatValue === 'number' && !isNaN(heatValue) &&
            insideTValue !== null && typeof insideTValue === 'number' && !isNaN(insideTValue) &&
            outsideTValue !== null && typeof outsideTValue === 'number' && !isNaN(outsideTValue))
        {
            const deltaT = insideTValue - outsideTValue;

            if (heatValue > 0 && deltaT > config.minDeltaT) {
                let groupKey = "all_data"; // Default if splitting is disabled
                let groupLabel = 'Daily Heat Demand<br>(' + config.bargraph_mode + (config.shouldUseFixedRoomT ? ', Fixed T_in=' + config.fixedRoomTValue + '°C' : '') + ')';
                // groupColor removed

                // --- Determine Group Key if Splitting ---
                if (config.splitDataEnabled) {
                    const date = new Date(timestamp); // Ensure timestamp is in ms
                    const year = date.getFullYear();
                    const month = date.getMonth(); // 0-11

                    if (config.splitByValue === 'year') {
                        groupKey = String(year);
                        groupLabel = `${year}`;
                    } else if (config.splitByValue === 'season') {
                        // Season: July 1st to June 30th
                        if (month >= 6) { // July or later
                            groupKey = `${year}/${year + 1}`;
                            groupLabel = `Season ${year}/${year + 1}`;
                        } else { // Before July
                            groupKey = `${year - 1}/${year}`;
                            groupLabel = `Season ${year - 1}/${year}`;
                        }
                    }
                }

                // --- Initialize group if it doesn't exist ---
                if (!groupedData[groupKey]) {
                     groupedData[groupKey] = {
                         xValues: [],    // Holds deltaT
                         yValues: [],    // Holds heatValue (kW)
                         timestamps: [], // Holds original timestamp for hover info
                         solarValues: [], // Holds solar values if available
                         label: groupLabel
                         // color property removed
                     };
                }

                // --- Add data to the group ---
                groupedData[groupKey].xValues.push(deltaT);
                groupedData[groupKey].yValues.push(heatValue);
                groupedData[groupKey].timestamps.push(timestamp);
                groupedData[groupKey].solarValues.push(solarValue);
                // Update overall bounds
                if (deltaT < overallMinX) overallMinX = deltaT;
                if (deltaT > overallMaxX) overallMaxX = deltaT;
                totalPoints++;
            }
        }
    }

    console.log("Heat Loss Plot: Prepared", totalPoints, "valid scatter points into", Object.keys(groupedData).length, "groups.");

    if (totalPoints === 0) {
        return null; // Indicate no data
    }

    // Sort groups by key (e.g., year or season start year) for consistent legend order
    const sortedGroupKeys = Object.keys(groupedData).sort();
    const sortedGroupedData = {};
    sortedGroupKeys.forEach(key => {
        sortedGroupedData[key] = groupedData[key];
    });


    return {
        groups: sortedGroupedData,
        overallMinX: overallMinX,
        overallMaxX: overallMaxX,
        totalPoints: totalPoints
    };
}


/**
 * Calculates linear regression and formats the result as a Plotly trace object
 * for a line segment. USES THE USER-PROVIDED linearRegression FUNCTION.
 * @param {number[]} xValues - Array of x-coordinates.
 * @param {number[]} yValues - Array of y-coordinates.
 * @param {string} traceNamePrefix - Prefix for the trace name (legend label).
 * @param {string} color - Color for the regression line.
 * @param {number} minPlotX - Minimum x value boundary for plotting the line (e.g., 0).
 * @param {number} maxPlotX - Maximum x value boundary for plotting the line (e.g., 35).
 * @returns {object|null} A Plotly trace object for the regression line, or null if regression fails or line is invalid.
 */
function calculatePlotlyRegressionTrace(xValues, yValues, traceNamePrefix, color, minPlotX = 0, maxPlotX = 35) {
    if (!xValues || xValues.length < 2) {
        console.warn("Heat Loss Plot: Not enough data points for regression for group:", traceNamePrefix);
        return null;
    }

    // Call the user-provided linearRegression function
    const regressionResult = linearRegression(xValues, yValues);

    let regressionLabel = `${traceNamePrefix}: N/A`;
    let lineX = [];
    let lineY = [];

    // Check if regressionResult is valid (not null and contains slope/intercept)
    if (regressionResult && typeof regressionResult.slope === 'number' && typeof regressionResult.intercept === 'number') {
        const { slope, intercept, r2 } = regressionResult;

        // Format label string using the calculated r2
        regressionLabel = `HLC=${(slope * 1000).toFixed(0)} W/K` +
                          `, Int=${(intercept * 1000).toFixed(0)} W` +
                          ` (R²=${r2 !== undefined && r2 !== null ? r2.toFixed(2) : 'N/A'})`;


        // --- Determine the actual range for the line segment [startX, endX] (respecting y >= 0 and plot bounds) ---
        // (Logic copied and adapted from original)
        let startX = minPlotX;
        let endX = maxPlotX;
        const epsilon = 1e-9;

        if (Math.abs(slope) > epsilon) {
            const xIntercept = -intercept / slope;
            const yAtMinPlotX = slope * minPlotX + intercept;
            const yAtMaxPlotX = slope * maxPlotX + intercept;

            // Adjust startX
            if (yAtMinPlotX < -epsilon && xIntercept > minPlotX) startX = xIntercept;
            else if (yAtMinPlotX < -epsilon && xIntercept <= minPlotX) {
                if (yAtMaxPlotX < -epsilon) {
                    console.warn(`Regression line for ${traceNamePrefix} is entirely below y=0 within plot range. Not plotting.`);
                    return null; // Entirely negative in range
                }
                startX = Math.max(minPlotX, xIntercept);
            } else startX = minPlotX;

            // Adjust endX
            if (yAtMaxPlotX < -epsilon && xIntercept < maxPlotX) endX = xIntercept;
            else if (yAtMaxPlotX < -epsilon && xIntercept >= maxPlotX) endX = Math.min(maxPlotX, xIntercept);
            else endX = maxPlotX;

        } else { // Horizontal line
            if (intercept < -epsilon) {
                 console.warn(`Regression line for ${traceNamePrefix} is horizontal and below y=0. Not plotting.`);
                 return null; // Below y=0
            }
            startX = minPlotX;
            endX = maxPlotX;
        }

        // Ensure startX <= endX and clamp
        if (startX > endX + epsilon) {
             console.warn(`Regression line for ${traceNamePrefix}: Calculated startX (${startX.toFixed(2)}) is greater than endX (${endX.toFixed(2)}). Not plotting line.`);
             return null;
        }
        startX = Math.max(minPlotX, startX);
        endX = Math.min(maxPlotX, endX);
        if (startX > endX + epsilon) {
             console.warn(`Regression line for ${traceNamePrefix}: Clamped startX (${startX.toFixed(2)}) is greater than clamped endX (${endX.toFixed(2)}). Not plotting line.`);
             return null;
        }


        // --- Generate points for the line segment ---
        // For Plotly, we only strictly need the start and end points of the valid segment
        const startY = Math.max(0, slope * startX + intercept);
        const endY = Math.max(0, slope * endX + intercept);

        // Check if the calculated points are valid numbers
        if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
             console.warn(`Regression line for ${traceNamePrefix}: Invalid coordinates calculated (NaN). Not plotting line.`);
             return null;
        }

        // Ensure we have distinct points to draw a line segment
        if (Math.abs(startX - endX) < epsilon && Math.abs(startY - endY) < epsilon) {
            // Points are virtually identical, don't draw a zero-length line
             console.warn(`Regression line for ${traceNamePrefix}: Start and end points are too close. Not plotting line.`);
             return null;
        }


        lineX = [startX, endX];
        lineY = [startY, endY];

    } else {
        // linearRegression returned null or invalid data
        console.warn("Heat Loss Plot: Linear regression calculation failed or returned invalid result for group:", traceNamePrefix);
        return null;
    }

    // Return the Plotly trace object
    return {
        x: lineX,
        y: lineY,
        mode: 'lines',
        type: 'scatter', // Lines are a mode of scatter traces
        name: regressionLabel, // This label contains the calculated values
        line: {
            color: color,
            width: 2
        },
        hoverinfo: 'skip' // Don't show hover info for the line itself by default
    };
}

/**
 * Configures the layout options for the Plotly plot.
 * @returns {object} The Plotly layout object.
 */
function getPlotlyLayoutOptions() {
    return {
        xaxis: {
            title: {
                text: "Temperature Difference (T<sub>inside</sub> - T<sub>outside</sub>) [K or °C]" // Use subscript tags
            },
            rangemode: 'tozero', // Ensures axis starts at 0 (or less if data is negative)
            // range: [0, 35], // Optional: set fixed range like [min, max]
            gridcolor: '#eee', // Lighter grid lines
        },
        yaxis: {
            title: {
                text: "Average Heat Output [kW]"
            },
            rangemode: 'tozero', // Ensures axis starts at 0
            gridcolor: '#eee',
        },
        hovermode: 'closest', // Show tooltip for the nearest point
        legend: {
            x: 0.01, // Position slightly offset from left
            y: 0.99, // Position slightly offset from top
            bgcolor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent background
            bordercolor: '#ccc',
            borderwidth: 1
        },
        margin: { l: 60, r: 20, t: 30, b: 50 }, // Adjust margins for labels
        // title: { text: "Building Heat Loss Characteristic" } // Optional main title
    };
}

/**
 * Main function to plot the Heat Loss Scatter graph using Plotly.
 * Orchestrates input reading, data preparation, calculation, and plotting.
 */
function plotHeatLossScatter() {
    console.log("Attempting to plot Heat Loss Scatter using Plotly...");
    const plotDiv = $("#heatloss-plot"); // Get the jQuery object
    const plotElement = plotDiv[0]; // Get the raw DOM element for Plotly

    if (!plotElement) {
        console.error("Heat Loss Plot: Plot container #heatloss-plot not found.");
        return;
    }

    // 1. Get Inputs & Config
    const config = getHeatLossInputs();
    if (!config) return;

    // 2. Check Data Sufficiency
    const sufficiency = checkDataSufficiency(config, daily_data);
    if (!sufficiency.sufficient) {
        const messageHtml = "<div style='text-align:center; padding: 50px; color:#aaa;'>Cannot plot heat loss:<br>" + sufficiency.messages.join("<br>") + "</div>";
        plotDiv.html(messageHtml); // Use div for better centering
        return;
    }

    // 3. Prepare Data (Handles Splitting)
    const preparedData = prepareHeatLossPlotData(config, daily_data);
    if (!preparedData || preparedData.totalPoints === 0) {
        let noDataReason = "No valid data points found for this mode";
         if (config.shouldUseFixedRoomT) noDataReason += ` using fixed T_in=${config.fixedRoomTValue}°C`;
         if (config.minDeltaT > -Infinity) noDataReason += ` with Min ΔT > ${config.minDeltaT}°C`;
         if (config.splitDataEnabled) noDataReason += ` split by ${config.splitByValue}`;
        noDataReason += ".";
        plotDiv.html("<div style='text-align:center; padding: 50px; color:#aaa;'>" + noDataReason + "</div>");
        return;
    }

    // 4. Generate Plotly Traces (Scatter + Regression)
    const plotData = []; // Array to hold Plotly traces
    const allXValues = []; // For overall regression
    const allYValues = []; // For overall regression
    const allSolarValues = [];

    resetPlotColorIndex(); // Reset colors for this plot generation

    // --- Determine overall Solar Min/Max for consistent colorscale ---
    let overallMinSolar = Infinity;
    let overallMaxSolar = -Infinity;
    let hasAnySolarData = false;
    if (config.solarColoringEnabled) {
        for (const groupKey in preparedData.groups) {
            const group = preparedData.groups[groupKey];
            if (group.solarValues && group.solarValues.length > 0) {
                group.solarValues.forEach(val => {
                    if (val !== null && typeof val === 'number' && !isNaN(val)) {
                        hasAnySolarData = true;
                        if (val < overallMinSolar) overallMinSolar = val;
                        if (val > overallMaxSolar) overallMaxSolar = val;
                    }
                });
            }
        }
        // Handle case where no valid solar data exists despite checkbox being ticked
        if (!hasAnySolarData) {
            console.log("Heat Loss Plot: Solar coloring enabled, but no valid solar data found. Reverting to group colors.");
            // config.solarColoringEnabled = false; // Or handle directly in loop
        } else {
                console.log(`Heat Loss Plot: Applying solar coloring. Solar range: [${overallMinSolar}, ${overallMaxSolar}]`);
        }
    }

    // Create Scatter and potentially individual Regression Traces
    for (const groupKey in preparedData.groups) {
        const group = preparedData.groups[groupKey];
        if (group.xValues.length > 0) {
            const groupColor = getNextPlotColor(); // Assign color per group

            // --- Prepare Customdata for Hover ---
            const customDataForHover = group.timestamps.map((ts, index) => {
                let dateStr = "Invalid Date";
                try {
                     if (ts !== null && ts !== undefined && !isNaN(ts)) {
                        const dateObj = new Date(ts);
                        if (!isNaN(dateObj.getTime())) {
                             dateStr = dateObj.toLocaleDateString();
                        }
                     }
                } catch (e) { console.warn("Error formatting date:", e); dateStr = "Date Error"; }

                const solarVal = group.solarValues[index];
                // Format solar value nicely for hover, handle null/undefined
                const solarStr = (solarVal !== null && typeof solarVal === 'number' && !isNaN(solarVal))
                                 ? solarVal.toFixed(2) + ' kWh'
                                 : 'N/A';

                return { date: dateStr, solar: solarStr, rawSolar: solarVal }; // Include raw value if needed for filtering later
            });

            let useSolarColoringForThisGroup = config.solarColoringEnabled && hasAnySolarData;

            let markerConfig = {
                size: 6,
                opacity: 0.7,
                color: groupColor // Default to group color
            };
            
            if (useSolarColoringForThisGroup) {
                 // Check if this specific group has any valid solar values
                 const groupHasSolar = group.solarValues.some(sv => sv !== null && typeof sv === 'number' && !isNaN(sv));
                 if (groupHasSolar) {
                      markerConfig = {
                         ...markerConfig, // Keep size, opacity
                         color: group.solarValues, // Use the array of solar values for color
                         colorscale: 'Jet', // Example: Yellow-Green-Blue
                         // Use cmin/cmax for consistent scale across groups if splitting
                         cmin: overallMinSolar,
                         cmax: overallMaxSolar,
                         colorbar: {
                             title: {
                                 text: 'Solar Gain (kWh/day)', // Add units, allow line break
                                 side: 'right'
                             }
                         },
                         // Ensure points with null solar value get a specific color (e.g., grey)
                         // Note: Plotly behavior with nulls in 'color' array can vary.
                         // A common approach is pre-filtering or assigning a value outside the cmin/cmax range.
                         // For simplicity here, we rely on Plotly's default (often transparent or lowest color).
                      };
                      console.log(`Applying solar colorscale to group: ${group.label}`);
                 } else {
                      // This group has no solar data, use the group color
                      console.log(`Solar coloring enabled, but group ${group.label} has no solar data. Using group color.`);
                      useSolarColoringForThisGroup = false; // Fallback for this specific group
                      markerConfig.color = groupColor; // Already set, but being explicit
                 }
            } else {
                // Solar coloring not enabled OR no valid solar data found overall
                markerConfig.color = groupColor;
            }
            
            // Create Scatter Trace
            // --- Create Scatter Trace ---
            const scatterTrace = {
                x: group.xValues,
                y: group.yValues,
                mode: 'markers',
                type: 'scatter',
                name: group.label + ` (N=${group.xValues.length})`,
                marker: markerConfig, // Assign the configured marker object
                customdata: customDataForHover, // Use the enhanced custom data
                hovertemplate: // Updated hover template
                    `<b>Date: %{customdata.date}</b><br>` +
                    `<b>ΔT:</b> %{x:.1f} K<br>` +
                    `<b>Avg Heat:</b> %{y:.2f} kW<br>` +
                    `<b>Solar Gain: %{customdata.solar}</b>` + // Add solar value
                    `<extra></extra>`,
                legendgroup: groupKey,
                // If using solar coloring, consider hiding individual groups from legend
                // unless splitting is also active, to avoid clutter.
                // showlegend: !(useSolarColoringForThisGroup && !config.splitDataEnabled)
                // Let's keep legend showing for now.
            };
            plotData.push(scatterTrace);

            // Create Regression Trace for this group if enabled
            if (config.splitRegressionEnabled) {
                const regressionTrace = calculatePlotlyRegressionTrace(
                    group.xValues,
                    group.yValues,
                    `${group.label} Fit`, // Prefix for the trace name
                    groupColor, // Use the same color
                    0, // Min X for line
                    35 // Max X for line (adjust as needed)
                );
                if (regressionTrace) {
                     // Prepend group label to the detailed regression fit label for clarity
                     regressionTrace.name = `${group.label} Fit:<br>${regressionTrace.name}`;
                     regressionTrace.legendgroup = groupKey; // Match legend group
                     // Optionally shorten the scatter name if the fit line has full details
                     // scatterTrace.name = group.label;
                    plotData.push(regressionTrace);
                }
            } else {
                // Collect all points for a single overall regression
                allXValues.push(...group.xValues);
                allYValues.push(...group.yValues);
                allSolarValues.push(...group.solarValues); 
            }
        }
    }

     // Perform the MULTILINEAR regression test on the overall aggregated data
     console.log("--- Running Multilinear Regression Test (Overall Data) ---");
     performMultilinearRegressionTest(allXValues, allSolarValues, allYValues);
     console.log("--- End Multilinear Regression Test ---");

    // Create Overall Regression Trace if not splitting regression
    if (!config.splitRegressionEnabled && allXValues.length >= 2) {
        const overallRegressionTrace = calculatePlotlyRegressionTrace(
            allXValues,
            allYValues,
            "Overall Fit",
            'rgba(0, 0, 0, 0.7)', // Distinct color (e.g., black)
            0,
            35
        );
        if (overallRegressionTrace) {
             overallRegressionTrace.name = `Overall Fit:<br>${overallRegressionTrace.name}`; // Add prefix
            plotData.push(overallRegressionTrace);
        } else {
              // Warning already logged in calculatePlotlyRegressionTrace or linearRegression
              console.log("Heat Loss Plot: Overall regression line not plotted (insufficient data or calculation failed).");
        }
    }


    // 5. Get Plot Layout Options
    const layout = getPlotlyLayoutOptions();
    // Dynamically adjust x-axis range based on data if needed, otherwise uses defaults/rangemode
    // layout.xaxis.range = [0, Math.max(35, preparedData.overallMaxX * 1.1)];
     // If solar coloring was used, adjust right margin slightly for colorbar

     if (config.solarColoringEnabled && hasAnySolarData) {
        layout.margin = { l: 60, r: 80, t: 30, b: 50 }; // Increased right margin
    }

    // 6. Plotting with Plotly
    const plotConfig = {
        responsive: true, // Allow plot to resize dynamically
        displaylogo: false, // Hide Plotly logo
        modeBarButtonsToRemove: ['select2d', 'lasso2d'] // Optional: remove unused buttons
    };

    try {
        // Ensure plotDiv is cleared before rendering (important for updates)
        Plotly.purge(plotElement); // More robust way to clear Plotly plots
        Plotly.newPlot(plotElement, plotData, layout, plotConfig);
        console.log("Heat Loss Plot: Plotly plot generated successfully.");
    } catch (e) {
        console.error("Heat Loss Plot: Error during Plotly plotting:", e);
        plotDiv.html("<div style='text-align:center; padding: 50px; color:red;'>Error generating plot. Check console.</div>");
    }
}


/**
 * Performs a multilinear regression test using Delta T and Solar Gain
 * as independent variables to predict Heat Output.
 * Logs the results to the console and returns the regression details.
 *
 * Filters out data points where any of the required values (heat, deltaT, solar)
 * are null or non-numeric.
 *
 * @param {number[]} deltaTValues - Array of temperature differences (X1).
 * @param {number[]} solarValues - Array of solar gain values (X2).
 * @param {number[]} heatOutputValues - Array of heat output values (Y, dependent).
 * @returns {object|null} The result object from multilinearRegression, or null if it fails.
 */
function performMultilinearRegressionTest(deltaTValues, solarValues, heatOutputValues) {
    console.log("Attempting Multilinear Regression Test: Heat ~ DeltaT + SolarGain");

    if (!deltaTValues || !solarValues || !heatOutputValues) {
        console.warn("Multilinear Test: Missing one or more input data arrays.");
        return null;
    }

    const n_initial = heatOutputValues.length;
    if (deltaTValues.length !== n_initial || solarValues.length !== n_initial) {
        console.warn(`Multilinear Test: Input array lengths mismatch. Heat: ${n_initial}, DeltaT: ${deltaTValues.length}, Solar: ${solarValues.length}`);
        return null;
    }

    // Filter data: Keep only points where Heat, DeltaT, AND Solar are valid numbers
    const filteredHeat = [];
    const filteredDeltaT = [];
    const filteredSolar = [];

    for (let i = 0; i < n_initial; i++) {
        const heat = heatOutputValues[i];
        const deltaT = deltaTValues[i];
        const solar = solarValues[i];

        // Check if all three values are valid numbers
        if (heat !== null && typeof heat === 'number' && !isNaN(heat) &&
            deltaT !== null && typeof deltaT === 'number' && !isNaN(deltaT) &&
            solar !== null && typeof solar === 'number' && !isNaN(solar))
        {
            filteredHeat.push(heat);
            filteredDeltaT.push(deltaT);
            filteredSolar.push(solar);
        }
    }

    const n_filtered = filteredHeat.length;
    console.log(`Multilinear Test: Filtered data points from ${n_initial} to ${n_filtered} (removing points with missing heat, deltaT, or solar).`);

    // Check if enough data points remain for regression (need >= num_independent_vars + 1)
    const num_independent_vars = 2; // DeltaT, Solar
    if (n_filtered < num_independent_vars + 1) {
        console.warn(`Multilinear Test: Not enough valid data points (${n_filtered}) for regression. Need at least ${num_independent_vars + 1}.`);
        return null;
    }

    // Prepare independent variables array for the regression function
    // Format: [[x1_1, x1_2,...], [x2_1, x2_2,...]]
    const independentVars = [filteredDeltaT, filteredSolar];

    // Call the multilinear regression function (assuming it's globally available)
    let regressionResult = null;
    try {
        // Assuming multilinearRegression is defined in myheatpump_regression.js and loaded
        regressionResult = multilinearRegression(independentVars, filteredHeat);
    } catch (e) {
        console.error("Multilinear Test: Error calling multilinearRegression function:", e);
        return null;
    }


    console.log(regressionResult);
    // Log results
    if (regressionResult) {
        console.log("--- Multilinear Regression Fit Details ---");
        console.log(`  Equation: Heat_kW ≈ ${regressionResult.intercept.toFixed(4)} + ( ${regressionResult.coefficients[0].toFixed(4)} * DeltaT ) + ( ${regressionResult.coefficients[1].toFixed(4)} * SolarGain_kWh )`);
        console.log(`  Intercept (β₀): ${regressionResult.intercept.toFixed(4)} kW`);
        console.log(`  Coefficient for DeltaT (β₁): ${regressionResult.coefficients[0].toFixed(4)} kW/K`);
        console.log(`  Coefficient for SolarGain (β₂): ${regressionResult.coefficients[1].toFixed(4)} kW/(kWh/day)`);
        console.log(`  R-squared: ${regressionResult.r2.toFixed(4)}`);
        console.log(`  Based on ${n_filtered} valid data points.`);
        console.log("------------------------------------------");
    } else {
        console.warn("Multilinear Test: Regression calculation failed or returned null.");
    }

    return regressionResult;
}