'use strict';


import $ from './../../modules';

import LibTopoLine from './LibTopoLine';


(async () => {
  const pg = await $.PgSQL.client('localhost');
  const topologyName = 'line_topo';
  const dumpTable = 'line_dump';
  const topoTable = 'line_topo';
  const schema = 'topo';
  const topology = new LibTopoLine(topologyName, dumpTable, topoTable, schema);

  await $.Utils.call(`备份拓扑结构`, async () => {
    await topology.backupTopology(pg);
  });

  await pg.release();
})();