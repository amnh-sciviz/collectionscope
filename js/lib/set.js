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
    if (!this.isValid) return;

    // one mesh per texture file
    var meshes = [];
    _.each(this.opt.textures.assets, function(texture, i){
      var mesh = new Mesh({
        'itemCount': _this.opt.metadata.length,
        'indices': _this.opt.indices,
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

  Set.prototype.render = function(){
    if (!this.isValid) return;
  };

  return Set;

})();
