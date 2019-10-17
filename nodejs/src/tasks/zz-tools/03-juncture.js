'use strict';


import $ from './../../modules';

import LibLine from './../03-boundary/LibLine';

(async () => {
  const pg = await $.PgSQL.client('localhost');
  const id = 900096;
  await $.Utils.call(`计算外国外圈陆地边界线`, LibLine.calcForeignOuterJunctures.bind(LibLine), [pg, id]);
  await $.Utils.call(`计算外国内圈陆地边界线`, LibLine.calcForeignInnerJunctures.bind(LibLine), [pg, id]);
  await pg.release();
})();