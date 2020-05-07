'use strict';

import ReplayGroup from 'ol/render/canvas/ReplayGroup';
import { renderFeature } from 'ol/renderer/vector';
import { createForExtent } from 'ol/tilegrid';

import defined from 'cesium/Source/Core/defined';
import defineProperties from 'cesium/Source/Core/defineProperties';
import defaultValue from 'cesium/Source/Core/defaultValue';


function buildImageResource(imageryProvider, x, y, level, request) {

  const resource = imageryProvider._resource;
  const url = resource.getUrlComponent(true);
  const allTags = imageryProvider._tags;
  const templateValues = {};

  const match = url.match(/{[^}]+}/g);
  if (defined(match)) {
    match.forEach(function(tag) {
      const key = tag.substring(1, tag.length - 1); //strip {}
      if (defined(allTags[key])) {
        templateValues[key] = allTags[key](imageryProvider, x, y, level);
      }
    });
  }

  return resource.getDerivedResource({
    request: request,
    templateValues: templateValues
  });
}

const defaultCredit = new Cesium.Credit('&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/">Improve this map</a></strong>');

function MvtImageryProvider(options) {

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  let url = options.url;
  if (!url) {
    throw new Error('url is need by MvtImageryProvider');
  }
  this._url = url;


  this._tilesize = defaultValue(options.tilesize, 512);

  // const resource = Cesium.Resource.createIfNeeded(url);
  // resource.url = resource.getUrlComponent();
  // this._resource = resource;

  this._pixelRatio = 1;
  this._transform = [.125, 0, 0, .125, 0, 0];
  this._replays = ["Default", "Image", "Polygon", "LineString", "Text"];
  this._tileQueue = new Cesium.TileReplacementQueue();
  this._cacheSize = defaultValue(options.cacheSize, 1e3);
  let style = options.style;
  if (!style) {
    throw new Error('style function is need by MvtImageryProvider');
  }
  this._style = style;

  let mvt = options.mvt;
  if (!mvt) {
    throw new Error('Openlayers MVT parser is need by MvtImageryProvider');
  }
  this._mvtParser = new mvt();


  let credit;
  if (defined(options.credit)) {
    credit = options.credit;
    if (typeof credit === 'string') {
      credit = new Cesium.Credit(credit);
    }
  } else {
    credit = defaultCredit;
  }

  this._imageryProvider = new Cesium.UrlTemplateImageryProvider({
    url: url,
    credit: credit,
    ellipsoid: options.ellipsoid,
    minimumLevel: options.minimumLevel,
    maximumLevel: options.maximumLevel,
    rectangle: options.rectangle,
    subdomains: options.subdomains,
  });

  const a = this._imageryProvider.tilingScheme._rectangleSouthwestInMeters;
  const b = this._imageryProvider.tilingScheme._rectangleNortheastInMeters;
  const c = [a.x, a.y, b.x, b.y];
  this._resolutions = createForExtent(c, 22, this._tilesize);
}


defineProperties(MvtImageryProvider.prototype, {

  url : {
    get : function() {
      return this._url;
    }
  },

  ready : {
    get : function() {
      return this._imageryProvider.ready;
    }
  },

  readyPromise : {
    get : function() {
      return this._imageryProvider.readyPromise;
    }
  },

  rectangle: {
    get : function() {
      return this._imageryProvider.rectangle;
    }
  },

  tileWidth : {
    get : function() {
      return this._imageryProvider.tileWidth;
    }
  },

  tileHeight : {
    get : function() {
      return this._imageryProvider.tileHeight;
    }
  },

  maximumLevel : {
    get : function() {
      return this._imageryProvider.maximumLevel;
    }
  },

  minimumLevel : {
    get : function() {
      return this._imageryProvider.minimumLevel;
    }
  },

  tilingScheme : {
    get : function() {
      return this._imageryProvider.tilingScheme;
    }
  },

  tileDiscardPolicy : {
    get : function() {
      return this._imageryProvider.tileDiscardPolicy;
    }
  },

  errorEvent : {
    get : function() {
      return this._imageryProvider.errorEvent;
    }
  },

  credit : {
    get : function() {
      return this._imageryProvider.credit;
    }
  },

  proxy : {
    get : function() {
      return this._imageryProvider.proxy;
    }
  },

  hasAlphaChannel : {
    get : function() {
      return this._imageryProvider.hasAlphaChannel;
    }
  }
});


MvtImageryProvider.prototype.getTileCredits = function(x, y, level) {
};


MvtImageryProvider.prototype.requestImage = function(x, y, level, request) {
  // console.log(x, y, level);
  function reduce(queue, t) {
    let prev = t.replacementPrevious
      , next = t.replacementNext;
    t === queue._lastBeforeStartOfFrame && (queue._lastBeforeStartOfFrame = next);
      t === queue.head ? queue.head = next : prev.replacementNext = next;
      t === queue.tail ? queue.tail = prev : next.replacementPrevious = prev;
      t.replacementPrevious = void 0;
      t.replacementNext = void 0;
      --queue.count;
  }
  const that = this;
  const head = function(x, y, level, queue) {
    let head = queue.head;
    for (; null != head && (head.xMvt != x || head.yMvt != y || head.zMvt != level); ) {
      head = head.replacementNext;
    }
    return head
  }(x, y, level, that._tileQueue);
  if (null != head) {
    return head;
  }
  const imageResource = buildImageResource(that._imageryProvider, x, y, level, request);
  const url = imageResource.url;
  // console.log(url);
  return Cesium.Resource.createIfNeeded(url).fetchArrayBuffer().then((e) => {
    const canvas = document.createElement('canvas');
    canvas.width = that._tilesize;
    canvas.height = that._tilesize;
    const context2d = canvas.getContext('2d');
    const features = that._mvtParser.readFeatures(e, {});
    let replayGroup = new ReplayGroup(0, [0, 0, 4096, 4096], 8, !0, 100);
    const styleFunc = that._style;
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const styles = styleFunc(feature, that._resolutions.getResolution(level));
      for (let j = 0; j < styles.length; j++) {
        const style = styles[j];
        renderFeature(replayGroup, feature, style, 16);
      }
    }
    replayGroup.finish();
    replayGroup.replay(context2d, that._transform, 0, {}, true, that._replays);
    that._tileQueue.count > that._cacheSize && function (queue, t) {
      let tail = queue.tail;
      for (; queue.count > t && Cesium.defined(tail); ) {
        let tailPrev = tail.replacementPrevious;
        reduce(queue, tail);
        tail = null;
        tail = tailPrev;
      }
    }(that._tileQueue, that._cacheSize / 2);
    canvas.xMvt = x;
    canvas.yMvt = y;
    canvas.zMvt = level;
    that._tileQueue.markTileRendered(canvas);
    replayGroup = null;
    return canvas;
  }).otherwise((e) => {});
};

MvtImageryProvider.prototype.pickFeatures = function(x, y, level, longitude, latitude) {
  // return this._imageryProvider.pickFeatures(x, y, level, longitude, latitude);
};

MvtImageryProvider._defaultCredit = defaultCredit;


export default MvtImageryProvider;