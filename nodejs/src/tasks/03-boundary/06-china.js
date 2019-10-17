'use strict';


import $ from './../../modules';

import LibLine from './LibLine';
import LibChina from './LibChina';

(async () => {
  const pg = await $.PgSQL.client('localhost');
  await $.Utils.call(`准备中国数据`, LibChina.prepareChinaBoundary.bind(LibChina), [pg]);
  await $.Utils.call(`导入中国边界数据`, LibChina.importChinaBoundary.bind(LibChina), [pg]);
  await $.Utils.call(`修复中国边界数据`, LibChina.fixChinaBoundary.bind(LibChina), [pg]);

  const id = 1;
  const name = '中国';
  await $.Utils.call(`计算中国外圈陆地边界线`, LibLine.calcOuterJuncture.bind(LibLine), [pg, id, name]);
  await $.Utils.call(`计算中国内圈陆地边界线`, LibLine.calcInnerJuncture.bind(LibLine), [pg, id, name]);
  await $.Utils.call(`计算中国海岸边界线`, LibLine.calcCoastline.bind(LibLine), [pg, id, name]);
  await $.Utils.call(`导入中国十段线`, LibChina.importChinaSouth10.bind(LibChina), [pg]);

  await pg.release();
})();