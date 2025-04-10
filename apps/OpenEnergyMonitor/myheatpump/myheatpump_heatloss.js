/**
 * Provides a rotating list of distinct colors for plotting multiple series.
 */
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

    // Keys for accessing data
    config.heatKey = config.bargraph_mode + "_heat_kwh";
    config.insideTKey = "combined_roomT_mean";
    config.outsideTKey = "combined_outsideT_mean";

    console.log("Heat Loss Inputs:", config);
    return config;
}

/**
 * Checks if the necessary data is available for plotting based on the configuration.
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
 * @param {object} config - The configuration object.
 * @param {object} daily_data - The global daily_data object.
 * @returns {object|null} An object containing grouped data { groupKey: { data:[], xValues:[], yValues:[], label:'', color:'' } },
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

    console.log("Heat Loss Plot: Processing", heatDataArray.length, "days of data for mode", config.bargraph_mode);

    // --- Data Grouping Logic ---
    const groupedData = {};
    let overallMinX = Infinity;
    let overallMaxX = -Infinity;
    let totalPoints = 0;
    resetPlotColorIndex(); // Reset colors for each plot generation

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

        // Check validity
        if (heatValue !== null && typeof heatValue === 'number' && !isNaN(heatValue) &&
            insideTValue !== null && typeof insideTValue === 'number' && !isNaN(insideTValue) &&
            outsideTValue !== null && typeof outsideTValue === 'number' && !isNaN(outsideTValue))
        {
            const deltaT = insideTValue - outsideTValue;

            if (heatValue > 0 && deltaT > config.minDeltaT) {
                let groupKey = "all_data"; // Default if splitting is disabled
                let groupLabel = 'Daily Heat Demand (' + config.bargraph_mode + (config.shouldUseFixedRoomT ? ', Fixed T_in=' + config.fixedRoomTValue + '°C' : '') + ')';
                let groupColor = plotColors[0]; // Default color if no split

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
                        // If month is July (6) or later, it belongs to the season starting this year
                        if (month >= 6) {
                            groupKey = `${year}/${year + 1}`;
                            groupLabel = `Season ${year}/${year + 1}`;
                        } else { // Otherwise, it belongs to the season that started last year
                            groupKey = `${year - 1}/${year}`;
                            groupLabel = `Season ${year - 1}/${year}`;
                        }
                    }
                }

                // --- Initialize group if it doesn't exist ---
                if (!groupedData[groupKey]) {
                    // Assign color when group is first created
                    if (config.splitDataEnabled) {
                        groupColor = getNextPlotColor();
                    }
                     groupedData[groupKey] = {
                         data: [],       // Holds [deltaT, heatValue, timestamp]
                         xValues: [],    // Holds deltaT
                         yValues: [],    // Holds heatValue (kW)
                         label: groupLabel,
                         color: groupColor
                     };
                }

                // --- Add data to the group ---
                groupedData[groupKey].data.push([deltaT, heatValue, timestamp]);
                groupedData[groupKey].xValues.push(deltaT);
                groupedData[groupKey].yValues.push(heatValue);

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
 * Calculates linear regression and formats the result as a Flot series object
 * with detailed points along the line for better hover interaction.
 * @param {number[]} xValues - Array of x-coordinates.
 * @param {number[]} yValues - Array of y-coordinates.
 * @param {string} labelPrefix - Prefix for the legend label (e.g., "Fit", "2023 Fit").
 * @param {string} color - Color for the regression line.
 * @param {number} minPlotX - Minimum x value boundary for plotting the line (e.g., 0).
 * @param {number} maxPlotX - Maximum x value boundary for plotting the line (e.g., 35).
 * @returns {object|null} A Flot series object for the regression line, or null if regression fails or line is invalid.
 */
