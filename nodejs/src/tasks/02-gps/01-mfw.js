'use strict';


import $ from './../../modules';

import LibMfw from './LibMfw';


(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`整理数据`, async () => {
    await $.Utils.call(`映射 mfw 海外数据`, LibMfw.mapForeignData.bind(LibMfw), [pg]);
    await $.Utils.call(`映射 mfw 中国数据`, LibMfw.mapChinaCountryData.bind(LibMfw), [pg]);
  });
  await pg.release();
})();