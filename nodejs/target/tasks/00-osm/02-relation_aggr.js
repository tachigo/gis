'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const aggregateRelation = async (pg, ids, fromId, toId) => {
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
};

const getIdsFromRelationWay = async pg => {
  const osmRelationDumpTable = `osm.relation_dump`;
  const sql = `select distinct id from ${osmRelationDumpTable} order by id asc`;
  const res = await pg.query(sql).then(res => {
    return res.rows;
  });
  return res.map(item => +item.id);
};

(async () => {
  const pg = await _modules.default.PgSQL.pool('localhost');
  const ids = await _modules.default.Utils.call(`获取ID列表`, getIdsFromRelationWay, [pg]);
  await _modules.default.Utils.log(ids);
  const fromId = 0;
  const toId = 0;
  await _modules.default.Utils.call(`聚合Relation`, aggregateRelation, [pg, ids, fromId, toId]);
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMC1vc20vMDItcmVsYXRpb25fYWdnci5qcyJdLCJuYW1lcyI6WyJhZ2dyZWdhdGVSZWxhdGlvbiIsInBnIiwiaWRzIiwiZnJvbUlkIiwidG9JZCIsIm9zbVJlbGF0aW9uQWdnclRhYmxlIiwib3NtUmVsYXRpb25EdW1wVGFibGUiLCJpZCIsInNxbDEiLCJyb3dzIiwicXVlcnkiLCJ0aGVuIiwicmVzIiwiaW5kZXgiLCJyb3ciLCJwYXRoIiwicmVsYXRpb25JZCIsInJvbGUiLCJzcWwyIiwic3FsIiwiJCIsIlV0aWxzIiwibG9nIiwiT1NNIiwiZ2V0Q291bnRyeVRyZWUiLCJlYWNoIiwidiIsImxldmVsIiwicGFyZW50SWQiLCJrZXkiLCJpc28iLCJ6aE5hbWUiLCJlbk5hbWUiLCJvc21SZWxhdGlvbklkcyIsImpvaW4iLCJnZXRJZHNGcm9tUmVsYXRpb25XYXkiLCJtYXAiLCJpdGVtIiwiUGdTUUwiLCJwb29sIiwiY2FsbCJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBR0E7Ozs7QUFFQSxNQUFNQSxpQkFBaUIsR0FBRyxPQUFPQyxFQUFQLEVBQVdDLEdBQVgsRUFBZ0JDLE1BQWhCLEVBQXdCQyxJQUF4QixLQUFpQztBQUN6RCxRQUFNQyxvQkFBb0IsR0FBSSx3QkFBOUI7QUFDQSxRQUFNQyxvQkFBb0IsR0FBRyxtQkFBN0I7O0FBQ0EsYUFBVyxNQUFNQyxFQUFqQixJQUF1QkwsR0FBdkIsRUFBNEI7QUFDMUI7QUFDQSxRQUFJSyxFQUFFLElBQUlKLE1BQU4sS0FBaUIsQ0FBQ0MsSUFBRCxJQUFTRyxFQUFFLElBQUlILElBQWhDLENBQUosRUFBMkM7QUFDekMsWUFBTUksSUFBSSxHQUFJLDJDQUEwQ0Ysb0JBQXFCLG1DQUE3RTtBQUNBLFlBQU1HLElBQUksR0FBRyxNQUFNUixFQUFFLENBQ2xCUyxLQURnQixDQUNWRixJQURVLEVBQ0osQ0FBQ0QsRUFBRCxDQURJLEVBRWhCSSxJQUZnQixDQUVYQyxHQUFHLElBQUk7QUFDWCxl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ZSxDQUNWQyxHQUFHLElBQUk7QUFDWCxXQUFPQSxHQUFHLENBQUNILElBQVg7QUFDRCxHQUhlLENBQWxCO0FBS0EsU0FBT0csR0FBRyxDQUFDd0IsR0FBSixDQUFRQyxJQUFJLElBQUksQ0FBQ0EsSUFBSSxDQUFDOUIsRUFBdEIsQ0FBUDtBQUNELENBVEQ7O0FBV0EsQ0FBQyxZQUFZO0FBQ1gsUUFBTU4sRUFBRSxHQUFHLE1BQU1tQixpQkFBRWtCLEtBQUYsQ0FBUUMsSUFBUixDQUFhLFdBQWIsQ0FBakI7QUFFQSxRQUFNckMsR0FBRyxHQUFHLE1BQU1rQixpQkFBRUMsS0FBRixDQUFRbUIsSUFBUixDQUFjLFFBQWQsRUFBdUJMLHFCQUF2QixFQUE4QyxDQUFDbEMsRUFBRCxDQUE5QyxDQUFsQjtBQUNBLFFBQU1tQixpQkFBRUMsS0FBRixDQUFRQyxHQUFSLENBQVlwQixHQUFaLENBQU47QUFFQSxRQUFNQyxNQUFNLEdBQUcsQ0FBZjtBQUNBLFFBQU1DLElBQUksR0FBRyxDQUFiO0FBQ0EsUUFBTWdCLGlCQUFFQyxLQUFGLENBQVFtQixJQUFSLENBQWMsWUFBZCxFQUEyQnhDLGlCQUEzQixFQUE4QyxDQUFDQyxFQUFELEVBQUtDLEdBQUwsRUFBVUMsTUFBVixFQUFrQkMsSUFBbEIsQ0FBOUMsQ0FBTjtBQUVELENBVkQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuY29uc3QgYWdncmVnYXRlUmVsYXRpb24gPSBhc3luYyAocGcsIGlkcywgZnJvbUlkLCB0b0lkKSA9PiB7XG4gIGNvbnN0IG9zbVJlbGF0aW9uQWdnclRhYmxlID0gYG9zbS5yZWxhdGlvbl9hZ2dyZWdhdGVgO1xuICBjb25zdCBvc21SZWxhdGlvbkR1bXBUYWJsZSA9ICdvc20ucmVsYXRpb25fZHVtcCc7XG4gIGZvciBhd2FpdCAoY29uc3QgaWQgb2YgaWRzKSB7XG4gICAgLy8gaWQg4oiIIFtmcm9tSWQsIHRvSWRdXG4gICAgaWYgKGlkID49IGZyb21JZCAmJiAoIXRvSWQgfHwgaWQgPD0gdG9JZCkpIHtcbiAgICAgIGNvbnN0IHNxbDEgPSBgc2VsZWN0IHBhdGgsIGlkLCByZWxhdGlvbl9pZCwgcm9sZSBmcm9tICR7b3NtUmVsYXRpb25EdW1wVGFibGV9IHdoZXJlIGlkID0gJDEgb3JkZXIgYnkgYXJlYSBkZXNjYDtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgICAucXVlcnkoc3FsMSwgW2lkXSlcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBsZXQgaW5kZXggPSAwO1xuICAgICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICBpbmRleCArPSAxO1xuICAgICAgICBjb25zdCBwYXRoID0gcm93WydwYXRoJ107XG4gICAgICAgIGNvbnN0IHJlbGF0aW9uSWQgPSByb3dbJ3JlbGF0aW9uX2lkJ107XG4gICAgICAgIGNvbnN0IHJvbGUgPSByb3dbJ3JvbGUnXTtcbiAgICAgICAgaWYgKGluZGV4ID09PSAxKSB7XG4gICAgICAgICAgY29uc3Qgc3FsMSA9IGBkZWxldGUgZnJvbSAke29zbVJlbGF0aW9uQWdnclRhYmxlfSB3aGVyZSBpZCA9ICQxYDtcbiAgICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwxLCBbaWRdKTtcbiAgICAgICAgICBjb25zdCBzcWwyID0gYHdpdGggXG4gICAgICAgICAgdGEgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGlkLCBzdF9tYWtldmFsaWQoZ2VvbSkgYXMgZ2VvbSBmcm9tICR7b3NtUmVsYXRpb25EdW1wVGFibGV9IFxuICAgICAgICAgICAgd2hlcmUgaWQgPSAkMSBhbmQgcmVsYXRpb25faWQgPSAkMiBhbmQgcGF0aCA9ICQzIGFuZCByb2xlID0gJDRcbiAgICAgICAgICApXG4gICAgICAgICAgaW5zZXJ0IGludG8gJHtvc21SZWxhdGlvbkFnZ3JUYWJsZX0gKGlkLCBnZW9tKSBcbiAgICAgICAgICBzZWxlY3QgaWQsIHN0X211bHRpKGdlb20pIGFzIGdlb20gZnJvbSB0YSBcbiAgICAgICAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgXG4gICAgICAgICAgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuICAgICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbDIsIFtpZCwgcmVsYXRpb25JZCwgcGF0aCwgcm9sZV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyb2xlID09PSAnb3V0ZXInKSB7XG4gICAgICAgICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgICAgICAgdGEgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGlkLCBzdF9tYWtldmFsaWQoZ2VvbSkgYXMgZ2VvbSBmcm9tICR7b3NtUmVsYXRpb25BZ2dyVGFibGV9IHdoZXJlIGlkID0gJDFcbiAgICAgICAgICApXG4gICAgICAgICAgLCB0YiBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgaWQsIHN0X21ha2V2YWxpZChnZW9tKSBhcyBnZW9tIGZyb20gJHtvc21SZWxhdGlvbkR1bXBUYWJsZX0gXG4gICAgICAgICAgICB3aGVyZSBpZCA9ICQxIGFuZCByZWxhdGlvbl9pZCA9ICQyIGFuZCBwYXRoID0gJDMgYW5kIHJvbGUgPSAkNFxuICAgICAgICAgIClcbiAgICAgICAgICAsIHRjIGFzIChcbiAgICAgICAgICAgIHNlbGVjdCB0Yi5pZCBhcyBpZCwgc3RfdW5pb24odGEuZ2VvbSwgdGIuZ2VvbSkgYXMgZ2VvbSBcbiAgICAgICAgICAgIGZyb20gdGEgbGVmdCBqb2luIHRiIFxuICAgICAgICAgICAgb24gdGEuaWQgPSB0Yi5pZCBcbiAgICAgICAgICApXG4gICAgICAgICAgaW5zZXJ0IGludG8gJHtvc21SZWxhdGlvbkFnZ3JUYWJsZX0gKGlkLCBnZW9tKSBcbiAgICAgICAgICBzZWxlY3QgaWQsIHN0X211bHRpKGdlb20pIGFzIGdlb20gZnJvbSB0YyBcbiAgICAgICAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgXG4gICAgICAgICAgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuICAgICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkLCByZWxhdGlvbklkLCBwYXRoLCByb2xlXSk7XG4gICAgICAgIH0gZWxzZSBpZiAocm9sZSA9PT0gJ2lubmVyJykge1xuICAgICAgICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgICAgICAgIHRhIGFzIChcbiAgICAgICAgICAgIHNlbGVjdCBpZCwgc3RfbWFrZXZhbGlkKGdlb20pIGFzIGdlb20gZnJvbSAke29zbVJlbGF0aW9uQWdnclRhYmxlfSB3aGVyZSBpZCA9ICQxXG4gICAgICAgICAgKVxuICAgICAgICAgICwgdGIgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGlkLCBzdF9tYWtldmFsaWQoZ2VvbSkgYXMgZ2VvbSBmcm9tICR7b3NtUmVsYXRpb25EdW1wVGFibGV9IFxuICAgICAgICAgICAgd2hlcmUgaWQgPSAkMSBhbmQgcmVsYXRpb25faWQgPSAkMiBhbmQgcGF0aCA9ICQzIGFuZCByb2xlID0gJDRcbiAgICAgICAgICApXG4gICAgICAgICAgLCB0YyBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgdGIuaWQgYXMgaWQsIHN0X2RpZmZlcmVuY2UodGEuZ2VvbSwgdGIuZ2VvbSkgYXMgZ2VvbSBmcm9tIHRhIGxlZnQgam9pbiB0YiBcbiAgICAgICAgICAgIG9uIHRhLmlkID0gdGIuaWQgXG4gICAgICAgICAgKVxuICAgICAgICAgIGluc2VydCBpbnRvICR7b3NtUmVsYXRpb25BZ2dyVGFibGV9IChpZCwgZ2VvbSkgXG4gICAgICAgICAgc2VsZWN0IGlkLCBzdF9tdWx0aShnZW9tKSBhcyBnZW9tIGZyb20gdGMgXG4gICAgICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IFxuICAgICAgICAgIGdlb20gPSBleGNsdWRlZC5nZW9tYDtcbiAgICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZCwgcmVsYXRpb25JZCwgcGF0aCwgcm9sZV0pO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0ICQuVXRpbHMubG9nKGAjJHtpZH1gLCAn6IGa5ZCI5pWw5o2uJyk7XG4gICAgICB9XG4gICAgICBhd2FpdCAkLk9TTS5nZXRDb3VudHJ5VHJlZSgpLmVhY2goYXN5bmMgKGluZGV4LCB2LCBsZXZlbCwgcGFyZW50SWQpID0+IHtcbiAgICAgICAgY29uc3Qga2V5ID0gaW5kZXggKyA5MDAwMDA7XG4gICAgICAgIGlmIChrZXkgPT09IGlkKSB7XG4gICAgICAgICAgY29uc3Qgc3FsID0gYHVwZGF0ZSAke29zbVJlbGF0aW9uQWdnclRhYmxlfSBzZXQgXG4gICAgICAgICAgcGFyZW50X2lkID0gJDE6OmJpZ2ludCwgbGV2ZWwgPSAkMjo6aW50ZWdlciwgaXNvID0gJDM6OnZhcmNoYXIsIFxuICAgICAgICAgIHpoX25hbWUgPSAkNDo6dmFyY2hhciwgZW5fbmFtZSA9ICQ1Ojp2YXJjaGFyLCBvc21faWRzID0gJDY6OmJpZ2ludFtdIFxuICAgICAgICAgIHdoZXJlIGlkID0gJDdgO1xuICAgICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW1xuICAgICAgICAgICAgcGFyZW50SWQsIGxldmVsLCB2Lmlzbywgdi56aE5hbWUsIHYuZW5OYW1lLCBgeyR7di5vc21SZWxhdGlvbklkcy5qb2luKCcsJyl9fWAsIGlkXG4gICAgICAgICAgXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufTtcblxuY29uc3QgZ2V0SWRzRnJvbVJlbGF0aW9uV2F5ID0gYXN5bmMgKHBnKSA9PiB7XG4gIGNvbnN0IG9zbVJlbGF0aW9uRHVtcFRhYmxlID0gYG9zbS5yZWxhdGlvbl9kdW1wYDtcbiAgY29uc3Qgc3FsID0gYHNlbGVjdCBkaXN0aW5jdCBpZCBmcm9tICR7b3NtUmVsYXRpb25EdW1wVGFibGV9IG9yZGVyIGJ5IGlkIGFzY2A7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IHBnLnF1ZXJ5KHNxbClcbiAgICAudGhlbihyZXMgPT4ge1xuICAgICAgcmV0dXJuIHJlcy5yb3dzO1xuICAgIH0pXG4gIDtcbiAgcmV0dXJuIHJlcy5tYXAoaXRlbSA9PiAraXRlbS5pZCk7XG59O1xuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBwZyA9IGF3YWl0ICQuUGdTUUwucG9vbCgnbG9jYWxob3N0Jyk7XG5cbiAgY29uc3QgaWRzID0gYXdhaXQgJC5VdGlscy5jYWxsKGDojrflj5ZJROWIl+ihqGAsIGdldElkc0Zyb21SZWxhdGlvbldheSwgW3BnXSk7XG4gIGF3YWl0ICQuVXRpbHMubG9nKGlkcyk7XG5cbiAgY29uc3QgZnJvbUlkID0gMDtcbiAgY29uc3QgdG9JZCA9IDA7XG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg6IGa5ZCIUmVsYXRpb25gLCBhZ2dyZWdhdGVSZWxhdGlvbiwgW3BnLCBpZHMsIGZyb21JZCwgdG9JZF0pO1xuXG59KSgpOyJdfQ==