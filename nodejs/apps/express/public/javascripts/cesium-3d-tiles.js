/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/cesium-3d-tiles.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/cesium-3d-tiles.js":
/*!********************************!*\
  !*** ./src/cesium-3d-tiles.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\n\nconst viewer = new Cesium.Viewer('cesium-container', {\n  creditContainer: 'credit-container',\n});\n\n\nconst scene = viewer.scene;\n\n//\n// const tileSet = new Cesium.Cesium3DTileset({\n//   url: '/public/3dtiles/obj/Batchedmap/tileset.json'\n// });\n//\n// scene.primitives.add(tileSet);\n//\n// tileSet.readyPromise.then((tileset) => {\n//   const longitude = -74.0445004;\n//   const latitude = 40.6892494;\n//   const height = 0;\n//   const cartesian = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);\n//   const transform = Cesium.Transforms.headingPitchRollToFixedFrame(cartesian, new Cesium.HeadingPitchRoll());\n//   tileset._root.transform = Cesium.Matrix4.IDENTITY;\n//   tileset.modelMatrix = transform;\n//   viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0.0, -0.3, tileset.boundingSphere.radius / 4.0));\n// });\n\n\nconst tileSet = viewer.scene.primitives.add(new Cesium.Cesium3DTileset({\n  url: '/public/3dtiles/tilesets/TilesetWithTreeBillboards/tileset.json'\n  // url: '/public/3dtiles/tilesets/TilesetWithRequestVolume/tileset.json'\n  // url: '/public/3dtiles/tilesets/TilesetWithDiscreteLOD/tileset.json'\n}));\n\ntileSet.readyPromise.then((tileset) => {\n  viewer.zoomTo(tileset, new Cesium.HeadingPitchRange(0, -0.3, 0));\n});\n\n//# sourceURL=webpack:///./src/cesium-3d-tiles.js?");

/***/ })

/******/ });