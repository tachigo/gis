'use strict';


import $ from './../../modules';

import LibTopoBoundary from './LibTopoBoundary';

(async () => {
  const pg = $.PgSQL.pool('localhost');

  await $.Utils.call(`初始化 topo.boundary`, async () => {
    await LibTopoBoundary.init(pg);
  });

  await pg.release();
})();