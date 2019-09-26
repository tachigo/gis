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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMC1vc20vMDEtcmVsYXRpb25fZHVtcC5qcyJdLCJuYW1lcyI6WyJnZXRJZHNGcm9tUmVsYXRpb25XYXkiLCJwZyIsIm9zbVJlbGF0aW9uV2F5VGFibGUiLCJzcWwiLCJyZXMiLCJxdWVyeSIsInRoZW4iLCJyb3dzIiwibWFwIiwiaXRlbSIsImlkIiwiZHVtcFJlbGF0aW9uV2F5cyIsImlkcyIsImZyb21JZCIsInRvSWQiLCJvc21SZWxhdGlvbkR1bXBUYWJsZSIsIiQiLCJVdGlscyIsImxvZyIsIlBnU1FMIiwicG9vbCIsImNhbGwiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOzs7O0FBR0EsTUFBTUEscUJBQXFCLEdBQUcsTUFBT0MsRUFBUCxJQUFjO0FBQzFDLFFBQU1DLG1CQUFtQixHQUFJLGtCQUE3QjtBQUNBLFFBQU1DLEdBQUcsR0FBSSwyQkFBMEJELG1CQUFvQixrQkFBM0Q7QUFDQSxRQUFNRSxHQUFHLEdBQUcsTUFBTUgsRUFBRSxDQUFDSSxLQUFILENBQVNGLEdBQVQsRUFDZkcsSUFEZSxDQUNWRixHQUFHLElBQUk7QUFDWCxXQUFPQSxHQUFHLENBQUNHLElBQVg7QUFDRCxHQUhlLENBQWxCO0FBS0EsU0FBT0gsR0FBRyxDQUFDSSxHQUFKLENBQVFDLElBQUksSUFBSSxDQUFDQSxJQUFJLENBQUNDLEVBQXRCLENBQVA7QUFDRCxDQVREOztBQVlBLE1BQU1DLGdCQUFnQixHQUFHLE9BQU9WLEVBQVAsRUFBV1csR0FBWCxFQUFnQkMsTUFBaEIsRUFBd0JDLElBQXhCLEtBQWlDO0FBQ3hELFFBQU1DLG9CQUFvQixHQUFHLG1CQUE3QjtBQUNBLFFBQU1iLG1CQUFtQixHQUFJLGtCQUE3QjtBQUNBLFFBQU1DLEdBQUcsR0FBSTs7c0RBRXVDRCxtQkFBb0I7Ozs7Ozs7Ozs7Ozs7O3NEQWNwQkEsbUJBQW9COzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Z0JBd0IxRGEsb0JBQXFCOzs7NkNBeENuQzs7QUE0Q0EsYUFBVyxNQUFNTCxFQUFqQixJQUF1QkUsR0FBdkIsRUFBNEI7QUFDMUI7QUFDQSxRQUFJRixFQUFFLElBQUlHLE1BQU4sS0FBaUIsQ0FBQ0MsSUFBRCxJQUFTSixFQUFFLElBQUlJLElBQWhDLENBQUosRUFBMkM7QUFDekMsWUFBTWIsRUFBRSxDQUFDSSxLQUFILENBQVUsZUFBY1Usb0JBQXFCLGdCQUE3QyxFQUE4RCxDQUFDTCxFQUFELENBQTlELENBQU47QUFDQSxZQUFNVCxFQUFFLENBQUNJLEtBQUgsQ0FBU0YsR0FBVCxFQUFjLENBQUNPLEVBQUQsQ0FBZCxDQUFOO0FBQ0EsWUFBTU0saUJBQUVDLEtBQUYsQ0FBUUMsR0FBUixDQUFhLElBQUdSLEVBQUcsRUFBbkIsRUFBc0IsTUFBdEIsQ0FBTjtBQUNEO0FBQ0Y7QUFDRixDQXZERDs7QUEwREEsQ0FBQyxZQUFZO0FBQ1gsUUFBTVQsRUFBRSxHQUFHLE1BQU1lLGlCQUFFRyxLQUFGLENBQVFDLElBQVIsQ0FBYSxXQUFiLENBQWpCO0FBRUEsUUFBTVIsR0FBRyxHQUFHLE1BQU1JLGlCQUFFQyxLQUFGLENBQVFJLElBQVIsQ0FBYyxRQUFkLEVBQXVCckIscUJBQXZCLEVBQThDLENBQUNDLEVBQUQsQ0FBOUMsQ0FBbEI7QUFDQSxRQUFNZSxpQkFBRUMsS0FBRixDQUFRQyxHQUFSLENBQVlOLEdBQVosQ0FBTjtBQUVBLFFBQU1DLE1BQU0sR0FBRyxDQUFmO0FBQ0EsUUFBTUMsSUFBSSxHQUFHLENBQWI7QUFDQSxRQUFNRSxpQkFBRUMsS0FBRixDQUFRSSxJQUFSLENBQWMsZ0JBQWQsRUFBK0JWLGdCQUEvQixFQUFpRCxDQUFDVixFQUFELEVBQUtXLEdBQUwsRUFBVUMsTUFBVixFQUFrQkMsSUFBbEIsQ0FBakQsQ0FBTjtBQUNELENBVEQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuXG5jb25zdCBnZXRJZHNGcm9tUmVsYXRpb25XYXkgPSBhc3luYyAocGcpID0+IHtcbiAgY29uc3Qgb3NtUmVsYXRpb25XYXlUYWJsZSA9IGBvc20ucmVsYXRpb25fd2F5YDtcbiAgY29uc3Qgc3FsID0gYHNlbGVjdCBkaXN0aW5jdCBpZCBmcm9tICR7b3NtUmVsYXRpb25XYXlUYWJsZX0gb3JkZXIgYnkgaWQgYXNjYDtcbiAgY29uc3QgcmVzID0gYXdhaXQgcGcucXVlcnkoc3FsKVxuICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICByZXR1cm4gcmVzLnJvd3M7XG4gICAgfSlcbiAgO1xuICByZXR1cm4gcmVzLm1hcChpdGVtID0+ICtpdGVtLmlkKTtcbn07XG5cblxuY29uc3QgZHVtcFJlbGF0aW9uV2F5cyA9IGFzeW5jIChwZywgaWRzLCBmcm9tSWQsIHRvSWQpID0+IHtcbiAgY29uc3Qgb3NtUmVsYXRpb25EdW1wVGFibGUgPSAnb3NtLnJlbGF0aW9uX2R1bXAnO1xuICBjb25zdCBvc21SZWxhdGlvbldheVRhYmxlID0gYG9zbS5yZWxhdGlvbl93YXlgO1xuICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgb3V0ZXJfbGluZV91bmlvbiBhcyAoXG4gICAgc2VsZWN0IHJlbGF0aW9uX2lkLCBzdF91bmlvbihnZW9tKSBhcyBnZW9tIGZyb20gJHtvc21SZWxhdGlvbldheVRhYmxlfSBcbiAgICB3aGVyZSBpZCA9ICQxIGFuZCByb2xlID0gJ291dGVyJyBcbiAgICBncm91cCBieSByZWxhdGlvbl9pZFxuICApXG4gICwgb3V0ZXJfcG9seWdvbl91bmlvbiBhcyAoXG4gICAgc2VsZWN0IHJlbGF0aW9uX2lkLCBzdF9tdWx0aShzdF9wb2x5Z29uaXplKGdlb20pKSBhcyBnZW9tIFxuICAgIGZyb20gb3V0ZXJfbGluZV91bmlvbiBcbiAgICBncm91cCBieSByZWxhdGlvbl9pZFxuICApXG4gICwgb3V0ZXJfcG9seWdvbl9kdW1wIGFzIChcbiAgICBzZWxlY3QgcmVsYXRpb25faWQsIChzdF9kdW1wKGdlb20pKS5nZW9tIGFzIGdlb20sIChzdF9kdW1wKGdlb20pKS5wYXRoWzFdIGFzIHBhdGggXG4gICAgZnJvbSBvdXRlcl9wb2x5Z29uX3VuaW9uXG4gIClcbiAgLCBpbm5lcl9saW5lX3VuaW9uIGFzIChcbiAgICBzZWxlY3QgcmVsYXRpb25faWQsIHN0X3VuaW9uKGdlb20pIGFzIGdlb20gZnJvbSAke29zbVJlbGF0aW9uV2F5VGFibGV9IFxuICAgIHdoZXJlIGlkID0gJDEgYW5kIHJvbGUgPSAnaW5uZXInXG4gICAgZ3JvdXAgYnkgcmVsYXRpb25faWRcbiAgKVxuICAsIGlubmVyX3BvbHlnb25fdW5pb24gYXMgKFxuICAgIHNlbGVjdCByZWxhdGlvbl9pZCwgc3RfbXVsdGkoc3RfcG9seWdvbml6ZShnZW9tKSkgYXMgZ2VvbSBcbiAgICBmcm9tIGlubmVyX2xpbmVfdW5pb25cbiAgICBncm91cCBieSByZWxhdGlvbl9pZFxuICApXG4gICwgaW5uZXJfcG9seWdvbl9kdW1wIGFzIChcbiAgICBzZWxlY3QgcmVsYXRpb25faWQsIChzdF9kdW1wKGdlb20pKS5nZW9tIGFzIGdlb20sIChzdF9kdW1wKGdlb20pKS5wYXRoWzFdIGFzIHBhdGggXG4gICAgZnJvbSBpbm5lcl9wb2x5Z29uX3VuaW9uXG4gIClcbiAgLCBhbGxfcG9seWdvbl9kdW1wIGFzIChcbiAgICBzZWxlY3QgcGF0aCwgJDE6OmJpZ2ludCBhcyBpZCwgcmVsYXRpb25faWQsICdvdXRlcicgYXMgcm9sZSwgXG4gICAgZ2VvbSwgc3RfZ2VvbWV0cnl0eXBlKGdlb20pIGFzIHR5cGUsIFxuICAgIHN0X2FyZWEoZ2VvbTo6Z2VvZ3JhcGh5KSAvIDEwMDAwMDAgYXMgYXJlYVxuICAgIGZyb20gb3V0ZXJfcG9seWdvbl9kdW1wXG4gICAgdW5pb24gYWxsIFxuICAgIHNlbGVjdCBwYXRoLCAkMTo6YmlnaW50IGFzIGlkLCByZWxhdGlvbl9pZCwgJ2lubmVyJyBhcyByb2xlLCBcbiAgICBnZW9tLCBzdF9nZW9tZXRyeXR5cGUoZ2VvbSkgYXMgdHlwZSwgXG4gICAgc3RfYXJlYShnZW9tOjpnZW9ncmFwaHkpIC8gMTAwMDAwMCBhcyBhcmVhXG4gICAgZnJvbSBpbm5lcl9wb2x5Z29uX2R1bXBcbiAgKVxuICBpbnNlcnQgaW50byAke29zbVJlbGF0aW9uRHVtcFRhYmxlfSAocGF0aCwgaWQsIHJlbGF0aW9uX2lkLCByb2xlLCBnZW9tLCBhcmVhKVxuICBzZWxlY3QgcGF0aCwgaWQsIHJlbGF0aW9uX2lkLCByb2xlLCBnZW9tLCBhcmVhIGZyb20gYWxsX3BvbHlnb25fZHVtcFxuICBvbiBjb25mbGljdCAoaWQsIHJlbGF0aW9uX2lkLCByb2xlLCBwYXRoKSBkbyB1cGRhdGUgc2V0IFxuICBnZW9tID0gZXhjbHVkZWQuZ2VvbSwgYXJlYSA9IGV4Y2x1ZGVkLmFyZWFgO1xuICBmb3IgYXdhaXQgKGNvbnN0IGlkIG9mIGlkcykge1xuICAgIC8vIGlkIOKIiCBbZnJvbUlkLCB0b0lkXVxuICAgIGlmIChpZCA+PSBmcm9tSWQgJiYgKCF0b0lkIHx8IGlkIDw9IHRvSWQpKSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHtvc21SZWxhdGlvbkR1bXBUYWJsZX0gd2hlcmUgaWQgPSAkMWAsIFtpZF0pO1xuICAgICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWRdKTtcbiAgICAgIGF3YWl0ICQuVXRpbHMubG9nKGAjJHtpZH1gLCAn5YeG5aSH5pWw5o2uJyk7XG4gICAgfVxuICB9XG59O1xuXG5cbihhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHBnID0gYXdhaXQgJC5QZ1NRTC5wb29sKCdsb2NhbGhvc3QnKTtcblxuICBjb25zdCBpZHMgPSBhd2FpdCAkLlV0aWxzLmNhbGwoYOiOt+WPlklE5YiX6KGoYCwgZ2V0SWRzRnJvbVJlbGF0aW9uV2F5LCBbcGddKTtcbiAgYXdhaXQgJC5VdGlscy5sb2coaWRzKTtcblxuICBjb25zdCBmcm9tSWQgPSAwO1xuICBjb25zdCB0b0lkID0gMDtcbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDlr7zlh7pSZWxhdGlvbiBXYXlgLCBkdW1wUmVsYXRpb25XYXlzLCBbcGcsIGlkcywgZnJvbUlkLCB0b0lkXSk7XG59KSgpOyJdfQ==