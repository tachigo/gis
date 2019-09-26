'use strict';

import WKT from 'terraformer-wkt-parser';

import PostGis from './../../modules/PgSQL/PostGis';

class Library {

  static async save(pg, id, parentId, iso, zhName, geoJson, level) {
    const table = 'amap.china';
    const sql = `with 
    ta as (
      select 
      ST_GeomFromText(
        $5, 
        4326
      )::geometry as geom
    )
    , tb as (
      select 
      ST_Multi(
        ST_GeometryN(
          ta.geom, 
          generate_series(
            1, ST_NumGeometries(ta.geom)
          )
        )
      )::geometry as geom 
      from ta
    )
    , tc as (
      select 
      ST_Union(ST_MakeValid(tb.geom)) as geom 
      from tb
    )
    , td as (
      select 
      $1::bigint as id, 
      $2::bigint as parent_id, 
      $3::varchar as iso, 
      $4::varchar as zh_name, 
      ST_Multi(
        tc.geom
      )::geometry as geom,
      $6::integer as level
      from tc
    )
    insert into ${table} (id, parent_id, iso, zh_name, geom, level) 
    select id, parent_id, iso, zh_name, geom, level from td
    on conflict (id) do update set 
    parent_id = excluded.parent_id, iso = excluded.iso, zh_name = excluded.zh_name, 
    geom = excluded.geom, level = excluded.level`;
    const params = [
      id, parentId,
      iso, zhName, WKT.convert(geoJson), level
    ];
    await pg.query(sql, params);

    await PostGis.validatePolygon(pg, id, table, 'id', 'geom');
  }
}


export default Library;