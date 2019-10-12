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

    return await this.pools[key].connect();
  }

  static getPostGis() {
    return _PostGis.default;
  }

}

PgSQL.pools = {};
var _default = PgSQL;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2R1bGVzL1BnU1FML2luZGV4LmpzIl0sIm5hbWVzIjpbIlBnU1FMIiwicG9vbCIsImtleSIsImNvbmZpZyIsInBvb2xzIiwiY29uZmlndXJhdGlvbiIsIlV0aWxzIiwiZ2V0Q29uZmlndXJhdGlvbiIsInRtcENvbmZpZyIsIk9iamVjdCIsImtleXMiLCJsZW5ndGgiLCJFcnJvciIsIlBvb2wiLCJvbiIsImVyciIsImNsaWVudCIsInJlbGVhc2UiLCJjb25zb2xlIiwiZXJyb3IiLCJzdGFjayIsImNvbm5lY3QiLCJnZXRQb3N0R2lzIiwiUG9zdEdpcyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBLE1BQU1BLEtBQU4sQ0FBWTtBQUlWLGVBQWFDLElBQWIsQ0FBa0JDLEdBQWxCLEVBQXVCQyxNQUFNLEdBQUcsRUFBaEMsRUFBb0M7QUFDbEMsUUFBSSxDQUFDLEtBQUtDLEtBQUwsQ0FBV0YsR0FBWCxDQUFMLEVBQXNCO0FBQ3BCLFlBQU1HLGFBQWEsR0FBRyxNQUFNQyxlQUFNQyxnQkFBTixDQUF1QixPQUF2QixDQUE1QjtBQUNBLFlBQU1DLFNBQVMsR0FBRyxvQkFBTSxJQUFOLEVBQVlILGFBQWEsQ0FBQ0gsR0FBRCxDQUF6QixDQUFsQjtBQUNBQyxNQUFBQSxNQUFNLEdBQUcsb0JBQU1LLFNBQU4sRUFBaUJMLE1BQWpCLENBQVQ7O0FBQ0EsVUFBSU0sTUFBTSxDQUFDQyxJQUFQLENBQVlQLE1BQVosRUFBb0JRLE1BQXBCLEtBQStCLENBQW5DLEVBQXNDO0FBQ3BDLGNBQU0sSUFBSUMsS0FBSixDQUFXLGNBQVgsQ0FBTjtBQUNEOztBQUNELFlBQU1YLElBQUksR0FBRyxJQUFJWSxRQUFKLENBQVNWLE1BQVQsQ0FBYjtBQUNBRixNQUFBQSxJQUFJLENBQUNhLEVBQUwsQ0FBUSxPQUFSLEVBQWlCLENBQUNDLEdBQUQsRUFBTUMsTUFBTixLQUFpQjtBQUNoQ0EsUUFBQUEsTUFBTSxDQUFDQyxPQUFQO0FBQ0FDLFFBQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjSixHQUFHLENBQUNLLEtBQWxCO0FBQ0QsT0FIRDtBQUlBLFdBQUtoQixLQUFMLENBQVdGLEdBQVgsSUFBa0JELElBQWxCO0FBQ0Q7O0FBQ0QsV0FBTyxNQUFNLEtBQUtHLEtBQUwsQ0FBV0YsR0FBWCxFQUFnQm1CLE9BQWhCLEVBQWI7QUFDRDs7QUFHRCxTQUFPQyxVQUFQLEdBQW9CO0FBQ2xCLFdBQU9DLGdCQUFQO0FBQ0Q7O0FBekJTOztBQUFOdkIsSyxDQUVHSSxLLEdBQVEsRTtlQTJCRkosSyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgUG9vbCB9IGZyb20gJ3BnJztcbmltcG9ydCBtZXJnZSBmcm9tICdtZXJnZSc7XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi8uLi9VdGlscyc7XG5pbXBvcnQgUG9zdEdpcyBmcm9tICcuL1Bvc3RHaXMnO1xuXG5jbGFzcyBQZ1NRTCB7XG5cbiAgc3RhdGljIHBvb2xzID0ge307XG5cbiAgc3RhdGljIGFzeW5jIHBvb2woa2V5LCBjb25maWcgPSB7fSkge1xuICAgIGlmICghdGhpcy5wb29sc1trZXldKSB7XG4gICAgICBjb25zdCBjb25maWd1cmF0aW9uID0gYXdhaXQgVXRpbHMuZ2V0Q29uZmlndXJhdGlvbigncGdzcWwnKTtcbiAgICAgIGNvbnN0IHRtcENvbmZpZyA9IG1lcmdlKHRydWUsIGNvbmZpZ3VyYXRpb25ba2V5XSk7XG4gICAgICBjb25maWcgPSBtZXJnZSh0bXBDb25maWcsIGNvbmZpZyk7XG4gICAgICBpZiAoT2JqZWN0LmtleXMoY29uZmlnKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBQZ1NRTCDov57mjqXlj4LmlbDplJnor69gKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBvb2wgPSBuZXcgUG9vbChjb25maWcpO1xuICAgICAgcG9vbC5vbignZXJyb3InLCAoZXJyLCBjbGllbnQpID0+IHtcbiAgICAgICAgY2xpZW50LnJlbGVhc2UoKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2spO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnBvb2xzW2tleV0gPSBwb29sO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wb29sc1trZXldLmNvbm5lY3QoKTtcbiAgfVxuXG5cbiAgc3RhdGljIGdldFBvc3RHaXMoKSB7XG4gICAgcmV0dXJuIFBvc3RHaXM7XG4gIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBQZ1NRTDtcbiJdfQ==