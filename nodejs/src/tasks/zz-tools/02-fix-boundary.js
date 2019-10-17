'use strict';


import $ from './../../modules';

(async () => {
  const pg = await $.PgSQL.client('localhost');

  const table = 'boundary.mfw';
  const id = 900096;
  await $.PgSQL.getPostGis().validatePolygon(pg, id, table, 'id', 'geom');

  await pg.release();
})();