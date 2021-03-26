'use strict';

var Sound = (function() {

  function Sound(config) {
    var defaults = {
      'audioPath': '../../audio/',
      'camera': false,
      'position': false,
      'listener': false
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Sound.prototype.init = function(){
    this.sounds = {};
    this.listener = this.opt.listener;
    if (!this.listener) console.log('Must pass in listener to sound');
  };

  Sound.prototype.onClickToggleAudio = function($button){
    $button.toggleClass('active');
    var isActive = $button.hasClass('active');
    var filename = $button.attr('data-src');
    if (isActive) this.playSoundFromFile(filename, true, $button);
    else this.pauseSoundFromFile(filename, true);
  };

  Sound.prototype.pauseSoundFromFile = function(filename){
    var _this = this;
    if (!this.listener) return;
    if (!_.has(this.sounds, filename)) return;

    var sound = this.sounds[filename];
    if (sound.loaded && sound.audio.isPlaying) {
      sound.audio.pause();
    }
  };

  Sound.prototype.playSoundFromFile = function(filename, isFullPath, $button){
    var _this = this;
    if (!this.listener) return;

    if (_.has(this.sounds, filename)) {
      var sound = this.sounds[filename];
      if (sound.loaded && !sound.audio.isPlaying) {
        sound.audio.play();
      }

    } else {
      var fullPath = filename;
      if (!isFullPath) fullPath = this.opt.audioPath + filename;

      // create a global audio source
      var sound = new THREE.Audio( this.listener );

      if ($button) {
        $button.addClass('active');
        sound.onEnded = function() {
          $button.removeClass('active');
        };
      }

      this.sounds[filename] = {
        audio: sound,
        loaded: false,
        '$button': $button
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
