'use strict';


import $ from './../../modules';

(async () => {
  const pgKey = 'localhost';
  const pg = await $.PgSQL.pool(pgKey);
  await $.Utils.call(`导出OSM国家树的数据`, async () => {
    const shpFilename = `${$.Utils.dataDir}/shapefile/osm-data/osm-country/country.shp`;
    const sql = 'select * from osm.relation_aggregate';
    await $.PgSQL.getPostGis().exportShapeFile(shpFilename, pgKey, sql, 'geom');
  });

  await pg.release();
})();