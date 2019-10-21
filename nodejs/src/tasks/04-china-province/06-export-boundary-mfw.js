'use strict';

import $ from './../../modules';

(async () => {
  const shpFilename = `${$.Utils.dataDir}/shapefile/tmp-china-province/boundary.shp`;
  await $.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from boundary.mfw where id > 10 and id < 50', 'geom');
})();