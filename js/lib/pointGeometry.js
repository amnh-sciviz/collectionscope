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
    var bounds = this.opt.bounds;
    var numBoundPoints = bounds.length/3;
    var totalPoints = numPoints + numBoundPoints;
    var pointSize = this.opt.fixedCellWidth;
    var positions = this.getPositions(this.opt.positions);
    var positionArr = new Float32Array( totalPoints * 3 );
    var colorsArr = new Float32Array( totalPoints * 3 );
    for (var i=0; i<numPoints; i++) {
      var p = positions[i];
      positionArr[ 3 * i ] = p.x;
      positionArr[ 3 * i + 1 ] = p.y;
      positionArr[ 3 * i + 2 ] = p.z;

      colorsArr[ 3 * i ] = 255;
      colorsArr[ 3 * i + 1 ] = 0;
      colorsArr[ 3 * i + 2 ] = 0;
    }
    // draw points at each eight corners of the largest bounds
    // this is necessary for proper raycaster after points are re-positioned
    for (var i=numPoints; i<totalPoints; i++) {
      var j = i - numPoints;
      positionArr[ 3 * i ] = bounds[ 3 * j ];
      positionArr[ 3 * i + 1 ] = bounds[ 3 * j + 1 ];
      positionArr[ 3 * i + 2 ] = bounds[ 3 * j + 2 ];
      colorsArr[ 3 * i ] = 0;
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
    points.frustumCulled = false;
    points.visible = false; // make it inivisible to the user
    points.layers.enable( Raycaster.LAYER_NUMBER ); // only make visible to raycaster layer
    this.threePoints = points;

    // keep track of alphas
    var alphaArr = new Float32Array(totalPoints);
    for (var i=0; i<totalPoints; i++) {
      alphaArr[i] = 1.0;
    }
    this.alphaArr = alphaArr;
    this.positionArr = positions;
  };

  PointGeometry.prototype.getThree = function(){
    return this.threePoints;
  };

  PointGeometry.prototype.updateAlpha = function(fromAlpha, toAlpha, transitionDuration){
    this.alphaArr = toAlpha;
  };

  PointGeometry.prototype.updatePositions = function(positionOptions, transitionDuration, multiplier){
    var positionAttr = this.positionAttr;
    var positionArr = positionAttr.array;
    var alphaArr = this.alphaArr;
    var positions = this.getPositions(positionOptions, multiplier);
    var numPoints = this.opt.itemCount;

    for (var i=0; i<numPoints; i++) {
      var p = positions[i];
      var alpha = alphaArr[i];
      // if alpha is zero, move it far away so it is de-facto invisible to the raycaster
      if (alpha <= 0.0) p = {x: -99999.0, y: -99999.0, z: -99999.0};
      positionArr[ 3 * i ] = p.x;
      positionArr[ 3 * i + 1 ] = p.y;
      positionArr[ 3 * i + 2 ] = p.z;
    }

    positionAttr.needsUpdate = true;
    renderNeeded = true;

    this.threePoints.geometry.computeBoundingBox();
    // this.threePoints.updateMatrix();
    // this.threePoints.updateMatrixWorld(true);

    this.positionArr = positions;
    return positions;
  };

  return PointGeometry;

})();
