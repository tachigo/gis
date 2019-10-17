'use strict';


import $ from './../../modules';

import LibLine from './LibLine';

(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`计算外国内圈陆地边界线`, LibLine.calcForeignInnerJunctures.bind(LibLine), [pg]);
  await pg.release();
})();