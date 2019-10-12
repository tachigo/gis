'use strict';


import $ from './../../modules';

import LibTopology from './LibTopology';


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  const topologyName = 'line_topo';
  const topology = new LibTopology(topologyName);

  await $.Utils.call(`备份 外国 拓扑数据`, async () => {
    const list = await LibTopology.getForeignList(pg);
    for await (const item of list) {
      const id = +item['id'];
      const name = item['name'];
      await $.Utils.call(
        `备份 ${name}#${id} 海岸线边界线 拓扑数据`,
        topology.backupTopologyData.bind(topology),
        [pg, id, 'outer', 'coastline']
      );
    }
  });

  await $.Utils.call(`备份 中国 拓扑数据`, async () => {
    const id = 1;
    const name = '中国';
    await $.Utils.call(
      `备份 ${name}#${id} 海岸线边界线 拓扑数据`,
      topology.backupTopologyData.bind(topology),
      [pg, id, 'outer', 'coastline']
    );
  });

  await pg.release();
})();