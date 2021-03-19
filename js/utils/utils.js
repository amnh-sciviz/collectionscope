
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

  Util.queryParams = function(){
    if (location.search.length) {
      var search = location.search.substring(1);
      var parsed = JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', function(key, value) { return key===""?value:decodeURIComponent(value) });
      _.each(parsed, function(value, key){
        var dkey = decodeURIComponent(key);
        parsed[dkey] = value;
      });
      return parsed;
    }
    return {};
  };

})();
