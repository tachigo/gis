'use strict';


import $ from "./../../modules";

class LibOSM {


  static async getIdsFromRelationWay(pg) {
    const osmRelationWayTable = `osm.relation_way`;
    const sql = `select distinct id from ${osmRelationWayTable} order by id asc`;
    const res = await pg.query(sql)
      .then(res => {
        return res.rows;
      })
    ;
    return res.map(item => +item.id);
  }

  static async getIdsFromRelationDump(pg) {
    const osmRelationDumpTable = `osm.relation_dump`;
    const sql = `select distinct id from ${osmRelationDumpTable} order by id asc`;
    const res = await pg.query(sql)
      .then(res => {
        return res.rows;
      })
    ;
    return res.map(item => +item.id);
  }


  static async relationAggregate(pg, theId = 0) {
    const ids = await $.Utils.call(`获取ID列表`, this.getIdsFromRelationDump.bind(this), [pg]);
    console.log(ids);
    const fromId = theId;
    const toId = theId;
    const osmRelationAggrTable = `osm.relation_aggregate`;
    const osmRelationDumpTable = 'osm.relation_dump';
    for await (const id of ids) {
      // id ∈ [fromId, toId]
      if (id >= fromId && (!toId || id <= toId)) {
        const sql1 = `select path, id, relation_id, role from ${osmRelationDumpTable} where id = $1 order by area desc`;
        const rows = await pg
          .query(sql1, [id])
          .then(res => {
            return res.rows || [];
          })
        ;
        let index = 0;
        for await (const row of rows) {
          index += 1;
          const path = row['path'];
          const relationId = row['relation_id'];
          const role = row['role'];
          if (index === 1) {
            const sql1 = `delete from ${osmRelationAggrTable} where id = $1`;
            await pg.query(sql1, [id]);
            const sql2 = `with 
          ta as (
            select id, st_makevalid(geom) as geom from ${osmRelationDumpTable} 
            where id = $1 and relation_id = $2 and path = $3 and role = $4
          )
          insert into ${osmRelationAggrTable} (id, geom) 
          select id, st_multi(geom) as geom from ta 
          on conflict (id) do update set 
          geom = excluded.geom`;
            await pg.query(sql2, [id, relationId, path, role]);
          }
          if (role === 'outer') {
            const sql = `with 
          ta as (
            select id, st_makevalid(geom) as geom from ${osmRelationAggrTable} where id = $1
          )
          , tb as (
            select id, st_makevalid(geom) as geom from ${osmRelationDumpTable} 
            where id = $1 and relation_id = $2 and path = $3 and role = $4
          )
          , tc as (
            select tb.id as id, st_union(ta.geom, tb.geom) as geom 
            from ta left join tb 
            on ta.id = tb.id 
          )
          insert into ${osmRelationAggrTable} (id, geom) 
          select id, st_multi(geom) as geom from tc 
          on conflict (id) do update set 
          geom = excluded.geom`;
            await pg.query(sql, [id, relationId, path, role]);
          } else if (role === 'inner') {
            const sql = `with 
          ta as (
            select id, st_makevalid(geom) as geom from ${osmRelationAggrTable} where id = $1
          )
          , tb as (
            select id, st_makevalid(geom) as geom from ${osmRelationDumpTable} 
            where id = $1 and relation_id = $2 and path = $3 and role = $4
          )
          , tc as (
            select tb.id as id, st_difference(ta.geom, tb.geom) as geom from ta left join tb 
            on ta.id = tb.id 
          )
          insert into ${osmRelationAggrTable} (id, geom) 
          select id, st_multi(geom) as geom from tc 
          on conflict (id) do update set 
          geom = excluded.geom`;
            await pg.query(sql, [id, relationId, path, role]);
          }
          await $.Utils.log(`#${id}`, '聚合数据');
        }
        await $.OSM.getCountryTree().each(async (index, v, level, parentId) => {
          const key = index + 900000;
          if (key === id) {
            const sql = `update ${osmRelationAggrTable} set 
            parent_id = $1::bigint, level = $2::integer, iso = $3::varchar, 
            zh_name = $4::varchar, en_name = $5::varchar, osm_ids = $6::bigint[] 
            where id = $7`;
            await pg.query(sql, [
              parentId, level, v.iso, v.zhName, v.enName, `{${v.osmRelationIds.join(',')}}`, id
            ]);
          }
        });
      }
    }
  }


