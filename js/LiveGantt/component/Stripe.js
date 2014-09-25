define(['d3', 'util'], function(){

  var url = d3.util.url;

  d3.svg.stripe = function(jobTypes){
    var str = 
    this  
      .selectAll('.stripe')
      .data(jobTypes)
    var stripes = 
      str
        .enter();
    
    str.exit().remove();

    var patterns = 
    stripes 
      .append('pattern')
        .attr('id', function(j){return 'stripe' + j.id;})
          .attr('width', 32)
          .attr('height', 32)
          .attr('patternUnits', 'userSpaceOnUse')
          .attr('patternTransform', 'rotate(45)')

    patterns                   
      .append('rect')
        .attr('width', 16)
        .attr('height', 32)
        .attr('transform', 'translate(0,0)')
        .attr('fill', function(j){return j.color});

    patterns       
      .append('rect')
        .attr('width', 16)
        .attr('height', 32)
        .attr('transform', 'translate(16,0)')
        .attr('fill', function(j){return d3.rgb(j.color).brighter(0.3)}) 

    return function(jobType){
      return url('stripe' + jobType.id);
    }
  }
});
