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
  try {
    await topology.dropTopology(pg);
  } catch (e) {
    console.error(e.stack);
  }
  await topology.createTopology(pg);
  await topology.initTables(pg);
  await pg.release();
})();