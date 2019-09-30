'use strict';

import $ from './../modules';

(async () => {
  const shpFilename = `${$.Utils.dataDir}/shapefile/tmp-all-gps/all.shp`;
  await $.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from gps.mfw where id = 1 or id > 900000', 'geom');
})();