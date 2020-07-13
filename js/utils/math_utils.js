(function() {
  window.MathUtil = {};

  MathUtil.clamp = function(value, min, max) {
    value = Math.min(value, max);
    value = Math.max(value, min);
    return value;
  };

  MathUtil.degToRad = function (degrees) {
    return degrees * Math.PI / 180;
  };

  MathUtil.ease = function(n){
    return (Math.sin((n+1.5)*Math.PI)+1.0) / 2.0;
  };

  MathUtil.lerp = function(a, b, percent) {
    return (1.0*b - a) * percent + a;
  };

  MathUtil.norm = function(value, a, b){
    var denom = (b - a);
    if (denom > 0 || denom < 0) {
      return (1.0 * value - a) / denom;
    } else {
      return 0;
    }
  };

  MathUtil.randomBetween = function(a, b){
    var delta = b - a;
    if (delta <= 0) return 0;
    return Math.random() * delta + a;
  };

  MathUtil.randomPointInCylinder = function(baseCenter, radius, height) {
    var s = Math.random();
    var theta = MathUtil.randomBetween(0, 2*Math.PI);
    var r = Math.sqrt(s) * radius;
    var x = r * Math.cos(theta);
    var y = r * Math.sin(theta);
    var z = MathUtil.randomBetween(0, height);
    return [baseCenter[0]+x, baseCenter[1]+y, baseCenter[2]+z];
  };

  MathUtil.randomPointInSphere = function(center, radius) {
    var phi = MathUtil.randomBetween(0, 2*Math.PI);
    var costheta = MathUtil.randomBetween(-1, 1);
    var u = Math.random();
    var theta = Math.acos(costheta);
    var r = radius * Math.pow(u, (1./3));
    var x = r * Math.sin(theta) * Math.cos(phi)
    var y = r * Math.sin(theta) * Math.sin(phi)
    var z = r * Math.cos(theta)
    return [center[0]+x, center[1]+y, center[2]+z];
  };


})();
