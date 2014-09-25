define(['d3', 'util'], function(){
  'use strict';

  var 
    translate = d3.util.translate;

  d3.svg.timeAxis = function(options){
    if(!options)options = {};

    var 
      height,
      axisTop = d3.svg.axis().orient('bottom'),
      axisMainLine = d3.svg.axis().orient('bottom'),
      axisTopG,
      axisBottomG,
      axisMainLineG,
      g,
      reservedHeight,
      drag = d3.behavior.drag()
        .on('dragstart', function(){
          if(options.onDragStart)
            options.onDragStart();
          d3.event.sourceEvent.stopPropagation();
        })
        .on('drag', function(){
          options.onDrag();
          d3.event.sourceEvent.stopPropagation();
        })
        .on('dragend', function(){
          d3.event.sourceEvent.stopPropagation();
          if(options.onDragEnd)
            options.onDragEnd();
        })
        ;
    ;   
    function get(type, className, fromRight){
      var parent = g;
      if(Array.isArray(this)) {parent = this;}
      if(!parent.select('.' + className.replace(' ', '.')).empty())
        return parent.select('.' + className.replace(' ', '.'));
      return parent.append(type).attr('class', className)
    }

    function getG(className, fromRight){
      return get.call(this, 'g', className, fromRight);
    }
 

    function createG(){
      g = this.attr('class', 'time-axis')
      axisMainLineG = getG('mainline-axis')
        .attr('transform', d3.util.translate(0, height + 55))

      var e;
      e = 
      get.call(g, 'rect', 'top-axis-container')
        .style('fill', '#eee')
        .attr('width', '100%')
        .attr('height', reservedHeight)

      if(options.onDrag)
        e.call(drag).style('cursor', 'e-resize');
        ;

      axisTopG = getG('top-axis')
        .attr('transform', translate(0, reservedHeight * 0.2));
      
      e = 
      get.call(g, 'rect', 'bottom-axis-container')
        .attr('transform', translate(0, height-reservedHeight))
        .attr('width', '100%')
        .attr('height', reservedHeight)
        .style('fill', '#eee');

      if(options.onDrag)
        e.call(drag).style('cursor', 'e-resize');
      
      axisBottomG = getG('bottom-axis')
        .attr('transform', translate(0, height - reservedHeight * 0.2));
    }

    function timeAxis(){
      createG.call(this);
      
      axisMainLine.tickSize(-height - 50, 0).tickPadding(-reservedHeight);
      axisTop.tickSize(0, 0, 0);
      axisMainLineG.call(axisMainLine);
      axisTopG.call(axisTop.orient('bottom'));

      axisBottomG.call(axisTop.orient('top'));
    }

    timeAxis.onlyMainLine = function(){
      axisMainLine.tickSize(-height - 50, 0).tickPadding(-reservedHeight);
      this.attr('transform', d3.util.translate(0, height + 55)).call(axisMainLine);
    }

    timeAxis.withoutMainLine = function(){
      createG.call(this);
      
      axisTop.tickSize(0, 0, 0);
      axisTopG.call(axisTop.orient('bottom'));

      axisBottomG.call(axisTop.orient('top'));
    }

    timeAxis.scale = function(scale){
      axisTop.scale(scale);
      axisMainLine.scale(scale);
      return timeAxis;
    };

    timeAxis.height = function(newHeight){
      height = newHeight;
      reservedHeight = 16 + newHeight / 80;
      return timeAxis;
    };

    timeAxis.ticks = function(v){
      axisTop.ticks(v);
      axisMainLine.ticks(v);
    };

    timeAxis.availableRange = function(){
      return [
        height - reservedHeight,
        reservedHeight
      ];
    }
    
    timeAxis.style = function(a, b){
      axisTop.style(a, b);
      axisMainLine.style(a, b);
    }

    return timeAxis;
  };
});

