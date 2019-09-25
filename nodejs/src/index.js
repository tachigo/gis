"use strict";

import $ from './modules';

console.log($);

const test = async (a, b, c) => {
  console.log(a, b, c);
  console.log($.Utils.rootDir);
};

(async () => {
  await $.Utils.call(`aaaaa`, test, [1, 2, 3]);
  await $.OSM.relationFull([303427]);
})();
