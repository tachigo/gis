'use strict';

import Utils from './../Utils';
import Path from 'path';
import { execSync } from 'child_process';

class PostGis {

  static async exportShapeFile(shpFilename, pg, sql, geomField) {
    const dir = Path.dirname(shpFilename);
    await Utils.rmDir(dir);
    await Utils.mkDir(dir);

    const { host, user, database, password, port, postGisHomePath} = pg.options;
    const cmd = `${postGisHomePath}/bin/pgsql2shp -f ${shpFilename}`
      + ` -h ${host} -p ${port} -u ${user} -P ${password} -g ${geomField} -k -b -r ${database}`
      + ` "${sql}"`;
    execSync(cmd);
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
    await pg
      .query(sql)
    ;
  }
}


export default PostGis;