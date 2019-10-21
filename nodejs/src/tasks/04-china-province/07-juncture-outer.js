'use strict';


import $ from './../../modules';

import LibChinaProvince from './LibChinaProvince';

(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`计算中国各省外圈陆地边界线`, LibChinaProvince.calcOuterJunctures.bind(LibChinaProvince), [pg]);
  await pg.release();
})();