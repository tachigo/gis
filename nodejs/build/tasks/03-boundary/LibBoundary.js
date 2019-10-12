'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Utils = _interopRequireDefault(require("./../../modules/Utils"));

var _modules = _interopRequireDefault(require("../../modules"));

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

  static async calcForeignBoundaries(pg, theId = 0) {
    const list = await this.getForeignList(pg);

    for await (const item of list) {
      if (theId > 0) {
        if (item.id === theId) {
          await this.calcForeignBoundary(pg, item.id, item.name);
        }
      } else {
        await this.calcForeignBoundary(pg, item.id, item.name);
      }
    }
  }

  static async calcForeignBoundary(pg, id, name) {
    const gpsTable = 'gps.mfw';
    const featureTable = 'boundary.water_feature';
    const table = 'boundary.mfw';
    await _Utils.default.call(`${name}#${id}`, async () => {
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
    await _modules.default.PgSQL.getPostGis().validatePolygon(pg, id, table, 'id', 'geom');
  }

  static async unionForeignWaterFeature(pg, id, name) {
    const featureTable = 'boundary.water_feature';
    await _Utils.default.call(`${name}#${id}`, async () => {
      const rows = await pg.query(`select fid from ${featureTable} where id = $1 order by fid asc limit 1`, [id]).then(res => {
        return res.rows || [];
      });

      if (rows.length > 0) {
        await pg.query(`delete from ${featureTable} where id = $1 and fid = $2`, [id, 'f0']);
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
        await pg.query(sql, [id, 'f0']);
      }
    });
  }

  static async unionForeignWaterFeatures(pg, theId = 0) {
    const list = await this.getForeignList(pg);

    for await (const item of list) {
      if (theId > 0) {
        if (item.id === theId) {
          await this.unionForeignWaterFeature(pg, item.id, item.name);
        }
      } else {
        await this.unionForeignWaterFeature(pg, item.id, item.name);
      }
    }
  }

  static async initForeignBoundaries(pg, theId = 0) {
    const list = await this.getForeignList(pg);

    for await (const item of list) {
      if (theId > 0) {
        if (item.id === theId) {
          await this.initForeignBoundary(pg, item.id, item.name);
        }
      } else {
        await this.initForeignBoundary(pg, item.id, item.name);
      }
    }
  }

  static async initForeignBoundary(pg, id, name) {
    const fromTable = 'gps.mfw';
    const toTable = 'boundary.mfw';
    const that = this;
    await _Utils.default.call(`${name}#${id}`, async () => {
      const sql = `insert into ${toTable} 
        (id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id) 
        select id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id 
        from ${fromTable} where id = $1::bigint 
        on conflict (id) do update set 
        parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso, 
        zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom, 
        region_id = excluded.region_id, mdd_id = excluded.mdd_id`;
      await pg.query(sql, [id]);
      await that.prepareWaterFeatures(pg, id);
    });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMy1ib3VuZGFyeS9MaWJCb3VuZGFyeS5qcyJdLCJuYW1lcyI6WyJMaWJCb3VuZGFyeSIsImdldEZvcmVpZ25MaXN0IiwicGciLCJ0YWJsZSIsInNxbCIsInJlcyIsInF1ZXJ5IiwibGlzdCIsInJvdyIsInJvd3MiLCJwdXNoIiwiaWQiLCJuYW1lIiwiY2FsY0ZvcmVpZ25Cb3VuZGFyaWVzIiwidGhlSWQiLCJpdGVtIiwiY2FsY0ZvcmVpZ25Cb3VuZGFyeSIsImdwc1RhYmxlIiwiZmVhdHVyZVRhYmxlIiwiVXRpbHMiLCJjYWxsIiwic3FsMiIsIiQiLCJQZ1NRTCIsImdldFBvc3RHaXMiLCJ2YWxpZGF0ZVBvbHlnb24iLCJ1bmlvbkZvcmVpZ25XYXRlckZlYXR1cmUiLCJ0aGVuIiwibGVuZ3RoIiwidW5pb25Gb3JlaWduV2F0ZXJGZWF0dXJlcyIsImluaXRGb3JlaWduQm91bmRhcmllcyIsImluaXRGb3JlaWduQm91bmRhcnkiLCJmcm9tVGFibGUiLCJ0b1RhYmxlIiwidGhhdCIsInByZXBhcmVXYXRlckZlYXR1cmVzIiwiZmVhdHVyZVNvdXJjZVRhYmxlIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQUVBOztBQUNBOzs7O0FBR0EsTUFBTUEsV0FBTixDQUFrQjtBQUdoQixlQUFhQyxjQUFiLENBQTRCQyxFQUE1QixFQUFnQztBQUM5QixVQUFNQyxLQUFLLEdBQUcsU0FBZDtBQUNBLFVBQU1DLEdBQUcsR0FBSSwyQkFBMEJELEtBQU0sb0NBQTdDO0FBQ0EsVUFBTUUsR0FBRyxHQUFHLE1BQU1ILEVBQUUsQ0FBQ0ksS0FBSCxDQUFTRixHQUFULENBQWxCO0FBQ0EsVUFBTUcsSUFBSSxHQUFHLEVBQWI7O0FBQ0EsZUFBVyxNQUFNQyxHQUFqQixJQUF3QkgsR0FBRyxDQUFDSSxJQUE1QixFQUFrQztBQUNoQ0YsTUFBQUEsSUFBSSxDQUFDRyxJQUFMLENBQVU7QUFDUkMsUUFBQUEsRUFBRSxFQUFFLENBQUNILEdBQUcsQ0FB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aEI7QUFDQSxVQUFNQyxJQUFJLEdBQUcsSUFBYjtBQUNBLFVBQU1mLGVBQU1DLElBQU4sQ0FBWSxHQUFFUixJQUFLLElBQUdELEVBQUcsRUFBekIsRUFBNEIsWUFBWTtBQUM1QyxZQUFNUCxHQUFHLEdBQUksZUFBYzZCLE9BQVE7OztlQUcxQkQsU0FBVTs7OztpRUFIbkI7QUFRQSxZQUFNOUIsRUFBRSxDQUFDSSxLQUFILENBQVNGLEdBQVQsRUFBYyxDQUFDTyxFQUFELENBQWQsQ0FBTjtBQUNBLFlBQU11QixJQUFJLENBQUNDLG9CQUFMLENBQTBCakMsRUFBMUIsRUFBOEJTLEVBQTlCLENBQU47QUFDRCxLQVhLLENBQU47QUFZRDs7QUFHRCxlQUFhd0Isb0JBQWIsQ0FBa0NqQyxFQUFsQyxFQUFzQ1MsRUFBdEMsRUFBMEM7QUFDeEMsVUFBTU8sWUFBWSxHQUFHLHdCQUFyQjtBQUNBLFVBQU1oQixFQUFFLENBQUNJLEtBQUgsQ0FBVSxlQUFjWSxZQUFhLGdCQUFyQyxFQUFzRCxDQUFDUCxFQUFELENBQXRELENBQU47QUFFQSxVQUFNTSxRQUFRLEdBQUcsU0FBakI7QUFDQSxVQUFNbUIsa0JBQWtCLEdBQUcsbUJBQTNCO0FBRUEsVUFBTWhDLEdBQUcsR0FBSTs7eUJBRVFhLFFBQVM7OztzQkFHWm1CLGtCQUFtQixlQUFjQSxrQkFBbUI7YUFDN0RBLGtCQUFtQjs0QkFDSkEsa0JBQW1COztrQkFFN0JsQixZQUFhOzs7eUJBVDNCO0FBYUEsVUFBTWhCLEVBQUUsQ0FBQ0ksS0FBSCxDQUFTRixHQUFULEVBQWMsQ0FBQ08sRUFBRCxDQUFkLENBQU47QUFDRDs7QUEzSmU7O2VBK0pIWCxXIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi8uLi8uLi9tb2R1bGVzL1V0aWxzJztcbmltcG9ydCAkIGZyb20gXCIuLi8uLi9tb2R1bGVzXCI7XG5cblxuY2xhc3MgTGliQm91bmRhcnkge1xuXG5cbiAgc3RhdGljIGFzeW5jIGdldEZvcmVpZ25MaXN0KHBnKSB7XG4gICAgY29uc3QgdGFibGUgPSAnZ3BzLm1mdyc7XG4gICAgY29uc3Qgc3FsID0gYHNlbGVjdCBpZCwgemhfbmFtZSBmcm9tICR7dGFibGV9IHdoZXJlIGlkID4gOTAwMDAwIG9yZGVyIGJ5IGlkIGFzY2A7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgcGcucXVlcnkoc3FsKTtcbiAgICBjb25zdCBsaXN0ID0gW107XG4gICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2YgcmVzLnJvd3MpIHtcbiAgICAgIGxpc3QucHVzaCh7XG4gICAgICAgIGlkOiArcm93WydpZCddLFxuICAgICAgICBuYW1lOiByb3dbJ3poX25hbWUnXVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBsaXN0O1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgY2FsY0ZvcmVpZ25Cb3VuZGFyaWVzKHBnLCB0aGVJZCA9IDApIHtcbiAgICBjb25zdCBsaXN0ID0gYXdhaXQgdGhpcy5nZXRGb3JlaWduTGlzdChwZyk7XG4gICAgZm9yIGF3YWl0IChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICAgIGlmICh0aGVJZCA+IDApIHtcbiAgICAgICAgaWYgKGl0ZW0uaWQgPT09IHRoZUlkKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5jYWxjRm9yZWlnbkJvdW5kYXJ5KHBnLCBpdGVtLmlkLCBpdGVtLm5hbWUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCB0aGlzLmNhbGNGb3JlaWduQm91bmRhcnkocGcsIGl0ZW0uaWQsIGl0ZW0ubmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgY2FsY0ZvcmVpZ25Cb3VuZGFyeShwZywgaWQsIG5hbWUpIHtcbiAgICBjb25zdCBncHNUYWJsZSA9ICdncHMubWZ3JztcbiAgICBjb25zdCBmZWF0dXJlVGFibGUgPSAnYm91bmRhcnkud2F0ZXJfZmVhdHVyZSc7XG4gICAgY29uc3QgdGFibGUgPSAnYm91bmRhcnkubWZ3JztcblxuICAgIGF3YWl0IFV0aWxzLmNhbGwoYCR7bmFtZX0jJHtpZH1gLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBzcWwyID0gYHdpdGhcbiAgICAgICAgdGEgYXMgKFxuICAgICAgICAgIHNlbGVjdCAxIGFzIGlkLCBnZW9tXG4gICAgICAgICAgZnJvbSAke2ZlYXR1cmVUYWJsZX0gd2hlcmUgaWQgPSAkMSBhbmQgZmlkID0gJDJcbiAgICAgICAgKVxuICAgICAgICAsIHRiIGFzIChcbiAgICAgICAgICBzZWxlY3QgMSBhcyBpZCwgc3RfbWFrZXZhbGlkKGdlb20pIGFzIGdlb20gZnJvbSAke2dwc1RhYmxlfSB3aGVyZSBpZCA9ICQxXG4gICAgICAgIClcbiAgICAgICAgLCB0YyBhcyAoXG4gICAgICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgaWQsIHN0X2RpZmZlcmVuY2UodGIuZ2VvbSwgc3RfbWFrZXZhbGlkKHRhLmdlb20pKSBhcyBnZW9tXG4gICAgICAgICAgZnJvbSB0YSBsZWZ0IGpvaW4gdGIgb24gdGEuaWQgPSB0Yi5pZFxuICAgICAgICApXG4gICAgICAgIGluc2VydCBpbnRvICR7dGFibGV9IChpZCwgZ2VvbSlcbiAgICAgICAgc2VsZWN0IGlkLCBnZW9tIGZyb20gdGNcbiAgICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IGdlb20gPSBleGNsdWRlZC5nZW9tYDtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbDIsIFtpZCwgJ2YwJ10pO1xuICAgIH0pO1xuICAgIGF3YWl0ICQuUGdTUUwuZ2V0UG9zdEdpcygpLnZhbGlkYXRlUG9seWdvbihwZywgaWQsIHRhYmxlLCAnaWQnLCAnZ2VvbScpO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgdW5pb25Gb3JlaWduV2F0ZXJGZWF0dXJlKHBnLCBpZCwgbmFtZSkge1xuICAgIGNvbnN0IGZlYXR1cmVUYWJsZSA9ICdib3VuZGFyeS53YXRlcl9mZWF0dXJlJztcblxuICAgIGF3YWl0IFV0aWxzLmNhbGwoYCR7bmFtZX0jJHtpZH1gLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgICAgLnF1ZXJ5KGBzZWxlY3QgZmlkIGZyb20gJHtmZWF0dXJlVGFibGV9IHdoZXJlIGlkID0gJDEgb3JkZXIgYnkgZmlkIGFzYyBsaW1pdCAxYCwgW2lkXSlcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBpZiAocm93cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSAke2ZlYXR1cmVUYWJsZX0gd2hlcmUgaWQgPSAkMSBhbmQgZmlkID0gJDJgLCBbaWQsICdmMCddKTtcbiAgICAgICAgY29uc3Qgc3FsID0gYHdpdGhcbiAgICAgICAgICB0YSBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgKHN0X2R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbVxuICAgICAgICAgICAgZnJvbSAke2ZlYXR1cmVUYWJsZX0gd2hlcmUgaWQgPSAkMSBhbmQgZmlkICE9ICQyXG4gICAgICAgICAgKVxuICAgICAgICAgICwgdGIgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IHN0X2J1ZmZlcihzdF9jb2xsZWN0KGdlb20pLCAwKSBhcyBnZW9tIGZyb20gdGFcbiAgICAgICAgICApXG4gICAgICAgICAgaW5zZXJ0IGludG8gJHtmZWF0dXJlVGFibGV9IChpZCwgZmlkLCBnZW9tKVxuICAgICAgICAgIHNlbGVjdCAkMTo6YmlnaW50IGFzIGlkLCAkMjo6dmFyY2hhciBhcyBmaWQsIGdlb20gZnJvbSB0YlxuICAgICAgICAgIG9uIGNvbmZsaWN0IChpZCwgZmlkKSBkbyB1cGRhdGUgc2V0IGdlb20gPSBleGNsdWRlZC5nZW9tYDtcbiAgICAgICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWQsICdmMCddKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIHVuaW9uRm9yZWlnbldhdGVyRmVhdHVyZXMocGcsIHRoZUlkID0gMCkge1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCB0aGlzLmdldEZvcmVpZ25MaXN0KHBnKTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgbGlzdCkge1xuICAgICAgaWYgKHRoZUlkID4gMCkge1xuICAgICAgICBpZiAoaXRlbS5pZCA9PT0gdGhlSWQpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnVuaW9uRm9yZWlnbldhdGVyRmVhdHVyZShwZywgaXRlbS5pZCwgaXRlbS5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy51bmlvbkZvcmVpZ25XYXRlckZlYXR1cmUocGcsIGl0ZW0uaWQsIGl0ZW0ubmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGFzeW5jIGluaXRGb3JlaWduQm91bmRhcmllcyhwZywgdGhlSWQgPSAwKSB7XG4gICAgY29uc3QgbGlzdCA9IGF3YWl0IHRoaXMuZ2V0Rm9yZWlnbkxpc3QocGcpO1xuICAgIGZvciBhd2FpdCAoY29uc3QgaXRlbSBvZiBsaXN0KSB7XG4gICAgICBpZiAodGhlSWQgPiAwKSB7XG4gICAgICAgIGlmIChpdGVtLmlkID09PSB0aGVJZCkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuaW5pdEZvcmVpZ25Cb3VuZGFyeShwZywgaXRlbS5pZCwgaXRlbS5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgdGhpcy5pbml0Rm9yZWlnbkJvdW5kYXJ5KHBnLCBpdGVtLmlkLCBpdGVtLm5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGluaXRGb3JlaWduQm91bmRhcnkocGcsIGlkLCBuYW1lKSB7XG4gICAgY29uc3QgZnJvbVRhYmxlID0gJ2dwcy5tZncnO1xuICAgIGNvbnN0IHRvVGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgICBjb25zdCB0aGF0ID0gdGhpcztcbiAgICBhd2FpdCBVdGlscy5jYWxsKGAke25hbWV9IyR7aWR9YCwgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgc3FsID0gYGluc2VydCBpbnRvICR7dG9UYWJsZX0gXG4gICAgICAgIChpZCwgcGFyZW50X2lkLCBrZXksIGxldmVsLCBpc28sIHpoX25hbWUsIGVuX25hbWUsIGdlb20sIHJlZ2lvbl9pZCwgbWRkX2lkKSBcbiAgICAgICAgc2VsZWN0IGlkLCBwYXJlbnRfaWQsIGtleSwgbGV2ZWwsIGlzbywgemhfbmFtZSwgZW5fbmFtZSwgZ2VvbSwgcmVnaW9uX2lkLCBtZGRfaWQgXG4gICAgICAgIGZyb20gJHtmcm9tVGFibGV9IHdoZXJlIGlkID0gJDE6OmJpZ2ludCBcbiAgICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IFxuICAgICAgICBwYXJlbnRfaWQgPSBleGNsdWRlZC5wYXJlbnRfaWQsIGtleSA9IGV4Y2x1ZGVkLmtleSwgbGV2ZWwgPSBleGNsdWRlZC5sZXZlbCwgaXNvID0gZXhjbHVkZWQuaXNvLCBcbiAgICAgICAgemhfbmFtZSA9IGV4Y2x1ZGVkLnpoX25hbWUsIGVuX25hbWUgPSBleGNsdWRlZC5lbl9uYW1lLCBnZW9tID0gZXhjbHVkZWQuZ2VvbSwgXG4gICAgICAgIHJlZ2lvbl9pZCA9IGV4Y2x1ZGVkLnJlZ2lvbl9pZCwgbWRkX2lkID0gZXhjbHVkZWQubWRkX2lkYDtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkXSk7XG4gICAgICBhd2FpdCB0aGF0LnByZXBhcmVXYXRlckZlYXR1cmVzKHBnLCBpZCk7XG4gICAgfSk7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBwcmVwYXJlV2F0ZXJGZWF0dXJlcyhwZywgaWQpIHtcbiAgICBjb25zdCBmZWF0dXJlVGFibGUgPSAnYm91bmRhcnkud2F0ZXJfZmVhdHVyZSc7XG4gICAgYXdhaXQgcGcucXVlcnkoYGRlbGV0ZSBmcm9tICR7ZmVhdHVyZVRhYmxlfSB3aGVyZSBpZCA9ICQxYCwgW2lkXSk7XG5cbiAgICBjb25zdCBncHNUYWJsZSA9ICdncHMubWZ3JztcbiAgICBjb25zdCBmZWF0dXJlU291cmNlVGFibGUgPSAnb3NtLmZlYXR1cmVfd2F0ZXInO1xuXG4gICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgdGEgYXMgKFxuICAgICAgc2VsZWN0IGdlb20gZnJvbSAke2dwc1RhYmxlfSB3aGVyZSBpZCA9ICQxXG4gICAgKVxuICAgICwgdGIgYXMgKFxuICAgICAgc2VsZWN0ICdmJyB8fCAke2ZlYXR1cmVTb3VyY2VUYWJsZX0uaWQgYXMgZmlkLCAke2ZlYXR1cmVTb3VyY2VUYWJsZX0uZ2VvbSBhcyBnZW9tIFxuICAgICAgZnJvbSAke2ZlYXR1cmVTb3VyY2VUYWJsZX0sIHRhXG4gICAgICB3aGVyZSBzdF9pbnRlcnNlY3RzKCR7ZmVhdHVyZVNvdXJjZVRhYmxlfS5nZW9tLCB0YS5nZW9tKSA9IHRydWVcbiAgICApXG4gICAgaW5zZXJ0IGludG8gJHtmZWF0dXJlVGFibGV9IChpZCwgZmlkLCBnZW9tKVxuICAgIHNlbGVjdCAkMTo6YmlnaW50IGFzIGlkLCBmaWQ6OnZhcmNoYXIsIHN0X21ha2V2YWxpZChnZW9tKSBhcyBnZW9tIGZyb20gdGJcbiAgICBvbiBjb25mbGljdCAoaWQsIGZpZCkgZG8gdXBkYXRlIHNldCBcbiAgICBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWRdKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IExpYkJvdW5kYXJ5OyJdfQ==