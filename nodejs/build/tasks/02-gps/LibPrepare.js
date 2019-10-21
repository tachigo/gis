'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class LibPrepare {
  static async clearData(pg) {
    const table = 'gps.world';
    await pg.query(`delete from ${table}`);
  }

  static async importOSM(pg) {
    const fromTable = 'osm.relation_aggregate';
    const toTable = 'gps.world';
    const sql = `insert into ${toTable} (id, parent_id, level, iso, zh_name, en_name, geom) 
    select id, parent_id, level, iso, zh_name, en_name, st_multi(geom) as geom 
    from ${fromTable} 
    on conflict (id) do update set 
    parent_id = excluded.parent_id, level = excluded.level, iso = excluded.iso,
    zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom`;
    await pg.query(sql);
  }

  static async importAMap(pg) {
    const fromTable = 'amap.china';
    const toTable = 'gps.world';
    const sql = `insert into ${toTable} (id, parent_id, level, iso, zh_name, en_name, geom) 
    select id, parent_id, level, iso, zh_name, en_name, st_multi(geom) as geom 
    from ${fromTable} where id = 1
    on conflict (id) do update set 
    parent_id = excluded.parent_id, level = excluded.level, iso = excluded.iso,
    zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom`;
    await pg.query(sql);
  }

}

var _default = LibPrepare;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMi1ncHMvTGliUHJlcGFyZS5qcyJdLCJuYW1lcyI6WyJMaWJQcmVwYXJlIiwiY2xlYXJEYXRhIiwicGciLCJ0YWJsZSIsInF1ZXJ5IiwiaW1wb3J0T1NNIiwiZnJvbVRhYmxlIiwidG9UYWJsZSIsInNxbCIsImltcG9ydEFNYXAiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBR0EsTUFBTUEsVUFBTixDQUFpQjtBQUVmLGVBQWFDLFNBQWIsQ0FBdUJDLEVBQXZCLEVBQTJCO0FBQ3pCLFVBQU1DLEtBQUssR0FBRyxXQUFkO0FBQ0EsVUFBTUQsRUFBRSxDQUFDRSxLQUFILENBQVUsZUFBY0QsS0FBTSxFQUE5QixDQUFOO0FBQ0Q7O0FBRUQsZUFBYUUsU0FBYixDQUF1QkgsRUFBdkIsRUFBMkI7QUFDekIsVUFBTUksU0FBUyxHQUFHLHdCQUFsQjtBQUNBLFVBQU1DLE9BQU8sR0FBRyxXQUFoQjtBQUNBLFVBQU1DLEdBQUcsR0FBSSxlQUFjRCxPQUFROztXQUU1QkQsU0FBVTs7O2lGQUZqQjtBQU1BLFVBQU1KLEVBQUUsQ0FBQ0UsS0FBSCxDQUFTSSxHQUFULENBQU47QUFDRDs7QUFFRCxlQUFhQyxVQUFiLENBQXdCUCxFQUF4QixFQUE0QjtBQUMxQixVQUFNSSxTQUFTLEdBQUcsWUFBbEI7QUFDQSxVQUFNQyxPQUFPLEdBQUcsV0FBaEI7QUFDQSxVQUFNQyxHQUFHLEdBQUksZUFBY0QsT0FBUTs7V0FFNUJELFNBQVU7OztpRkFGakI7QUFNQSxVQUFNSixFQUFFLENBQUNFLEtBQUgsQ0FBU0ksR0FBVCxDQUFOO0FBQ0Q7O0FBN0JjOztlQWlDRlIsVSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuXG5jbGFzcyBMaWJQcmVwYXJlIHtcblxuICBzdGF0aWMgYXN5bmMgY2xlYXJEYXRhKHBnKSB7XG4gICAgY29uc3QgdGFibGUgPSAnZ3BzLndvcmxkJztcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0YWJsZX1gKTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBpbXBvcnRPU00ocGcpIHtcbiAgICBjb25zdCBmcm9tVGFibGUgPSAnb3NtLnJlbGF0aW9uX2FnZ3JlZ2F0ZSc7XG4gICAgY29uc3QgdG9UYWJsZSA9ICdncHMud29ybGQnO1xuICAgIGNvbnN0IHNxbCA9IGBpbnNlcnQgaW50byAke3RvVGFibGV9IChpZCwgcGFyZW50X2lkLCBsZXZlbCwgaXNvLCB6aF9uYW1lLCBlbl9uYW1lLCBnZW9tKSBcbiAgICBzZWxlY3QgaWQsIHBhcmVudF9pZCwgbGV2ZWwsIGlzbywgemhfbmFtZSwgZW5fbmFtZSwgc3RfbXVsdGkoZ2VvbSkgYXMgZ2VvbSBcbiAgICBmcm9tICR7ZnJvbVRhYmxlfSBcbiAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgXG4gICAgcGFyZW50X2lkID0gZXhjbHVkZWQucGFyZW50X2lkLCBsZXZlbCA9IGV4Y2x1ZGVkLmxldmVsLCBpc28gPSBleGNsdWRlZC5pc28sXG4gICAgemhfbmFtZSA9IGV4Y2x1ZGVkLnpoX25hbWUsIGVuX25hbWUgPSBleGNsdWRlZC5lbl9uYW1lLCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgYXdhaXQgcGcucXVlcnkoc3FsKTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBpbXBvcnRBTWFwKHBnKSB7XG4gICAgY29uc3QgZnJvbVRhYmxlID0gJ2FtYXAuY2hpbmEnO1xuICAgIGNvbnN0IHRvVGFibGUgPSAnZ3BzLndvcmxkJztcbiAgICBjb25zdCBzcWwgPSBgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSAoaWQsIHBhcmVudF9pZCwgbGV2ZWwsIGlzbywgemhfbmFtZSwgZW5fbmFtZSwgZ2VvbSkgXG4gICAgc2VsZWN0IGlkLCBwYXJlbnRfaWQsIGxldmVsLCBpc28sIHpoX25hbWUsIGVuX25hbWUsIHN0X211bHRpKGdlb20pIGFzIGdlb20gXG4gICAgZnJvbSAke2Zyb21UYWJsZX0gd2hlcmUgaWQgPSAxXG4gICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IFxuICAgIHBhcmVudF9pZCA9IGV4Y2x1ZGVkLnBhcmVudF9pZCwgbGV2ZWwgPSBleGNsdWRlZC5sZXZlbCwgaXNvID0gZXhjbHVkZWQuaXNvLFxuICAgIHpoX25hbWUgPSBleGNsdWRlZC56aF9uYW1lLCBlbl9uYW1lID0gZXhjbHVkZWQuZW5fbmFtZSwgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCk7XG4gIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBMaWJQcmVwYXJlOyJdfQ==