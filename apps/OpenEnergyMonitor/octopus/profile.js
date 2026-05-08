$("#show_profile").click(function() {
    profile_draw();
});

function profile_draw() {
    profile_mode = true;
    $("#history-title").html("PROFILE");

    var profile_unitprice = [];

    for (var z = 0; z < 48; z++) {
        let time = profile_kwh[z][0]
        let value = 100 * profile_cost[z][1] / profile_kwh[z][1]
        profile_unitprice[z * 2] = [time, value];
        profile_unitprice[z * 2 + 1] = [time + 1800000, value];
    }

    var bars = {
        show: true,
        align: "left",
        barWidth: 0.9 * 1800 * 1000,
        fill: 1.0,
        lineWidth: 0
    };

    graph_series = [];

    graph_series.push({
        label: "Import",
        data: profile_kwh,
        yaxis: 1,
        color: "#44b3e2",
        stack: true,
        bars: bars
    });

    graph_series.push({
        label: config.app.tariff_A.value,
        data: profile_unitprice,
        yaxis: 2,
        color: "#fb1a80",
        lines: {
            show: true,
            align: "left",
            lineWidth: 1
        }
    });

    var options = {
        xaxis: {
            mode: "time",
            timezone: "browser",
            // min: start, max: end, 
            font: {
                size: flot_font_size,
                color: "#666"
            },
            reserveSpace: false
        },
        yaxes: [{
                position: 'left',
                font: {
                    size: flot_font_size,
                    color: "#666"
                },
                reserveSpace: false
            },
            {
                position: 'left',
                alignTicksWithAxis: 1,
                font: {
                    size: flot_font_size,
                    color: "#666"
                },
                reserveSpace: false
            }
        ],
        grid: {
            show: true,
            color: "#aaa",
            borderWidth: 0,
            hoverable: true,
            clickable: true,
            // labelMargin:0,
            // axisMargin:0
            margin: {
                top: 30
            }
        },
        selection: {
            mode: "x"
        },
        legend: {
            position: "NW",
            noColumns: 5
        }
    }
    $.plot($('#placeholder'), graph_series, options);
}