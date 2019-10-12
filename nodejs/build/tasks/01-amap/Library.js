'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _terraformerWktParser = _interopRequireDefault(require("terraformer-wkt-parser"));

var _PostGis = _interopRequireDefault(require("./../../modules/PgSQL/PostGis"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Library {
  static async save(pg, id, parentId, iso, zhName, geoJson, level) {
    const table = 'amap.china';
    const sql = `with 
    ta as (
      select 
      ST_GeomFromText(
        $5, 
        4326
      )::geometry as geom
    )
    , tb as (
      select 
      ST_Multi(
        ST_GeometryN(
          ta.geom, 
          generate_series(
            1, ST_NumGeometries(ta.geom)
          )
        )
      )::geometry as geom 
      from ta
    )
    , tc as (
      select 
      ST_Union(ST_MakeValid(tb.geom)) as geom 
      from tb
    )
    , td as (
      select 
      $1::bigint as id, 
      $2::bigint as parent_id, 
      $3::varchar as iso, 
      $4::varchar as zh_name, 
      ST_Multi(
        tc.geom
      )::geometry as geom,
      $6::integer as level
      from tc
    )
    insert into ${table} (id, parent_id, iso, zh_name, geom, level) 
    select id, parent_id, iso, zh_name, geom, level from td
    on conflict (id) do update set 
    parent_id = excluded.parent_id, iso = excluded.iso, zh_name = excluded.zh_name, 
    geom = excluded.geom, level = excluded.level`;
    const params = [id, parentId, iso, zhName, _terraformerWktParser.default.convert(geoJson), level];
    await pg.query(sql, params);
    await _PostGis.default.validatePolygon(pg, id, table, 'id', 'geom');
  }

}

var _default = Library;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMS1hbWFwL0xpYnJhcnkuanMiXSwibmFtZXMiOlsiTGlicmFyeSIsInNhdmUiLCJwZyIsImlkIiwicGFyZW50SWQiLCJpc28iLCJ6aE5hbWUiLCJnZW9Kc29uIiwibGV2ZWwiLCJ0YWJsZSIsInNxbCIsInBhcmFtcyIsIldLVCIsImNvbnZlcnQiLCJxdWVyeSIsIlBvc3RHaXMiLCJ2YWxpZGF0ZVBvbHlnb24iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBRUE7O0FBRUE7Ozs7QUFFQSxNQUFNQSxPQUFOLENBQWM7QUFFWixlQUFhQyxJQUFiLENBQWtCQyxFQUFsQixFQUFzQkMsRUFBdEIsRUFBMEJDLFFBQTFCLEVBQW9DQyxHQUFwQyxFQUF5Q0MsTUFBekMsRUFBaURDLE9BQWpELEVBQTBEQyxLQUExRCxFQUFpRTtBQUMvRCxVQUFNQyxLQUFLLEdBQUcsWUFBZDtBQUNBLFVBQU1DLEdBQUcsR0FBSTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztrQkFxQ0NELEtBQU07Ozs7aURBckNwQjtBQTBDQSxVQUFNRSxNQUFNLEdBQUcsQ0FDYlIsRUFEYSxFQUNUQyxRQURTLEVBRWJDLEdBRmEsRUFFUkMsTUFGUSxFQUVBTSw4QkFBSUMsT0FBSixDQUFZTixPQUFaLENBRkEsRUFFc0JDLEtBRnRCLENBQWY7QUFJQSxVQUFNTixFQUFFLENBQUNZLEtBQUgsQ0FBU0osR0FBVCxFQUFjQyxNQUFkLENBQU47QUFFQSxVQUFNSSxpQkFBUUMsZUFBUixDQUF3QmQsRUFBeEIsRUFBNEJDLEVBQTVCLEVBQWdDTSxLQUFoQyxFQUF1QyxJQUF2QyxFQUE2QyxNQUE3QyxDQUFOO0FBQ0Q7O0FBckRXOztlQXlEQ1QsTyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFdLVCBmcm9tICd0ZXJyYWZvcm1lci13a3QtcGFyc2VyJztcblxuaW1wb3J0IFBvc3RHaXMgZnJvbSAnLi8uLi8uLi9tb2R1bGVzL1BnU1FML1Bvc3RHaXMnO1xuXG5jbGFzcyBMaWJyYXJ5IHtcblxuICBzdGF0aWMgYXN5bmMgc2F2ZShwZywgaWQsIHBhcmVudElkLCBpc28sIHpoTmFtZSwgZ2VvSnNvbiwgbGV2ZWwpIHtcbiAgICBjb25zdCB0YWJsZSA9ICdhbWFwLmNoaW5hJztcbiAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICB0YSBhcyAoXG4gICAgICBzZWxlY3QgXG4gICAgICBTVF9HZW9tRnJvbVRleHQoXG4gICAgICAgICQ1LCBcbiAgICAgICAgNDMyNlxuICAgICAgKTo6Z2VvbWV0cnkgYXMgZ2VvbVxuICAgIClcbiAgICAsIHRiIGFzIChcbiAgICAgIHNlbGVjdCBcbiAgICAgIFNUX011bHRpKFxuICAgICAgICBTVF9HZW9tZXRyeU4oXG4gICAgICAgICAgdGEuZ2VvbSwgXG4gICAgICAgICAgZ2VuZXJhdGVfc2VyaWVzKFxuICAgICAgICAgICAgMSwgU1RfTnVtR2VvbWV0cmllcyh0YS5nZW9tKVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKTo6Z2VvbWV0cnkgYXMgZ2VvbSBcbiAgICAgIGZyb20gdGFcbiAgICApXG4gICAgLCB0YyBhcyAoXG4gICAgICBzZWxlY3QgXG4gICAgICBTVF9VbmlvbihTVF9NYWtlVmFsaWQodGIuZ2VvbSkpIGFzIGdlb20gXG4gICAgICBmcm9tIHRiXG4gICAgKVxuICAgICwgdGQgYXMgKFxuICAgICAgc2VsZWN0IFxuICAgICAgJDE6OmJpZ2ludCBhcyBpZCwgXG4gICAgICAkMjo6YmlnaW50IGFzIHBhcmVudF9pZCwgXG4gICAgICAkMzo6dmFyY2hhciBhcyBpc28sIFxuICAgICAgJDQ6OnZhcmNoYXIgYXMgemhfbmFtZSwgXG4gICAgICBTVF9NdWx0aShcbiAgICAgICAgdGMuZ2VvbVxuICAgICAgKTo6Z2VvbWV0cnkgYXMgZ2VvbSxcbiAgICAgICQ2OjppbnRlZ2VyIGFzIGxldmVsXG4gICAgICBmcm9tIHRjXG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7dGFibGV9IChpZCwgcGFyZW50X2lkLCBpc28sIHpoX25hbWUsIGdlb20sIGxldmVsKSBcbiAgICBzZWxlY3QgaWQsIHBhcmVudF9pZCwgaXNvLCB6aF9uYW1lLCBnZW9tLCBsZXZlbCBmcm9tIHRkXG4gICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IFxuICAgIHBhcmVudF9pZCA9IGV4Y2x1ZGVkLnBhcmVudF9pZCwgaXNvID0gZXhjbHVkZWQuaXNvLCB6aF9uYW1lID0gZXhjbHVkZWQuemhfbmFtZSwgXG4gICAgZ2VvbSA9IGV4Y2x1ZGVkLmdlb20sIGxldmVsID0gZXhjbHVkZWQubGV2ZWxgO1xuICAgIGNvbnN0IHBhcmFtcyA9IFtcbiAgICAgIGlkLCBwYXJlbnRJZCxcbiAgICAgIGlzbywgemhOYW1lLCBXS1QuY29udmVydChnZW9Kc29uKSwgbGV2ZWxcbiAgICBdO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgcGFyYW1zKTtcblxuICAgIGF3YWl0IFBvc3RHaXMudmFsaWRhdGVQb2x5Z29uKHBnLCBpZCwgdGFibGUsICdpZCcsICdnZW9tJyk7XG4gIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBMaWJyYXJ5OyJdfQ==