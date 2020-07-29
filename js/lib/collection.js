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
    this.listener = this.opt.listener;
    this.currentViewKey = 'random';
    this.minAlpha = this.opt.ui.minAlpha;

    this.content = this.opt.content;
    this.ui = this.opt.ui;

    var views = this.opt.views;
    _.each(views, function(view, key){
      views[key].key = key;
    })
    this.views = views;

    this.labelSets = {};
    this.overlays = {};
    this.soundSets = {};
  };

  Collection.prototype.deselectHotspots = function(){
    _.each(this.stories, function(story, contentKey){
      story.deselectHotspots();
    });
  };

  Collection.prototype.filter = function(prop, value){
    if (!this.metaCols || !this.metaCols.length || this.metaCols.indexOf(prop) < 0) {
      console.log("Invalid property "+prop);
      return;
    }

    if (value === "" || value === -1) value = false;

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

  Collection.prototype.getCurrentView = function(key){
    key = key || this.currentViewKey;
    var view = _.has(this.views, key) ? this.views[key] : this.views[_.first(_.keys(this.views))];
    return view;
  };

  Collection.prototype.getDefaultCameraPosition = function(key){
    key = key || this.currentViewKey;
    var view = this.views[key];

    if (!view || !_.has(view, 'cameraPosition')) {
      console.log('Warning: No camera position for '+key);
      return (new THREE.Vector3(0,0,0));
    }

    var p = view.cameraPosition;
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
    // load labels
    totalToLoad += _.keys(this.opt.labels).length;
    // load overlays
    totalToLoad += 1;
    // load sounds
    totalToLoad += _.keys(this.opt.sounds).length;
    return totalToLoad;
  };

  Collection.prototype.load = function(){
    var _this = this;

    this.loadContent();
    this.loadKeys();

    $.when(
      this.loadLabels(),
      this.loadMetadata(),
      this.loadOverlays(),
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
    var stories = {};
    var views = this.opt.views;

    var markerTexture = new THREE.TextureLoader().load("../../img/marker.png");

    _.each(this.content, function(content, contentKey){
      if (!content.html) return;
      var hotspots = {};
      _.each(views, function(view, viewKey){
        if (!view.hotspots) return;
        _.each(view.hotspots, function(hotspot, hotspotKey){
          if (hotspotKey == contentKey) {
            hotspots[viewKey] = _.extend({}, view, hotspot);
          }
        });
      });
      if (_.isEmpty(hotspots)) {
        console.log('No hotspots found for '+contentKey);
        return;
      }
      var story = new Story(_.extend({}, content, {'hotspots': hotspots, 'markerTexture': markerTexture}));
      stories[contentKey] = story;
    });

    this.stories = stories;
    console.log('Loaded content.');
  };

  Collection.prototype.loadKeys = function(){
    var _this = this;
    var keys = {};
    _.each(this.opt.keys, function(keyOptions, keyValue){
      var key = new Key(_.extend({}, keyOptions, {camera: _this.camera}));
      keys[keyValue] = key;
    });

    this.keys = keys;
  };

  Collection.prototype.loadLabels = function(){
    var _this = this;

    var fontFiles = {
      'default': LabelSet.defaultValues.fontDir + LabelSet.defaultValues.fontFile
    };
    _.each(this.opt.labels, function(set, key){
      if (_.has(set, 'fontFile') && set.fontFile != LabelSet.defaultValues.fontFile && !_.has(fontFiles, set.fontFile)) {
        fontFiles[set.fontFile] = LabelSet.defaultValues.fontDir + set.fontFile;
      }
    });
    var fontPromises = [];
    var loader = new THREE.FontLoader();
    _.each(fontFiles, function(fontPath, key){
      var deferred = $.Deferred();
      loader.load(fontPath, function(response) {
        console.log('Loaded '+fontPath);
        fontFiles[key] = response;
        deferred.resolve();
      });
      fontPromises.push(deferred);
    });

    var deferred = $.Deferred();
    var views = this.views;
    var labelSets = {};
    $.when.apply(null, fontPromises).done(function() {
      console.log('Loaded font files');

      var labelPromises = [];
      _.each(_this.opt.labels, function(set, key){
        var labelPromise = $.Deferred();
        // pass in width/height/depth of default view
        if (_.has(set, 'defaultView') && _.has(views, set.defaultView)) {
          set = _.extend({}, set, _.pick(views[set.defaultView], 'width', 'height', 'depth'));
        }
        // add the loaded font
        set.font = _.has(set, 'fontFile') ? fontFiles[set.fontFile] : fontFiles.default;
        // check if data is set locally
        if (!set.src) {
          _this.opt.onLoadProgress();
          if (!set.labels) {
            console.log('Warning: '+key+' does not have any valid label data');
            labelPromise.resolve();
            return;
          }
          var labelSet = new LabelSet(set);
          labelSet.load(labelPromise);
          labelSets[key] = labelSet;
          return;
        }
        // otherwise, make a request
        $.getJSON(set.src, function(values){
          _this.opt.onLoadProgress();
          var labelSet = new LabelSet(_.extend({}, set, {'values': values}));
          labelSet.load(labelPromise);
          labelSets[key] = labelSet;
        });
        labelPromises.push(labelPromise);
      });

      if (labelPromises.length < 1) labelPromises.resolve();
      else {
        $.when.apply(null, labelPromises).done(function() {
          console.log('Loaded labels');
          _this.labelSets = labelSets;
          deferred.resolve();
        });
      }
    });

    return deferred;
  };

  Collection.prototype.loadListeners = function(){
    var _this = this;

    $(document).on('change-view', function(e, newValue, duration) {
      console.log("Changing view to "+newValue);
      _this.updateView(newValue, duration);
    });

    $(document).on('filter-property', function(e, propertyName, newValue) {
      console.log('Filtering '+propertyName+' to '+newValue);
      _this.filter(propertyName, newValue);
    });

    $(document).on('select-hotspot', function(e, uuid){
      console.log('Select hotspot: '+uuid);
      _this.selectHotspot(uuid);
    });

    $(document).on('deselect-hotspots', function(e, value){
      console.log('Deselect hotspots');
      _this.deselectHotspots();
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

  Collection.prototype.loadOverlays = function(){
    var _this = this;
    var overlayPromises = [];
    var overlays = {};
    _.each(this.opt.overlays, function(options, key){
      var overlay = new Overlay(options);
      var deferred = overlay.load();
      overlays[key] = overlay;
      overlayPromises.push(deferred);
    });

    var deferred = $.Deferred();
    if (overlayPromises.length < 1) deferred.resolve();
    else {
      $.when.apply(null, overlayPromises).done(function() {
        _this.opt.onLoadProgress();
        console.log('Loaded overlays');
        _this.overlays = overlays;
        deferred.resolve();
      });
    }
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
    var views = this.views;

    _.each(this.opt.sounds, function(set, key){
      var deferred = $.Deferred();

      // pass in width/height/depth of default view
      if (_.has(set, 'defaultView') && _.has(views, set.defaultView)) {
        set = _.extend({}, set, _.pick(views[set.defaultView], 'width', 'height', 'depth'));
      }

      // check if data is set locally
      if (!set.src) {
        _this.opt.onLoadProgress();
        if (!set.sprites) {
          console.log('Warning: '+key+' does not have any valid sound data');
          deferred.resolve();
          return;
        }
        var soundSet = new SoundSet(_.extend(set, {'camera': _this.camera, 'listener': _this.listener}));
        soundSet.load(deferred);
        soundSets[key] = soundSet;
        return;
      }
      // otherwise, make a request
      $.getJSON(set.src, function(values){
        _this.opt.onLoadProgress();
        var soundSet = new SoundSet(_.extend({}, set, {'values': values, 'camera': _this.camera, 'listener': _this.listener}));
        soundSet.load(deferred);
        soundSets[key] = soundSet;
      });

      deferreds.push(deferred);
    });

    var deferred = $.Deferred();
    if (deferreds.length < 1) deferred.resolve();
    else {
      $.when.apply(null, deferreds).done(function() {
        console.log('Loaded sounds');
        _this.soundSets = soundSets;
        deferred.resolve();
      });
    }
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
        assets.push({src: asset.src, texture: texture});
      });
      _this.textures[key].assets = assets;
    });
    deferred.resolve();
    return deferred;
  };

  Collection.prototype.onFinishedStart = function(){
    // _.each(this.soundSets, function(soundSet, key){
    //   soundSet.active = true;
    // });
  };

  Collection.prototype.onReady = function(){
    var _this = this;
    var container = new THREE.Group();

    // default set is everything
    if (!_.has(this.opt.sets, 'default')) {
      this.opt.sets.default = {
        'values': _.range(_this.metadata.length)
      };
    }

    var currentView = this.views[this.currentViewKey];
    var sets = {};
    _.each(this.opt.sets, function(set, key){
      if (key !== 'default') return;
      var setPositions = _.extend({}, _.pick(currentView, 'width', 'height', 'depth'), _this.positions[currentView.layout]);
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

    _.each(this.overlays, function(overlay, key){
      container.add(overlay.getThree());
    });

    var hotspotGroup = new THREE.Group();
    _.each(this.stories, function(story, contentKey){
      story.updateView(_this.currentViewKey);
      _.each(story.hotspots, function(hotspot, viewKey){
        hotspotGroup.add(hotspot.object);
      });
    });
    container.add(hotspotGroup);
    this.hotspotGroup = hotspotGroup;

    this.container = container;

    this.loadListeners();
  };

  Collection.prototype.selectHotspot = function(uuid){
    _.each(this.stories, function(story, contentKey){
      story.selectHotspot(uuid);
    });
  };

  Collection.prototype.triggerSelectedHotspot = function(forceClose){
    var openedStory = false;
    var closedStory = false;

    _.each(this.stories, function(story, contentKey){
      // force everything to close
      if (forceClose && story.visible) {
        story.hide();
        if (closedStory === false) closedStory = story;
        return;
      }
      // show a story
      if (story.isSelected() & !story.visible) {
        story.show();
        if (openedStory === false) openedStory = story;
        return;
      }
      // hide a story
      if (!story.isSelected() && story.visible) {
        story.hide();
        if (closedStory === false) closedStory = story;
        return;
      }
    });

    if (openedStory !== false) {
      // apply filters
      // adjust positions
      // hide labels
      // hide overlays
      // hide ui
    } else if (closedStory !== false) {
      // show overlays
      // show labels
      // show ui
      // reset filters
    }

  };

  Collection.prototype.update = function(now){
    _.each(this.sets, function(set, key){
      set.update(now);
    });

    _.each(this.keys, function(key, keyValue){
      key.update(now);
    });

    _.each(this.labelSets, function(labelSet, key){
      labelSet.update(now);
    });

    _.each(this.overlays, function(overlay, key){
      overlay.update(now);
    });

    _.each(this.soundSets, function(soundSet){
      soundSet.update(now);
    });
  };

  Collection.prototype.updateAlpha = function(fromAlpha, toAlpha, transitionDuration){
    transitionDuration = transitionDuration || this.opt.ui.transitionDuration;

    var _this = this;
    _.each(this.sets, function(set){
      set.updateAlpha(fromAlpha, toAlpha, transitionDuration);
    })
  };

  Collection.prototype.updateView = function(newValue, transitionDuration){
    if (newValue === this.currentViewKey) return;
    transitionDuration = transitionDuration || this.opt.ui.transitionDuration;

    if (this.changeViewComponentsTimeout) clearTimeout(this.changeViewComponentsTimeout);

    var _this = this;
    var newView = this.views[newValue];
    var newPositions = this.positions[newView.layout];
    newPositions = _.extend({}, _.pick(newView, 'width', 'height', 'depth'), newPositions);
    this.currentViewKey = newValue;

    // update layout
    _.each(this.sets, function(set){
      set.updatePositions(newPositions, transitionDuration);
    });

    this.updateViewComponents(newView, this.opt.ui.componentTransitionDuration, true);

    // update components after finished changing positions to avoid overloading graphics
    this.changeViewComponentsTimeout = setTimeout(function(){
      _this.updateViewComponents(newView, _this.opt.ui.componentTransitionDuration, false);
    }, transitionDuration);

  };

  Collection.prototype.updateViewComponents = function(newView, transitionDuration, hide){
    // update keys
    var viewKeys = newView.keys ? newView.keys : [];
    _.each(this.keys, function(key, keyValue){
      if (hide && key.visible) {
        key.hide();
        return;
      } else if (hide) return;
      var valid = _.indexOf(viewKeys, keyValue) >= 0;
      if (valid && key.visible) return false;
      else if (valid) {
        key.setBounds(newView.bounds);
        key.show();
      } else key.hide();
    });

    // update labels
    var viewLabels = newView.labels ? newView.labels : [];
    _.each(this.labelSets, function(labelSet, key){
      if (hide && labelSet.visible) {
        labelSet.hide(transitionDuration);
        return;
      } else if (hide) return;
      var valid = _.indexOf(viewLabels, key) >= 0;
      if (valid && labelSet.visible) return false;
      else if (valid) labelSet.show(transitionDuration);
      else labelSet.hide(transitionDuration);
    });

    // update overlays
    var viewOverlays = newView.overlays ? newView.overlays : [];
    _.each(this.overlays, function(overlay, key){
      if (hide && overlay.visible) {
        overlay.hide(transitionDuration);
        return;
      } else if (hide) return;
      var valid = _.indexOf(viewOverlays, key) >= 0;
      if (valid && overlay.visible) return false;
      else if (valid) overlay.show(transitionDuration);
      else overlay.hide(transitionDuration);
    });

    // update sounds
    var viewSounds = newView.sounds ? newView.sounds : [];
    _.each(this.soundSets, function(soundSet, key){
      if (hide && soundSet.active) {
        soundSet.active = false;
        return;
      } else if (hide) return;
      var valid = _.indexOf(viewLabels, key) >= 0;
      if (valid) soundSet.active = true;
      else soundSet.active = false;
    });

    // update stories
    var viewContent = newView.content ? newView.content : [];
    _.each(this.stories, function(story, key){
      if (hide) {
        story.hide();
        story.hideHotspots();
        return;
      }
      var valid = _.indexOf(viewContent, key) >= 0;
      if (valid) {
        story.updateView(newView.key);
      } else {
        story.hide();
        story.hideHotspots();
      }
    });

    // TODO: update menus

    // TODO: update controls
  };

  return Collection;

})();
