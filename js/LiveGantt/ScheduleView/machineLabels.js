define([
  'd3',
  'util'
  ], function(){

  var translate = d3.util.translate;
  
  function render(getG, y, schedule, marginLeft)
  {
    getG('machine-type-labels')
      .selectAll('machine-type-label')
      .data(schedule.machineTypes)
      .enter()
        .append('text')
        .attr('class', 'machine-type-label')
        .text(function(mt){return mt.name;})
        .attr('transform', function(mt){
          return translate(marginLeft - 5, 
            d3.min(mt.machines.map(y))
          );
        })
        .style('font-size', '1.5em')
        .attr('dy', '0.8em')
    ;
  }
  return {
    render: render
  };
});
