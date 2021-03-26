'use strict';

var Story = (function() {

  Story.defaultValues = {
    'parent': '#stories-container',
    'imageDir': '',
    'hotspotItemIndex': -1,
    'minOpacity': 0.8,
    'scaleFrom': 50,
    'scaleTo': 80,
    'pulseDuration': 2000,
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
    this.hotspotItemIndex = this.opt.hotspotItemIndex;
    this.isSelected = false;
    this.isTransitioning = false;
    this.loadUI();
    this.loadHotspot();
  };

  Story.prototype.deselectHotspot = function(){
    this.isSelected = false;
    this.hotspot.material.opacity = this.opt.minOpacity;
  };

  Story.prototype.hide = function(){
    this.$el.removeClass('active');
    this.visible = false;
    this.hotspot.object.visible = true;
  };

  Story.prototype.hideHotspot = function(){
    this.hotspot.object.visible = false;
  };

  Story.prototype.loadHotspot = function(){
    if (!this.opt.markerTexture) {
      console.log('Pass in markerTexture to Story');
      return;
    }

    var spriteMaterial = new THREE.SpriteMaterial({ map: this.opt.markerTexture });
    spriteMaterial.transparent = true;
    spriteMaterial.opacity = this.opt.minOpacity;
    var sprite = new THREE.Sprite(spriteMaterial);
    // var w = options.width;
    // var h = options.height;
    // var d = options.depth;
    // var x = MathUtil.lerp(-w/2, w/2, options.x);
    // var y = MathUtil.lerp(h/2, -h/2, options.y);
    // var z = MathUtil.lerp(-d/2, d/2, options.z);
    // console.log(x, y, z);
    // sprite.position.set(x, y, z);
    sprite.visible = false;
    sprite.scale.set(this.opt.scaleFrom, this.opt.scaleFrom, 1);
    this.hotspot = {
      object: sprite,
      material: spriteMaterial
    };
  };

  Story.prototype.loadUI = function(){
    var html = '';
    var slideCount = this.opt.slides ? this.opt.slides.length : 0;
    html += '<div class="story" data-index="0" data-count="'+slideCount+'">';
    if (this.opt.slides) {
      html += '<div class="media-slides">';
      _.each(this.opt.slides, function(slide, i){
        var active = i === 0 ? ' active' : '';
        var hasContent = (slide.image || slide.audio || slide.object) ? ' has-content' : '';
        html += '<div class="slide'+active+hasContent+'" data-index="'+i+'">';
          if (slide.image && slide.audio) {
            html += '<div class="media-container image-container"><img src="'+slide.image+'" alt="'+slide.imageAltText+'" /><button class="toggle-audio" data-src="'+slide.audio+'"><span class="visuallyHidden">Toggle audio</span></button></div>';
          } else if (slide.image) {
            html += '<div class="media-container image-container"><img src="'+slide.image+'" alt="'+slide.imageAltText+'" /></div>';
          } else if (slide.audio) {
            html += '<div class="media-container audio-container"><audio src="'+slide.audio+'" controls></audio></div>';
          } else if (slide.object) {
            html += '<div class="media-container obj-container"><iframe class="obj-viewer" src="viewer.html?obj='+slide.object+'"></iframe></div>';
          }
        html += '</div>'; // end .slide
      });
      html += '</div>'; // end .media-slides

      html += '<div class="story-content">';
        html += '<button class="close-story toggle-button">×<span class="visuallyHidden"> close</span></button>';

        if (this.opt.title) html += '<h3>'+this.opt.title+'</h3>';
        html += '<div class="text-slides">';
        _.each(this.opt.slides, function(slide, i){
          var active = i === 0 ? ' active' : '';
          html += '<div class="slide'+active+' text-slide" data-index="'+i+'">';
            if (slide.text) html += '<p>'+slide.text+'</p>';
            else if (slide.html) html += slide.html;
          html += '</div>'; // end .slide
        });
        html += '</div>'; // end .text-slides

        html += '<nav class="slides-nav"><ul>';
        _.each(this.opt.slides, function(slide, i){
          var active = i === 0 ? ' active' : '';
          html += '<li><button class="slide-nav-button'+active+'" data-index="'+i+'"><span class="visuallyHidden"> Go to slide '+(i+1)+'</span></button></li>';
        });
        html += '</ul></nav>'; // end .slides-nav

        var nextActive = slideCount > 1 ? ' active' : '';
        var finishActive = slideCount === 1 ? ' active' : '';
        html += '<div class="slides-buttons">';
          html += '<button class="slide-prev">Previous</button>';
          html += '<button class="slide-next'+nextActive+'">Next</button>';
          html += '<button class="slide-finish close-story '+finishActive+'">Finish</button>';
        html += '</div>'; // end .slides-buttons

      html += '</div>'; // end .story-content
    }

    html += '</div>'; // end .slide
    this.$el = $(html);
    this.$parent.append(this.$el);
  };

  Story.prototype.selectHotspot = function(uuid){
    var hotspot = this.hotspot;

    if (hotspot.object.uuid == uuid) {
      // hotspot.material.color.setHSL(0.5, 0.9, 0.9);
      hotspot.material.opacity = 1.0;
      this.isSelected = true;
    } else {
      // hotspot.material.color.set(0xffffff);
      hotspot.material.opacity = this.opt.minOpacity;
      this.isSelected = false;
    }
  };

  Story.prototype.show = function(){
    this.$el.addClass('active');
    this.visible = true;
    this.hideHotspot();
  };

  Story.prototype.update = function(now){

    if (this.isTransitioning && now >= this.transitionEnd) {
      this.isTransitioning = false;
    }

    if (this.isTransitioning || this.isSelected) return;

    // pulse scale and opacity
    var progress = now % this.opt.pulseDuration;
    var t = MathUtil.clamp(progress / this.opt.pulseDuration, 0, 1);
    t = MathUtil.easeBell(t);
    var scale = MathUtil.lerp(this.opt.scaleFrom, this.opt.scaleTo, t);
    var opacity = MathUtil.lerp(this.opt.minOpacity, 1, t);
    this.hotspot.object.scale.set(scale, scale, 1);
    this.hotspot.material.opacity = opacity;
  };

  Story.prototype.updatePositions = function(newPositions, transitionDuration){
    if (this.hotspotItemIndex < 0) return;

    var newPosition = newPositions[this.hotspotItemIndex];
    if (newPosition === undefined) return;

    // move the z slightly so it doesn't clip the item
    var z = newPosition.z - 1;
    this.hotspot.object.position.set(newPosition.x, newPosition.y, z);
    this.hotspot.material.opacity = 0;

    this.isTransitioning = true;
    this.transitionStart = new Date().getTime();
    this.transitionEnd = this.transitionStart + transitionDuration;
  };

  Story.prototype.updateView = function(newViewKey){
    if (newViewKey === "randomSphere") {
      this.hotspot.object.visible = false;
    } else {
      this.hotspot.object.visible = true;
    }
  };

  return Story;

})();
