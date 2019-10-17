'use strict';

import $ from './../../modules';

import LibTopology from './LibTopology';


(async () => {
  const pg = await $.PgSQL.client('localhost');

  const lineDumpSchema = 'topo';
  const lineDumpTable = 'line_dump';
  const lineTopoSchema = 'topo';
  const lineTopoTable = 'line_topo';
  const topology = new LibTopology(lineDumpSchema, lineDumpTable, lineTopoSchema, lineTopoTable);


  await $.Utils.call(`初始化拓扑`, async () => {
    await topology.initTopoTable(pg);
  });

  await pg.release();
})();