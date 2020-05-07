'use strict';


import $ from './../../../modules';

import Strategy from './../Strategy';


(async () => {
  const pg = await $.PgSQL.client('localhost');

  const strategy = await new Strategy(1, pg);

  await $.Utils.call(`初始化关系`, async () => {
    await strategy.initTopo2DumpRelation();
  });

  await pg.release();
})();