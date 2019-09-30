'use strict';


import $ from './../../modules';

(async () => {
  const pg = await $.PgSQL.pool('localhost');



  await pg.release();
})();