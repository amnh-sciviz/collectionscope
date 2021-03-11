
(function() {
  window.Util = {};

  Util.getRelativePoint = function($parent, e) {
    var x = e.pageX - $parent.offset().left;
    var nx = x / $parent.width();
    var y = e.pageY - $parent.offset().top;
    var ny = y / $parent.height();
    return {
      x: nx,
      y: ny
    }
  };

})();
