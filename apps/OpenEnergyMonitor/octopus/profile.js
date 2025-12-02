$("#show_profile").click(function() {
    profile_draw();
});

function process_profile_data(data, tariff_key) {
    // Used to generate averaged profile
    var profile_kwh = [];
    var profile_cost = [];

    var d = new Date();
    d.setHours(0, 0, 0, 0);
    var profile_start = d.getTime();

    // Initialize profile arrays
    for (var hh = 0; hh < 48; hh++) {
        let profile_time = profile_start + hh * 1800 * 1000;
        profile_kwh[hh] = [profile_time, 0.0]
        profile_cost[hh] = [profile_time, 0.0]
    }

    // Process data into profile
    for (var z = 0; z < data["import"].length; z++) {
        let time = data["import"][z][0];
        let import_kwh_hh = data["import"][z][1];

        if (data[tariff_key][z][1] != null) {
            let import_unitrate = data[tariff_key][z][1] * 0.01;
            let import_cost_hh = import_kwh_hh * import_unitrate;

            d.setTime(time);
            let hh = d.getHours() * 2 + d.getMinutes() / 30;
            profile_kwh[hh][1] += import_kwh_hh
            profile_cost[hh][1] += import_cost_hh 
        }
    }

    return {
        kwh: profile_kwh,
        cost: profile_cost
    };
}

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