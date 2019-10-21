'use strict';


import $ from './../../modules';

import LibBoundary from './LibBoundary';


(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`初始化外国边界数据`, LibBoundary.initForeignBoundaries.bind(LibBoundary), [pg]);
  await pg.release();
})();