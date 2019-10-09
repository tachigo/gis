'use strict';


import $ from './../../modules';

(async () => {
  const pg = await $.PgSQL.pool('localhost');

  const table = 'boundary.mfw';
  const id = 900114;
  await $.PgSQL.getPostGis().validatePolygon(pg, id, table, 'id', 'geom');

  await pg.release();
})();