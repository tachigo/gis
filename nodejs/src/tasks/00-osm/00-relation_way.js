'use strict';


import $ from './../../modules';

import LibOSM from './LibOSM';

(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`遍历OSM 国家树`, LibOSM.relationWay.bind(LibOSM), [pg]);
  await pg.release();
})();