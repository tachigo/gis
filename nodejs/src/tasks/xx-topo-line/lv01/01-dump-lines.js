'use strict';


import $ from './../../../modules';

import Strategy from './../Strategy';


(async () => {
  const pg = await $.PgSQL.client('localhost');

  const strategy = await new Strategy(1, pg);

  await $.Utils.call(`导出线`, strategy.loadBoundaryList.bind(strategy), [async (id, name) => {
    await $.Utils.call(`导出线 ${name}#${id}`, strategy.loadLineList.bind(strategy), [id, async (id, type, category) => {
      await $.Utils.call(`导出线 ${name}#${id} [${type}|${category}]`, strategy.dumpLines.bind(strategy), [id, type, category]);
    }]);
  }]);

  await pg.release();
})();