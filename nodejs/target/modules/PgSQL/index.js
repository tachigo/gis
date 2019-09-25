'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _pg = require("pg");

var _merge = _interopRequireDefault(require("merge"));

var _pgsql = _interopRequireDefault(require("./../../config/pgsql"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class PgSQL {
  static async pool(key, config = {}) {
    if (!this.pools[key]) {
      const tmpConfig = (0, _merge.default)(true, _pgsql.default[key]);
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

}

PgSQL.pools = {};
var _default = PgSQL;
exports.default = _default;