'use strict';

var Overlay = (function() {

  Overlay.defaultValues = {
    'type': 'plane',
    'imageDir': '',
    'color': '#ffff00',
    'width': 16384,
    'height': 16384,
    'offset': [0, -20, 0]
  }

  function Overlay(config) {
    var defaults = Overlay.defaultValues;
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Overlay.prototype.init = function(){
    this.loaded = false;
    this.visible = false;
    this.container = new THREE.Group();
    this.transitionStart = false;
    this.transitionEnd = false;
    this.currentAlpha = 0.0;
  };

  Overlay.prototype.getThree = function(){
    return this.container;
  };

  Overlay.prototype.hide = function(transitionDuration){
    this.updateAlpha(0.0, transitionDuration);
    this.visible = false;
  };

  Overlay.prototype.load = function(deferred){
    var _this = this;
    deferred = deferred || $.Deferred();
    var material = new THREE.MeshBasicMaterial({color: this.opt.color, side: THREE.DoubleSide});

    var texturePromise = $.Deferred();
    if (!this.opt.image) {
      this.material = material;
      texturePromise.resolve();
    // load image as texture
    } else {
      var loader = new THREE.TextureLoader();
      var imageUrl = this.opt.imageDir + this.opt.image;
      loader.load(imageUrl,
        function ( texture ) {
          // in this example we create the material when the texture is loaded
          var imageMat = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
          });
          _this.material = imageMat;
          texturePromise.resolve();
        },
        function(err) {
          console.error('Could not load texture:' + imageUrl);
          _this.material = material;
          texturePromise.resolve();
        }
      );
    }

    var offset = new THREE.Vector3(this.opt.offset[0], this.opt.offset[1], this.opt.offset[2]);
    $.when(texturePromise).done(function() {
      _this.material.transparent = true;
      _this.material.opacity = 0.0;
      var geometry = new THREE.PlaneGeometry(_this.opt.width, _this.opt.height, 32);
      var plane = new THREE.Mesh( geometry, _this.material );
      plane.visible = false;
      plane.position.add(offset);
      plane.rotation.y = Math.PI ;
      plane.rotation.x = Math.PI * 0.5;
      // plane.rotation.z = Math.PI * 0.5;
      _this.mesh = plane;
      _this.container.add(plane);
      deferred.resolve();
    });

    return deferred;
  };

  Overlay.prototype.show = function(transitionDuration){
    this.updateAlpha(1.0, transitionDuration);
    this.visible = true;
  };

  Overlay.prototype.setAlpha = function(alpha){
    this.material.opacity = alpha;
    if (alpha > 0.0) this.mesh.visible = true;
    else this.mesh.visible = false;
  };

  Overlay.prototype.updateAlpha = function(targetAlpha, transitionDuration){
    this.transitionStart = new Date().getTime();
    this.transitionEnd = this.transitionStart + transitionDuration;
    this.startAlpha = this.currentAlpha;
    this.endAlpha = targetAlpha;
  };

  Overlay.prototype.update = function(now){
    if (this.transitionStart !== false && this.transitionEnd !== false) {
      var percent = MathUtil.norm(now, this.transitionStart, this.transitionEnd);
      percent = MathUtil.clamp(percent, 0, 1.0);
      percent = MathUtil.ease(percent);
      if (percent >= 1.0){
        this.transitionStart = false;
        this.transitionEnd = false;
      }
      var alpha = MathUtil.lerp(this.startAlpha, this.endAlpha, percent);
      this.setAlpha(alpha);

      this.currentAlpha = alpha;
      renderNeeded = true;
    }
  };

  return Overlay;

})();
