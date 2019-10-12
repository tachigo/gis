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
  static async exportShapeFile(shpFilename, pgConfigKey, sql, geomField) {
    const pgConfig = (await _Utils.default.getConfiguration('pgsql'))[pgConfigKey];

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
    } = pgConfig;
    const cmd = `${postGisHomePath}/bin/pgsql2shp -f ${shpFilename}` + ` -h ${host} -p ${port} -u ${user} -P ${password} -g ${geomField} -k -b -r ${database}` + ` "${sql}"`;
    console.log(cmd);
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
        where type in ('ST_Polygon', 'ST_MultiPolygon') and area > 1
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2R1bGVzL1BnU1FML1Bvc3RHaXMuanMiXSwibmFtZXMiOlsiUG9zdEdpcyIsImV4cG9ydFNoYXBlRmlsZSIsInNocEZpbGVuYW1lIiwicGdDb25maWdLZXkiLCJzcWwiLCJnZW9tRmllbGQiLCJwZ0NvbmZpZyIsIlV0aWxzIiwiZ2V0Q29uZmlndXJhdGlvbiIsImRpciIsIlBhdGgiLCJkaXJuYW1lIiwicm1EaXIiLCJta0RpciIsImhvc3QiLCJ1c2VyIiwiZGF0YWJhc2UiLCJwYXNzd29yZCIsInBvcnQiLCJwb3N0R2lzSG9tZVBhdGgiLCJjbWQiLCJjb25zb2xlIiwibG9nIiwidmFsaWRhdGVQb2x5Z29uIiwicGciLCJwayIsInRhYmxlIiwicGtGaWVsZCIsInF1ZXJ5Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQUVBOztBQUNBOztBQUNBOzs7O0FBRUEsTUFBTUEsT0FBTixDQUFjO0FBRVosZUFBYUMsZUFBYixDQUE2QkMsV0FBN0IsRUFBMENDLFdBQTFDLEVBQXVEQyxHQUF2RCxFQUE0REMsU0FBNUQsRUFBdUU7QUFDckUsVUFBTUMsUUFBUSxHQUFHLENBQUMsTUFBTUMsZUFBTUMsZ0JBQU4sQ0FBdUIsT0FBdkIsQ0FBUCxFQUF3Q0wsV0FBeEMsQ0FBakI7O0FBQ0EsVUFBTU0sR0FBRyxHQUFHQyxjQUFLQyxPQUFMLENBQWFULFdBQWIsQ0FBWjs7QUFDQSxVQUFNSyxlQUFNSyxLQUFOLENBQVlILEdBQVosQ0FBTjtBQUNBLFVBQU1GLGVBQU1NLEtBQU4sQ0FBWUosR0FBWixDQUFOO0FBRUEsVUFBTTtBQUFFSyxNQUFBQSxJQUFGO0FBQVFDLE1BQUFBLElBQVI7QUFBY0MsTUFBQUEsUUFBZDtBQUF3QkMsTUFBQUEsUUFBeEI7QUFBa0NDLE1BQUFBLElBQWxDO0FBQXdDQyxNQUFBQTtBQUF4QyxRQUEyRGIsUUFBakU7QUFDQSxVQUFNYyxHQUFHLEdBQUksR0FBRUQsZUFBZ0IscUJBQW9CakIsV0FBWSxFQUFuRCxHQUNQLE9BQU1ZLElBQUssT0FBTUksSUFBSyxPQUFNSCxJQUFLLE9BQU1FLFFBQVMsT0FBTVosU0FBVSxhQUFZVyxRQUFTLEVBRDlFLEdBRVAsS0FBSVosR0FBSSxHQUZiO0FBR0FpQixJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWUYsR0FBWjtBQUNBLGlDQUFTQSxHQUFUO0FBQ0Q7O0FBRUQsZUFBYUcsZUFBYixDQUE2QkMsRUFBN0IsRUFBaUNDLEVBQWpDLEVBQXFDQyxLQUFyQyxFQUE0Q0MsT0FBNUMsRUFBcUR0QixTQUFyRCxFQUFnRTtBQUM5RCxVQUFNRCxHQUFHLEdBQUk7O2lCQUVBdUIsT0FBUTs7O2NBR1h0QixTQUFVOzs7aUNBR1NBLFNBQVU7Ozs7YUFJOUJBLFNBQVU7MkJBQ0lBLFNBQVUsUUFBT0EsU0FBVTtlQUN2Q3FCLEtBQU07Z0JBQ0xDLE9BQVEsTUFBS0YsRUFBRzs7O2lCQUdmRSxPQUFRLHFCQUFvQnRCLFNBQVU7dUJBQ2hDQSxTQUFVLFFBQU9BLFNBQVU7a0JBQ2hDQSxTQUFVOzs7O2lCQUlYc0IsT0FBUSx1QkFBc0J0QixTQUFVLFNBQVFBLFNBQVU7OzttQkFHeERzQixPQUFROztrQkFFVEQsS0FBTSxLQUFJQyxPQUFRLEtBQUl0QixTQUFVO2FBQ3JDc0IsT0FBUSxLQUFJdEIsU0FBVTtrQkFDakJzQixPQUFRLG1CQUFrQnRCLFNBQVUsZUFBY0EsU0FBVSxFQS9CMUU7QUFnQ0EsVUFBTW1CLEVBQUUsQ0FDTEksS0FERyxDQUNHeEIsR0FESCxDQUFOO0FBR0Q7O0FBcERXOztlQXdEQ0osTyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFV0aWxzIGZyb20gJy4vLi4vVXRpbHMnO1xuaW1wb3J0IFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuXG5jbGFzcyBQb3N0R2lzIHtcblxuICBzdGF0aWMgYXN5bmMgZXhwb3J0U2hhcGVGaWxlKHNocEZpbGVuYW1lLCBwZ0NvbmZpZ0tleSwgc3FsLCBnZW9tRmllbGQpIHtcbiAgICBjb25zdCBwZ0NvbmZpZyA9IChhd2FpdCBVdGlscy5nZXRDb25maWd1cmF0aW9uKCdwZ3NxbCcpKVtwZ0NvbmZpZ0tleV07XG4gICAgY29uc3QgZGlyID0gUGF0aC5kaXJuYW1lKHNocEZpbGVuYW1lKTtcbiAgICBhd2FpdCBVdGlscy5ybURpcihkaXIpO1xuICAgIGF3YWl0IFV0aWxzLm1rRGlyKGRpcik7XG5cbiAgICBjb25zdCB7IGhvc3QsIHVzZXIsIGRhdGFiYXNlLCBwYXNzd29yZCwgcG9ydCwgcG9zdEdpc0hvbWVQYXRofSA9IHBnQ29uZmlnO1xuICAgIGNvbnN0IGNtZCA9IGAke3Bvc3RHaXNIb21lUGF0aH0vYmluL3Bnc3FsMnNocCAtZiAke3NocEZpbGVuYW1lfWBcbiAgICAgICsgYCAtaCAke2hvc3R9IC1wICR7cG9ydH0gLXUgJHt1c2VyfSAtUCAke3Bhc3N3b3JkfSAtZyAke2dlb21GaWVsZH0gLWsgLWIgLXIgJHtkYXRhYmFzZX1gXG4gICAgICArIGAgXCIke3NxbH1cImA7XG4gICAgY29uc29sZS5sb2coY21kKTtcbiAgICBleGVjU3luYyhjbWQpO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIHZhbGlkYXRlUG9seWdvbihwZywgcGssIHRhYmxlLCBwa0ZpZWxkLCBnZW9tRmllbGQpIHtcbiAgICBjb25zdCBzcWwgPSBgd2l0aFxuICAgIHRhIGFzIChcbiAgICAgICAgc2VsZWN0ICR7cGtGaWVsZH0sXG4gICAgICAgIHN0X211bHRpKFxuICAgICAgICAgIHN0X2dlb21ldHJ5bihcbiAgICAgICAgICAgICR7Z2VvbUZpZWxkfSwgXG4gICAgICAgICAgICBnZW5lcmF0ZV9zZXJpZXMoXG4gICAgICAgICAgICAgIDEsIFxuICAgICAgICAgICAgICBzdF9udW1nZW9tZXRyaWVzKCR7Z2VvbUZpZWxkfSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgICkgXG4gICAgICAgIGFzICR7Z2VvbUZpZWxkfSxcbiAgICAgICAgc3RfbnVtZ2VvbWV0cmllcygke2dlb21GaWVsZH0pIGFzICR7Z2VvbUZpZWxkfV9udW1cbiAgICAgICAgZnJvbSAke3RhYmxlfVxuICAgICAgICB3aGVyZSAke3BrRmllbGR9ID0gJHtwa31cbiAgICApXG4gICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCAke3BrRmllbGR9LCBzdF9nZW9tZXRyeXR5cGUoJHtnZW9tRmllbGR9KSBhcyB0eXBlLFxuICAgICAgICBzdF9tYWtldmFsaWQoJHtnZW9tRmllbGR9KSBhcyAke2dlb21GaWVsZH0sXG4gICAgICAgIHN0X2FyZWEoJHtnZW9tRmllbGR9OjpnZW9ncmFwaHkpIGFzIGFyZWFcbiAgICAgICAgZnJvbSB0YVxuICAgIClcbiAgICAsIHRjIGFzIChcbiAgICAgICAgc2VsZWN0ICR7cGtGaWVsZH0sIHN0X211bHRpKHN0X3VuaW9uKCR7Z2VvbUZpZWxkfSkpIGFzICR7Z2VvbUZpZWxkfVxuICAgICAgICBmcm9tIHRiXG4gICAgICAgIHdoZXJlIHR5cGUgaW4gKCdTVF9Qb2x5Z29uJywgJ1NUX011bHRpUG9seWdvbicpIGFuZCBhcmVhID4gMVxuICAgICAgICBncm91cCBieSAke3BrRmllbGR9XG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7dGFibGV9ICgke3BrRmllbGR9LCAke2dlb21GaWVsZH0pIFxuICAgIHNlbGVjdCAke3BrRmllbGR9LCAke2dlb21GaWVsZH0gZnJvbSB0YyBcbiAgICBvbiBjb25mbGljdCgke3BrRmllbGR9KSBkbyB1cGRhdGUgc2V0ICR7Z2VvbUZpZWxkfSA9IGV4Y2x1ZGVkLiR7Z2VvbUZpZWxkfWA7XG4gICAgYXdhaXQgcGdcbiAgICAgIC5xdWVyeShzcWwpXG4gICAgO1xuICB9XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgUG9zdEdpczsiXX0=