'use strict';


import $ from './../../modules';

import LibLine from './LibLine';

(async () => {
  const pg = await $.PgSQL.pool('localhost');
  await $.Utils.call(`计算外国外圈陆地边界线`, LibLine.calcForeignOuterJunctures.bind(LibLine), [pg]);
  await $.Utils.call(`计算外国内圈陆地边界线`, LibLine.calcForeignInnerJunctures.bind(LibLine), [pg]);
  await $.Utils.call(`计算外国海岸边界线`, LibLine.calcForeignCoastlines.bind(LibLine), [pg]);
  await pg.release();
})();