'use strict';

var MainApp = (function() {

  function MainApp(config) {
    var defaults = {
      "el": "#app"
    };
    var globalConfig = typeof CONFIG !== 'undefined' ? CONFIG : {};
    this.opt = _.extend({}, defaults, config, globalConfig);
    this.init();
  }

  MainApp.prototype.init = function(){
    var _this = this;

    this.loadScene();

    $.when(
      this.loadData(),
      this.loadAssets()

    ).done(function(){
      _this.onLoad();
    });
  };

  MainApp.prototype.loadAssets = function(){
    var _this = this;
    var deferred = $.Deferred();
    deferred.resolve();
    this.assets = [];
    return deferred;
  };

  MainApp.prototype.loadData = function(){
    var _this = this;
    var deferred = $.Deferred();
    deferred.resolve();
    this.data = [];
    return deferred;
  };

  MainApp.prototype.loadScene = function(){
    var $el = $(this.opt.el);
    var w = $el.width();
    var h = $el.height();
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, w / h, 1, 100000 );
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);
    $el.append(renderer.domElement);
    camera.position.z = 400;

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  };

  MainApp.prototype.onLoad = function(){
    console.log("Loaded everything.");

    this.collection = new Collection({
      "data": this.data,
      "assets": this.assets
    });

    this.render();
  };

  MainApp.prototype.render = function(){

    this.renderer.render( this.scene, this.camera );
    this.collection && this.collection.render();

    requestAnimationFrame(function(){
      _this.render();
    });

  };

  return MainApp;

})();
