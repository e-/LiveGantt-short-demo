requirejs.config({
  baseUrl: 'js',   
  packages: ['LiveGantt', 'LiveGantt/model'],
  paths: {
    jquery: 'LiveGantt/lib/jquery',
    d3: 'LiveGantt/lib/d3.v3.min',
    bootstrap: 'LiveGantt/lib/bootstrap.min',
    util: 'LiveGantt/util'
  },
  shim: {
    bootstrap: {
        deps: ['jquery']
    }
  }
});

requirejs(['LiveGantt', 'jquery', 'd3']
, function(LiveGantt, $
){
  $.get('./schedule.json', function(json){
    var schedule = LiveGantt.Model.Schedule.create(json);
    var view = new LiveGantt.ScheduleView(schedule);
    var width = 1280, height = 768;

    var svg = d3.select('svg').attr('width', width).attr('height', height);
    svg.append('defs');
    view
      .width(width)
      .height(height)
      .render(svg, svg.append('g'));

    var $sortTypes = $('.sort-type');
    $sortTypes.click(function(){
      var $this = $(this),
          sortType = parseInt($this.data('sort-type')),
          mode = parseInt($this.data('mode'))
          ;
      view.update(mode, sortType);
    });
  });
});
