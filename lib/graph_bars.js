var graph_bars = {

    element: false,
    ctx: false,

    // Pixel width and height of graph
    width: 200,
    height: 200,

    bottom: 0,


    draw: function (element, series, days) {
        'use strict';
        // Initialise the canvas get context

        var ctx,
            c,
            xmin,
            xmax,
            ymin,
            ymax,
            data,
            s,
            z,
            plot_height,
            interval = 1,
            r,
            x,
            y,
            dayid,
            d,
            scale = 1,
            barwidth;
        if (!ctx) {
            this.element = element;
            c = document.getElementById(element);
            this.ctx = c.getContext("2d");
        }
        ctx = this.ctx;
        days = (days === undefined) ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : days;

        // Clear canvasat
        ctx.clearRect(0, 0, this.width, this.height);

        plot_height = this.height - this.bottom;

        // OEM Blue
        ctx.strokeStyle = "#0699fa";
        ctx.fillStyle = "#0699fa";

        // Axes
        ctx.moveTo(0, 0);
        ctx.lineTo(0, plot_height);
        ctx.lineTo(this.width, plot_height);
        ctx.stroke();

        // Axes label
        ctx.textAlign = "left";
        ctx.font = "16px arial";
        ctx.fillText('kWh', 10, 15);

        // find out max and min values of data

        for (s in series) {
            data = series[s];
            for (z in data) {
                xmin = (xmin === undefined) ? data[z][0] : xmin;
                xmax = (xmax === undefined) ? data[z][0] : xmax;
                ymin = (ymin === undefined) ? data[z][1] : ymin;
                ymax = (ymax === undefined) ? data[z][1] : ymax;

                ymax = (data[z][1] > ymax) ? data[z][1] : ymax;
                ymin = (data[z][1] < ymin) ? data[z][1] : ymin;
                xmax = (data[z][0] > xmax) ? data[z][0] : xmax;
                xmin = (data[z][0] < xmin) ? data[z][0] : xmin;
            }
        }


        if (data.length > 1) {interval = data[1][0] - data[0][0]; }

        r = (ymax - ymin);
        ymin = (ymin + (r / 2)) - (r / 1.5);
        ymin = 0;

        ymax = (ymax - (r / 2)) + (r / 1.5);

        xmin -= 0.6 * interval;
        xmax += 0.6 * interval;


        for (s in series) {
            data = series[s];

            for (z in data) {
                d = new Date();
                d.setTime(data[z][0]);
                dayid = d.getDay();

                x = ((data[z][0] - xmin) / (xmax - xmin)) * this.width;
                y = plot_height - (((data[z][1] - ymin) / (ymax - ymin)) * plot_height);

                //if (z==0) ctx.moveTo(x,y); else ctx.lineTo(x,y);

                barwidth = ((0.83 * interval) / (xmax - xmin)) * this.width;

                ctx.fillStyle = "#0699fa";
                if (dayid === 0 || dayid === 6) {ctx.fillStyle = "#0779c1"; }

                ctx.fillRect(x - (barwidth / 2), y - 7, barwidth, plot_height - y);

                // Text is too small if less than 2kWh
                if ((plot_height - y) > 35) {
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#ccccff";

                    ctx.font = "16px arial";
                    ctx.fillText((data[z][1] * scale).toFixed(0), x, y + 20 - 7);

                    ctx.font = "14px arial";
                    ctx.fillText(days[dayid], x, plot_height - 15);
                }
            }
            ctx.stroke();
        }
    }

};
