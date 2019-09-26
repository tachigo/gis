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

        await _modules.default.Utils.log(id, name, mddId, regionId);
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
    await _modules.default.Utils.log(1, name, mddId, chinaRegionId);
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
      await _modules.default.Utils.log(id, name, mddId, regionId);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMi1ncHMvTGliTWZ3LmpzIl0sIm5hbWVzIjpbIkxpYk1mdyIsIm1hcEZvcmVpZ25EYXRhIiwicGciLCIkIiwiT1NNIiwiZ2V0Q291bnRyeVRyZWUiLCJlYWNoIiwiaW5kZXgiLCJpdGVtIiwiaWQiLCJtZGRJZCIsIm5hbWUiLCJ6aE5hbWUiLCJtZndJZCIsInVuZGVmaW5lZCIsInJlZ2lvbklkIiwiZGF0YSIsIk1mdyIsImdldFJlZ2lvblJlc3RGdWwiLCJnZXRSZWdpb25JbmZvIiwibGVuZ3RoIiwiVXRpbHMiLCJsb2ciLCJmcm9tVGFibGUiLCJ0b1RhYmxlIiwic3FsIiwicXVlcnkiLCJtYXBDaGluYUNvdW50cnlEYXRhIiwiY2hpbmFSZWdpb25JZCIsIm1hcENoaW5hUHJvdmluY2VzRGF0YSIsIkFNYXAiLCJnZXRQcm92aW5jZXMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBR0E7Ozs7QUFFQSxNQUFNQSxNQUFOLENBQWE7QUFFWCxlQUFhQyxjQUFiLENBQTRCQyxFQUE1QixFQUFnQztBQUM5QixVQUFNQyxpQkFBRUMsR0FBRixDQUFNQyxjQUFOLEdBQXVCQyxJQUF2QixDQUE0QixPQUFPQyxLQUFQLEVBQWNDLElBQWQsS0FBdUI7QUFDdkQsWUFBTUMsRUFBRSxHQUFHRixLQUFLLEdBQUcsTUFBbkI7QUFDQSxVQUFJRyxLQUFLLEdBQUcsQ0FBWjtBQUNBLFVBQUlDLElBQUksR0FBR0gsSUFBSSxDQUFDSSxNQUFoQjs7QUFDQSxVQUFJSixJQUFJLENBQUNLLEtBQUwsS0FBZUMsU0FBbkIsRUFBOEI7QUFDNUIsY0FBTUMsUUFBUSxHQUFHUCxJQUFJLENBQUNLLEtBQXRCOztBQUNBLFlBQUlFLFFBQVEsR0FBRyxDQUFmLEVBQWtCO0FBQ2hCLGdCQUFNQyxJQUFJLEdBQUcsTUFBTWIsaUJBQUVjLEdBQUYsQ0FBTUMsZ0JBQU4sR0FBeUJDLGFBQXpCLENBQXVDSixRQUF2QyxDQUFuQjtBQUNBTCxVQUFBQSxLQUFLLEdB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b20gJy4vLi4vLi4vbW9kdWxlcyc7XG5cbmNsYXNzIExpYk1mdyB7XG5cbiAgc3RhdGljIGFzeW5jIG1hcEZvcmVpZ25EYXRhKHBnKSB7XG4gICAgYXdhaXQgJC5PU00uZ2V0Q291bnRyeVRyZWUoKS5lYWNoKGFzeW5jIChpbmRleCwgaXRlbSkgPT4ge1xuICAgICAgY29uc3QgaWQgPSBpbmRleCArIDkwMDAwMDtcbiAgICAgIGxldCBtZGRJZCA9IDA7XG4gICAgICBsZXQgbmFtZSA9IGl0ZW0uemhOYW1lO1xuICAgICAgaWYgKGl0ZW0ubWZ3SWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCByZWdpb25JZCA9IGl0ZW0ubWZ3SWQ7XG4gICAgICAgIGlmIChyZWdpb25JZCA+IDApIHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgJC5NZncuZ2V0UmVnaW9uUmVzdEZ1bCgpLmdldFJlZ2lvbkluZm8ocmVnaW9uSWQpO1xuICAgICAgICAgIG1kZElkID0gZGF0YVsnbWRkaWQnXTtcbiAgICAgICAgICBpZiAoZGF0YVsnY25hbWUnXSAmJiBkYXRhWydjbmFtZSddLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG5hbWUgPSBkYXRhWydjbmFtZSddO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhd2FpdCAkLlV0aWxzLmxvZyhpZCwgbmFtZSwgbWRkSWQsIHJlZ2lvbklkKTtcbiAgICAgICAgY29uc3QgZnJvbVRhYmxlID0gJ2dwcy53b3JsZCc7XG4gICAgICAgIGNvbnN0IHRvVGFibGUgPSAnZ3BzLm1mdyc7XG4gICAgICAgIGNvbnN0IHNxbCA9IGBpbnNlcnQgaW50byAke3RvVGFibGV9IFxuICAgICAgICAoaWQsIHBhcmVudF9pZCwga2V5LCBsZXZlbCwgaXNvLCB6aF9uYW1lLCBlbl9uYW1lLCBnZW9tLCByZWdpb25faWQsIG1kZF9pZCkgXG4gICAgICAgIHNlbGVjdCBcbiAgICAgICAgaWQsIHBhcmVudF9pZCwga2V5LCBsZXZlbCwgaXNvLCAkMTo6dmFyY2hhciBhcyB6aF9uYW1lLCBlbl9uYW1lLCBnZW9tLCBcbiAgICAgICAgJDI6OmJpZ2ludCBhcyByZWdpb25faWQsICQzOjpiaWdpbnQgYXMgbWRkX2lkICBcbiAgICAgICAgZnJvbSAke2Zyb21UYWJsZX0gd2hlcmUgaWQgPSAkNCBcbiAgICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IFxuICAgICAgICBwYXJlbnRfaWQgPSBleGNsdWRlZC5wYXJlbnRfaWQsIGtleSA9IGV4Y2x1ZGVkLmtleSwgbGV2ZWwgPSBleGNsdWRlZC5sZXZlbCwgaXNvID0gZXhjbHVkZWQuaXNvLFxuICAgICAgICB6aF9uYW1lID0gZXhjbHVkZWQuemhfbmFtZSwgZW5fbmFtZSA9IGV4Y2x1ZGVkLmVuX25hbWUsIFxuICAgICAgICBnZW9tID0gZXhjbHVkZWQuZ2VvbSwgbWRkX2lkID0gZXhjbHVkZWQubWRkX2lkLCByZWdpb25faWQgPSBleGNsdWRlZC5yZWdpb25faWRgO1xuICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtuYW1lLCByZWdpb25JZCwgbWRkSWQsIGlkXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBtYXBDaGluYUNvdW50cnlEYXRhKHBnKSB7XG4gICAgY29uc3QgZnJvbVRhYmxlID0gJ2dwcy53b3JsZCc7XG4gICAgY29uc3QgdG9UYWJsZSA9ICdncHMubWZ3JztcbiAgICAvLyDkuK3lm71cbiAgICBjb25zdCBjaGluYVJlZ2lvbklkID0gMTczNDg7XG4gICAgbGV0IGRhdGEgPSBhd2FpdCAkLk1mdy5nZXRSZWdpb25SZXN0RnVsKCkuZ2V0UmVnaW9uSW5mbyhjaGluYVJlZ2lvbklkKTtcbiAgICBsZXQgbWRkSWQgPSBkYXRhWydtZGRpZCddO1xuICAgIGxldCBuYW1lID0gZGF0YVsnY25hbWUnXTtcbiAgICBhd2FpdCAkLlV0aWxzLmxvZygxLCBuYW1lLCBtZGRJZCwgY2hpbmFSZWdpb25JZCk7XG4gICAgY29uc3Qgc3FsID0gYGluc2VydCBpbnRvICR7dG9UYWJsZX0gXG4gICAgKGlkLCBwYXJlbnRfaWQsIGtleSwgbGV2ZWwsIGlzbywgemhfbmFtZSwgZW5fbmFtZSwgZ2VvbSwgcmVnaW9uX2lkLCBtZGRfaWQpIFxuICAgIHNlbGVjdCBcbiAgICBpZCwgcGFyZW50X2lkLCBrZXksIGxldmVsLCBpc28sICQxOjp2YXJjaGFyIGFzIHpoX25hbWUsIGVuX25hbWUsIGdlb20sIFxuICAgICQyOjpiaWdpbnQgYXMgcmVnaW9uX2lkLCAkMzo6YmlnaW50IGFzIG1kZF9pZCAgXG4gICAgZnJvbSAke2Zyb21UYWJsZX0gd2hlcmUgaWQgPSAkNCBcbiAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgXG4gICAgcGFyZW50X2lkID0gZXhjbHVkZWQucGFyZW50X2lkLCBrZXkgPSBleGNsdWRlZC5rZXksIGxldmVsID0gZXhjbHVkZWQubGV2ZWwsIGlzbyA9IGV4Y2x1ZGVkLmlzbyxcbiAgICB6aF9uYW1lID0gZXhjbHVkZWQuemhfbmFtZSwgZW5fbmFtZSA9IGV4Y2x1ZGVkLmVuX25hbWUsIFxuICAgIGdlb20gPSBleGNsdWRlZC5nZW9tLCBtZGRfaWQgPSBleGNsdWRlZC5tZGRfaWQsIHJlZ2lvbl9pZCA9IGV4Y2x1ZGVkLnJlZ2lvbl9pZGA7XG4gICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbbmFtZSwgY2hpbmFSZWdpb25JZCwgbWRkSWQsIDFdKTtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIG1hcENoaW5hUHJvdmluY2VzRGF0YShwZykge1xuICAgIGNvbnN0IGZyb21UYWJsZSA9ICdncHMud29ybGQnO1xuICAgIGNvbnN0IHRvVGFibGUgPSAnZ3BzLm1mdyc7XG4gICAgYXdhaXQgJC5BTWFwLmdldFByb3ZpbmNlcyhhc3luYyAoaXRlbSkgPT4ge1xuICAgICAgY29uc3QgaWQgPSBpdGVtLmlkO1xuICAgICAgY29uc3QgcmVnaW9uSWQgPSBpdGVtLm1md0lkO1xuICAgICAgbGV0IGRhdGEgPSBhd2FpdCAkLk1mdy5nZXRSZWdpb25SZXN0RnVsKCkuZ2V0UmVnaW9uSW5mbyhyZWdpb25JZCk7XG4gICAgICBsZXQgbWRkSWQgPSBkYXRhWydtZGRpZCddO1xuICAgICAgbGV0IG5hbWUgPSBkYXRhWydjbmFtZSddO1xuICAgICAgYXdhaXQgJC5VdGlscy5sb2coaWQsIG5hbWUsIG1kZElkLCByZWdpb25JZCk7XG4gICAgICBjb25zdCBzcWwgPSBgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSBcbiAgICAgIChpZCwgcGFyZW50X2lkLCBrZXksIGxldmVsLCBpc28sIHpoX25hbWUsIGVuX25hbWUsIGdlb20sIHJlZ2lvbl9pZCwgbWRkX2lkKSBcbiAgICAgIHNlbGVjdCBcbiAgICAgIGlkLCBwYXJlbnRfaWQsIGtleSwgbGV2ZWwsIGlzbywgJDE6OnZhcmNoYXIgYXMgemhfbmFtZSwgZW5fbmFtZSwgZ2VvbSwgXG4gICAgICAkMjo6YmlnaW50IGFzIHJlZ2lvbl9pZCwgJDM6OmJpZ2ludCBhcyBtZGRfaWQgIFxuICAgICAgZnJvbSAke2Zyb21UYWJsZX0gd2hlcmUgaWQgPSAkNCBcbiAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBcbiAgICAgIHBhcmVudF9pZCA9IGV4Y2x1ZGVkLnBhcmVudF9pZCwga2V5ID0gZXhjbHVkZWQua2V5LCBsZXZlbCA9IGV4Y2x1ZGVkLmxldmVsLCBpc28gPSBleGNsdWRlZC5pc28sXG4gICAgICB6aF9uYW1lID0gZXhjbHVkZWQuemhfbmFtZSwgZW5fbmFtZSA9IGV4Y2x1ZGVkLmVuX25hbWUsIFxuICAgICAgZ2VvbSA9IGV4Y2x1ZGVkLmdlb20sIG1kZF9pZCA9IGV4Y2x1ZGVkLm1kZF9pZCwgcmVnaW9uX2lkID0gZXhjbHVkZWQucmVnaW9uX2lkYDtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW25hbWUsIHJlZ2lvbklkLCBtZGRJZCwgaWRdKTtcbiAgICB9KTtcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IExpYk1mdzsiXX0=