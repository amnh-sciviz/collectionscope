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

    this.globalListener = new THREE.AudioListener();
    this.camera.add(this.globalListener);
    this.globalSound = new Sound({listener: this.globalListener});

    this.collection = new Collection(_.extend({}, this.opt, {
      'camera': _this.camera,
      'listener': _this.globalListener,
      'onLoadEnd': function(){ _this.onLoadEnd(); },
      'onLoadProgress': function(){ _this.onLoadProgress(); }
    }));

    this.onLoadStart();
    this.collection.load();
  };

  MainApp.prototype.loadListeners = function(){
    var _this = this;
    var $doc = $(document);

    $(window).on('resize', function(){
      _this.onResize();
    });

    $doc.on('change-view', function(e, newValue, duration) {
      _this.onChangeView(newValue);
    });

    $doc.on('canvas-click', function(e, pointer, npointer) {
      _this.collection && _this.collection.onClickCanvas(pointer, npointer);
    });

    $doc.on('click', '.close-story', function(e) {
      _this.collection && _this.collection.triggerSelectedHotspot(true);
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

  MainApp.prototype.onChangeView = function(newViewKey){
    this.globalSound.playSoundFromFile("sand.mp3");

    var newView = this.collection.getCurrentView(newViewKey);
    this.controls.setBounds(newView.bounds);

    var currentP = this.camera.position;
    var newP = newView.cameraPosition;
    var newBounds = newView.bounds;

    // don't change current X/Z if within new bounds
    if (newViewKey != 'map') {
      if (currentP.x >= newBounds[0] && currentP.x <= newBounds[1]) newP[0] = currentP.x;
      if (currentP.z >= newBounds[2] && currentP.z <= newBounds[3]) newP[2] = currentP.z;
    }

    this.transitionCameraPosition(new THREE.Vector3(newP[0], newP[1], newP[2]));
  };

  MainApp.prototype.onLoadEnd = function(){
    var _this = this;
    console.log("Loaded everything.");
    this.$el.removeClass('is-loading');

    // init camera positio
    this.camera.position.copy(this.collection.getDefaultCameraPosition());
    this.camera.lookAt(new THREE.Vector3(0,0,0));

    var view = this.collection.getCurrentView();
    this.controls = new Controls(_.extend({}, this.collection.ui, {'menus': this.opt.menus, 'camera': this.camera, 'renderer': this.renderer, 'el': this.opt.el, 'bounds': view.bounds, 'storyManager': this.collection.storyManager, 'itemManager': this.collection.itemManager}));

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

    // $(document).trigger('change-view', ['timeline', this.opt.ui.startTransitionDuration]);
    this.transitionCameraPosition(_this.collection.getDefaultCameraPosition(), _this.opt.ui.startTransitionDuration);

    setTimeout(function(){
      _this.$el.addClass('loaded');
      _this.controls.load();
      _this.collection.onFinishedStart();
      _this.$el.removeClass('is-loading');
    }, 100);
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
    this.controls && this.controls.update(now, this.clock.getDelta());
    this.collection && this.collection.update(now, this.controls.npointer);

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
