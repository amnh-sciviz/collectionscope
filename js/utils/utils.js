
(function() {
  window.Util = {};

  Util.getRelativePoint = function($parent, pageX, pageY) {
    var x = pageX - $parent.offset().left;
    var nx = x / $parent.width();
    var y = pageY - $parent.offset().top;
    var ny = y / $parent.height();
    return {
      x: nx,
      y: ny
    }
  };

})();
