'use strict';


import $ from './../../modules';

import LibTopology from './LibTopology';


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  const topologyName = 'line_topo';
  const topology = new LibTopology(topologyName);

  await $.Utils.call(`外国 外圈陆地边界线`, async () => {
    const list = await LibTopology.getForeignList(pg);
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
    const list = await LibTopology.getForeignList(pg);
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