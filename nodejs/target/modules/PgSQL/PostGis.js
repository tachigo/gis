'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Utils = _interopRequireDefault(require("./../Utils"));

var _path = _interopRequireDefault(require("path"));

var _child_process = require("child_process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class PostGis {
  static async exportShapeFile(shpFilename, pg, sql, geomField) {
    const dir = _path.default.dirname(shpFilename);

    await _Utils.default.rmDir(dir);
    await _Utils.default.mkDir(dir);
    const {
      host,
      user,
      database,
      password,
      port,
      postGisHomePath
    } = pg.options;
    const cmd = `${postGisHomePath}/bin/pgsql2shp -f ${shpFilename}` + ` -h ${host} -p ${port} -u ${user} -P ${password} -g ${geomField} -k -b -r ${database}` + ` "${sql}"`;
    (0, _child_process.execSync)(cmd);
  }

  static async validatePolygon(pg, pk, table, pkField, geomField) {
    const sql = `with
    ta as (
        select ${pkField},
        st_multi(
          st_geometryn(
            ${geomField}, 
            generate_series(
              1, 
              st_numgeometries(${geomField})
            )
          )
        ) 
        as ${geomField},
        st_numgeometries(${geomField}) as ${geomField}_num
        from ${table}
        where ${pkField} = ${pk}
    )
    , tb as (
        select ${pkField}, st_geometrytype(${geomField}) as type,
        st_makevalid(${geomField}) as ${geomField},
        st_area(${geomField}::geography) as area
        from ta
    )
    , tc as (
        select ${pkField}, st_multi(st_union(${geomField})) as ${geomField}
        from tb
        where type in ('ST_Polygon', 'ST_MultiPolygon')
        group by ${pkField}
    )
    insert into ${table} (${pkField}, ${geomField}) 
    select ${pkField}, ${geomField} from tc 
    on conflict(${pkField}) do update set ${geomField} = excluded.${geomField}`;
    await pg.query(sql);
  }

}

