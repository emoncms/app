/**
 * Plots a scatter graph of Daily Heat Output vs Daily (Tin - Tout) difference.
 * Uses data prepared for the main bar graph, filtered by the current bargraph_mode.
 * Assumes global variables like `daily_data`, `bargraph_mode`, `feeds`, `flot_font_size` are available.
 */
function plotHeatLossScatter() {
    console.log("Attempting to plot Heat Loss Scatter for mode:", bargraph_mode);
    var plotDiv = $("#heatloss-plot");
    var plotBound = $("#heatloss-plot-bound"); // To potentially resize if needed

    // --- 1. Data Access and Preparation ---
    // get min deltaT from input field
    var minDeltaT = parseFloat($("#heatloss_min_deltaT").val());
    if (isNaN(minDeltaT)) { // Handle cases where input might be empty or invalid
        minDeltaT = -Infinity; // Effectively no minimum if invalid
        console.warn("Heat Loss Plot: Invalid Minimum ΔT input, using no minimum.");
    }

    // get option to use fixed room temperature
    var useFixedRoomT = $("#heatloss_fixed_roomT_check").is(":checked");
    var fixedRoomTValue = parseFloat($("#heatloss_fixed_roomT_value").val());
     if (isNaN(fixedRoomTValue)) {
        fixedRoomTValue = 20; // Default if invalid
        console.warn("Heat Loss Plot: Invalid Fixed Room Temp input, using default 20°C.");
    }

    // Check if essential daily data is available
    if (typeof daily_data === 'undefined' || $.isEmptyObject(daily_data)) {
        console.log("Heat Loss Plot: daily_data not available.");
        plotDiv.html("<p style='text-align:center; padding-top:50px; color:#aaa;'>Daily data not loaded yet.</p>");
        return;
    }

    // Determine the keys based on the current bargraph mode (global variable)
    var heatKey = bargraph_mode + "_heat_kwh"; // e.g., combined_heat_kwh, running_heat_kwh
    var insideTKey = "combined_roomT_mean";   // Daily average room temp seems only stored as combined
    var outsideTKey = "combined_outsideT_mean"; // Daily average outside temp seems only stored as combined

    // Check feed configuration status
    var roomTempFeedConfigured = !!feeds["heatpump_roomT"];
    var outsideTempFeedConfigured = !!feeds["heatpump_outsideT"];

    // Determine if we *should* use the fixed room temperature value
    // This is true if the user checked the box OR if the room temperature feed isn't configured anyway
    var shouldUseFixedRoomT = useFixedRoomT || !roomTempFeedConfigured;

    // --- Check Data Sufficiency ---
    var isDataSufficient = true;
    var messages = [];

    // 1. Check Heat Data (Mandatory)
    if (!daily_data[heatKey] || daily_data[heatKey].length === 0) {
        isDataSufficient = false;
        messages.push(`Heat data ('${heatKey}') not found for the selected mode.`);
        console.log("Heat Loss Plot: Missing or empty data for key:", heatKey);
    }

    // 2. Check Outside Temp Data (Mandatory)
    if (!outsideTempFeedConfigured) {
         isDataSufficient = false;
         messages.push("Outside Temperature feed not configured in the app setup.");
         console.log("Heat Loss Plot: Outside Temperature feed not configured.");
    } else if (!daily_data[outsideTKey] || daily_data[outsideTKey].length === 0) {
        isDataSufficient = false;
        messages.push(`Outside temperature data ('${outsideTKey}') not found or empty.`);
        console.log("Heat Loss Plot: Missing or empty data for key:", outsideTKey);
    }

    // 3. Check Inside Temp Data (Only required if we are NOT using the fixed value)
    if (!shouldUseFixedRoomT) {
        // We need the dynamic data from the feed
        if (!roomTempFeedConfigured) {
             // This case is technically covered by shouldUseFixedRoomT, but belt-and-braces check
             isDataSufficient = false;
             messages.push("Room Temperature feed not configured (and fixed value not selected).");
             console.log("Heat Loss Plot: Room Temperature feed not configured (and fixed value not selected).");
        } else if (!daily_data[insideTKey] || daily_data[insideTKey].length === 0) {
            isDataSufficient = false;
            messages.push(`Inside temperature data ('${insideTKey}') not found or empty (and fixed value not selected).`);
            console.log("Heat Loss Plot: Missing or empty inside temp data (and fixed value not selected):", insideTKey);
        }
    }
    // If shouldUseFixedRoomT is true, we don't need to check for insideTKey data presence here.

    if (!isDataSufficient) {
        var messageHtml = "<p style='text-align:center; padding-top:50px; color:#aaa;'>Cannot plot heat loss:<br>" + messages.join("<br>") + "</p>";
        plotDiv.html(messageHtml);
        return;
    }

    // --- Prepare Data for Plotting ---
    console.log("Heat Loss Plot: Preparing data...");
    if (shouldUseFixedRoomT) {
        console.log("Heat Loss Plot: Using fixed room temperature:", fixedRoomTValue, "°C");
        if (!roomTempFeedConfigured && !useFixedRoomT) {
             console.log("Heat Loss Plot: Note - Fixed room temperature is being used because the Room Temperature feed is not configured.");
        }
    } else {
        console.log("Heat Loss Plot: Using dynamic room temperature feed data ('" + insideTKey + "').");
    }


    // Create lookup maps for temperatures
    var outsideTMap = new Map(daily_data[outsideTKey]);
    // Only create insideTMap if we are using dynamic data and it exists
    var insideTMap = (!shouldUseFixedRoomT && daily_data[insideTKey]) ? new Map(daily_data[insideTKey]) : null;

    var scatterData = [];
    var heatDataArray = daily_data[heatKey];

    console.log("Heat Loss Plot: Processing", heatDataArray.length, "days of data for mode", bargraph_mode);

    // arrays for regression
    var xValues = []; // Will hold deltaT values
    var yValues = []; // Will hold heatValue values
    var minX = Infinity;
    var maxX = -Infinity;

    // Iterate through the heat data (which is specific to the mode)
    for (var i = 0; i < heatDataArray.length; i++) {
        var timestamp = heatDataArray[i][0];
        var heatValue = heatDataArray[i][1] / 24.0; // convert from kWh to kW

        // Get corresponding temperatures using the timestamp
        var outsideTValue = outsideTMap.get(timestamp);
        var insideTValue;

        // *** Conditionally assign insideTValue ***
        if (shouldUseFixedRoomT) {
            insideTValue = fixedRoomTValue; // Use the fixed value
        } else if (insideTMap) {
            // Use the dynamic value from the map (we know insideTMap exists if !shouldUseFixedRoomT)
            insideTValue = insideTMap.get(timestamp);
        } else {
             // This case should ideally not be reached due to sufficiency checks, but set to null as a fallback.
             insideTValue = null;
             console.warn("Heat Loss Plot: Unexpected condition - insideTMap is null when dynamic temp was expected for timestamp", timestamp);
        }


        // Ensure all data points for this day are valid numbers
        if (heatValue !== null && typeof heatValue === 'number' && !isNaN(heatValue) &&
            insideTValue !== null && typeof insideTValue === 'number' && !isNaN(insideTValue) && // Handles both fixed and dynamic cases
            outsideTValue !== null && typeof outsideTValue === 'number' && !isNaN(outsideTValue))
        {
            // Calculate delta T
            var deltaT = insideTValue - outsideTValue;

            // Add the point [deltaT, heatValue] to our scatter data array
            // Only include days with positive heat output and reasonable deltaT
            if (heatValue > 0 && deltaT > minDeltaT) { // only plot data above min deltaT
                 scatterData.push([deltaT, heatValue]);
                 xValues.push(deltaT);
                 yValues.push(heatValue);
                if (deltaT < minX) minX = deltaT;
                if (deltaT > maxX) maxX = deltaT;
            }
        } else {
             // Optional: Log skipped days if needed for debugging
             // console.log("Heat Loss Plot: Skipping day", new Date(timestamp*1000).toLocaleDateString(), "due to null/invalid values (H/Ti/To):", heatValue, insideTValue, outsideTValue);
        }
    }

     console.log("Heat Loss Plot: Prepared", scatterData.length, "valid scatter points.");

    if (scatterData.length === 0) {
        let noDataReason = "No valid data points found for this mode";
        if (shouldUseFixedRoomT) {
            noDataReason += " using fixed room temperature " + fixedRoomTValue + "°C";
        }
         if (minDeltaT > -Infinity) {
            noDataReason += " with Min ΔT > " + minDeltaT + "°C";
         }
         noDataReason += ".";
        plotDiv.html("<p style='text-align:center; padding-top:50px; color:#aaa;'>" + noDataReason + "</p>");
        return;
    }

    // --- Calculate Linear Regression ---
    var regressionResult = linearRegression(xValues, yValues);
    var regressionLineData = null;
    var regressionLabel = "";

    if (regressionResult) {
        console.log("Heat Loss Plot: Regression successful", regressionResult);
        const slope = regressionResult.slope;
        const intercept = regressionResult.intercept;
        const r2 = regressionResult.r2;

        const xIntercept = -intercept / slope; // x-intercept (where line crosses x-axis)
        // Calculate y-values for the line at min and max observed x values
        const y1 = slope * xIntercept + intercept;
        maxX=35
        const y2 = slope * maxX + intercept;

        regressionLineData = [[xIntercept, y1], [maxX, y2]];

        // Create a label for the legend
        regressionLabel = `Fit: HLC=${slope.toFixed(3)*1000} W/K` +
                            `, Int=${intercept.toFixed(3)*1000} W` +
                            ` (R²=${r2.toFixed(3)})`; // Heat Loss Coefficient (slope) in W/K

    } else {
        console.warn("Heat Loss Plot: Linear regression could not be calculated.");
    }

    // --- 2. Plotting ---

    var plotSeries = [{
        data: scatterData,
        points: {
            show: true,
            radius: 3,
            fill: true,
            fillColor: "rgba(255, 99, 71, 0.6)" // Tomato color with some transparency
        },
        lines: { show: false }, // Ensure lines are off for scatter
        color: 'rgb(255, 99, 71)', // Tomato color
        label: 'Daily Heat Demand (' + bargraph_mode + (shouldUseFixedRoomT ? ', Fixed T_in=' + fixedRoomTValue + '°C' : '') + ')' // Add note to label if fixed T is used
    }];

    if (regressionLineData) {
        plotSeries.push({
            data: regressionLineData,
            lines: {
                show: true,
                lineWidth: 2
            },
            points: { show: false }, // Don't show points for the line itself
            color: 'rgba(0, 0, 255, 0.8)', // Blue line
            label: regressionLabel,
            // Optional: make it dashed
            // dashes: { show: true, lineWidth: 1, dashLength: [4, 4] },
            shadowSize: 0 // No shadow for the fit line
        });
    }

    var plotOptions = {
        xaxis: {
            min: 0,
            axisLabel: "Temperature Difference (T_inside - T_outside) [K or °C]", // Difference is the same unit
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 12,
            axisLabelFontFamily: 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
            axisLabelPadding: 5,
            font: { size: flot_font_size, color: "#555" }, // Assumes global flot_font_size
            // Let flot determine min/max automatically for scatter
        },
        yaxis: {
            axisLabel: "Average Heat Output [kW]", // Corrected unit label (was kWh previously in tooltip comment)
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 12,
            axisLabelFontFamily: 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
            axisLabelPadding: 5,
            font: { size: flot_font_size, color: "#555" }, // Assumes global flot_font_size
            min: 0 // Heat output shouldn't be negative in this context
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
                // Custom tooltip content to handle multiple series
                if (flotItem.series.points.show) { // Scatter points
                   return `<b>Point:</b><br><b>ΔT:</b> ${xval.toFixed(1)} °C<br><b>Avg Heat:</b> ${yval.toFixed(2)} kW`;
                } else if (flotItem.series.lines.show) { // Regression line
                    // Tooltip for the line itself is less useful, maybe show equation?
                    // Or just disable tooltip for the line by returning false?
                    return `<b>${flotItem.series.label}</b><br>ΔT: ${xval.toFixed(1)} °C<br>Predicted Heat: ${yval.toFixed(2)} kW`;
                    // return false; // To disable tooltip for the line
                }
                return ''; // Default fallback
            },
            // content: "<b>ΔT:</b> %x.1 °C<br><b>Avg Heat:</b> %y.2 kW", // Original simple tooltip
            shifts: { x: 10, y: 20 },
            defaultTheme: false,
            lines: false // Tooltip based on nearest item, not line interpolation
        },
        legend: {
            show: true,
            position: "nw" // North-West corner
        }
    };

    // Ensure the plot container is visible and sized before plotting
    var plotWidth = plotBound.width();
    var plotHeight = plotBound.height();
    if (plotHeight < 200) plotHeight = 400; // Ensure minimum height

    plotDiv.width(plotWidth);
    plotDiv.height(plotHeight);

    try {
        // Clear previous plot content/messages
        plotDiv.empty();
        $.plot(plotDiv, plotSeries, plotOptions);
        console.log("Heat Loss Plot: Plot generated successfully.");
    } catch (e) {
        console.error("Heat Loss Plot: Error during flot plotting:", e);
        plotDiv.html("<p style='text-align:center; padding-top:50px; color:red;'>Error generating plot.</p>");
    }
}