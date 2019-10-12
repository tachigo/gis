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
        `备份 ${name}#${id} 外圈陆地边界线 拓扑数据`,
        topology.backupTopologyData.bind(topology),
        [pg, id, 'outer', 'juncture']
      );
      await $.Utils.call(
        `备份 ${name}#${id} 内圈陆地边界线 拓扑数据`,
        topology.backupTopologyData.bind(topology),
        [pg, id, 'inner', 'juncture']
      );
    }
  });

  await $.Utils.call(`备份 中国 拓扑数据`, async () => {
    const id = 1;
    const name = '中国';
    await $.Utils.call(
      `备份 ${name}#${id} 外圈陆地边界线 拓扑数据`,
      topology.backupTopologyData.bind(topology),
      [pg, id, 'outer', 'juncture']
    );
    await $.Utils.call(
      `备份 ${name}#${id} 内圈陆地边界线 拓扑数据`,
      topology.backupTopologyData.bind(topology),
      [pg, id, 'inner', 'juncture']
    );
  });

  await pg.release();
})();