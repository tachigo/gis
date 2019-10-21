'use strict';

import $ from './../../modules';

import LibChinaProvince from './LibChinaProvince';


(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`初始化中国省`, async () => {
    await LibChinaProvince.initGps(pg);
    await LibChinaProvince.initProvinceGpsWorld(pg);
  });
  await pg.release();
})();