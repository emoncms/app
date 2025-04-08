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

    // Check if the necessary data *arrays* exist within daily_data
    // Also check if the corresponding feeds were configured in the first place (uses global 'feeds')
    var isDataSufficient = true;
    var messages = [];

    if (!daily_data[heatKey] || daily_data[heatKey].length === 0) {
        isDataSufficient = false;
        messages.push(`Heat data ('${heatKey}') not found for the selected mode.`);
        console.log("Heat Loss Plot: Missing or empty data for key:", heatKey);
    }
    if (!feeds["heatpump_roomT"]) {
         isDataSufficient = false;
         messages.push("Room Temperature feed not configured in the app setup.");
         console.log("Heat Loss Plot: Room Temperature feed not configured.");
    } else if (!daily_data[insideTKey] || daily_data[insideTKey].length === 0) {
        isDataSufficient = false;
        // It's possible the feed exists but daily processing hasn't run or included it
        messages.push(`Inside temperature data ('${insideTKey}') not found or empty.`);
        console.log("Heat Loss Plot: Missing or empty data for key:", insideTKey);
    }
     if (!feeds["heatpump_outsideT"]) {
         isDataSufficient = false;
         messages.push("Outside Temperature feed not configured in the app setup.");
         console.log("Heat Loss Plot: Outside Temperature feed not configured.");
    } else if (!daily_data[outsideTKey] || daily_data[outsideTKey].length === 0) {
        isDataSufficient = false;
        messages.push(`Outside temperature data ('${outsideTKey}') not found or empty.`);
        console.log("Heat Loss Plot: Missing or empty data for key:", outsideTKey);
    }

    if (!isDataSufficient) {
        var messageHtml = "<p style='text-align:center; padding-top:50px; color:#aaa;'>Cannot plot heat loss:<br>" + messages.join("<br>") + "</p>";
        plotDiv.html(messageHtml);
        return;
    }

    // Create lookup maps for temperatures for easier matching by timestamp
    var insideTMap = new Map(daily_data[insideTKey]);
    var outsideTMap = new Map(daily_data[outsideTKey]);

    var scatterData = [];
    var heatDataArray = daily_data[heatKey];

    console.log("Heat Loss Plot: Processing", heatDataArray.length, "days of data for mode", bargraph_mode);

    // Iterate through the heat data (which is specific to the mode)
    for (var i = 0; i < heatDataArray.length; i++) {
        var timestamp = heatDataArray[i][0];
        var heatValue = heatDataArray[i][1] / 24.0; // convert from kWh to kW

        // Get corresponding temperatures using the timestamp
        var insideTValue = insideTMap.get(timestamp);
        var outsideTValue = outsideTMap.get(timestamp);

        // Ensure all data points for this day are valid numbers
        if (heatValue !== null && typeof heatValue === 'number' &&
            insideTValue !== null && typeof insideTValue === 'number' &&
            outsideTValue !== null && typeof outsideTValue === 'number')
        {
            // Calculate delta T
            var deltaT = insideTValue - outsideTValue;

            // Add the point [deltaT, heatValue] to our scatter data array
            // Only include days with positive heat output and reasonable deltaT
            if (heatValue > 0 && deltaT > -10 && deltaT < 40) { // Basic sanity check
                 scatterData.push([deltaT, heatValue]);
            }
        }
    }

     console.log("Heat Loss Plot: Prepared", scatterData.length, "valid scatter points.");

    if (scatterData.length === 0) {
        plotDiv.html("<p style='text-align:center; padding-top:50px; color:#aaa;'>No valid data points found for this mode to plot heat loss.</p>");
        return;
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
        label: 'Daily Heat Loss (' + bargraph_mode + ')' // Label indicates mode
    }];

    var plotOptions = {
        xaxis: {
            axisLabel: "Temperature Difference (T_inside - T_outside) [K]",
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 12,
            axisLabelFontFamily: 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
            axisLabelPadding: 5,
            font: { size: flot_font_size, color: "#555" }, // Assumes global flot_font_size
            // Let flot determine min/max automatically for scatter
        },
        yaxis: {
            axisLabel: "Heat Output [kW]",
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
            clickable: false, // Disable click-through for scatter for now
            borderWidth: { top: 0, right: 0, bottom: 1, left: 1 },
            borderColor: "#ccc",
        },
        tooltip: { // Enable basic flot tooltips
            show: true,
            content: "<b>ΔT:</b> %x.1 °C<br><b>Heat:</b> %y.1 kWh",
            shifts: {
                x: 10,
                y: 20
            },
            defaultTheme: false, // Use Emoncms styling if available, else default flot
            lines: false // Tooltip for points only
        },
        legend: {
            show: true,
            position: "nw" // North-West corner
        }
        // Selection not typically needed for this type of scatter
        // selection: { mode: "xy" },
    };

    // Ensure the plot container is visible and sized before plotting
    var plotWidth = plotBound.width();
    var plotHeight = plotBound.height(); // Or set a fixed height like 400px initially
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

// Optional: If you want custom tooltips for this plot specifically,
// you could add the hover binding here.
/*
$('#heatloss-plot').bind("plothover", function (event, pos, item) {
    $("#tooltip").remove(); // Remove any existing tooltip
    if (item) {
        var x = item.datapoint[0].toFixed(1);
        var y = item.datapoint[1].toFixed(1);
        var content = "<b>ΔT:</b> " + x + " °C<br><b>Heat:</b> " + y + " kWh";

        // Assuming 'tooltip' function is globally available from vis.helper.js or similar
        tooltip(item.pageX, item.pageY, content);
    }
});
*/