'use strict';

const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/cesium-3d-tiles.js',
  output: {
    path: path.resolve('./../'),
    filename: 'cesium-3d-tiles.js'
  }
};