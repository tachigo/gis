'use strict';

import $ from './../modules';

(async () => {
  const pg = await $.PgSQL.pool('localhost');
  // 导出中国
  const shpFilename = `${$.Utils.dataDir}/tmp/china.shp`;

  await $.PgSQL.getPostGis().exportShapeFile(shpFilename, pg, 'select id, geom from gps.mfw where id = 1', 'geom');
})();