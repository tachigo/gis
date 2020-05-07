'use strict';

const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/cesium-mvt.js',
  output: {
    path: path.resolve('./../'),
    filename: 'cesium-mvt.js'
  }
};