'use strict';


import $ from './../../modules';

import LibOSM from './LibOSM';

(async () => {
  const pg = await $.PgSQL.pool('localhost');
  await $.Utils.call(`聚合Relation`, LibOSM.relationAggregate.bind(LibOSM), [pg]);
  await pg.release();

})();