'use strict';

var SoundSet = (function() {

  function SoundSet(config) {
    var defaults = {
      'audioPath': '../../audio/',
      'camera': false,
      'maxInstances': 6 // number of sounds that can be playing simulaneously
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  SoundSet.prototype.init = function(){
    
  };

  return SoundSet;

})();