  static async relationDump(pg, theId = 0) {
    const ids = await $.Utils.call(`获取ID列表`, this.getIdsFromRelationWay.bind(this), [pg]);
    console.log(ids);

    const fromId = theId;
    const toId = theId;
    const osmRelationDumpTable = 'osm.relation_dump';
    const osmRelationWayTable = `osm.relation_way`;
    const sql = `with 
    outer_line_union as (
      select relation_id, st_union(geom) as geom from ${osmRelationWayTable} 
      where id = $1 and role = 'outer' 
      group by relation_id
    )
    , outer_polygon_union as (
      select relation_id, st_multi(st_polygonize(geom)) as geom 
      from outer_line_union 
      group by relation_id
    )
    , outer_polygon_dump as (
      select relation_id, (st_dump(geom)).geom as geom, (st_dump(geom)).path[1] as path 
      from outer_polygon_union
    )
    , inner_line_union as (
      select relation_id, st_union(geom) as geom from ${osmRelationWayTable} 
      where id = $1 and role = 'inner'
      group by relation_id
    )
    , inner_polygon_union as (
      select relation_id, st_multi(st_polygonize(geom)) as geom 
      from inner_line_union
      group by relation_id
    )
    , inner_polygon_dump as (
      select relation_id, (st_dump(geom)).geom as geom, (st_dump(geom)).path[1] as path 
      from inner_polygon_union
    )
    , all_polygon_dump as (
      select path, $1::bigint as id, relation_id, 'outer' as role, 
      geom, st_geometrytype(geom) as type, 
      st_area(geom::geography) / 1000000 as area
      from outer_polygon_dump
      union all 
      select path, $1::bigint as id, relation_id, 'inner' as role, 
      geom, st_geometrytype(geom) as type, 
      st_area(geom::geography) / 1000000 as area
      from inner_polygon_dump
    )
    insert into ${osmRelationDumpTable} (path, id, relation_id, role, geom, area)
    select path, id, relation_id, role, geom, area from all_polygon_dump
    on conflict (id, relation_id, role, path) do update set 
    geom = excluded.geom, area = excluded.area`;
    for await (const id of ids) {
      // id ∈ [fromId, toId]
      if (id >= fromId && (!toId || id <= toId)) {
        await pg.query(`delete from ${osmRelationDumpTable} where id = $1`, [id]);
        await pg.query(sql, [id]);
        await $.Utils.log(`#${id}`, '准备数据');
      }
    }
  }

  static async relationWay(pg, theId = 0) {
    const osmRelationWayTable = `osm.relation_way`;
    const sql = `with
    ta as (
      select
      $1::varchar as relation_id,
      $2::varchar as way_id,
      $3::bigint as id,
      $4::varchar as role,
      st_setsrid(st_geomfromgeojson($5), 4326) as geom
    )
    insert into ${osmRelationWayTable} (relation_id, way_id, id, role, geom)
    select relation_id, way_id, id, role, geom from ta
    on conflict (relation_id, way_id) do update set
    id = excluded.id, role = excluded.role, geom = excluded.geom`;
    const fromId = theId;
    const toId = theId;
    await $.OSM.getCountryTree().each(async (index, v, level, parentId, desc) => {
      const id = index + 900000;
      desc.unshift(' <= ');
      desc.unshift(id);
      // id ∈ [fromId, toId]
      if (id >= fromId && (!toId || id <= toId)) {
        await $.Utils.log(...desc, '查询数据');
        const dict = await $.OSM.relationFull(v.osmRelationIds);
        const arr = Object.keys(dict);
        if (arr.length > 0) {
          await $.Utils.log(...desc, '接收到数据, 准备入库');
          for await (const osmId of arr) {
            const obj = dict[osmId];
            const relationWays = await $.OSM.relationWays(osmId, obj);
            for await (const relationWay of relationWays) {
              const relationId = relationWay.relation;
              const wayId = relationWay.way;
              const wayRole = relationWay.role;
              const geoJson = JSON.stringify(relationWay.geometry);
              const params = [
                `r${relationId}`, `w${wayId}`, id, wayRole, geoJson
              ];
              await pg.query(sql, params);
              await $.Utils.log(`r${relationId}`, `w${wayId}`, id, wayRole);
            }
          }
        }
      }
    });
  }
}


export default LibOSM;