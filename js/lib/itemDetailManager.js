'use strict';

var ItemDetailManager = (function() {

  function ItemDetailManager(config) {
    var defaults = {
      itemCount: 0,
      itemsPerFile: 1,
      itemsPath: "data/metadata/",
      throttleTime: 250, // wait this much time between a new request
      bufferLength: 100 // store this many files in memory
    };
    this.opt = _.extend({}, defaults, config);
    this.init();
  }

  ItemDetailManager.prototype.init = function(){
    this.filesLoaded = {};
    this.fileIndicesLoaded = [];
    this.itemIndex = -1;
    this.highlightedItemIndex = -1;
    this.raycaster = false;
    this.itemPositions = [];

    this.$container = $('#item-container');
    this.$mediaContainer = $('#item-media-container');
    this.$img = $('#item-image');
    this.$title = $('#item-title');
    this.$metadataContainer = $('#item-metadata-container');
    this.$metadata = $('#item-metadata');
  };

  ItemDetailManager.prototype.hide = function(transitionDuration){
    this.raycaster && this.raycaster.hide(transitionDuration);
  };

  ItemDetailManager.prototype.loadItem = function(itemIndex){
    if (itemIndex < 0 || itemIndex >= this.opt.itemCount) return;

    var _this = this;
    var fileIndex = Math.floor(itemIndex / this.opt.itemsPerFile);
    var fileItemIndex = itemIndex % this.opt.itemsPerFile;
    var fileUrl = this.opt.itemsPath + fileIndex + ".json";
    this.itemIndex = itemIndex;
    this.raycaster.activeObjectIndex = itemIndex;
    this.imagePromise = $.Deferred();

    // check to see if already loaded
    var foundIndex = _.indexOf(this.fileIndicesLoaded, fileIndex);

    if (foundIndex >= 0 && _.has(this.filesLoaded, ''+foundIndex)) {
      // move the index to the end of the buffer
      var temp = _.without(this.fileIndicesLoaded, foundIndex);
      temp.push(foundIndex);
      this.fileIndicesLoaded = temp;
      var fileData = this.filesLoaded[''+foundIndex];
      this.render(fileData[fileItemIndex], itemIndex);
      return;
    }

    this.loadingOn();
    $.getJSON(fileUrl, function(data){
      _this.onFileLoaded(itemIndex, fileItemIndex, fileIndex, data);
    });
  };

  ItemDetailManager.prototype.loadingOff = function(){};

  ItemDetailManager.prototype.loadingOn = function(){};

  ItemDetailManager.prototype.onFileLoaded = function(itemIndex, fileItemIndex, fileIndex, data) {

    this.filesLoaded[''+fileIndex] = data;
    this.fileIndicesLoaded.push(fileIndex);

    // if buffer is full, remove the first index
    if (this.fileIndicesLoaded.length > this.opt.bufferLength) {
      var firstIndex = this.fileIndicesLoaded.shift();
      this.filesLoaded = _.omit(this.filesLoaded, ''+firstIndex);
    }

    if (itemIndex === this.itemIndex) {
      this.loadingOff();
      this.render(data[fileItemIndex], itemIndex);
    }

  };

  ItemDetailManager.prototype.onFlyFinished = function(itemIndex){
    if (itemIndex !== this.itemIndex) return;

    var _this = this;
    var promise = $.Deferred();
    $.when(this.imagePromise).done(function() {
      var w = _this.$img.width();
      var h = _this.$img.height();
      if (w > h) {
        var ch = _this.$container.height();
        var marginTop = (ch - h) * 0.5;
        _this.$img.css('margin-top', marginTop+'px');
      } else {
        _this.$img.css('margin-top', '0px');
      }
      _this.$container.addClass('active');
      promise.resolve();
    });
    return promise;
  };

  ItemDetailManager.prototype.onImageLoaded = function(){
    this.imagePromise.resolve();
  };

  ItemDetailManager.prototype.releaseSelectedItem = function(){
    var releasedItemIndex = this.itemIndex;
    this.itemIndex = -1;
    this.raycaster.activeObjectIndex = -1;
    this.$container.removeClass('active');
    return releasedItemIndex;
  };

  ItemDetailManager.prototype.render = function(item, itemIndex) {
    var _this = this;
    var $img = this.$img;
    var $metadata = this.$metadata;

    var title = _.findWhere(item, {isTitle: true});
    var image = _.findWhere(item, {isImage: true});
    var description = _.findWhere(item, {isDescription: true});
    var audio = _.findWhere(item, {isAudio: true});
    var object = _.findWhere(item, {isObject: true});
    var image = _.findWhere(item, {isImage: true});

    var links = _.filter(item, {isLink: true});
    var fields = _.reject(item, function(item){ return (item.isTitle || item.isImage || item.isLink || item.isDescription || item.isAudio || item.isObject); });

    // check for audio
    if (audio) {
      this.$mediaContainer.addClass('has-audio');
      this.$mediaContainer.find('.toggle-audio').attr('data-src', audio.value);
    } else {
      this.$mediaContainer.removeClass('has-audio');
    }

    // check for 3D object
    if (object) {
      this.$mediaContainer.addClass('has-object');
      this.$mediaContainer.find('.item-object').attr('src', 'viewer.html?obj='+object.value);
    } else {
      this.$mediaContainer.removeClass('has-object');
    }

    if (title) {
      var titleHtml = '<h2>' + title.value + '</h2>';
      this.$title.html(titleHtml);
      this.$title.addClass('active');
    } else {
      this.$title.removeClass('active');
    }

    var html = '';

    // if (description) {
    //   if (description.isHTML) html += description.value;
    //   else html += '<p>'+description.value+'</p>';
    // }

    html += '<dl>';
    _.each(fields, function(field){
      html += '<div>';
        html += '<dt>' + field.label + ': </dt>';
        html += '<dd>' + field.value + '</dd>';
      html += '</div>';
    });
    html += '</dl>';
    if (links.length > 0) {
      html += '<div class="button-group">';
        _.each(links, function(link){
          html += '<a href="'+link.value+'" target="_blank" class="button inverse">'+link.label+'</a>';
        });
      html += '</div>';
    }
    $metadata.html(html);

    if (image) {
      var img = $img[0];
      img.src = image.value;
      if (img.complete) {
        this.onImageLoaded(itemIndex);
      } else {
        img.addEventListener('load', function(){
          _this.onImageLoaded(itemIndex);
        });
      }
    }
  };

  ItemDetailManager.prototype.setRaycaster = function(raycaster){
    this.raycaster = raycaster;
  };

  ItemDetailManager.prototype.triggerItem = function(itemIndex){
    this.highlightedItemIndex = itemIndex;

    this.$container.removeClass('active');
    this.loadItem(this.highlightedItemIndex);

    return this.highlightedItemIndex;
  };

  ItemDetailManager.prototype.triggerSelectedItem = function(){
    if (this.highlightedItemIndex < 0 || this.highlightedItemIndex===this.itemIndex) return false;

    this.$container.removeClass('active');
    this.loadItem(this.highlightedItemIndex);

    return this.highlightedItemIndex;
  };

  ItemDetailManager.prototype.update = function(now, pointer){
    this.raycaster && this.raycaster.update(pointer);
    this.highlightedItemIndex = this.raycaster.getActiveItemIndex();
  };

  ItemDetailManager.prototype.updatePositions = function(positionArr, transitionDuration){
    this.itemPositions = positionArr;
  };

  return ItemDetailManager;

})();
