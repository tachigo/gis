'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Utils = _interopRequireDefault(require("./../../modules/Utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class LibLine {
  static async getForeignList(pg) {
    const table = 'boundary.mfw';
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

  static async calcForeignOuterJunctures(pg, theId = 0) {
    const list = await this.getForeignList(pg);

    for await (const item of list) {
      if (theId > 0) {
        if (theId === item.id) {
          await _Utils.default.call(`计算${item.name}#${item.id}的外圈陆地边界线`, this.calcOuterJuncture.bind(this), [pg, item.id, item.name]);
        }
      } else {
        await _Utils.default.call(`计算${item.name}#${item.id}的外圈陆地边界线`, this.calcOuterJuncture.bind(this), [pg, item.id, item.name]);
      }
    }
  }

  static async calcForeignInnerJunctures(pg, theId = 0) {
    const list = await this.getForeignList(pg);

    for await (const item of list) {
      if (theId > 0) {
        if (theId === item.id) {
          await _Utils.default.call(`计算${item.name}#${item.id}的内圈陆地边界线`, this.calcInnerJuncture.bind(this), [pg, item.id, item.name]);
        }
      } else {
        await _Utils.default.call(`计算${item.name}#${item.id}的内圈陆地边界线`, this.calcInnerJuncture.bind(this), [pg, item.id, item.name]);
      }
    }
  }

  static async calcForeignCoastlines(pg, theId = 0) {
    const list = await this.getForeignList(pg);

    for await (const item of list) {
      if (theId > 0) {
        if (theId === item.id) {
          await _Utils.default.call(`计算${item.name}#${item.id}的海岸边界线`, this.calcCoastline.bind(this), [pg, item.id, item.name]);
        }
      } else {
        await _Utils.default.call(`计算${item.name}#${item.id}的海岸边界线`, this.calcCoastline.bind(this), [pg, item.id, item.name]);
      }
    }
  }

  static async calcCoastline(pg, id, name) {
    // 通过 boundary 和 juncture 做差集来求 coastline
    const boundaryTable = 'boundary.mfw';
    const lineTable = 'boundary.line';
    const type = 'outer';
    const category = 'coastline';
    await pg.query(`delete from ${lineTable} where id = $1 and type = $2 and category = $3`, [id, type, category]); // 是否有juncture

    const rows = await pg.query(`select id from ${lineTable} where id = $1 and category = $2`, [id, 'juncture']).then(res => {
      return res.rows || [];
    });

    if (rows.length > 0) {
      // 有juncture
      const sql = `with 
      ta as (
        select (st_dump(geom)).geom as geom from ${boundaryTable} where id = $1
      )
      , tb as (
        select 1 as id, st_collect(st_exteriorring(geom)) as geom from ta 
      )
      , tc as (
        select 1 as id, st_collect(geom) as geom 
        from ${lineTable} where id = $1 and category = 'juncture'
      )
      , td as (
        select $1::bigint as id, $2::varchar as type, $3::varchar as category, $4::varchar as name, 
        st_difference(tb.geom, st_makevalid(tc.geom)) as geom 
        from tb left join tc on tb.id = tc.id
      )
      insert into ${lineTable} (id, type, category, name, geom) 
      select id, type, category, name, geom 
      from td where st_npoints(geom) > 0 
      on conflict (id, type, category) do update set 
      name = excluded.name, geom = excluded.geom`;
      await pg.query(sql, [id, type, category, name]);
    } else {
      // 无juncture
      const sql = `with 
      ta as (
        select (st_dump(geom)).geom as geom from ${boundaryTable} where id = $1
      )
      , tb as (
        select 1 as id, st_collect(st_exteriorring(geom)) as geom from ta 
      )
      , tc as (
        select $1::bigint as id, $2::varchar as type, $3::varchar as category, $4::varchar as name, geom 
        from tb  
      )
      insert into ${lineTable} (id, type, category, name, geom) 
      select id, type, category, name, geom 
      from tc where st_npoints(geom) > 0 
      on conflict (id, type, category) do update set 
      name = excluded.name, geom = excluded.geom`;
      await pg.query(sql, [id, type, category, name]);
    }

    await this.lineMerge(pg, id, type, category); // geom type

    const row = await pg.query(`select st_geometrytype(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`, [id, type, category]).then(res => {
      return res.rows[0] || {};
    });
    const geometryType = row['geom_type'] || '无海岸边界线';
    console.log(`${name}#${id}: ${geometryType}`);
  }

  static async calcInnerJuncture(pg, id, name) {
    // 通过gps与boundary的交集求juncture
    const gpsTable = 'gps.mfw';
    const boundaryTable = 'boundary.mfw';
    const lineTable = 'boundary.line';
    const type = 'inner';
    const category = 'juncture';
    await pg.query(`delete from ${lineTable} where id = $1 and type = $2 and category = $3`, [id, type, category]);
    const sql = `with 
    ta as (
      select (st_dump(geom)).geom as geom from ${boundaryTable} where id = $1
    )
    , tb as (
      select st_dumprings(geom) as dump from ta
    )
    , tc as (
      select (dump).path[1] as path, (dump).geom as geom from tb 
    )
    , td as (
      select 1 as id, st_linemerge(st_collect(st_boundary(geom))) as geom from tc where path > 0
    )
    , te as (
      select 1 as id, st_linemerge(st_boundary(geom)) as geom from ${gpsTable} where id = $1
    )
    , tf as (
      select $1::bigint as id, $2::varchar as type, $3::varchar as category, $4::varchar as name, 
      st_intersection(te.geom, st_makevalid(td.geom)) as geom 
      from te left join td on te.id = td.id
    )
    insert into ${lineTable} (id, type, category, name, geom) 
    select id, type, category, name, geom from tf 
    where st_npoints(geom) > 0
    on conflict (id, type, category) do update set 
    name = excluded.name, geom = excluded.geom`;
    await pg.query(sql, [id, type, category, name]);
    await this.lineMerge(pg, id, type, category); // geom type

    const row = await pg.query(`select st_geometrytype(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`, [id, type, category]).then(res => {
      return res.rows[0] || {};
    });
    const geometryType = row['geom_type'] || '无内圈陆地边界线';
    console.log(`${name}#${id}: ${geometryType}`);
  }

  static async calcOuterJuncture(pg, id, name) {
    // 通过gps与boundary的交集求juncture
    const gpsTable = 'gps.mfw';
    const boundaryTable = 'boundary.mfw';
    const lineTable = 'boundary.line';
    const type = 'outer';
    const category = 'juncture';
    await pg.query(`delete from ${lineTable} where id = $1 and type = $2 and category = $3`, [id, type, category]);
    const sql = `with 
    ta as (
      select (st_dump(geom)).geom as geom from ${boundaryTable} where id = $1
    )
    , tb as (
      select 1 as id, st_linemerge(st_collect(st_exteriorring(geom))) as geom from ta
    )
    , tc as (
      select 1 as id, st_linemerge(st_boundary(geom)) as geom from ${gpsTable} where id = $1
    )
    , td as (
      select $1::bigint as id, $2::varchar as type, $3::varchar as name, 
      st_intersection(tb.geom, st_makevalid(tc.geom)) as geom 
      from tb left join tc on tb.id = tc.id
    )
    insert into ${lineTable} (id, type, category, name, geom) 
    select id, type, $4::varchar as category, name, geom from td 
    where st_npoints(geom) > 0 
    on conflict (id, type, category) do update set 
    name = excluded.name, geom = excluded.geom`;
    await pg.query(sql, [id, type, name, category]);
    await this.lineMerge(pg, id, type, category); // geom type

    const row = await pg.query(`select st_geometrytype(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`, [id, type, category]).then(res => {
      return res.rows[0] || {};
    });
    const geometryType = row['geom_type'] || '无外圈陆地边界线';
    console.log(`${name}#${id}: ${geometryType}`);
  }

  static async lineMerge(pg, id, type, category) {
    const table = 'boundary.line';
    await pg.query(`update ${table} set geom = st_linemerge(geom) where id = $1 and type = $2 and category = $3`, [id, type, category]);
  }

}

