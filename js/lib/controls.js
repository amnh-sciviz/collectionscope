'use strict';

var Controls = (function() {

  function Controls(config) {
    var defaults = {
      "el": "#app"
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Controls.prototype.init = function(){
    this.$el = $(this.opt.el);
    this.orbitControls = new THREE.OrbitControls( this.opt.camera, this.opt.renderer.domElement );
    this.loadMenus();
    this.loadListeners();
    this.update();
  };

  Controls.prototype.loadListeners = function(){
    var _this = this;

    $('input[type="radio"]').on('change', function(e) {
      _this.onRadioMenuChange($(this));
    });
  };

  Controls.prototype.loadMenus = function(){
    var _this = this;

    _.each(this.opt.menus, function(menu){
      if (_.has(menu, 'radioButtons')) _this.loadRadioMenu(menu);
      else if (_.has(menu, 'slider')) _this.loadSliderMenu(menu);
    });
  };

  Controls.prototype.loadRadioMenu = function(options){
    var html = '';
    html += '<div id="'+options.id+'" class="'+options.className+' menu">';
      if (options.label) {
        html += '<h2>'+options.label+'</h2>';
      }
      html += '<form class="radio-button-form">';
      _.each(options.radioButtons, function(button, i){
        var id = button.name + (i+1);
        var checked = button.checked ? 'checked' : '';
        html += '<label for="'+id+'"><input id="'+id+'" type="radio" name="'+button.name+'" value="'+button.value+'" '+checked+' /> '+button.label+'</label>';
      });
      html += '</form>';
    html += '</div>';
    var $menu = $(html);
    this.$el.append($menu);
  };

  Controls.prototype.loadSliderMenu = function(options){

  };

  Controls.prototype.onRadioMenuChange = function($input){
    var name = $input.attr('name');
    var value = $input.val();
    // console.log('Triggering event "change-'+name+'" with value "'+value+'"');
    $(document).trigger('change-'+name, [value]);
  };

  Controls.prototype.update = function(){
    this.orbitControls.update();
  };

  return Controls;

})();
