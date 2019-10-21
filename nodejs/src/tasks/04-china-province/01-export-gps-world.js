'use strict';

import $ from './../../modules';

(async () => {
  const shpFilename = `${$.Utils.dataDir}/shapefile/tmp-china-province/gps.shp`;
  const id = 16;
  if (id === 0) {
    await $.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from gps.world where id > 10 and id < 50', 'geom');
  } else {
    await $.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', `select * from gps.world where id = ${id}`, 'geom');
  }
})();