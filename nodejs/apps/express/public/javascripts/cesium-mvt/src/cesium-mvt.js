'use strict';

import MvtImageryProvider from './MvtImageryProvider';
import createMapboxStreetsStyle from './mapbox-streets-style';
import MVT from 'ol/format/MVT';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';

const key = 'pk.eyJ1IjoibXV5YW8xOTg3IiwiYSI6ImNpcm9ueHd6cjAwNzZoa20xazY1aWlubjIifQ.5tLtC5j1rh8Eqjlyrq3OaA';
const viewer = new Cesium.Viewer('cesium-container', {
  animation: false,
  baseLayerPicker: false,
  homeButton: false,
  fullscreenButton: false,
  infoBox: false,
  timeline: false,
  navigationHelpButton: false,
  sceneModePicker: false,
  selectionIndicator: false,
  geocoder: false,
  automaticallyTrackDataSourceClocks: false,
  shadows: false,
  creditContainer: 'credit-container',
  imageryProvider: new MvtImageryProvider({
    url: 'https://{s}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v6/' +
    '{z}/{x}/{y}.vector.pbf?access_token=' + key,
    subdomains: ['a', 'b', 'c', 'd'],
    maximumLevel: 18,
    mvt: MVT,
    style: createMapboxStreetsStyle(Style, Fill, Stroke, Icon, Text),
  }),
});
viewer.scene.globe.baseColor = new Cesium.Color(1,1,1,1);



// const tileSet = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
//   url: '/public/3dtiles/tilesets/TilesetWithTreeBillboards/tileset.json'
//   // url: '/public/3dtiles/tilesets/TilesetWithRequestVolume/tileset.json'
//   // url: '/public/3dtiles/tilesets/TilesetWithDiscreteLOD/tileset.json'
// }));
//
// tileSet.readyPromise.then((tileset) => {
//   viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0, -0.3, 0));
// });