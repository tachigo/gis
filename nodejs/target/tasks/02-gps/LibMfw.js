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

  static async mapChinaProvincesData(pg) {
    const fromTable = 'gps.world';
    const toTable = 'gps.mfw';
    await _modules.default.AMap.getProvinces(async item => {
      const id = item.id;
      const regionId = item.mfwId;
      let data = await _modules.default.Mfw.getRegionRestFul().getRegionInfo(regionId);
      let mddId = data['mddid'];
      let name = data['cname'];
      console.log(id, name, mddId, regionId);
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
    });
  }

}

var _default = LibMfw;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMi1ncHMvTGliTWZ3LmpzIl0sIm5hbWVzIjpbIkxpYk1mdyIsIm1hcEZvcmVpZ25EYXRhIiwicGciLCIkIiwiT1NNIiwiZ2V0Q291bnRyeVRyZWUiLCJlYWNoIiwiaW5kZXgiLCJpdGVtIiwiaWQiLCJtZGRJZCIsIm5hbWUiLCJ6aE5hbWUiLCJtZndJZCIsInVuZGVmaW5lZCIsInJlZ2lvbklkIiwiZGF0YSIsIk1mdyIsImdldFJlZ2lvblJlc3RGdWwiLCJnZXRSZWdpb25JbmZvIiwibGVuZ3RoIiwiY29uc29sZSIsImxvZyIsImZyb21UYWJsZSIsInRvVGFibGUiLCJzcWwiLCJxdWVyeSIsIm1hcENoaW5hQ291bnRyeURhdGEiLCJjaGluYVJlZ2lvbklkIiwibWFwQ2hpbmFQcm92aW5jZXNEYXRhIiwiQU1hcCIsImdldFByb3ZpbmNlcyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFHQTs7OztBQUVBLE1BQU1BLE1BQU4sQ0FBYTtBQUVYLGVBQWFDLGNBQWIsQ0FBNEJDLEVBQTVCLEVBQWdDO0FBQzlCLFVBQU1DLGlCQUFFQyxHQUFGLENBQU1DLGNBQU4sR0FBdUJDLElBQXZCLENBQTRCLE9BQU9DLEtBQVAsRUFBY0MsSUFBZCxLQUF1QjtBQUN2RCxZQUFNQyxFQUFFLEdBQUdGLEtBQUssR0FBRyxNQUFuQjtBQUNBLFVBQUlHLEtBQUssR0FBRyxDQUFaO0FBQ0EsVUFBSUMsSUFBSSxHQUFHSCxJQUFJLENBQUNJLE1BQWhCOztBQUNBLFVBQUlKLElBQUksQ0FBQ0ssS0FBTCxLQUFlQyxTQUFuQixFQUE4QjtBQUM1QixjQUFNQyxRQUFRLEdBQUdQLElBQUksQ0FBQ0ssS0FBdEI7O0FBQ0EsWUFBSUUsUUFBUSxHQUFHLENBQWYsRUFBa0I7QUFDaEIsZ0JBQU1DLElBQUksR0FBRyxNQUFNYixpQkFBRWMsR0FBRixDQUFNQyxnQkFBTixHQUF5QkMsYUFBekIsQ0FBdUNKLFFBQXZDLENBQW5CO0FBQ0FMLFVBQUFBLEtBQUssR0FBR00sSUFBSSxDQUFDLE9BQUQsQ0FBWjs7QUFDQSxjQUFJQSxJQUFJLENBQUMsT0FBRCxDQUFKLElBQWlCQSxJQUFJLENBQUMsT0FBRCxDQUFKLENBQWNJLE1BQWQsR0FBdUIsQ0FBNUMsRUFBK0M7QUFDN0NULFlBQUFBLElBQUksR0FBR0ssSUFBSSxDQUFDLE9BQUQsQ0FBWDtBQUNEO0FBQ0Y7O0FBQ0RLLFFBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZYixFQUFaLEVBQWdCRSxJQUFoQixFQUFzQkQsS0FBdEIsRUFBNkJLLFFBQTdCO0FBQ0EsY0FBTVEsU0FBUyxHQUFHLFdBQWxCO0FBQ0EsY0FBTUMsT0FBTyxHQUFHLFNBQWhCO0FBQ0EsY0FBTUMsR0FBRyxHQUFJLGVBQWNELE9BQVE7Ozs7O2VBSzVCRCxTQUFVOzs7O3VGQUxqQjtBQVVBLGNBQU1yQixFQUFFLENBQUN3QixLQUFILENBQVNELEdBQVQsRUFBYyxDQUFDZCxJQUFELEVBQU9JLFFBQVAsRUFBaUJMLEtBQWpCLEVBQXdCRCxFQUF4QixDQUFkLENBQU47QUFDRDtBQUNGLEtBNUJLLENBQU47QUE2QkQ7O0FBR0QsZUFBYWtCLG1CQUFiLENBQWlDekIsRUFBakMsRUFBcUM7QUFDbkMsVUFBTXFCLFNBQVMsR0FBRyxXQUFsQjtBQUNBLFVBQU1DLE9BQU8sR0FBRyxTQUFoQixDQUZtQyxDQUduQzs7QUFDQSxVQUFNSSxhQUFhLEdBQUcsS0FBdEI7QUFDQSxRQUFJWixJQUFJLEdBQUcsTUFBTWIsaUJBQUVjLEdBQUYsQ0FBTUMsZ0JBQU4sR0FBeUJDLGFBQXpCLENBQXVDUyxhQUF2QyxDQUFqQjtBQUNBLFFBQUlsQixLQUFLLEdBQUdNLElBQUksQ0FBQyxPQUFELENBQWhCO0FBQ0EsUUFBSUwsSUFBSSxHQUFHSyxJQUFJLENBQUMsT0FBRCxDQUFmO0FBQ0FLLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLENBQVosRUFBZVgsSUFBZixFQUFxQkQsS0FBckIsRUFBNEJrQixhQUE1QjtBQUNBLFVBQU1ILEdBQUcsR0FBSSxlQUFjRCxPQUFROzs7OztXQUs1QkQsU0FBVTs7OzttRkFMakI7QUFVQSxVQUFNckIsRUFBRSxDQUFDd0IsS0FBSCxDQUFTRCxHQUFULEVBQWMsQ0FBQ2QsSUFBRCxFQUFPaUIsYUFBUCxFQUFzQmxCLEtBQXRCLEVBQTZCLENBQTdCLENBQWQsQ0FBTjtBQUNEOztBQUdELGVBQWFtQixxQkFBYixDQUFtQzNCLEVBQW5DLEVBQXVDO0FBQ3JDLFVBQU1xQixTQUFTLEdBQUcsV0FBbEI7QUFDQSxVQUFNQyxPQUFPLEdBQUcsU0FBaEI7QUFDQSxVQUFNckIsaUJBQUUyQixJQUFGLENBQU9DLFlBQVAsQ0FBb0IsTUFBT3ZCLElBQVAsSUFBZ0I7QUFDeEMsWUFBTUMsRUFBRSxHQUFHRCxJQUFJLENBQUNDLEVBQWhCO0FBQ0EsWUFBTU0sUUFBUSxHQUFHUCxJQUFJLENBQUNLLEtBQXRCO0FBQ0EsVUFBSUcsSUFBSSxHQUFHLE1BQU1iLGlCQUFFYyxHQUFGLENBQU1DLGdCQUFOLEdBQXlCQyxhQUF6QixDQUF1Q0osUUFBdkMsQ0FBakI7QUFDQSxVQUFJTCxLQUFLLEdBQUdNLElBQUksQ0FBQyxPQUFELENBQWhCO0FBQ0EsVUFBSUwsSUFBSSxHQUFHSyxJQUFJLENBQUMsT0FBRCxDQUFmO0FBQ0FLLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZYixFQUFaLEVBQWdCRSxJQUFoQixFQUFzQkQsS0FBdEIsRUFBNkJLLFFBQTdCO0FBQ0EsWUFBTVUsR0FBRyxHQUFJLGVBQWNELE9BQVE7Ozs7O2FBSzVCRCxTQUFVOzs7O3FGQUxqQjtBQVVBLFlBQU1yQixFQUFFLENBQUN3QixLQUFILENBQVNELEdBQVQsRUFBYyxDQUFDZCxJQUFELEVBQU9JLFFBQVAsRUFBaUJMLEtBQWpCLEVBQXdCRCxFQUF4QixDQUFkLENBQU47QUFDRCxLQWxCSyxDQUFOO0FBbUJEOztBQWhGVTs7ZUFvRkVULE0iLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuY2xhc3MgTGliTWZ3IHtcblxuICBzdGF0aWMgYXN5bmMgbWFwRm9yZWlnbkRhdGEocGcpIHtcbiAgICBhd2FpdCAkLk9TTS5nZXRDb3VudHJ5VHJlZSgpLmVhY2goYXN5bmMgKGluZGV4LCBpdGVtKSA9PiB7XG4gICAgICBjb25zdCBpZCA9IGluZGV4ICsgOTAwMDAwO1xuICAgICAgbGV0IG1kZElkID0gMDtcbiAgICAgIGxldCBuYW1lID0gaXRlbS56aE5hbWU7XG4gICAgICBpZiAoaXRlbS5tZndJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnN0IHJlZ2lvbklkID0gaXRlbS5tZndJZDtcbiAgICAgICAgaWYgKHJlZ2lvbklkID4gMCkge1xuICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCAkLk1mdy5nZXRSZWdpb25SZXN0RnVsKCkuZ2V0UmVnaW9uSW5mbyhyZWdpb25JZCk7XG4gICAgICAgICAgbWRkSWQgPSBkYXRhWydtZGRpZCddO1xuICAgICAgICAgIGlmIChkYXRhWydjbmFtZSddICYmIGRhdGFbJ2NuYW1lJ10ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbmFtZSA9IGRhdGFbJ2NuYW1lJ107XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKGlkLCBuYW1lLCBtZGRJZCwgcmVnaW9uSWQpO1xuICAgICAgICBjb25zdCBmcm9tVGFibGUgPSAnZ3BzLndvcmxkJztcbiAgICAgICAgY29uc3QgdG9UYWJsZSA9ICdncHMubWZ3JztcbiAgICAgICAgY29uc3Qgc3FsID0gYGluc2VydCBpbnRvICR7dG9UYWJsZX0gXG4gICAgICAgIChpZCwgcGFyZW50X2lkLCBrZXksIGxldmVsLCBpc28sIHpoX25hbWUsIGVuX25hbWUsIGdlb20sIHJlZ2lvbl9pZCwgbWRkX2lkKSBcbiAgICAgICAgc2VsZWN0IFxuICAgICAgICBpZCwgcGFyZW50X2lkLCBrZXksIGxldmVsLCBpc28sICQxOjp2YXJjaGFyIGFzIHpoX25hbWUsIGVuX25hbWUsIGdlb20sIFxuICAgICAgICAkMjo6YmlnaW50IGFzIHJlZ2lvbl9pZCwgJDM6OmJpZ2ludCBhcyBtZGRfaWQgIFxuICAgICAgICBmcm9tICR7ZnJvbVRhYmxlfSB3aGVyZSBpZCA9ICQ0IFxuICAgICAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgXG4gICAgICAgIHBhcmVudF9pZCA9IGV4Y2x1ZGVkLnBhcmVudF9pZCwga2V5ID0gZXhjbHVkZWQua2V5LCBsZXZlbCA9IGV4Y2x1ZGVkLmxldmVsLCBpc28gPSBleGNsdWRlZC5pc28sXG4gICAgICAgIHpoX25hbWUgPSBleGNsdWRlZC56aF9uYW1lLCBlbl9uYW1lID0gZXhjbHVkZWQuZW5fbmFtZSwgXG4gICAgICAgIGdlb20gPSBleGNsdWRlZC5nZW9tLCBtZGRfaWQgPSBleGNsdWRlZC5tZGRfaWQsIHJlZ2lvbl9pZCA9IGV4Y2x1ZGVkLnJlZ2lvbl9pZGA7XG4gICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW25hbWUsIHJlZ2lvbklkLCBtZGRJZCwgaWRdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIG1hcENoaW5hQ291bnRyeURhdGEocGcpIHtcbiAgICBjb25zdCBmcm9tVGFibGUgPSAnZ3BzLndvcmxkJztcbiAgICBjb25zdCB0b1RhYmxlID0gJ2dwcy5tZncnO1xuICAgIC8vIOS4reWbvVxuICAgIGNvbnN0IGNoaW5hUmVnaW9uSWQgPSAxNzM0ODtcbiAgICBsZXQgZGF0YSA9IGF3YWl0ICQuTWZ3LmdldFJlZ2lvblJlc3RGdWwoKS5nZXRSZWdpb25JbmZvKGNoaW5hUmVnaW9uSWQpO1xuICAgIGxldCBtZGRJZCA9IGRhdGFbJ21kZGlkJ107XG4gICAgbGV0IG5hbWUgPSBkYXRhWydjbmFtZSddO1xuICAgIGNvbnNvbGUubG9nKDEsIG5hbWUsIG1kZElkLCBjaGluYVJlZ2lvbklkKTtcbiAgICBjb25zdCBzcWwgPSBgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSBcbiAgICAoaWQsIHBhcmVudF9pZCwga2V5LCBsZXZlbCwgaXNvLCB6aF9uYW1lLCBlbl9uYW1lLCBnZW9tLCByZWdpb25faWQsIG1kZF9pZCkgXG4gICAgc2VsZWN0IFxuICAgIGlkLCBwYXJlbnRfaWQsIGtleSwgbGV2ZWwsIGlzbywgJDE6OnZhcmNoYXIgYXMgemhfbmFtZSwgZW5fbmFtZSwgZ2VvbSwgXG4gICAgJDI6OmJpZ2ludCBhcyByZWdpb25faWQsICQzOjpiaWdpbnQgYXMgbWRkX2lkICBcbiAgICBmcm9tICR7ZnJvbVRhYmxlfSB3aGVyZSBpZCA9ICQ0IFxuICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBcbiAgICBwYXJlbnRfaWQgPSBleGNsdWRlZC5wYXJlbnRfaWQsIGtleSA9IGV4Y2x1ZGVkLmtleSwgbGV2ZWwgPSBleGNsdWRlZC5sZXZlbCwgaXNvID0gZXhjbHVkZWQuaXNvLFxuICAgIHpoX25hbWUgPSBleGNsdWRlZC56aF9uYW1lLCBlbl9uYW1lID0gZXhjbHVkZWQuZW5fbmFtZSwgXG4gICAgZ2VvbSA9IGV4Y2x1ZGVkLmdlb20sIG1kZF9pZCA9IGV4Y2x1ZGVkLm1kZF9pZCwgcmVnaW9uX2lkID0gZXhjbHVkZWQucmVnaW9uX2lkYDtcbiAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtuYW1lLCBjaGluYVJlZ2lvbklkLCBtZGRJZCwgMV0pO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgbWFwQ2hpbmFQcm92aW5jZXNEYXRhKHBnKSB7XG4gICAgY29uc3QgZnJvbVRhYmxlID0gJ2dwcy53b3JsZCc7XG4gICAgY29uc3QgdG9UYWJsZSA9ICdncHMubWZ3JztcbiAgICBhd2FpdCAkLkFNYXAuZ2V0UHJvdmluY2VzKGFzeW5jIChpdGVtKSA9PiB7XG4gICAgICBjb25zdCBpZCA9IGl0ZW0uaWQ7XG4gICAgICBjb25zdCByZWdpb25JZCA9IGl0ZW0ubWZ3SWQ7XG4gICAgICBsZXQgZGF0YSA9IGF3YWl0ICQuTWZ3LmdldFJlZ2lvblJlc3RGdWwoKS5nZXRSZWdpb25JbmZvKHJlZ2lvbklkKTtcbiAgICAgIGxldCBtZGRJZCA9IGRhdGFbJ21kZGlkJ107XG4gICAgICBsZXQgbmFtZSA9IGRhdGFbJ2NuYW1lJ107XG4gICAgICBjb25zb2xlLmxvZyhpZCwgbmFtZSwgbWRkSWQsIHJlZ2lvbklkKTtcbiAgICAgIGNvbnN0IHNxbCA9IGBpbnNlcnQgaW50byAke3RvVGFibGV9IFxuICAgICAgKGlkLCBwYXJlbnRfaWQsIGtleSwgbGV2ZWwsIGlzbywgemhfbmFtZSwgZW5fbmFtZSwgZ2VvbSwgcmVnaW9uX2lkLCBtZGRfaWQpIFxuICAgICAgc2VsZWN0IFxuICAgICAgaWQsIHBhcmVudF9pZCwga2V5LCBsZXZlbCwgaXNvLCAkMTo6dmFyY2hhciBhcyB6aF9uYW1lLCBlbl9uYW1lLCBnZW9tLCBcbiAgICAgICQyOjpiaWdpbnQgYXMgcmVnaW9uX2lkLCAkMzo6YmlnaW50IGFzIG1kZF9pZCAgXG4gICAgICBmcm9tICR7ZnJvbVRhYmxlfSB3aGVyZSBpZCA9ICQ0IFxuICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IFxuICAgICAgcGFyZW50X2lkID0gZXhjbHVkZWQucGFyZW50X2lkLCBrZXkgPSBleGNsdWRlZC5rZXksIGxldmVsID0gZXhjbHVkZWQubGV2ZWwsIGlzbyA9IGV4Y2x1ZGVkLmlzbyxcbiAgICAgIHpoX25hbWUgPSBleGNsdWRlZC56aF9uYW1lLCBlbl9uYW1lID0gZXhjbHVkZWQuZW5fbmFtZSwgXG4gICAgICBnZW9tID0gZXhjbHVkZWQuZ2VvbSwgbWRkX2lkID0gZXhjbHVkZWQubWRkX2lkLCByZWdpb25faWQgPSBleGNsdWRlZC5yZWdpb25faWRgO1xuICAgICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbbmFtZSwgcmVnaW9uSWQsIG1kZElkLCBpZF0pO1xuICAgIH0pO1xuICB9XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgTGliTWZ3OyJdfQ==