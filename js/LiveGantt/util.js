define(['d3'], function(){
  'use strict';
  function narrow(a, b, c){
    return Math.max(Math.min(b, c), a);
  }

  d3.dynamic = {view: {
    main: {},
    thumbnail: {}
  }};
  
    
  d3.dynamic.view.main.fontSize = function(length, unit){
    return Math.min((0.8 + Math.round(length / 700) / 10), 0.9) + (unit ? 0 : 'em');
  }

  d3.dynamic.view.main.machineTypeLabelFontSizeRaw = function(length){
    return Math.max((0.8 + Math.round(length / 250) / 10), 0.9);
  }

  d3.dynamic.view.main.machineTypeLabeldy = function(length){
    return -Math.max((0.8 + Math.round(length / 250) / 10), 0.9) / 1.6 + 'em';
  }

  d3.dynamic.view.main.machineLabelFontSize = function(length){
    return '0.9em';
  }

  d3.dynamic.view.main.machineLabelDy = function(length){
    return '0.4em';
    //return Math.max((0.8 + Math.round(length / 250) / 10), 0.9) / 1.6 + 'em';
  }

  d3.dynamic.view.main.operationLabelFontSize = function(eachHeight){
    return narrow(
        0.05,
        Math.round(eachHeight / 3) / 10,
        1
    ) + 'em';
  }

  d3.dynamic.view.main.operationLabelDy = function(width){
    return '0.4em'; //Math.max(Math.round(width / 500) / 10, 0.1)  + 'em';
  }

  d3.dynamic.view.main.ticks = function(length){
    if(length < 250)
      return 2;
    return 2 + Math.floor(length / 100);
  }


  d3.dynamic.view.main.timeXMarginLeft = function(width, height, bytes) {
    return 20 + 6 * bytes;
  }

  d3.dynamic.view.main.timeXMarginRight = function(width, height) {
    return 15 + width / 50;
  }

  

  d3.util = {};

  var timers = {};
  d3.util.timer = {
    start: function(id){
      timers[id] = new Date().getTime();
    },
    end: function(id){
      var now = new Date().getTime();
      console.log(id, (now - timers[id]) / 1000);
    }
  };


  d3.util.translate = function(x, y){
    return 'translate(' + x + ',' + y + ')';
  };

  d3.util.transform = function(x, y, sx, sy){
    if(!sy) sy = sx;
    return 'translate(' + x + ',' + y + ')' + ' scale(' + sx + ',' + sy + ')';
  };

  d3.util.url = function(id){
    return 'url(#'+id+')'
  }
  
  d3.util.rgb = function(r, g, b){
    return ['rgb(', r, ',', g, ',', b, ')'].join('');
  }

  d3.util.colorScale = function(value, min, max, minColor, zeroColor, maxColor) {
    if(value > 0) {
      var r = value / max;
      return d3.rgb(
        zeroColor.r * (1 - r) + maxColor.r * r,
        zeroColor.g * (1 - r) + maxColor.g * r,
        zeroColor.b * (1 - r) + maxColor.b * r
      );
    } else if(value < 0) {
      var r = value / min;
      return d3.rgb(
        zeroColor.r * (1 - r) + minColor.r * r,
        zeroColor.g * (1 - r) + minColor.g * r,
        zeroColor.b * (1 - r) + minColor.b * r
      );
    } 
    return zeroColor;
  }

  d3.util.timeWrap = function(time, startAt, endAt){
    if(time < startAt) return startAt;
    if(time > endAt) return endAt;
    return time;
  };

  d3.scale.sortType = {
    DEFAULT: 1,
    TASK_START_AT: 2,
    TASK_END_AT: 3,
    FOCUS_TIME: 4
  };

  d3.util.dateTimeTag = function(dateTime){
    return d3.time.format('%Y-%m-%d %H:%M:%S')(dateTime);
  }
    
  d3.util.hours = function(hours){
    return 1000 * 60 * 60 * hours;
  }

  d3.util.minutes = function(minutes){
    return 1000 * 60 * minutes;
  }

  d3.util.days = function(days){
    return 1000 * 60 * 60 * 24 * days;
  }
  
  d3.util.numberWithCommas = function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  d3.util.memset = function(array, value) {
    for(var i=array.length - 1;i>=0;--i)
      array[i] = value;
  }

  d3.util.decimalFormat = function(x, v){
    var t = Math.pow(10, v);
    return Math.round(x * t) / t;
  }

  d3.util.parseTranslation = function(t){
    var r = /translate\((.*),(.*)\)/;
    var e = r.exec(t);
    if(e)
      return [parseFloat(e[1]), parseFloat(e[2])];
    return [0, 0];
  }

  d3.util.adjustLabel = function(g){
    var 
        ticks = g.selectAll('.tick'),
        tick1 = d3.select(ticks[0][0]),
        tick2 = d3.select(ticks[0][ticks[0].length - 1])
    ;
    
    tick1.select('text').attr('transform', d3.util.translate(0, -6));
    if(d3.util.parseTranslation(tick2.attr('transform'))[1] < 30)
      tick2.select('text').attr('transform', d3.util.translate(0, 6));
  }


  d3.util.groupBy = function(array, f, s){
    var 
        result = {},
        resultArray = []
    ;

    array.forEach(function(v){
      var c = f(v);
      if(!result[c])
        result[c] = {
          key: c,
          values: []
        }
      result[c].values.push(v);
    });
    
    Object.keys(result).forEach(function(key){
      resultArray.push(result[key]);
    });
    if(s)
      return resultArray.sort(s);
    
    return resultArray.sort(function(a, b){
      return a.key - b.key;
    });
  }

  d3.util.cloneHash = function(h){
    if(!h){ return h; }
    var r = {};
    Object.keys(h).forEach(function(key){
      r[key] = h[key];
    });
    return r;
  };

  d3.util.flatten = function(array){ 
    var child, result = [];
    array.forEach(function(a){
      result.push(a);
      child = a.child;
      delete a.child;
      if(child && child.length > 0)
        result = result.concat(d3.util.flatten(child));
    });
    return result;
  }
  
  d3.util.intervalReader = function(interval){
    if(interval < d3.util.minutes(1)) {
      return '<span class="interval">' + Math.round(interval / 100) / 10 + '</span> seconds'
    }
    if(interval < d3.util.hours(1)) {
      return '<span class="interval">' + Math.round(interval / 60 / 100) / 10 + '</span> minutes';
    }
    if(interval < d3.util.days(1)) {
      return '<span class="interval">' + Math.round(interval / 60 / 60 / 100) / 10 + '</span> hours';
    }

    return '<span class="interval">' + Math.round(interval / 24 / 60 / 60 / 100) / 10 + '</span> days';
  }

  d3.util.$$ = function(svg){
    return $(svg[0][0]);
  }

  d3.util.select = d3.util.select$ = function($){
    return d3.select($[0]);
  }

  Array.remove = function(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
  }


  d3.util.getBBox = function(ele){
    return d3.select(ele)[0][0].getBBox();
  }

  d3.util.cloneJSON = function(json){
    return JSON.parse(JSON.stringify(json));
  }

  d3.util.countBytes = function(string){
    var i, b = 0;
    for(i=0;i<string.length;++i){
      b += (string.charCodeAt(i) > 256 ? 2 : 1);
    }
    return b;
  }
});
