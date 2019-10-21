'use strict';

import $ from './../../modules';

import LibChinaProvince from './LibChinaProvince';


(async () => {
  const pg = await $.PgSQL.client('localhost');
  await pg.query(`delete from boundary.mfw where id > 10 and id < 50`);
  await $.Utils.call(`中国省 gps -> boundary`, async () => {
    const list = await LibChinaProvince.getProvinceGpsMfwList(pg);
    for await (const item of list) {
      await $.Utils.call(`${item['name']}#${item['id']}`, async () => {
        await LibChinaProvince.gps2boundary(pg, item['id']);
      });
    }
  });
  await pg.release();
})();