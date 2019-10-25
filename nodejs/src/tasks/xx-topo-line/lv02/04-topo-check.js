'use strict';


import $ from './../../../modules';

import Strategy from './../Strategy';


(async () => {
  const pg = await $.PgSQL.client('localhost');

  const strategy = await new Strategy(2, pg);

  await $.Utils.call(`检查拓扑边`, async () => {
    await strategy.checkEdges(4096);
  });

  await pg.release();
})();