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


  await $.Utils.call(`外国 外圈陆地边界线`, async () => {
    const list = await LibTopology.getForeignList(pg);
    for await (const item of list) {
      const id = +item['id'];
      const name = item['name'];
      await $.Utils.call(`${name}#${id} 外圈陆地边界线`, topology.dumpJuncture.bind(topology), [pg, id, 'outer']);
    }
  });

  await $.Utils.call(`中国 外圈陆地边界线`, async () => {
    const id = 1;
    const name = '中国';
    await $.Utils.call(`${name}#${id} 外圈陆地边界线`, topology.dumpJuncture.bind(topology), [pg, id, 'outer']);
  });

  await $.Utils.call(`外国 内圈陆地边界线`, async () => {
    const list = await LibTopology.getForeignList(pg);
    for await (const item of list) {
      const id = +item['id'];
      const name = item['name'];
      await $.Utils.call(`${name}#${id} 内圈陆地边界线`, topology.dumpJuncture.bind(topology), [pg, id, 'inner']);
    }
  });

  await $.Utils.call(`中国 内圈陆地边界线`, async () => {
    const id = 1;
    const name = '中国';
    await $.Utils.call(`${name}#${id} 内圈陆地边界线`, topology.dumpJuncture.bind(topology), [pg, id, 'inner']);
  });

  await pg.release();
})();