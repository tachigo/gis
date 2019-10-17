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

  await $.Utils.call(`外国 外圈陆地边界线`, async () => {
    const list = await LibTopoLine.getForeignList(pg);
    for await (const item of list) {
      const id = +item['id'];
      const name = item['name'];
      await $.Utils.call(`${name}#${id} 外圈陆地边界线`, topology.mapJuncture.bind(topology), [pg, id, 'outer']);
    }
  });

  await $.Utils.call(`中国 外圈陆地边界线`, async () => {
    const id = 1;
    const name = '中国';
    await $.Utils.call(`${name}#${id} 外圈陆地边界线`, topology.mapJuncture.bind(topology), [pg, id, 'outer']);
  });

  await $.Utils.call(`外国 内圈陆地边界线`, async () => {
    const list = await LibTopoLine.getForeignList(pg);
    for await (const item of list) {
      const id = +item['id'];
      const name = item['name'];
      await $.Utils.call(`${name}#${id} 内圈陆地边界线`, topology.mapJuncture.bind(topology), [pg, id, 'inner']);
    }
  });

  await $.Utils.call(`中国 内圈陆地边界线`, async () => {
    const id = 1;
    const name = '中国';
    await $.Utils.call(`${name}#${id} 内圈陆地边界线`, topology.mapJuncture.bind(topology), [pg, id, 'inner']);
  });

  await pg.release();
})();