'use strict';

var Geometry = (function() {

  function Geometry(config) {
    var defaults = {  };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Geometry.prototype.init = function(){
    var _this = this;
    var maxInstancedCount = this.opt.indices.length;
    var imageW = this.opt.textureProps.width;
    var imageH = this.opt.textureProps.height;
    var cellW = this.opt.textureProps.cellWidth;
    var cellH = this.opt.textureProps.cellHeight;
    var cols = parseInt(imageW / cellW);
    var rows = parseInt(imageH / cellH);

    // filter and map positions
    var positionSize = parseInt(this.opt.positions.values.length / this.opt.itemCount);
    var allPositions = _.chunk(this.opt.positions.values, positionSize);
    var canvasWidth = Math.ceil(Math.sqrt(this.opt.itemCount)) * cellW;
    var canvasHeight = Math.ceil(Math.sqrt(this.opt.itemCount)) * cellH;
    var canvasDepth = canvasWidth;
    if (this.opt.positions.gridWidth && this.opt.positions.gridHeight) {
      canvasWidth = this.opt.positions.gridWidth * cellW;
      canvasHeight = this.opt.positions.gridHeight * cellH;
    }
    if (this.opt.positions.gridDepth) {
      canvasDepth = this.opt.positions.gridDepth * cellW;
    }
    // console.log('Canvas: ', canvasWidth, canvasHeight)
    var positions = _.map(this.opt.indices, function(index, i){
      return {
        'x': MathUtil.lerp(-canvasWidth/2, canvasWidth/2, allPositions[index][0]),
        'y': MathUtil.lerp(canvasHeight/2, -canvasHeight/2, allPositions[index][1]),
        'z': positionSize > 2 ? MathUtil.lerp(-canvasDepth/2, canvasDepth/2, allPositions[index][2]) : 0
      }
    });
    // console.log(positions)

    // load geometry
    var planeGeom = new THREE.PlaneBufferGeometry(1, 1);
    var geom = new THREE.InstancedBufferGeometry();
    geom.copy(planeGeom);
    geom.maxInstancedCount = maxInstancedCount;
    var uvAttr = geom.getAttribute('uv');
    uvAttr.needsUpdate = true;
    for (var i = 0; i < uvAttr.array.length; i++) {
      uvAttr.array[i] /= imageW;
    }

    // define the shader attributes topology
    var attributes = [
      {name: 'tween', size: 1},
      {name: 'uvOffset', size: 2},
      {name: 'translate', size: 3},
      {name: 'translateDest', size: 3},
      {name: 'scale', size: 3},
      {name: 'color', size: 3},
      {name: 'colorDest', size: 3},
      {name: 'uidColor', size: 3, isStatic: true}
    ];

    for (var attr of attributes) {
      // allocate the buffer
      var buffer = new Float32Array(geom.maxInstancedCount * attr.size);
      var buffAttr = new THREE.InstancedBufferAttribute(buffer, attr.size, false, 1);
      if( !_.has(attributes, 'isStatic') ){
        buffAttr.setUsage(THREE.DynamicDrawUsage);
      }
      geom.setAttribute(attr.name, buffAttr);
      // and save a reference in the attr dictionary
      // attributeLookup[attr.name] = buffAttr;
    }

    // set tween
    var tweenArr = geom.getAttribute('tween').array;
    for (var i=0; i<maxInstancedCount; i++) {
      tweenArr[i] = 1;
    }

    // set uv offset
    var uvOffsetArr = geom.getAttribute('uvOffset').array;
    for (var i=0; i<maxInstancedCount; i++) {
      var i0 = i*2;
      var y = parseInt(i / cols) / cols;
      var x = (i % cols) / cols;
      uvOffsetArr[i0] = x;
      uvOffsetArr[i0 + 1] = y;
    }

    // set translates and colors
    var scaleArr = geom.getAttribute('scale').array;
    var translateArr = geom.getAttribute('translate').array;
    var translateDestArr = geom.getAttribute('translateDest').array;
    var colorArr = geom.getAttribute('color').array;
    var colorDestArr = geom.getAttribute('colorDest').array;
    var uidColorArr = geom.getAttribute('uidColor').array;

    for (var i=0; i<maxInstancedCount; i++) {
      var i0 = i*3;

      scaleArr[i0] = cellW;
      scaleArr[i0+1] = cellH;
      scaleArr[i0+2] = 1;

      translateArr[i0] = positions[i].x;
      translateArr[i0+1] = positions[i].y;
      translateArr[i0+2] = positions[i].z;
      translateDestArr[i0] = positions[i].x;
      translateDestArr[i0+1] = positions[i].y;
      translateDestArr[i0+2] = positions[i].z;

      colorArr[i0] = 1;
      colorArr[i0+1] = 1;
      colorArr[i0+2] = 1;
      colorDestArr[i0] = 1;
      colorDestArr[i0+1] = 1;
      colorDestArr[i0+2] = 1;
      uidColorArr[i0] = 1;
      uidColorArr[i0+1] = 1;
      uidColorArr[i0+2] = 1;
    }

    for (var attr of attributes) {
      geom.getAttribute(attr.name).needsUpdate = true
    }

    this.threeGeometry = geom;
  };

  Geometry.prototype.getThree = function(){
    return this.threeGeometry;
  };

  return Geometry;

})();
