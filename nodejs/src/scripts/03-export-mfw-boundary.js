'use strict';

import $ from './../modules';

(async () => {
  const shpFilename = `${$.Utils.dataDir}/shapefile/tmp-all-boundary/all.shp`;
  await $.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from boundary.mfw', 'geom');
})();