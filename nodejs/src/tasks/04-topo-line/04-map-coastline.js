'use strict';


import $ from './../../modules';

import LibTopoLine from './LibTopoLine';


(async () => {

  const topologyName = 'line_topo';
  const dumpTable = 'line_dump';
  const topoTable = 'line_topo';
  const schema = 'topo';
  const topology = new LibTopoLine(topologyName, dumpTable, topoTable, schema);

  await $.Utils.call(`外国 海岸边界线`, async () => {
    const startId = 900032;

    const pgp = await $.PgSQL.pool('localhost');
    const list = await LibTopoLine.getForeignList(pgp);
    for await (const item of list) {
      const id = +item['id'];
      const name = item['name'];
      if (id < startId) {
        continue;
      }

      await $.Utils.call(`${name}#${id} 海岸边界线`, topology.mapCoastline.bind(topology), [pgp, id]);
    }

  });

  await $.Utils.call(`中国 海岸边界线`, async () => {
    const pg = await $.PgSQL.client('localhost');
    const id = 1;
    const name = '中国';
    await $.Utils.call(`${name}#${id} 海岸边界线`, topology.mapCoastline.bind(topology), [pg, id]);
    await pg.release();
  });


})();