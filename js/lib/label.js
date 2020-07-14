'use strict';

var Label = (function() {

  function Label(config) {
    var defaults = {
      'text': 'Default text',
      'position': [0, 0, 0],
      'size': 12,
      'height': 2 // thickness
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Label.prototype.init = function(){
    if (!this.opt.font) {
      console.log('Pass in font');
      return;
    }

    var textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var textGeo = new THREE.TextGeometry( this.opt.text, {
      font: this.opt.font,
      size: this.opt.size,
      height: this.opt.height
    });
    textMat.transparent = true;
    textMat.opacity = 0.0;

    textGeo.computeBoundingBox();
    // textGeo.computeVertexNormals();
    // textGeo = new THREE.BufferGeometry().fromGeometry(textGeo);

    var textMesh = new THREE.Mesh(textGeo, textMat);

    // center the position
    var offsetX = 0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
    var offsetY = -(textGeo.boundingBox.max.y - textGeo.boundingBox.min.y);
    var p = this.opt.position;
    textMesh.position.set(p[0]+offsetX, p[1]+offsetY, p[2]);

    // textMesh.rotation.x = Math.PI * 2;
    textMesh.rotation.y = Math.PI;

    this.material = textMat;
    this.mesh = textMesh;
  };

  Label.prototype.getThree = function(){
    return this.mesh;
  };

  Label.prototype.setAlpha = function(alpha){
    this.material.opacity = alpha;
  };

  return Label;

})();
