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
      if (_.has(menu, 'radioItems')) _this.loadRadioMenu(menu);
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
      _.each(options.radioItems, function(item, i){
        var id = item.name + (i+1);
        var checked = item.checked ? 'checked' : '';
        html += '<label for="'+id+'"><input id="'+id+'" type="radio" name="'+item.name+'" value="'+item.value+'" '+checked+' /> '+item.label+'</label>';
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
    var value = [$input.val()];

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

  Controls.prototype.update = function(now){
    this.orbitControls.update();
  };

  return Controls;

})();
