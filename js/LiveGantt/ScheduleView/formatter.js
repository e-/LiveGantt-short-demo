define(function(){
  'use strict';
  
  return {
    aggrContentFormatter: function(aggr, focusAtTime){
      var li = [];
      if(!aggr.backward) {
        if(aggr.x1 - focusAtTime > 0) {
          li.push('Start after ' + d3.util.intervalReader(aggr.x1 - focusAtTime));
        } else {
          li.push('<strong>Working</strong>');
        }
      }
      li.push('Avg. Duration: ' + d3.util.intervalReader(aggr.x2 - aggr.x1));
      if(!aggr.backward) {
        var count = {}, total=0;
        aggr.next.forEach(function(nextAggr){
          if(!count[nextAggr.jobType.id])
            count[nextAggr.jobType.id] = [0, nextAggr.jobType];
          count[nextAggr.jobType.id][0]+=nextAggr.machines.length;
          total+=nextAggr.machines.length;
        });
        var array = [];
        Object.keys(count).forEach(function(key){
          array.push([key, count[key][0], count[key][1]]);
        });
        array.sort(function(a,b){return b[1] - a[1];});
        array.forEach(function(a){
          li.push('<strong>' + a[1] + '</strong> ' + '<span class="bullet2" style="background:'+a[2].color+'"></span>' + a[2].name + ' operation' + (a[1] > 1 ? 's' : '') + ' follow' + (a[1] > 1 ? '' : 's') + '.');
        });
        var remain = aggr.machines.length - total;
        if(remain){
          li.push('<strong>' + remain + '</strong>' + ' machine' + (remain > 1 ? 's' : '') + ' will finish.');
        }
      }

      return '<ul><li>' + li.join('</li><li>') + '</li></ul>';
    },
    aggrTitleFormatter: function(aggr){
      return '<span class="bullet" style="background-color:'+aggr.jobType.color+'"></span>' + aggr.jobType.name + ' <small>('+aggr.machines[0].machineType.name+', ' + aggr.machines.length + ' machine' + ((aggr.machines.length > 1) ? 's' : '') + ')</small>'
    },
    titleFormatter: function(wrapper){
      return '<span class="bullet" style="background-color:'+wrapper.jobType.color
      +'"></span>' + wrapper.operation.operationType.name + ' <small>('+wrapper.operation.machine.name+')</small>';
    },
    contentFormatter: function(wrapper, focusAtTime){
      var operation = wrapper.operation;
      var ir;
      if(focusAtTime < operation.startAtTime) {
        ir = 'Start after ' + d3.util.intervalReader(operation.startAtTime - focusAtTime) + '</li><li>Duration: ' + d3.util.intervalReader(operation.endAtTime - operation.startAtTime) + '</li><li>';
      } else {
        ir = 'Duration: ' + d3.util.intervalReader(operation.endAtTime - operation.startAtTime) + '</li><li>';
      }
                 
      return '<ul><li>' + ir + 
                '&nbsp;&nbsp;Start: ' + d3.util.dateTimeTag(new Date(operation.startAtTime)) + '</li><li>' + 
                'Finish: ' + d3.util.dateTimeTag(new Date(operation.endAtTime)) + 
             '</li></ul>'
    }
  }
});
