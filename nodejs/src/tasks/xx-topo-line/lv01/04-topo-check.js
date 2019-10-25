'use strict';


import $ from './../../../modules';

import Strategy from './../Strategy';


(async () => {
  const pg = await $.PgSQL.client('localhost');

  const strategy = await new Strategy(1, pg);

  await $.Utils.call(`检查拓扑边`, async () => {
    await strategy.checkEdges();
  });

  await pg.release();
})();