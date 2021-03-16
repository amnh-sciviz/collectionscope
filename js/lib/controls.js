'use strict';

var Controls = (function() {

  function Controls(config) {
    var defaults = {
      "el": "#app",
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
    this.opt = _.extend({}, defaults, config);
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
    this.isTouch = isTouchDevice();
    this.isXR = false;
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

    // for determining what the camera is looking at
    this.pointed = false;
    this.pointer = new THREE.Vector2();
    this.npointer = new THREE.Vector2();
    this.npointerLook = new THREE.Vector2(); // a vector that is delayed, follows npointer
    // this.pointerDelta = new THREE.Vector2();
    this.lat = 0;
    this.lon = 0;
    this.onResize();
  };

  Controls.prototype.centerPointer = function(){
    var x = this.$el.width() * 0.5;
    var y = this.$el.height() * 0.5;

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

  Controls.prototype.load = function(){
    this.loadListeners();
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
        // case 'ArrowUp': // arrow up
        case 'w': // w
          _this.moveDirectionY = 1;
          break;

        // case 'ArrowDown': // arrow down
        case 's': // s
          _this.moveDirectionY = -1;
          break;

        // case 'ArrowLeft': // arrow left
        case 'a': // a
          _this.moveDirectionX = 1;
          break;

        // case 'ArrowRight': // arrow right
        case 'd': // d
          _this.moveDirectionX = -1;
          break;

        default:
          break;
      }
    });

    $doc.keyup(function(e) {
      switch(e.which) {
        // case 38: // arrow up
        case 87: // w
        // case 40: // arrow down
        case 83: // s
          _this.moveDirectionY = 0;
          break;

        // case 37: // arrow left
        case 65: // a
        // case 39: // arrow right
        case 68: // d
          _this.moveDirectionX = 0;
          break;

        default:
          break;
      }
    });

    // $doc.on('mousedown', 'canvas', function(e) {
    //   if (isTouch) return;
    //   switch (e.which) {
    //     // left mouse
    //     case 1:
    //       _this.moveDirectionY = 1;
    //       break;
    //     // right mouse
    //     case 3:
    //       e.preventDefault();
    //       _this.moveDirectionY = -1;
    //       break;
    //     default:
    //       break;
    //   }
    // });
    // $doc.on('mouseup', 'canvas', function(e) {
    //   if (isTouch) return;
    //   _this.moveDirectionY = 0;
    // });

    $doc.on('contextmenu', 'canvas', function(e) {
      e.preventDefault();
    });

    $doc.on("mousemove", function(e){
      if (isTouch) return;
      _this.onPointChange(e.pageX, e.pageY);
    });

    $doc.on('click', 'canvas', function(e) {
      _this.onPointChange(e.pageX, e.pageY);
      $(document).trigger('canvas-click', [_this.pointer, _this.npointer]);
    });

    if (isTouch) {
      var el = this.$el[0];
      var mc = new Hammer(el);
      mc.get('pan').set({ direction: Hammer.DIRECTION_ALL });
      mc.on("panstart panmove press", function(e) {
        _this.onPointChange(e.center.x, e.center.y);
      });
      mc.on("panend pancancel pressup", function(e){
        _this.centerPointer();
      });
    }
  };

  Controls.prototype.normalizePointer = function(){
    var nx = this.pointer.x / window.innerWidth;
    var ny = this.pointer.y / window.innerHeight;
    this.npointer.x = nx * 2 - 1;
    this.npointer.y = -ny * 2 + 1;
  };

  Controls.prototype.onResize = function(){
    this.viewHalfX = window.innerWidth / 2;
    this.viewHalfY = window.innerHeight / 2;
  };

  Controls.prototype.onPointChange = function(x, y){
    this.pointed = true;
    // this.pointerDelta.x = x - this.pointer.x;
    // this.pointerDelta.y = y - this.pointer.y;
    this.pointer.x = x;
    this.pointer.y = y;
    this.normalizePointer();
  };

  Controls.prototype.releaseAnchor = function(flyToLastPosition){
    if (flyToLastPosition && this.lastPreOrbitPosition && this.lastPreOrbitLookAt) {
      var anchorToPosition = false;
      this.flyTo(this.lastPreOrbitPosition, this.lastPreOrbitLookAt, this.opt.zoomInTransitionDuration, anchorToPosition);
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

      if (prevLat === this.lat && prevLon === this.lon) return;

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
        newZ = MathUtil.clamp(newZ, this.opt.bounds[2], this.opt.bounds[3]);
        var deltaZ = newZ - this.camera.position.z;
        if (mode==="firstPerson") this.camera.translateZ(-deltaZ);
        else this.camera.position.setZ(newZ);
        // console.log(newZ)
      } else {
        var newX = this.camera.position.x + this['velocity'+axis];
        newX = MathUtil.clamp(newX, this.opt.bounds[0], this.opt.bounds[1]);
        var deltaX = newX - this.camera.position.x;
        if (mode==="firstPerson") this.camera.translateX(-deltaX);
        else this.camera.position.setX(newX);
        // console.log(newX)
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
    this.npointerLook.lerp(this.npointer, this.opt.lookSpeed);
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
