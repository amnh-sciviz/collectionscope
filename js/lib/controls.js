'use strict';

var Controls = (function() {

  function Controls(config) {
    var defaults = {
      "el": "#app",
      "canvasEl": "#mainCanvas",
      "device": "auto",
      "mode": "firstPerson", // mode: firstPerson or railcar
      "maxVelocity": 20,
      "acceleration": 0.2,
      "bounds": [-256, 256, -32768, 32768],
      "lookSpeed": 0.01,
      "zoomInTransitionDuration": 2000,
      "orbitLookSpeed": 0.1,
      "latRange": [-85, 85],  // range of field of view in y-axis
      "lonRange": [-60, 60] // range of field of view in x-axis
    };
    var q = Util.queryParams();
    this.opt = _.extend({}, defaults, config, q);
    this.init();
  }

  function isTouchDevice() {
    try {
      document.createEvent("TouchEvent");
      return true;
    } catch (e) {
      return false;
    }
  }

  Controls.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.$canvas = $(this.opt.canvasEl);
    this.$instructions = $('#instructions');
    this.isTouch = isTouchDevice() || this.opt.device === "touch";
    if (this.opt.device === "keyboard") this.isTouch = false;
    this.isXR = false;
    this.device = "keyboard";
    if (this.isTouch) this.device = "touch";
    else if (this.isXR) this.device = "xr";
    this.moveDirectionX = 0;
    this.moveDirectionY = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.camera = this.opt.camera;
    this.mode = this.opt.mode;
    this.loaded = false;
    this.lookAtPosition = new THREE.Vector3();
    this.anchor = false;
    this.orbit = new THREE.Spherical();
    this.orbitPointerOrigin = new THREE.Vector2();
    this.cameraIsLocked = false;
    this.isUsingTrackpad = false;

    this.autoAttach = true;
    this.isAttached = true;
    this.attachTimeout = false;

    this.lookSpeedNormal = this.opt.lookSpeed;
    this.lookSpeedFast = this.opt.lookSpeed * 5;
    this.lookSpeed = this.lookSpeedNormal;

    // for determining what the camera is looking at
    this.pointed = false;
    this.pointer = new THREE.Vector2();
    this.npointer = new THREE.Vector2();
    this.npointerLook = new THREE.Vector2(); // a vector that is delayed, follows npointer
    // this.pointerDelta = new THREE.Vector2();
    this.lat = 0;
    this.lon = 0;

    this.loadUI();

    this.onResize();
  };

  Controls.prototype.attachCursor = function(isAttached, centerPointer) {
    this.isAttached = isAttached;
    this.attachTimeout = false;

    if (centerPointer) {
      this.centerPointer();
    }

    if (isAttached) this.lookSpeed = this.lookSpeedNormal;
    else this.lookSpeed = this.lookSpeedFast;
  };

  Controls.prototype.attachCursorWithDelay = function(ms){
    if (this.attachTimeout) return;

    var _this = this;
    this.attachTimeout = setTimeout(function(){ _this.attachCursor(true); }, ms);
  };

  Controls.prototype.centerPointer = function(){
    var x = this.viewW * 0.5;
    var y = this.viewH * 0.5;

    this.onPointChange(x, y);
  };

  Controls.prototype.fly = function(now){
    var percent = MathUtil.norm(now, this.flyStartTime, this.flyEndTime);
    percent = MathUtil.clamp(percent, 0, 1.0);
    percent = MathUtil.ease(percent);

    var cameraPosition = this.flyStartPosition.clone();
    cameraPosition = cameraPosition.lerp(this.flyEndPosition, percent);

    var lookAt = false;
    if (this.flyEndLookAtPosition !== false) {
      var lookAt = this.flyStartLookAtPosition.clone();
      lookAt = lookAt.lerp(this.flyEndLookAtPosition, percent);
    }

    this.camera.position.copy(cameraPosition);
    if (lookAt !== false) this.camera.lookAt(lookAt);

    if (percent >= 1.0){
      this.isFlying = false;
      if (lookAt !== false) this.lookAtPosition = lookAt.clone();
      if (this.anchorToFlyPosition && lookAt !== false) {
        this.setAnchor(lookAt.clone());
      } else {
        this.setAnchor(false);
      }
      this.onFlyFinished && this.onFlyFinished();
      this.cameraIsLocked = false;
    }

    renderNeeded = true;
  };

  Controls.prototype.flyTo = function(targetPosition, targetLookAtPosition, transitionDuration, anchorToPosition, onFinished){
    this.isFlying = true;
    this.flyStartTime = new Date().getTime();
    this.flyEndTime = this.flyStartTime + transitionDuration;
    var cameraPosition = this.camera.position.clone();

    // keep track of last position and look-at before we fly
    if (!this.isOrbiting) {
      this.lastPreOrbitPosition = cameraPosition.clone();
      this.lastPreOrbitLookAt = this.lookAtPosition.clone();
    }
    this.anchorToFlyPosition = anchorToPosition ? true : false;

    this.flyStartPosition = cameraPosition.clone();
    this.flyStartLookAtPosition = this.lookAtPosition.clone();
    this.flyEndLookAtPosition = targetLookAtPosition ? targetLookAtPosition.clone() : false;
    this.flyEndPosition = targetPosition.clone();

    this.cameraIsLocked = (this.flyEndLookAtPosition !== false);

    this.onFlyFinished = onFinished ? onFinished : false;
  };

  Controls.prototype.flyToOrbit = function(position, radius, transitionDuration, anchorToPosition, onFinished){
    var cameraPosition = this.camera.position.clone();
    var targetLookAtPosition = new THREE.Vector3(position.x, position.y, position.z);
    var targetPosition = targetLookAtPosition.clone();
    if (radius > 0) {
      var cameraDistance = targetPosition.distanceTo(cameraPosition);
      var lerpAmount = 1.0 - (radius/cameraDistance);
      targetPosition = cameraPosition.lerp(targetPosition, lerpAmount);
    }
    this.flyTo(targetPosition, targetLookAtPosition, transitionDuration, anchorToPosition, onFinished);
  };

  Controls.prototype.instructionsHide = function(){
    this.$instructions.removeClass('active');
  };

  Controls.prototype.instructionsShow = function(){
    this.$instructions.addClass('active');
  };

  Controls.prototype.load = function(){
    this.loadListeners();
    this.loadTouchpad();
    this.loaded = true;
    this.update();
  };

  Controls.prototype.loadListeners = function(){
    var _this = this;
    var isTouch = this.isTouch;
    var $doc = $(document);

    $('.move-button').each(function(){
      var el = $(this)[0];
      var direction = parseInt($(this).attr('data-direction'));

      var mc = new Hammer(el);
      mc.on("press", function(e) {
        _this.moveDirectionY = direction;
      });

      mc.on("pressup", function(e){
        _this.moveDirectionY = 0;
      });
    });

    $doc.keydown(function(e) {
      switch(e.key) {
        case 'ArrowUp': // arrow up
        case 'w': // w
          e.preventDefault();
          _this.moveDirectionY = 1;
          break;

        case 'ArrowDown': // arrow down
        case 's': // s
          e.preventDefault();
          _this.moveDirectionY = -1;
          break;

        case 'ArrowLeft': // arrow left
        case 'a': // a
          e.preventDefault();
          _this.moveDirectionX = 1;
          break;

        case 'ArrowRight': // arrow right
        case 'd': // d
          e.preventDefault();
          _this.moveDirectionX = -1;
          break;

        // detach cursor when click escape
        case 'Escape':
          e.preventDefault();
          _this.autoAttach = false;
          _this.attachCursor(false);
          break;

        default:
          break;
      }
    });

    $doc.keyup(function(e) {
      switch(e.key) {
        case 'ArrowUp': // arrow up
        case 'w': // w
        case 'ArrowDown': // arrow down
        case 's': // s
          e.preventDefault();
          _this.moveDirectionY = 0;
          break;

        case 'ArrowLeft': // arrow left
        case 'a': // a
        case 'ArrowRight': // arrow right
        case 'd': // d
          e.preventDefault();
          _this.moveDirectionX = 0;
          break;

        default:
          break;
      }
    });

    this.$canvas.on('contextmenu', function(e) {
      e.preventDefault();
    });

    $doc.on("mousemove", function(e){
      if (isTouch || _this.isUsingTrackpad) return;
      if (_this.autoAttach && !_this.isOrbiting) {
        if (e.target.id !== 'mainCanvas') _this.attachCursor(false, true);
        else _this.attachCursorWithDelay(500);
      }
      if (_this.isAttached) {
        _this.onPointChange(e.pageX, e.pageY);
      }
    });

    this.$canvas.on('click', function(e) {
      if (!_this.autoAttach && !_this.isAttached) {
        _this.autoAttach = true;
        _this.attachCursor(true);
      }
      _this.onPointChange(e.pageX, e.pageY);

      $(document).trigger('canvas-click', [_this.pointer, _this.npointer]);
    });

    if (isTouch) {
      var el = this.$canvas[0];
      var mc = new Hammer(el);
      mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });
      mc.on("panstart panmove press", function(e) {
        _this.onPointChange(e.center.x, e.center.y);
      });
      // mc.on("panend pancancel pressup", function(e){
      //   _this.centerPointer();
      // });
    }

    $('.instructions-close').on('click', function(){
      _this.instructionsHide();
    });

    $('.show-instructions').on('click', function(){
      _this.instructionsShow();
    });
  };

  Controls.prototype.loadTouchpad = function(){

    var _this = this;
    var $touchpad = $('#touchpad');
    if (!$touchpad.length || !this.isTouch) return;

    $touchpad.addClass('active');
    this.$touchpad = $touchpad;
    this.$touchpadHandle = $touchpad.find('.touchpad-handle').first();

    var touchpadEl = $touchpad[0];
    var touchPad = new Hammer(touchpadEl);
    touchPad.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    touchPad.on("panstart panmove press", function(e) {
      var p = Util.getRelativePoint($touchpad, e.center.x, e.center.y);
      _this.onTouchpadChange(p.x, p.y);
    });
    touchPad.on("panend", function(e) {
      _this.onTouchpadEnd();
    });
  };

  Controls.prototype.loadUI = function(){
    if (this.isTouch) $('.touch-instructions').addClass('active');
    else $('.keyboard-instructions').addClass('active');
  };

  Controls.prototype.normalizePointer = function(){
    var nx = this.pointer.x / this.viewW;
    var ny = this.pointer.y / this.viewH;
    this.npointer.x = nx * 2 - 1;
    this.npointer.y = -ny * 2 + 1;
  };

  Controls.prototype.onResize = function(){
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;
    this.viewHalfX = this.viewW / 2;
    this.viewHalfY = this.viewH / 2;
  };

  Controls.prototype.onPointChange = function(x, y){
    this.pointed = true;
    // this.pointerDelta.x = x - this.pointer.x;
    // this.pointerDelta.y = y - this.pointer.y;
    this.pointer.x = x;
    this.pointer.y = y;
    this.normalizePointer();
  };

  Controls.prototype.onTouchpadChange = function(nx, ny){
    // console.log(nx, ny);
    this.$touchpad.addClass('touching');

    // compare touch coordinates to circle center
    var distanceX = nx - 0.5;
    var distanceY = ny - 0.5;

    //determine distance from center and use as velocity magnitude
    var r = 0.4;
    var mag = Math.sqrt((distanceX * distanceX) + (distanceY * distanceY)); // distance formula
    var nMag = (mag > r) ? 1 : mag / r; // normalized magnitude with max magnitude = 1;

    // determine final direction so velocity is such that -1 >= velocity >= 1
    var direction = new THREE.Vector2();
    direction.x = (mag === 0) ? 0 : (Math.cos(Math.acos(distanceX / mag))) * nMag;
    direction.y = (mag === 0) ? 0 : (Math.sin(Math.asin(distanceY / mag))) * nMag;

    // console.log(`direction X: ${direction.x} direction Y: ${direction.y}`);

    // create a small circle to visualize direction
    var handleX = 0.5 + (r * direction.x);
    var handleY = 0.5 + (r * direction.y);
    this.$touchpadHandle.css({
      left: (handleX*100) + '%',
      top: (handleY*100) + '%'
    });

    var threshold = 0.1;
    var nx = MathUtil.lerp(1, -1, handleX);
    var ny = MathUtil.lerp(1, -1, handleY);

    if (Math.abs(nx) < threshold) nx = 0;
    if (Math.abs(ny) < threshold) ny = 0;

    this.moveDirectionX = nx;
    this.moveDirectionY = ny;
    this.isUsingTrackpad = true;
  };

  Controls.prototype.onTouchpadEnd = function(){
    this.$touchpad.removeClass('touching');
    this.$touchpadHandle.css({
      left: '50%',
      top: '50%'
    });
    this.moveDirectionX = 0;
    this.moveDirectionY = 0;
    this.isUsingTrackpad = false;
  };

  Controls.prototype.releaseAnchor = function(flyToLastPosition, onFinished){
    if (flyToLastPosition && this.lastPreOrbitPosition && this.lastPreOrbitLookAt) {
      var anchorToPosition = false;
      this.flyTo(this.lastPreOrbitPosition, this.lastPreOrbitLookAt, this.opt.zoomInTransitionDuration, anchorToPosition, onFinished);
    }
  };

  Controls.prototype.setAnchor = function(position){
    this.isOrbiting = false;
    if (position !== false) {
      this.isOrbiting = true;
      this.anchor = position.clone();
      this.orbit.radius = position.distanceTo(this.camera.position);
      var cameraPos = this.camera.position.clone();
      var pos = cameraPos.sub(this.anchor);
      this.orbit.theta = Math.acos(pos.z / this.orbit.radius);
      this.orbit.phi = Math.atan2(pos.y, pos.x);
      this.orbitPointerOrigin = this.npointer.clone();
    }
  };

  Controls.prototype.setBounds = function(bounds){
    this.opt.bounds = bounds;
  };

  Controls.prototype.setMode = function(mode){
    this.mode = mode;
  };

  Controls.prototype.update = function(now, delta){
    if (!this.loaded) return;

    // check if we're flying
    if (this.isFlying) {
      this.fly(now);
      if (this.cameraIsLocked) return;
    }

    // check if we're orbiting an object
    if (this.isOrbiting && !this.isFlying) {
      this.updateOrbit(now, delta);
      return;
    }

    // move camera direction based on pointer
    if (this.pointed !== false && delta > 0 && !this.cameraIsLocked) {
      this.updateLookPointer();
      var prevLat = this.lat;
      var prevLon = this.lon;

      var nx = MathUtil.norm(this.npointerLook.x, -1, 1);
      var ny = MathUtil.norm(this.npointerLook.y, -1, 1);
      this.lat = MathUtil.lerp(this.opt.latRange[0], this.opt.latRange[1], ny);
      this.lon = MathUtil.lerp(this.opt.lonRange[1], this.opt.lonRange[0], nx);

      // if (prevLat === this.lat && prevLon === this.lon && this.isAttached) return;

      //console.log(this.lat, this.lon, this.npointer.x, this.npointer.y);

      var phi = MathUtil.degToRad(90 - this.lat);
      var theta = MathUtil.degToRad(this.lon);

      var position = this.camera.position;
      var targetPosition = new THREE.Vector3();
      targetPosition.setFromSphericalCoords(1, phi, theta).add(position);
      this.camera.lookAt(targetPosition);
      this.lookAtPosition = targetPosition;
    }

    if (!this.isOrbiting && !this.isFlying) {
      this.updateAxis('X');
      this.updateAxis('Y');
    }

    renderNeeded = true;
  };

  Controls.prototype.updateAxis = function(axis){
    var moveDirection = this['moveDirection'+axis];
    var mode = this.mode;
    var bounds = this.opt.bounds;
    var acceleration = false;
    var fixedY = this.camera.position.y;

    // accelerate
    if (moveDirection !== 0 && Math.abs(this['velocity'+axis]) < this.opt.maxVelocity) {
      acceleration = this.opt.acceleration * moveDirection;
      this['velocity'+axis] += acceleration;

    // deccelerate
    } else if (moveDirection === 0 && Math.abs(this['velocity'+axis]) > 0) {
      var currentDirection = this['velocity'+axis] / Math.abs(this['velocity'+axis]);
      moveDirection = -currentDirection; // move in the opposite direction of the current velocity
      acceleration = this.opt.acceleration * moveDirection;
      this['velocity'+axis] += acceleration;

      if (currentDirection > 0) this['velocity'+axis] = Math.max(this['velocity'+axis], 0);
      else this['velocity'+axis] = Math.min(this['velocity'+axis], 0);
    }

    // move camera if velocity is non-zero
    if (this['velocity'+axis] > 0 || this['velocity'+axis] < 0) {
      if (axis == 'Y') {
        var newZ = this.camera.position.z + this['velocity'+axis];
        newZ = MathUtil.clamp(newZ, bounds[2], bounds[3]);
        var deltaZ = newZ - this.camera.position.z;
        if (mode==="firstPerson") this.camera.translateZ(-deltaZ);
        else this.camera.position.setZ(newZ);
        // console.log(newZ)
      } else {
        var newX = this.camera.position.x + this['velocity'+axis];
        newX = MathUtil.clamp(newX, bounds[0], bounds[1]);
        var deltaX = newX - this.camera.position.x;
        if (mode==="firstPerson") this.camera.translateX(-deltaX);
        else this.camera.position.setX(newX);
        // console.log(newX)
      }

      // enforce bounds for firstPerson since it moves the camera relative to self
      if (mode==="firstPerson") {
        if (this.camera.position.x < bounds[0]) this.camera.position.setX(bounds[0]);
        else if (this.camera.position.x > bounds[1]) this.camera.position.setX(bounds[1]);
        if (this.camera.position.z < bounds[2]) this.camera.position.setZ(bounds[2]);
        else if (this.camera.position.z > bounds[3]) this.camera.position.setZ(bounds[3]);
      }

      // constrain Y
      this.camera.position.setY(fixedY);

      renderNeeded = true;
    }
  };

  Controls.prototype.updateLookPointer = function(){
    var distance = this.npointerLook.distanceTo(this.npointer);
    if (distance <= 0) return;

    if (distance < 0.00001) {
      this.npointerLook.copy(this.npointer);
      return;
    }

    // have the look vector trail a little behind the cursor
    this.npointerLook.lerp(this.npointer, this.lookSpeed);
  };

  Controls.prototype.updateOrbit = function(now, delta){
    if (this.pointed === false || delta <= 0 || anchor === false) return;

    var anchor = this.anchor;
    var orbit = this.orbit;
    var camera = this.camera;

    var orbitLookSpeed = this.opt.orbitLookSpeed;
    var deltaTheta = (this.npointer.x-this.orbitPointerOrigin.x) * orbitLookSpeed;
    var deltaPhi = (this.npointer.y-this.orbitPointerOrigin.y) * orbitLookSpeed;
    var theta = this.orbit.theta - deltaTheta;
    var phi = this.orbit.phi - deltaPhi;
    var radius = this.orbit.radius;

    // Turn back into Cartesian coordinates
    var pos = new THREE.Vector3();
    pos.x = radius * Math.sin(theta) * Math.cos(phi);
    pos.y = radius * Math.sin(theta) * Math.sin(phi);
    pos.z = radius * Math.cos(theta);

    pos = pos.add(anchor);
    camera.position.copy(pos);
    camera.lookAt(anchor);
    this.lookAtPosition = anchor;
    renderNeeded = true;
  };

  return Controls;

})();
