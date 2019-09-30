'use strict';


import $ from './../../modules';

import LibLine from './LibLine';

(async () => {
  const pg = await $.PgSQL.pool('localhost');
  await $.Utils.call(`计算外国外圈陆地边界线`, LibLine.calcForeignOuterJunctures.bind(LibLine), [pg]);
  await pg.release();
})();