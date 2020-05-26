'use strict';

var MaterialVertexShader = `
  precision mediump float;

  // uniform mat4 modelViewMatrix;
  // uniform mat4 projectionMatrix;
  uniform float positionTransitionPct;
  uniform float colorTransitionPct;
  uniform float alphaTransitionPct;

  attribute vec2 uvOffset;
  attribute vec3 translate;
  attribute vec3 translateDest;
  attribute vec3 actualSize;
  attribute vec3 scale;
  attribute vec3 color;
  attribute vec3 colorDest;
  attribute float alpha;
  attribute float alphaDest;
  attribute float randSeed;

  varying vec2 vUv;
  varying vec3 vColor;
  varying vec3 vUidColor;
  varying float vAlpha;

  #define PI 3.14159
  void main() {
    // add some slight variability to transitions
    float r = randSeed;
    if (r <= 0.0) r = 0.01;
    float pPct = positionTransitionPct * (1.0 + r);
    float cPct = colorTransitionPct * (1.0 + r);
    float aPct = alphaTransitionPct * (1.0 + r);
    if (pPct > 1.0) pPct = 1.0;
    if (cPct > 1.0) cPct = 1.0;
    if (aPct > 1.0) aPct = 1.0;

    vec3 p = mix( translate, translateDest, pPct );

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

    mvPosition.xyz += position * actualSize;
    vUv = uvOffset.xy + uv * actualSize.xy / scale.xy;

    vColor = mix( color, colorDest, cPct );

    gl_Position = projectionMatrix * mvPosition;

    vAlpha = (alphaDest-alpha) * aPct + alpha;
  }
`;

var MaterialFragmentShader = `
  precision mediump float;

  uniform sampler2D map;
  uniform vec3 fogColor;
  uniform float fogDistance;

  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    if( length( vColor ) < .1 )discard;

    // gl_FragColor = vec4( 0., 0., 0., 1. );
    // vec4 diffuseColor = texture2D( map, vUv) * vec4(vColor, 1.0);
    // gl_FragColor += diffuseColor;

    //fog
    float depth = gl_FragCoord.z / gl_FragCoord.w;
    float d = clamp( 0., 1., pow( depth * ( 1./fogDistance ), 2. ) );
    if( d >= 1. ) discard;

    vec4 diffuseColor = texture2D(map, vUv);
    gl_FragColor = diffuseColor * vec4(vColor, 1.0);
    gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, d );
    gl_FragColor.a = vAlpha;
  }
`;

var Material = (function() {

  function Material(config) {
    var defaults = {  };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Material.prototype.init = function(){

    var material = new THREE.ShaderMaterial({
      uniforms: {
        map: {type: "t", value: this.opt.texture },
        positionTransitionPct: {type: "f", value: 0.0},
        colorTransitionPct: {type: "f", value: 0.0},
        alphaTransitionPct: {type: "f", value: 0.0},
        ///fog
        fogColor: {type: "v3", value: new THREE.Vector3()},
        fogDistance: {type: "f", value: 100000}
      },
      vertexShader: MaterialVertexShader,
      fragmentShader: MaterialFragmentShader,
      depthTest: true,
      depthWrite: true,
      transparent: true
    });
    material.uniforms.positionTransitionPct.value = 1.0;
    material.uniforms.colorTransitionPct.value = 1.0;
    material.uniforms.alphaTransitionPct.value = 1.0;

    this.threeMaterial = material;

    this.positionTransitionStart = false;
    this.positionTransitionEnd = false;
  };

  Material.prototype.getThree = function(){
    return this.threeMaterial;
  };

  Material.prototype.transitionPosition = function(duration){
    this.threeMaterial.uniforms.positionTransitionPct.value = 0.0;
    this.positionTransitionStart = new Date().getTime();
    this.positionTransitionEnd = this.positionTransitionStart + duration;
  };

  Material.prototype.update = function(){
    // check if we are transitioning the position
    if (this.positionTransitionStart !== false && this.positionTransitionEnd !== false) {
      var now = new Date().getTime();
      var percent = MathUtil.norm(now, this.positionTransitionStart, this.positionTransitionEnd);
      percent = MathUtil.clamp(percent, 0, 1.0);
      this.threeMaterial.uniforms.positionTransitionPct.value = percent;
      if (percent >= 1.0){
        this.positionTransitionStart = false;
        this.positionTransitionEnd = false;
      }
      renderNeeded = true;
    }
  };

  return Material;

})();
