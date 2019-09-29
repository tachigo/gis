'use strict';


import $ from './../../modules';

(async () => {
  const pg = await $.PgSQL.pool('localhost');

  await $.Utils.call(`导出OSM国家树的数据`, async () => {
    const shpFilename = `${$.Utils.dataDir}/shapfile/osm-data/osm-country/country.shp`;
    const sql = 'select * from osm.relation_aggr';
    await $.PgSQL.getPostGis().exportShapeFile(shpFilename, pg, sql, 'geom');
  });

  await pg.release();
})();