var _default = LibLine;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMy1ib3VuZGFyeS9MaWJMaW5lLmpzIl0sIm5hbWVzIjpbIkxpYkxpbmUiLCJnZXRGb3JlaWduTGlzdCIsInBnIiwidGFibGUiLCJzcWwiLCJyZXMiLCJxdWVyeSIsImxpc3QiLCJyb3ciLCJyb3dzIiwicHVzaCIsImlkIiwibmFtZSIsImNhbGNGb3JlaWduT3V0ZXJKdW5jdHVyZXMiLCJ0aGVJZCIsIml0ZW0iLCJVdGlscyIsImNhbGwiLCJjYWxjT3V0ZXJKdW5jdHVyZSIsImJpbmQiLCJjYWxjRm9yZWlnbklubmVySnVuY3R1cmVzIiwiY2FsY0lubmVySnVuY3R1cmUiLCJjYWxjRm9yZWlnbkNvYXN0bGluZXMiLCJjYWxjQ29hc3RsaW5lIiwiYm91bmRhcnlUYWJsZSIsImxpbmVUYWJsZSIsInR5cGUiLCJjYXRlZ29yeSIsInRoZW4iLCJsZW5ndGgiLCJsaW5lTWVyZ2UiLCJnZW9tZXRyeVR5cGUiLCJjb25zb2xlIiwibG9nIiwiZ3BzVGFibGUiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBRUE7Ozs7QUFFQSxNQUFNQSxPQUFOLENBQWM7QUFFWixlQUFhQyxjQUFiLENBQTRCQyxFQUE1QixFQUFnQztBQUM5QixVQUFNQyxLQUFLLEdBQUcsY0FBZDtBQUNBLFVBQU1DLEdBQUcsR0FBSSwyQkFBMEJELEtBQU0sb0NBQTdDO0FBQ0EsVUFBTUUsR0FBRyxHQUFHLE1BQU1ILEVBQUUsQ0FBQ0ksS0FBSCxDQUFTRixHQUFULENBQWxCO0FBQ0EsVUFBTUcsSUFBSSxHQUFHLEVBQWI7O0FBQ0EsZUFBVyxNQUFNQyxHQUFqQixJQUF3QkgsR0FBRyxDQUFDSSxJQUE1QixFQUFrQztBQUNoQ0YsTUFBQUEsSUFBSSxDQUFDRyxJQUFMLENBQVU7QUFDUkMsUUFBQUEsRUFBRSxFQUFFLENBQUNILEdBQUcsQ0FBQyxJQUFELENBREE7QUFFUkksUUFBQUEsSUFBSSxFQUFFSixHQUFHLENBQUMsU0FBRDtBQUZELE9BQVY7QUFJRDs7QUFD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ZSxJQUFMLEVBQVdDLFFBQVgsQ0FGSSxDQUFOO0FBSUQ7O0FBeFJXOztlQThSQzNCLE8iLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBVdGlscyBmcm9tICcuLy4uLy4uL21vZHVsZXMvVXRpbHMnO1xuXG5jbGFzcyBMaWJMaW5lIHtcblxuICBzdGF0aWMgYXN5bmMgZ2V0Rm9yZWlnbkxpc3QocGcpIHtcbiAgICBjb25zdCB0YWJsZSA9ICdib3VuZGFyeS5tZncnO1xuICAgIGNvbnN0IHNxbCA9IGBzZWxlY3QgaWQsIHpoX25hbWUgZnJvbSAke3RhYmxlfSB3aGVyZSBpZCA+IDkwMDAwMCBvcmRlciBieSBpZCBhc2NgO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBnLnF1ZXJ5KHNxbCk7XG4gICAgY29uc3QgbGlzdCA9IFtdO1xuICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJlcy5yb3dzKSB7XG4gICAgICBsaXN0LnB1c2goe1xuICAgICAgICBpZDogK3Jvd1snaWQnXSxcbiAgICAgICAgbmFtZTogcm93Wyd6aF9uYW1lJ11cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbGlzdDtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGNhbGNGb3JlaWduT3V0ZXJKdW5jdHVyZXMocGcsIHRoZUlkID0gMCkge1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCB0aGlzLmdldEZvcmVpZ25MaXN0KHBnKTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgbGlzdCkge1xuICAgICAgaWYgKHRoZUlkID4gMCkge1xuICAgICAgICBpZiAodGhlSWQgPT09IGl0ZW0uaWQpIHtcbiAgICAgICAgICBhd2FpdCBVdGlscy5jYWxsKFxuICAgICAgICAgICAgYOiuoeeulyR7aXRlbS5uYW1lfSMke2l0ZW0uaWR955qE5aSW5ZyI6ZmG5Zyw6L6555WM57q/YCxcbiAgICAgICAgICAgIHRoaXMuY2FsY091dGVySnVuY3R1cmUuYmluZCh0aGlzKSxcbiAgICAgICAgICAgIFtwZywgaXRlbS5pZCwgaXRlbS5uYW1lXVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IFV0aWxzLmNhbGwoXG4gICAgICAgICAgYOiuoeeulyR7aXRlbS5uYW1lfSMke2l0ZW0uaWR955qE5aSW5ZyI6ZmG5Zyw6L6555WM57q/YCxcbiAgICAgICAgICB0aGlzLmNhbGNPdXRlckp1bmN0dXJlLmJpbmQodGhpcyksXG4gICAgICAgICAgW3BnLCBpdGVtLmlkLCBpdGVtLm5hbWVdXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgY2FsY0ZvcmVpZ25Jbm5lckp1bmN0dXJlcyhwZywgdGhlSWQgPSAwKSB7XG4gICAgY29uc3QgbGlzdCA9IGF3YWl0IHRoaXMuZ2V0Rm9yZWlnbkxpc3QocGcpO1xuICAgIGZvciBhd2FpdCAoY29uc3QgaXRlbSBvZiBsaXN0KSB7XG4gICAgICBpZiAodGhlSWQgPiAwKSB7XG4gICAgICAgIGlmICh0aGVJZCA9PT0gaXRlbS5pZCkge1xuICAgICAgICAgIGF3YWl0IFV0aWxzLmNhbGwoXG4gICAgICAgICAgICBg6K6h566XJHtpdGVtLm5hbWV9IyR7aXRlbS5pZH3nmoTlhoXlnIjpmYblnLDovrnnlYznur9gLFxuICAgICAgICAgICAgdGhpcy5jYWxjSW5uZXJKdW5jdHVyZS5iaW5kKHRoaXMpLFxuICAgICAgICAgICAgW3BnLCBpdGVtLmlkLCBpdGVtLm5hbWVdXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChcbiAgICAgICAgICBg6K6h566XJHtpdGVtLm5hbWV9IyR7aXRlbS5pZH3nmoTlhoXlnIjpmYblnLDovrnnlYznur9gLFxuICAgICAgICAgIHRoaXMuY2FsY0lubmVySnVuY3R1cmUuYmluZCh0aGlzKSxcbiAgICAgICAgICBbcGcsIGl0ZW0uaWQsIGl0ZW0ubmFtZV1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBjYWxjRm9yZWlnbkNvYXN0bGluZXMocGcsIHRoZUlkID0gMCkge1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCB0aGlzLmdldEZvcmVpZ25MaXN0KHBnKTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgbGlzdCkge1xuICAgICAgaWYgKHRoZUlkID4gMCkge1xuICAgICAgICBpZiAodGhlSWQgPT09IGl0ZW0uaWQpIHtcbiAgICAgICAgICBhd2FpdCBVdGlscy5jYWxsKFxuICAgICAgICAgICAgYOiuoeeulyR7aXRlbS5uYW1lfSMke2l0ZW0uaWR955qE5rW35bK46L6555WM57q/YCxcbiAgICAgICAgICAgIHRoaXMuY2FsY0NvYXN0bGluZS5iaW5kKHRoaXMpLFxuICAgICAgICAgICAgW3BnLCBpdGVtLmlkLCBpdGVtLm5hbWVdXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChcbiAgICAgICAgICBg6K6h566XJHtpdGVtLm5hbWV9IyR7aXRlbS5pZH3nmoTmtbflsrjovrnnlYznur9gLFxuICAgICAgICAgIHRoaXMuY2FsY0NvYXN0bGluZS5iaW5kKHRoaXMpLFxuICAgICAgICAgIFtwZywgaXRlbS5pZCwgaXRlbS5uYW1lXVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGNhbGNDb2FzdGxpbmUocGcsIGlkLCBuYW1lKSB7XG4gICAgLy8g6YCa6L+HIGJvdW5kYXJ5IOWSjCBqdW5jdHVyZSDlgZrlt67pm4bmnaXmsYIgY29hc3RsaW5lXG4gICAgY29uc3QgYm91bmRhcnlUYWJsZSA9ICdib3VuZGFyeS5tZncnO1xuICAgIGNvbnN0IGxpbmVUYWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCB0eXBlID0gJ291dGVyJztcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdjb2FzdGxpbmUnO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoXG4gICAgICBgZGVsZXRlIGZyb20gJHtsaW5lVGFibGV9IHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICk7XG5cbiAgICAvLyDmmK/lkKbmnIlqdW5jdHVyZVxuICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgLnF1ZXJ5KGBzZWxlY3QgaWQgZnJvbSAke2xpbmVUYWJsZX0gd2hlcmUgaWQgPSAkMSBhbmQgY2F0ZWdvcnkgPSAkMmAsIFtpZCwgJ2p1bmN0dXJlJ10pXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICB9KVxuICAgIDtcblxuICAgIGlmIChyb3dzLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIOaciWp1bmN0dXJlXG4gICAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICAgIHRhIGFzIChcbiAgICAgICAgc2VsZWN0IChzdF9kdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSAke2JvdW5kYXJ5VGFibGV9IHdoZXJlIGlkID0gJDFcbiAgICAgIClcbiAgICAgICwgdGIgYXMgKFxuICAgICAgICBzZWxlY3QgMSBhcyBpZCwgc3RfY29sbGVjdChzdF9leHRlcmlvcnJpbmcoZ2VvbSkpIGFzIGdlb20gZnJvbSB0YSBcbiAgICAgIClcbiAgICAgICwgdGMgYXMgKFxuICAgICAgICBzZWxlY3QgMSBhcyBpZCwgc3RfY29sbGVjdChnZW9tKSBhcyBnZW9tIFxuICAgICAgICBmcm9tICR7bGluZVRhYmxlfSB3aGVyZSBpZCA9ICQxIGFuZCBjYXRlZ29yeSA9ICdqdW5jdHVyZSdcbiAgICAgIClcbiAgICAgICwgdGQgYXMgKFxuICAgICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyBpZCwgJDI6OnZhcmNoYXIgYXMgdHlwZSwgJDM6OnZhcmNoYXIgYXMgY2F0ZWdvcnksICQ0Ojp2YXJjaGFyIGFzIG5hbWUsIFxuICAgICAgICBzdF9kaWZmZXJlbmNlKHRiLmdlb20sIHN0X21ha2V2YWxpZCh0Yy5nZW9tKSkgYXMgZ2VvbSBcbiAgICAgICAgZnJvbSB0YiBsZWZ0IGpvaW4gdGMgb24gdGIuaWQgPSB0Yy5pZFxuICAgICAgKVxuICAgICAgaW5zZXJ0IGludG8gJHtsaW5lVGFibGV9IChpZCwgdHlwZSwgY2F0ZWdvcnksIG5hbWUsIGdlb20pIFxuICAgICAgc2VsZWN0IGlkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZSwgZ2VvbSBcbiAgICAgIGZyb20gdGQgd2hlcmUgc3RfbnBvaW50cyhnZW9tKSA+IDAgXG4gICAgICBvbiBjb25mbGljdCAoaWQsIHR5cGUsIGNhdGVnb3J5KSBkbyB1cGRhdGUgc2V0IFxuICAgICAgbmFtZSA9IGV4Y2x1ZGVkLm5hbWUsIGdlb20gPSBleGNsdWRlZC5nZW9tYDtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyDml6BqdW5jdHVyZVxuICAgICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCAoc3RfZHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHtib3VuZGFyeVRhYmxlfSB3aGVyZSBpZCA9ICQxXG4gICAgICApXG4gICAgICAsIHRiIGFzIChcbiAgICAgICAgc2VsZWN0IDEgYXMgaWQsIHN0X2NvbGxlY3Qoc3RfZXh0ZXJpb3JyaW5nKGdlb20pKSBhcyBnZW9tIGZyb20gdGEgXG4gICAgICApXG4gICAgICAsIHRjIGFzIChcbiAgICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgaWQsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCAkNDo6dmFyY2hhciBhcyBuYW1lLCBnZW9tIFxuICAgICAgICBmcm9tIHRiICBcbiAgICAgIClcbiAgICAgIGluc2VydCBpbnRvICR7bGluZVRhYmxlfSAoaWQsIHR5cGUsIGNhdGVnb3J5LCBuYW1lLCBnZW9tKSBcbiAgICAgIHNlbGVjdCBpZCwgdHlwZSwgY2F0ZWdvcnksIG5hbWUsIGdlb20gXG4gICAgICBmcm9tIHRjIHdoZXJlIHN0X25wb2ludHMoZ2VvbSkgPiAwIFxuICAgICAgb24gY29uZmxpY3QgKGlkLCB0eXBlLCBjYXRlZ29yeSkgZG8gdXBkYXRlIHNldCBcbiAgICAgIG5hbWUgPSBleGNsdWRlZC5uYW1lLCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG5cbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZV0pO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMubGluZU1lcmdlKHBnLCBpZCwgdHlwZSwgY2F0ZWdvcnkpO1xuXG4gICAgLy8gZ2VvbSB0eXBlXG4gICAgY29uc3Qgcm93ID0gYXdhaXQgcGcucXVlcnkoXG4gICAgICBgc2VsZWN0IHN0X2dlb21ldHJ5dHlwZShnZW9tKSBhcyBnZW9tX3R5cGUgZnJvbSAke2xpbmVUYWJsZX0gXG4gICAgICB3aGVyZSBpZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApLnRoZW4ocmVzID0+IHtcbiAgICAgIHJldHVybiByZXMucm93c1swXSB8fCB7fTtcbiAgICB9KTtcbiAgICBjb25zdCBnZW9tZXRyeVR5cGUgPSByb3dbJ2dlb21fdHlwZSddIHx8ICfml6DmtbflsrjovrnnlYznur8nO1xuICAgIGNvbnNvbGUubG9nKGAke25hbWV9IyR7aWR9OiAke2dlb21ldHJ5VHlwZX1gKTtcbiAgfVxuXG5cblxuICBzdGF0aWMgYXN5bmMgY2FsY0lubmVySnVuY3R1cmUocGcsIGlkLCBuYW1lKSB7XG4gICAgLy8g6YCa6L+HZ3Bz5LiOYm91bmRhcnnnmoTkuqTpm4bmsYJqdW5jdHVyZVxuICAgIGNvbnN0IGdwc1RhYmxlID0gJ2dwcy5tZncnO1xuICAgIGNvbnN0IGJvdW5kYXJ5VGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgICBjb25zdCBsaW5lVGFibGUgPSAnYm91bmRhcnkubGluZSc7XG4gICAgY29uc3QgdHlwZSA9ICdpbm5lcic7XG4gICAgY29uc3QgY2F0ZWdvcnkgPSAnanVuY3R1cmUnO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoXG4gICAgICBgZGVsZXRlIGZyb20gJHtsaW5lVGFibGV9IHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICk7XG5cbiAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICB0YSBhcyAoXG4gICAgICBzZWxlY3QgKHN0X2R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tICR7Ym91bmRhcnlUYWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgIClcbiAgICAsIHRiIGFzIChcbiAgICAgIHNlbGVjdCBzdF9kdW1wcmluZ3MoZ2VvbSkgYXMgZHVtcCBmcm9tIHRhXG4gICAgKVxuICAgICwgdGMgYXMgKFxuICAgICAgc2VsZWN0IChkdW1wKS5wYXRoWzFdIGFzIHBhdGgsIChkdW1wKS5nZW9tIGFzIGdlb20gZnJvbSB0YiBcbiAgICApXG4gICAgLCB0ZCBhcyAoXG4gICAgICBzZWxlY3QgMSBhcyBpZCwgc3RfbGluZW1lcmdlKHN0X2NvbGxlY3Qoc3RfYm91bmRhcnkoZ2VvbSkpKSBhcyBnZW9tIGZyb20gdGMgd2hlcmUgcGF0aCA+IDBcbiAgICApXG4gICAgLCB0ZSBhcyAoXG4gICAgICBzZWxlY3QgMSBhcyBpZCwgc3RfbGluZW1lcmdlKHN0X2JvdW5kYXJ5KGdlb20pKSBhcyBnZW9tIGZyb20gJHtncHNUYWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgIClcbiAgICAsIHRmIGFzIChcbiAgICAgIHNlbGVjdCAkMTo6YmlnaW50IGFzIGlkLCAkMjo6dmFyY2hhciBhcyB0eXBlLCAkMzo6dmFyY2hhciBhcyBjYXRlZ29yeSwgJDQ6OnZhcmNoYXIgYXMgbmFtZSwgXG4gICAgICBzdF9pbnRlcnNlY3Rpb24odGUuZ2VvbSwgc3RfbWFrZXZhbGlkKHRkLmdlb20pKSBhcyBnZW9tIFxuICAgICAgZnJvbSB0ZSBsZWZ0IGpvaW4gdGQgb24gdGUuaWQgPSB0ZC5pZFxuICAgIClcbiAgICBpbnNlcnQgaW50byAke2xpbmVUYWJsZX0gKGlkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZSwgZ2VvbSkgXG4gICAgc2VsZWN0IGlkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZSwgZ2VvbSBmcm9tIHRmIFxuICAgIHdoZXJlIHN0X25wb2ludHMoZ2VvbSkgPiAwXG4gICAgb24gY29uZmxpY3QgKGlkLCB0eXBlLCBjYXRlZ29yeSkgZG8gdXBkYXRlIHNldCBcbiAgICBuYW1lID0gZXhjbHVkZWQubmFtZSwgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWQsIHR5cGUsIGNhdGVnb3J5LCBuYW1lXSk7XG5cbiAgICBhd2FpdCB0aGlzLmxpbmVNZXJnZShwZywgaWQsIHR5cGUsIGNhdGVnb3J5KTtcblxuICAgIC8vIGdlb20gdHlwZVxuICAgIGNvbnN0IHJvdyA9IGF3YWl0IHBnLnF1ZXJ5KFxuICAgICAgYHNlbGVjdCBzdF9nZW9tZXRyeXR5cGUoZ2VvbSkgYXMgZ2VvbV90eXBlIGZyb20gJHtsaW5lVGFibGV9IFxuICAgICAgd2hlcmUgaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKS50aGVuKHJlcyA9PiB7XG4gICAgICByZXR1cm4gcmVzLnJvd3NbMF0gfHwge307XG4gICAgfSk7XG4gICAgY29uc3QgZ2VvbWV0cnlUeXBlID0gcm93WydnZW9tX3R5cGUnXSB8fCAn5peg5YaF5ZyI6ZmG5Zyw6L6555WM57q/JztcbiAgICBjb25zb2xlLmxvZyhgJHtuYW1lfSMke2lkfTogJHtnZW9tZXRyeVR5cGV9YCk7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBjYWxjT3V0ZXJKdW5jdHVyZShwZywgaWQsIG5hbWUpIHtcbiAgICAvLyDpgJrov4dncHPkuI5ib3VuZGFyeeeahOS6pOmbhuaxgmp1bmN0dXJlXG4gICAgY29uc3QgZ3BzVGFibGUgPSAnZ3BzLm1mdyc7XG4gICAgY29uc3QgYm91bmRhcnlUYWJsZSA9ICdib3VuZGFyeS5tZncnO1xuICAgIGNvbnN0IGxpbmVUYWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCB0eXBlID0gJ291dGVyJztcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdqdW5jdHVyZSc7XG5cbiAgICBhd2FpdCBwZy5xdWVyeShcbiAgICAgIGBkZWxldGUgZnJvbSAke2xpbmVUYWJsZX0gd2hlcmUgaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcblxuICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgIHRhIGFzIChcbiAgICAgIHNlbGVjdCAoc3RfZHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHtib3VuZGFyeVRhYmxlfSB3aGVyZSBpZCA9ICQxXG4gICAgKVxuICAgICwgdGIgYXMgKFxuICAgICAgc2VsZWN0IDEgYXMgaWQsIHN0X2xpbmVtZXJnZShzdF9jb2xsZWN0KHN0X2V4dGVyaW9ycmluZyhnZW9tKSkpIGFzIGdlb20gZnJvbSB0YVxuICAgIClcbiAgICAsIHRjIGFzIChcbiAgICAgIHNlbGVjdCAxIGFzIGlkLCBzdF9saW5lbWVyZ2Uoc3RfYm91bmRhcnkoZ2VvbSkpIGFzIGdlb20gZnJvbSAke2dwc1RhYmxlfSB3aGVyZSBpZCA9ICQxXG4gICAgKVxuICAgICwgdGQgYXMgKFxuICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgaWQsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIG5hbWUsIFxuICAgICAgc3RfaW50ZXJzZWN0aW9uKHRiLmdlb20sIHN0X21ha2V2YWxpZCh0Yy5nZW9tKSkgYXMgZ2VvbSBcbiAgICAgIGZyb20gdGIgbGVmdCBqb2luIHRjIG9uIHRiLmlkID0gdGMuaWRcbiAgICApXG4gICAgaW5zZXJ0IGludG8gJHtsaW5lVGFibGV9IChpZCwgdHlwZSwgY2F0ZWdvcnksIG5hbWUsIGdlb20pIFxuICAgIHNlbGVjdCBpZCwgdHlwZSwgJDQ6OnZhcmNoYXIgYXMgY2F0ZWdvcnksIG5hbWUsIGdlb20gZnJvbSB0ZCBcbiAgICB3aGVyZSBzdF9ucG9pbnRzKGdlb20pID4gMCBcbiAgICBvbiBjb25mbGljdCAoaWQsIHR5cGUsIGNhdGVnb3J5KSBkbyB1cGRhdGUgc2V0IFxuICAgIG5hbWUgPSBleGNsdWRlZC5uYW1lLCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG5cbiAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZCwgdHlwZSwgbmFtZSwgY2F0ZWdvcnldKTtcblxuICAgIGF3YWl0IHRoaXMubGluZU1lcmdlKHBnLCBpZCwgdHlwZSwgY2F0ZWdvcnkpO1xuXG4gICAgLy8gZ2VvbSB0eXBlXG4gICAgY29uc3Qgcm93ID0gYXdhaXQgcGcucXVlcnkoXG4gICAgICBgc2VsZWN0IHN0X2dlb21ldHJ5dHlwZShnZW9tKSBhcyBnZW9tX3R5cGUgZnJvbSAke2xpbmVUYWJsZX0gXG4gICAgICB3aGVyZSBpZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApLnRoZW4ocmVzID0+IHtcbiAgICAgIHJldHVybiByZXMucm93c1swXSB8fCB7fTtcbiAgICB9KTtcbiAgICBjb25zdCBnZW9tZXRyeVR5cGUgPSByb3dbJ2dlb21fdHlwZSddIHx8ICfml6DlpJblnIjpmYblnLDovrnnlYznur8nO1xuICAgIGNvbnNvbGUubG9nKGAke25hbWV9IyR7aWR9OiAke2dlb21ldHJ5VHlwZX1gKTtcbiAgfVxuXG5cblxuICBzdGF0aWMgYXN5bmMgbGluZU1lcmdlKHBnLCBpZCwgdHlwZSwgY2F0ZWdvcnkpIHtcbiAgICBjb25zdCB0YWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBhd2FpdCBwZy5xdWVyeShcbiAgICAgIGB1cGRhdGUgJHt0YWJsZX0gc2V0IGdlb20gPSBzdF9saW5lbWVyZ2UoZ2VvbSkgd2hlcmUgaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcbiAgfVxuXG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBMaWJMaW5lOyJdfQ==