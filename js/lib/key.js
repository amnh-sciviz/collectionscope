'use strict';

var Key = (function() {

  Key.defaultValues = {
    'parent': '#app',
    'type': 'legend',
    'imageDir': '../../img/',
    'camera': false,
    'bounds': false
  }

  function Key(config) {
    var defaults = Key.defaultValues;
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Key.prototype.init = function(){
    this.$parent = $(this.opt.parent);
    this.bounds = this.opt.bounds;
    this.camera = this.opt.camera;
    this.visible = false;
    this.load();
  };

  Key.prototype.hide = function(){
    this.$el.removeClass('active');
    this.visible = false;
  };

  Key.prototype.load = function(){
    if (this.opt.type=='legend') this.loadLegend();
    else if (this.opt.type=='map') this.loadMap();
    else if (this.opt.type=='timeline') this.loadTimeline();
  };

  Key.prototype.loadLegend = function(){
    var html = '<div class="legend key">';
      if (this.opt.title) html += '<h3>'+this.opt.title+'</h3>';
      html += '<ul class="legend-list">';
      _.each(this.opt.items, function(item){
        html += '<li><span class="color" style="background-color: '+item.color+'"></span> <span class="text">'+item.text+'</span>';
      });
      html += '</ul>';
    html += '</div>';
    this.$el = $(html);
    this.$parent.append(this.$el);
  };

  Key.prototype.loadMap = function(){
    var html = '<div class="map key">';
      if (this.opt.title) html += '<h3>'+this.opt.title+'</h3>';
      html += '<div class="map-wrapper">';
        html += '<img src="'+this.opt.imageDir+this.opt.image+'" alt="Map of the world with country outlines" />';
        html += '<div class="marker"></div>';
      html += '</div>';
    html += '</div>';
    this.$el = $(html);
    this.$marker = this.$el.find('.marker').first();
    this.$parent.append(this.$el);
  };

  Key.prototype.loadTimeline = function(){
    var minValue = _.min(this.opt.items, function(item){ return item.value; });
    var maxValue = _.max(this.opt.items, function(item){ return item.value; });
    var itemWidth = 1.0 / this.opt.items.length * 100;
    var dataHeight = 120;
    var html = '<div class="timeline key">';
      if (this.opt.title) html += '<h3>'+this.opt.title+'</h3>';
      html += '<div class="timeline-wrapper">';
        html += '<ul class="timeline-data">';
        _.each(this.opt.items, function(item){
          var p = MathUtil.norm(item.value, minValue.value, maxValue.value);
          var itemHeight = Math.max(p * dataHeight, 1);
          html += '<li style="width: '+itemWidth+'%; height:'+itemHeight+'px"><span class="visuallyHidden">'+item.value+' items</span></li>';
        });
        html += '</ul>';
        html += '<div class="domain year-start">'+this.opt.items[0].year+'</div>';
        html += '<div class="domain year-end">'+this.opt.items[this.opt.items.length-1].year+'</div>';
        html += '<div class="marker"><div class="marker-label"></div></div>';
      html += '</div>';
    html += '</div>';
    this.$el = $(html);
    this.$marker = this.$el.find('.marker').first();
    this.$markerLabel = this.$marker.find('.marker-label').first();
    this.$parent.append(this.$el);
    this.dataHeight = this.$el.find('.timeline-data').first().height();
  };

  Key.prototype.setBounds = function(bounds){
    this.bounds = bounds;
  };

  Key.prototype.show = function(){
    this.$el.addClass('active');
    this.visible = true;
    this.update();
  };

  Key.prototype.update = function(now){
    if (this.opt.type=='map') this.updateMap();
    else if (this.opt.type=='timeline') this.updateTimeline();
  };

  Key.prototype.updateMap = function(){
    if (this.bounds === false || this.camera === false || !this.visible) return;

    var xLerp = MathUtil.norm(this.camera.position.x, this.bounds[1], this.bounds[0]);
    var yLerp = MathUtil.norm(this.camera.position.z, this.bounds[3], this.bounds[2]);

    this.$marker.css({
      'left': (xLerp*100)+'%',
      'top': (yLerp*100)+'%'
    });
  };

  Key.prototype.updateTimeline = function(){
    if (this.bounds === false || this.camera === false || !this.visible) return;

    var lerpAmount = MathUtil.norm(this.camera.position.z, this.bounds[2], this.bounds[3]);
    var rangeLen = this.opt.items.length;
    var year = Math.round(rangeLen * lerpAmount) + this.opt.items[0].year;

    this.$marker.css('left', (lerpAmount*100)+'%');
    this.$markerLabel.text(year);
  };

  return Key;

})();
