'use strict';


import $ from './../../modules';

import LibBoundary from './LibBoundary';


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  await pg.query(`set work_mem='64MB'`);
  await $.Utils.call(`准备外国水域数据`, LibBoundary.unionForeignWaterFeature.bind(LibBoundary), [pg]);
  await pg.release();
})();