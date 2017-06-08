var graph_bars = {

    element: false,
    ctx: false,
    
    // Pixel width and height of graph
    width: 200,
    height: 200,
    
    bottom: 0,
    
    
    draw: function(element,series) {
    
        // Initialise the canvas get context
        if (!ctx) 
        {
            this.element = element;
            var c = document.getElementById(element);  
            this.ctx = c.getContext("2d");
        }
        
        var ctx = this.ctx;
        
        // Clear canvasat
        ctx.clearRect(0,0,this.width,this.height);
        
        var plot_height = this.height - this.bottom;
        
        // OEM Blue
        ctx.strokeStyle = "#0699fa";
        ctx.fillStyle = "#0699fa";
        
        // Axes
        ctx.moveTo(0,0);
        ctx.lineTo(0,plot_height);
        ctx.lineTo(this.width,plot_height);
        ctx.stroke();
        
        // Axes label
        ctx.textAlign    = "left";
        ctx.font = "16px arial";
        ctx.fillText('kWh',10,15);
        
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
        
        var interval = 1;
        if (data.length>1) interval = data[1][0] - data[0][0];
        
        var r = (ymax - ymin);
        ymin = (ymin + (r / 2)) - (r/1.5);
        ymin = 0;
        
        ymax = (ymax - (r / 2)) + (r/1.5);
        
        xmin -= 0.6*interval;
        xmax += 0.6*interval;
        
        var scale = 1;
        var days = ['S','M','T','W','T','F','S'];
        
        for (s in series)
        {
            var data = series[s];
            
            for (z in data)
            {
                var d = new Date();
                d.setTime(data[z][0]);
                var dayid = d.getDay();
                
                var x = ((data[z][0] - xmin) / (xmax - xmin)) * this.width;
                var y = plot_height - (((data[z][1] - ymin) / (ymax - ymin)) * plot_height);
                  
                //if (z==0) ctx.moveTo(x,y); else ctx.lineTo(x,y);   
                  
                var barwidth = ((0.83*interval) / (xmax - xmin)) * this.width;
                
                ctx.fillStyle = "#0699fa";
                if (dayid==0 || dayid==6) ctx.fillStyle = "#0779c1";
                
                ctx.fillRect(x-(barwidth/2),y-7,barwidth,plot_height-y);
                  
                // Text is too small if less than 2kWh
                if ((plot_height-y)>35) {
                    ctx.textAlign    = "center";
                    ctx.fillStyle = "#ccccff";
                    
                    ctx.font = "14px arial";
                    ctx.fillText((data[z][1]*scale).toFixed(0),x,y+20-7);
                    
                    ctx.font = "14px arial";
                    ctx.fillText(days[dayid],x,plot_height-15);
                }
            }
            ctx.stroke();
        }
    }

};
