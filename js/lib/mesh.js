'use strict';

var Mesh = (function() {

  function Mesh(config) {
    var defaults = {  };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Mesh.prototype.init = function(){
    var _this = this;

    var geometry = new Geometry({
      'indices': this.opt.indices,
      'itemCount': this.opt.itemCount,
      'textureProps': this.opt.textureProps,
      'positions': this.opt.positions
    });
    var material = new Material({
      'texture': this.opt.texture
    });

    var mesh = new THREE.Mesh(geometry.getThree(), material.getThree());
    mesh.frustumCulled = false;
    this.threeMesh = mesh;
    this.geometry = geometry;
    this.material = material;
  };

  Mesh.prototype.getThree = function(){
    return this.threeMesh;
  };

  Mesh.prototype.update = function(){
    this.material.update();
  };

  Mesh.prototype.updatePositions = function(newPositions, transitionDuration){
    this.geometry.updatePositions(newPositions, transitionDuration);
    this.material.transitionPosition(transitionDuration);
  };

  return Mesh;

})();
