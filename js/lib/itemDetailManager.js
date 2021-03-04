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

    // check to see if already loaded
    var foundIndex = _.indexOf(this.fileIndicesLoaded, fileIndex);

    if (foundIndex >= 0) {
      // move the index to the end of the buffer
      var temp = _.without(this.fileIndicesLoaded, foundIndex);
      temp.push(foundIndex);
      this.fileIndicesLoaded = temp;
      var fileData = this.filesLoaded[''+foundIndex];
      this.render(fileData[fileItemIndex]);
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
      this.render(data[fileItemIndex]);
    }

  };

  ItemDetailManager.prototype.render = function(item) {
    console.log('Render item: ', item);
  };

  ItemDetailManager.prototype.setRaycaster = function(raycaster){
    this.raycaster = raycaster;
  };

  ItemDetailManager.prototype.triggerSelectedItem = function(){
    if (this.highlightedItemIndex < 0) return false;

    this.loadItem(this.highlightedItemIndex);

    return this.highlightedItemIndex;
  };

  ItemDetailManager.prototype.update = function(now, pointer){
    this.raycaster && this.raycaster.update(pointer);
    this.highlightedItemIndex = this.raycaster.getActiveItemIndex();
  };

  return ItemDetailManager;

})();
