'use strict';


import $ from './../../modules';

import LibOSM from './LibOSM';

(async () => {
  const pg = await $.PgSQL.pool('localhost');
  await $.Utils.call(`导出Relation Way`, LibOSM.relationDump.bind(LibOSM), [pg]);
  await pg.release();
})();