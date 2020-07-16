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
    this.camera = this.opt.camera;
    this.currentPositionsKey = 'start';
    this.minAlpha = this.opt.ui.minAlpha;
  };

  Collection.prototype.filter = function(prop, value){
    if (!this.metaCols || !this.metaCols.length || this.metaCols.indexOf(prop) < 0) {
      console.log("Invalid property "+prop);
      return;
    }

    if (value === "" || value === -1) value = false;

    _.each(this.soundSets, function(sets, key){
      _.each(sets, function(soundSet){
        soundSet.filter(prop, value);
      })
    });

    // reset alpha
    if (value === false) {
      this.updateAlpha(false, 1.0);
      return;
    }

    var _this = this;
    var toAlphaValues = new Float32Array(this.metadata.length);
    _.each(this.metadata, function(item, i){
      if (item[prop] === value) {
        toAlphaValues[i] = 1.0;
      } else {
        toAlphaValues[i] = _this.minAlpha;
      }
    });
    this.updateAlpha(false, toAlphaValues);
  };

  Collection.prototype.getDefaultCameraPosition = function(){
    var pos = this.positions[this.currentPositionsKey];

    if (!pos || !_.has(pos, 'cameraPosition')) {
      return (new THREE.Vector3(0,0,0));
    }

    var p = pos.cameraPosition;
    return (new THREE.Vector3(p[0], p[1], p[2]));
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
      this.loadLabels(),
      this.loadMetadata(),
      this.loadPositions(),
      this.loadSets(),
      this.loadSounds(),
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

  Collection.prototype.loadLabels = function(){
    var deferreds = [];
    var labelSets = {};

    _.each(this.opt.positions, function(set, key){
      if (_.has(set, 'labels')) {
        var labelSet = new LabelSet(set);
        deferreds.push(labelSet.load());
        labelSets[key] = labelSet;
      }
    });
    this.labelSets = labelSets;

    var deferred = $.Deferred();
    if (deferreds.length < 1) deferred.resolve();
    else {
      $.when.apply(null, deferreds).done(function() {
        console.log('Loaded labels');
        deferred.resolve();
      });
    }

    return deferred;
  };

  Collection.prototype.loadListeners = function(){
    var _this = this;

    $(document).on('change-positions', function(e, newValue, duration) {
      console.log("Changing positions to "+newValue);
      _this.updatePositions(newValue, duration);
    });

    $(document).on('filter-property', function(e, propertyName, newValue) {
      console.log('Filtering '+propertyName+' to '+newValue);
      _this.filter(propertyName, newValue);
    });
  };

  Collection.prototype.loadMetadata = function(){
    var _this = this;
    this.metadata = [];
    var deferred = $.Deferred();
    $.getJSON(this.opt.metadata.src, function(data){
      _this.metaCols = data.cols;
      _this.opt.onLoadProgress();
      _this.metadata = _.map(data.rows, function(row){
        return _.object(data.cols, row);
      });
      console.log('Loaded metadata: '+_this.metadata.length);
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
        if (!set.values) console.log('Warning: '+key+' does not have any valid position data; will generate them randomly');
        _this.positions[key] = _.clone(set);
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

  Collection.prototype.loadSounds = function(){
    var _this = this;
    var deferreds = [];
    var soundSets = {};

    _.each(this.opt.positions, function(set, key){
      if (_.has(set, 'soundSets')) {
        var sets = [];
        _.each(set.soundSets, function(soundSetOptions){
          var soundSet = new SoundSet(_.extend({}, {'width': set.width, 'height': set.height, 'depth': set.depth}, soundSetOptions, {'camera': _this.camera}));
          deferreds.push(soundSet.load());
          sets.push(soundSet);
        });
        soundSets[key] = sets;
      }
    });
    this.soundSets = soundSets;

    var deferred = $.Deferred();
    if (deferreds.length < 1) deferred.resolve();
    else {
      $.when.apply(null, deferreds).done(function() {
        console.log('Loaded sounds');
        deferred.resolve();
      });
    }

    return deferred;
  },

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
        assets.push({src: asset.src, texture: texture});
      });
      _this.textures[key].assets = assets;
    });
    deferred.resolve();
    return deferred;
  };

  Collection.prototype.onFinishedStart = function(){
    _.each(this.soundSets, function(sets, key){
      _.each(sets, function(soundSet){
        soundSet.active = true;
      })
    });
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
      if (key !== 'default') return;
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

    _.each(this.labelSets, function(labelSet, key){
      container.add(labelSet.getThree());
    });

    this.container = container;

    this.loadListeners();
  };

  Collection.prototype.update = function(now){
    _.each(this.sets, function(set, key){
      set.update(now);
    });

    _.each(this.labelSets, function(labelSet, key){
      labelSet.update(now);
    });

    var currentPositionsKey = this.currentPositionsKey;
    _.each(this.soundSets, function(sets, key){
      if (key !== currentPositionsKey) return;
      _.each(sets, function(soundSet){
        soundSet.update(now);
      })
    });
  };

  Collection.prototype.updateAlpha = function(fromAlpha, toAlpha, transitionDuration){
    transitionDuration = transitionDuration || this.opt.ui.transitionDuration;

    var _this = this;
    _.each(this.sets, function(set){
      set.updateAlpha(fromAlpha, toAlpha, transitionDuration);
    })
  };

  Collection.prototype.updatePositions = function(newValue, transitionDuration){
    if (newValue === this.currentPositionsKey) return;
    transitionDuration = transitionDuration || this.opt.ui.transitionDuration;

    var _this = this;
    var newPositions = this.positions[newValue];
    this.currentPositionsKey = newValue;

    _.each(this.sets, function(set){
      set.updatePositions(newPositions, transitionDuration);
    });

    if (_.has(this.labelSets, newValue)) {
      _.each(this.labelSets, function(labelSet, key){
        if (key===newValue && labelSet.visible) return false;
        else if (key===newValue) labelSet.show(transitionDuration);
        else labelSet.hide(transitionDuration);
      });
    }
  };

  return Collection;

})();
