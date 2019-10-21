'use strict';

import $ from './../../modules';

(async () => {
  const shpFilename = `${$.Utils.dataDir}/shapefile/tmp-china-province/gps.shp`;
  await $.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from gps.mfw where id > 10 and id < 50', 'geom');
})();