"use strict";

var _modules = _interopRequireDefault(require("./modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

console.log(_modules.default);

const test = async (a, b, c) => {
  console.log(a, b, c);
  console.log(_modules.default.Utils.rootDir);
};

(async () => {
  await _modules.default.Utils.call(`aaaaa`, test, [1, 2, 3]);
  await _modules.default.OSM.relationFull([303427]);
})();