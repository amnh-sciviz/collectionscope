'use strict';

var Sound = (function() {

  function Sound(config) {
    var defaults = {
      "audioPath": "../../audio/"
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Sound.prototype.init = function(){
    this.sounds = {};
    this.loadListeners();
  };

  Sound.prototype.loadListeners = function(){
    var _this = this;

    $(document).on('change-positions', function(e, newValue) {
      _this.playSound("sand.mp3");
    });
  };

  Sound.prototype.playSound = function(filename){
    var _this = this;

    if (_.has(this.sounds, filename)) {
      this.sounds[filename].play();
    } else {
      var fullPath = this.opt.audioPath + filename;
      this.sounds[filename] = new Howl({
        src: [fullPath],
        autoplay: true
      });
    }
  };

  return Sound;

})();
