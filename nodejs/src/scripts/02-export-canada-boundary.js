'use strict';

import $ from './../modules';

(async () => {
  const shpFilename = `${$.Utils.dataDir}/shapefile/tmp-canada-boundary/china.shp`;
  await $.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select id, geom from boundary.mfw where id = 900032', 'geom');
})();