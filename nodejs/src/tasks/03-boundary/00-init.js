'use strict';


import $ from './../../modules';

import LibBoundary from './LibBoundary';


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  // await pg.query(`set work_mem='64MB'`);
  await $.Utils.call(`初始化外国边界数据`, LibBoundary.initForeignBoundaries.bind(LibBoundary), [pg]);
  await pg.release();
})();