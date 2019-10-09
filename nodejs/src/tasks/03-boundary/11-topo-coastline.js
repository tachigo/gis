'use strict';


// import $ from './../../modules';
//
// import LibTopology from './LibTopology';
//
//
// (async () => {
//   const pg = await $.PgSQL.pool('localhost');
//   const topologyName = 'boundary_topo_coastline';
//   const topology = new LibTopology(topologyName);
//
//   await $.Utils.call(`外国海岸边界线`, async () => {
//     const list = await LibTopology.getForeignList(pg);
//     for await (const item of list) {
//       const id = +item['id'];
//       const name = item['name'];
//       await $.Utils.call(`拓扑 ${name}#${id} 的海岸边界线`, topology.loadCoastline.bind(topology), [pg, id]);
//     }
//   });
//
//   await pg.release();
// })();