function calculateRegressionSeries(xValues, yValues, labelPrefix, color, minPlotX = 0, maxPlotX = 35) {
    if (!xValues || xValues.length < 2) {
        console.warn("Heat Loss Plot: Not enough data points for regression for group:", labelPrefix);
        return null;
    }

    const regressionResult = linearRegression(xValues, yValues);
    let regressionLineData = [];
    let regressionLabel = `${labelPrefix}: N/A`;

    if (regressionResult) {
        const { slope, intercept, r2 } = regressionResult;
        regressionLabel = `${labelPrefix}: HLC=${(slope * 1000).toFixed(1)} W/K` +
                          `, Int=${(intercept * 1000).toFixed(1)} W` +
                          ` (R²=${r2.toFixed(3)}, N=${xValues.length})`;

        // --- Determine the actual range for the line segment (respecting y >= 0 and plot bounds) ---
        let startX = minPlotX;
        let endX = maxPlotX;
        const epsilon = 1e-9; // Tolerance for float comparisons

        if (Math.abs(slope) > epsilon) {
            // Line has a non-zero slope
            const xIntercept = -intercept / slope;

            // Calculate Y values at the plot boundaries
            const yAtMinPlotX = slope * minPlotX + intercept;
            const yAtMaxPlotX = slope * maxPlotX + intercept;

            // Adjust startX: must be >= minPlotX and where y >= 0
            if (yAtMinPlotX < -epsilon && xIntercept > minPlotX) {
                // Line starts below 0 at minPlotX, but crosses y=0 later
                startX = xIntercept;
            } else if (yAtMinPlotX < -epsilon && xIntercept <= minPlotX) {
                 // Line is entirely below 0 at the start or crosses before minPlotX
                 console.warn(`Regression line for ${labelPrefix} starts below y=0.`);
                 // Check if it ever goes positive within the maxPlotX range
                 if (yAtMaxPlotX < -epsilon) {
                     console.warn(`Regression line for ${labelPrefix} is entirely below y=0 within plot range. Not plotting.`);
                     return null; // Don't plot if the entire segment in range is negative
                 }
                 // If it crosses later (yAtMaxPlotX is positive), start at xIntercept, but clamped by minPlotX
                 startX = Math.max(minPlotX, xIntercept);

            } else {
                 // Line starts at or above 0 at minPlotX
                 startX = minPlotX;
            }


            // Adjust endX: must be <= maxPlotX and where y >= 0
            if (yAtMaxPlotX < -epsilon && xIntercept < maxPlotX) {
                // Line ends below 0 at maxPlotX, but crossed y=0 earlier
                endX = xIntercept;
            } else if (yAtMaxPlotX < -epsilon && xIntercept >= maxPlotX) {
                 // Line is already below 0 before or at maxPlotX
                 // This case *should* be covered by the startX logic if the line is entirely negative,
                 // but good to be explicit. If startX was valid, we must end where y crosses 0.
                 endX = Math.min(maxPlotX, xIntercept);
            } else {
                // Line ends at or above 0 at maxPlotX
                endX = maxPlotX;
            }

        } else {
            // Line is horizontal (slope is near zero)
            if (intercept < -epsilon) {
                // Horizontal line below y=0
                console.warn(`Regression line for ${labelPrefix} is horizontal and below y=0. Not plotting.`);
                return null;
            }
            // Otherwise, the horizontal line is at y = intercept (>= 0)
            // Use the original plot bounds for the horizontal line
            startX = minPlotX;
            endX = maxPlotX;
        }

        // --- Generate detailed points for the calculated [startX, endX] segment ---

        // Ensure startX is not greater than endX (could happen due to float issues or weird data)
        if (startX > endX + epsilon) {
             console.warn(`Regression line for ${labelPrefix}: Calculated startX (${startX.toFixed(2)}) is greater than endX (${endX.toFixed(2)}). Not plotting line.`);
             return null;
        }
         // Clamp startX and endX to be within the original min/max plot bounds just in case
         startX = Math.max(minPlotX, startX);
         endX = Math.min(maxPlotX, endX);
         // Recalculate if clamping changed things significantly - might not be necessary if initial logic is robust
         if (startX > endX + epsilon) {
              console.warn(`Regression line for ${labelPrefix}: Clamped startX (${startX.toFixed(2)}) is greater than clamped endX (${endX.toFixed(2)}). Not plotting line.`);
              return null;
         }


        const xValuesSet = new Set();

        // Add the precise start and end points
        xValuesSet.add(startX);
        xValuesSet.add(endX);

        // Add integer points within the range
        const firstInteger = Math.ceil(startX);
        const lastInteger = Math.floor(endX);

        for (let xInt = firstInteger; xInt <= lastInteger; xInt++) {
             // Ensure the integer point is strictly within the calculated segment bounds
             if (xInt >= startX - epsilon && xInt <= endX + epsilon) {
                xValuesSet.add(xInt);
             }
        }

        // Convert Set to sorted array and calculate y values
        const sortedXValues = Array.from(xValuesSet).sort((a, b) => a - b);
        regressionLineData = sortedXValues.map(x => {
            const y = slope * x + intercept;
            // Clamp y at 0, although the startX/endX logic should mostly prevent negative y
            return [x, Math.max(0, y)];
        });

        // Final check: ensure we have at least two distinct points to draw a line
        if (regressionLineData.length < 2) {
            console.warn("Regression line for", labelPrefix, " resulted in less than 2 points after processing. Not plotting line.");
            return null;
        }

    } else {
        console.warn("Heat Loss Plot: Linear regression calculation failed for group:", labelPrefix);
        return null;
    }

    // Return the Flot series object
    return {
        data: regressionLineData,
        lines: { show: true, lineWidth: 2 },
        points: { show: false }, // Keep points off for the line itself
        color: color,
        label: regressionLabel,
        shadowSize: 0
    };
}


