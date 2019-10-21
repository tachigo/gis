'use strict';


import $ from './../../modules';

import LibChinaProvince from './LibChinaProvince';

(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`计算中国各省内圈陆地边界线`, LibChinaProvince.calcInnerJunctures.bind(LibChinaProvince), [pg]);
  await pg.release();
})();