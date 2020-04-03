'use strict';

var Collection = (function() {

  function Collection(config) {
    var defaults = {
      'onLoadEnd': function(){ console.log('Loading finished'); },
      'onLoadProgress': function(){ console.log('Loading progress...') }
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Collection.prototype.init = function(){
    this.currentPositionsKey = 'default';
  };

  Collection.prototype.getThree = function(){
    return this.container;
  };

  Collection.prototype.getTotalToLoad = function(){
    var totalToLoad = 1; // load metadata
    // load positions
    totalToLoad += _.keys(this.opt.positions).length;
    // load sets
    totalToLoad += _.keys(this.opt.sets).length;
    // load textures
    totalToLoad += _.reduce(this.opt.textures, function(memo, t){ return memo + t.assets.length; }, 0);
    return totalToLoad;
  };

  Collection.prototype.load = function(){
    var _this = this;

    $.when(
      this.loadContent(),
      this.loadMetadata(),
      this.loadPositions(),
      this.loadSets(),
      this.loadTextures()

    ).done(function(){
      _this.onReady();
      _this.opt.onLoadEnd();
    });
  };

  Collection.prototype.loadContent = function(){
    var _this = this;
    var deferred = $.Deferred();
    this.content = this.opt.content;
    this.ui = this.opt.ui;
    console.log('Loaded content.');
    deferred.resolve();
    return deferred;
  };

  Collection.prototype.loadListeners = function(){
    var _this = this;

    $(document).on('change-positions', function(e, newValue) {
      console.log("Changing positions to "+newValue);
      _this.updatePositions(newValue);
    });
  };

  Collection.prototype.loadMetadata = function(){
    var _this = this;
    this.metadata = [];
    var deferred = $.Deferred();
    $.getJSON(this.opt.metadata.src, function(data){
      _this.opt.onLoadProgress();
      _this.metadata = _.map(data.rows, function(row){
        return _.object(data.cols, row);
      });
      console.log('Loaded metadata.');
      deferred.resolve();
    });
    return deferred;
  };

  Collection.prototype.loadPositions = function(){
    var _this = this;
    var deferred = $.Deferred();
    var loaded = 0;
    var totalToLoad = _.keys(this.opt.positions).length;
    this.positions = {};
    _.each(this.opt.positions, function(set, key){
      // check if data is set locally
      if (!set.src) {
        loaded++;
        _this.opt.onLoadProgress();
        if (!set.values) console.log('Warning: '+key+' does not have any valid position data');
        else _this.positions[key] = _.clone(set);
        if (loaded===totalToLoad) {
          console.log('Loaded all position data.');
          deferred.resolve();
        }
        return;
      }
      // otherwise, make a request
      $.getJSON(set.src, function(data){
        loaded++;
        _this.opt.onLoadProgress();
        _this.positions[key] = _.extend({}, set, {'values': data});
        if (loaded===totalToLoad) {
          console.log('Loaded all position data.');
          deferred.resolve();
        }
      });
    });
    return deferred;
  };

  Collection.prototype.loadSets = function(){
    var _this = this;
    var deferred = $.Deferred();
    var loaded = 0;
    var totalToLoad = _.keys(this.opt.sets).length;
    _.each(this.opt.sets, function(set, key){
      // check if indice data is set locally
      if (!set.src) {
        loaded++;
        _this.opt.onLoadProgress();
        if (!set.indices) console.log('Warning: '+key+' does not have any valid set data');
        else _this.opt.sets[key] = {'values': set.indices};
        if (loaded===totalToLoad) {
          console.log('Loaded all set data.');
          deferred.resolve();
        }
        return;
      }
      // otherwise, make a request
      $.getJSON(set.src, function(data){
        loaded++;
        _this.opt.onLoadProgress();
        _this.opt.sets[key] = {'values': data};
        if (loaded===totalToLoad) {
          console.log('Loaded all set data.');
          deferred.resolve();
        }
      });
    });
    return deferred;
  };

  Collection.prototype.loadTextures = function(){
    var _this = this;
    var deferred = $.Deferred();
    var loaded = 0;
    var totalToLoad = _.reduce(this.opt.textures, function(memo, t){ return memo + t.assets.length; }, 0);
    this.textures = this.opt.textures;
    _.each(this.opt.textures, function(t, key){
      var assets = [];
      _.each(t.assets, function(asset, i){
        var textureLoader = new THREE.TextureLoader();
        var texture = textureLoader.load(asset.src, function() {
          loaded++;
          _this.opt.onLoadProgress();
          if (loaded===totalToLoad) {
            console.log('Loaded all texture assets.');
            deferred.resolve();
          }
        });
        assets.push(texture);
      });
      _this.textures[key].assets = assets;
    });
    deferred.resolve();
    return deferred;
  };

  Collection.prototype.onReady = function(){
    var _this = this;
    var container = new THREE.Group();

    if (!_.has(this.opt.sets, 'default')) {
      this.opt.sets.default = {
        'values': _.range(_this.metadata.length)
      };
    }

    var sets = {};
    _.each(this.opt.sets, function(set, key){
      // if (key !== 'default') return;
      var setPositions = _this.positions[_this.currentPositionsKey];
      var setContent = _.has(_this.content, key) ? _this.content[key] : _this.content.default;
      var setTextures = _.has(_this.textures, key) ? _this.textures[key] : _this.textures.default;
      var set = new Set({
        'metadata': _this.metadata,
        'indices': set.values,
        'positions': setPositions,
        'content': setContent,
        'textures': setTextures
      });
      sets[key] = set;
      container.add(set.getThree());
    });
    this.sets = sets;
    this.container = container;

    this.loadListeners();
  };

  Collection.prototype.update = function(){
    _.each(this.sets, function(set, key){
      set.update();
    });
  };

  Collection.prototype.updatePositions = function(newValue){
    if (newValue === this.currentPositionsKey) return;

    var _this = this;
    var newPositions = this.positions[newValue];
    this.currentPositionsKey = newValue;

    _.each(this.sets, function(set){
      set.updatePositions(newPositions, _this.opt.ui.transitionDuration);
    })
  };

  return Collection;

})();
