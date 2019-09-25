'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getIdsFromRelationWay = async pg => {
  const osmRelationWayTable = `osm.relation_way`;
  const sql = `select distinct id from ${osmRelationWayTable} order by id asc`;
  const res = await pg.query(sql).then(res => {
    return res.rows;
  });
  return res.map(item => +item.id);
};

const dumpRelationWays = async (pg, ids, fromId, toId) => {
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
      await _modules.default.Utils.log(`#${id}`, '准备数据');
    }
  }
};

(async () => {
  const pg = await _modules.default.PgSQL.pool('localhost');
  const ids = await _modules.default.Utils.call(`获取ID列表`, getIdsFromRelationWay, [pg]);
  await _modules.default.Utils.log(ids);
  const fromId = 0;
  const toId = 0;
  await _modules.default.Utils.call(`导出Relation Way`, dumpRelationWays, [pg, ids, fromId, toId]);
})();