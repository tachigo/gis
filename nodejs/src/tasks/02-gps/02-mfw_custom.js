'use strict';

import $ from './../../modules';


import LibMfwCustom from './LibMfwCustom';

(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`处理问题`, async () => {
    await $.Utils.call(`导入中国领海数据`, LibMfwCustom.importChinaMaritime.bind(LibMfwCustom), [pg]);
    await $.Utils.call(`修复和中国有交集的国家`, LibMfwCustom.fixCountryIntersectsWithChina.bind(LibMfwCustom), [pg]);

    await $.Utils.call(`修复其他国家`, async () => {
      await LibMfwCustom.fixOthers01(pg);
      await LibMfwCustom.fixOthers02(pg);
      await LibMfwCustom.fixOthers03(pg);
      await LibMfwCustom.fixOthers04(pg);
      await LibMfwCustom.fixOthers05(pg);
      await LibMfwCustom.fixOthers06(pg);
      await LibMfwCustom.fixOthers07(pg);
    });
  });
  await pg.release();
})();