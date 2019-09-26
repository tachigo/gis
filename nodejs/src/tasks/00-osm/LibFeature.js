'use strict';

import $ from "../../modules";
import WKT from "terraformer-wkt-parser";


class LibFeature {

  static async loadFromShapeFile(pg, shpFilename, dbfFilename, pgTableName, fromId, toId) {
    let id = 0;
    const lineResolve = async (result) => {
      id += 1;
      // id ∈ [fromId, toId]
      if (id >= fromId && (!toId || id <= toId)) {
        const geometry = WKT.convert(result.value.geometry);
        const startTime = (new Date()).getTime(); // 计时
        const sql = `insert into ${pgTableName} (id, geom) 
        values ($1::bigint, ST_Multi(ST_GeomFromText($2, 4326))::geometry) 
        on conflict (id) do update 
        set geom = excluded.geom`;
        const params = [id, geometry];
        await pg.query(sql, params)
          .catch(e => {
            console.log(sql);
            throw e;
          })
        ;
        const endTime = (new Date()).getTime();
        const costTime = endTime - startTime;
        await $.Utils.log(`${pgTableName}#${id} cost ... ${costTime / 1000} s`);
      }
    };
    await $.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);
  }
}


export default LibFeature;