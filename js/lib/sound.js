'use strict';

var Sound = (function() {

  function Sound(config) {
    var defaults = {
      'audioPath': '../../audio/',
      'camera': false,
      'position': false
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Sound.prototype.init = function(){
    this.sounds = {};
    this.camera = this.opt.camera;
  };

  Sound.prototype.playSoundFromFile = function(filename){
    var _this = this;
    if (!this.camera) return;

    if (_.has(this.sounds, filename)) {
      var sound = this.sounds[filename];
      if (sound.loaded && !sound.audio.isPlaying) {
        sound.audio.play();
      }

    } else {
      var fullPath = this.opt.audioPath + filename;
      var listener = new THREE.AudioListener();
      _this.camera.add( listener );

      // create a global audio source
      var sound = new THREE.Audio( listener );
      _this.sounds[filename] = {
        audio: sound,
        loaded: false
      };

      // load a sound and set it as the Audio object's buffer
      var audioLoader = new THREE.AudioLoader();
      audioLoader.load(fullPath, function( buffer ) {
        sound.setBuffer( buffer );
        sound.play();
        _this.sounds[filename].loaded = true;
      });
    }
  };

  return Sound;

})();
