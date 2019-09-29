'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _modules = _interopRequireDefault(require("./../../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class LibOSM {
  static async getIdsFromRelationWay(pg) {
    const osmRelationWayTable = `osm.relation_way`;
    const sql = `select distinct id from ${osmRelationWayTable} order by id asc`;
    const res = await pg.query(sql).then(res => {
      return res.rows;
    });
    return res.map(item => +item.id);
  }

  static async getIdsFromRelationDump(pg) {
    const osmRelationDumpTable = `osm.relation_dump`;
    const sql = `select distinct id from ${osmRelationDumpTable} order by id asc`;
    const res = await pg.query(sql).then(res => {
      return res.rows;
    });
    return res.map(item => +item.id);
  }

  static async relationAggregate(pg, theId = 0) {
    const ids = await _modules.default.Utils.call(`获取ID列表`, this.getIdsFromRelationDump.bind(this), [pg]);
    console.log(ids);
    const fromId = theId;
    const toId = theId;
    const osmRelationAggrTable = `osm.relation_aggregate`;
    const osmRelationDumpTable = 'osm.relation_dump';

    for await (const id of ids) {
      // id ∈ [fromId, toId]
      if (id >= fromId && (!toId || id <= toId)) {
        const sql1 = `select path, id, relation_id, role from ${osmRelationDumpTable} where id = $1 order by area desc`;
        const rows = await pg.query(sql1, [id]).then(res => {
          return res.rows || [];
        });
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

          await _modules.default.Utils.log(`#${id}`, '聚合数据');
        }

        await _modules.default.OSM.getCountryTree().each(async (index, v, level, parentId) => {
          const key = index + 900000;

          if (key === id) {
            const sql = `update ${osmRelationAggrTable} set 
            parent_id = $1::bigint, level = $2::integer, iso = $3::varchar, 
            zh_name = $4::varchar, en_name = $5::varchar, osm_ids = $6::bigint[] 
            where id = $7`;
            await pg.query(sql, [parentId, level, v.iso, v.zhName, v.enName, `{${v.osmRelationIds.join(',')}}`, id]);
          }
        });
      }
    }
  }

  static async relationDump(pg, theId = 0) {
    const ids = await _modules.default.Utils.call(`获取ID列表`, this.getIdsFromRelationWay.bind(this), [pg]);
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
        await _modules.default.Utils.log(`#${id}`, '准备数据');
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
    await _modules.default.OSM.getCountryTree().each(async (index, v, level, parentId, desc) => {
      const id = index + 900000;
      desc.unshift(' <= ');
      desc.unshift(id); // id ∈ [fromId, toId]

      if (id >= fromId && (!toId || id <= toId)) {
        await _modules.default.Utils.log(...desc, '查询数据');
        const dict = await _modules.default.OSM.relationFull(v.osmRelationIds);
        const arr = Object.keys(dict);

        if (arr.length > 0) {
          await _modules.default.Utils.log(...desc, '接收到数据, 准备入库');

          for await (const osmId of arr) {
            const obj = dict[osmId];
            const relationWays = await _modules.default.OSM.relationWays(osmId, obj);

            for await (const relationWay of relationWays) {
              const relationId = relationWay.relation;
              const wayId = relationWay.way;
              const wayRole = relationWay.role;
              const geoJson = JSON.stringify(relationWay.geometry);
              const params = [`r${relationId}`, `w${wayId}`, id, wayRole, geoJson];
              await pg.query(sql, params);
              await _modules.default.Utils.log(`r${relationId}`, `w${wayId}`, id, wayRole);
            }
          }
        }
      }
    });
  }

}

