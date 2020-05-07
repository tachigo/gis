'use strict';


const sessionFlash = exports = module.exports = {};

sessionFlash.addFlash = function addFlash(flashType, msg) {
  this.flashes[flashType].push(msg);
  return this;
};


sessionFlash.error = function error(msg) {
  return this.addFlash('error', msg);
};

sessionFlash.warning = function warning(msg) {
  return this.addFlash('warning', msg);
};


sessionFlash.info = function info(msg) {
  return this.addFlash('info', msg);
};

sessionFlash.success = function success(msg) {
  return this.addFlash('success', msg);
};


sessionFlash.all = function all(flashType) {
  return this.flashes[flashType] || [];
};


sessionFlash.init = function init(flashes) {
  this.flashes = flashes || {};
  const flashTypes = ['error', 'warning', 'info', 'success'];
  flashTypes.forEach(flashType => {
    this.flashes[flashType] = this.flashes[flashType] || [];
  });
};