'use strict';

import Utils from './../../modules/Utils';

class LibTopology {

  #lineDumpSchema;
  #lineDumpTable;
  #lineDump;

  #lineTopoSchema;
  #lineTopoTable;
  #lineTopo;

  constructor(lineDumpSchema, lineDumpTable, lineTopoSchema, lineTopoTable) {
    this.#lineDumpSchema = lineDumpSchema;
    this.#lineDumpTable = lineDumpTable;
    this.#lineDump = `${lineDumpSchema}.${lineDumpTable}`;

    this.#lineTopoSchema = lineTopoSchema;
    this.#lineTopoTable = lineTopoTable;
    this.#lineTopo = `${lineTopoSchema}.${lineTopoTable}`;
  }


  async initDumpTable(pg) {
    try {
      await pg.query(`drop table ${this.#lineDump} cascade`);
    } catch (e) {
      console.error(e.message);
    }
    await pg.query(`create table if not exists ${this.#lineDump}
    (
        id bigserial primary key,
        target_id bigint,
        path int,
        type varchar,
        category varchar,
        points integer,
        length float,
        geom geometry,
        constraint enforce_srid_geom check (st_srid(geom) = 4326)
    )`);
    await pg.query(`create index ${this.#lineDumpSchema}_${this.#lineDumpTable}_geom_idx on ${this.#lineDump} using gist (geom)`);
  }


  async dumpJuncture(pg, id, type) {
    const fromTable = 'boundary.line';
    const toTable = `${this.#lineDump}`;
    const category = 'juncture';
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);

    await pg.query(`with 
      ta as (
        select (st_dump(geom)).geom as geom from ${fromTable}
        where id = $1 and type = $2 and category = $3
      )
      , tb as (
        select ST_Node(ST_RemoveRepeatedPoints(geom)) as geom from ta
      )
      , tc as (
        select (st_dump(geom)).geom as geom from tb
      )
      , td as (
        select st_subdivide(geom, 4096) as geom from tc
      )
      , te as (
        select  (row_number() over())::integer as path, geom from td
      )
      insert into ${toTable} (target_id, path, type, category, geom, points, length) 
      select $1::bigint as target_id, path, $2::varchar as type, $3::varchar as category, geom, 
      st_npoints(geom) as points, st_length(geom) as length from te order by path asc`,
      [id, type, category]
    );
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


  async dumpCoastline(pg, id) {
    const fromTable = 'boundary.line';
    const toTable = `${this.#lineDump}`;
    const type = 'outer';
    const category = 'coastline';
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);

