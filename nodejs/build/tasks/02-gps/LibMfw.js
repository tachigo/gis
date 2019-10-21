'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _modules = _interopRequireDefault(require("./../../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class LibMfw {
  static async mapForeignData(pg) {
    await _modules.default.OSM.getCountryTree().each(async (index, item) => {
      const id = index + 900000;
      let mddId = 0;
      let name = item.zhName;

      if (item.mfwId !== undefined) {
        const regionId = item.mfwId;

        if (regionId > 0) {
          const data = await _modules.default.Mfw.getRegionRestFul().getRegionInfo(regionId);
          mddId = data['mddid'];

          if (data['cname'] && data['cname'].length > 0) {
            name = data['cname'];
          }
        }

        console.log(id, name, mddId, regionId);
        const fromTable = 'gps.world';
        const toTable = 'gps.mfw';
        const sql = `insert into ${toTable} 
        (id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id) 
        select 
        id, parent_id, key, level, iso, $1::varchar as zh_name, en_name, geom, 
        $2::bigint as region_id, $3::bigint as mdd_id  
        from ${fromTable} where id = $4 
        on conflict (id) do update set 
        parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso,
        zh_name = excluded.zh_name, en_name = excluded.en_name, 
        geom = excluded.geom, mdd_id = excluded.mdd_id, region_id = excluded.region_id`;
        await pg.query(sql, [name, regionId, mddId, id]);
      }
    });
  }

  static async mapChinaCountryData(pg) {
    const fromTable = 'gps.world';
    const toTable = 'gps.mfw'; // 中国

    const chinaRegionId = 17348;
    let data = await _modules.default.Mfw.getRegionRestFul().getRegionInfo(chinaRegionId);
    let mddId = data['mddid'];
    let name = data['cname'];
    console.log(1, name, mddId, chinaRegionId);
    const sql = `insert into ${toTable} 
    (id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id) 
    select 
    id, parent_id, key, level, iso, $1::varchar as zh_name, en_name, geom, 
    $2::bigint as region_id, $3::bigint as mdd_id  
    from ${fromTable} where id = $4 
    on conflict (id) do update set 
    parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso,
    zh_name = excluded.zh_name, en_name = excluded.en_name, 
    geom = excluded.geom, mdd_id = excluded.mdd_id, region_id = excluded.region_id`;
    await pg.query(sql, [name, chinaRegionId, mddId, 1]);
  }

}

