'use strict';


import $ from './../../../modules';

import Strategy from './../Strategy';


(async () => {
  const pg = await $.PgSQL.client('localhost');

  const strategy = await new Strategy(2, pg);

  await $.Utils.call(`检查覆盖的拓扑边`, async () => {
    await strategy.checkCollapseEdges();
  });

  await pg.release();
})();