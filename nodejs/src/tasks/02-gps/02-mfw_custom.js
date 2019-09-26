'use strict';

import $ from './../../modules';


import LibMfwCustom from './LibMfwCustom';

(async () => {
  const pg = await $.PgSQL.pool('localhost');
  await $.Utils.call(`处理问题`, async () => {
    console.log(pg);
  });
})();