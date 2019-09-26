'use strict';

import $ from './../../modules';

import Library from "./Library";


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  await $.Utils.call(`加载中国各省数据`, async () => {
    await $.AMap.loadProvinces(async (index, zhName, level, parentIndex, iso, geoJson) => {
      await Library.save(pg, index, parentIndex, iso, zhName, geoJson, level);
    });
  });
})();