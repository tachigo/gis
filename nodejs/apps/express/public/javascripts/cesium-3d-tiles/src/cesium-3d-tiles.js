'use strict';


const viewer = new Cesium.Viewer('cesium-container', {
  creditContainer: 'credit-container',
});


const scene = viewer.scene;

//
// const tileSet = new Cesium.Cesium3DTileset({
//   url: '/public/3dtiles/obj/Batchedmap/tileset.json'
// });
//
// scene.primitives.add(tileSet);
//
// tileSet.readyPromise.then((tileset) => {
//   const longitude = -74.0445004;
//   const latitude = 40.6892494;
//   const height = 0;
//   const cartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
//   const transform = Cesium.Transforms.headingPitchRollToFixedFrame(cartesian, new Cesium.HeadingPitchRoll());
//   tileset._root.transform = Cesium.Matrix4.IDENTITY;
//   tileset.modelMatrix = transform;
//   viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0.0, -0.3, tileset.boundingSphere.radius / 4.0));
// });


const tileSet = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({
  url: '/public/3dtiles/tilesets/TilesetWithTreeBillboards/tileset.json'
  // url: '/public/3dtiles/tilesets/TilesetWithRequestVolume/tileset.json'
  // url: '/public/3dtiles/tilesets/TilesetWithDiscreteLOD/tileset.json'
}));

tileSet.readyPromise.then((tileset) => {
  viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0, -0.3, 0));
});