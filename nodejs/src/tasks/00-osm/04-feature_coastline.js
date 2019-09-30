'use strict';


import $ from './../../modules';

import LibFeature from './LibFeature';

// --max_old_space_size=16000
(async () => {
  const pg = await $.PgSQL.pool('localhost');
  await $.Utils.call(`导入coastline feature`, async () => {
    const dataDir = `${$.Utils.dataDir}/shapefile/osm-data`;
    const shpFilename = `${dataDir}/coastlines-split-4326/lines.shp`;
    const dbfFilename = `${dataDir}/coastlines-split-4326/lines.dbf`;
    const pgTable = 'osm.feature_coastline';

    await LibFeature.loadFromShapeFile(pg, shpFilename, dbfFilename, pgTable, 0, 0);

  });
  await pg.release();
})();