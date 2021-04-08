'use strict';

var Raycaster = (function() {

  function Raycaster(config) {
    var defaults = {
      highlightWidth: 16,
      highlightThickness: 2,
      highlightColor: 0xf57542,
      near: 0.001,
      far: 1000, // increase this to hit objects farther away
      points: false, // required!
      camera: false // required!
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Raycaster.LAYER_NUMBER = 7; // Raycaster will only look at objects on this layer

  Raycaster.prototype.init = function(){
    this.camera = this.opt.camera;
    this.points = this.opt.points;

    var diagonal = MathUtil.hypot(this.opt.highlightWidth, this.opt.highlightWidth);
    var innerRadius = diagonal * 0.5;

    var raycaster = new THREE.Raycaster();
    raycaster.near = this.opt.near;
    raycaster.far = this.opt.far;
    raycaster.params.Points.threshold = innerRadius;
    raycaster.layers.set( Raycaster.LAYER_NUMBER );
    this.raycaster = raycaster;

    // create an object for highlighting intersections
    var outerRadius = innerRadius + this.opt.highlightThickness;

    function vertexShader() {
      return `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main()
        {
          vec3 vNormal = normalize( normalMatrix * normal );
          vec3 vNormel = normalize( normalMatrix * viewVector );
          intensity = pow( c - dot(vNormal, vNormel), p );

          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `
    }
    function fragmentShader(){
      return `
        uniform vec3 glowColor;
        varying float intensity;
        void main()
        {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4( glow, 1.0 );
        }
      `
    }
    let uniforms = {
      c:   { type: "f", value: 1.0 },
      p:   { type: "f", value: 1.4 },
      glowColor: { type: "vec3", value: new THREE.Color(0x00ffff) },
      viewVector: { type: "vec3", value: new THREE.Vector3(0.0,0.0,1.0) }
    }
    var customMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader(),
      fragmentShader: fragmentShader(),
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });

    var geometry = new THREE.SphereGeometry(outerRadius, 32, 32);
    var mesh = new THREE.Mesh(geometry, customMaterial)

    var container = new THREE.Group();
    container.add(mesh);
    container.visible = false;
    this.highlighter = container;

    this.activeObjectIndex = -1;
    this.highlightedObjectIndex = -1;
    this.isHidden = false;
  };

  Raycaster.prototype.cast = function( position ){

    var camera = this.camera;
    var objects = [this.points.threePoints];

    this.raycaster.setFromCamera( position, camera );
    var intersections = this.raycaster.intersectObjects( objects );
    var intersectionIndex = intersections.length > 0 ? intersections[ 0 ].index : -1; // return the object index

    if (intersectionIndex === this.highlightedObjectIndex) return;
    this.highlightedObjectIndex = intersectionIndex;
    var isCurrentActiveIndex = this.activeObjectIndex === intersectionIndex;

    if (intersectionIndex < 0 || isCurrentActiveIndex) {
      this.highlighter.visible = false;

    } else {
      // console.log(intersections[ 0 ].distance);
      var posArr = this.points.positionAttr.array;
      var x = posArr[ 3 * intersectionIndex ];
      var y = posArr[ 3 * intersectionIndex + 1 ];
      var z = posArr[ 3 * intersectionIndex + 2 ];
      // console.log(x, y, z);
      this.highlighter.position.set(x, y, z);
      if (!this.isHidden) this.highlighter.visible = true;
    }

    renderNeeded = true;
  };

  Raycaster.prototype.getActiveItemIndex = function(){
    if (!this.highlighter.visible) return -1;
    return this.highlightedObjectIndex;
  };

  Raycaster.prototype.getThree = function(){
    return this.highlighter;
  };

  Raycaster.prototype.hide = function(duration){
    var _this = this;
    this.highlighter.visible = false;
    this.isHidden = true;
    if (duration) {
      if (this.hiddenTimeout) clearTimeout(this.hiddenTimeout);
      this.hiddenTimeout = setTimeout(function(){
        _this.isHidden = false;
      }, duration)
    }
  };

  Raycaster.prototype.update = function(position){

    this.cast(position);

    if (this.highlighter.visible) {
      this.highlighter.lookAt( this.camera.position );
      renderNeeded = true;
    }
  };

  return Raycaster;

})();
