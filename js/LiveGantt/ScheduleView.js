define([
'LiveGantt/ScheduleView/aggregate',
'LiveGantt/ScheduleView/formatter',
'LiveGantt/ScheduleView/machineLabels',
'LiveGantt/component/Popover',

'd3', 
'util', 
'LiveGantt/component/DraggableLine',
'LiveGantt/component/Stripe',
'LiveGantt/component/TimeAxis',
'LiveGantt/component/MachineScale',
'LiveGantt/component/TimeMarker'
], function(
aggregate,
Formatter,
MachineLabels,
Popover
) {
  'use strict';

  var translate = d3.util.translate;

  function ScheduleView(schedule) {
    this.schedule = schedule;
    
    var 
      view = this,
      schedule = this.schedule,
      period = [schedule.startAtTime, schedule.endAtTime],
      wrappedMachines = schedule.machines.map(function(m){
        return {
          machine: m,
          wrappedOperations: m.operations.map(function(o){
            return {operation: o, jobType: o.jobType}
          })
        }
      }),
      wrappedOperations = wrappedMachines.map(function(wm){return wm.wrappedOperations}).reduce(function(a, b){return a.concat(b);}, []),
      y = d3.scale.machine(schedule.machines).bandPadding(0),
      aggregated,
      focusAtTime = period[0] * 0.5 + period[1] * 0.5,
      mode = 1,
      sortType = d3.scale.sortType.DEFAULT,
      popover = Popover(),
      operationDirty = true,
      aggregationDirty = true,
      isFocusLineDragging = false
      ;

    function widthGetter(r){return r.width;}
    function heightGetter(r){return r.height;}
    function transformGetter(r){return translate(r.x, r.y);}
    function jobTypeColorGetter(r){return r.jobType.color;}
    function rectSetter(a){a.rect = d3.select(this);}
    function labelTransformGetter(r){return translate(r.x + r.width / 2, r.y + r.height / 2);}

    function opacityGetter3(aggr){
      if(aggr.level == 0 && !aggr.finished) {
        if(aggr.backward) return 0.3;
        return 1;
      }
      return 0.3;
    }
      
    var 
        svg,
        g,
        width,
        height,
        marginLeft = 50,
        marginRight = 20,
        timeX = d3.time.scale().clamp(true),
        x = d3.scale.linear(),
        timeAxis = d3.svg.timeAxis().scale(timeX),
        availableRange,
        availableHeight,
        focusLine = d3.svg.draggableLine().scale(x).options({
          onDragStart: function(){view.onFocusLineDragStart();},
          onDrag: function(){view.onFocusLineDrag();},
          onDragEnd: function(){view.onFocusLineDragEnd();}
        }),
        striper,
        timeMarker = d3.svg.timeMarker(x)
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

    view.render = function(_svg, _g) {
      if(_svg) {svg = _svg; g = _g;}

      var jts = view.schedule.jobTypes.slice(); 
      striper = d3.svg.stripe.call(svg.select('defs'), jts);

      var range = [marginLeft, width - marginRight],
          domain = [period[0], period[1]];

      x.range(range).domain(domain);
      timeX.range(range).domain(domain.map(function(x){return new Date(x);}));

      timeAxis.height(height).ticks(d3.dynamic.view.main.ticks(width))

      availableRange = timeAxis.availableRange().reverse();
      availableHeight = availableRange[1] - availableRange[0];

      y.range(availableRange);

      focusLine.range(availableRange).scale(x).set(focusAtTime);

      getG('time-axis-mainline')
        .call(timeAxis.onlyMainLine);

      getG('aggrOperations').style('display','none');
      getG('operations').style('display', 'none');

      getG('focus-line-g')
        .call(focusLine);

      view.renderRects();

      getG('time-axis')
        .call(timeAxis.withoutMainLine)
        .style('font-size', d3.dynamic.view.main.fontSize(width));
      

      MachineLabels.render(getG, y, schedule, marginLeft);

      g.call(timeMarker);
    }

    view.renderRects = function(){
      focusLine.set(focusAtTime);
      switch(mode){
        case 1:
          focusLine.hide();
        case 2:
          //항상 (0,0) 1배 줌인 걸로만 그린다!
          getG('aggrOperations').style('display','none');
          getG('operations').style('display', 'inline');

          var operationsG = getG('operations');
          var operations = 
            operationsG
            .selectAll('.operation');
          
          var redraw = false;
          if(mode == 1 && operationDirty){
            y.sort(sortType);
            operationDirty = false;
            redraw = true;
          } else if(mode == 2 && aggregationDirty){
            aggregated = aggregate(schedule.machines, schedule.machineTypes, focusAtTime, period);
            y.order(aggregated[1]);
            aggregationDirty = false;
            redraw = true;
          }
          
          if(redraw){
            wrappedMachines.forEach(function(wm){
              var ry = y(wm.machine);
              var h = y.bandWidth(wm.machine);
              wm.y = ry;
              wm.wrappedOperations.forEach(function(wo){
                wo.x = x(wo.operation.startAtTime);
                wo.y = ry;
                wo.height = h;
                wo.width = x(wo.operation.endAtTime) - wo.x;
              });
            });

            var machines = operationsG.selectAll('.machine').data(wrappedMachines);
            machines.enter().append('g').attr('class', 'machine').attr('transform', function(wm){
                 return translate(0, wm.y);
              });


            machines.exit().remove();
            (isFocusLineDragging ? machines : machines.transition().duration(300))
              .attr('transform', function(wm){
                 return translate(0, wm.y);
              });

            operations = 
              machines
                .selectAll('.operation')
                .data(function(wm){return wm.wrappedOperations;})

            operations
              .enter()
                .append('rect')
                  .attr('class', 'operation')
                  .on('mouseover', view.onOperationMouseOver)
                  .on('mouseout', view.onOperationMouseOut)
                  .each(rectSetter);

            operations
              .exit()
                .remove();

            operations
              .attr('transform', function(wo){return translate(wo.x, 0);})
              .attr('height', heightGetter)
              .attr('width', widthGetter)
              .attr('fill', jobTypeColorGetter)
          }

          break;
        case 3:
          getG('operations').style('display', 'none');
          getG('aggrOperations').style('display','inline');

          var aggrOperations = 
          getG('aggrOperations')
            .selectAll('.aggrOperation');

          if(aggregationDirty) {
            aggregated = aggregate(schedule.machines, schedule.machineTypes, focusAtTime, period);
            y.order(aggregated[1]);
            aggregated = aggregated[0];  
            aggregationDirty = false;

            aggrOperations = 
            getG('aggrOperations')
              .selectAll('.aggrOperation')
              .data(aggregated)
            
            aggrOperations
              .enter()
                .append('rect')
                  .attr('class', 'aggrOperation')
                  .on('mouseover', view.onAggrOperationMouseOver)
                  .on('mouseout', view.onAggrOperationMouseOut)

            aggrOperations
              .exit()
                .remove();

            aggrOperations
              .each(rectSetter);
            aggregationDirty = false;
          } 
          
          aggregated.forEach(function(aggr){
            aggr.x = x(aggr.x1);
            aggr.y = d3.min(aggr.machines.map(function(r){return y(r);}));
            aggr.height = d3.sum(aggr.machines.map(y.bandWidth));
            aggr.width = x(aggr.x2) - aggr.x;
          });

          aggrOperations
            .attr('transform', transformGetter)
            .attr('height', heightGetter)
            .attr('width', widthGetter)
            .attr('fill', jobTypeColorGetter)
            .style('opacity', opacityGetter3)
          break;
      }          
    }

    view.width = function(value) {
      if(!arguments.length) return width;
      width = value;
      return view;
    }

    view.height = function(value) {
      if(!arguments.length) return height;
      height = value;
      return view;
    }
    
    view.update = function(value1, value2)
    {
      if(mode == value1 && sortType == value2)
        return;
      mode = value1;
      sortType = value2;
      if(mode == 2 || mode == 3) {
        aggregationDirty = true;
      } else {
        operationDirty = true;
      }
      view.renderRects();
    }



    /************************* 
        View Event Handlers
    **************************/

    view.onFocusLineDragStart = function(){
    }

    view.onFocusLineDrag = function(){
      focusAtTime = x.invert(d3.event.x);
      timeMarker.set(focusAtTime);
      aggregationDirty = true;
      view.renderRects();
      isFocusLineDragging = true;
    }

    view.onFocusLineDragEnd = function(){
      isFocusLineDragging = false;
      timeMarker.hide();
    }

    view.onAggrOperationMouseOver = function(aggr){
      var offset = $(svg[0]).offset();
      popover
        .show()
        .title(Formatter.aggrTitleFormatter(aggr))
        .content(Formatter.aggrContentFormatter(aggr, focusAtTime))
        .set(aggr.x + aggr.width / 2 + offset.left, aggr.y + offset.top, aggr.height);
      aggr.rect.attr('fill', striper(aggr.jobType))
    }

    view.onAggrOperationMouseOut = function(aggr){
      popover.hide();
      aggr.rect.attr('fill', aggr.jobType.color)
    }

    view.onOperationMouseOver = function(operation){
      var 
          offset = $(svg[0]).offset(),
          x = operation.x + offset.left + operation.width / 2,
          y = operation.y + offset.top, 
          h = operation.height;

      popover
        .show()
        .title(Formatter.titleFormatter(operation))
        .content(Formatter.contentFormatter(operation, focusAtTime))
        .set(x, y, h);
      operation.rect.attr('fill', striper(operation.jobType));
    }

    view.onOperationMouseOut = function(operation){
      popover.hide();
      operation.rect.attr('fill', operation.jobType.color);
    }
  }

  return ScheduleView;
});
