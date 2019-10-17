'use strict';


import $ from './../../modules';
import LibBoundary from "./LibBoundary";

(async () => {
  const pg = await $.PgSQL.client('localhost');
  // await pg.query(`set work_mem='64MB'`);
  await $.Utils.call(`计算外国边界数据`, LibBoundary.calcForeignBoundaries.bind(LibBoundary), [pg]);
  await pg.release();
})();