'use strict';


import $ from './../../modules';

import LibPrepare from './LibPrepare';


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  await $.Utils.call(`准备数据`, async () => {
    // osm -> world
    // amap -> world
    await $.Utils.call(`清理数据`, LibPrepare.clearData, [pg]);
    await $.Utils.call(`导入OSM数据`, LibPrepare.importOSM, [pg]);
    await $.Utils.call(`导入AMap数据`, LibPrepare.importAMap, [pg]);
  });
  await pg.release();
})();