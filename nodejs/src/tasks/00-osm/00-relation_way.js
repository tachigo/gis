'use strict';


import $ from './../../modules';

(async () => {
  await $.Utils.call(`遍历OSM 国家树`, async () => {
    const pg = await $.PgSQL.pool('localhost');
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
    const fromId = 0;
    const toId = 0;
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
  });
})();