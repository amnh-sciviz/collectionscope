'use strict';

var ObjViewer = (function() {

  function ObjViewer(config) {
    var defaults = {
      el: '#viewer-target',
      obj: 'path/to/file.obj', // required!
      viewAngle: 45,
      near: 0.01,
      far: 100000,
      radius: 20
    };
    var q = Util.queryParams();
    this.opt = _.extend({}, defaults, config, q);
    this.init();
  }

  ObjViewer.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.el = this.$el[0];
    this.width = this.$el.width();
    this.height = this.$el.height();
    this.aspectRatio = this.width / this.height;
    this.loadScene();
  };

  ObjViewer.prototype.loadScene = function(){
    var _this = this;
    var w = this.width;
    var h = this.height;
    var el = this.el;
    var r = this.opt.radius;

    var renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);
    this.renderer = renderer;

    var viewAngle = this.opt.viewAngle;
    var aspectRatio = this.aspectRatio;
    var near = this.opt.near;
    var far = this.opt.far;
    var camera = new THREE.PerspectiveCamera(viewAngle, aspectRatio, near, far);
    camera.position.set(0, -r*2, r*0.75);
    camera.lookAt(new THREE.Vector3(0,0,0));

    var controls = new THREE.OrbitControls(camera, el);
    var scene = new THREE.Scene();

    // scene.add(new THREE.AxesHelper(100));
    // scene.add(new THREE.GridHelper(10, 10));

    // add lights
    scene.add(new THREE.AmbientLight(0x404040));
    scene.add(new THREE.HemisphereLight(0x443333, 0x111122));

    var lightColor = 0xbcb7a7;
    var lightIntensity = 0.5;
    var lightDistance = 3 * r;

    // directional light
    var dlight = new THREE.DirectionalLight(lightColor, lightIntensity);
    dlight.position.set(0, 0, lightDistance);
    scene.add(dlight);

    dlight = new THREE.DirectionalLight(lightColor, lightIntensity);
    dlight.position.set(0, -lightDistance, lightDistance);
    scene.add(dlight);

    dlight = new THREE.DirectionalLight(lightColor, lightIntensity);
    dlight.position.set(0, lightDistance, -lightDistance);
    scene.add(dlight);

    var objLoader = new THREE.OBJLoader();
    objLoader.load(this.opt.obj, function ( object ) {
      console.log('Object loaded');
      scene.add(object);
      _this.onSceneLoaded(object, scene, camera);
    });
  };

  ObjViewer.prototype.onResize = function(){
    var w = this.$el.width();
    var h = this.$el.height();
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  ObjViewer.prototype.onSceneLoaded = function(object, scene, camera){
    var _this = this;
    var r = this.opt.radius;
    // object.position.set(0, 0, -r*0.3333);
    object.castShadow = true;
    object.receiveShadow = true;

    this.$el.removeClass('loading');
    this.scene = scene;
    this.camera = camera;
    this.render();

    $(window).on('resize', function(){
      _this.onResize();
    });
  };

  ObjViewer.prototype.render = function(){
    var _this = this;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(function(){ _this.render(); });
  };

  return ObjViewer;

})();
