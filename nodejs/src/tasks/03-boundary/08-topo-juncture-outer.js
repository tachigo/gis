'use strict';


import $ from './../../modules';

import LibTopology from './LibTopology';


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  const topologyName = 'boundary_topo_juncture';
  const topology = new LibTopology(topologyName);

  await $.Utils.call(`外国外圈陆地边界线`, async () => {
    const list = await LibTopology.getForeignList(pg);
    for await (const item of list) {
      const id = +item['id'];
      const name = item['name'];
      await $.Utils.call(`拓扑 ${name}#${id} 的外圈陆地边界线`, topology.loadOuterJuncture.bind(topology), [pg, id]);
    }
  });

  await pg.release();
})();