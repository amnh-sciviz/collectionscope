'use strict';

var SoundSet = (function() {

  function SoundSet(config) {
    var defaults = {
      'audioPath': '../../audio/',
      'camera': false,
      'dimension': 2,
      'maxInstances': 4 // number of sounds that can be playing simulaneously
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  SoundSet.prototype.init = function(){
    var _this = this;
    this.controls = false;
    this.camera = this.opt.camera;
    this.filename = this.opt.audioPath + this.opt.filename;
    this.loaded = false;
    this.firstUpdate = true;
    this.dimension = this.opt.dimension;
    this.filterName = false;
    this.filterValue = false;
    this.active = false;

    var canvasWidth = this.opt.width;
    var canvasHeight = this.opt.height;
    var canvasDepth = this.opt.depth;
    this.sprites = _.map(this.opt.sprites, function(sprite, i){
      if (_.has(sprite, 'start')) sprite.start = sprite.start / 1000.0;
      else sprite.start = false;
      if (_.has(sprite, 'dur')) sprite.dur = sprite.dur / 1000.0;
      else sprite.dur = false;
      sprite.index = i;

      var p = sprite.position;
      var x = MathUtil.lerp(-canvasWidth/2, canvasWidth/2, p[0]);
      var y = MathUtil.lerp(canvasHeight/2, -canvasHeight/2, p[1]);
      var z = MathUtil.lerp(-canvasDepth/2, canvasDepth/2, p[2]);
      sprite.position = [x, y, z];

      return sprite;
    });
  };

  SoundSet.prototype.filter = function(name, value){
    console.log('Set filter: ', name, value);
    this.filterName = name;
    this.filterValue = value;
  };

  SoundSet.prototype.getAudioInstance = function(){
    var instances = _.sortBy(this.audioInstances, function(instance){ return instance.lastPlayedTime; });
    return instances[0];
  };

  SoundSet.prototype.load = function(){
    var _this = this;
    var deferred = $.Deferred();

    var listener = new THREE.AudioListener();
    this.camera.add(listener);

    var audioInstances = [];
    _.times(this.opt.maxInstances, function(i){
      // create a global audio source
      var audio = new THREE.Audio(listener);
      audioInstances.push({'audio': audio, 'lastPlayedTime': 0, 'index': i});
    });

    // load a sound and set it as the Audio object's buffer
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load(this.filename, function(buffer) {
      console.log('Loaded '+_this.filename);
      _.each(audioInstances, function(instance){
        instance.audio.setBuffer(buffer);
      });
      _this.loaded = true;
      _this.audioInstances = audioInstances;
      deferred.resolve();
    });

    return deferred;
  };

  SoundSet.prototype.playSprite = function(sprite, now){
    if (_.has(sprite, 'lastPlayedTime') && (now-sprite.lastPlayedTime) < 100) return;

    var instance = this.getAudioInstance();
    var audio = instance.audio;

    if (audio.isPlaying) audio.stop();

    if (sprite.start !== false) audio.offset = sprite.start;
    if (sprite.dur !== false) audio.duration = sprite.dur;
    if (sprite.dur === false) audio.setVolume(Math.random()*0.25);

    // HACK: disable click temporarily
    if (sprite.dur === false) return;

    audio.play(0.001);

    // sprite.region && console.log(sprite.region);

    this.audioInstances[instance.index].lastPlayedTime = now;
    this.sprites[sprite.index].lastPlayedTime = now;
  };

  SoundSet.prototype.update = function(now){
    if (!this.loaded || !this.active) return;

    if (this.firstUpdate) {
      this.prevCameraValue = this.camera.position.getComponent(this.dimension);
      this.firstUpdate = false;
      return;
    }

    var _this = this;
    var prevValue = this.prevCameraValue;
    var cameraValue = this.camera.position.getComponent(this.dimension);
    if (cameraValue === prevValue) return;
    var filterName = this.filterName;
    var filterValue = this.filterValue;

    _.each(this.sprites, function(sprite){
      var value = sprite.position[_this.dimension];

      // check for filter
      if (filterValue !== false && _.has(sprite, filterName) && sprite[filterName] !== filterValue) return;

      if (value > prevValue && value <= cameraValue || value > cameraValue && value <= prevValue) {
        _this.playSprite(sprite, now);
      }
    });

    this.prevCameraValue = cameraValue;
  };

  return SoundSet;

})();
