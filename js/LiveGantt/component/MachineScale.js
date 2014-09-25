define(['d3', 'util'], function(){
  'use strict';
  var translate = d3.util.translate;

  d3.scale.machine = function(machines){
    var 
        range,
        bandPadding,
        sortType = d3.scale.sortType.DEFAULT,
        y,
        n = machines.length,
        scale = 1,
        translate = 0
    ;

    function refresh(sort){ 
      switch(sortType){
        case(d3.scale.sortType.DEFAULT):
          var cloned = machines.slice(0);
          cloned.sort(function(a, b){
            if(a.machineTypeId === b.machineTypeId){
              return a.number - b.number;
            }
            return a.machineTypeId - b.machineTypeId;
          });
          y = function(machine){
            return cloned.indexOf(machine) * (range[1] - range[0] - machineScale.bandPadding()) / n + range[0] + machineScale.bandPadding();
          };
          break;
        case(d3.scale.sortType.TASK_START_AT):
          var cloned = machines.slice(0);
          cloned.sort(function(a, b){
            if(a.machineTypeId === b.machineTypeId) {
              if(a.operations[0].startAt.getTime() === b.operations[0].startAt.getTime()){
                return a.operations[a.operations.length - 1].endAt - b.operations[b.operations.length - 1].endAt;
              }
              return a.operations[0].startAt - b.operations[0].startAt;
            } else {
              return a.machineTypeId - b.machineTypeId;
            }
          });
          y = function(machine){
            return cloned.indexOf(machine) * (range[1] - range[0] - machineScale.bandPadding()) / n + range[0] + machineScale.bandPadding();
          };
          break;
        case(d3.scale.sortType.TASK_END_AT):
          var cloned = machines.slice(0);
          cloned.sort(function(a, b){
            if(a.machineTypeId === b.machineTypeId) {
              if(a.operations[a.operations.length-1].endAt.getTime() === b.operations[b.operations.length-1].endAt.getTime()){
                return a.operations[0].startAt - b.operations[0].startAt;
              }
              return a.operations[a.operations.length-1].endAt - b.operations[b.operations.length-1].endAt;
            } else {
              return a.machineTypeId - b.machineTypeId;
            }
          });
          y = function(machine){
            return cloned.indexOf(machine) * (range[1] - range[0] - machineScale.bandPadding()) / n + range[0] + machineScale.bandPadding();
          };
          break;
        default:
          var cloned = machines.slice(0);
          cloned.sort(sort);
          y = function(machine) {
            return cloned.indexOf(machine) * (range[1] - range[0] - machineScale.bandPadding()) / n + range[0] + machineScale.bandPadding();
          }
      }
    }
    
    function inRange(v){
      if(v<range[0])return range[0];
      if(v>range[1])return range[1];
      return v;
    }

    function machineScale(machine){
      var 
          offset = y(machine) * scale + translate;
      return inRange(offset);
    }
  
    machineScale.range = function(value){
      range = value;
      return machineScale;
    }

    machineScale.refresh = function(){
      refresh();
      return machineScale;
    }

    machineScale.options = function(newRange, newBandPadding){
      range = newRange;
      bandPadding = newBandPadding;
      return machineScale;
    }
    
    machineScale.bandWidth = function(machine){
      var 
          offset = y(machine) * scale + translate,
          width = (range[1] - range[0]) / n * (1 - bandPadding) * scale;

      return inRange(offset+width) - inRange(offset);
    };
    
    machineScale.bandPadding = function(value){
      if(!arguments.length) return (range[1] - range[0]) / n * (bandPadding);
      bandPadding = value;
      return machineScale;
    }

    machineScale.sort = function(criterion, sort){
      sortType = criterion;
      refresh(sort);
      return machineScale;
    }
    
    machineScale.order = function(order){
      y = function(machine){
        return (order[machine.id] - 1) * (range[1] - range[0] - machineScale.bandPadding()) / n + range[0] + machineScale.bandPadding();
      }
    };

    machineScale.scale = function(value){
      scale = value;
      return machineScale;
    }

    machineScale.translate = function(value){
      translate = value;
      return machineScale;
    }
    
    return machineScale;
  };


});