var _default = LibMfw;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMi1ncHMvTGliTWZ3LmpzIl0sIm5hbWVzIjpbIkxpYk1mdyIsIm1hcEZvcmVpZ25EYXRhIiwicGciLCIkIiwiT1NNIiwiZ2V0Q291bnRyeVRyZWUiLCJlYWNoIiwiaW5kZXgiLCJpdGVtIiwiaWQiLCJtZGRJZCIsIm5hbWUiLCJ6aE5hbWUiLCJtZndJZCIsInVuZGVmaW5lZCIsInJlZ2lvbklkIiwiZGF0YSIsIk1mdyIsImdldFJlZ2lvblJlc3RGdWwiLCJnZXRSZWdpb25JbmZvIiwibGVuZ3RoIiwiY29uc29sZSIsImxvZyIsImZyb21UYWJsZSIsInRvVGFibGUiLCJzcWwiLCJxdWVyeSIsIm1hcENoaW5hQ291bnRyeURhdGEiLCJjaGluYVJlZ2lvbklkIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQUdBOzs7O0FBRUEsTUFBTUEsTUFBTixDQUFhO0FBRVgsZUFBYUMsY0FBYixDQUE0QkMsRUFBNUIsRUFBZ0M7QUFDOUIsVUFBTUMsaUJBQUVDLEdBQUYsQ0FBTUMsY0FBTixHQUF1QkMsSUFBdkIsQ0FBNEIsT0FBT0MsS0FBUCxFQUFjQyxJQUFkLEtBQXVCO0FBQ3ZELFlBQU1DLEVBQUUsR0FBR0YsS0FBSyxHQUFHLE1BQW5CO0FBQ0EsVUFBSUcsS0FBSyxHQUFHLENBQVo7QUFDQSxVQUFJQyxJQUFJLEdBQUdILElBQUksQ0FBQ0ksTUFBaEI7O0FBQ0EsVUFBSUosSUFBSSxDQUFDSyxLQUFMLEtBQWVDLFNBQW5CLEVBQThCO0FBQzVCLGNBQU1DLFFBQVEsR0FBR1AsSUFBSSxDQUFDSyxLQUF0Qjs7QUFDQSxZQUFJRSxRQUFRLEdBQUcsQ0FBZixFQUFrQjtBQUNoQixnQkFBTUMsSUFBSSxHQUFHLE1BQU1iLGlCQUFFYyxHQUFGLENBQU1DLGdCQUFOLEdBQXlCQyxhQUF6QixDQUF1Q0osUUFBdkMsQ0FBbkI7QUFDQUwsVUFBQUEsS0FBSyxHQUFHTSxJQUFJLENBQUMsT0FBRCxDQUFaOztBQUNBLGNBQUlBLElBQUksQ0FBQyxPQUFELENBQUosSUFBaUJBLElBQUksQ0FBQyxPQUFELENBQUosQ0FBY0ksTUFBZCxHQUF1QixDQUE1QyxFQUErQztBQUM3Q1QsWUFBQUEsSUFBSSxHQUFHSyxJQUFJLENBQUMsT0FBRCxDQUFYO0FBQ0Q7QUFDRjs7QUFDREssUUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVliLEVBQVosRUFBZ0JFLElBQWhCLEVBQXNCRCxLQUF0QixFQUE2QkssUUFBN0I7QUFDQSxjQUFNUSxTQUFTLEdBQUcsV0FBbEI7QUFDQSxjQUFNQyxPQUFPLEdBQUcsU0FBaEI7QUFDQSxjQUFNQyxHQUFHLEdBQUksZUFBY0QsT0FBUTs7Ozs7ZUFLNUJELFNBQVU7Ozs7dUZBTGpCO0FBVUEsY0FBTXJCLEVBQUUsQ0FBQ3dCLEtBQUgsQ0FBU0QsR0FBVCxFQUFjLENBQUNkLElBQUQsRUFBT0ksUUFBUCxFQUFpQkwsS0FBakIsRUFBd0JELEVBQXhCLENBQWQsQ0FBTjtBQUNEO0FBQ0YsS0E1QkssQ0FBTjtBQTZCRDs7QUFHRCxlQUFha0IsbUJBQWIsQ0FBaUN6QixFQUFqQyxFQUFxQztBQUNuQyxVQUFNcUIsU0FBUyxHQUFHLFdBQWxCO0FBQ0EsVUFBTUMsT0FBTyxHQUFHLFNBQWhCLENBRm1DLENBR25DOztBQUNBLFVBQU1JLGFBQWEsR0FBRyxLQUF0QjtBQUNBLFFBQUlaLElBQUksR0FBRyxNQUFNYixpQkFBRWMsR0FBRixDQUFNQyxnQkFBTixHQUF5QkMsYUFBekIsQ0FBdUNTLGFBQXZDLENBQWpCO0FBQ0EsUUFBSWxCLEtBQUssR0FBR00sSUFBSSxDQUFDLE9BQUQsQ0FBaEI7QUFDQSxRQUFJTCxJQUFJLEdBQUdLLElBQUksQ0FBQyxPQUFELENBQWY7QUFDQUssSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVksQ0FBWixFQUFlWCxJQUFmLEVBQXFCRCxLQUFyQixFQUE0QmtCLGFBQTVCO0FBQ0EsVUFBTUgsR0FBRyxHQUFJLGVBQWNELE9BQVE7Ozs7O1dBSzVCRCxTQUFVOzs7O21GQUxqQjtBQVVBLFVBQU1yQixFQUFFLENBQUN3QixLQUFILENBQVNELEdBQVQsRUFBYyxDQUFDZCxJQUFELEVBQU9pQixhQUFQLEVBQXNCbEIsS0FBdEIsRUFBNkIsQ0FBN0IsQ0FBZCxDQUFOO0FBQ0Q7O0FBdkRVOztlQTJERVYsTSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuXG5pbXBvcnQgJCBmcm9tICcuLy4uLy4uL21vZHVsZXMnO1xuXG5jbGFzcyBMaWJNZncge1xuXG4gIHN0YXRpYyBhc3luYyBtYXBGb3JlaWduRGF0YShwZykge1xuICAgIGF3YWl0ICQuT1NNLmdldENvdW50cnlUcmVlKCkuZWFjaChhc3luYyAoaW5kZXgsIGl0ZW0pID0+IHtcbiAgICAgIGNvbnN0IGlkID0gaW5kZXggKyA5MDAwMDA7XG4gICAgICBsZXQgbWRkSWQgPSAwO1xuICAgICAgbGV0IG5hbWUgPSBpdGVtLnpoTmFtZTtcbiAgICAgIGlmIChpdGVtLm1md0lkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgcmVnaW9uSWQgPSBpdGVtLm1md0lkO1xuICAgICAgICBpZiAocmVnaW9uSWQgPiAwKSB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0ICQuTWZ3LmdldFJlZ2lvblJlc3RGdWwoKS5nZXRSZWdpb25JbmZvKHJlZ2lvbklkKTtcbiAgICAgICAgICBtZGRJZCA9IGRhdGFbJ21kZGlkJ107XG4gICAgICAgICAgaWYgKGRhdGFbJ2NuYW1lJ10gJiYgZGF0YVsnY25hbWUnXS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBuYW1lID0gZGF0YVsnY25hbWUnXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coaWQsIG5hbWUsIG1kZElkLCByZWdpb25JZCk7XG4gICAgICAgIGNvbnN0IGZyb21UYWJsZSA9ICdncHMud29ybGQnO1xuICAgICAgICBjb25zdCB0b1RhYmxlID0gJ2dwcy5tZncnO1xuICAgICAgICBjb25zdCBzcWwgPSBgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSBcbiAgICAgICAgKGlkLCBwYXJlbnRfaWQsIGtleSwgbGV2ZWwsIGlzbywgemhfbmFtZSwgZW5fbmFtZSwgZ2VvbSwgcmVnaW9uX2lkLCBtZGRfaWQpIFxuICAgICAgICBzZWxlY3QgXG4gICAgICAgIGlkLCBwYXJlbnRfaWQsIGtleSwgbGV2ZWwsIGlzbywgJDE6OnZhcmNoYXIgYXMgemhfbmFtZSwgZW5fbmFtZSwgZ2VvbSwgXG4gICAgICAgICQyOjpiaWdpbnQgYXMgcmVnaW9uX2lkLCAkMzo6YmlnaW50IGFzIG1kZF9pZCAgXG4gICAgICAgIGZyb20gJHtmcm9tVGFibGV9IHdoZXJlIGlkID0gJDQgXG4gICAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBcbiAgICAgICAgcGFyZW50X2lkID0gZXhjbHVkZWQucGFyZW50X2lkLCBrZXkgPSBleGNsdWRlZC5rZXksIGxldmVsID0gZXhjbHVkZWQubGV2ZWwsIGlzbyA9IGV4Y2x1ZGVkLmlzbyxcbiAgICAgICAgemhfbmFtZSA9IGV4Y2x1ZGVkLnpoX25hbWUsIGVuX25hbWUgPSBleGNsdWRlZC5lbl9uYW1lLCBcbiAgICAgICAgZ2VvbSA9IGV4Y2x1ZGVkLmdlb20sIG1kZF9pZCA9IGV4Y2x1ZGVkLm1kZF9pZCwgcmVnaW9uX2lkID0gZXhjbHVkZWQucmVnaW9uX2lkYDtcbiAgICAgICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbbmFtZSwgcmVnaW9uSWQsIG1kZElkLCBpZF0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgbWFwQ2hpbmFDb3VudHJ5RGF0YShwZykge1xuICAgIGNvbnN0IGZyb21UYWJsZSA9ICdncHMud29ybGQnO1xuICAgIGNvbnN0IHRvVGFibGUgPSAnZ3BzLm1mdyc7XG4gICAgLy8g5Lit5Zu9XG4gICAgY29uc3QgY2hpbmFSZWdpb25JZCA9IDE3MzQ4O1xuICAgIGxldCBkYXRhID0gYXdhaXQgJC5NZncuZ2V0UmVnaW9uUmVzdEZ1bCgpLmdldFJlZ2lvbkluZm8oY2hpbmFSZWdpb25JZCk7XG4gICAgbGV0IG1kZElkID0gZGF0YVsnbWRkaWQnXTtcbiAgICBsZXQgbmFtZSA9IGRhdGFbJ2NuYW1lJ107XG4gICAgY29uc29sZS5sb2coMSwgbmFtZSwgbWRkSWQsIGNoaW5hUmVnaW9uSWQpO1xuICAgIGNvbnN0IHNxbCA9IGBpbnNlcnQgaW50byAke3RvVGFibGV9IFxuICAgIChpZCwgcGFyZW50X2lkLCBrZXksIGxldmVsLCBpc28sIHpoX25hbWUsIGVuX25hbWUsIGdlb20sIHJlZ2lvbl9pZCwgbWRkX2lkKSBcbiAgICBzZWxlY3QgXG4gICAgaWQsIHBhcmVudF9pZCwga2V5LCBsZXZlbCwgaXNvLCAkMTo6dmFyY2hhciBhcyB6aF9uYW1lLCBlbl9uYW1lLCBnZW9tLCBcbiAgICAkMjo6YmlnaW50IGFzIHJlZ2lvbl9pZCwgJDM6OmJpZ2ludCBhcyBtZGRfaWQgIFxuICAgIGZyb20gJHtmcm9tVGFibGV9IHdoZXJlIGlkID0gJDQgXG4gICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IFxuICAgIHBhcmVudF9pZCA9IGV4Y2x1ZGVkLnBhcmVudF9pZCwga2V5ID0gZXhjbHVkZWQua2V5LCBsZXZlbCA9IGV4Y2x1ZGVkLmxldmVsLCBpc28gPSBleGNsdWRlZC5pc28sXG4gICAgemhfbmFtZSA9IGV4Y2x1ZGVkLnpoX25hbWUsIGVuX25hbWUgPSBleGNsdWRlZC5lbl9uYW1lLCBcbiAgICBnZW9tID0gZXhjbHVkZWQuZ2VvbSwgbWRkX2lkID0gZXhjbHVkZWQubWRkX2lkLCByZWdpb25faWQgPSBleGNsdWRlZC5yZWdpb25faWRgO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW25hbWUsIGNoaW5hUmVnaW9uSWQsIG1kZElkLCAxXSk7XG4gIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBMaWJNZnc7Il19