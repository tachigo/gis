'use strict';

import Utils from './../../modules/Utils';

class LibSimplify {


  static async getCoastlineList(pg) {
    const table = 'boundary.line';
    const type = 'outer';
    const category = 'coastline';
    const sql = `select id, name from ${table} where type = $1 and category = $2 order by id asc`;
    const res = await pg.query(sql, [type, category]);
    const list = [];
    for await (const row of res.rows) {
      list.push({
        id: +row['id'],
        name: row['name']
      });
    }
    return list;
  }


  static async clearCoastlines(pg) {
    const table = 'simplify.topology_dump';
    const category = 'coastline';
    await pg.query(`delete from ${table} where category = $1`, [category]);
  }

  static async dumpCoastlines(pg) {
    const list = await this.getCoastlineList(pg);
    const that = this;
    for await (const item of list) {
      const id = item['id'];
      const name = item['name'];
      await Utils.call(`${name}#${id}`, async () => {
        await that.dumpCoastline(pg, id);
      });
    }
  }


  static async dumpCoastline(pg, id) {
    const fromTable = 'boundary.line';
    const toTable = 'simplify.topology_dump';
    const type = 'outer';
    const category = 'coastline';
    const sql = `with 
    ta as (
      select geom from ${fromTable} where id = $1 and type = $2 and category = $3
    )
    , tb as (
      select ('{' || $1::bigint || '}')::bigint[] as outer_ids, '{}'::bigint[] as inner_ids, $3::varchar as category, 
      geom from ta
    )
    insert into ${toTable} (outer_ids, inner_ids, category, geom) 
    select outer_ids, inner_ids, category, geom from tb`;
    await pg.query(sql, [id, type, category]);
  }



  static async dumpTopologyJuncture(pg, id, edgeId) {
    const outerIds = await this.getTopologyJunctureOuterIds(pg, edgeId);
    console.log('外圈ID', outerIds);
    const innerIds = await this.getTopologyJunctureInnerIds(pg, edgeId);
    console.log('内圈ID', innerIds);

    const fromTable = 'boundary_topo_juncture.edge_data';
    const toTable = 'simplify.topology_dump';

    const category = 'juncture';
    const sql = `with 
    ta as (
      select geom from ${fromTable} where edge_id = $2
    )
    , tb as (
      select $1::bigint as id, 
      ('{' || $3 || '}')::bigint[] as outer_ids, 
      ('{' || $4 || '}')::bigint[] as inner_ids, 
      $5::varchar as category, 
      geom from ta 
    )
    insert into ${toTable} (id, outer_ids, inner_ids, category, geom) 
    select id, outer_ids, inner_ids, category, geom from tb 
    on conflict (id) do update set 
    outer_ids = excluded.outer_ids, inner_ids = excluded.inner_ids, 
    category = excluded.category, geom = excluded.geom`;
    await pg.query(sql, [id, edgeId, outerIds.join(','), innerIds.join(','), category]);
  }


  static async getTopologyJunctures(pg) {
    const table = 'boundary_topo_juncture.edge_data';
    const sql = `select edge_id from ${table} order by edge_id asc`;
    return await pg.query(sql)
      .then(res => {
        return res.rows || [];
      })
    ;
  }


  static async dumpTopologyJunctures(pg) {
    const list = await this.getTopologyJunctures(pg);
    const that = this;
    for await (const item of list) {
      const edgeId = item['edge_id'];
      const id = edgeId + 300; // 300以后
      await Utils.call(`${edgeId}#${id}`, async () => {
        await that.dumpTopologyJuncture(pg, id, edgeId);
      });
    }
  }


  static async getTopologyJunctureOuterIds(pg, edgeId) {
    const ids = [];
    const type = 'outer';
    const category = 'juncture';
    const sql = `with 
    ta as (
      select geom from boundary_topo_juncture.edge_data where edge_id = $1 and geom is not null
    )
    , tb as (
      select l.id as id from boundary.line as l, ta where l.type = $2 and l.category = $3 
      and st_intersects(l.geom, ta.geom) = true
    )
    select id from tb`;
    const list = await pg
      .query(sql, [edgeId, type, category])
      .then(res => {
        return res.rows || [];
      })
    ;
    for await (const item of list) {
      ids.push(+item['id']);
    }
    return ids;
  }

  static async getTopologyJunctureInnerIds(pg, edgeId) {
    const ids = [];
    const type = 'inner';
    const category = 'juncture';
    const sql = `with 
    ta as (
      select geom from boundary_topo_juncture.edge_data where edge_id = $1 and geom is not null
    )
    , tb as (
      select l.id as id from boundary.line as l, ta where l.type = $2 and l.category = $3 
      and st_intersects(l.geom, ta.geom) = true
    )
    select id from tb`;
    const list = await pg
      .query(sql, [edgeId, type, category])
      .then(res => {
        return res.rows || [];
      })
    ;
    for await (const item of list) {
      ids.push(+item['id']);
    }
    return ids;
  }




  static async prepareDumpSimplifyData(pg) {
    await pg.query(`delete from simplify.dump_simplify`);
    await pg.query(
      `insert into simplify.dump_simplify (id, outer_ids, inner_ids, category, geom) 
      select id, outer_ids, inner_ids, category, geom from simplify.topology_dump`
    );
  }


  static async dumpSimplify(pg, id, category, tolerance) {
    const fromTable = 'simplify.topology_dump';
    const toTable = 'simplify.dump_simplify';
    await pg.query(
      `with 
      ta as (
        select id, outer_ids, inner_ids, category, ST_SimplifyPreserveTopology(geom, $3::float) as geom from ${fromTable} 
        where (outer_ids @> ARRAY[$1::bigint] or inner_ids @> ARRAY[$1::bigint]) and category = $2 and geom is not null
      )
      insert into ${toTable} (id, outer_ids, inner_ids, category, geom) 
      select id, outer_ids, inner_ids, category, geom from ta 
      on conflict (id) do update set 
      outer_ids = excluded.outer_ids, inner_ids = excluded.inner_ids, 
      category = excluded.category, geom = excluded.geom`,
      [id, category, tolerance]
    );
  }

}


export default LibSimplify;