'use strict';

var MaterialVertexShader = `
  precision mediump float;

  // uniform mat4 modelViewMatrix;
  // uniform mat4 projectionMatrix;
  uniform float transitionPct;

  attribute float tween;
  attribute vec2 uvOffset;
  attribute vec3 translate;
  attribute vec3 translateDest;
  attribute vec3 actualSize;
  attribute vec3 scale;
  attribute vec3 color;
  attribute vec3 colorDest;
  attribute vec3 uidColor;
  attribute float alpha;
  attribute float alphaDest;

  varying vec2 vUv;
  varying vec3 vColor;
  varying vec3 vUidColor;
  varying float vTween;
  varying float vAlpha;

  #define PI 3.14159
  void main() {
    float pct = transitionPct * tween;
    vec3 p = mix( translate, translateDest, pct );//translateDest * pct + translate * (1.0 - pct);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vTween = tween;

    mvPosition.xyz += position * actualSize;
    vUv = uvOffset.xy + uv * actualSize.xy / scale.xy;

    vColor = mix( color, colorDest, pct );//colorDest * pct + color * (1.0 - pct);

    //picking color
    vUidColor = uidColor;

    // vec4 projection = projectionMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = (alphaDest-alpha) * pct + alpha;
  }
`;

var MaterialFragmentShader = `
  precision mediump float;

  uniform sampler2D map;
  uniform float renderUidColor;
  uniform vec3 fogColor;
  uniform float fogDistance;

  varying vec2 vUv;
  varying vec3 vColor;
  varying vec3 vUidColor;
  varying float vTween;
  varying float vAlpha;

  void main() {
    if( length( vColor ) < .1 )discard;

    gl_FragColor = vec4( 0., 0., 0., 1. );

    vec4 diffuseColor = texture2D( map, vUv) * vec4(vColor, 1.0) * vTween;
    gl_FragColor += diffuseColor;


    if( renderUidColor == 1. ){

        gl_FragColor = vec4( vUidColor, 1. );

    } else {
        //fog
        float depth = gl_FragCoord.z / gl_FragCoord.w;
        float d = clamp( 0., 1., pow( depth * ( 1./fogDistance ), 2. ) );
        if( d >= 1. ) discard;

        vec4 diffuseColor = texture2D(map, vUv);
        gl_FragColor = diffuseColor * vec4(vColor, 1.0) * vTween;
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, d );
    }

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
        transitionPct: {type: "f", value: 0.0},
        renderUidColor: {type: "f", value: 0.0},
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
    material.uniforms.transitionPct.value = 1.0;

    this.threeMaterial = material;
  };

  Material.prototype.getThree = function(){
    return this.threeMaterial;
  };

  return Material;

})();
