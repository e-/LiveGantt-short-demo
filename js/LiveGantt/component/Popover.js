define(['jquery'],
function($, config){
  'use strict';
  

  function Popover(){
    var 
        $popover = $('#popover'),
        $title = $popover.find('h3'),
        $content = $popover.find('.popover-content'),
        popover,
        disabled = false,
        offset = {left:0, top:0}
    ;

    popover = {
      title: function(title){
        $title.html(title);
        return popover;
      },
      content: function(content){
        $content.html(content);
        return popover;
      },
      set: function(x, y, height){
        if(disabled)return popover;
        var 
            top = y - $popover.outerHeight(),
            left = x - $popover.outerWidth() / 2
            ;
        if(left < 0) left = 0;
        if(top < 10) {
          $popover.removeClass('top').addClass('bottom')
            .show()
            .css('left', left + offset.left)
            .css('top', y + height);
        } else {
          $popover.removeClass('bottom').addClass('top')
            .show()
            .css('left', left + offset.left)
            .css('top', top)
        }
        return popover;
      },
      hide: function(){
        $popover.hide();
        return popover;
      },
      show: function(){
        if(!disabled)
          $popover.show();
        return popover;
      },
      enable: function(){
        disabled = false;
      },
      disable: function(){
        disabled = true;
        popover.hide();
      },
      offset: function(value){
        offset=value;
      }
    }
  
    return popover;
  }
  return Popover;
});

