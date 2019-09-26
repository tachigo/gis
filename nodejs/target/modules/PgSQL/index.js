'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _pg = require("pg");

var _merge = _interopRequireDefault(require("merge"));

var _Utils = _interopRequireDefault(require("./../Utils"));

var _PostGis = _interopRequireDefault(require("./PostGis"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class PgSQL {
  static async pool(key, config = {}) {
    if (!this.pools[key]) {
      const configuration = await _Utils.default.getConfiguration('pgsql');
      const tmpConfig = (0, _merge.default)(true, configuration[key]);
      config = (0, _merge.default)(tmpConfig, config);

      if (Object.keys(config).length === 0) {
        throw new Error(`PgSQL 连接参数错误`);
      }

      const pool = new _pg.Pool(config);
      pool.on('error', (err, client) => {
        client.release();
        console.error(err.stack);
      });
      this.pools[key] = pool;
    }

    return this.pools[key];
  }

  static getPostGis() {
    return _PostGis.default;
  }

}

PgSQL.pools = {};
var _default = PgSQL;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2R1bGVzL1BnU1FML2luZGV4LmpzIl0sIm5hbWVzIjpbIlBnU1FMIiwicG9vbCIsImtleSIsImNvbmZpZyIsInBvb2xzIiwiY29uZmlndXJhdGlvbiIsIlV0aWxzIiwiZ2V0Q29uZmlndXJhdGlvbiIsInRtcENvbmZpZyIsIk9iamVjdCIsImtleXMiLCJsZW5ndGgiLCJFcnJvciIsIlBvb2wiLCJvbiIsImVyciIsImNsaWVudCIsInJlbGVhc2UiLCJjb25zb2xlIiwiZXJyb3IiLCJzdGFjayIsImdldFBvc3RHaXMiLCJQb3N0R2lzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQUVBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBRUEsTUFBTUEsS0FBTixDQUFZO0FBSVYsZUFBYUMsSUFBYixDQUFrQkMsR0FBbEIsRUFBdUJDLE1BQU0sR0FBRyxFQUFoQyxFQUFvQztBQUNsQyxRQUFJLENBQUMsS0FBS0MsS0FBTCxDQUFXRixHQUFYLENBQUwsRUFBc0I7QUFDcEIsWUFBTUcsYUFBYSxHQUFHLE1BQU1DLGVBQU1DLGdCQUFOLENBQXVCLE9BQXZCLENBQTVCO0FBQ0EsWUFBTUMsU0FBUyxHQUFHLG9CQUFNLElBQU4sRUFBWUgsYUFBYSxDQUFDSCxHQUFELENBQXpCLENBQWxCO0FBQ0FDLE1BQUFBLE1BQU0sR0FBRyxvQkFBTUssU0FBTixFQUFpQkwsTUFBakIsQ0FBVDs7QUFDQSxVQUFJTSxNQUFNLENBQUNDLElBQVAsQ0FBWVAsTUFBWixFQUFvQlEsTUFBcEIsS0FBK0IsQ0FBbkMsRUFBc0M7QUFDcEMsY0FBTSxJQUFJQyxLQUFKLENBQVcsY0FBWCxDQUFOO0FBQ0Q7O0FBQ0QsWUFBTVgsSUFBSSxHQUFHLElBQUlZLFFBQUosQ0FBU1YsTUFBVCxDQUFiO0FBQ0FGLE1BQUFBLElBQUksQ0FBQ2EsRUFBTCxDQUFRLE9BQVIsRUFBaUIsQ0FBQ0MsR0FBRCxFQUFNQyxNQUFOLEtBQWlCO0FBQ2hDQSxRQUFBQSxNQUFNLENBQUNDLE9BQVA7QUFDQUMsUUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNKLEdBQUcsQ0FBQ0ssS0FBbEI7QUFDRCxPQUhEO0FBSUEsV0FBS2hCLEtBQUwsQ0FBV0YsR0FBWCxJQUFrQkQsSUFBbEI7QUFDRDs7QUFDRCxXQUFPLEtBQUtHLEtBQUwsQ0FBV0YsR0FBWCxDQUFQO0FBQ0Q7O0FBR0QsU0FBT21CLFVBQVAsR0FBb0I7QUFDbEIsV0FBT0MsZ0JBQVA7QUFDRDs7QUF6QlM7O0FBQU50QixLLENBRUdJLEssR0FBUSxFO2VBMkJGSixLIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBQb29sIH0gZnJvbSAncGcnO1xuaW1wb3J0IG1lcmdlIGZyb20gJ21lcmdlJztcbmltcG9ydCBVdGlscyBmcm9tICcuLy4uL1V0aWxzJztcbmltcG9ydCBQb3N0R2lzIGZyb20gJy4vUG9zdEdpcyc7XG5cbmNsYXNzIFBnU1FMIHtcblxuICBzdGF0aWMgcG9vbHMgPSB7fTtcblxuICBzdGF0aWMgYXN5bmMgcG9vbChrZXksIGNvbmZpZyA9IHt9KSB7XG4gICAgaWYgKCF0aGlzLnBvb2xzW2tleV0pIHtcbiAgICAgIGNvbnN0IGNvbmZpZ3VyYXRpb24gPSBhd2FpdCBVdGlscy5nZXRDb25maWd1cmF0aW9uKCdwZ3NxbCcpO1xuICAgICAgY29uc3QgdG1wQ29uZmlnID0gbWVyZ2UodHJ1ZSwgY29uZmlndXJhdGlvbltrZXldKTtcbiAgICAgIGNvbmZpZyA9IG1lcmdlKHRtcENvbmZpZywgY29uZmlnKTtcbiAgICAgIGlmIChPYmplY3Qua2V5cyhjb25maWcpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFBnU1FMIOi/nuaOpeWPguaVsOmUmeivr2ApO1xuICAgICAgfVxuICAgICAgY29uc3QgcG9vbCA9IG5ldyBQb29sKGNvbmZpZyk7XG4gICAgICBwb29sLm9uKCdlcnJvcicsIChlcnIsIGNsaWVudCkgPT4ge1xuICAgICAgICBjbGllbnQucmVsZWFzZSgpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMucG9vbHNba2V5XSA9IHBvb2w7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnBvb2xzW2tleV07XG4gIH1cblxuXG4gIHN0YXRpYyBnZXRQb3N0R2lzKCkge1xuICAgIHJldHVybiBQb3N0R2lzO1xuICB9XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgUGdTUUw7XG4iXX0=