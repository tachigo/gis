'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class Gis {
  static async getForeignListFromGpsMFW(pg) {
    const table = 'gps.mfw';
    const sql = `select id, zh_name from ${table} where id > 900000 order by id asc`;
    const res = await pg.query(sql);
    const list = [];

    for await (const row of res.rows) {
      list.push({
        id: +row['id'],
        name: row['zh_name']
      });
    }

    return list;
  }

  static async getForeignListFromOsmRelation(pg) {
    const table = 'osm.relation_aggregate';
    const sql = `select id, zh_name from ${table} where id > 900000 order by id asc`;
    const res = await pg.query(sql);
    const list = [];

    for await (const row of res.rows) {
      list.push({
        id: +row['id'],
        name: row['zh_name']
      });
    }

    return list;
  }

}

var _default = Gis;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2R1bGVzL0dpcy9pbmRleC5qcyJdLCJuYW1lcyI6WyJHaXMiLCJnZXRGb3JlaWduTGlzdEZyb21HcHNNRlciLCJwZyIsInRhYmxlIiwic3FsIiwicmVzIiwicXVlcnkiLCJsaXN0Iiwicm93Iiwicm93cyIsInB1c2giLCJpZCIsIm5hbWUiLCJnZXRGb3JlaWduTGlzdEZyb21Pc21SZWxhdGlvbiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFHQSxNQUFNQSxHQUFOLENBQVU7QUFHUixlQUFhQyx3QkFBYixDQUFzQ0MsRUFBdEMsRUFBMEM7QUFDeEMsVUFBTUMsS0FBSyxHQUFHLFNBQWQ7QUFDQSxVQUFNQyxHQUFHLEdBQUksMkJBQTBCRCxLQUFNLG9DQUE3QztBQUNBLFVBQU1FLEdBQUcsR0FBRyxNQUFNSCxFQUFFLENBQUNJLEtBQUgsQ0FBU0YsR0FBVCxDQUFsQjtBQUNBLFVBQU1HLElBQUksR0FBRyxFQUFiOztBQUNBLGVBQVcsTUFBTUMsR0FBakIsSUFBd0JILEdBQUcsQ0FBQ0ksSUFBNUIsRUFBa0M7QUFDaENGLE1BQUFBLElBQUksQ0FBQ0csSUFBTCxDQUFVO0FBQ1JDLFFBQUFBLEVBQUUsRUFBRSxDQUFDSCxHQUFHLENBQUMsSUFBRCxDQURBO0FBRVJJLFFBQUFBLElBQUksRUFBRUosR0FBRyxDQUFDLFNBQUQ7QUFGRCxPQUFWO0FBSUQ7O0FBQ0QsV0FBT0QsSUFBUDtBQUNEOztBQUVELGVBQWFNLDZCQUFiLENBQTJDWCxFQUEzQyxFQUErQztBQUM3QyxVQUFNQyxLQUFLLEdBQUcsd0JBQWQ7QUFDQSxVQUFNQyxHQUFHLEdBQUksMkJBQTBCRCxLQUFNLG9DQUE3QztBQUNBLFVBQU1FLEdBQUcsR0FBRyxNQUFNSCxFQUFFLENBQUNJLEtBQUgsQ0FBU0YsR0FBVCxDQUFsQjtBQUNBLFVBQU1HLElBQUksR0FBRyxFQUFiOztBQUNBLGVBQVcsTUFBTUMsR0FBakIsSUFBd0JILEdBQUcsQ0FBQ0ksSUFBNUIsRUFBa0M7QUFDaENGLE1BQUFBLElBQUksQ0FBQ0csSUFBTCxDQUFVO0FBQ1JDLFFBQUFBLEVBQUUsRUFBRSxDQUFDSCxHQUFHLENBQUMsSUFBRCxDQURBO0FBRVJJLFFBQUFBLElBQUksRUFBRUosR0FBRyxDQUFDLFNBQUQ7QUFGRCxPQUFWO0FBSUQ7O0FBQ0QsV0FBT0QsSUFBUDtBQUNEOztBQTdCTzs7ZUFnQ0tQLEciLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuY2xhc3MgR2lzIHtcblxuXG4gIHN0YXRpYyBhc3luYyBnZXRGb3JlaWduTGlzdEZyb21HcHNNRlcocGcpIHtcbiAgICBjb25zdCB0YWJsZSA9ICdncHMubWZ3JztcbiAgICBjb25zdCBzcWwgPSBgc2VsZWN0IGlkLCB6aF9uYW1lIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPiA5MDAwMDAgb3JkZXIgYnkgaWQgYXNjYDtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBwZy5xdWVyeShzcWwpO1xuICAgIGNvbnN0IGxpc3QgPSBbXTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByZXMucm93cykge1xuICAgICAgbGlzdC5wdXNoKHtcbiAgICAgICAgaWQ6ICtyb3dbJ2lkJ10sXG4gICAgICAgIG5hbWU6IHJvd1snemhfbmFtZSddXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Q7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgZ2V0Rm9yZWlnbkxpc3RGcm9tT3NtUmVsYXRpb24ocGcpIHtcbiAgICBjb25zdCB0YWJsZSA9ICdvc20ucmVsYXRpb25fYWdncmVnYXRlJztcbiAgICBjb25zdCBzcWwgPSBgc2VsZWN0IGlkLCB6aF9uYW1lIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPiA5MDAwMDAgb3JkZXIgYnkgaWQgYXNjYDtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBwZy5xdWVyeShzcWwpO1xuICAgIGNvbnN0IGxpc3QgPSBbXTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByZXMucm93cykge1xuICAgICAgbGlzdC5wdXNoKHtcbiAgICAgICAgaWQ6ICtyb3dbJ2lkJ10sXG4gICAgICAgIG5hbWU6IHJvd1snemhfbmFtZSddXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Q7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgR2lzOyJdfQ==