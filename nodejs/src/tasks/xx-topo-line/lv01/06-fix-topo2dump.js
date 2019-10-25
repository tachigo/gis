'use strict';


import $ from './../../../modules';

import Strategy from './../Strategy';


(async () => {
  const pg = await $.PgSQL.client('localhost');

  const strategy = await new Strategy(1, pg);

  await $.Utils.call(`拟合修复 topo2dump 关系`, async () => {
    await strategy.fixCalcTopoo2DumpRelation();
  });

  await pg.release();
})();