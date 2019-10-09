'use strict';


import $ from './../../modules';

import LibTopology from './LibTopology';


(async () => {
  const pg = await $.PgSQL.pool('localhost');

  const junctureTopologyName = 'boundary_topo_juncture';
  const junctureTopology = new LibTopology(junctureTopologyName);

  const id = 1;
  const name = '中国';
  await $.Utils.call(`拓扑 ${name}#${id} 的外圈陆地边界线`, junctureTopology.loadOuterJuncture.bind(junctureTopology), [pg, id]);
  await $.Utils.call(`拓扑 ${name}#${id} 的内圈陆地边界线`, junctureTopology.loadInnerJuncture.bind(junctureTopology), [pg, id]);

  // const coastlineTopologyName = 'boundary_topo_coastline';
  // const coastlineTopology = new LibTopology(coastlineTopologyName);
  // await $.Utils.call(`拓扑 ${name}#${id} 的海岸边界线`, coastlineTopology.loadCoastline.bind(coastlineTopology), [pg, id]);

  await pg.release();
})();