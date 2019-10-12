'use strict';


import $ from './../../modules';

import LibTopology from './LibTopology';


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  const topologyName = 'line_topo';
  const topology = new LibTopology(topologyName);
  await topology.registerTopologySimplifyFunction(pg);


  await pg.release();
})();