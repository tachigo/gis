'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  await _modules.default.Utils.call(`遍历OSM 国家树`, async () => {
    const pg = await _modules.default.PgSQL.pool('localhost');
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
  });
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMC1vc20vMDAtcmVsYXRpb25fd2F5LmpzIl0sIm5hbWVzIjpbIiQiLCJVdGlscyIsImNhbGwiLCJwZyIsIlBnU1FMIiwicG9vbCIsIm9zbVJlbGF0aW9uV2F5VGFibGUiLCJzcWwiLCJmcm9tSWQiLCJ0b0lkIiwiT1NNIiwiZ2V0Q291bnRyeVRyZWUiLCJlYWNoIiwiaW5kZXgiLCJ2IiwibGV2ZWwiLCJwYXJlbnRJZCIsImRlc2MiLCJpZCIsInVuc2hpZnQiLCJsb2ciLCJkaWN0IiwicmVsYXRpb25GdWxsIiwib3NtUmVsYXRpb25JZHMiLCJhcnIiLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwib3NtSWQiLCJvYmoiLCJyZWxhdGlvbldheXMiLCJyZWxhdGlvbldheSIsInJlbGF0aW9uSWQiLCJyZWxhdGlvbiIsIndheUlkIiwid2F5Iiwid2F5Um9sZSIsInJvbGUiLCJnZW9Kc29uIiwiSlNPTiIsInN0cmluZ2lmeSIsImdlb21ldHJ5IiwicGFyYW1zIiwicXVlcnkiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOzs7O0FBRUEsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsaUJBQUVDLEtBQUYsQ0FBUUMsSUFBUixDQUFjLFdBQWQsRUFBMEIsWUFBWTtBQUMxQyxVQUFNQyxFQUFFLEdBQUcsTUFBTUgsaUJBQUVJLEtBQUYsQ0FBUUMsSUFBUixDQUFhLFdBQWIsQ0FBakI7QUFDQSxVQUFNQyxtQkFBbUIsR0FBSSxrQkFBN0I7QUFDQSxVQUFNQyxHQUFHLEdBQUk7Ozs7Ozs7OztrQkFTQ0QsbUJBQW9COzs7aUVBVGxDO0FBYUEsVUFBTUUsTUFBTSxHQUFHLENBQWY7QUFDQSxVQUFNQyxJQUFJLEdBQUcsQ0FBYjtBQUNBLFVBQU1ULGlCQUFFVSxHQUFGLENBQU1DLGNBQU4sR0FBdUJDLElBQXZCLENBQTRCLE9BQU9DLEtBQVAsRUFBY0MsQ0FBZCxFQUFpQkMsS0FBakIsRUFBd0JDLFFBQXhCLEVBQWtDQyxJQUFsQyxLQUEyQztBQUMzRSxZQUFNQyxFQUFFLEdBQUdMLEtBQUssR0FBRyxNQUFuQjtBQUNBSSxNQUFBQSxJQUFJLENBQUNFLE9BQUwsQ0FBYSxNQUFiO0FBQ0FGLE1BQUFBLElBQUksQ0FBQ0UsT0FBTCxDQUFhRCxFQUFiLEVBSDJFLENBSTNFOztBQUNBLFVBQUlBLEVBQUUsSUFBSVYsTUFBTixLQUFpQixDQUFDQyxJQUFELElBQVNTLEVBQUUsSUFBSVQsSUFBaEMsQ0FBSixFQUEyQztBQUN6QyxjQUFNVCxpQkFBRUMsS0FBRixDQUFRbUIsR0FBUixDQUFZLEdBQUdILElBQWYsRUFBcUIsTUFBckIsQ0FBTjtBQUNBLGNBQU1JLElBQUksR0FBRyxNQUFNckIsaUJBQUVVLEdBQUYsQ0FBTVksWUFBTixDQUFtQlIsQ0FBQyxDQUFDUyxjQUFyQixDQUFuQjtBQUNBLGNBQU1DLEdBQUcsR0FBR0MsTUFBTSxDQUFDQyxJQUFQLENBQVlMLElBQVosQ0FBWjs7QUFDQSxZQUFJRyxHQUFHLENBQUNHLE1BQUosR0FBYSxDQUFqQixFQUFvQjtBQUNsQixnQkFBTTNCLGlCQUFFQyxLQUFGLENBQVFtQixHQUFSLENBQVksR0FBR0gsSUFBZixFQUFxQixhQUFyQixDQUFOOztBQUNBLHFCQUFXLE1BQU1XLEtBQWpCLElBQTBCSixHQUExQixFQUErQjtBQUM3QixrQkFBTUssR0FBRyxHQUFHUixJQUFJLENBQUNPLEtBQUQsQ0FBaEI7QUFDQSxrQkFBTUUsWUFBWSxHQUFHLE1BQU05QixpQkFBRVUsR0FBRixDQUFNb0IsWUFBTixDQUFtQkYsS0FBbkIsRUFBMEJDLEdBQTFCLENBQTNCOztBQUNBLHVCQUFXLE1BQU1FLFdBQWpCLElBQWdDRCxZQUFoQyxFQUE4QztBQUM1QyxvQkFBTUUsVUFBVSxHQUFHRCxXQUFXLENBQUNFLFFBQS9CO0FBQ0Esb0JBQU1DLEtBQUssR0FBR0gsV0FBVyxDQUFDSSxHQUExQjtBQUNBLG9CQUFNQyxPQUFPLEdBQUdMLFdBQVcsQ0FBQ00sSUFBNUI7QUFDQSxvQkFBTUMsT0FBTyxHQUFHQyxJQUFJLENBQUNDLFNBQUwsQ0FBZVQsV0FBVyxDQUFDVSxRQUEzQixDQUFoQjtBQUNBLG9CQUFNQyxNQUFNLEdBQUcsQ0FDWixJQUFHVixVQUFXLEVBREYsRUFDTSxJQUFHRSxLQUFNLEVBRGYsRUFDa0JoQixFQURsQixFQUNzQmtCLE9BRHRCLEVBQytCRSxPQUQvQixDQUFmO0FBR0Esb0JBQU1uQyxFQUFFLENBQUN3QyxLQUFILENBQVNwQyxHQUFULEVBQWNtQyxNQUFkLENBQU47QUFDQSxvQkFBTTFDLGlCQUFFQyxLQUFGLENBQVFtQixHQUFSLENBQWEsSUFBR1ksVUFBVyxFQUEzQixFQUErQixJQUFHRSxLQUFNLEVBQXhDLEVBQTJDaEIsRUFBM0MsRUFBK0NrQixPQUEvQyxDQUFOO0FBQ0Q7QUFDRjtBQUNGO0FBQ0Y7QUFDRixLQTVCSyxDQUFOO0FBNkJELEdBL0NLLENBQU47QUFnREQsQ0FqREQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuKGFzeW5jICgpID0+IHtcbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDpgY3ljoZPU00g5Zu95a625qCRYCwgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHBnID0gYXdhaXQgJC5QZ1NRTC5wb29sKCdsb2NhbGhvc3QnKTtcbiAgICBjb25zdCBvc21SZWxhdGlvbldheVRhYmxlID0gYG9zbS5yZWxhdGlvbl93YXlgO1xuICAgIGNvbnN0IHNxbCA9IGB3aXRoXG4gICAgdGEgYXMgKFxuICAgICAgc2VsZWN0XG4gICAgICAkMTo6dmFyY2hhciBhcyByZWxhdGlvbl9pZCxcbiAgICAgICQyOjp2YXJjaGFyIGFzIHdheV9pZCxcbiAgICAgICQzOjpiaWdpbnQgYXMgaWQsXG4gICAgICAkNDo6dmFyY2hhciBhcyByb2xlLFxuICAgICAgc3Rfc2V0c3JpZChzdF9nZW9tZnJvbWdlb2pzb24oJDUpLCA0MzI2KSBhcyBnZW9tXG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7b3NtUmVsYXRpb25XYXlUYWJsZX0gKHJlbGF0aW9uX2lkLCB3YXlfaWQsIGlkLCByb2xlLCBnZW9tKVxuICAgIHNlbGVjdCByZWxhdGlvbl9pZCwgd2F5X2lkLCBpZCwgcm9sZSwgZ2VvbSBmcm9tIHRhXG4gICAgb24gY29uZmxpY3QgKHJlbGF0aW9uX2lkLCB3YXlfaWQpIGRvIHVwZGF0ZSBzZXRcbiAgICBpZCA9IGV4Y2x1ZGVkLmlkLCByb2xlID0gZXhjbHVkZWQucm9sZSwgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuICAgIGNvbnN0IGZyb21JZCA9IDA7XG4gICAgY29uc3QgdG9JZCA9IDA7XG4gICAgYXdhaXQgJC5PU00uZ2V0Q291bnRyeVRyZWUoKS5lYWNoKGFzeW5jIChpbmRleCwgdiwgbGV2ZWwsIHBhcmVudElkLCBkZXNjKSA9PiB7XG4gICAgICBjb25zdCBpZCA9IGluZGV4ICsgOTAwMDAwO1xuICAgICAgZGVzYy51bnNoaWZ0KCcgPD0gJyk7XG4gICAgICBkZXNjLnVuc2hpZnQoaWQpO1xuICAgICAgLy8gaWQg4oiIIFtmcm9tSWQsIHRvSWRdXG4gICAgICBpZiAoaWQgPj0gZnJvbUlkICYmICghdG9JZCB8fCBpZCA8PSB0b0lkKSkge1xuICAgICAgICBhd2FpdCAkLlV0aWxzLmxvZyguLi5kZXNjLCAn5p+l6K+i5pWw5o2uJyk7XG4gICAgICAgIGNvbnN0IGRpY3QgPSBhd2FpdCAkLk9TTS5yZWxhdGlvbkZ1bGwodi5vc21SZWxhdGlvbklkcyk7XG4gICAgICAgIGNvbnN0IGFyciA9IE9iamVjdC5rZXlzKGRpY3QpO1xuICAgICAgICBpZiAoYXJyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBhd2FpdCAkLlV0aWxzLmxvZyguLi5kZXNjLCAn5o6l5pS25Yiw5pWw5o2uLCDlh4blpIflhaXlupMnKTtcbiAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IG9zbUlkIG9mIGFycikge1xuICAgICAgICAgICAgY29uc3Qgb2JqID0gZGljdFtvc21JZF07XG4gICAgICAgICAgICBjb25zdCByZWxhdGlvbldheXMgPSBhd2FpdCAkLk9TTS5yZWxhdGlvbldheXMob3NtSWQsIG9iaik7XG4gICAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IHJlbGF0aW9uV2F5IG9mIHJlbGF0aW9uV2F5cykge1xuICAgICAgICAgICAgICBjb25zdCByZWxhdGlvbklkID0gcmVsYXRpb25XYXkucmVsYXRpb247XG4gICAgICAgICAgICAgIGNvbnN0IHdheUlkID0gcmVsYXRpb25XYXkud2F5O1xuICAgICAgICAgICAgICBjb25zdCB3YXlSb2xlID0gcmVsYXRpb25XYXkucm9sZTtcbiAgICAgICAgICAgICAgY29uc3QgZ2VvSnNvbiA9IEpTT04uc3RyaW5naWZ5KHJlbGF0aW9uV2F5Lmdlb21ldHJ5KTtcbiAgICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gW1xuICAgICAgICAgICAgICAgIGByJHtyZWxhdGlvbklkfWAsIGB3JHt3YXlJZH1gLCBpZCwgd2F5Um9sZSwgZ2VvSnNvblxuICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIHBhcmFtcyk7XG4gICAgICAgICAgICAgIGF3YWl0ICQuVXRpbHMubG9nKGByJHtyZWxhdGlvbklkfWAsIGB3JHt3YXlJZH1gLCBpZCwgd2F5Um9sZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufSkoKTsiXX0=