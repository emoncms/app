var graph_lines = {

    element: false,
    ctx: false,
    
    // Pixel width and height of graph
    width: 200,
    height: 200,
    
    draw: function (element, series, options) {
    
        // Initialise the canvas get context
        if (!ctx) {
            this.element = element;
            var c = document.getElementById(element);
            this.ctx = c.getContext("2d");
        }
        var ctx = this.ctx;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.width, this.height);
        
        // graph area is inset by 1 pixel on each edge so that axes 
        // line width is shown fully - otherwise axes appears thin
        var graph_left = 1;
        var graph_top = 1;
        var graph_width = this.width - (graph_left * 2);
        var graph_height = this.height - (graph_top * 2);
        
        // find out max and min values of data
        var xmin = undefined,
            xmax = undefined,
            ymin = undefined,
            ymax = undefined,
            s,
            z,
            x,
            y,
            data,
            ytick;
        
        for (s in series) {
            data = series[s].data;
            for (z in data) {
                if (xmin === undefined) {xmin = data[z][0]; }
                if (xmax === undefined) {xmax = data[z][0]; }
                if (ymin === undefined) {ymin = data[z][1]; }
                if (ymax === undefined) {ymax = data[z][1]; }
                            
                if (data[z][1] > ymax) {ymax = data[z][1]; }
                if (data[z][1] < ymin) {ymin = data[z][1]; }
                if (data[z][0] > xmax) {xmax = data[z][0]; }
                if (data[z][0] < xmin) {xmin = data[z][0]; }
            }
        }
        // var r = (ymax - ymin);
        // ymin = (ymin + (r / 2)) - (r/1.5);
        // ymax = (ymax - (r / 2)) + (r/1.5);
        
        ymax = Math.ceil(ymax / options.yaxis.major_tick) * options.yaxis.major_tick;
        ymin = 0;
        
        for (s in series)
        {
            ctx.strokeStyle = series[s].color;
            ctx.fillStyle = series[s].color;
            
            data = series[s].data;
            ctx.beginPath();
            for (z in data)
            {
                if (data[z][1] !== null) {
                    x = ((data[z][0] - xmin) / (xmax - xmin)) * graph_width;
                    y = graph_height - (((data[z][1] - ymin) / (ymax - ymin)) * graph_height);
                    if (z === 0) {
                        ctx.moveTo(graph_left + x, graph_top + y);
                    } else {
                        ctx.lineTo(graph_left + x, graph_top + y);
                    }
                }
            }
            ctx.stroke();
            
            y = graph_height - (((ymin - ymin) / (ymax - ymin)) * graph_height);
            ctx.lineTo(graph_left + x, graph_top + y);
            x = ((xmin - xmin) / (xmax - xmin)) * graph_width;
            ctx.lineTo(graph_left + x, graph_top + y);
            
            ctx.fill();
        }
        
        ctx.beginPath();
        
        // ------------------------------------------------------------------------
        // Axes and min/majour divisions
        // ------------------------------------------------------------------------
        ctx.textAlign    = "left";
        ctx.font = options.axes.font;
        ctx.fillStyle = options.axes.color;
        ctx.strokeStyle = options.axes.color;
        
        ctx.fillText(options.yaxis.title, graph_left + 4, 15);
        
        // X-AXES
        xmin = Math.floor(xmin / options.xaxis.minor_tick) * options.xaxis.minor_tick;
        var xtick = xmin;
        
        ctx.beginPath();
        while (xtick < xmax) {
            xtick += options.xaxis.minor_tick;
            x = ((xtick- xmin) / (xmax - xmin)) * graph_width;
            
            var date = new Date(xtick),
                hours = date.getHours(),
                minutes = date.getMinutes(),
                seconds = date.getSeconds();
            if (minutes < 10) {minutes = "0" + minutes; }
            
            if (date % options.xaxis.major_tick === 0) {
                ctx.fillText(hours + ":" + minutes, graph_left + x + 4, graph_top + graph_height - 5);
                ctx.moveTo(graph_left + x, graph_top + graph_height - 0);
                ctx.lineTo(graph_left + x, graph_top + graph_height - 18);
            } else {
                ctx.moveTo(graph_left + x, graph_top + graph_height - 0);
                ctx.lineTo(graph_left + x, graph_top + graph_height - 5);
            }
        }
        ctx.stroke();
        
        // Y-AXES
        ctx.beginPath();
        
        ytick = 0;
        while (ytick < ymax) {
            ytick += options.yaxis.minor_tick;
            y = this.height - (((ytick - ymin) / (ymax - ymin)) * this.height);
            
            if (ytick % options.yaxis.major_tick === 0) {
                ctx.fillText(ytick + options.yaxis.units, graph_left + 4, graph_top + y - 5);
                ctx.moveTo(graph_left, graph_top + y);
                ctx.lineTo(graph_left + 20, graph_top + y);
            } else {
                ctx.moveTo(graph_left, graph_top + y);
                ctx.lineTo(graph_left + 5, graph_top + y);
            }
        }
        ctx.stroke();
        
        // Axes
        ctx.beginPath();
        // x-axis
        ctx.moveTo(graph_left, graph_top + graph_height);
        ctx.lineTo(graph_left + graph_width, graph_top + graph_height);
        // y-axis
        ctx.moveTo(graph_left, graph_top + graph_height);
        ctx.lineTo(graph_left, graph_top);
        ctx.stroke();
        
        ctx.beginPath();
    }
};
