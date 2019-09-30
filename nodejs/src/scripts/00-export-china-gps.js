'use strict';

import $ from './../modules';

(async () => {
  const shpFilename = `${$.Utils.dataDir}/shapefile/tmp-china-maritime/china.shp`;
  await $.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select id, geom from gps.mfw where id = 1', 'geom');
})();