    await pg.query(`with 
      ta as (
        select (st_dump(geom)).geom as geom from ${fromTable}
        where id = $1 and type = $2 and category = $3
      )
      , tb as (
        select ST_Node(ST_RemoveRepeatedPoints(geom)) as geom from ta
      )
      , tc as (
        select (st_dump(geom)).geom as geom from tb
      )
      , td as (
        select st_subdivide(geom, 4096) as geom from tc
      )
      , te as (
        select  (row_number() over())::integer as path, geom from td
      )
      insert into ${toTable} (target_id, path, type, category, geom, points, length) 
      select $1::bigint as target_id, path, $2::varchar as type, $3::varchar as category, geom, 
      st_npoints(geom) as points, st_length(geom) as length from te order by path asc`,
      [id, type, category]
    );
  }


  async initTopoTable(pg) {
    try {
      await pg.query(`drop table ${this.#lineTopo} cascade`);
    } catch (e) {
      console.error(e.message);
    }
    await pg.query(`create table if not exists ${this.#lineTopo}
    (
        id bigserial primary key,
        geom geometry,
        constraint enforce_srid_geom check (st_srid(geom) = 4326)
    )`);
    await pg.query(`create index ${this.#lineTopoSchema}_${this.#lineTopoTable}_geom_idx on ${this.#lineTopo} using gist (geom)`);
  }


  async calcEdges(pg) {
    let startId = 0;
    let count;
    const limit  = 100;
    do {
      const rows = await pg
        .query(`select id, target_id, path, type, category from ${this.#lineDump} where id > $1 order by id asc limit $2`, [startId, limit])
        .then(res => {
          return res.rows || [];
        })
      ;
      count = rows.length;
      let nextId = 0;
      const that = this;
      const theId = 0;
      for await (const row of rows) {
        const id = +row['id'];
        nextId = id;
        if (id < theId) {
          continue;
        }
        await Utils.call(`计算边 ${id}|${row['target_id']}|${row['path']} [${row['type']}|${row['category']}]`, async () => {
          await that.calcEdge(pg, id);
        });
      }
      console.log(`#${startId} - #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }


  async checkEdges(pg) {
    let startId = 0;
    let count;
    const limit  = 100;
    let i = 0;
    do {
      const rows = await pg
        .query(`select id from ${this.#lineTopo} where id > $1 order by id asc limit $2`, [startId, limit])
        .then(res => {
          return res.rows || [];
        })
      ;
      count = rows.length;
      let nextId = 0;
      const that = this;
      for await (const row of rows) {
        const id = +row['id'];
        nextId = id;
        i += 1;
        await Utils.call(`检查边 ${i}#${id}`, async () => {
          const sql = `with 
          ta as (
            select geom from ${that.#lineTopo} where id = $1
          )
          , tb as (
            select t.id as id, ST_Intersection(t.geom, ta.geom) as geom from ${that.#lineTopo} as t right join ta 
            on (t.geom && ta.geom and ST_Intersects(t.geom, ta.geom))
            where t.id != $1
          )
          select id from tb where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')`;
          const res = await pg.query(sql, [id])
            .then(res => {
              return res.rows || [];
            })
          ;
          const items = res.map(item => +item['id']);
          if (items.length > 0) {
            console.log(`edge #${id} intersects with edges`, items);
          }
        });
      }
      console.log(`#${startId} - #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }


  async getLineDumpGeomWkt(pg, id) {
    return await pg
      .query(
        `select st_asText(geom) as wkt from ${this.#lineDump} where id = $1`,
        [id]
      )
      .then(res => {
        const row = res.rows[0] || {};
        return row['wkt'] || '';
      });
  }


  async calcEdge(pg, id) {
    // 从dump取出来写入topo
    const wkt = await this.getLineDumpGeomWkt(pg, id);
    const sql1 = `select id from ${this.#lineTopo} where geom && ST_GeomFromText($1, 4326) 
    and st_intersects(geom, ST_GeomFromText($1, 4326))`;
    const rows1 = await pg
      .query(sql1, [wkt])
      .then(res => {
        return res.rows || [];
      })
    ;
    const intersectIds = rows1.map(row => +row['id']);
    console.log(intersectIds);
    if (intersectIds.length === 0) {
      console.log(`无交集，直接插入`);
      return await pg
        .query(`insert into ${this.#lineTopo} (geom) 
        values (
          ST_MakeValid(
            ST_Node(
              ST_LineMerge(
                ST_RemoveRepeatedPoints(
                  ST_GeomFromText($1, 4326)
                )
              )
            )
          )
        )`, [wkt])
      ;
    }

    const sql2 = `with 
    ta as (
      select id, geom from ${this.#lineTopo} where id in (${intersectIds.join(', ')})
    ) 
    , tb as (
      select id, geom as origin_geom, 
	    ST_Intersection(geom,
	      ST_MakeValid(
          ST_Node(
            ST_LineMerge(
              ST_RemoveRepeatedPoints(
                ST_GeomFromText($1, 4326)
              )
            )
          )
        ) 
	    ) as intersect_geom from ta
    )
    , tc as (
	    select ST_SymDifference(origin_geom, 
	      ST_MakeValid(
          ST_Node(
            ST_LineMerge(
              ST_RemoveRepeatedPoints(
                ST_GeomFromText($1, 4326)
              )
            )
          )
        ) 
	    ) as geom from tb
    )
    , td as (
      select (ST_Dump(geom)).geom as geom from tc 
      where geom is not null and ST_IsEmpty(geom) = false
      union all 
      select (ST_Dump(intersect_geom)).geom as geom from tb 
      where intersect_geom is not null and ST_IsEmpty(intersect_geom) = false 
    )
    , te as (
      select 
      ST_MakeValid(
        ST_Node(
          ST_LineMerge(
            ST_RemoveRepeatedPoints(
              ST_Union(geom)
            )
          )
        )
      ) as geom from td
    )
    , tf as (
      select (ST_Dump(geom)).geom as geom from te
    )
    , tg as (
      select ST_Subdivide(geom, 4096) as geom from tf
    )
    insert into ${this.#lineTopo} (geom) 
    select geom from tg`;
    await pg.query(sql2, [wkt]);

    // 删除原有的
    await pg.query(`delete from ${this.#lineTopo} where id in (${intersectIds.join(', ')})`);
  }
}


export default LibTopology;