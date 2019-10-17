'use strict';



import $ from './../../modules';

import LibBoundary from './../03-boundary/LibBoundary';

(async () => {
  const theId = 900096;

  const pg = await $.PgSQL.client('localhost');

  await $.Utils.call(`初始化外国边界数据`, LibBoundary.initForeignBoundaries.bind(LibBoundary), [pg, theId]);
  await $.Utils.call(`准备外国水域数据`, LibBoundary.unionForeignWaterFeatures.bind(LibBoundary), [pg, theId]);
  await $.Utils.call(`计算外国边界数据`, LibBoundary.calcForeignBoundaries.bind(LibBoundary), [pg, theId]);

  await pg.release();
})();