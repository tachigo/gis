'use strict';

import $ from './../../modules';
import WKT from "terraformer-wkt-parser";

(async () => {
  const pg = await $.PgSQL.client('localhost');
  const shpFilename = `${$.Utils.dataDir}/shapefile/china-province-gps/gps.shp`;
  const dbfFilename = `${$.Utils.dataDir}/shapefile/china-province-gps/gps.dbf`;
  const pgTableName = 'gps.mfw';
  const lineResolve = async (result) => {
    const properties = result.value.properties;
    const geometry = WKT.convert(result.value.geometry);
    const startTime = (new Date()).getTime(); // 计时
    const sql = `insert into ${pgTableName} (id, parent_id, level, iso, zh_name, en_name, geom, region_id, mdd_id, key)
    values (
      $1::bigint, $2::bigint, $3::integer, $4::varchar,
      $5::varchar, $6::varchar, ST_Multi(ST_GeomFromText($7, 4326))::geometry, 
      $8::bigint, $9::bigint, $10::varchar
    )
    on conflict (id) do update
    set parent_id = excluded.parent_id, level = excluded.level, iso = excluded.iso, 
    zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom`;
    const params = [
      properties['id'], properties['parent_id'], properties['level'], properties['iso'],
      properties['zh_name'], properties['en_name'], geometry, properties['region_id'],
      properties['mdd_id'], properties['key']];

    // console.log(properties);
    await pg.query(sql, params)
      .catch(e => {
        console.log(sql);
        throw e;
      })
    ;
    const endTime = (new Date()).getTime();
    const costTime = endTime - startTime;
    await $.Utils.log(`${pgTableName}#${properties['id']} cost ... ${costTime / 1000} s`);
  };
  await $.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);

  await pg.release();
})();