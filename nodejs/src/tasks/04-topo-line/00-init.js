'use strict';


import $ from './../../modules';

import LibTopology from './LibTopology';


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  const topologyName = 'line_topo';
  const topology = new LibTopology(topologyName);
  try {
    await topology.dropTopology(pg);
  } catch (e) {
    console.error(e.stack);
  }
  await topology.createTopology(pg);
  await topology.initTables(pg);
  await pg.release();
})();