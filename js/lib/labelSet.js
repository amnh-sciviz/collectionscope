'use strict';

var LabelSet = (function() {

  function LabelSet(config) {
    var defaults = {
      'fontDir': '../../fonts/',
      'fontFile': 'helvetiker_bold.typeface.json',
      'labels': [],
      'width': 16384,
      'height': 16384,
      'depth': 16384
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  LabelSet.prototype.init = function(){
    this.loaded = false;
    this.visible = false;
    this.container = new THREE.Group();
    this.transitionStart = false;
    this.transitionEnd = false;
    this.currentAlpha = 0.0;
  };

  LabelSet.prototype.createLabels = function(){
    var _this = this;
    var labels = [];
    var canvasWidth = this.opt.width;
    var canvasHeight = this.opt.height;
    var canvasDepth = this.opt.depth;

    _.each(this.opt.labels, function(options){
      var p = options.position;
      var x = MathUtil.lerp(-canvasWidth/2, canvasWidth/2, p[0]);
      var y = MathUtil.lerp(canvasHeight/2, -canvasHeight/2, p[1]);
      var z = MathUtil.lerp(-canvasDepth/2, canvasDepth/2, p[2]);
      options.position = [x, y, z];
      var label = new Label(_.extend({}, options, {font: _this.font}));
      _this.container.add(label.getThree());
      labels.push(label);
    });

    this.labels = labels;
    this.loaded = true;
  };

  LabelSet.prototype.getThree = function(){
    return this.container;
  };

  LabelSet.prototype.hide = function(transitionDuration){
    this.updateAlpha(0.0, transitionDuration);
    this.visible = false;
  };

  LabelSet.prototype.load = function(){
    var _this = this;
    var deferred = $.Deferred();
    var loader = new THREE.FontLoader();
    loader.load(this.opt.fontDir + this.opt.fontFile, function(response) {
      console.log('Loaded '+_this.opt.fontFile);
      _this.font = response;
      _this.createLabels();
      deferred.resolve();
    });
    return deferred;
  };

  LabelSet.prototype.show = function(transitionDuration){
    this.updateAlpha(1.0, transitionDuration);
    this.visible = true;
  };

  LabelSet.prototype.updateAlpha = function(targetAlpha, transitionDuration){
    this.transitionStart = new Date().getTime();
    this.transitionEnd = this.transitionStart + transitionDuration;
    this.startAlpha = this.currentAlpha;
    this.endAlpha = targetAlpha;
  };

  LabelSet.prototype.update = function(now){
    if (this.transitionStart !== false && this.transitionEnd !== false) {
      var percent = MathUtil.norm(now, this.transitionStart, this.transitionEnd);
      percent = MathUtil.clamp(percent, 0, 1.0);
      percent = MathUtil.ease(percent);
      if (percent >= 1.0){
        this.transitionStart = false;
        this.transitionEnd = false;
      }
      var alpha = MathUtil.lerp(this.startAlpha, this.endAlpha, percent);
      _.each(this.labels, function(label){
        label.setAlpha(alpha);
      });
      this.currentAlpha = alpha;
      renderNeeded = true;
    }
  };

  return LabelSet;

})();
