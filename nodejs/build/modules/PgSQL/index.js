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
  static async client(key, config = {}) {
    const pool = await PgSQL.pool(key, config);
    return await pool.connect();
  }

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
        console.error(err.stack);
        client.release();
      });
      this.pools[key] = pool;
    }

    return await this.pools[key];
  }

  static getPostGis() {
    return _PostGis.default;
  }

}

PgSQL.pools = {};
var _default = PgSQL;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2R1bGVzL1BnU1FML2luZGV4LmpzIl0sIm5hbWVzIjpbIlBnU1FMIiwiY2xpZW50Iiwia2V5IiwiY29uZmlnIiwicG9vbCIsImNvbm5lY3QiLCJwb29scyIsImNvbmZpZ3VyYXRpb24iLCJVdGlscyIsImdldENvbmZpZ3VyYXRpb24iLCJ0bXBDb25maWciLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwiRXJyb3IiLCJQb29sIiwib24iLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJzdGFjayIsInJlbGVhc2UiLCJnZXRQb3N0R2lzIiwiUG9zdEdpcyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLE1BQU1BLEtBQU4sQ0FBWTtBQUlWLGVBQWFDLE1BQWIsQ0FBb0JDLEdBQXBCLEVBQXlCQyxNQUFNLEdBQUcsRUFBbEMsRUFBc0M7QUFDcEMsVUFBTUMsSUFBSSxHQUFHLE1BQU1KLEtBQUssQ0FBQ0ksSUFBTixDQUFXRixHQUFYLEVBQWdCQyxNQUFoQixDQUFuQjtBQUNBLFdBQU8sTUFBTUMsSUFBSSxDQUFDQyxPQUFMLEVBQWI7QUFDRDs7QUFHRCxlQUFhRCxJQUFiLENBQWtCRixHQUFsQixFQUF1QkMsTUFBTSxHQUFHLEVBQWhDLEVBQW9DO0FBQ2xDLFFBQUksQ0FBQyxLQUFLRyxLQUFMLENBQVdKLEdBQVgsQ0FBTCxFQUFzQjtBQUNwQixZQUFNSyxhQUFhLEdBQUcsTUFBTUMsZUFBTUMsZ0JBQU4sQ0FBdUIsT0FBdkIsQ0FBNUI7QUFDQSxZQUFNQyxTQUFTLEdBQUcsb0JBQU0sSUFBTixFQUFZSCxhQUFhLENBQUNMLEdBQUQsQ0FBekIsQ0FBbEI7QUFDQUMsTUFBQUEsTUFBTSxHQUFHLG9CQUFNTyxTQUFOLEVBQWlCUCxNQUFqQixDQUFUOztBQUNBLFVBQUlRLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZVCxNQUFaLEVBQW9CVSxNQUFwQixLQUErQixDQUFuQyxFQUFzQztBQUNwQyxjQUFNLElBQUlDLEtBQUosQ0FBVyxjQUFYLENBQU47QUFDRDs7QUFDRCxZQUFNVixJQUFJLEdBQUcsSUFBSVcsUUFBSixDQUFTWixNQUFULENBQWI7QUFDQUMsTUFBQUEsSUFBSSxDQUFDWSxFQUFMLENBQVEsT0FBUixFQUFpQixDQUFDQyxHQUFELEVBQU1oQixNQUFOLEtBQWlCO0FBQ2hDaUIsUUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNGLEdBQUcsQ0FBQ0csS0FBbEI7QUFDQW5CLFFBQUFBLE1BQU0sQ0FBQ29CLE9BQVA7QUFDRCxPQUhEO0FBSUEsV0FBS2YsS0FBTCxDQUFXSixHQUFYLElBQWtCRSxJQUFsQjtBQUNEOztBQUNELFdBQU8sTUFBTSxLQUFLRSxLQUFMLENBQVdKLEdBQVgsQ0FBYjtBQUNEOztBQUdELFNBQU9vQixVQUFQLEdBQW9CO0FBQ2xCLFdBQU9DLGdCQUFQO0FBQ0Q7O0FBL0JTOztBQUFOdkIsSyxDQUVHTSxLLEdBQVEsRTtlQWlDRk4sSyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgUG9vbCB9IGZyb20gJ3BnJztcbmltcG9ydCBtZXJnZSBmcm9tICdtZXJnZSc7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi8uLi9VdGlscyc7XG5pbXBvcnQgUG9zdEdpcyBmcm9tICcuL1Bvc3RHaXMnO1xuXG5jbGFzcyBQZ1NRTCB7XG5cbiAgc3RhdGljIHBvb2xzID0ge307XG5cbiAgc3RhdGljIGFzeW5jIGNsaWVudChrZXksIGNvbmZpZyA9IHt9KSB7XG4gICAgY29uc3QgcG9vbCA9IGF3YWl0IFBnU1FMLnBvb2woa2V5LCBjb25maWcpO1xuICAgIHJldHVybiBhd2FpdCBwb29sLmNvbm5lY3QoKTtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIHBvb2woa2V5LCBjb25maWcgPSB7fSkge1xuICAgIGlmICghdGhpcy5wb29sc1trZXldKSB7XG4gICAgICBjb25zdCBjb25maWd1cmF0aW9uID0gYXdhaXQgVXRpbHMuZ2V0Q29uZmlndXJhdGlvbigncGdzcWwnKTtcbiAgICAgIGNvbnN0IHRtcENvbmZpZyA9IG1lcmdlKHRydWUsIGNvbmZpZ3VyYXRpb25ba2V5XSk7XG4gICAgICBjb25maWcgPSBtZXJnZSh0bXBDb25maWcsIGNvbmZpZyk7XG4gICAgICBpZiAoT2JqZWN0LmtleXMoY29uZmlnKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQZ1NRTCDov57mjqXlj4LmlbDplJnor69gKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBvb2wgPSBuZXcgUG9vbChjb25maWcpO1xuICAgICAgcG9vbC5vbignZXJyb3InLCAoZXJyLCBjbGllbnQpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2spO1xuICAgICAgICBjbGllbnQucmVsZWFzZSgpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnBvb2xzW2tleV0gPSBwb29sO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wb29sc1trZXldO1xuICB9XG5cblxuICBzdGF0aWMgZ2V0UG9zdEdpcygpIHtcbiAgICByZXR1cm4gUG9zdEdpcztcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IFBnU1FMO1xuIl19