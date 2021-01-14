'use strict';

var Raycaster = (function() {

  function Raycaster(config) {
    var defaults = {

    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Raycaster.LAYER_NUMBER = 7; // Raycaster will only look at objects on this layer

  Raycaster.prototype.init = function(){
    var raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 1;
    raycaster.layers.set( Raycaster.LAYER_NUMBER );
    this.raycaster = raycaster;
  };

  Raycaster.prototype.cast = function( position, camera, objects ){
    this.raycaster.setFromCamera( position, camera );
    var intersections = this.raycaster.intersectObjects( objects );
    var intersectionIndex = intersections.length > 0 ? intersections[ 0 ].index : false; // return the object index
    return intersectionIndex;
  };

  return Raycaster;

})();
