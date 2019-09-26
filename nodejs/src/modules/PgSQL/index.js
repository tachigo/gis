'use strict';

import { Pool } from 'pg';
import merge from 'merge';
import Utils from './../Utils';
import PostGis from './PostGis';

class PgSQL {

  static pools = {};

  static async pool(key, config = {}) {
    if (!this.pools[key]) {
      const configuration = await Utils.getConfiguration('pgsql');
      const tmpConfig = merge(true, configuration[key]);
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


  static getPostGis() {
    return PostGis;
  }
}


export default PgSQL;
