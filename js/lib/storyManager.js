'use strict';

var StoryManager = (function() {

  function StoryManager(config) {
    var defaults = {
      stories: {}
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  StoryManager.prototype.init = function(){
    this.hotspotSelected = false;
    this.raycaster = new THREE.Raycaster();

    this.loadStories();
    this.loadListeners();
  };

  StoryManager.prototype.deselectHotspots = function(){
    console.log('Deselect hotspots');
    _.each(this.stories, function(story, contentKey){
      story.deselectHotspot();
    });
  };

  StoryManager.prototype.goToSlide = function(slideIndex, $story){
    var slideCount = parseInt($story.attr('data-count'));
    slideIndex = MathUtil.clamp(slideIndex, 0, slideCount-1);

    $story.attr('data-index', slideIndex);

    $story.find('.slide').removeClass('active');
    $story.find('.slide-nav-button').removeClass('active');
    $story.find('.slide[data-index="'+slideIndex+'"]').addClass('active');
    $story.find('.slide-nav-button[data-index="'+slideIndex+'"]').addClass('active');

    if ($story.find('.media-slides .slide.active').hasClass('has-content')) $story.addClass('has-media');
    else $story.removeClass('has-media');

    if (slideIndex === 0) $story.find('.slide-prev').removeClass('active');
    else $story.find('.slide-prev').addClass('active');

    if (slideIndex >= slideCount-1) {
      $story.find('.slide-next').removeClass('active');
      $story.find('.slide-finish').addClass('active');
    } else {
      $story.find('.slide-next').addClass('active');
      $story.find('.slide-finish').removeClass('active');
    }
  };

  StoryManager.prototype.hasOpenStory = function(){
    var foundStory = _.find(this.stories, function(story){ return story.visible; });
    return (foundStory !== undefined);
  };

  StoryManager.prototype.loadListeners = function(){
    var _this = this;

    $(document).on('select-hotspot', function(e, uuid){

      _this.selectHotspot(uuid);
    });
  };

  StoryManager.prototype.loadStories = function(){
    var _this = this;
    var stories = {};

    var markerTexture = new THREE.TextureLoader().load("../../img/indicator_star.png");
    var hotspots = [];

    _.each(this.opt.stories, function(content, contentKey){
      if (!content.hotspotItemIndex) return;
      var story = new Story(_.extend({}, content, {'markerTexture': markerTexture}));
      stories[contentKey] = story;
      hotspots.push(story.hotspot.object);
    });

    this.stories = stories;
    this.hotspots = hotspots;
    console.log('Loaded stories.');
  };

  StoryManager.prototype.onClickNavButton = function($button){
    var slideIndex = parseInt($button.attr('data-index'));
    this.goToSlide(slideIndex, $button.closest('.story'));
  };

  StoryManager.prototype.onClickNextButton = function($button){
    var $story = $button.closest('.story');
    var slideIndex = parseInt($story.attr('data-index')) + 1;
    this.goToSlide(slideIndex, $story);
  };

  StoryManager.prototype.onClickPrevButton = function($button){
    var $story = $button.closest('.story');
    var slideIndex = parseInt($story.attr('data-index')) - 1;
    this.goToSlide(slideIndex, $story);
  };

  StoryManager.prototype.selectHotspot = function(uuid){
    console.log('Select hotspot: '+uuid);
    _.each(this.stories, function(story, contentKey){
      story.selectHotspot(uuid);
    });
  };

  StoryManager.prototype.triggerSelectedHotspot = function(forceClose){
    var _this = this;
    var openedStoryKey = false;
    var closedStoryKey = false;

    _.each(this.stories, function(story, contentKey){
      // force everything to close
      if (forceClose && story.visible) {
        story.hide();
        if (closedStoryKey === false) closedStoryKey = contentKey;
        return;
      }
      // show a story
      if (story.isSelected & !story.visible) {
        story.show();
        if (openedStoryKey === false) openedStoryKey = contentKey;
        return;
      }
      // hide a story
      if (!story.isSelected && story.visible) {
        story.hide();
        if (closedStoryKey === false) closedStoryKey = contentKey;
        return;
      }
    });

    return {
      openedStoryKey: openedStoryKey,
      closedStoryKey: closedStoryKey
    };

  };

  StoryManager.prototype.update = function(now, pointer, camera){
    this.updateHotspots(pointer, camera);

    _.each(this.stories, function(story){
      story.update(now);
    });
  };

  StoryManager.prototype.updateHotspots = function(pointer, camera){
    var _this = this;
    var activeHotspot = _.find(this.hotspots, function(hotspot){ return hotspot.visible; });

    if (!activeHotspot) {
      if (this.hotspotSelected !== false) {
        this.hotspotSelected = false;
        this.deselectHotspots();
      }
      return;
    }

    // https://threejs.org/docs/#api/en/core/Raycaster
    // update the picking ray with the camera and mouse position
    this.raycaster.setFromCamera(pointer, camera);
    var intersects = this.raycaster.intersectObjects(this.hotspots);

    if (intersects.length < 1) {
      if (this.hotspotSelected !== false) {
        this.hotspotSelected = false;
        this.deselectHotspots();
      }
      return;
    }

    var match = intersects[0];
    if (intersects.length > 1) {
      var sorted = _.sortBy(intersects, function(entry){ return entry.object.position.distanceTo(camera.position); });
      match = sorted[0];
    }

    if (match.object.uuid !== this.hotspotSelected) {
      this.hotspotSelected = match.object.uuid;
      this.selectHotspot(match.object.uuid);
    }
  };

  StoryManager.prototype.updatePositions = function(positionArr, transitionDuration){
    _.each(this.stories, function(story, key){
      story.updatePositions(positionArr, transitionDuration);
    });
  };

  StoryManager.prototype.updateView = function(viewKey){
    _.each(this.stories, function(story, key){
      story.updateView(viewKey);
    });
  };

  return StoryManager;

})();
