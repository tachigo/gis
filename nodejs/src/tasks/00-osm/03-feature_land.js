'use strict';


import $ from './../../modules';

import LibFeature from './LibFeature';

// --max_old_space_size=16000
(async () => {
  await $.Utils.call(`导入land feature`, async () => {
    const pg = await $.PgSQL.pool('localhost');
    const dataDir = `${$.Utils.osHomeDir}/Documents/data/osm-data`;
    const shpFilename = `${dataDir}/land-polygons-split-4326/land_polygons.shp`;
    const dbfFilename = `${dataDir}/land-polygons-split-4326/land_polygons.dbf`;
    const pgTable = 'osm.feature_land';

    await LibFeature.loadFromShapeFile(pg, shpFilename, dbfFilename, pgTable, 0, 0);

  });
})();