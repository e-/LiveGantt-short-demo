define(['d3', 'util'], function(){
  'use strict';

  d3.svg.draggableLine = function(options){
    var 
        x,
        range,
        line,
        lastValue,
        lastX,
        drag = d3.behavior.drag().on('dragstart', onDragStart).on('drag', onDrag).on('dragend', onDragEnd),
        handle,
        domain,
        xRange,
        g,
        active = true
    ;

    function onDragStart(){
      if(active)
        options.onDragStart();
    }

    function onDrag(){
      if(active) {
        if(d3.event.x < xRange[0])
          d3.event.x = xRange[0];
        if(d3.event.x > xRange[1])
          d3.event.x = xRange[1];
        g
          .attr('transform', d3.util.translate(d3.event.x, range[0]));
        options.onDrag();
      }
    }

    function onDragEnd(){
      if(active)
        options.onDragEnd();
    }
    
    function onContextMenu(){
      if(active)
        (options.onContextMenu || function(){})();
    }

    function get(type, className, fromRight){
      var parent = g;
      if(Array.isArray(this)) {parent = this;}
     
      if(!parent.select('.' + className.replace(' ', '.')).empty())
        return parent.select('.' + className.replace(' ', '.'));
      return parent.append(type).attr('class', className)
    }
    
    function draggableLine(){
      g = this;
      g
        .attr('transform', d3.util.translate(lastX, range[0]));

      line=
      get('line', 'focus-line')
        .attr('x2', 0)
        .style('pointer-events','none')
        .attr('y2', range[1] - range[0])

      handle =
      get('rect', 'handle')
        .attr('width', 13)
        .attr('height', range[1] - range[0])
        .style('cursor', 'ew-resize')
        .style('opacity', 0)
        .attr('transform', d3.util.translate(-6, 0))
        .on('contextmenu', onContextMenu)

      g.call(drag);
    }

    draggableLine.scale = function(scale){
      x = scale;
      xRange = x.range();
      return draggableLine;
    };

    draggableLine.range = function(newRange){
      range = newRange;
      return draggableLine;
    };

    draggableLine.set = function(value, transition){
      lastValue = value;
      lastX = x(value);
      if(line) {
        g
          .style('display', 'inline')
          .style('opacity', 1)
          .attr('transform', d3.util.translate(lastX, range[0]))
      }

      return draggableLine;
    };
    
    draggableLine.hide = function(){
      if(line) {
        g.style('display', 'none');
      }
    }
    
    draggableLine.style = function(a, b){
      return line.style(a, b);
    }
    
    draggableLine.options = function(value){
      options = value;
      return draggableLine;
    }

    return draggableLine;
  }

});
