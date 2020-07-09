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

    this.collection = new Collection(_.extend({}, this.opt, {
      'onLoadEnd': function(){ _this.onLoadEnd(); },
      'onLoadProgress': function(){ _this.onLoadProgress(); }
    }));

    this.onLoadStart();
    this.collection.load();

    this.sound = new Sound({});
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
    camera.position.z = 2000;
    camera.lookAt(new THREE.Vector3(0,0,0));

    this.$el = $el;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  };

  MainApp.prototype.onLoadEnd = function(){
    var _this = this;
    console.log("Loaded everything.");
    this.$el.removeClass('is-loading');
    this.controls = new Controls(_.extend({}, this.collection.ui, {'camera': this.camera, 'renderer': this.renderer, 'el': this.opt.el}));
    this.scene.add(this.collection.getThree());
    setTimeout(function(){ _this.render(); }, 500);
  };

  MainApp.prototype.onLoadProgress = function(){
    this.totalLoaded += 1;
    var percentFinished = this.totalLoaded / this.totalToLoad;
    percentFinished = Math.round(percentFinished * 100) + '%';
    this.$loadingText.text(percentFinished);
    this.$loadingProgress.css('width', percentFinished);
  };

  MainApp.prototype.onLoadStart = function(){
    this.totalLoaded = 0;
    this.totalToLoad = this.collection.getTotalToLoad();
    this.$loadingProgress = $('.loading-progress');
    this.$loadingText = $('.loading-text');
    this.$el.addClass('is-loading');
  };

  MainApp.prototype.render = function(){
    var _this = this;

    this.collection && this.collection.update();
    this.controls && this.controls.update();

    if (renderNeeded) {
      this.renderer.render( this.scene, this.camera );
      renderNeeded = false;
    }

    requestAnimationFrame(function(){
      _this.render();
    });

  };

  return MainApp;

})();
