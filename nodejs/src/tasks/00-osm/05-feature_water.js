'use strict';


import $ from './../../modules';

import LibFeature from './LibFeature';

// --max_old_space_size=16000
(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`导入water feature`, async () => {
    const dataDir = `${$.Utils.dataDir}/shapefile/osm-data`;
    const shpFilename = `${dataDir}/water-polygons-split-4326/water_polygons.shp`;
    const dbfFilename = `${dataDir}/water-polygons-split-4326/water_polygons.dbf`;
    const pgTable = 'osm.feature_water';

    await LibFeature.loadFromShapeFile(pg, shpFilename, dbfFilename, pgTable, 0, 0);

  });
  await pg.release();
})();