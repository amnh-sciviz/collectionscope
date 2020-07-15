'use strict';

/*
A set contains all or a subset of items that are spread across one or more meshes.
The number of meshes depends on the number of texture files.
E.g. If a set has 3 texture files, there will be 3 meshes
Each mesh is composed of a geometry, a material, and a texture
*/

var Set = (function() {

  function Set(config) {
    var defaults = {  };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Set.prototype.init = function(){
    var _this = this;
    this.container = new THREE.Group();

    // check if we have everything we need
    this.isValid = this.opt.content && this.opt.metadata && this.opt.positions && this.opt.textures;
    if (!this.isValid) {
      console.log('Invalid set');
      return;
    }

    // one mesh per texture file
    var meshes = [];
    var t = this.opt.textures;
    var itemsPerAsset = parseInt((t.width / t.cellWidth) * (t.height / t.cellHeight));
    _.each(t.assets, function(asset, i){
      var texture = asset.texture;
      var indices = _this.opt.indices.slice();
      if (indices.length > itemsPerAsset) {
        // console.log(asset.src);
        // console.log(i*itemsPerAsset, Math.min(indices.length, (i+1)*itemsPerAsset));
        indices = indices.slice(i*itemsPerAsset, Math.min(indices.length, (i+1)*itemsPerAsset));
      }
      var mesh = new Mesh({
        'itemCount': _this.opt.metadata.length,
        'indices': indices,
        'positions': _this.opt.positions,
        'texture': texture,
        'textureProps': _.omit(_this.opt.textures, 'assets')
      });
      _this.container.add(mesh.getThree());
      meshes.push(mesh);
    });
    this.meshes = meshes;
  };

  Set.prototype.getThree = function(){
    return this.container;
  };

  Set.prototype.update = function(now){
    if (!this.isValid) return;

    _.each(this.meshes, function(mesh){
      mesh.update(now);
    });
  };

  Set.prototype.updateAlpha = function(fromAlpha, toAlpha, transitionDuration){
    _.each(this.meshes, function(mesh){
      mesh.updateAlpha(fromAlpha, toAlpha, transitionDuration);
    });
  };

  Set.prototype.updatePositions = function(newPositions, transitionDuration){
    _.each(this.meshes, function(mesh){
      mesh.updatePositions(newPositions, transitionDuration);
    });
  };

  return Set;

})();
