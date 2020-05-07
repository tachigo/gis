'use strict';

const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('planet/index.twig', { title: '星球' });
});


router.get('/cesium', async (req, res, next) => {
  res.render('planet/cesium.twig', {
    title: 'Cesium 星球'
  });
});


router.get('/cesium-mvt', async (req, res, next) => {
  res.render('planet/cesium-mvt.twig', {
    title: 'Cesium-MVT 星球'
  });
});


router.get('/cesium-3d-tiles', async (req, res, next) => {
  res.render('planet/cesium-3d-tiles.twig', {
    title: 'Cesium 3D Tiles 自由女神像'
  });
});



module.exports = router;