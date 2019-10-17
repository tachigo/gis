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

  await $.Utils.call(`备份 外国 拓扑数据`, async () => {
    const list = await LibTopoLine.getForeignList(pg);
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