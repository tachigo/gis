'use strict';


import $ from './../../modules';

import LibTopology from './LibTopology';


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  const topologyName = 'line_topo';
  const topology = new LibTopology(topologyName);

  await $.Utils.call(`备份拓扑结构`, async () => {
    await topology.backupTopology(pg);
  });

  await pg.release();
})();