'use strict';


import $ from './../../../modules';

import Strategy from './../Strategy';


(async () => {
  const pg = await $.PgSQL.client('localhost');

  const strategy = await new Strategy(2, pg);

  await $.Utils.call(`计算 dump2topo 关系`, async () => {
    await strategy.calcDump2TopoRelation(1e-8);
  });

  await pg.release();
})();