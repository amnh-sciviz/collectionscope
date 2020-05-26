'use strict';

var Geometry = (function() {

  function Geometry(config) {
    var defaults = {
      "fixedCellWidth": 16, // the target dimensions of each cell in THREE.js scene
      "fixedCellHeight": 16
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Geometry.prototype.init = function(){
    var _this = this;
    var maxInstancedCount = this.opt.indices.length;
    var imageW = this.opt.textureProps.width;
    var imageH = this.opt.textureProps.height;
    var fixedCellWidth = this.opt.fixedCellWidth;
    var fixedCellHeight = this.opt.fixedCellHeight;
    var cellW = this.opt.textureProps.cellWidth;
    var cellH = this.opt.textureProps.cellHeight;
    var scale = fixedCellWidth / cellW;
    var cols = parseInt(imageW / cellW);
    var rows = parseInt(imageH / cellH);

    var positions = this.getPositions(this.opt.positions);
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
      {name: 'uvOffset', size: 2},
      {name: 'translate', size: 3},
      {name: 'translateDest', size: 3},
      {name: 'actualSize', size: 3},
      {name: 'scale', size: 3},
      {name: 'color', size: 3},
      {name: 'colorDest', size: 3},
      {name: 'alpha', size: 1},
      {name: 'alphaDest', size: 1},
      {name: 'randSeed', size: 1}
    ];

    this.attributeLookup = {};
    for (var attr of attributes) {
      // allocate the buffer
      var buffer = new Float32Array(geom.maxInstancedCount * attr.size);
      var buffAttr = new THREE.InstancedBufferAttribute(buffer, attr.size, false, 1);
      if( !_.has(attributes, 'isStatic') ){
        buffAttr.setUsage(THREE.DynamicDrawUsage);
      }
      geom.setAttribute(attr.name, buffAttr);
      // and save a reference in the attr dictionary
      this.attributeLookup[attr.name] = buffAttr;
    }

    // set tween and alpha
    var alphaArr = geom.getAttribute('alpha').array;
    var alphaDestArr = geom.getAttribute('alphaDest').array;
    var randArr = geom.getAttribute('randSeed').array;
    var alpha = 1;
    for (var i=0; i<maxInstancedCount; i++) {
      alphaArr[i] = alpha;
      alphaDestArr[i] = alpha;
      randArr[i] = MathUtil.lerp(0.5, 1, Math.random()); // used for creating item-level variability when transitioning
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
    var sizeArr = geom.getAttribute('actualSize').array;
    var scaleArr = geom.getAttribute('scale').array;
    var translateArr = geom.getAttribute('translate').array;
    var translateDestArr = geom.getAttribute('translateDest').array;
    var colorArr = geom.getAttribute('color').array;
    var colorDestArr = geom.getAttribute('colorDest').array;

    for (var i=0; i<maxInstancedCount; i++) {
      var i0 = i*3;

      sizeArr[i0] = cellW * scale;
      sizeArr[i0+1] = cellH * scale;
      sizeArr[i0+2] = 1;
      scaleArr[i0] = scale;
      scaleArr[i0+1] = scale;
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
    }

    for (var attr of attributes) {
      geom.getAttribute(attr.name).needsUpdate = true
    }

    this.threeGeometry = geom;
  };

  Geometry.prototype.getPositions = function(positionOptions) {
    // filter and map positions
    var positionSize = parseInt(positionOptions.values.length / this.opt.itemCount);
    var allPositions = _.chunk(positionOptions.values, positionSize);
    var canvasWidth = Math.ceil(Math.sqrt(this.opt.itemCount)) * this.opt.fixedCellWidth;
    var canvasHeight = Math.ceil(Math.sqrt(this.opt.itemCount)) * this.opt.fixedCellHeight;
    var canvasDepth = canvasWidth;
    if (positionOptions.gridWidth && positionOptions.gridHeight) {
      canvasWidth = positionOptions.gridWidth * this.opt.fixedCellWidth;
      canvasHeight = positionOptions.gridHeight * this.opt.fixedCellHeight;
    }
    if (positionOptions.gridDepth) {
      canvasDepth = positionOptions.gridDepth * fixedCellWidth;
    }
    // console.log('Canvas: ', canvasWidth, canvasHeight)
    return _.map(this.opt.indices, function(index, i){
      return {
        'x': MathUtil.lerp(-canvasWidth/2, canvasWidth/2, allPositions[index][0]),
        'y': MathUtil.lerp(canvasHeight/2, -canvasHeight/2, allPositions[index][1]),
        'z': positionSize > 2 ? MathUtil.lerp(-canvasDepth/2, canvasDepth/2, allPositions[index][2]) : 0
      }
    });
  };

  Geometry.prototype.getThree = function(){
    return this.threeGeometry;
  };

  Geometry.prototype.updatePositions = function(positionOptions, transitionDuration){
    // console.log(positionOptions, transitionDuration)
    var fromAttr = this.attributeLookup['translate'];
    var toAttr = this.attributeLookup['translateDest'];

    var translateArr = fromAttr.array;
    var translateDestArr = toAttr.array;
    var positions = this.getPositions(positionOptions);
    var maxInstancedCount = this.threeGeometry.maxInstancedCount;

    for (var i=0; i<maxInstancedCount; i++) {
      var i0 = i*3;

      translateArr[i0] = translateDestArr[i0];
      translateArr[i0+1] = translateDestArr[i0+1];
      translateArr[i0+2] = translateDestArr[i0+2];

      translateDestArr[i0] = positions[i].x;
      translateDestArr[i0+1] = positions[i].y;
      translateDestArr[i0+2] = positions[i].z;
    }

    fromAttr.needsUpdate = true;
    toAttr.needsUpdate = true;
    renderNeeded = true;
  };

  return Geometry;

})();
