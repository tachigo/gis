'use strict';

import Utils from './../../modules/Utils';

class LibTopology {

  #topologyName;

  constructor(topologyName) {
    this.#topologyName = topologyName;
  }

  async createTopology(pg) {
    await pg.query(`select topology.CreateTopology($1, 4326)`, [this.#topologyName]);
  }

  async dropTopology(pg) {
    await pg.query(`select topology.DropTopology($1)`, [this.#topologyName]);
  }


  static async getForeignList(pg) {
    const table = 'boundary.mfw';
    const sql = `select id, zh_name from ${table} where id > 900000 order by id asc`;
    const res = await pg.query(sql);
    const list = [];
    for await (const row of res.rows) {
      list.push({
        id: +row['id'],
        name: row['zh_name']
      });
    }
    return list;
  }


  static async dumpJunctureOuter(pg, id) {
    const fromTable = 'boundary.line';
    const toTable = 'boundary.juncture_topo_dump';
    const type = 'outer';
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2`, [id, type]);
    const category = 'juncture';
    const sql = `with 
    ta as (
      select (st_dump(geom)).geom as geom from ${fromTable} where id = $1 and type = $2 and category = $3
    )
    , tb as (
      select st_subdivide(geom, 8192) as geom from ta
    )
    , tc as (
      select row_number() over()::integer as path, geom from tb
    )
    insert into ${toTable} (target_id, path, type, geom) 
    select $1::bigint as target_id, path, $2::varchar as type, geom from tc`;
    await pg.query(sql, [id, type, category])
  }


  static async dumpJunctureInner(pg, id) {
    const fromTable = 'boundary.line';
    const toTable = 'boundary.juncture_topo_dump';
    const type = 'inner';
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2`, [id, type]);
    const category = 'juncture';
    const sql = `with 
    ta as (
      select (st_dump(geom)).geom as geom from ${fromTable} where id = $1 and type = $2 and category = $3
    )
    , tb as (
      select st_subdivide(geom, 8192) as geom from ta
    )
    , tc as (
      select row_number() over()::integer as path, geom from tb
    )
    insert into ${toTable} (target_id, path, type, geom) 
    select $1::bigint as target_id, path, $2::varchar as type, geom from tc`;
    await pg.query(sql, [id, type, category])
  }


  // static async dumpCoastline(pg, id) {
  //   const fromTable = 'boundary.line';
  //   const toTable = 'boundary.coastline_topo_dump';
  //   const type = 'outer';
  //   await pg.query(`delete from ${toTable} where target_id = $1 and type = $2`, [id, type]);
  //   const category = 'coastline';
  //   const sql = `with
  //   ta as (
  //     select (st_dump(geom)).geom as geom from ${fromTable} where id = $1 and type = $2 and category = $3
  //   )
  //   , tb as (
  //     select row_number() over()::integer as path, geom from ta
  //   )
  //   insert into ${toTable} (target_id, path, type, geom)
  //   select $1::bigint as target_id, path, $2::varchar as type, geom from tb`;
  //   await pg.query(sql, [id, type, category])
  // }


  // static async getCoastlineDump(pg, id) {
  //   const table = 'boundary.coastline_topo_dump';
  //   const type = 'outer';
  //   const sql = `select id, target_id, path from ${table} where target_id = $1 and type = $2 order by id asc, path asc`;
  //   return await pg
  //     .query(sql, [id, type])
  //     .then(res => {
  //       return res.rows || [];
  //     })
  //   ;
  // }


  static async getJunctureOuterDump(pg, id) {
    const table = 'boundary.juncture_topo_dump';
    const type = 'outer';
    const sql = `select id, target_id, path from ${table} where target_id = $1 and type = $2 order by id asc, path asc`;
    return await pg
      .query(sql, [id, type])
      .then(res => {
        return res.rows || [];
      })
    ;
  }


  static async getJunctureInnerDump(pg, id) {
    const table = 'boundary.juncture_topo_dump';
    const type = 'inner';
    const sql = `select id, target_id, path from ${table} where target_id = $1 and type = $2`;
    return await pg
      .query(sql, [id, type])
      .then(res => {
        return res.rows || [];
      })
    ;
  }


  // async loadCoastline(pg, id) {
  //   await LibTopology.dumpCoastline(pg, id);
  //   const list = await LibTopology.getCoastlineDump(pg, id);
  //   const that = this;
  //   for await (const item of list) {
  //     await Utils.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
  //       const table = 'boundary.coastline_topo_dump';
  //       const sql = `with
  //       ta as (
  //         select (st_dump(geom)).geom as geom
  //         from ${table} where id = $1
  //       )
  //       select TopoGeo_AddLineString($2, geom) from ta`;
  //       await pg.query(sql, [item['id'], that.#topologyName]);
  //     });
  //   }
  // }


  async loadOuterJuncture(pg, id) {
    await LibTopology.dumpJunctureOuter(pg, id);
    const list = await LibTopology.getJunctureOuterDump(pg, id);
    const that = this;
    for await (const item of list) {
      await Utils.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        const table = 'boundary.juncture_topo_dump';
        const sql = `with 
        ta as (
          select (st_dump(geom)).geom as geom 
          from ${table} where id = $1
        )
        select TopoGeo_AddLineString($2, geom) from ta`;
        await pg.query(sql, [item['id'], that.#topologyName]);
      });
    }
  }


  async loadInnerJuncture(pg, id) {
    await LibTopology.dumpJunctureInner(pg, id);
    const list = await LibTopology.getJunctureInnerDump(pg, id);
    const that = this;
    for await (const item of list) {
      await Utils.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        const table = 'boundary.juncture_topo_dump';
        const sql = `with 
        ta as (
          select (st_dump(geom)).geom as geom 
          from ${table} where id = $1
        )
        select TopoGeo_AddLineString($2, geom) from ta`;
        await pg.query(sql, [item['id'], that.#topologyName]);
      });
    }
  }
}


export default LibTopology;