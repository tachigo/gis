'use strict';


import $ from './../../modules';

import LibOSM from './../00-osm/LibOSM';

(async () => {
  const theId = 900253;

  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`遍历OSM 国家树`, LibOSM.relationWay.bind(LibOSM), [pg, theId]);
  await $.Utils.call(`导出Relation Way`, LibOSM.relationDump.bind(LibOSM), [pg, theId]);
  await $.Utils.call(`聚合Relation`, LibOSM.relationAggregate.bind(LibOSM), [pg, theId]);
  await pg.release();
})();