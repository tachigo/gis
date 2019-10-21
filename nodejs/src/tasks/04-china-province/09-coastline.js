'use strict';


import $ from './../../modules';

import LibChinaProvince from './LibChinaProvince';

(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`计算中国各省外圈海岸边界线`, LibChinaProvince.calcOuterCoastlines.bind(LibChinaProvince), [pg]);
  await pg.release();
})();