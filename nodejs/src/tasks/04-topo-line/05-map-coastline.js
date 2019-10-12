'use strict';


import $ from './../../modules';

import LibTopology from './LibTopology';


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  const topologyName = 'line_topo';
  const topology = new LibTopology(topologyName);

  await pg.query(`SET enable_seqscan TO off`);

  await $.Utils.call(`外国 海岸边界线`, async () => {
    const list = await LibTopology.getForeignList(pg);
    for await (const item of list) {
      const id = +item['id'];
      const name = item['name'];
      await $.Utils.call(`${name}#${id} 海岸边界线`, topology.mapCoastline.bind(topology), [pg, id]);
    }
  });

  await $.Utils.call(`中国 海岸边界线`, async () => {
    const id = 1;
    const name = '中国';
    await $.Utils.call(`${name}#${id} 海岸边界线`, topology.mapCoastline.bind(topology), [pg, id]);
  });


  await pg.query(`SET enable_seqscan TO on`);

  await pg.release();
})();