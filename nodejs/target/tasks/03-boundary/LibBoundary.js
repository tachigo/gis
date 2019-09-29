'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Utils = _interopRequireDefault(require("./../../modules/Utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class LibBoundary {
  static async getForeignList(pg) {
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

  static async calcForeignBoundary(pg) {
    const list = await this.getForeignList(pg);
    const gpsTable = 'gps.mfw';
    const featureTable = 'boundary.water_feature';
    const table = 'boundary.mfw';

    for await (const item of list) {
      await _Utils.default.call(`${item.name}#${item.id}`, async () => {
        const sql2 = `with
        ta as (
          select 1 as id, geom
          from ${featureTable} where id = $1 and fid = $2
        )
        , tb as (
          select 1 as id, st_makevalid(geom) as geom from ${gpsTable} where id = $1
        )
        , tc as (
          select $1::bigint as id, st_difference(tb.geom, st_makevalid(ta.geom)) as geom
          from ta left join tb on ta.id = tb.id
        )
        insert into ${table} (id, geom)
        select id, geom from tc
        on conflict (id) do update set geom = excluded.geom`;
        await pg.query(sql2, [id, 'f0']);
      });
    }
  }

  static async unionForeignWaterFeature(pg) {
    const list = await this.getForeignList(pg);
    const featureTable = 'boundary.water_feature';

    for await (const item of list) {
      await _Utils.default.call(`${item.name}#${item.id}`, async () => {
        const rows = await pg.query(`select fid from ${featureTable} where id = $1 order by fid asc limit 1`, [item.id]).then(res => {
          return res.rows || [];
        });

        if (rows.length > 0) {
          await pg.query(`delete from ${featureTable} where id = $1 and fid = $2`, [item.id, 'f0']);
          const sql = `with
          ta as (
            select (st_dump(geom)).geom as geom
            from ${featureTable} where id = $1 and fid != $2
          )
          , tb as (
            select st_buffer(st_collect(geom), 0) as geom from ta
          )
          insert into ${featureTable} (id, fid, geom)
          select $1::bigint as id, $2::varchar as fid, geom from tb
          on conflict (id, fid) do update set geom = excluded.geom`;
          await pg.query(sql, [item.id, 'f0']);
        }
      });
    }
  }

  static async initForeignBoundary(pg) {
    const list = await this.getForeignList(pg);
    const fromTable = 'gps.mfw';
    const toTable = 'boundary.mfw';
    const that = this;

    for await (const item of list) {
      console.log(`${item.name}#${item.id}`);
      await _Utils.default.call(`${item.name}#${item.id}`, async () => {
        const sql = `insert into ${toTable} 
        (id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id) 
        select id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id 
        from ${fromTable} where id = $1::bigint 
        on conflict (id) do update set 
        parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso, 
        zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom, 
        region_id = excluded.region_id, mdd_id = excluded.mdd_id`;
        await pg.query(sql, [item.id]);
        await that.prepareWaterFeatures(pg, item.id);
      });
    }
  }

  static async prepareWaterFeatures(pg, id) {
    const featureTable = 'boundary.water_feature';
    await pg.query(`delete from ${featureTable} where id = $1`, [id]);
    const gpsTable = 'gps.mfw';
    const featureSourceTable = 'osm.feature_water';
    const sql = `with 
    ta as (
      select geom from ${gpsTable} where id = $1
    )
    , tb as (
      select 'f' || ${featureSourceTable}.id as fid, ${featureSourceTable}.geom as geom 
      from ${featureSourceTable}, ta
      where st_intersects(${featureSourceTable}.geom, ta.geom) = true
    )
    insert into ${featureTable} (id, fid, geom)
    select $1::bigint as id, fid::varchar, st_makevalid(geom) as geom from tb
    on conflict (id, fid) do update set 
    geom = excluded.geom`;
    await pg.query(sql, [id]);
  }

}

