'use strict';

var Controls = (function() {

  function Controls(config) {
    var defaults = { };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Controls.prototype.init = function(){
    this.orbitControls = new THREE.OrbitControls( this.opt.camera, this.opt.renderer.domElement );
    this.update();
  };

  Controls.prototype.update = function(){
    this.orbitControls.update();
  };

  return Controls;

})();
