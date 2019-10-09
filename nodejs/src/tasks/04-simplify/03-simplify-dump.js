'use strict';


import $ from './../../modules';

import LibSimplify from "./LibSimplify";


(async () => {
  const pg = await $.PgSQL.pool('localhost');
  await $.Utils.call(`准备简化中间数据`, LibSimplify.prepareDumpSimplifyData.bind(LibSimplify), [pg]);

  // 处理 加拿大#900032 海岸线
  await $.Utils.call(
    `简化 加拿大#900032 海岸线数据`,
    LibSimplify.dumpSimplify.bind(LibSimplify),
    [pg, 900032, 'coastline', 0.3]
  );


  // 处理 智利#900035 海岸线
  await $.Utils.call(
    `简化 智利#900035 海岸线数据`,
    LibSimplify.dumpSimplify.bind(LibSimplify),
    [pg, 900035, 'coastline', 0.3]
  );

  await pg.release();
})();