/**
 * Configures the options for the Flot plot.
 * @param {boolean} splitDataEnabled - Whether data splitting is active (affects legend).
 * @param {object[]} plotSeries - The array of series to be plotted (used for tooltip logic).
 * @returns {object} The Flot options object.
 */
function getHeatLossPlotOptions(splitDataEnabled, plotSeries) {
     // Find the first scatter series to access its original data structure for the tooltip
    const scatterSeriesExample = plotSeries.find(s => s.points && s.points.show);
    const originalDataAccessor = scatterSeriesExample ? scatterSeriesExample.originalDataAccessor : 'data'; // How to get original [x,y,ts]

    return {
        xaxis: {
            min: 0,
            axisLabel: "Temperature Difference (T_inside - T_outside) [K or °C]",
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 12,
            axisLabelFontFamily: 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
            axisLabelPadding: 5,
            font: { size: flot_font_size, color: "#555" },
            // max: 35 // Optional: set a fixed max if desired
        },
        yaxis: {
            min: 0,
            axisLabel: "Average Heat Output [kW]",
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 12,
            axisLabelFontFamily: 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
            axisLabelPadding: 5,
            font: { size: flot_font_size, color: "#555" },
        },
        grid: {
            show: true,
            color: "#aaa",
            hoverable: true,
            clickable: false,
            borderWidth: { top: 0, right: 0, bottom: 1, left: 1 },
            borderColor: "#ccc",
        },
        tooltip: {
            show: true,
             content: function(label, xval, yval, flotItem) {
                 // flotItem.seriesIndex: index in the plotSeries array
                 // flotItem.dataIndex: index within the data of that series
                 const currentSeries = plotSeries[flotItem.seriesIndex];

                 if (currentSeries.points && currentSeries.points.show) { // Scatter point
                    const originalDataArray = currentSeries[originalDataAccessor]; // Access the original data store
                    const index = flotItem.dataIndex;

                    if (index !== null && originalDataArray && index >= 0 && index < originalDataArray.length) {
                        const originalPoint = originalDataArray[index]; // [deltaT, heatValue, timestamp]
                        if (originalPoint && originalPoint.length >= 3) {
                            const timestamp = originalPoint[2];
                            let dateString = "N/A";
                            if (timestamp !== null && !isNaN(timestamp)) {
                                const dateObject = new Date(timestamp);
                                if (!isNaN(dateObject.getTime())) {
                                     dateString = dateObject.toLocaleDateString();
                                } else { dateString = "Invalid Date"; }
                            } else { dateString = "Invalid Timestamp"; }

                            // Include series label if splitting is enabled
                            const seriesLabelInfo = splitDataEnabled ? `<b>${currentSeries.label || 'Data'}</b><br>` : '';

                            return `${seriesLabelInfo}` +
                                   `<b>Date: ${dateString}</b><br>` +
                                   `<b>ΔT:</b> ${xval.toFixed(1)} °C<br>` +
                                   `<b>Avg Heat:</b> ${yval.toFixed(2)} kW`;
                        } else { return "Data Format Error"; }
                    } else { return "Data Index Error"; }
                } else if (currentSeries.lines && currentSeries.lines.show) { // Regression line
                    return `<b>${currentSeries.label || 'Fit'}</b><br>` + // Show regression label
                           `ΔT: ${xval.toFixed(1)} °C<br>` +
                           `Predicted Heat: ${yval.toFixed(2)} kW`;
                }
                 return ''; // Fallback
             },
            shifts: { x: 10, y: 20 },
            defaultTheme: false,
            lines: false
        },
        legend: {
            show: true,
            position: "nw", // North-West corner
            // Optional: more space if many legend items
            // labelBoxBorderColor: "none",
            // container: $("#heatloss-legend-container") // Define an external container if needed
        }
    };
}


/**
 * Main function to plot the Heat Loss Scatter graph.
 * Orchestrates input reading, data preparation, calculation, and plotting.
 */
