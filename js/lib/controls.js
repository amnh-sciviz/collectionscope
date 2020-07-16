'use strict';

var Controls = (function() {

  function Controls(config) {
    var defaults = {
      "el": "#app",
      "maxVelocity": 20,
      "acceleration": 0.2,
      "bounds": [-32768, 32768],
      "lookSpeed": 0.05
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
    this.moveDirection = 0;
    this.velocity = 0;
    this.camera = this.opt.camera;
    this.loaded = false;

    // for determining what the camera is looking at
    this.pointerX = false;
    this.pointerY = false;
    this.lat = 0;
    this.lon = 0;
    this.onResize();
  };

  Controls.prototype.load = function(){
    this.loadMenus();
    this.loadListeners();
    this.loaded = true;
    this.update();
  };

  Controls.prototype.loadListeners = function(){
    var _this = this;
    var isTouch = this.isTouch;
    var $doc = $(document);

    $('input[type="radio"]').on('change', function(e) {
      _this.onRadioMenuChange($(this));
    });

    $('.move-button').each(function(){
      var el = $(this)[0];
      var direction = parseInt($(this).attr('data-direction'));

      var mc = new Hammer(el);
      mc.on("press", function(e) {
        _this.moveDirection = direction;
      });

      mc.on("pressup", function(e){
        _this.moveDirection = 0;
      });
    });

    $doc.keydown(function(e) {
      switch(e.which) {
        case 38: // arrow up
        case 87: // w
          _this.moveDirection = 1;
          break;

        case 40: // arrow down
        case 83: // s
          _this.moveDirection = -1;
          break;

        case 37: // arrow left
        case 65: // a
          _this.stepOption(-1);
          break;

        case 39: // arrow right
        case 68: // d
          _this.stepOption(1);
          break;

        default:
          break;
      }
    });

    $doc.keyup(function(e) {
      switch(e.which) {
        case 38: // arrow up
        case 87: // w
        case 40: // arrow down
        case 83: // s
          _this.moveDirection = 0;
          break;

        default:
          break;
      }
    });

    $doc.on('mousedown', 'canvas', function(e) {
      if (isTouch) return;
      switch (e.which) {
        // left mouse
        case 1:
          _this.moveDirection = 1;
          break;
        // right mouse
        case 3:
          e.preventDefault();
          _this.moveDirection = -1;
          break;
        default:
          break;
      }
    });

    $doc.on('contextmenu', 'canvas', function(e) {
      e.preventDefault();
    });

    $doc.on('mouseup', 'canvas', function(e) {
      if (isTouch) return;
      _this.moveDirection = 0;
    });

    $doc.on("mousemove", function(e){
      if (isTouch) return;
      _this.pointerX = e.pageX;
      _this.pointerY = e.pageY;
    });

    if (isTouch) {
      var el = this.$el[0];
      var mc = new Hammer(el);
      mc.on("panmove", function(e) {
        _this.pointerX = e.center.x;
        _this.pointerY = e.center.y;
      });
    }
  };

  Controls.prototype.loadMenus = function(){
    var _this = this;

    _.each(this.opt.menus, function(menu, i){
      if (_.has(menu, 'radioItems')) _this.loadRadioMenu(menu, i);
      else if (_.has(menu, 'slider')) _this.loadSliderMenu(menu, i);
    });
  };

  Controls.prototype.loadRadioMenu = function(options, index){
    var html = '';
    html += '<div id="'+options.id+'" class="'+options.className+' menu">';
      if (options.label) {
        html += '<h2>'+options.label+':</h2>';
      }
      html += '<form class="radio-button-form">';
      _.each(options.radioItems, function(item, i){
        var id = item.name + (i+1);
        var checked = item.checked ? 'checked' : '';
        html += '<label for="'+id+'"><input id="'+id+'" type="radio" name="'+item.name+'" value="'+item.value+'" data-type="'+options.parseType+'" '+checked+' /><div class="checked-bg"></div> <span>'+item.label+'</span></label>';
      });
      html += '</form>';
    html += '</div>';
    var $menu = $(html);

    // the first menu is the default menu
    if (index <= 0) {
      this.$primaryOptions = $menu.find('input[type="radio"]');
    }

    this.$el.append($menu);
  };

  Controls.prototype.loadSliderMenu = function(options){

  };

  Controls.prototype.onRadioMenuChange = function($input){
    var name = $input.attr('name');
    var value = $input.val();
    var parseType = $input.attr('data-type');

    if (parseType==='int') value = parseInt(value);
    else if (parseType==='float') value = parseFloat(value);

    value = [value];

    if (name.indexOf('filter-') === 0) {
      var parts = name.split('-', 2);
      name = 'filter-property';
      value.unshift(parts[1]);
    } else {
      name = 'change-'+name;
    }
    // console.log('Triggering event "change-'+name+'" with value "'+value+'"');
    $(document).trigger(name, value);
  };

  Controls.prototype.onResize = function(){
    this.viewHalfX = window.innerWidth / 2;
    this.viewHalfY = window.innerHeight / 2;
  };

  Controls.prototype.stepOption = function(step){
    if (!this.$primaryOptions || !this.$primaryOptions.length) return;

    var currentOptionIndex = this.$primaryOptions.index(this.$primaryOptions.filter(':checked')) + step;
    if (currentOptionIndex < 0) currentOptionIndex = this.$primaryOptions.length-1;
    else if (currentOptionIndex >= this.$primaryOptions.length) currentOptionIndex = 0;

    this.$primaryOptions.eq(currentOptionIndex).prop('checked', true);
    this.$primaryOptions.eq(currentOptionIndex).trigger('change');
  };

  Controls.prototype.update = function(now, delta){
    if (!this.loaded) return;

    var moveDirection = this.moveDirection;
    var acceleration = false;

    // accelerate
    if (moveDirection !== 0 && Math.abs(this.velocity) < this.opt.maxVelocity) {
      acceleration = this.opt.acceleration * moveDirection;
      this.velocity += acceleration;

    // deccelerate
    } else if (moveDirection === 0 && Math.abs(this.velocity) > 0) {
      var currentDirection = this.velocity / Math.abs(this.velocity);
      moveDirection = -currentDirection; // move in the opposite direction of the current velocity
      acceleration = this.opt.acceleration * moveDirection;
      this.velocity += acceleration;

      if (currentDirection > 0) this.velocity = Math.max(this.velocity, 0);
      else this.velocity = Math.min(this.velocity, 0);
    }

    // move camera if velocity is non-zero
    if (this.velocity > 0 || this.velocity < 0) {
      var newZ = this.camera.position.z + this.velocity;
      newZ = MathUtil.clamp(newZ, this.opt.bounds[0], this.opt.bounds[1]);
      this.camera.position.setZ(newZ);
      // console.log(newZ)
      renderNeeded = true;
    }

    // move camera direction based on pointer
    if (this.pointerX === false || this.pointerY === false || delta <= 0) return;

    var x = this.pointerX - this.viewHalfX;
    var y = this.pointerY - this.viewHalfY;
    var prevLat = this.lat;
    var prevLon = this.lon;
    var actualLookSpeed = delta * this.opt.lookSpeed;
    this.lon -= x * actualLookSpeed;
    this.lat -= y * actualLookSpeed;
    this.lat = Math.max( -85, Math.min( 85, this.lat ) );
    if (prevLat === this.lat && prevLon === this.lon) return;

    var phi = MathUtil.degToRad(90 - this.lat);
    var theta = MathUtil.degToRad(this.lon);

    var position = this.camera.position;
    var targetPosition = new THREE.Vector3();
    targetPosition.setFromSphericalCoords(1, phi, theta).add(position);
    this.camera.lookAt(targetPosition);
    renderNeeded = true;
  };

  return Controls;

})();
