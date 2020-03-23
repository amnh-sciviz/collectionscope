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

  };

  Collection.prototype.getTotalToLoad = function(){
    var totalToLoad = 1; // load metadata
    // load positions
    totalToLoad += _.keys(this.opt.positions).length;
    // load sets
    totalToLoad += _.keys(this.opt.sets).length;
    // load textures
    totalToLoad += _.reduce(this.opt.textures, function(memo, t){ return memo + t.assets.length; }, 0);
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

  Collection.prototype.loadMetadata = function(){
    var _this = this;
    this.metadata = {};
    var deferred = $.Deferred();
    $.getJSON(this.opt.metadata.src, function(data){
      _this.opt.onLoadProgress();
      _this.metadata = data;
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
        else _this.positions[key] = {'values': set.values};
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
        _this.positions[key] = {'values': data};
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
    this.sets = {};
    _.each(this.opt.sets, function(set, key){
      // check if indice data is set locally
      if (!set.src) {
        loaded++;
        _this.opt.onLoadProgress();
        if (!set.indices) console.log('Warning: '+key+' does not have any valid set data');
        else _this.sets[key] = {'values': set.indices};
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
        _this.sets[key] = {'values': data};
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

  };

  Collection.prototype.render = function(){

  };

  return Collection;

})();
