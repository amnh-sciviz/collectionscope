'use strict';

var PointGeometry = (function() {
  function PointGeometry(config) {
    var defaults = {};
    var options = _.extend({}, defaults, config);
    Geometry.call(this, options);
  }

  // inherit from Geometry
  PointGeometry.prototype = Object.create(Geometry.prototype);
  PointGeometry.prototype.constructor = PointGeometry;

  PointGeometry.prototype.init = function(){
    var geometry = new THREE.BufferGeometry();
    var numPoints = this.opt.itemCount;
    var pointSize = this.opt.fixedCellWidth;
    var positions = this.getPositions(this.opt.positions);
    var positionArr = new Float32Array( numPoints * 3 );
    var colorsArr = new Float32Array( numPoints * 3 );
    for (var i=0; i<numPoints; i++) {
      var p = positions[i];
      positionArr[ 3 * i ] = p.x;
      positionArr[ 3 * i + 1 ] = p.y;
      positionArr[ 3 * i + 2 ] = p.z;

      colorsArr[ 3 * i ] = 255;
      colorsArr[ 3 * i + 1 ] = 0;
      colorsArr[ 3 * i + 2 ] = 0;
    }
    var positionAttr = new THREE.BufferAttribute( positionArr, 3 );
    geometry.setAttribute( 'position', positionAttr );
    var colorAttr = new THREE.BufferAttribute( colorsArr, 3 );
    geometry.setAttribute( 'color', colorAttr );
    this.positionAttr = positionAttr;
    geometry.computeBoundingBox();
    var material = new THREE.PointsMaterial( { size: pointSize, vertexColors: true } );
    var points = new THREE.Points( geometry, material );
    points.visible = false; // make it inivisible to the user
    points.layers.enable( Raycaster.LAYER_NUMBER ); // only make visible to raycaster layer
    this.threePoints = points;
  };

  PointGeometry.prototype.getThree = function(){
    return this.threePoints;
  };

  PointGeometry.prototype.updateAlpha = function(fromAlpha, toAlpha, transitionDuration){ /* Do nothing */ };

  PointGeometry.prototype.updatePositions = function(positionOptions, transitionDuration, multiplier){
    var positionAttr = this.positionAttr;
    var positionArr = positionAttr.array;
    var positions = this.getPositions(positionOptions, multiplier);
    var numPoints = this.opt.itemCount;

    for (var i=0; i<numPoints; i++) {
      var p = positions[i];
      positionArr[ 3 * i ] = p.x;
      positionArr[ 3 * i + 1 ] = p.y;
      positionArr[ 3 * i + 2 ] = p.z;
    }

    positionAttr.needsUpdate = true;
    renderNeeded = true;

    return positions;
  };

  return PointGeometry;

})();