function plotHeatLossScatter() {
    console.log("Attempting to plot Heat Loss Scatter...");
    var plotDiv = $("#heatloss-plot");
    var plotBound = $("#heatloss-plot-bound");

    // 1. Get Inputs & Config
    const config = getHeatLossInputs();
    if (!config) return; // Should not happen with current getHeatLossInputs

    // 2. Check Data Sufficiency
    const sufficiency = checkDataSufficiency(config, daily_data);
    if (!sufficiency.sufficient) {
        var messageHtml = "<p style='text-align:center; padding-top:50px; color:#aaa;'>Cannot plot heat loss:<br>" + sufficiency.messages.join("<br>") + "</p>";
        plotDiv.html(messageHtml);
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
        plotDiv.html("<p style='text-align:center; padding-top:50px; color:#aaa;'>" + noDataReason + "</p>");
        return;
    }

    // 4. Generate Plot Series (Scatter + Regression)
    const plotSeries = [];
    const allXValues = []; // For overall regression if needed
    const allYValues = []; // For overall regression if needed

    // Create Scatter Series
    for (const groupKey in preparedData.groups) {
        const group = preparedData.groups[groupKey];
        if (group.data.length > 0) {
             // Store original data separately for tooltip access if needed, Flot modifies the data array sometimes
             const originalDataForTooltip = [...group.data];

            plotSeries.push({
                 // Use only x,y for plotting, keep original data separately
                 data: group.data.map(p => [p[0], p[1]]),
                 originalDataAccessor: 'originalData', // Custom property name
                 originalData: originalDataForTooltip, // Attach original data here
                 points: { show: true, radius: 3, fill: true, fillColor: hexToRgba(group.color, 0.6) },
                 lines: { show: false },
                 color: group.color,
                 label: group.label + ` (N=${group.data.length})`,
                 groupKey: groupKey // Store group key if needed later
            });

            // Collect all points for overall regression if needed
            if (!config.splitRegressionEnabled) {
                allXValues.push(...group.xValues);
                allYValues.push(...group.yValues);
            }
        }
    }

    // Create Regression Series
    if (config.splitRegressionEnabled) {
        // Calculate and add regression for each group
        for (const groupKey in preparedData.groups) {
            const group = preparedData.groups[groupKey];
             const regressionLine = calculateRegressionSeries(
                group.xValues,
                group.yValues,
                `${group.label} Fit`, // Use group label in fit label
                group.color, // Use same color as scatter
                0, // Min X for line start
                35 // Max X for line end (adjust as needed)
            );
            if (regressionLine) {
                plotSeries.push(regressionLine);
            }
        }
    } else {
        // Calculate and add a single overall regression line
        if (allXValues.length >= 2) {
             const overallRegressionLine = calculateRegressionSeries(
                allXValues,
                allYValues,
                "Overall Fit",
                'rgba(0, 0, 255, 0.8)', // Specific color for overall fit (e.g., blue)
                 0,
                 35
            );
            if (overallRegressionLine) {
                plotSeries.push(overallRegressionLine);
            }
        } else {
             console.warn("Heat Loss Plot: Not enough data points (>=2) for overall regression.");
        }
    }


    // 5. Get Plot Options
    const plotOptions = getHeatLossPlotOptions(config.splitDataEnabled, plotSeries);

    // 6. Plotting
    var plotWidth = plotBound.width();
    var plotHeight = plotBound.height();
    if (plotHeight < 300) plotHeight = 400; // Min height

    plotDiv.width(plotWidth);
    plotDiv.height(plotHeight);

    try {
        plotDiv.empty(); // Clear previous content
        $.plot(plotDiv, plotSeries, plotOptions);
        console.log("Heat Loss Plot: Plot generated successfully.");
    } catch (e) {
        console.error("Heat Loss Plot: Error during flot plotting:", e);
        plotDiv.html("<p style='text-align:center; padding-top:50px; color:red;'>Error generating plot.</p>");
    }
}

/**
 * Helper function to convert hex color to rgba.
 * Needed because Flot fillColor doesn't automatically inherit alpha from the main color.
 * @param {string} hex - Hex color string (e.g., #FF6347).
 * @param {number} alpha - Alpha value (0.0 to 1.0).
 * @returns {string} rgba color string.
 */
function hexToRgba(hex, alpha) {
    var r, g, b;
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
        r = parseInt(result[1], 16);
        g = parseInt(result[2], 16);
        b = parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else {
        // Fallback if hex is invalid
        return `rgba(100, 100, 100, ${alpha})`; // Grey fallback
    }
}