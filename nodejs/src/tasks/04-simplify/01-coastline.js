'use strict';

import $ from './../../modules';

import LibSimplify from './LibSimplify';

(async () => {
  const pg = await $.PgSQL.pool('localhost');

  await $.Utils.call(`导出海岸线`, async () => {
    await LibSimplify.clearCoastlines(pg);
    await LibSimplify.dumpCoastlines(pg);
  });

  await pg.release();
})();