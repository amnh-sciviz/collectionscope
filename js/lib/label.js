'use strict';

var Label = (function() {

  function Label(config) {
    var defaults = {
      'text': 'Default text',
      'position': [0, 0, 0],
      'color': '#ffffff',
      'fontSize': 12,
      'thickness': 2,
      'faceUp': false,
      'faceEast': false,
      'faceWest': false
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Label.prototype.init = function(){
    if (!this.opt.font) {
      console.log('Pass in font');
      return;
    }

    var textMat = [
      new THREE.MeshBasicMaterial( { color: this.opt.color } ), // front
      new THREE.MeshBasicMaterial( { color: 0x000000 } ) // side
    ];
    // var textMat = new THREE.MeshBasicMaterial({ color: this.opt.color });
    var textGeo = new THREE.TextGeometry( ''+this.opt.text, {
      font: this.opt.font,
      size: this.opt.fontSize,
      height: this.opt.thickness
    });
    textMat[0].transparent = true;
    textMat[0].opacity = 0.0;
    textMat[1].transparent = true;
    textMat[1].opacity = 0.0;

    textGeo.computeBoundingBox();
    // textGeo.center();
    // textGeo.computeVertexNormals();
    // textGeo = new THREE.BufferGeometry().fromGeometry(textGeo);

    var textMesh = new THREE.Mesh(textGeo, textMat);

    // center the position
    var offsetX = 0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
    var offsetY = -(textGeo.boundingBox.max.y - textGeo.boundingBox.min.y);
    var offsetZ = 0;
    var p = this.opt.position;

    if (this.opt.faceEast || this.opt.faceWest) {
      offsetZ = -offsetX;
      offsetX = 0;
    }
    if (this.opt.faceUp) {
      if (this.opt.faceEast || this.opt.faceWest) {
        offsetX = offsetY;
      }
      offsetY = 0;
    }

    textMesh.position.set(p[0]+offsetX, p[1]+offsetY, p[2]+offsetZ);

    // textMesh.rotation.x = Math.PI * 2;
    textMesh.rotation.y = Math.PI;
    if (this.opt.faceUp) {
      textMesh.rotation.x = Math.PI * 0.5;
    }
    if (this.opt.faceEast) {
      textMesh.rotation.z = Math.PI * 0.5;
    }

    this.material = textMat;
    this.mesh = textMesh;
    this.mesh.visible = false;

    // var geometry = new THREE.SphereGeometry( 5, 32, 32 );
    // var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    // var sphere = new THREE.Mesh( geometry, material );
    // sphere.position.set(p[0], p[1], p[2]);
    // this.helper = sphere;
  };

  Label.prototype.getThree = function(){
    return this.mesh;
  };

  Label.prototype.setAlpha = function(alpha){
    this.material[0].opacity = alpha;
    this.material[1].opacity = alpha;
    if (alpha > 0.0) this.mesh.visible = true;
    else this.mesh.visible = false;
  };

  return Label;

})();
