'use strict';


import $ from './../../../modules';

import Strategy from './../Strategy';


(async () => {
  const pg = await $.PgSQL.client('localhost');

  const strategy = await new Strategy(2, pg);

  await $.Utils.call(`拟合修复 dump2topo 关系`, async () => {
    await strategy.fixCalcDump2TopoRelation();
  });

  await pg.release();
})();