var _default = LibBoundary;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMy1ib3VuZGFyeS9MaWJCb3VuZGFyeS5qcyJdLCJuYW1lcyI6WyJMaWJCb3VuZGFyeSIsImdldEZvcmVpZ25MaXN0IiwicGciLCJ0YWJsZSIsInNxbCIsInJlcyIsInF1ZXJ5IiwibGlzdCIsInJvdyIsInJvd3MiLCJwdXNoIiwiaWQiLCJuYW1lIiwiY2FsY0ZvcmVpZ25Cb3VuZGFyeSIsImdwc1RhYmxlIiwiZmVhdHVyZVRhYmxlIiwiaXRlbSIsIlV0aWxzIiwiY2FsbCIsInNxbDIiLCJ1bmlvbkZvcmVpZ25XYXRlckZlYXR1cmUiLCJ0aGVuIiwibGVuZ3RoIiwiaW5pdEZvcmVpZ25Cb3VuZGFyeSIsImZyb21UYWJsZSIsInRvVGFibGUiLCJ0aGF0IiwiY29uc29sZSIsImxvZyIsInByZXBhcmVXYXRlckZlYXR1cmVzIiwiZmVhdHVyZVNvdXJjZVRhYmxlIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQUVBOzs7O0FBR0EsTUFBTUEsV0FBTixDQUFrQjtBQUdoQixlQUFhQyxjQUFiLENBQTRCQyxFQUE1QixFQUFnQztBQUM5QixVQUFNQyxLQUFLLEdBQUcsU0FBZDtBQUNBLFVBQU1DLEdBQUcsR0FBSSwyQkFBMEJELEtBQU0sb0NBQTdDO0FBQ0EsVUFBTUUsR0FBRyxHQUFHLE1BQU1ILEVBQUUsQ0FBQ0ksS0FBSCxDQUFTRixHQUFULENBQWxCO0FBQ0EsVUFBTUcsSUFBSSxHQUFHLEVBQWI7O0FBQ0EsZUFBVyxNQUFNQyxHQUFqQixJQUF3QkgsR0FBRyxDQUFDSSxJQUE1QixFQUFrQztBQUNoQ0YsTUFBQUEsSUFBSSxDQUFDRyxJQUFMLENBQVU7QUFDUkMsUUFBQUEsRUFBRSxFQUFFLENBQUNILEdBQUcsQ0FBQyxJQUFELENBREE7QUFFUkksUUFBQUEsSUFBSSxFQUFFSixHQUFHLENBQUMsU0FBRDtBQUZELE9BQVY7QUFJRDs7QUFDRCxXQUFPRCxJQUFQO0FBQ0Q7O0FBR0QsZUFBYU0sbUJBQWIsQ0FBaUNYLEVBQWpD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QUksQ0FBQ0wsRUFBbkMsQ0FBTjtBQUNELE9BWEssQ0FBTjtBQVlEO0FBQ0Y7O0FBR0QsZUFBYWtCLG9CQUFiLENBQWtDM0IsRUFBbEMsRUFBc0NTLEVBQXRDLEVBQTBDO0FBQ3hDLFVBQU1JLFlBQVksR0FBRyx3QkFBckI7QUFDQSxVQUFNYixFQUFFLENBQUNJLEtBQUgsQ0FBVSxlQUFjUyxZQUFhLGdCQUFyQyxFQUFzRCxDQUFDSixFQUFELENBQXRELENBQU47QUFFQSxVQUFNRyxRQUFRLEdBQUcsU0FBakI7QUFDQSxVQUFNZ0Isa0JBQWtCLEdBQUcsbUJBQTNCO0FBRUEsVUFBTTFCLEdBQUcsR0FBSTs7eUJBRVFVLFFBQVM7OztzQkFHWmdCLGtCQUFtQixlQUFjQSxrQkFBbUI7YUFDN0RBLGtCQUFtQjs0QkFDSkEsa0JBQW1COztrQkFFN0JmLFlBQWE7Ozt5QkFUM0I7QUFhQSxVQUFNYixFQUFFLENBQUNJLEtBQUgsQ0FBU0YsR0FBVCxFQUFjLENBQUNPLEVBQUQsQ0FBZCxDQUFOO0FBQ0Q7O0FBNUhlOztlQWdJSFgsVyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFV0aWxzIGZyb20gJy4vLi4vLi4vbW9kdWxlcy9VdGlscyc7XG5cblxuY2xhc3MgTGliQm91bmRhcnkge1xuXG5cbiAgc3RhdGljIGFzeW5jIGdldEZvcmVpZ25MaXN0KHBnKSB7XG4gICAgY29uc3QgdGFibGUgPSAnZ3BzLm1mdyc7XG4gICAgY29uc3Qgc3FsID0gYHNlbGVjdCBpZCwgemhfbmFtZSBmcm9tICR7dGFibGV9IHdoZXJlIGlkID4gOTAwMDAwIG9yZGVyIGJ5IGlkIGFzY2A7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgcGcucXVlcnkoc3FsKTtcbiAgICBjb25zdCBsaXN0ID0gW107XG4gICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2YgcmVzLnJvd3MpIHtcbiAgICAgIGxpc3QucHVzaCh7XG4gICAgICAgIGlkOiArcm93WydpZCddLFxuICAgICAgICBuYW1lOiByb3dbJ3poX25hbWUnXVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBsaXN0O1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgY2FsY0ZvcmVpZ25Cb3VuZGFyeShwZykge1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCB0aGlzLmdldEZvcmVpZ25MaXN0KHBnKTtcbiAgICBjb25zdCBncHNUYWJsZSA9ICdncHMubWZ3JztcbiAgICBjb25zdCBmZWF0dXJlVGFibGUgPSAnYm91bmRhcnkud2F0ZXJfZmVhdHVyZSc7XG4gICAgY29uc3QgdGFibGUgPSAnYm91bmRhcnkubWZ3JztcblxuICAgIGZvciBhd2FpdCAoY29uc3QgaXRlbSBvZiBsaXN0KSB7XG4gICAgICBhd2FpdCBVdGlscy5jYWxsKGAke2l0ZW0ubmFtZX0jJHtpdGVtLmlkfWAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgc3FsMiA9IGB3aXRoXG4gICAgICAgIHRhIGFzIChcbiAgICAgICAgICBzZWxlY3QgMSBhcyBpZCwgZ2VvbVxuICAgICAgICAgIGZyb20gJHtmZWF0dXJlVGFibGV9IHdoZXJlIGlkID0gJDEgYW5kIGZpZCA9ICQyXG4gICAgICAgIClcbiAgICAgICAgLCB0YiBhcyAoXG4gICAgICAgICAgc2VsZWN0IDEgYXMgaWQsIHN0X21ha2V2YWxpZChnZW9tKSBhcyBnZW9tIGZyb20gJHtncHNUYWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgICAgICApXG4gICAgICAgICwgdGMgYXMgKFxuICAgICAgICAgIHNlbGVjdCAkMTo6YmlnaW50IGFzIGlkLCBzdF9kaWZmZXJlbmNlKHRiLmdlb20sIHN0X21ha2V2YWxpZCh0YS5nZW9tKSkgYXMgZ2VvbVxuICAgICAgICAgIGZyb20gdGEgbGVmdCBqb2luIHRiIG9uIHRhLmlkID0gdGIuaWRcbiAgICAgICAgKVxuICAgICAgICBpbnNlcnQgaW50byAke3RhYmxlfSAoaWQsIGdlb20pXG4gICAgICAgIHNlbGVjdCBpZCwgZ2VvbSBmcm9tIHRjXG4gICAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbDIsIFtpZCwgJ2YwJ10pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgdW5pb25Gb3JlaWduV2F0ZXJGZWF0dXJlKHBnKSB7XG4gICAgY29uc3QgbGlzdCA9IGF3YWl0IHRoaXMuZ2V0Rm9yZWlnbkxpc3QocGcpO1xuICAgIGNvbnN0IGZlYXR1cmVUYWJsZSA9ICdib3VuZGFyeS53YXRlcl9mZWF0dXJlJztcblxuICAgIGZvciBhd2FpdCAoY29uc3QgaXRlbSBvZiBsaXN0KSB7XG4gICAgICBhd2FpdCBVdGlscy5jYWxsKGAke2l0ZW0ubmFtZX0jJHtpdGVtLmlkfWAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAgICAgLnF1ZXJ5KGBzZWxlY3QgZmlkIGZyb20gJHtmZWF0dXJlVGFibGV9IHdoZXJlIGlkID0gJDEgb3JkZXIgYnkgZmlkIGFzYyBsaW1pdCAxYCwgW2l0ZW0uaWRdKVxuICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgICAgfSlcbiAgICAgICAgO1xuICAgICAgICBpZiAocm93cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYXdhaXQgcGcucXVlcnkoYGRlbGV0ZSBmcm9tICR7ZmVhdHVyZVRhYmxlfSB3aGVyZSBpZCA9ICQxIGFuZCBmaWQgPSAkMmAsIFtpdGVtLmlkLCAnZjAnXSk7XG4gICAgICAgICAgY29uc3Qgc3FsID0gYHdpdGhcbiAgICAgICAgICB0YSBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgKHN0X2R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbVxuICAgICAgICAgICAgZnJvbSAke2ZlYXR1cmVUYWJsZX0gd2hlcmUgaWQgPSAkMSBhbmQgZmlkICE9ICQyXG4gICAgICAgICAgKVxuICAgICAgICAgICwgdGIgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IHN0X2J1ZmZlcihzdF9jb2xsZWN0KGdlb20pLCAwKSBhcyBnZW9tIGZyb20gdGFcbiAgICAgICAgICApXG4gICAgICAgICAgaW5zZXJ0IGludG8gJHtmZWF0dXJlVGFibGV9IChpZCwgZmlkLCBnZW9tKVxuICAgICAgICAgIHNlbGVjdCAkMTo6YmlnaW50IGFzIGlkLCAkMjo6dmFyY2hhciBhcyBmaWQsIGdlb20gZnJvbSB0YlxuICAgICAgICAgIG9uIGNvbmZsaWN0IChpZCwgZmlkKSBkbyB1cGRhdGUgc2V0IGdlb20gPSBleGNsdWRlZC5nZW9tYDtcbiAgICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpdGVtLmlkLCAnZjAnXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBpbml0Rm9yZWlnbkJvdW5kYXJ5KHBnKSB7XG4gICAgY29uc3QgbGlzdCA9IGF3YWl0IHRoaXMuZ2V0Rm9yZWlnbkxpc3QocGcpO1xuXG4gICAgY29uc3QgZnJvbVRhYmxlID0gJ2dwcy5tZncnO1xuICAgIGNvbnN0IHRvVGFibGUgPSAnYm91bmRhcnkubWZ3JztcblxuICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgIGZvciBhd2FpdCAoY29uc3QgaXRlbSBvZiBsaXN0KSB7XG4gICAgICBjb25zb2xlLmxvZyhgJHtpdGVtLm5hbWV9IyR7aXRlbS5pZH1gKTtcbiAgICAgIGF3YWl0IFV0aWxzLmNhbGwoYCR7aXRlbS5uYW1lfSMke2l0ZW0uaWR9YCwgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBzcWwgPSBgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSBcbiAgICAgICAgKGlkLCBwYXJlbnRfaWQsIGtleSwgbGV2ZWwsIGlzbywgemhfbmFtZSwgZW5fbmFtZSwgZ2VvbSwgcmVnaW9uX2lkLCBtZGRfaWQpIFxuICAgICAgICBzZWxlY3QgaWQsIHBhcmVudF9pZCwga2V5LCBsZXZlbCwgaXNvLCB6aF9uYW1lLCBlbl9uYW1lLCBnZW9tLCByZWdpb25faWQsIG1kZF9pZCBcbiAgICAgICAgZnJvbSAke2Zyb21UYWJsZX0gd2hlcmUgaWQgPSAkMTo6YmlnaW50IFxuICAgICAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgXG4gICAgICAgIHBhcmVudF9pZCA9IGV4Y2x1ZGVkLnBhcmVudF9pZCwga2V5ID0gZXhjbHVkZWQua2V5LCBsZXZlbCA9IGV4Y2x1ZGVkLmxldmVsLCBpc28gPSBleGNsdWRlZC5pc28sIFxuICAgICAgICB6aF9uYW1lID0gZXhjbHVkZWQuemhfbmFtZSwgZW5fbmFtZSA9IGV4Y2x1ZGVkLmVuX25hbWUsIGdlb20gPSBleGNsdWRlZC5nZW9tLCBcbiAgICAgICAgcmVnaW9uX2lkID0gZXhjbHVkZWQucmVnaW9uX2lkLCBtZGRfaWQgPSBleGNsdWRlZC5tZGRfaWRgO1xuICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpdGVtLmlkXSk7XG4gICAgICAgIGF3YWl0IHRoYXQucHJlcGFyZVdhdGVyRmVhdHVyZXMocGcsIGl0ZW0uaWQpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgcHJlcGFyZVdhdGVyRmVhdHVyZXMocGcsIGlkKSB7XG4gICAgY29uc3QgZmVhdHVyZVRhYmxlID0gJ2JvdW5kYXJ5LndhdGVyX2ZlYXR1cmUnO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSAke2ZlYXR1cmVUYWJsZX0gd2hlcmUgaWQgPSAkMWAsIFtpZF0pO1xuXG4gICAgY29uc3QgZ3BzVGFibGUgPSAnZ3BzLm1mdyc7XG4gICAgY29uc3QgZmVhdHVyZVNvdXJjZVRhYmxlID0gJ29zbS5mZWF0dXJlX3dhdGVyJztcblxuICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgIHRhIGFzIChcbiAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHtncHNUYWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgIClcbiAgICAsIHRiIGFzIChcbiAgICAgIHNlbGVjdCAnZicgfHwgJHtmZWF0dXJlU291cmNlVGFibGV9LmlkIGFzIGZpZCwgJHtmZWF0dXJlU291cmNlVGFibGV9Lmdlb20gYXMgZ2VvbSBcbiAgICAgIGZyb20gJHtmZWF0dXJlU291cmNlVGFibGV9LCB0YVxuICAgICAgd2hlcmUgc3RfaW50ZXJzZWN0cygke2ZlYXR1cmVTb3VyY2VUYWJsZX0uZ2VvbSwgdGEuZ2VvbSkgPSB0cnVlXG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7ZmVhdHVyZVRhYmxlfSAoaWQsIGZpZCwgZ2VvbSlcbiAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyBpZCwgZmlkOjp2YXJjaGFyLCBzdF9tYWtldmFsaWQoZ2VvbSkgYXMgZ2VvbSBmcm9tIHRiXG4gICAgb24gY29uZmxpY3QgKGlkLCBmaWQpIGRvIHVwZGF0ZSBzZXQgXG4gICAgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkXSk7XG4gIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBMaWJCb3VuZGFyeTsiXX0=