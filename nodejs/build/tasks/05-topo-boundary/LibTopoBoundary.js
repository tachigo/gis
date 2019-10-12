'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class LibTopoBoundary {
  static async init(pg) {
    const fromTable = 'boundary.mfw';
    const toTable = 'topo.boundary';
    const sql = `insert into ${toTable} (id, parent_id, key, level, iso, zh_name, en_name, region_id, mdd_id) 
    select id, parent_id, key, level, iso, zh_name, en_name, region_id, mdd_id from ${fromTable} 
    on conflict (id) do update set 
    parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso, 
    zh_name = excluded.zh_name, en_name = excluded.en_name, region_id = excluded.region_id, mdd_id = excluded.mdd_id`;
    await pg.query(sql);
  }

  static async getForeignList(pg) {
    const table = 'topo.boundary';
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

var _default = LibTopoBoundary;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNS10b3BvLWJvdW5kYXJ5L0xpYlRvcG9Cb3VuZGFyeS5qcyJdLCJuYW1lcyI6WyJMaWJUb3BvQm91bmRhcnkiLCJpbml0IiwicGciLCJmcm9tVGFibGUiLCJ0b1RhYmxlIiwic3FsIiwicXVlcnkiLCJnZXRGb3JlaWduTGlzdCIsInRhYmxlIiwicmVzIiwibGlzdCIsInJvdyIsInJvd3MiLCJwdXNoIiwiaWQiLCJuYW1lIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQUlBLE1BQU1BLGVBQU4sQ0FBc0I7QUFFcEIsZUFBYUMsSUFBYixDQUFrQkMsRUFBbEIsRUFBc0I7QUFDcEIsVUFBTUMsU0FBUyxHQUFHLGNBQWxCO0FBQ0EsVUFBTUMsT0FBTyxHQUFHLGVBQWhCO0FBRUEsVUFBTUMsR0FBRyxHQUFJLGVBQWNELE9BQVE7c0ZBQytDRCxTQUFVOzs7cUhBRDVGO0FBS0EsVUFBTUQsRUFBRSxDQUFDSSxLQUFILENBQVNELEdBQVQsQ0FBTjtBQUNEOztBQUdELGVBQWFFLGNBQWIsQ0FBNEJMLEVBQTVCLEVBQWdDO0FBQzlCLFVBQU1NLEtBQUssR0FBRyxlQUFkO0FBQ0EsVUFBTUgsR0FBRyxHQUFJLDJCQUEwQkcsS0FBTSxvQ0FBN0M7QUFDQSxVQUFNQyxHQUFHLEdBQUcsTUFBTVAsRUFBRSxDQUFDSSxLQUFILENBQVNELEdBQVQsQ0FBbEI7QUFDQSxVQUFNSyxJQUFJLEdBQUcsRUFBYjs7QUFDQSxlQUFXLE1BQU1DLEdBQWpCLElBQXdCRixHQUFHLENBQUNHLElBQTVCLEVBQWtDO0FBQ2hDRixNQUFBQSxJQUFJLENBQUNHLElBQUwsQ0FBVTtBQUNSQyxRQUFBQSxFQUFFLEVBQUUsQ0FBQ0gsR0FBRyxDQUFDLElBQUQsQ0FEQTtBQUVSSSxRQUFBQSxJQUFJLEVBQUVKLEdBQUcsQ0FBQyxTQUFEO0FBRkQsT0FBVjtBQUlEOztBQUNELFdBQU9ELElBQVA7QUFDRDs7QUEzQm1COztlQStCUFYsZSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuXG5cbmNsYXNzIExpYlRvcG9Cb3VuZGFyeSB7XG5cbiAgc3RhdGljIGFzeW5jIGluaXQocGcpIHtcbiAgICBjb25zdCBmcm9tVGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgICBjb25zdCB0b1RhYmxlID0gJ3RvcG8uYm91bmRhcnknO1xuXG4gICAgY29uc3Qgc3FsID0gYGluc2VydCBpbnRvICR7dG9UYWJsZX0gKGlkLCBwYXJlbnRfaWQsIGtleSwgbGV2ZWwsIGlzbywgemhfbmFtZSwgZW5fbmFtZSwgcmVnaW9uX2lkLCBtZGRfaWQpIFxuICAgIHNlbGVjdCBpZCwgcGFyZW50X2lkLCBrZXksIGxldmVsLCBpc28sIHpoX25hbWUsIGVuX25hbWUsIHJlZ2lvbl9pZCwgbWRkX2lkIGZyb20gJHtmcm9tVGFibGV9IFxuICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBcbiAgICBwYXJlbnRfaWQgPSBleGNsdWRlZC5wYXJlbnRfaWQsIGtleSA9IGV4Y2x1ZGVkLmtleSwgbGV2ZWwgPSBleGNsdWRlZC5sZXZlbCwgaXNvID0gZXhjbHVkZWQuaXNvLCBcbiAgICB6aF9uYW1lID0gZXhjbHVkZWQuemhfbmFtZSwgZW5fbmFtZSA9IGV4Y2x1ZGVkLmVuX25hbWUsIHJlZ2lvbl9pZCA9IGV4Y2x1ZGVkLnJlZ2lvbl9pZCwgbWRkX2lkID0gZXhjbHVkZWQubWRkX2lkYDtcbiAgICBhd2FpdCBwZy5xdWVyeShzcWwpO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgZ2V0Rm9yZWlnbkxpc3QocGcpIHtcbiAgICBjb25zdCB0YWJsZSA9ICd0b3BvLmJvdW5kYXJ5JztcbiAgICBjb25zdCBzcWwgPSBgc2VsZWN0IGlkLCB6aF9uYW1lIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPiA5MDAwMDAgb3JkZXIgYnkgaWQgYXNjYDtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBwZy5xdWVyeShzcWwpO1xuICAgIGNvbnN0IGxpc3QgPSBbXTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByZXMucm93cykge1xuICAgICAgbGlzdC5wdXNoKHtcbiAgICAgICAgaWQ6ICtyb3dbJ2lkJ10sXG4gICAgICAgIG5hbWU6IHJvd1snemhfbmFtZSddXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Q7XG4gIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBMaWJUb3BvQm91bmRhcnk7Il19