var _default = PostGis;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2R1bGVzL1BnU1FML1Bvc3RHaXMuanMiXSwibmFtZXMiOlsiUG9zdEdpcyIsImV4cG9ydFNoYXBlRmlsZSIsInNocEZpbGVuYW1lIiwicGciLCJzcWwiLCJnZW9tRmllbGQiLCJkaXIiLCJQYXRoIiwiZGlybmFtZSIsIlV0aWxzIiwicm1EaXIiLCJta0RpciIsImhvc3QiLCJ1c2VyIiwiZGF0YWJhc2UiLCJwYXNzd29yZCIsInBvcnQiLCJwb3N0R2lzSG9tZVBhdGgiLCJvcHRpb25zIiwiY21kIiwidmFsaWRhdGVQb2x5Z29uIiwicGsiLCJ0YWJsZSIsInBrRmllbGQiLCJxdWVyeSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7OztBQUVBLE1BQU1BLE9BQU4sQ0FBYztBQUVaLGVBQWFDLGVBQWIsQ0FBNkJDLFdBQTdCLEVBQTBDQyxFQUExQyxFQUE4Q0MsR0FBOUMsRUFBbURDLFNBQW5ELEVBQThEO0FBQzVELFVBQU1DLEdBQUcsR0FBR0MsY0FBS0MsT0FBTCxDQUFhTixXQUFiLENBQVo7O0FBQ0EsVUFBTU8sZUFBTUMsS0FBTixDQUFZSixHQUFaLENBQU47QUFDQSxVQUFNRyxlQUFNRSxLQUFOLENBQVlMLEdBQVosQ0FBTjtBQUVBLFVBQU07QUFBRU0sTUFBQUEsSUFBRjtBQUFRQyxNQUFBQSxJQUFSO0FBQWNDLE1BQUFBLFFBQWQ7QUFBd0JDLE1BQUFBLFFBQXhCO0FBQWtDQyxNQUFBQSxJQUFsQztBQUF3Q0MsTUFBQUE7QUFBeEMsUUFBMkRkLEVBQUUsQ0FBQ2UsT0FBcEU7QUFDQSxVQUFNQyxHQUFHLEdBQUksR0FBRUYsZUFBZ0IscUJBQW9CZixXQUFZLEVBQW5ELEdBQ1AsT0FBTVUsSUFBSyxPQUFNSSxJQUFLLE9BQU1ILElBQUssT0FBTUUsUUFBUyxPQUFNVixTQUFVLGFBQVlTLFFBQVMsRUFEOUUsR0FFUCxLQUFJVixHQUFJLEdBRmI7QUFHQSxpQ0FBU2UsR0FBVDtBQUNEOztBQUVELGVBQWFDLGVBQWIsQ0FBNkJqQixFQUE3QixFQUFpQ2tCLEVBQWpDLEVBQXFDQyxLQUFyQyxFQUE0Q0MsT0FBNUMsRUFBcURsQixTQUFyRCxFQUFnRTtBQUM5RCxVQUFNRCxHQUFHLEdBQUk7O2lCQUVBbUIsT0FBUTs7O2NBR1hsQixTQUFVOzs7aUNBR1NBLFNBQVU7Ozs7YUFJOUJBLFNBQVU7MkJBQ0lBLFNBQVUsUUFBT0EsU0FBVTtlQUN2Q2lCLEtBQU07Z0JBQ0xDLE9BQVEsTUFBS0YsRUFBRzs7O2lCQUdmRSxPQUFRLHFCQUFvQmxCLFNBQVU7dUJBQ2hDQSxTQUFVLFFBQU9BLFNBQVU7a0JBQ2hDQSxTQUFVOzs7O2lCQUlYa0IsT0FBUSx1QkFBc0JsQixTQUFVLFNBQVFBLFNBQVU7OzttQkFHeERrQixPQUFROztrQkFFVEQsS0FBTSxLQUFJQyxPQUFRLEtBQUlsQixTQUFVO2FBQ3JDa0IsT0FBUSxLQUFJbEIsU0FBVTtrQkFDakJrQixPQUFRLG1CQUFrQmxCLFNBQVUsZUFBY0EsU0FBVSxFQS9CMUU7QUFnQ0EsVUFBTUYsRUFBRSxDQUNMcUIsS0FERyxDQUNHcEIsR0FESCxDQUFOO0FBR0Q7O0FBbERXOztlQXNEQ0osTyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFV0aWxzIGZyb20gJy4vLi4vVXRpbHMnO1xuaW1wb3J0IFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuXG5jbGFzcyBQb3N0R2lzIHtcblxuICBzdGF0aWMgYXN5bmMgZXhwb3J0U2hhcGVGaWxlKHNocEZpbGVuYW1lLCBwZywgc3FsLCBnZW9tRmllbGQpIHtcbiAgICBjb25zdCBkaXIgPSBQYXRoLmRpcm5hbWUoc2hwRmlsZW5hbWUpO1xuICAgIGF3YWl0IFV0aWxzLnJtRGlyKGRpcik7XG4gICAgYXdhaXQgVXRpbHMubWtEaXIoZGlyKTtcblxuICAgIGNvbnN0IHsgaG9zdCwgdXNlciwgZGF0YWJhc2UsIHBhc3N3b3JkLCBwb3J0LCBwb3N0R2lzSG9tZVBhdGh9ID0gcGcub3B0aW9ucztcbiAgICBjb25zdCBjbWQgPSBgJHtwb3N0R2lzSG9tZVBhdGh9L2Jpbi9wZ3NxbDJzaHAgLWYgJHtzaHBGaWxlbmFtZX1gXG4gICAgICArIGAgLWggJHtob3N0fSAtcCAke3BvcnR9IC11ICR7dXNlcn0gLVAgJHtwYXNzd29yZH0gLWcgJHtnZW9tRmllbGR9IC1rIC1iIC1yICR7ZGF0YWJhc2V9YFxuICAgICAgKyBgIFwiJHtzcWx9XCJgO1xuICAgIGV4ZWNTeW5jKGNtZCk7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgdmFsaWRhdGVQb2x5Z29uKHBnLCBwaywgdGFibGUsIHBrRmllbGQsIGdlb21GaWVsZCkge1xuICAgIGNvbnN0IHNxbCA9IGB3aXRoXG4gICAgdGEgYXMgKFxuICAgICAgICBzZWxlY3QgJHtwa0ZpZWxkfSxcbiAgICAgICAgc3RfbXVsdGkoXG4gICAgICAgICAgc3RfZ2VvbWV0cnluKFxuICAgICAgICAgICAgJHtnZW9tRmllbGR9LCBcbiAgICAgICAgICAgIGdlbmVyYXRlX3NlcmllcyhcbiAgICAgICAgICAgICAgMSwgXG4gICAgICAgICAgICAgIHN0X251bWdlb21ldHJpZXMoJHtnZW9tRmllbGR9KVxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKSBcbiAgICAgICAgYXMgJHtnZW9tRmllbGR9LFxuICAgICAgICBzdF9udW1nZW9tZXRyaWVzKCR7Z2VvbUZpZWxkfSkgYXMgJHtnZW9tRmllbGR9X251bVxuICAgICAgICBmcm9tICR7dGFibGV9XG4gICAgICAgIHdoZXJlICR7cGtGaWVsZH0gPSAke3BrfVxuICAgIClcbiAgICAsIHRiIGFzIChcbiAgICAgICAgc2VsZWN0ICR7cGtGaWVsZH0sIHN0X2dlb21ldHJ5dHlwZSgke2dlb21GaWVsZH0pIGFzIHR5cGUsXG4gICAgICAgIHN0X21ha2V2YWxpZCgke2dlb21GaWVsZH0pIGFzICR7Z2VvbUZpZWxkfSxcbiAgICAgICAgc3RfYXJlYSgke2dlb21GaWVsZH06Omdlb2dyYXBoeSkgYXMgYXJlYVxuICAgICAgICBmcm9tIHRhXG4gICAgKVxuICAgICwgdGMgYXMgKFxuICAgICAgICBzZWxlY3QgJHtwa0ZpZWxkfSwgc3RfbXVsdGkoc3RfdW5pb24oJHtnZW9tRmllbGR9KSkgYXMgJHtnZW9tRmllbGR9XG4gICAgICAgIGZyb20gdGJcbiAgICAgICAgd2hlcmUgdHlwZSBpbiAoJ1NUX1BvbHlnb24nLCAnU1RfTXVsdGlQb2x5Z29uJylcbiAgICAgICAgZ3JvdXAgYnkgJHtwa0ZpZWxkfVxuICAgIClcbiAgICBpbnNlcnQgaW50byAke3RhYmxlfSAoJHtwa0ZpZWxkfSwgJHtnZW9tRmllbGR9KSBcbiAgICBzZWxlY3QgJHtwa0ZpZWxkfSwgJHtnZW9tRmllbGR9IGZyb20gdGMgXG4gICAgb24gY29uZmxpY3QoJHtwa0ZpZWxkfSkgZG8gdXBkYXRlIHNldCAke2dlb21GaWVsZH0gPSBleGNsdWRlZC4ke2dlb21GaWVsZH1gO1xuICAgIGF3YWl0IHBnXG4gICAgICAucXVlcnkoc3FsKVxuICAgIDtcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IFBvc3RHaXM7Il19