'use strict';


import $ from "../../modules";
import WKT from "terraformer-wkt-parser";

class LibChina {

  static async prepareChinaBoundary(pg) {
    const fromTable = 'gps.mfw';
    const toTable = 'boundary.mfw';
    const sql = `insert into ${toTable} 
    (id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id) 
    select id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id 
    from ${fromTable} where id = $1::bigint 
    on conflict (id) do update set 
    parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso, 
    zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom, 
    region_id = excluded.region_id, mdd_id = excluded.mdd_id`;
    await pg.query(sql, [1]);
  }


  static async importChinaSouth10(pg) {
    const shpFilename = `${$.Utils.dataDir}/shapefile/十段线/十段线.shp`;
    const dbfFilename = `${$.Utils.dataDir}/shapefile/十段线/十段线.dbf`;
    const geoJson = {
      type: 'MultiLineString'
    };
    const coordinates = [];
    const lineResolve = async (result) => {
      const geometry = result.value.geometry;
      coordinates.push(geometry.coordinates);
    };
    await $.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);
    geoJson['coordinates'] = coordinates;
    const wktString = WKT.convert(geoJson).toString('utf8');
    const table = 'boundary.line';
    const id = 1;
    const type = 'extra';
    const category = 'china_south_10';
    const name = '中国';
    await pg.query(
      `delete from ${table} where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    );
    const sql = `insert into ${table} (id, type, category, name, geom) 
    values ($1::bigint, $2::varchar, $3::varchar, $4::varchar, st_geomfromtext($5, 4326)) 
    on conflict (id, type, category) do update set 
    name = excluded.name, geom = excluded.geom`;
    await pg.query(sql, [id, type, category, name, wktString]);
  }


  static async importChinaBoundary(pg) {
    const table = 'boundary.mfw';
    const shpFilename = `${$.Utils.dataDir}/shapefile/china-boundary/china.shp`;
    const dbfFilename = `${$.Utils.dataDir}/shapefile/china-boundary/china.dbf`;
    const id = 1;
    const lineResolve = async (result) => {
      const geometry = WKT.convert(result.value.geometry);
      const startTime = (new Date()).getTime(); // 计时
      const sql = `insert into ${table} (id, geom) 
      values ($1::bigint, ST_Multi(ST_GeomFromText($2, 4326))::geometry) 
      on conflict (id) do update 
      set geom = excluded.geom`;
      const params = [id, geometry];
      await pg.query(sql, params)
        .catch(e => {
          console.log(sql);
          throw e;
        })
      ;
      const endTime = (new Date()).getTime();
      const costTime = endTime - startTime;
      console.log(`${table}#${id} cost ... ${costTime / 1000} s`);
    };
    await $.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);
    await $.PgSQL.getPostGis().validatePolygon(pg, id, table, 'id', 'geom');
  }


  static async fixChinaBoundary(pg) {
    // 和gps数据做交集
    const gpsTable = 'gps.mfw';
    const boundaryTable = 'boundary.mfw';
    const id = 1;
    const sql = `with 
    ta as (
      select 1 as id, geom from ${gpsTable} where id = $1
    )
    , tb as (
      select 1 as id, geom from ${boundaryTable} where id = $1
    )
    , tc as (
      select $1::bigint as id, st_intersection(ta.geom, tb.geom) as geom 
      from ta left join tb on ta.id = tb.id
    )
    insert into ${boundaryTable} (id, geom) 
    select id, geom from tc 
    on conflict (id) do update set geom = excluded.geom`;
    await pg.query(sql, [id]);
  }




}


export default LibChina;