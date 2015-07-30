var graph_lines = {

    element: false,
    ctx: false,
    
    // Pixel width and height of graph
    width: 200,
    height: 200,
    
    bottom: 15,
    
    
    draw: function(element,series) {
    
        // Initialise the canvas get context
        if (!ctx) 
        {
            this.element = element;
            var c = document.getElementById(element);  
            this.ctx = c.getContext("2d");
        }
        
        var ctx = this.ctx;
        
        // Clear canvas
        ctx.clearRect(0,0,this.width,this.height);
        
        var plot_height = this.height - this.bottom;
        
        // OEM Blue
        ctx.strokeStyle = "#0699fa";
        ctx.fillStyle = "#0699fa";
        
        // Axes
        //ctx.moveTo(0,plot_height);
        //ctx.lineTo(this.width,plot_height);
        //ctx.stroke();
        
        // Axes label
        ctx.textAlign    = "left";
        ctx.font = "16px arial";
        //ctx.fillText('Power',10,15);
        
        // find out max and min values of data
        
        var xmin = undefined;
        var xmax = undefined;
        var ymin = undefined;
        var ymax = undefined;
        
        for (s in series)
        {
            var data = series[s];
            for (z in data)
            {
                if (xmin==undefined) xmin = data[z][0];
                if (xmax==undefined) xmax = data[z][0];
                if (ymin==undefined) ymin = data[z][1];
                if (ymax==undefined) ymax = data[z][1];
                            
                if (data[z][1]>ymax) ymax = data[z][1];
                if (data[z][1]<ymin) ymin = data[z][1];
                if (data[z][0]>xmax) xmax = data[z][0];
                if (data[z][0]<xmin) xmin = data[z][0];               
            }
        }
        // var r = (ymax - ymin);
        // ymin = (ymin + (r / 2)) - (r/1.5);
        // ymax = (ymax - (r / 2)) + (r/1.5);
        ymin = 0;
        
        
        ctx.font = "12px arial";
        ctx.strokeStyle = "#666";
        ctx.fillStyle = "#666";
        
        tickspacing = Math.round((ymax-ymin) / 10);
        var ytick = 0;
        while(ytick<ymax) {
            ytick += tickspacing;
            var y = plot_height - (((ytick - ymin) / (ymax - ymin)) * plot_height);
            ctx.fillText(ytick,5,y+4);
            // ctx.moveTo(0,y);
            // ctx.lineTo(3,y);
        }
        ctx.stroke();
        
        ctx.textAlign    = "center";
        tickspacing = Math.round((xmax-xmin) / 1000)*1000/10;
        
        var xtick = xmin;
        while(xtick<xmax) {
            xtick += tickspacing;
            var x = ((xtick- xmin) / (xmax - xmin)) * this.width;
            
            var date = new Date(xtick);
            var hours = date.getHours();
            var minutes = date.getMinutes();
            if (minutes<10) minutes = "0"+minutes;
            
            ctx.fillText(hours+":"+minutes,x,this.height);
            //ctx.moveTo(x,100);
            //ctx.lineTo(x,105);
        }
        ctx.stroke();
        
        ctx.strokeStyle = "#0699fa";
        for (s in series)
        {
            var data = series[s]; 
            ctx.beginPath();
            for (z in data)
            {
                if (data[z][1]!=null) {
                    var x = ((data[z][0] - xmin) / (xmax - xmin)) * this.width;
                    var y = plot_height - (((data[z][1] - ymin) / (ymax - ymin)) * plot_height);
                    if (z==0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
                }
            }
            ctx.stroke();
            
            var y = plot_height - (((ymin - ymin) / (ymax - ymin)) * plot_height);
            ctx.lineTo(x,y);
            var x = ((xmin - xmin) / (xmax - xmin)) * this.width;
            ctx.lineTo(x,y);
            ctx.fillStyle = "rgba(6,153,250,0.5)";
            ctx.fill();
        }
        
        ctx.beginPath();
    }
};
