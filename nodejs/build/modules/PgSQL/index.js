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
        client.release();
        console.error(err.stack);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2R1bGVzL1BnU1FML2luZGV4LmpzIl0sIm5hbWVzIjpbIlBnU1FMIiwiY2xpZW50Iiwia2V5IiwiY29uZmlnIiwicG9vbCIsImNvbm5lY3QiLCJwb29scyIsImNvbmZpZ3VyYXRpb24iLCJVdGlscyIsImdldENvbmZpZ3VyYXRpb24iLCJ0bXBDb25maWciLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwiRXJyb3IiLCJQb29sIiwib24iLCJlcnIiLCJyZWxlYXNlIiwiY29uc29sZSIsImVycm9yIiwic3RhY2siLCJnZXRQb3N0R2lzIiwiUG9zdEdpcyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLE1BQU1BLEtBQU4sQ0FBWTtBQUlWLGVBQWFDLE1BQWIsQ0FBb0JDLEdBQXBCLEVBQXlCQyxNQUFNLEdBQUcsRUFBbEMsRUFBc0M7QUFDcEMsVUFBTUMsSUFBSSxHQUFHLE1BQU1KLEtBQUssQ0FBQ0ksSUFBTixDQUFXRixHQUFYLEVBQWdCQyxNQUFoQixDQUFuQjtBQUNBLFdBQU8sTUFBTUMsSUFBSSxDQUFDQyxPQUFMLEVBQWI7QUFDRDs7QUFHRCxlQUFhRCxJQUFiLENBQWtCRixHQUFsQixFQUF1QkMsTUFBTSxHQUFHLEVBQWhDLEVBQW9DO0FBQ2xDLFFBQUksQ0FBQyxLQUFLRyxLQUFMLENBQVdKLEdBQVgsQ0FBTCxFQUFzQjtBQUNwQixZQUFNSyxhQUFhLEdBQUcsTUFBTUMsZUFBTUMsZ0JBQU4sQ0FBdUIsT0FBdkIsQ0FBNUI7QUFDQSxZQUFNQyxTQUFTLEdBQUcsb0JBQU0sSUFBTixFQUFZSCxhQUFhLENBQUNMLEdBQUQsQ0FBekIsQ0FBbEI7QUFDQUMsTUFBQUEsTUFBTSxHQUFHLG9CQUFNTyxTQUFOLEVBQWlCUCxNQUFqQixDQUFUOztBQUNBLFVBQUlRLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZVCxNQUFaLEVBQW9CVSxNQUFwQixLQUErQixDQUFuQyxFQUFzQztBQUNwQyxjQUFNLElBQUlDLEtBQUosQ0FBVyxjQUFYLENBQU47QUFDRDs7QUFDRCxZQUFNVixJQUFJLEdBQUcsSUFBSVcsUUFBSixDQUFTWixNQUFULENBQWI7QUFDQUMsTUFBQUEsSUFBSSxDQUFDWSxFQUFMLENBQVEsT0FBUixFQUFpQixDQUFDQyxHQUFELEVBQU1oQixNQUFOLEtBQWlCO0FBQ2hDQSxRQUFBQSxNQUFNLENBQUNpQixPQUFQO0FBQ0FDLFFBQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjSCxHQUFHLENBQUNJLEtBQWxCO0FBQ0QsT0FIRDtBQUlBLFdBQUtmLEtBQUwsQ0FBV0osR0FBWCxJQUFrQkUsSUFBbEI7QUFDRDs7QUFDRCxXQUFPLE1BQU0sS0FBS0UsS0FBTCxDQUFXSixHQUFYLENBQWI7QUFDRDs7QUFHRCxTQUFPb0IsVUFBUCxHQUFvQjtBQUNsQixXQUFPQyxnQkFBUDtBQUNEOztBQS9CUzs7QUFBTnZCLEssQ0FFR00sSyxHQUFRLEU7ZUFpQ0ZOLEsiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IFBvb2wgfSBmcm9tICdwZyc7XG5pbXBvcnQgbWVyZ2UgZnJvbSAnbWVyZ2UnO1xuaW1wb3J0IFV0aWxzIGZyb20gJy4vLi4vVXRpbHMnO1xuaW1wb3J0IFBvc3RHaXMgZnJvbSAnLi9Qb3N0R2lzJztcblxuY2xhc3MgUGdTUUwge1xuXG4gIHN0YXRpYyBwb29scyA9IHt9O1xuXG4gIHN0YXRpYyBhc3luYyBjbGllbnQoa2V5LCBjb25maWcgPSB7fSkge1xuICAgIGNvbnN0IHBvb2wgPSBhd2FpdCBQZ1NRTC5wb29sKGtleSwgY29uZmlnKTtcbiAgICByZXR1cm4gYXdhaXQgcG9vbC5jb25uZWN0KCk7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBwb29sKGtleSwgY29uZmlnID0ge30pIHtcbiAgICBpZiAoIXRoaXMucG9vbHNba2V5XSkge1xuICAgICAgY29uc3QgY29uZmlndXJhdGlvbiA9IGF3YWl0IFV0aWxzLmdldENvbmZpZ3VyYXRpb24oJ3Bnc3FsJyk7XG4gICAgICBjb25zdCB0bXBDb25maWcgPSBtZXJnZSh0cnVlLCBjb25maWd1cmF0aW9uW2tleV0pO1xuICAgICAgY29uZmlnID0gbWVyZ2UodG1wQ29uZmlnLCBjb25maWcpO1xuICAgICAgaWYgKE9iamVjdC5rZXlzKGNvbmZpZykubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgUGdTUUwg6L+e5o6l5Y+C5pWw6ZSZ6K+vYCk7XG4gICAgICB9XG4gICAgICBjb25zdCBwb29sID0gbmV3IFBvb2woY29uZmlnKTtcbiAgICAgIHBvb2wub24oJ2Vycm9yJywgKGVyciwgY2xpZW50KSA9PiB7XG4gICAgICAgIGNsaWVudC5yZWxlYXNlKCk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5wb29sc1trZXldID0gcG9vbDtcbiAgICB9XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMucG9vbHNba2V5XTtcbiAgfVxuXG5cbiAgc3RhdGljIGdldFBvc3RHaXMoKSB7XG4gICAgcmV0dXJuIFBvc3RHaXM7XG4gIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBQZ1NRTDtcbiJdfQ==