var _default = LibOSM;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMC1vc20vTGliT1NNLmpzIl0sIm5hbWVzIjpbIkxpYk9TTSIsImdldElkc0Zyb21SZWxhdGlvbldheSIsInBnIiwib3NtUmVsYXRpb25XYXlUYWJsZSIsInNxbCIsInJlcyIsInF1ZXJ5IiwidGhlbiIsInJvd3MiLCJtYXAiLCJpdGVtIiwiaWQiLCJnZXRJZHNGcm9tUmVsYXRpb25EdW1wIiwib3NtUmVsYXRpb25EdW1wVGFibGUiLCJyZWxhdGlvbkFnZ3JlZ2F0ZSIsInRoZUlkIiwiaWRzIiwiJCIsIlV0aWxzIiwiY2FsbCIsImJpbmQiLCJjb25zb2xlIiwibG9nIiwiZnJvbUlkIiwidG9JZCIsIm9zbVJlbGF0aW9uQWdnclRhYmxlIiwic3FsMSIsImluZGV4Iiwicm93IiwicGF0aCIsInJlbGF0aW9uSWQiLCJyb2xlIiwic3FsMiIsIk9TTSIsImdldENvdW50cnlUcmVlIiwiZWFjaCIsInYiLCJsZXZlbCIsInBhcmVudElkIiwia2V5IiwiaXNvIiwiemhOYW1lIiwiZW5OYW1lIiwib3NtUmVsYXRpb25JZHMiLCJqb2luIiwicmVsYXRpb25EdW1wIiwicmVsYXRpb25XYXkiLCJkZXNjIiwidW5zaGlmdCIsImRpY3QiLCJyZWxhdGlvbkZ1bGwiLCJhcnIiLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwib3NtSWQiLCJvYmoiLCJyZWxhdGlvbldheXMiLCJyZWxhdGlvbiIsIndheUlkIiwid2F5Iiwid2F5Um9sZSIsImdlb0pzb24iLCJKU09OIiwic3RyaW5naWZ5IiwiZ2VvbWV0cnkiLCJwYXJhbXMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBR0E7Ozs7QUFFQSxNQUFNQSxNQUFOLENBQWE7QUFHWCxlQUFhQyxxQkFBYixDQUFtQ0MsRUFBbkMsRUFBdUM7QUFDckMsVUFBTUMsbUJBQW1CLEdBQUksa0JBQTdCO0FBQ0EsVUFBTUMsR0FBRyxHQUFJLDJCQUEwQkQsbUJBQW9CLGtCQUEzRDtBQUNBLFVBQU1FLEdBQUcs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O0FBQzdCLGtCQUFNSyxHQUFHLEdBQUdQLElBQUksQ0FBQ00sS0FBRCxDQUFoQjtBQUNBLGtCQUFNRSxZQUFZLEdBQUcsTUFBTXhDLGlCQUFFZ0IsR0FBRixDQUFNd0IsWUFBTixDQUFtQkYsS0FBbkIsRUFBMEJDLEdBQTFCLENBQTNCOztBQUNBLHVCQUFXLE1BQU1WLFdBQWpCLElBQWdDVyxZQUFoQyxFQUE4QztBQUM1QyxvQkFBTTNCLFVBQVUsR0FBR2dCLFdBQVcsQ0FBQ1ksUUFBL0I7QUFDQSxvQkFBTUMsS0FBSyxHQUFHYixXQUFXLENBQUNjLEdBQTFCO0FBQ0Esb0JBQU1DLE9BQU8sR0FBR2YsV0FBVyxDQUFDZixJQUE1QjtBQUNBLG9CQUFNK0IsT0FBTyxHQUFHQyxJQUFJLENBQUNDLFNBQUwsQ0FBZWxCLFdBQVcsQ0FBQ21CLFFBQTNCLENBQWhCO0FBQ0Esb0JBQU1DLE1BQU0sR0FBRyxDQUNaLElBQUdwQyxVQUFXLEVBREYsRUFDTSxJQUFHNkIsS0FBTSxFQURmLEVBQ2tCaEQsRUFEbEIsRUFDc0JrRCxPQUR0QixFQUMrQkMsT0FEL0IsQ0FBZjtBQUdBLG9CQUFNNUQsRUFBRSxDQUFDSSxLQUFILENBQVNGLEdBQVQsRUFBYzhELE1BQWQsQ0FBTjtBQUNBLG9CQUFNakQsaUJBQUVDLEtBQUYsQ0FBUUksR0FBUixDQUFhLElBQUdRLFVBQVcsRUFBM0IsRUFBK0IsSUFBRzZCLEtBQU0sRUFBeEMsRUFBMkNoRCxFQUEzQyxFQUErQ2tELE9BQS9DLENBQU47QUFDRDtBQUNGO0FBQ0Y7QUFDRjtBQUNGLEtBNUJLLENBQU47QUE2QkQ7O0FBcE9VOztlQXdPRTdELE0iLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSBcIi4vLi4vLi4vbW9kdWxlc1wiO1xuXG5jbGFzcyBMaWJPU00ge1xuXG5cbiAgc3RhdGljIGFzeW5jIGdldElkc0Zyb21SZWxhdGlvbldheShwZykge1xuICAgIGNvbnN0IG9zbVJlbGF0aW9uV2F5VGFibGUgPSBgb3NtLnJlbGF0aW9uX3dheWA7XG4gICAgY29uc3Qgc3FsID0gYHNlbGVjdCBkaXN0aW5jdCBpZCBmcm9tICR7b3NtUmVsYXRpb25XYXlUYWJsZX0gb3JkZXIgYnkgaWQgYXNjYDtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBwZy5xdWVyeShzcWwpXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICByZXR1cm4gcmVzLnJvd3M7XG4gICAgICB9KVxuICAgIDtcbiAgICByZXR1cm4gcmVzLm1hcChpdGVtID0+ICtpdGVtLmlkKTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBnZXRJZHNGcm9tUmVsYXRpb25EdW1wKHBnKSB7XG4gICAgY29uc3Qgb3NtUmVsYXRpb25EdW1wVGFibGUgPSBgb3NtLnJlbGF0aW9uX2R1bXBgO1xuICAgIGNvbnN0IHNxbCA9IGBzZWxlY3QgZGlzdGluY3QgaWQgZnJvbSAke29zbVJlbGF0aW9uRHVtcFRhYmxlfSBvcmRlciBieSBpZCBhc2NgO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBnLnF1ZXJ5KHNxbClcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHJldHVybiByZXMucm93cztcbiAgICAgIH0pXG4gICAgO1xuICAgIHJldHVybiByZXMubWFwKGl0ZW0gPT4gK2l0ZW0uaWQpO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgcmVsYXRpb25BZ2dyZWdhdGUocGcsIHRoZUlkID0gMCkge1xuICAgIGNvbnN0IGlkcyA9IGF3YWl0ICQuVXRpbHMuY2FsbChg6I635Y+WSUTliJfooahgLCB0aGlzLmdldElkc0Zyb21SZWxhdGlvbkR1bXAuYmluZCh0aGlzKSwgW3BnXSk7XG4gICAgY29uc29sZS5sb2coaWRzKTtcbiAgICBjb25zdCBmcm9tSWQgPSB0aGVJZDtcbiAgICBjb25zdCB0b0lkID0gdGhlSWQ7XG4gICAgY29uc3Qgb3NtUmVsYXRpb25BZ2dyVGFibGUgPSBgb3NtLnJlbGF0aW9uX2FnZ3JlZ2F0ZWA7XG4gICAgY29uc3Qgb3NtUmVsYXRpb25EdW1wVGFibGUgPSAnb3NtLnJlbGF0aW9uX2R1bXAnO1xuICAgIGZvciBhd2FpdCAoY29uc3QgaWQgb2YgaWRzKSB7XG4gICAgICAvLyBpZCDiiIggW2Zyb21JZCwgdG9JZF1cbiAgICAgIGlmIChpZCA+PSBmcm9tSWQgJiYgKCF0b0lkIHx8IGlkIDw9IHRvSWQpKSB7XG4gICAgICAgIGNvbnN0IHNxbDEgPSBgc2VsZWN0IHBhdGgsIGlkLCByZWxhdGlvbl9pZCwgcm9sZSBmcm9tICR7b3NtUmVsYXRpb25EdW1wVGFibGV9IHdoZXJlIGlkID0gJDEgb3JkZXIgYnkgYXJlYSBkZXNjYDtcbiAgICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAgICAgLnF1ZXJ5KHNxbDEsIFtpZF0pXG4gICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICAgIGNvbnN0IHBhdGggPSByb3dbJ3BhdGgnXTtcbiAgICAgICAgICBjb25zdCByZWxhdGlvbklkID0gcm93WydyZWxhdGlvbl9pZCddO1xuICAgICAgICAgIGNvbnN0IHJvbGUgPSByb3dbJ3JvbGUnXTtcbiAgICAgICAgICBpZiAoaW5kZXggPT09IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IHNxbDEgPSBgZGVsZXRlIGZyb20gJHtvc21SZWxhdGlvbkFnZ3JUYWJsZX0gd2hlcmUgaWQgPSAkMWA7XG4gICAgICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwxLCBbaWRdKTtcbiAgICAgICAgICAgIGNvbnN0IHNxbDIgPSBgd2l0aCBcbiAgICAgICAgICB0YSBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgaWQsIHN0X21ha2V2YWxpZChnZW9tKSBhcyBnZW9tIGZyb20gJHtvc21SZWxhdGlvbkR1bXBUYWJsZX0gXG4gICAgICAgICAgICB3aGVyZSBpZCA9ICQxIGFuZCByZWxhdGlvbl9pZCA9ICQyIGFuZCBwYXRoID0gJDMgYW5kIHJvbGUgPSAkNFxuICAgICAgICAgIClcbiAgICAgICAgICBpbnNlcnQgaW50byAke29zbVJlbGF0aW9uQWdnclRhYmxlfSAoaWQsIGdlb20pIFxuICAgICAgICAgIHNlbGVjdCBpZCwgc3RfbXVsdGkoZ2VvbSkgYXMgZ2VvbSBmcm9tIHRhIFxuICAgICAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBcbiAgICAgICAgICBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwyLCBbaWQsIHJlbGF0aW9uSWQsIHBhdGgsIHJvbGVdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJvbGUgPT09ICdvdXRlcicpIHtcbiAgICAgICAgICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgICAgICAgIHRhIGFzIChcbiAgICAgICAgICAgIHNlbGVjdCBpZCwgc3RfbWFrZXZhbGlkKGdlb20pIGFzIGdlb20gZnJvbSAke29zbVJlbGF0aW9uQWdnclRhYmxlfSB3aGVyZSBpZCA9ICQxXG4gICAgICAgICAgKVxuICAgICAgICAgICwgdGIgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGlkLCBzdF9tYWtldmFsaWQoZ2VvbSkgYXMgZ2VvbSBmcm9tICR7b3NtUmVsYXRpb25EdW1wVGFibGV9IFxuICAgICAgICAgICAgd2hlcmUgaWQgPSAkMSBhbmQgcmVsYXRpb25faWQgPSAkMiBhbmQgcGF0aCA9ICQzIGFuZCByb2xlID0gJDRcbiAgICAgICAgICApXG4gICAgICAgICAgLCB0YyBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgdGIuaWQgYXMgaWQsIHN0X3VuaW9uKHRhLmdlb20sIHRiLmdlb20pIGFzIGdlb20gXG4gICAgICAgICAgICBmcm9tIHRhIGxlZnQgam9pbiB0YiBcbiAgICAgICAgICAgIG9uIHRhLmlkID0gdGIuaWQgXG4gICAgICAgICAgKVxuICAgICAgICAgIGluc2VydCBpbnRvICR7b3NtUmVsYXRpb25BZ2dyVGFibGV9IChpZCwgZ2VvbSkgXG4gICAgICAgICAgc2VsZWN0IGlkLCBzdF9tdWx0aShnZW9tKSBhcyBnZW9tIGZyb20gdGMgXG4gICAgICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IFxuICAgICAgICAgIGdlb20gPSBleGNsdWRlZC5nZW9tYDtcbiAgICAgICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkLCByZWxhdGlvbklkLCBwYXRoLCByb2xlXSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChyb2xlID09PSAnaW5uZXInKSB7XG4gICAgICAgICAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICAgICAgICB0YSBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgaWQsIHN0X21ha2V2YWxpZChnZW9tKSBhcyBnZW9tIGZyb20gJHtvc21SZWxhdGlvbkFnZ3JUYWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgICAgICAgIClcbiAgICAgICAgICAsIHRiIGFzIChcbiAgICAgICAgICAgIHNlbGVjdCBpZCwgc3RfbWFrZXZhbGlkKGdlb20pIGFzIGdlb20gZnJvbSAke29zbVJlbGF0aW9uRHVtcFRhYmxlfSBcbiAgICAgICAgICAgIHdoZXJlIGlkID0gJDEgYW5kIHJlbGF0aW9uX2lkID0gJDIgYW5kIHBhdGggPSAkMyBhbmQgcm9sZSA9ICQ0XG4gICAgICAgICAgKVxuICAgICAgICAgICwgdGMgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IHRiLmlkIGFzIGlkLCBzdF9kaWZmZXJlbmNlKHRhLmdlb20sIHRiLmdlb20pIGFzIGdlb20gZnJvbSB0YSBsZWZ0IGpvaW4gdGIgXG4gICAgICAgICAgICBvbiB0YS5pZCA9IHRiLmlkIFxuICAgICAgICAgIClcbiAgICAgICAgICBpbnNlcnQgaW50byAke29zbVJlbGF0aW9uQWdnclRhYmxlfSAoaWQsIGdlb20pIFxuICAgICAgICAgIHNlbGVjdCBpZCwgc3RfbXVsdGkoZ2VvbSkgYXMgZ2VvbSBmcm9tIHRjIFxuICAgICAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBcbiAgICAgICAgICBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZCwgcmVsYXRpb25JZCwgcGF0aCwgcm9sZV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCAkLlV0aWxzLmxvZyhgIyR7aWR9YCwgJ+iBmuWQiOaVsOaNricpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0ICQuT1NNLmdldENvdW50cnlUcmVlKCkuZWFjaChhc3luYyAoaW5kZXgsIHYsIGxldmVsLCBwYXJlbnRJZCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGtleSA9IGluZGV4ICsgOTAwMDAwO1xuICAgICAgICAgIGlmIChrZXkgPT09IGlkKSB7XG4gICAgICAgICAgICBjb25zdCBzcWwgPSBgdXBkYXRlICR7b3NtUmVsYXRpb25BZ2dyVGFibGV9IHNldCBcbiAgICAgICAgICAgIHBhcmVudF9pZCA9ICQxOjpiaWdpbnQsIGxldmVsID0gJDI6OmludGVnZXIsIGlzbyA9ICQzOjp2YXJjaGFyLCBcbiAgICAgICAgICAgIHpoX25hbWUgPSAkNDo6dmFyY2hhciwgZW5fbmFtZSA9ICQ1Ojp2YXJjaGFyLCBvc21faWRzID0gJDY6OmJpZ2ludFtdIFxuICAgICAgICAgICAgd2hlcmUgaWQgPSAkN2A7XG4gICAgICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtcbiAgICAgICAgICAgICAgcGFyZW50SWQsIGxldmVsLCB2Lmlzbywgdi56aE5hbWUsIHYuZW5OYW1lLCBgeyR7di5vc21SZWxhdGlvbklkcy5qb2luKCcsJyl9fWAsIGlkXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIHJlbGF0aW9uRHVtcChwZywgdGhlSWQgPSAwKSB7XG4gICAgY29uc3QgaWRzID0gYXdhaXQgJC5VdGlscy5jYWxsKGDojrflj5ZJROWIl+ihqGAsIHRoaXMuZ2V0SWRzRnJvbVJlbGF0aW9uV2F5LmJpbmQodGhpcyksIFtwZ10pO1xuICAgIGNvbnNvbGUubG9nKGlkcyk7XG5cbiAgICBjb25zdCBmcm9tSWQgPSB0aGVJZDtcbiAgICBjb25zdCB0b0lkID0gdGhlSWQ7XG4gICAgY29uc3Qgb3NtUmVsYXRpb25EdW1wVGFibGUgPSAnb3NtLnJlbGF0aW9uX2R1bXAnO1xuICAgIGNvbnN0IG9zbVJlbGF0aW9uV2F5VGFibGUgPSBgb3NtLnJlbGF0aW9uX3dheWA7XG4gICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgb3V0ZXJfbGluZV91bmlvbiBhcyAoXG4gICAgICBzZWxlY3QgcmVsYXRpb25faWQsIHN0X3VuaW9uKGdlb20pIGFzIGdlb20gZnJvbSAke29zbVJlbGF0aW9uV2F5VGFibGV9IFxuICAgICAgd2hlcmUgaWQgPSAkMSBhbmQgcm9sZSA9ICdvdXRlcicgXG4gICAgICBncm91cCBieSByZWxhdGlvbl9pZFxuICAgIClcbiAgICAsIG91dGVyX3BvbHlnb25fdW5pb24gYXMgKFxuICAgICAgc2VsZWN0IHJlbGF0aW9uX2lkLCBzdF9tdWx0aShzdF9wb2x5Z29uaXplKGdlb20pKSBhcyBnZW9tIFxuICAgICAgZnJvbSBvdXRlcl9saW5lX3VuaW9uIFxuICAgICAgZ3JvdXAgYnkgcmVsYXRpb25faWRcbiAgICApXG4gICAgLCBvdXRlcl9wb2x5Z29uX2R1bXAgYXMgKFxuICAgICAgc2VsZWN0IHJlbGF0aW9uX2lkLCAoc3RfZHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tLCAoc3RfZHVtcChnZW9tKSkucGF0aFsxXSBhcyBwYXRoIFxuICAgICAgZnJvbSBvdXRlcl9wb2x5Z29uX3VuaW9uXG4gICAgKVxuICAgICwgaW5uZXJfbGluZV91bmlvbiBhcyAoXG4gICAgICBzZWxlY3QgcmVsYXRpb25faWQsIHN0X3VuaW9uKGdlb20pIGFzIGdlb20gZnJvbSAke29zbVJlbGF0aW9uV2F5VGFibGV9IFxuICAgICAgd2hlcmUgaWQgPSAkMSBhbmQgcm9sZSA9ICdpbm5lcidcbiAgICAgIGdyb3VwIGJ5IHJlbGF0aW9uX2lkXG4gICAgKVxuICAgICwgaW5uZXJfcG9seWdvbl91bmlvbiBhcyAoXG4gICAgICBzZWxlY3QgcmVsYXRpb25faWQsIHN0X211bHRpKHN0X3BvbHlnb25pemUoZ2VvbSkpIGFzIGdlb20gXG4gICAgICBmcm9tIGlubmVyX2xpbmVfdW5pb25cbiAgICAgIGdyb3VwIGJ5IHJlbGF0aW9uX2lkXG4gICAgKVxuICAgICwgaW5uZXJfcG9seWdvbl9kdW1wIGFzIChcbiAgICAgIHNlbGVjdCByZWxhdGlvbl9pZCwgKHN0X2R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSwgKHN0X2R1bXAoZ2VvbSkpLnBhdGhbMV0gYXMgcGF0aCBcbiAgICAgIGZyb20gaW5uZXJfcG9seWdvbl91bmlvblxuICAgIClcbiAgICAsIGFsbF9wb2x5Z29uX2R1bXAgYXMgKFxuICAgICAgc2VsZWN0IHBhdGgsICQxOjpiaWdpbnQgYXMgaWQsIHJlbGF0aW9uX2lkLCAnb3V0ZXInIGFzIHJvbGUsIFxuICAgICAgZ2VvbSwgc3RfZ2VvbWV0cnl0eXBlKGdlb20pIGFzIHR5cGUsIFxuICAgICAgc3RfYXJlYShnZW9tOjpnZW9ncmFwaHkpIC8gMTAwMDAwMCBhcyBhcmVhXG4gICAgICBmcm9tIG91dGVyX3BvbHlnb25fZHVtcFxuICAgICAgdW5pb24gYWxsIFxuICAgICAgc2VsZWN0IHBhdGgsICQxOjpiaWdpbnQgYXMgaWQsIHJlbGF0aW9uX2lkLCAnaW5uZXInIGFzIHJvbGUsIFxuICAgICAgZ2VvbSwgc3RfZ2VvbWV0cnl0eXBlKGdlb20pIGFzIHR5cGUsIFxuICAgICAgc3RfYXJlYShnZW9tOjpnZW9ncmFwaHkpIC8gMTAwMDAwMCBhcyBhcmVhXG4gICAgICBmcm9tIGlubmVyX3BvbHlnb25fZHVtcFxuICAgIClcbiAgICBpbnNlcnQgaW50byAke29zbVJlbGF0aW9uRHVtcFRhYmxlfSAocGF0aCwgaWQsIHJlbGF0aW9uX2lkLCByb2xlLCBnZW9tLCBhcmVhKVxuICAgIHNlbGVjdCBwYXRoLCBpZCwgcmVsYXRpb25faWQsIHJvbGUsIGdlb20sIGFyZWEgZnJvbSBhbGxfcG9seWdvbl9kdW1wXG4gICAgb24gY29uZmxpY3QgKGlkLCByZWxhdGlvbl9pZCwgcm9sZSwgcGF0aCkgZG8gdXBkYXRlIHNldCBcbiAgICBnZW9tID0gZXhjbHVkZWQuZ2VvbSwgYXJlYSA9IGV4Y2x1ZGVkLmFyZWFgO1xuICAgIGZvciBhd2FpdCAoY29uc3QgaWQgb2YgaWRzKSB7XG4gICAgICAvLyBpZCDiiIggW2Zyb21JZCwgdG9JZF1cbiAgICAgIGlmIChpZCA+PSBmcm9tSWQgJiYgKCF0b0lkIHx8IGlkIDw9IHRvSWQpKSB7XG4gICAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSAke29zbVJlbGF0aW9uRHVtcFRhYmxlfSB3aGVyZSBpZCA9ICQxYCwgW2lkXSk7XG4gICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkXSk7XG4gICAgICAgIGF3YWl0ICQuVXRpbHMubG9nKGAjJHtpZH1gLCAn5YeG5aSH5pWw5o2uJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGFzeW5jIHJlbGF0aW9uV2F5KHBnLCB0aGVJZCA9IDApIHtcbiAgICBjb25zdCBvc21SZWxhdGlvbldheVRhYmxlID0gYG9zbS5yZWxhdGlvbl93YXlgO1xuICAgIGNvbnN0IHNxbCA9IGB3aXRoXG4gICAgdGEgYXMgKFxuICAgICAgc2VsZWN0XG4gICAgICAkMTo6dmFyY2hhciBhcyByZWxhdGlvbl9pZCxcbiAgICAgICQyOjp2YXJjaGFyIGFzIHdheV9pZCxcbiAgICAgICQzOjpiaWdpbnQgYXMgaWQsXG4gICAgICAkNDo6dmFyY2hhciBhcyByb2xlLFxuICAgICAgc3Rfc2V0c3JpZChzdF9nZW9tZnJvbWdlb2pzb24oJDUpLCA0MzI2KSBhcyBnZW9tXG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7b3NtUmVsYXRpb25XYXlUYWJsZX0gKHJlbGF0aW9uX2lkLCB3YXlfaWQsIGlkLCByb2xlLCBnZW9tKVxuICAgIHNlbGVjdCByZWxhdGlvbl9pZCwgd2F5X2lkLCBpZCwgcm9sZSwgZ2VvbSBmcm9tIHRhXG4gICAgb24gY29uZmxpY3QgKHJlbGF0aW9uX2lkLCB3YXlfaWQpIGRvIHVwZGF0ZSBzZXRcbiAgICBpZCA9IGV4Y2x1ZGVkLmlkLCByb2xlID0gZXhjbHVkZWQucm9sZSwgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuICAgIGNvbnN0IGZyb21JZCA9IHRoZUlkO1xuICAgIGNvbnN0IHRvSWQgPSB0aGVJZDtcbiAgICBhd2FpdCAkLk9TTS5nZXRDb3VudHJ5VHJlZSgpLmVhY2goYXN5bmMgKGluZGV4LCB2LCBsZXZlbCwgcGFyZW50SWQsIGRlc2MpID0+IHtcbiAgICAgIGNvbnN0IGlkID0gaW5kZXggKyA5MDAwMDA7XG4gICAgICBkZXNjLnVuc2hpZnQoJyA8PSAnKTtcbiAgICAgIGRlc2MudW5zaGlmdChpZCk7XG4gICAgICAvLyBpZCDiiIggW2Zyb21JZCwgdG9JZF1cbiAgICAgIGlmIChpZCA+PSBmcm9tSWQgJiYgKCF0b0lkIHx8IGlkIDw9IHRvSWQpKSB7XG4gICAgICAgIGF3YWl0ICQuVXRpbHMubG9nKC4uLmRlc2MsICfmn6Xor6LmlbDmja4nKTtcbiAgICAgICAgY29uc3QgZGljdCA9IGF3YWl0ICQuT1NNLnJlbGF0aW9uRnVsbCh2Lm9zbVJlbGF0aW9uSWRzKTtcbiAgICAgICAgY29uc3QgYXJyID0gT2JqZWN0LmtleXMoZGljdCk7XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGF3YWl0ICQuVXRpbHMubG9nKC4uLmRlc2MsICfmjqXmlLbliLDmlbDmja4sIOWHhuWkh+WFpeW6kycpO1xuICAgICAgICAgIGZvciBhd2FpdCAoY29uc3Qgb3NtSWQgb2YgYXJyKSB7XG4gICAgICAgICAgICBjb25zdCBvYmogPSBkaWN0W29zbUlkXTtcbiAgICAgICAgICAgIGNvbnN0IHJlbGF0aW9uV2F5cyA9IGF3YWl0ICQuT1NNLnJlbGF0aW9uV2F5cyhvc21JZCwgb2JqKTtcbiAgICAgICAgICAgIGZvciBhd2FpdCAoY29uc3QgcmVsYXRpb25XYXkgb2YgcmVsYXRpb25XYXlzKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHJlbGF0aW9uSWQgPSByZWxhdGlvbldheS5yZWxhdGlvbjtcbiAgICAgICAgICAgICAgY29uc3Qgd2F5SWQgPSByZWxhdGlvbldheS53YXk7XG4gICAgICAgICAgICAgIGNvbnN0IHdheVJvbGUgPSByZWxhdGlvbldheS5yb2xlO1xuICAgICAgICAgICAgICBjb25zdCBnZW9Kc29uID0gSlNPTi5zdHJpbmdpZnkocmVsYXRpb25XYXkuZ2VvbWV0cnkpO1xuICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBbXG4gICAgICAgICAgICAgICAgYHIke3JlbGF0aW9uSWR9YCwgYHcke3dheUlkfWAsIGlkLCB3YXlSb2xlLCBnZW9Kc29uXG4gICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgYXdhaXQgJC5VdGlscy5sb2coYHIke3JlbGF0aW9uSWR9YCwgYHcke3dheUlkfWAsIGlkLCB3YXlSb2xlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IExpYk9TTTsiXX0=