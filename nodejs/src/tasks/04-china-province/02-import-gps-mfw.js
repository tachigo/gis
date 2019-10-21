'use strict';

import $ from './../../modules';
import WKT from "terraformer-wkt-parser";
import LibChinaProvince from "./LibChinaProvince";

(async () => {
  const pg = await $.PgSQL.client('localhost');
  // 41, 36, 35, 36, 30, 38, 15, 18, 17, 16
  const id = 16;
  await LibChinaProvince.initProvinceGpsMfw(pg, id);

  const shpFilename = `${$.Utils.dataDir}/shapefile/tmp-${id}/${id}.shp`;
  const dbfFilename = `${$.Utils.dataDir}/shapefile/tmp-${id}/${id}.dbf`;
  const pgTableName = 'gps.mfw';
  const lineResolve = async (result) => {
    const geometry = WKT.convert(result.value.geometry);
    const startTime = (new Date()).getTime(); // 计时
    const sql = `insert into ${pgTableName} (id, geom)
    values (
      $1::bigint, ST_Multi(ST_GeomFromText($2, 4326))::geometry
    )
    on conflict (id) do update set geom = excluded.geom`;
    const params = [id, geometry];
    await pg.query(sql, params)
      .catch(e => {
        console.log(sql);
        throw e;
      })
    ;

    await pg.query(
      `with 
      ta as (
        select 1 as id, geom from ${pgTableName} where id = $1
      )
      , tb as (
        select 1 as id, geom from ${pgTableName} where id = 1
      )
      , tc as (
        select ST_Intersection(ta.geom, tb.geom) as geom from ta left join tb on ta.id = tb.id
      )
      insert into ${pgTableName} (id, geom) 
      select $1::bigint as id, geom from tc 
      on conflict (id) do update set geom = excluded.geom`,
      [id]
    );
    await $.PgSQL.getPostGis().validatePolygon(pg, id, pgTableName, 'id', 'geom');

    const list = await LibChinaProvince.getProvinceGpsMfwList(pg);
    for await (const row of list) {
      if (row['id'] === id) {
        continue;
      }
      await $.Utils.call(
        `${id} - ${row['name']}#${row['id']} => ${id}`,
        LibChinaProvince.fixGpsMfw.bind(LibChinaProvince),
        [pg, id, row['id']]
      );
    }
    await $.PgSQL.getPostGis().validatePolygon(pg, id, pgTableName, 'id', 'geom');

    const endTime = (new Date()).getTime();
    const costTime = endTime - startTime;
    await $.Utils.log(`${pgTableName}#${id} cost ... ${costTime / 1000} s`);
  };
  await $.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);

  await pg.release();
})();