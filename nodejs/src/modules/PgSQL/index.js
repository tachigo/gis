'use strict';

import { Pool } from 'pg';
import merge from 'merge';

import globalConfig from './../../config/pgsql';

class PgSQL {

  static pools = {};

  static async pool(key, config = {}) {
    if (!this.pools[key]) {
      const tmpConfig = merge(true, globalConfig[key]);
      config = merge(tmpConfig, config);
      if (Object.keys(config).length === 0) {
        throw new Error(`PgSQL 连接参数错误`);
      }
      const pool = new Pool(config);
      pool.on('error', (err, client) => {
        client.release();
        console.error(err.stack);
      });
      this.pools[key] = pool;
    }
    return this.pools[key];
  }
}


export default PgSQL;
