'use strict';

var MainApp = (function() {

  function MainApp(config) {
    var defaults = {
      "el": "#app",
      "canvasId": "mainCanvas"
    };
    var globalConfig = typeof CONFIG !== 'undefined' ? CONFIG : {};
    this.opt = _.extend({}, defaults, config, globalConfig);
    this.init();
  }

  function isFullScreen(){
    return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }

  MainApp.prototype.init = function(){
    var _this = this;

    this.clock = false;
    this.cameraTransitionStart = false;
    this.cameraTransitionEnd = false;

    this.$intro = $('.intro');

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

    $doc.on('view-changed', function(e, newValue) {
      console.log('Changed view to: '+newValue)
      _this.onChangeView(newValue);
    });

    $doc.on('change-view', function(e, newValue) {
      console.log('Changing view to: '+newValue)
      _this.collection.changeView(newValue);
    });

    $doc.on('jump-to-item', function(e, itemIndex) {
      console.log('Jump to item: '+itemIndex);
      _this.collection && _this.collection.triggerItem(itemIndex);
    });

    $doc.on('close-active-item', function(e) {
      _this.collection && _this.collection.deselectActiveItem();
    });

    $doc.on('canvas-click', function(e, pointer, npointer) {
      _this.collection && _this.collection.onClickCanvas(pointer, npointer);
    });

    $doc.on('mousemove', '.key', function(e) {
      _this.collection && _this.collection.onHoverOverKey($(this), e);
    });

    $doc.on('click', '.key', function(e) {
      _this.collection && _this.collection.onClickKey($(this), e);
    });

    $('.explore-start').on('click', function(e){
      _this.onExploreStart();
    });

    $('.tour-start').on('click', function(e){
      _this.onTourStart();
    });

    $('.toggle-menu').on('click', function(){
      $('.main-nav').toggleClass('active');
    });

    $('.show-information').on('click', function(){
      _this.$intro.addClass('active');
    });

    $('.show-stories').on('click', function(){
      _this.$intro.addClass('active stories');
    });

    $doc.keypress(function(e){
      if (e.key === 'x') {
        e.preventDefault()
        _this.collection.deselectActiveItem();
      }
    });

    $doc.on('click', '.view-option', function(e) {
      var result = _this.collection.onViewOptionChange($(this));
      if (!result) e.preventDefault();
    });

    $doc.keypress(function(e){
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        _this.collection.stepViewOption(1);
      }
    });

    $('.item-close').on('click', function(e){
      e.preventDefault()
      _this.collection.deselectActiveItem();
    });

    $('.toggle-menus').on('click', function(){
      _this.collection.toggleMenus($(this));
    });

    $doc.on('click', '.close-story', function(e) {
      _this.collection && _this.collection.triggerStory(true);
    });

    $doc.on('click', '.slide-nav-button', function(e){
      _this.collection && _this.collection.storyManager.onClickNavButton($(this));
    });

    $doc.on('click', '.story-slide-prev', function(e){
      _this.collection && _this.collection.storyManager.onClickPrevButton($(this));
    });

    $doc.on('click', '.story-slide-next', function(e){
      _this.collection && _this.collection.storyManager.onClickNextButton($(this));
    });

    $doc.on('click', '.toggle-audio', function(e){
      _this.globalSound && _this.globalSound.onClickToggleAudio($(this));
    });

    $doc.on('click', '.toggle-object', function(e){
      $(this).toggleClass('active');
    });

    $doc.on('click', '.story-link', function(e) {
      var storyId = $(this).attr('data-story');
      _this.onSelectStory(storyId);
    });

    $('.toggle-fullscreen').on('click', function(){
      _this.onToggleFullscreen();
    });

    $('.toggle-sound').on('click', function(){
      var $el = $(this);
      $el.toggleClass('active');
      _this.onToggleSound($el.hasClass('active'));
    });

    $doc.on('fullscreenchange', function(){
      _this.onFullscreenChange();
    });

    $('.guide-close').on('click', function(e){
      _this.collection.guide && _this.collection.guide.close();
    });

    $('.guide-next').on('click', function(e){
      _this.collection.guide && _this.collection.guide.slideNext();
    });

    $('.guide-prev').on('click', function(e){
      _this.collection.guide && _this.collection.guide.slidePrev();
    });

    $doc.on('jump-to-location', function(e, position) {
      _this.controls.flyTo(position, false, _this.opt.ui.transitionDuration);
    });

    $doc.on('jump-to-time', function(e, year) {
      _this.collection.jumpToTime(year);
    });

    $doc.on('jump-to-story', function(e, storyId) {
      _this.onSelectStory(storyId);
    });

    $doc.on('deselect-item', function(e, onFinished){
      _this.collection.deselectActiveItem(onFinished);
    });
  };

  MainApp.prototype.loadScene = function(){
    var $el = $(this.opt.el);
    var w = $el.width();
    var h = $el.height();
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, w / h, 1, 8000 );
    var renderer = new THREE.WebGLRenderer();
    renderer.domElement.id = this.opt.canvasId;
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

    var duration = this.opt.ui.transitionDuration;
    this.collection.updateView(newViewKey, duration);

    var newView = this.collection.getCurrentView(newViewKey);
    this.controls.setBounds(newView.bounds);
    this.controls.setMode(newView.mode);

    // check if we're orbiting an item; fly with the item
    if (this.controls.isOrbiting) {
      var currentItemIndex = this.collection.getCurrentItemIndex();
      if (currentItemIndex >= 0) {
        var newPositions = this.collection.itemManager.itemPositions;
        var targetPosition = newPositions[currentItemIndex];
        var anchorToPosition = true;
        // console.log(targetPosition, this.collection.opt.zoomInDistance, duration)
        this.controls.flyToOrbit(targetPosition, this.collection.opt.zoomInDistance, duration, anchorToPosition);
        return;
      }
    }

    var currentP = this.camera.position;
    var newP = newView.cameraPosition;
    var newBounds = newView.bounds;

    // don't change current X/Z if within new bounds
    if (newViewKey != 'geographyBars') {
      if (currentP.x >= newBounds[0] && currentP.x <= newBounds[1]) newP[0] = currentP.x;
      if (currentP.z >= newBounds[2] && currentP.z <= newBounds[3]) newP[2] = currentP.z;
    }

    var targetPosition = new THREE.Vector3(newP[0], newP[1], newP[2]);
    var targetLookAtPosition = false;
    var anchorToPosition = false;
    var onFinished = this.collection.onChangeViewFinished;
    this.controls.flyTo(targetPosition, targetLookAtPosition, this.opt.ui.transitionDuration, anchorToPosition, onFinished);
  };

  MainApp.prototype.onExploreStart = function(){
    this.onUserStart();
  };

  MainApp.prototype.onFullscreenChange = function(){
    // if is full screen
    if (isFullScreen()) {
      $('.toggle-fullscreen').addClass('active');
    } else {
      $('.toggle-fullscreen').removeClass('active');
    }
  };

  MainApp.prototype.onLoadEnd = function(){
    var _this = this;
    console.log("Loaded everything.");

    this.$el.removeClass('is-loading');

    // init camera positio
    // this.camera.position.copy(this.collection.getDefaultCameraPosition());
    // this.camera.lookAt(new THREE.Vector3(0,0,0));

    var view = this.collection.getCurrentView();
    this.controls = new Controls(_.extend({}, this.collection.ui, {'menus': this.opt.menus, 'camera': this.camera, 'renderer': this.renderer, 'el': this.opt.el, 'bounds': view.bounds, 'storyManager': this.collection.storyManager, 'itemManager': this.collection.itemManager, 'zoomInTransitionDuration': this.opt.ui.zoomInTransitionDuration, 'canvasEl': '#'+this.opt.canvasId}));
    this.collection.setControls(this.controls);

    this.scene.add(this.collection.getThree());

    this.loadListeners();

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
    // this.$loadingProgress.css('width', percentFinished);
  };

  MainApp.prototype.onLoadStart = function(){
    this.totalLoaded = 0;
    this.totalToLoad = this.collection.getTotalToLoad();
    // this.$loadingProgress = $('.loading-progress');
    this.$loadingText = $('.loading-text');
    this.$el.addClass('is-loading');
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

  MainApp.prototype.onSelectStory = function(storyId){
    var _this = this;
    console.log('Jump to story: '+storyId);

    this.$intro.removeClass('active stories');

    // if in random view, switch to geography or timeline view
    if (_this.collection.currentViewKey == 'randomSphere') {

      var onFinished = function(){
        _this.collection.triggerStoryById(storyId);
      };
      this.collection.changeView('geographyBars', onFinished) || this.collection.changeView('timelineTunnel', onFinished);

    } else {
      this.collection.triggerStoryById(storyId);
    }
  };

  MainApp.prototype.onToggleFullscreen = function() {
    if (!isFullScreen()) {  // current working methods
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) { // IE11
        document.documentElement.msRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) { // Firefox
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullscreen) { // Safari
        document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) { // IE11
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) { // Firefox
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { // Safari
        document.webkitExitFullscreen();
      }
    }
  };

  MainApp.prototype.onToggleSound = function(isActive){
    var volume = isActive ? 0 : 1;
    this.globalListener.setMasterVolume(volume);
  };

  MainApp.prototype.onTourStart = function(){
    this.collection.guide && this.collection.guide.start();
    this.onUserStart();
  };

  MainApp.prototype.onUserStart = function(){
    var _this = this;

    this.$intro.removeClass('active');
    if (this.started) return;
    this.started = true;

    this.controls.instructionsShow();

    var p = this.collection.getDefaultCameraPosition();
    var targetPosition = new THREE.Vector3(p.x, p.y, p.z);
    var targetLookAtPosition = new THREE.Vector3(0, 0, 0);
    this.controls.flyTo(targetPosition, targetLookAtPosition, this.opt.ui.transitionDuration);

    setTimeout(function(){
      _this.$el.addClass('loaded');
      _this.controls.load();
      _this.collection.onFinishedStart();
      _this.$el.removeClass('is-loading');
    }, 100);
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
