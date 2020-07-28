'use strict';

var Story = (function() {

  Story.defaultValues = {
    'parent': '#stories',
    'imageDir': '',
    'hotspots': {},
    'markerTexture': false
  };

  function Story(config) {
    var defaults = Story.defaultValues;
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Story.prototype.init = function(){
    this.$parent = $(this.opt.parent);
    this.visible = false;
    this.loadUI();
    this.loadHotspots();
  };

  Story.prototype.hide = function(){
    this.$el.removeClass('active');
    this.visible = false;
  };

  Story.prototype.hideHotspots = function(){
    _.each(this.hotspots, function(hotspot, viewKey){
      hotspot.object.visible = false;
    });
  };

  Story.prototype.loadHotspots = function(){
    if (!this.opt.markerTexture) {
      console.log('Pass in markerTexture to Story');
      return;
    }

    var hotspots = {};
    var _this = this;
    _.each(this.opt.hotspots, function(options, viewKey){
      var spriteMaterial = new THREE.SpriteMaterial({ map: _this.opt.markerTexture });
      spriteMaterial.transparent = true;
      // spriteMaterial.opacity = 0.0;
      var sprite = new THREE.Sprite(spriteMaterial);
      var w = options.width;
      var h = options.height;
      var d = options.depth;
      var x = MathUtil.lerp(-w/2, w/2, options.x);
      var y = MathUtil.lerp(h/2, -h/2, options.y);
      var z = MathUtil.lerp(-d/2, d/2, options.z);
      // console.log(x, y, z);
      sprite.visible = false;
      sprite.position.set(x, y, z);
      sprite.scale.set(200, 200, 1);
      hotspots[viewKey] = {
        object: sprite,
        material: spriteMaterial
      };
    });
    this.hotspots = hotspots;
  };

  Story.prototype.loadUI = function(){
    var html = '';
    html += '<div class="story">';
    if (this.opt.title) html += '<h3>'+this.opt.title+'</h3>';
    if (this.opt.html) html += this.opt.html;
    if (this.opt.images) {
      html += '<div class="images">';
      _.each(this.opt.images, function(img){
        html += '<a href="'+img.captionUrl+'" class="image" target="_blank"><img src="'+img.url+'" alt="'+img.caption+'" title="'+img.caption+'" /></a>';
      });
      html += '</div>';
    }
    html += '<button class="close-story toggle-button">Close<button>';
    html += '</div>';
    this.$el = $(html);
    this.$parent.append(this.$el);
  };

  Story.prototype.show = function(){
    this.$el.addClass('active');
    this.visible = true;
  };

  Story.prototype.updateView = function(newViewKey){
    _.each(this.hotspots, function(hotspot, viewKey){
      if (viewKey == newViewKey) {
        // console.log('Setting hotspot visible')
        // hotspot.material.opacity = 1.0;
        hotspot.object.visible = true;
      } else {
        hotspot.object.visible = false;
      }
    });
  };

  return Story;

})();
