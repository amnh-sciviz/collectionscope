'use strict';

var Guide = (function() {

  function Guide(config) {
    var defaults = {
      el: '#guide-container',
      steps: []
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  Guide.prototype.init = function(){
    this.isActive = false;

    if (!this.opt.steps.length) return;

    this.$el = $(this.opt.el);
    this.$prev = this.$el.find('.guide-prev');
    this.$next = this.$el.find('.guide-next');
    this.currentStepIndex = 0;
    this.loadUI();
  };

  Guide.prototype.close = function(){
    this.$el.removeClass('active');
  };

  Guide.prototype.loadUI = function(){
    var _this = this;

    var html = '<div class="guide-steps">';
    _.each(this.opt.steps, function(step, i){
      var className = 'guide-step';
      if (i===_this.currentStepIndex) className += ' active';
      html += '<div class="'+className+'" data-index="'+i+'">'
        if (step.text) html += '<p>' + step.text + '</p>';
        else if (step.html) html += step.html;
      html += '</div>'; // end .guide-step
    });
    html += '</div>';

    this.$el.prepend($(html));
  };

  Guide.prototype.slide = function(){
    var count = this.opt.steps.length;
    if (this.currentStepIndex < 0) this.currentStepIndex = 0;
    if (this.currentStepIndex >= count) this.currentStepIndex = count - 1;

    var index = this.currentStepIndex;

    $('.guide-step').removeClass('active');
    $('.guide-step[data-index="'+index+'"]').addClass('active');

    if (index === 0) this.$prev.removeClass('active');
    else this.$prev.addClass('active');

    if (index === (count-1)) this.$next.removeClass('active');
    else this.$next.addClass('active');

    var step = this.opt.steps[index];

    // close if the last slide and there's no text
    if (index === (count-1) && !step.text && !step.html) this.close();

    // check for view change
    if (step.changeLayout) {
      var onFinished = function(){
        $(document).trigger('change-view', [step.changeLayout]);
      };
      // deselect item first
      $(document).trigger('deselect-item', [onFinished])
    }

    // check for camera change
    if (step.moveToLocation) {
      var position = new THREE.Vector3(step.moveToLocation.x, step.moveToLocation.y, step.moveToLocation.z)
      $(document).trigger('jump-to-location', [position]);

    // move based on time
    } else if (step.moveToTime) {
      $(document).trigger('jump-to-time', [step.moveToTime]);

    // open story
    } else if (step.showStory) {
      $(document).trigger('jump-to-story', [step.showStory]);
    }
  };

  Guide.prototype.slideNext = function(){
    this.currentStepIndex += 1;
    this.slide();
  };

  Guide.prototype.slidePrev = function(){
    this.currentStepIndex -= 1;
    this.slide();
  };

  Guide.prototype.start = function(){
    this.$el.addClass('active');
    this.currentStepIndex = 0;
    this.slide();
  };

  return Guide;

})();
