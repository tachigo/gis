'use strict';


import $ from './../../modules';

import LibSimplify from "./LibSimplify";


(async () => {
  const pg = await $.PgSQL.pool('localhost');

  await $.Utils.call(`导出拓扑陆地边界线`, async () => {
    await LibSimplify.dumpTopologyJunctures(pg);
  });
  await pg.release();
})();