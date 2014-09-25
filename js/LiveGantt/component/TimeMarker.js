define(['d3', 'util'], function(){
  'use strict';

  d3.svg.timeMarker = function(x, options){
    var
        text1, 
        text2,
        lastValue,
        formatter1 = d3.time.format('%Y-%m-%d'),
        formatter2 = d3.time.format('%H:%M:%S'),
        g
    ;
    if(!options) options = {};
    function get(type, className, fromRight){
      var parent = g;
      if(Array.isArray(this)) {parent = this;}
     
      if(!parent.select('.' + className.replace(' ', '.')).empty())
        return parent.select('.' + className.replace(' ', '.'));
      var q = parent.append(type).attr('class', className);
      if(fromRight) q.attr('transform', translate(2500, 0));
      return q;
    }

    function getG(className, fromRight){
      return get.call(this, 'g', className, fromRight);
    }


    function timeMarker(){
      g = getG.call(this, 'time-marker')
      get('rect', options.className ? options.className : 'time-marker-rect')
        .attr('width', 70)
        .attr('height', 25)
        .attr('rx', 3)
        .attr('ry', 3)
      ;

      text1 = 
      get('text', 'time-marker-date')
        .attr('dx', 35)
        .attr('dy', '1.1em')
      ;

      text2 = 
      get('text', 'time-marker-time')
        .attr('dx', 35)
        .attr('dy', '2em')
      ;
     
      get('path', options.className ? options.className : 'time-marker-path')
        .attr('d', 'm31,25l8,0l-4,4z')
      
      timeMarker.hide();
    }

    timeMarker.hide = function(){
      g.style('opacity', 0);
    }

    timeMarker.set = function(value){
      lastValue = value;
      g
        .style('opacity', 1)
        .attr('transform', d3.util.translate(x(value) - 35, 0))
      ;

      text1.text(formatter1(new Date(value)));
      text2.text(formatter2(new Date(value)));
      return timeMarker;
    }

    timeMarker.refresh = function(){
      var domain = x.domain();
      if(domain[0] <= lastValue && lastValue <= domain[1])
        timeMarker.set(lastValue);
      else
        timeMarker.hide();
    }

    timeMarker.setVisibility = function(visibility)
    {
      g.style('display', visibility ? 'inline' : 'none');
    }

    return timeMarker;
  }
});
