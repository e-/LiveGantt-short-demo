define(['util'], function(Config){
  'use strict';
  var order, orderCount, orderInAggr, orderInAggrCount, recursionCount,
      groupBy = d3.util.groupBy,
      aggrTimeInterval = d3.util.hours(4)
  ;

  function getAggrIndex(time, startAt){
    return Math.floor((time - startAt) / aggrTimeInterval);
  }

  function getPrevAggrIndex(time, startAt){
    return Math.floor((startAt - time) / aggrTimeInterval);
  }

  function getConsOperationStartAtTime(r){
    return r.consOperation.startAtTime;
  }
  function getConsOperationEndAtTime(r){
    return r.consOperation.endAtTime;
  }
  function getConsOperation(r){
    return r.consOperation;
  }

  function recursiveAggregate(machines, focusAtTime, level, rootConsOperation, filteredTime){
    recursionCount ++;
    var results = [], result;
    if(machines.length == 1){
      var machine = machines[0],
          consOperation = machine.consOperation,
          prevResult = rootConsOperation;
      orderInAggr[machine.id] = orderInAggrCount++;
      
      while(consOperation){
        results.push(result = {
          x1: consOperation.startAtTime,
          x2: consOperation.endAtTime,
          machines: machines,
          jobType: consOperation.jobType,
          level: level,
          operations: [consOperation],
          next: []
        });
        prevResult.next.push(result);
        prevResult = result;
        consOperation = consOperation.next;
        level++;
      }
      return results;
    }
    var groups = groupBy(machines, function(r){
       return (!r.consOperation) + 0;
    });
    groups.forEach(function(group){
      if(group.key) { // finished
        group.values.forEach(function(r){
          orderInAggr[r.id] = orderInAggrCount++;
        });
      } else { // notfinished
        var groups2 = groupBy(group.values, function(r){ 
          // group by job type
          return r.consOperation.jobType.id;
        }, function(a, b){
          return d3.min(a.values, function(r){return r.consOperation.startAtTime;})
          - d3.min(b.values, function(r){return r.consOperation.startAtTime;});
        });
        
        groups2.forEach(function(group2){
          (function(group3){
            var groups4 = groupBy(group3.values, function(r){
              return r.consOperation.startAtTime < focusAtTime + 0; //r.consOperation.focused + 0;
            }, function(a, b){return b.key - a.key;});
            groups4.forEach(function(group4){
              var minEndAt, groups5;
              
              if(group4.key) {
                minEndAt = d3.min(group4.values.map(getConsOperationEndAtTime));
                groups5 = groupBy(group4.values, function(r){
                  return getAggrIndex(r.consOperation.endAtTime, minEndAt);
                });
              } else {
                minEndAt = d3.min(group4.values.map(getConsOperationStartAtTime));
                groups5 = groupBy(group4.values, function(r){
                  return getAggrIndex(r.consOperation.startAtTime, minEndAt);
                });
              }

              groups5.forEach(function(group5){
                var 
                    endAtTime = d3.mean(group5.values.map(getConsOperationEndAtTime))
                ;
                results.push(result = {
                  x1: (group4.key ? focusAtTime : d3.mean(group5.values.map(getConsOperationStartAtTime))),
                  x2: endAtTime,
                  machines: group5.values,
                  operations: group5.values.map(getConsOperation),
                  jobType: group5.values[0].consOperation.jobType,
                  level: level,
                  next: []
                });
                rootConsOperation.next.push(result);
                
                group5.values.forEach(function(r){
                  while(1) {
                    r.consOperation = d3.util.cloneHash(r.consOperation.next);
                    if(!r.consOperation)
                      break;
                    if(filteredTime[1] < r.consOperation.startAtTime) {
                      r.consOperation = undefined;
                      break;
                    }
                    if(r.consOperation.startAtTime < endAtTime)
                      r.consOperation.startAtTime = endAtTime;
                    if(endAtTime < r.consOperation.startAtTime && r.consOperation.startAtTime < endAtTime + aggrTimeInterval) {
                      r.consOperation.startAtTime = endAtTime; 
                    }

                    if(r.consOperation.startAtTime < r.consOperation.endAtTime)
                      break;
                  }
                });

                result.child = 
                  recursiveAggregate(group5.values, endAtTime + 1, level + 1, result, filteredTime);
              });
            });
          })(group2);
        });
      }
    });
    return results;
  }

  function recursiveBackwardAggregate(machines, focusAtTime, level, filteredTime){
    // order (determined during forward aggregation) should be kept during backward aggregation.
    recursionCount ++;
    
    var
        i,
        length = machines.length,
        results = [],
        prevConsOperation,
        consOperation,
        aggrMachines = [],
        machine
    ;
    if(length == 0) return [];
    if(length == 1) {
      machine = machines[0];
      if(!machine) return [];
      consOperation = machine.consOperation;
      while(consOperation){
        results.push({
          x1: consOperation.startAtTime,
          x2: Math.min(consOperation.endAtTime, focusAtTime),
          machines: machines,
          jobType: consOperation.jobType,
          level: level,
          backward: true,
          operations: [consOperation]
        });
        consOperation = consOperation.prev;
        level++;
      }
      return results;
    }

    function backwardAggregate(machines){
      var startAtTime = d3.mean(machines.map(getConsOperationStartAtTime));
      if(!machines.length) return;
      results.push({
        x1: startAtTime,
        //x2: focusAtTime,
        x2: Math.min(focusAtTime, d3.mean(machines.map(getConsOperationEndAtTime))), //focusAtTime
        machines: machines,
        jobType: machines[0].consOperation.jobType,
        operations: machines.map(getConsOperation),
        level: level,
        backward: true
      });
      machines.forEach(function(machine){
        while(1) {
          machine.consOperation = d3.util.cloneHash(machine.consOperation.prev);
          if(!machine.consOperation)
            break;
          if(filteredTime[1] < machine.consOperation.startAtTime) {
            machine.consOperation = undefined;
            break;
          }
          machine.consOperation.startAtTime = machine.consOperation.startAtTime;
          machine.consOperation.endAtTime = machine.consOperation.endAtTime;

          if(machine.consOperation.endAtTime > startAtTime) 
            machine.consOperation.endAtTime = startAtTime;
          if(startAtTime > machine.consOperation.endAtTime && machine.consOperation.endAtTime > startAtTime - aggrTimeInterval)
            machine.consOperation.endAtTime = startAtTime;
          if(machine.consOperation.startAtTime < machine.consOperation.endAtTime)
            break;
        }
      });
      results = results.concat(recursiveBackwardAggregate(machines, startAtTime - 1, level + 1, filteredTime));
    }

    for(i=0; i<length; ++i){ 
      machine = machines[i];
      consOperation = machine.consOperation;
      if(!consOperation) {
        if(aggrMachines.length > 0)
          backwardAggregate(aggrMachines);
        prevConsOperation = undefined;
        aggrMachines = [];
        continue;
      }
      if(!prevConsOperation) {
        prevConsOperation = consOperation;
        aggrMachines = [machine];
        continue;
      }          
      // check whether machine can be included to aggrMachines
      if(prevConsOperation.startAtTime - aggrTimeInterval / 2  <= consOperation.startAtTime && consOperation.startAtTime < prevConsOperation.startAtTime + aggrTimeInterval / 2) {
        //if possible, added machine to aggrMachines
        aggrMachines.push(machine);
      } else {
        backwardAggregate(aggrMachines);
        prevConsOperation = consOperation;
        aggrMachines = [machine];
      }
    }
    backwardAggregate(aggrMachines);
    return results;
  }

  function recursiveAggregateFinished(machines, focusAtTime, level, filteredTime){
    recursionCount ++;
    var results = [];
    if(machines.length == 1){
      var machine = machines[0],
          consOperation = machine.consOperation;

      order[machine.id] = orderCount++;
      
      while(consOperation){
        results.push({
          x1: consOperation.startAtTime,
          x2: consOperation.endAtTime,
          machines: machines,
          jobType: consOperation.jobType,
          level: level,
          backward: true,
          finished: true,
          operations: [consOperation]
        });
        consOperation = consOperation.prev;
        level++;
      }
      return results;
    }
    var groups = groupBy(machines, function(r){
       return (!r.consOperation) + 0; //r.consOperation.finished + 0;
    });
    groups.forEach(function(group){
      if(group.key){
        group.values.forEach(function(r){
          order[r.id] = orderCount++;
        });
      } else { 
        var groups2 = groupBy(group.values, function(r){ 
          return r.consOperation.jobType.id;
        });
        groups2.forEach(function(group2){
          (function(group3){
            var groups4 = groupBy(group3.values, function(r){
              return r.consOperation.endAtTime > focusAtTime + 0;
            });
            groups4.forEach(function(group4){
              // aggregation by start time
              var minStartAt = d3.max(group4.values.map(getConsOperationStartAtTime))

              var groups5 = groupBy(group4.values, function(r){
                return getPrevAggrIndex(r.consOperation.startAtTime, minStartAt);
              });

              groups5.forEach(function(group5){
                var 
                    startAtTime = d3.mean(group5.values.map(getConsOperationStartAtTime)),
                    result,
                    x1 = startAtTime,
                    x2 = group4.key ? focusAtTime : d3.mean(group5.values.map(getConsOperationEndAtTime))
                ;
                results.push(result = {
                  x1: x1,
                  x2: Math.max(x1, x2),
                  machines: group5.values,
                  operations: group5.values.map(getConsOperation),
                  jobType: group5.values[0].consOperation.jobType,
                  level: level,
                  backward: true, finished:true
                });
                
                group5.values.forEach(function(r){
                  while(1) {
                    r.consOperation = d3.util.cloneHash(r.consOperation.prev);
                    if(!r.consOperation)
                      break;
                    if(r.consOperation.endAtTime < startAtTime)
                      r.consOperation.endAtTime = startAtTime;
                    if(startAtTime > r.consOperation.endAtTime && r.consOperation.endAtTime > startAtTime - aggrTimeInterval) {
                      r.consOperation.endAtTime = startAtTime; 
                    }

                    if(r.consOperation.startAtTime < r.consOperation.endAtTime)
                      break;
                  }
                });
                result.child = 
                  recursiveAggregateFinished(group5.values, startAtTime - 1, level + 1, filteredTime);
              });
            });
          })(group2);
        });
      }
    });
    return results;
  }
  
  function aggregate(filteredMachines, filteredMachineTypes, focusAtTime, filteredTime){
    var aggregated = [];
    order = {};
    orderCount = 1;
    recursionCount = 0;
    orderInAggr = {};
    orderInAggrCount = 1;
    
    //d3.util.timer.start('aggregate');
    filteredMachineTypes.forEach(function(machineType){
      var 
          machines = filteredMachines.filter(function(r){return r.machineType == machineType;}),
          results
      ;
      if(machines.length == 0) {
        return;
      }

      var progressMachines = machines.filter(function(r){
        return !r.getConsOperation(focusAtTime).finished;
      });
      progressMachines.forEach(function(r){
        r.consOperation = r.getConsOperation(focusAtTime).operation;
      });
      results = recursiveAggregate(progressMachines, focusAtTime, 0, {next: []}, filteredTime);
      // Aggr 으로 정렬
      results.sort(function(a, b){
        if(a.jobType.id == b.jobType.id) {
          if(a.x1 == b.x1)
            return a.x2 - b.x2;
          return a.x1 - b.x1;
        }
        return a.jobType.id - b.jobType.id;
      }); 
      results.forEach(function(result){
        //Aggr 안에서는 순서를 재귀로 찾은대로
        result.machines.sort(function(a,b){return orderInAggr[a.id] - orderInAggr[b.id];}).forEach(function(r){
          order[r.id] = orderCount++;
        });
        result.machines.forEach(function(machine){
          machine.consOperation = d3.util.cloneHash(machine.getPrevConsOperation(focusAtTime).operation);
        });
        var backwardAggregated =
          recursiveBackwardAggregate(result.machines, focusAtTime, 0, filteredTime);
        aggregated = aggregated.concat(backwardAggregated);
      });
      aggregated = aggregated.concat(d3.util.flatten(results));

      // for finished machines, only backward aggreation is possible
      var 
          finishedMachines = machines.filter(function(r){return !order[r.id];});
      finishedMachines.forEach(function(machine){machine.consOperation = d3.util.cloneHash(machine.getPrevConsOperation(focusAtTime).operation);});
      results = recursiveAggregateFinished(finishedMachines, focusAtTime, 0, filteredTime);

      aggregated = aggregated.concat(d3.util.flatten(results));
    });
    return [aggregated, order];
  }
  return aggregate;
});
