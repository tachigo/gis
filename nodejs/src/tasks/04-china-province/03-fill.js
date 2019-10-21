'use strict';

import $ from './../../modules';

import LibChinaProvince from './LibChinaProvince';


(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`中国省`, async () => {
    await LibChinaProvince.fillProvinceGpsMfw(pg);
  });
  await pg.release();
})();