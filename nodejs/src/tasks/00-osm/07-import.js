'use strict';

import $ from './../../modules';
import WKT from "terraformer-wkt-parser";

(async () => {
  const pg = await $.PgSQL.pool('localhost');
  const shpFilename = `${$.Utils.dataDir}/shapefile/osm-data/osm-country/country.shp`;
  const dbfFilename = `${$.Utils.dataDir}/shapefile/osm-data/osm-country/country.dbf`;
  const pgTableName = 'osm.relation_aggregate';
  const lineResolve = async (result) => {
    const properties = result.value.properties;
    const geometry = WKT.convert(result.value.geometry);
    const startTime = (new Date()).getTime(); // 计时
    const sql = `insert into ${pgTableName} (id, parent_id, level, iso, osm_ids, zh_name, en_name, geom)
    values (
      $1::bigint, $2::bigint, $3::integer, $4::varchar, $5::bigint[], 
      $6::varchar, $7::varchar, ST_Multi(ST_GeomFromText($8, 4326))::geometry
    )
    on conflict (id) do update
    set parent_id = excluded.parent_id, level = excluded.level, iso = excluded.iso, osm_ids =excluded.osm_ids, 
    zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom`;
    const params = [
      properties['id'], properties['parent_id'], properties['level'], properties['iso'], properties['osm_ids'],
      properties['zh_name'], properties['en_name'], geometry];
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