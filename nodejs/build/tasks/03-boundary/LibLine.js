'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Utils = _interopRequireDefault(require("./../../modules/Utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class LibLine {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMy1ib3VuZGFyeS9MaWJMaW5lLmpzIl0sIm5hbWVzIjpbIkxpYkxpbmUiLCJnZXRGb3JlaWduTGlzdCIsInBnIiwidGFibGUiLCJzcWwiLCJyZXMiLCJxdWVyeSIsImxpc3QiLCJyb3ciLCJyb3dzIiwicHVzaCIsImlkIiwibmFtZSIsImNhbGNGb3JlaWduT3V0ZXJKdW5jdHVyZXMiLCJ0aGVJZCIsIml0ZW0iLCJVdGlscyIsImNhbGwiLCJjYWxjT3V0ZXJKdW5jdHVyZSIsImJpbmQiLCJjYWxjRm9yZWlnbklubmVySnVuY3R1cmVzIiwiY2FsY0lubmVySnVuY3R1cmUiLCJjYWxjRm9yZWlnbkNvYXN0bGluZXMiLCJjYWxjQ29hc3RsaW5lIiwiYm91bmRhcnlUYWJsZSIsImxpbmVUYWJsZSIsInR5cGUiLCJjYXRlZ29yeSIsInRoZW4iLCJsZW5ndGgiLCJsaW5lTWVyZ2UiLCJnZW9tZXRyeVR5cGUiLCJjb25zb2xlIiwibG9nIiwiZ3BzVGFibGUiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBRUE7Ozs7QUFFQSxNQUFNQSxPQUFOLENBQWM7QUFFWixlQUFhQyxjQUFiLENBQTRCQyxFQUE1QixFQUFnQztBQUM5QixVQUFNQyxLQUFLLEdBQUcsU0FBZDtBQUNBLFVBQU1DLEdBQUcsR0FBSSwyQkFBMEJELEtBQU0sb0NBQTdDO0FBQ0EsVUFBTUUsR0FBRyxHQUFHLE1BQU1ILEVBQUUsQ0FBQ0ksS0FBSCxDQUFTRixHQUFULENBQWxCO0FBQ0EsVUFBTUcsSUFBSSxHQUFHLEVBQWI7O0FBQ0EsZUFBVyxNQUFNQyxHQUFqQixJQUF3QkgsR0FBRyxDQUFDSSxJQUE1QixFQUFrQztBQUNoQ0YsTUFBQUEsSUFBSSxDQUFDRyxJQUFMLENBQVU7QUFDUkMsUUFBQUEsRUFBRSxFQUFFLENBQUNILEdBQUcsQ0FBQyxJQUFELENBREE7QUFFUkksUUFBQUEsSUFBSSxFQUFFSixHQUFHLENBQUMsU0FBRDtBQUZELE9BQVY7QUFJRDs7QUFDRCxXQUFPRCxJQUFQO0FBQ0Q7O0FBR0QsZUFBYU0seUJBQWIsQ0FBdUNYLEVBQXZDLEVBQTJDWSxLQUFLLEdBQUcsQ0FBbkQsRUFBc0Q7QUFDcEQsVUFBTVAsSUFBSSxHQUFHLE1BQU0sS0FBS04sY0FBTCxDQUFvQkMsRUFBcEIsQ0FBbkI7O0FBQ0EsZUFBVyxNQUFNYSxJQUFqQixJQUF5QlIsSUFBekIsRUFBK0I7QUFDN0IsVUFBSU8sS0FBSyxHQUFHLENBQVosRUFBZTtBQUNiLFlBQUlBLEtBQUssS0FBS0MsSUFBSSxDQUFDSixFQUFuQixFQUF1QjtBQUNyQixnQkFBTUssZUFBTUMsSUFBTixDQUNILEtBQUlGLElBQUksQ0FBQ0gsSUFBSyxJQUFHRyxJQUFJLENBQUNKLEVBQUcsVUFEdEIsRUFFSixLQUFLTyxpQkFBTCxDQUF1QkMsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FGSSxFQUdKLENBQUNqQixFQUFELEVBQUthLElBQUksQ0FBQ0osRUFBVixFQUFjSSxJQUFJLENBQUNILElBQW5CLENBSEksQ0FBTjtBQUtEO0FBQ0YsT0FSRCxNQVFPO0FBQ0wsY0FBTUksZUFBTUMsSUFBTixDQUNILEtBQUlGLElBQUksQ0FBQ0gsSUFBSyxJQUFHRyxJQUFJLENBQUNKLEVBQUcsVUFEdEIsRUFFSixLQUFLTyxpQkFBTCxDQUF1QkMsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FGSSxFQUdKLENBQUNqQixFQUFELEVBQUthLElBQUksQ0FBQ0osRUFBVixFQUFjSSxJQUFJLENBQUNILElBQW5CLENBSEksQ0FBTjtBQUtEO0FBQ0Y7QUFDRjs7QUFHRCxlQUFhUSx5QkFBYixDQUF1Q2xCLEVBQXZDLEVBQTJDWSxLQUFLLEdBQUcsQ0FBbkQsRUFBc0Q7QUFDcEQsVUFBTVAsSUFBSSxHQUFHLE1BQU0sS0FBS04sY0FBTCxDQUFvQkMsRUFBcEIsQ0FBbkI7O0FBQ0EsZUFBVyxNQUFNYSxJQUFqQixJQUF5QlIsSUFBekIsRUFBK0I7QUFDN0IsVUFBSU8sS0FBSyxHQUFHLENBQVosRUFBZTtBQUNiLFlBQUlBLEtBQUssS0FBS0MsSUFBSSxDQUFDSixFQUFuQixFQUF1QjtBQUNyQixnQkFBTUssZUFBTUMsSUFBTixDQUNILEtBQUlGLElBQUksQ0FBQ0gsSUFBSyxJQUFHRyxJQUFJLENBQUNKLEVBQUcsVUFEdEIsRUFFSixLQUFLVSxpQkFBTCxDQUF1QkYsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FGSSxFQUdKLENBQUNqQixFQUFELEVBQUthLElBQUksQ0FBQ0osRUFBVixFQUFjSSxJQUFJLENBQUNILElBQW5CLENBSEksQ0FBTjtBQUtEO0FBQ0YsT0FSRCxNQVFPO0FBQ0wsY0FBTUksZUFBTUMsSUFBTixDQUNILEtBQUlGLElBQUksQ0FBQ0gsSUFBSyxJQUFHRyxJQUFJLENBQUNKLEVBQUcsVUFEdEIsRUFFSixLQUFLVSxpQkFBTCxDQUF1QkYsSUFBdkIsQ0FBNEIsSUFBNUIsQ0FGSSxFQUdKLENBQUNqQixFQUFELEVBQUthLElBQUksQ0FBQ0osRUFBVixFQUFjSSxJQUFJLENBQUNILElBQW5CLENBSEksQ0FBTjtBQUtEO0FBQ0Y7QUFDRjs7QUFHRCxlQUFhVSxxQkFBYixDQUFtQ3BCLEVBQW5DLEVBQXVDWSxLQUFLLEdBQUcsQ0FBL0MsRUFBa0Q7QUFDaEQsVUFBTVAsSUFBSSxHQUFHLE1BQU0sS0FBS04sY0FBTCxDQUFvQkMsRUFBcEIsQ0FBbkI7O0FBQ0EsZUFBVyxNQUFNYSxJQUFqQixJQUF5QlIsSUFBekIsRUFBK0I7QUFDN0IsVUFBSU8sS0FBSyxHQUFHLENBQVosRUFBZTtBQUNiLFlBQUlBLEtBQUssS0FBS0MsSUFBSSxDQUFDSixFQUFuQixFQUF1QjtBQUNyQixnQkFBTUssZUFBTUMsSUFBTixDQUNILEtBQUlGLElBQUksQ0FBQ0gsSUFBSyxJQUFHRyxJQUFJLENBQUNKLEVBQUcsUUFEdEIsRUFFSixLQUFLWSxhQUFMLENBQW1CSixJQUFuQixDQUF3QixJQUF4QixDQUZJLEVBR0osQ0FBQ2pCLEVBQUQsRUFBS2EsSUFBSSxDQUFDSixFQUFWLEVBQWNJLElBQUksQ0FBQ0gsSUFBbkIsQ0FISSxDQUFOO0FBS0Q7QUFDRixPQVJELE1BUU87QUFDTCxjQUFNSSxlQUFNQyxJQUFOLENBQ0gsS0FBSUYsSUFBSSxDQUFDSCxJQUFLLElBQUdHLElBQUksQ0FBQ0osRUFBRyxRQUR0QixFQUVKLEtBQUtZLGFBQUwsQ0FBbUJKLElBQW5CLENBQXdCLElBQXhCLENBRkksRUFHSixDQUFDakIsRUFBRCxFQUFLYSxJQUFJLENBQUNKLEVBQVYsRUFBY0ksSUFBSSxDQUFDSCxJQUFuQixDQUhJLENBQU47QUFLRDtBQUNGO0FBQ0Y7O0FBR0QsZUFBYVcsYUFBYixDQUEyQnJCLEVBQTNCLEVBQStCUyxFQUEvQixFQUFtQ0MsSUFBbkMsRUFBeUM7QUFDdkM7QUFDQSxVQUFNWSxhQUFhLEdBQUcsY0FBdEI7QUFDQSxVQUFNQyxTQUFTLEdBQUcsZUFBbEI7QUFDQSxVQUFNQyxJQUFJLEdBQUcsT0FBYjtBQUNBLFVBQU1DLFFBQVEsR0FBRyxXQUFqQjtBQUVBLFVBQU16QixFQUFFLENBQUNJLEtBQUgsQ0FDSCxlQUFjbUIsU0FBVSxnREFEckIsRUFFSixDQUFDZCxFQUFELEVBQUtlLElBQUwsRUFBV0MsUUFBWCxDQUZJLENBQU4sQ0FQdUMsQ0FZdkM7O0FBQ0EsVUFBTWxCLElBQUksR0FBRyxNQUFNUCxFQUFFLENBQ2xCSSxLQURnQixDQUNULGtCQUFpQm1CLFNBQVUsa0NBRGxCLEVBQ3FELENBQUNkLEVBQUQsRUFBSyxVQUFMLENBRHJELEVBRWhCaUIsSUFGZ0IsQ0FFWHZCLEdBQUcsSUFBSTtBQUNYLGFBQU9BLEdBQUcsQ0FBQ0ksSUFBSixJQUFZLEVBQW5CO0FBQ0QsS0FKZ0IsQ0FBbkI7O0FBT0EsUUFBSUEsSUFBSSxDQUFDb0IsTUFBTCxHQUFjLENBQWxCLEVBQXFCO0FBQ25CO0FBQ0EsWUFBTXpCLEdBQUcsR0FBSTs7bURBRWdDb0IsYUFBYzs7Ozs7OztlQU9sREMsU0FBVTs7Ozs7OztvQkFPTEEsU0FBVTs7OztpREFoQnhCO0FBcUJBLFlBQU12QixFQUFFLENBQUNJLEtBQUgsQ0FBU0YsR0FBVCxFQUFjLENBQUNPLEVBQUQsRUFBS2UsSUFBTCxFQUFXQyxRQUFYLEVBQXFCZixJQUFyQixDQUFkLENBQU47QUFDRCxLQXhCRCxNQXdCTztBQUNMO0FBQ0EsWUFBTVIsR0FBRyxHQUFJOzttREFFZ0NvQixhQUFjOzs7Ozs7Ozs7b0JBUzdDQyxTQUFVOzs7O2lEQVh4QjtBQWlCQSxZQUFNdkIsRUFBRSxDQUFDSSxLQUFILENBQVNGLEdBQVQsRUFBYyxDQUFDTyxFQUFELEVBQUtlLElBQUwsRUFBV0MsUUFBWCxFQUFxQmYsSUFBckIsQ0FBZCxDQUFOO0FBQ0Q7O0FBRUQsVUFBTSxLQUFLa0IsU0FBTCxDQUFlNUIsRUFBZixFQUFtQlMsRUFBbkIsRUFBdUJlLElBQXZCLEVBQTZCQyxRQUE3QixDQUFOLENBbEV1QyxDQW9FdkM7O0FBQ0EsVUFBTW5CLEdBQUcsR0FBRyxNQUFNTixFQUFFLENBQUNJLEtBQUgsQ0FDZixrREFBaURtQixTQUFVO29EQUQ1QyxFQUdoQixDQUFDZCxFQUFELEVBQUtlLElBQUwsRUFBV0MsUUFBWCxDQUhnQixFQUloQkMsSUFKZ0IsQ0FJWHZCLEdBQUcsSUFBSTtBQUNaLGFBQU9BLEdBQUcsQ0FBQ0ksSUFBSixDQUFTLENBQVQsS0FBZSxFQUF0QjtBQUNELEtBTmlCLENBQWxCO0FBT0EsVUFBTXNCLFlBQVksR0FBR3ZCLEdBQUcsQ0FBQyxXQUFELENBQUgsSUFBb0IsUUFBekM7QUFDQXdCLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLEdBQUVyQixJQUFLLElBQUdELEVBQUcsS0FBSW9CLFlBQWEsRUFBM0M7QUFDRDs7QUFJRCxlQUFhVixpQkFBYixDQUErQm5CLEVBQS9CLEVBQW1DUyxFQUFuQyxFQUF1Q0MsSUFBdkMsRUFBNkM7QUFDM0M7QUFDQSxVQUFNc0IsUUFBUSxHQUFHLFNBQWpCO0FBQ0EsVUFBTVYsYUFBYSxHQUFHLGNBQXRCO0FBQ0EsVUFBTUMsU0FBUyxHQUFHLGVBQWxCO0FBQ0EsVUFBTUMsSUFBSSxHQUFHLE9BQWI7QUFDQSxVQUFNQyxRQUFRLEdBQUcsVUFBakI7QUFFQSxVQUFNekIsRUFBRSxDQUFDSSxLQUFILENBQ0gsZUFBY21CLFNBQVUsZ0RBRHJCLEVBRUosQ0FBQ2QsRUFBRCxFQUFLZSxJQUFMLEVBQVdDLFFBQVgsQ0FGSSxDQUFOO0FBS0EsVUFBTXZCLEdBQUcsR0FBSTs7aURBRWdDb0IsYUFBYzs7Ozs7Ozs7Ozs7O3FFQVlNVSxRQUFTOzs7Ozs7O2tCQU81RFQsU0FBVTs7OzsrQ0FyQnhCO0FBMkJBLFVBQU12QixFQUFFLENBQUNJLEtBQUgsQ0FBU0YsR0FBVCxFQUFjLENBQUNPLEVBQUQsRUFBS2UsSUFBTCxFQUFXQyxRQUFYLEVBQXFCZixJQUFyQixDQUFkLENBQU47QUFFQSxVQUFNLEtBQUtrQixTQUFMLENBQWU1QixFQUFmLEVBQW1CUyxFQUFuQixFQUF1QmUsSUFBdkIsRUFBNkJDLFFBQTdCLENBQU4sQ0ExQzJDLENBNEMzQzs7QUFDQSxVQUFNbkIsR0FBRyxHQUFHLE1BQU1OLEVBQUUsQ0FBQ0ksS0FBSCxDQUNmLGtEQUFpRG1CLFNBQVU7b0RBRDVDLEVBR2hCLENBQUNkLEVBQUQsRUFBS2UsSUFBTCxFQUFXQyxRQUFYLENBSGdCLEVBSWhCQyxJQUpnQixDQUlYdkIsR0FBRyxJQUFJO0FBQ1osYUFBT0EsR0FBRyxDQUFDSSxJQUFKLENBQVMsQ0FBVCxLQUFlLEVBQXRCO0FBQ0QsS0FOaUIsQ0FBbEI7QUFPQSxVQUFNc0IsWUFBWSxHQUFHdkIsR0FBRyxDQUFDLFdBQUQsQ0FBSCxJQUFvQixVQUF6QztBQUNBd0IsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQWEsR0FBRXJCLElBQUssSUFBR0QsRUFBRyxLQUFJb0IsWUFBYSxFQUEzQztBQUNEOztBQUdELGVBQWFiLGlCQUFiLENBQStCaEIsRUFBL0IsRUFBbUNTLEVBQW5DLEVBQXVDQyxJQUF2QyxFQUE2QztBQUMzQztBQUNBLFVBQU1zQixRQUFRLEdBQUcsU0FBakI7QUFDQSxVQUFNVixhQUFhLEdBQUcsY0FBdEI7QUFDQSxVQUFNQyxTQUFTLEdBQUcsZUFBbEI7QUFDQSxVQUFNQyxJQUFJLEdBQUcsT0FBYjtBQUNBLFVBQU1DLFFBQVEsR0FBRyxVQUFqQjtBQUVBLFVBQU16QixFQUFFLENBQUNJLEtBQUgsQ0FDSCxlQUFjbUIsU0FBVSxnREFEckIsRUFFSixDQUFDZCxFQUFELEVBQUtlLElBQUwsRUFBV0MsUUFBWCxDQUZJLENBQU47QUFLQSxVQUFNdkIsR0FBRyxHQUFJOztpREFFZ0NvQixhQUFjOzs7Ozs7cUVBTU1VLFFBQVM7Ozs7Ozs7a0JBTzVEVCxTQUFVOzs7OytDQWZ4QjtBQXFCQSxVQUFNdkIsRUFBRSxDQUFDSSxLQUFILENBQVNGLEdBQVQsRUFBYyxDQUFDTyxFQUFELEVBQUtlLElBQUwsRUFBV2QsSUFBWCxFQUFpQmUsUUFBakIsQ0FBZCxDQUFOO0FBRUEsVUFBTSxLQUFLRyxTQUFMLENBQWU1QixFQUFmLEVBQW1CUyxFQUFuQixFQUF1QmUsSUFBdkIsRUFBNkJDLFFBQTdCLENBQU4sQ0FwQzJDLENBc0MzQzs7QUFDQSxVQUFNbkIsR0FBRyxHQUFHLE1BQU1OLEVBQUUsQ0FBQ0ksS0FBSCxDQUNmLGtEQUFpRG1CLFNBQVU7b0RBRDVDLEVBR2hCLENBQUNkLEVBQUQsRUFBS2UsSUFBTCxFQUFXQyxRQUFYLENBSGdCLEVBSWhCQyxJQUpnQixDQUlYdkIsR0FBRyxJQUFJO0FBQ1osYUFBT0EsR0FBRyxDQUFDSSxJQUFKLENBQVMsQ0FBVCxLQUFlLEVBQXRCO0FBQ0QsS0FOaUIsQ0FBbEI7QUFPQSxVQUFNc0IsWUFBWSxHQUFHdkIsR0FBRyxDQUFDLFdBQUQsQ0FBSCxJQUFvQixVQUF6QztBQUNBd0IsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQWEsR0FBRXJCLElBQUssSUFBR0QsRUFBRyxLQUFJb0IsWUFBYSxFQUEzQztBQUNEOztBQUlELGVBQWFELFNBQWIsQ0FBdUI1QixFQUF2QixFQUEyQlMsRUFBM0IsRUFBK0JlLElBQS9CLEVBQXFDQyxRQUFyQyxFQUErQztBQUM3QyxVQUFNeEIsS0FBSyxHQUFHLGVBQWQ7QUFDQSxVQUFNRCxFQUFFLENBQUNJLEtBQUgsQ0FDSCxVQUFTSCxLQUFNLDhFQURaLEVBRUosQ0FBQ1EsRUFBRCxFQUFLZSxJQUFMLEVBQVdDLFFBQVgsQ0FGSSxDQUFOO0FBSUQ7O0FBeFJXOztlQThSQzNCLE8iLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBVdGlscyBmcm9tICcuLy4uLy4uL21vZHVsZXMvVXRpbHMnO1xuXG5jbGFzcyBMaWJMaW5lIHtcblxuICBzdGF0aWMgYXN5bmMgZ2V0Rm9yZWlnbkxpc3QocGcpIHtcbiAgICBjb25zdCB0YWJsZSA9ICdncHMubWZ3JztcbiAgICBjb25zdCBzcWwgPSBgc2VsZWN0IGlkLCB6aF9uYW1lIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPiA5MDAwMDAgb3JkZXIgYnkgaWQgYXNjYDtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBwZy5xdWVyeShzcWwpO1xuICAgIGNvbnN0IGxpc3QgPSBbXTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByZXMucm93cykge1xuICAgICAgbGlzdC5wdXNoKHtcbiAgICAgICAgaWQ6ICtyb3dbJ2lkJ10sXG4gICAgICAgIG5hbWU6IHJvd1snemhfbmFtZSddXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Q7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBjYWxjRm9yZWlnbk91dGVySnVuY3R1cmVzKHBnLCB0aGVJZCA9IDApIHtcbiAgICBjb25zdCBsaXN0ID0gYXdhaXQgdGhpcy5nZXRGb3JlaWduTGlzdChwZyk7XG4gICAgZm9yIGF3YWl0IChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICAgIGlmICh0aGVJZCA+IDApIHtcbiAgICAgICAgaWYgKHRoZUlkID09PSBpdGVtLmlkKSB7XG4gICAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChcbiAgICAgICAgICAgIGDorqHnrpcke2l0ZW0ubmFtZX0jJHtpdGVtLmlkfeeahOWkluWciOmZhuWcsOi+ueeVjOe6v2AsXG4gICAgICAgICAgICB0aGlzLmNhbGNPdXRlckp1bmN0dXJlLmJpbmQodGhpcyksXG4gICAgICAgICAgICBbcGcsIGl0ZW0uaWQsIGl0ZW0ubmFtZV1cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCBVdGlscy5jYWxsKFxuICAgICAgICAgIGDorqHnrpcke2l0ZW0ubmFtZX0jJHtpdGVtLmlkfeeahOWkluWciOmZhuWcsOi+ueeVjOe6v2AsXG4gICAgICAgICAgdGhpcy5jYWxjT3V0ZXJKdW5jdHVyZS5iaW5kKHRoaXMpLFxuICAgICAgICAgIFtwZywgaXRlbS5pZCwgaXRlbS5uYW1lXVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGNhbGNGb3JlaWduSW5uZXJKdW5jdHVyZXMocGcsIHRoZUlkID0gMCkge1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCB0aGlzLmdldEZvcmVpZ25MaXN0KHBnKTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgbGlzdCkge1xuICAgICAgaWYgKHRoZUlkID4gMCkge1xuICAgICAgICBpZiAodGhlSWQgPT09IGl0ZW0uaWQpIHtcbiAgICAgICAgICBhd2FpdCBVdGlscy5jYWxsKFxuICAgICAgICAgICAgYOiuoeeulyR7aXRlbS5uYW1lfSMke2l0ZW0uaWR955qE5YaF5ZyI6ZmG5Zyw6L6555WM57q/YCxcbiAgICAgICAgICAgIHRoaXMuY2FsY0lubmVySnVuY3R1cmUuYmluZCh0aGlzKSxcbiAgICAgICAgICAgIFtwZywgaXRlbS5pZCwgaXRlbS5uYW1lXVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IFV0aWxzLmNhbGwoXG4gICAgICAgICAgYOiuoeeulyR7aXRlbS5uYW1lfSMke2l0ZW0uaWR955qE5YaF5ZyI6ZmG5Zyw6L6555WM57q/YCxcbiAgICAgICAgICB0aGlzLmNhbGNJbm5lckp1bmN0dXJlLmJpbmQodGhpcyksXG4gICAgICAgICAgW3BnLCBpdGVtLmlkLCBpdGVtLm5hbWVdXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgY2FsY0ZvcmVpZ25Db2FzdGxpbmVzKHBnLCB0aGVJZCA9IDApIHtcbiAgICBjb25zdCBsaXN0ID0gYXdhaXQgdGhpcy5nZXRGb3JlaWduTGlzdChwZyk7XG4gICAgZm9yIGF3YWl0IChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICAgIGlmICh0aGVJZCA+IDApIHtcbiAgICAgICAgaWYgKHRoZUlkID09PSBpdGVtLmlkKSB7XG4gICAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChcbiAgICAgICAgICAgIGDorqHnrpcke2l0ZW0ubmFtZX0jJHtpdGVtLmlkfeeahOa1t+WyuOi+ueeVjOe6v2AsXG4gICAgICAgICAgICB0aGlzLmNhbGNDb2FzdGxpbmUuYmluZCh0aGlzKSxcbiAgICAgICAgICAgIFtwZywgaXRlbS5pZCwgaXRlbS5uYW1lXVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IFV0aWxzLmNhbGwoXG4gICAgICAgICAgYOiuoeeulyR7aXRlbS5uYW1lfSMke2l0ZW0uaWR955qE5rW35bK46L6555WM57q/YCxcbiAgICAgICAgICB0aGlzLmNhbGNDb2FzdGxpbmUuYmluZCh0aGlzKSxcbiAgICAgICAgICBbcGcsIGl0ZW0uaWQsIGl0ZW0ubmFtZV1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBjYWxjQ29hc3RsaW5lKHBnLCBpZCwgbmFtZSkge1xuICAgIC8vIOmAmui/hyBib3VuZGFyeSDlkowganVuY3R1cmUg5YGa5beu6ZuG5p2l5rGCIGNvYXN0bGluZVxuICAgIGNvbnN0IGJvdW5kYXJ5VGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgICBjb25zdCBsaW5lVGFibGUgPSAnYm91bmRhcnkubGluZSc7XG4gICAgY29uc3QgdHlwZSA9ICdvdXRlcic7XG4gICAgY29uc3QgY2F0ZWdvcnkgPSAnY29hc3RsaW5lJztcblxuICAgIGF3YWl0IHBnLnF1ZXJ5KFxuICAgICAgYGRlbGV0ZSBmcm9tICR7bGluZVRhYmxlfSB3aGVyZSBpZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApO1xuXG4gICAgLy8g5piv5ZCm5pyJanVuY3R1cmVcbiAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgIC5xdWVyeShgc2VsZWN0IGlkIGZyb20gJHtsaW5lVGFibGV9IHdoZXJlIGlkID0gJDEgYW5kIGNhdGVnb3J5ID0gJDJgLCBbaWQsICdqdW5jdHVyZSddKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgfSlcbiAgICA7XG5cbiAgICBpZiAocm93cy5sZW5ndGggPiAwKSB7XG4gICAgICAvLyDmnIlqdW5jdHVyZVxuICAgICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCAoc3RfZHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHtib3VuZGFyeVRhYmxlfSB3aGVyZSBpZCA9ICQxXG4gICAgICApXG4gICAgICAsIHRiIGFzIChcbiAgICAgICAgc2VsZWN0IDEgYXMgaWQsIHN0X2NvbGxlY3Qoc3RfZXh0ZXJpb3JyaW5nKGdlb20pKSBhcyBnZW9tIGZyb20gdGEgXG4gICAgICApXG4gICAgICAsIHRjIGFzIChcbiAgICAgICAgc2VsZWN0IDEgYXMgaWQsIHN0X2NvbGxlY3QoZ2VvbSkgYXMgZ2VvbSBcbiAgICAgICAgZnJvbSAke2xpbmVUYWJsZX0gd2hlcmUgaWQgPSAkMSBhbmQgY2F0ZWdvcnkgPSAnanVuY3R1cmUnXG4gICAgICApXG4gICAgICAsIHRkIGFzIChcbiAgICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgaWQsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCAkNDo6dmFyY2hhciBhcyBuYW1lLCBcbiAgICAgICAgc3RfZGlmZmVyZW5jZSh0Yi5nZW9tLCBzdF9tYWtldmFsaWQodGMuZ2VvbSkpIGFzIGdlb20gXG4gICAgICAgIGZyb20gdGIgbGVmdCBqb2luIHRjIG9uIHRiLmlkID0gdGMuaWRcbiAgICAgIClcbiAgICAgIGluc2VydCBpbnRvICR7bGluZVRhYmxlfSAoaWQsIHR5cGUsIGNhdGVnb3J5LCBuYW1lLCBnZW9tKSBcbiAgICAgIHNlbGVjdCBpZCwgdHlwZSwgY2F0ZWdvcnksIG5hbWUsIGdlb20gXG4gICAgICBmcm9tIHRkIHdoZXJlIHN0X25wb2ludHMoZ2VvbSkgPiAwIFxuICAgICAgb24gY29uZmxpY3QgKGlkLCB0eXBlLCBjYXRlZ29yeSkgZG8gdXBkYXRlIHNldCBcbiAgICAgIG5hbWUgPSBleGNsdWRlZC5uYW1lLCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZCwgdHlwZSwgY2F0ZWdvcnksIG5hbWVdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8g5peganVuY3R1cmVcbiAgICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgICAgdGEgYXMgKFxuICAgICAgICBzZWxlY3QgKHN0X2R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tICR7Ym91bmRhcnlUYWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCAxIGFzIGlkLCBzdF9jb2xsZWN0KHN0X2V4dGVyaW9ycmluZyhnZW9tKSkgYXMgZ2VvbSBmcm9tIHRhIFxuICAgICAgKVxuICAgICAgLCB0YyBhcyAoXG4gICAgICAgIHNlbGVjdCAkMTo6YmlnaW50IGFzIGlkLCAkMjo6dmFyY2hhciBhcyB0eXBlLCAkMzo6dmFyY2hhciBhcyBjYXRlZ29yeSwgJDQ6OnZhcmNoYXIgYXMgbmFtZSwgZ2VvbSBcbiAgICAgICAgZnJvbSB0YiAgXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke2xpbmVUYWJsZX0gKGlkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZSwgZ2VvbSkgXG4gICAgICBzZWxlY3QgaWQsIHR5cGUsIGNhdGVnb3J5LCBuYW1lLCBnZW9tIFxuICAgICAgZnJvbSB0YyB3aGVyZSBzdF9ucG9pbnRzKGdlb20pID4gMCBcbiAgICAgIG9uIGNvbmZsaWN0IChpZCwgdHlwZSwgY2F0ZWdvcnkpIGRvIHVwZGF0ZSBzZXQgXG4gICAgICBuYW1lID0gZXhjbHVkZWQubmFtZSwgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuXG4gICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZCwgdHlwZSwgY2F0ZWdvcnksIG5hbWVdKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLmxpbmVNZXJnZShwZywgaWQsIHR5cGUsIGNhdGVnb3J5KTtcblxuICAgIC8vIGdlb20gdHlwZVxuICAgIGNvbnN0IHJvdyA9IGF3YWl0IHBnLnF1ZXJ5KFxuICAgICAgYHNlbGVjdCBzdF9nZW9tZXRyeXR5cGUoZ2VvbSkgYXMgZ2VvbV90eXBlIGZyb20gJHtsaW5lVGFibGV9IFxuICAgICAgd2hlcmUgaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKS50aGVuKHJlcyA9PiB7XG4gICAgICByZXR1cm4gcmVzLnJvd3NbMF0gfHwge307XG4gICAgfSk7XG4gICAgY29uc3QgZ2VvbWV0cnlUeXBlID0gcm93WydnZW9tX3R5cGUnXSB8fCAn5peg5rW35bK46L6555WM57q/JztcbiAgICBjb25zb2xlLmxvZyhgJHtuYW1lfSMke2lkfTogJHtnZW9tZXRyeVR5cGV9YCk7XG4gIH1cblxuXG5cbiAgc3RhdGljIGFzeW5jIGNhbGNJbm5lckp1bmN0dXJlKHBnLCBpZCwgbmFtZSkge1xuICAgIC8vIOmAmui/h2dwc+S4jmJvdW5kYXJ555qE5Lqk6ZuG5rGCanVuY3R1cmVcbiAgICBjb25zdCBncHNUYWJsZSA9ICdncHMubWZ3JztcbiAgICBjb25zdCBib3VuZGFyeVRhYmxlID0gJ2JvdW5kYXJ5Lm1mdyc7XG4gICAgY29uc3QgbGluZVRhYmxlID0gJ2JvdW5kYXJ5LmxpbmUnO1xuICAgIGNvbnN0IHR5cGUgPSAnaW5uZXInO1xuICAgIGNvbnN0IGNhdGVnb3J5ID0gJ2p1bmN0dXJlJztcblxuICAgIGF3YWl0IHBnLnF1ZXJ5KFxuICAgICAgYGRlbGV0ZSBmcm9tICR7bGluZVRhYmxlfSB3aGVyZSBpZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApO1xuXG4gICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgdGEgYXMgKFxuICAgICAgc2VsZWN0IChzdF9kdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSAke2JvdW5kYXJ5VGFibGV9IHdoZXJlIGlkID0gJDFcbiAgICApXG4gICAgLCB0YiBhcyAoXG4gICAgICBzZWxlY3Qgc3RfZHVtcHJpbmdzKGdlb20pIGFzIGR1bXAgZnJvbSB0YVxuICAgIClcbiAgICAsIHRjIGFzIChcbiAgICAgIHNlbGVjdCAoZHVtcCkucGF0aFsxXSBhcyBwYXRoLCAoZHVtcCkuZ2VvbSBhcyBnZW9tIGZyb20gdGIgXG4gICAgKVxuICAgICwgdGQgYXMgKFxuICAgICAgc2VsZWN0IDEgYXMgaWQsIHN0X2xpbmVtZXJnZShzdF9jb2xsZWN0KHN0X2JvdW5kYXJ5KGdlb20pKSkgYXMgZ2VvbSBmcm9tIHRjIHdoZXJlIHBhdGggPiAwXG4gICAgKVxuICAgICwgdGUgYXMgKFxuICAgICAgc2VsZWN0IDEgYXMgaWQsIHN0X2xpbmVtZXJnZShzdF9ib3VuZGFyeShnZW9tKSkgYXMgZ2VvbSBmcm9tICR7Z3BzVGFibGV9IHdoZXJlIGlkID0gJDFcbiAgICApXG4gICAgLCB0ZiBhcyAoXG4gICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyBpZCwgJDI6OnZhcmNoYXIgYXMgdHlwZSwgJDM6OnZhcmNoYXIgYXMgY2F0ZWdvcnksICQ0Ojp2YXJjaGFyIGFzIG5hbWUsIFxuICAgICAgc3RfaW50ZXJzZWN0aW9uKHRlLmdlb20sIHN0X21ha2V2YWxpZCh0ZC5nZW9tKSkgYXMgZ2VvbSBcbiAgICAgIGZyb20gdGUgbGVmdCBqb2luIHRkIG9uIHRlLmlkID0gdGQuaWRcbiAgICApXG4gICAgaW5zZXJ0IGludG8gJHtsaW5lVGFibGV9IChpZCwgdHlwZSwgY2F0ZWdvcnksIG5hbWUsIGdlb20pIFxuICAgIHNlbGVjdCBpZCwgdHlwZSwgY2F0ZWdvcnksIG5hbWUsIGdlb20gZnJvbSB0ZiBcbiAgICB3aGVyZSBzdF9ucG9pbnRzKGdlb20pID4gMFxuICAgIG9uIGNvbmZsaWN0IChpZCwgdHlwZSwgY2F0ZWdvcnkpIGRvIHVwZGF0ZSBzZXQgXG4gICAgbmFtZSA9IGV4Y2x1ZGVkLm5hbWUsIGdlb20gPSBleGNsdWRlZC5nZW9tYDtcblxuICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZV0pO1xuXG4gICAgYXdhaXQgdGhpcy5saW5lTWVyZ2UocGcsIGlkLCB0eXBlLCBjYXRlZ29yeSk7XG5cbiAgICAvLyBnZW9tIHR5cGVcbiAgICBjb25zdCByb3cgPSBhd2FpdCBwZy5xdWVyeShcbiAgICAgIGBzZWxlY3Qgc3RfZ2VvbWV0cnl0eXBlKGdlb20pIGFzIGdlb21fdHlwZSBmcm9tICR7bGluZVRhYmxlfSBcbiAgICAgIHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgcmV0dXJuIHJlcy5yb3dzWzBdIHx8IHt9O1xuICAgIH0pO1xuICAgIGNvbnN0IGdlb21ldHJ5VHlwZSA9IHJvd1snZ2VvbV90eXBlJ10gfHwgJ+aXoOWGheWciOmZhuWcsOi+ueeVjOe6vyc7XG4gICAgY29uc29sZS5sb2coYCR7bmFtZX0jJHtpZH06ICR7Z2VvbWV0cnlUeXBlfWApO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgY2FsY091dGVySnVuY3R1cmUocGcsIGlkLCBuYW1lKSB7XG4gICAgLy8g6YCa6L+HZ3Bz5LiOYm91bmRhcnnnmoTkuqTpm4bmsYJqdW5jdHVyZVxuICAgIGNvbnN0IGdwc1RhYmxlID0gJ2dwcy5tZncnO1xuICAgIGNvbnN0IGJvdW5kYXJ5VGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgICBjb25zdCBsaW5lVGFibGUgPSAnYm91bmRhcnkubGluZSc7XG4gICAgY29uc3QgdHlwZSA9ICdvdXRlcic7XG4gICAgY29uc3QgY2F0ZWdvcnkgPSAnanVuY3R1cmUnO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoXG4gICAgICBgZGVsZXRlIGZyb20gJHtsaW5lVGFibGV9IHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICk7XG5cbiAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICB0YSBhcyAoXG4gICAgICBzZWxlY3QgKHN0X2R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tICR7Ym91bmRhcnlUYWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgIClcbiAgICAsIHRiIGFzIChcbiAgICAgIHNlbGVjdCAxIGFzIGlkLCBzdF9saW5lbWVyZ2Uoc3RfY29sbGVjdChzdF9leHRlcmlvcnJpbmcoZ2VvbSkpKSBhcyBnZW9tIGZyb20gdGFcbiAgICApXG4gICAgLCB0YyBhcyAoXG4gICAgICBzZWxlY3QgMSBhcyBpZCwgc3RfbGluZW1lcmdlKHN0X2JvdW5kYXJ5KGdlb20pKSBhcyBnZW9tIGZyb20gJHtncHNUYWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgIClcbiAgICAsIHRkIGFzIChcbiAgICAgIHNlbGVjdCAkMTo6YmlnaW50IGFzIGlkLCAkMjo6dmFyY2hhciBhcyB0eXBlLCAkMzo6dmFyY2hhciBhcyBuYW1lLCBcbiAgICAgIHN0X2ludGVyc2VjdGlvbih0Yi5nZW9tLCBzdF9tYWtldmFsaWQodGMuZ2VvbSkpIGFzIGdlb20gXG4gICAgICBmcm9tIHRiIGxlZnQgam9pbiB0YyBvbiB0Yi5pZCA9IHRjLmlkXG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7bGluZVRhYmxlfSAoaWQsIHR5cGUsIGNhdGVnb3J5LCBuYW1lLCBnZW9tKSBcbiAgICBzZWxlY3QgaWQsIHR5cGUsICQ0Ojp2YXJjaGFyIGFzIGNhdGVnb3J5LCBuYW1lLCBnZW9tIGZyb20gdGQgXG4gICAgd2hlcmUgc3RfbnBvaW50cyhnZW9tKSA+IDAgXG4gICAgb24gY29uZmxpY3QgKGlkLCB0eXBlLCBjYXRlZ29yeSkgZG8gdXBkYXRlIHNldCBcbiAgICBuYW1lID0gZXhjbHVkZWQubmFtZSwgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWQsIHR5cGUsIG5hbWUsIGNhdGVnb3J5XSk7XG5cbiAgICBhd2FpdCB0aGlzLmxpbmVNZXJnZShwZywgaWQsIHR5cGUsIGNhdGVnb3J5KTtcblxuICAgIC8vIGdlb20gdHlwZVxuICAgIGNvbnN0IHJvdyA9IGF3YWl0IHBnLnF1ZXJ5KFxuICAgICAgYHNlbGVjdCBzdF9nZW9tZXRyeXR5cGUoZ2VvbSkgYXMgZ2VvbV90eXBlIGZyb20gJHtsaW5lVGFibGV9IFxuICAgICAgd2hlcmUgaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKS50aGVuKHJlcyA9PiB7XG4gICAgICByZXR1cm4gcmVzLnJvd3NbMF0gfHwge307XG4gICAgfSk7XG4gICAgY29uc3QgZ2VvbWV0cnlUeXBlID0gcm93WydnZW9tX3R5cGUnXSB8fCAn5peg5aSW5ZyI6ZmG5Zyw6L6555WM57q/JztcbiAgICBjb25zb2xlLmxvZyhgJHtuYW1lfSMke2lkfTogJHtnZW9tZXRyeVR5cGV9YCk7XG4gIH1cblxuXG5cbiAgc3RhdGljIGFzeW5jIGxpbmVNZXJnZShwZywgaWQsIHR5cGUsIGNhdGVnb3J5KSB7XG4gICAgY29uc3QgdGFibGUgPSAnYm91bmRhcnkubGluZSc7XG4gICAgYXdhaXQgcGcucXVlcnkoXG4gICAgICBgdXBkYXRlICR7dGFibGV9IHNldCBnZW9tID0gc3RfbGluZW1lcmdlKGdlb20pIHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICk7XG4gIH1cblxuXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgTGliTGluZTsiXX0=