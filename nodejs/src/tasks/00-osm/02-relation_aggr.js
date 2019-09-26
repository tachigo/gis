'use strict';


import $ from './../../modules';

const aggregateRelation = async (pg, ids, fromId, toId) => {
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
};

const getIdsFromRelationWay = async (pg) => {
  const osmRelationDumpTable = `osm.relation_dump`;
  const sql = `select distinct id from ${osmRelationDumpTable} order by id asc`;
  const res = await pg.query(sql)
    .then(res => {
      return res.rows;
    })
  ;
  return res.map(item => +item.id);
};

(async () => {
  const pg = await $.PgSQL.pool('localhost');

  const ids = await $.Utils.call(`获取ID列表`, getIdsFromRelationWay, [pg]);
  await $.Utils.log(ids);

  const fromId = 0;
  const toId = 0;
  await $.Utils.call(`聚合Relation`, aggregateRelation, [pg, ids, fromId, toId]);

})();