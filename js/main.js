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

    this.clock = false;
    this.cameraTransitionStart = false;
    this.cameraTransitionEnd = false;

    this.loadScene();

    this.collection = new Collection(_.extend({}, this.opt, {
      'camera': _this.camera,
      'onLoadEnd': function(){ _this.onLoadEnd(); },
      'onLoadProgress': function(){ _this.onLoadProgress(); }
    }));

    this.onLoadStart();
    this.collection.load();

    this.globalSound = new Sound({camera: this.camera});
  };

  MainApp.prototype.loadListeners = function(){
    var _this = this;
    $(window).on('resize', function(){
      _this.onResize();
    });

    $(document).on('change-positions', function(e, newValue, duration) {
      _this.globalSound.playSoundFromFile("sand.mp3");
    });

    $('.start').on('click', function(e){
      _this.onUserStart();
    });
  };

  MainApp.prototype.loadScene = function(){
    var $el = $(this.opt.el);
    var w = $el.width();
    var h = $el.height();
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, w / h, 1, 8000 );
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(w, h);
    $el.append(renderer.domElement);

    // var fogColor = 0x1a1817;
    // scene.background = new THREE.Color(fogColor);
    // scene.fog = new THREE.FogExp2(fogColor, 0.1);

    this.$el = $el;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  };

  MainApp.prototype.onLoadEnd = function(){
    var _this = this;
    console.log("Loaded everything.");
    this.$el.removeClass('is-loading');

    // init camera positio
    this.camera.position.copy(this.collection.getDefaultCameraPosition());
    this.camera.lookAt(new THREE.Vector3(0,0,0));

    this.controls = new Controls(_.extend({}, this.collection.ui, {'camera': this.camera, 'renderer': this.renderer, 'el': this.opt.el}));
    this.scene.add(this.collection.getThree());

    this.loadListeners();
    $('#instructions').addClass('active');

    var renderPromise = $.Deferred();
    setTimeout(function(){
      _this.render();
      renderPromise.resolve();
    }, 100);

    // fade in
    $.when(renderPromise).done(function(){
      setTimeout(function(){
        _this.collection.updateAlpha(0.0, 1.0, _this.opt.ui.startTransitionDuration);
      }, 100);
    });
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

  MainApp.prototype.onUserStart = function(){
    var _this = this;

    $('#instructions').removeClass('active');

    $(document).trigger('change-positions', ['default', this.opt.ui.startTransitionDuration]);
    // this.collection.updatePositions('default', _this.opt.ui.startTransitionDuration);
    this.transitionCameraPosition(_this.collection.getDefaultCameraPosition(), _this.opt.ui.startTransitionDuration*2);

    setTimeout(function(){
      _this.$el.addClass('loaded');
      _this.controls.load();
      _this.collection.onFinishedStart();
    }, this.opt.ui.startTransitionDuration*0.75);
  };

  MainApp.prototype.onResize = function(){
    var w = window.innerWidth;
    var h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);

    this.controls && this.controls.onResize();

    renderNeeded = true;
  };

  MainApp.prototype.render = function(){
    var _this = this;
    var now = new Date().getTime();

    if (this.clock === false) {
      this.clock = new THREE.Clock();
    }

    this.update(now);
    this.collection && this.collection.update(now);
    this.controls && this.controls.update(now, this.clock.getDelta());

    if (renderNeeded) {
      this.renderer.render( this.scene, this.camera );
      renderNeeded = false;
    }

    requestAnimationFrame(function(){
      _this.render();
    });

  };

  MainApp.prototype.transitionCameraPosition = function(newPosition, transitionDuration) {
    transitionDuration = transitionDuration || this.opt.ui.transitionDuration;

    this.cameraPositionFrom = this.camera.position.clone();
    if (this.cameraPositionFrom.equals(newPosition)) return;
    this.cameraPositionTo = newPosition;

    this.cameraTransitionStart = new Date().getTime();
    this.cameraTransitionEnd = this.cameraTransitionStart + transitionDuration;

    renderNeeded = true;
  };

  MainApp.prototype.update = function(now){
    if (this.cameraTransitionStart !== false && this.cameraTransitionEnd !== false) {
      var percent = MathUtil.norm(now, this.cameraTransitionStart, this.cameraTransitionEnd);
      percent = MathUtil.clamp(percent, 0, 1.0);
      percent = MathUtil.ease(percent);
      var newPosition = this.cameraPositionFrom.lerp(this.cameraPositionTo, percent);
      this.camera.position.copy(newPosition);
      if (percent >= 1.0 || this.camera.position.equals(this.cameraPositionTo)){
        this.cameraTransitionStart = false;
        this.cameraTransitionEnd = false;
      }
      renderNeeded = true;
    }
  };

  return MainApp;

})();
