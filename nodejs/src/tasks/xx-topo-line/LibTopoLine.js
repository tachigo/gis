'use strict';

import Utils from './../../modules/Utils';
import LibLWGeom from './LibLWGeom';
import Lodash from 'lodash';

class LibTopoLine {

  #lineDumpSchema;
  #lineDumpTable;
  #lineDump;

  #lineTopoSchema;
  #lineTopoTable;
  #lineTopo;


  #nodeTopoSchema;
  #nodeTopoTable;
  #nodeTopo;


  constructor(lineDumpSchema, lineDumpTable, lineTopoSchema, lineTopoTable, nodeTopoSchema, nodeTopoTable) {
    this.#lineDumpSchema = lineDumpSchema;
    this.#lineDumpTable = lineDumpTable;
    this.#lineDump = `${lineDumpSchema}.${lineDumpTable}`;

    this.#lineTopoSchema = lineTopoSchema;
    this.#lineTopoTable = lineTopoTable;
    this.#lineTopo = `${lineTopoSchema}.${lineTopoTable}`;

    this.#nodeTopoSchema = nodeTopoSchema;
    this.#nodeTopoTable = nodeTopoTable;
    this.#nodeTopo = `${this.#nodeTopoSchema}.${this.#nodeTopoTable}`;
  }


  async initDump2TopoRelation(pg) {
    try {
      await pg.query(`drop index if exists ${this.#lineDumpSchema}_${this.#lineDumpTable}_topo_ids_idx cascade`);
    } catch (e) {
      console.error(e.message);
    }

    try {
      await pg.query(`alter table ${this.#lineDump} drop column if exists topo_ids`);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`alter table ${this.#lineDump} add column topo_ids bigint[]`);
    await pg.query(`create index ${this.#lineDumpSchema}_${this.#lineDumpTable}_topo_ids_idx on ${this.#lineDump} using gin (topo_ids)`);
  }


  async initTopo2DumpRelation(pg) {
    try {
      await pg.query(`drop index if exists ${this.#lineTopoSchema}_${this.#lineTopoTable}_dump_ids_index cascade`);
    } catch (e) {
      console.error(e.message);
    }

    try {
      await pg.query(`alter table ${this.#lineTopo} drop column if exists dump_ids`);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`alter table ${this.#lineTopo} add column dump_ids bigint[]`);
    await pg.query(`create index ${this.#lineTopoSchema}_${this.#lineTopoTable}_dump_ids_idx on ${this.#lineTopo} using gin (dump_ids)`);
  }


  async initDumpTable(pg) {
    try {
      await pg.query(`drop table if exists ${this.#lineDump} cascade`);
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

    try {
      await pg.query(`drop table if exists ${this.#lineDump}_tmp cascade`);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`create table if not exists ${this.#lineDump}_tmp
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
    await pg.query(`create index ${this.#lineDumpSchema}_${this.#lineDumpTable}_tmp_geom_idx on ${this.#lineDump}_tmp using gist (geom)`);
  }


  async dumpLinesToTmpTable(pg, id, type, category) {
    const fromTable = 'boundary.line';
    const toTable = `${this.#lineDump}_tmp`;
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);

    await pg.query(`with 
      ta as (
        select (ST_Dump(geom)).geom as geom from ${fromTable}
        where id = $1 and type = $2 and category = $3
      )
      , tb as (
        select ST_MakeValid(
          ST_Node(
            ST_LineMerge(
              ST_RemoveRepeatedPoints(
                geom
              )
            )
          )
        ) as geom from ta
      )
      , tc as (
        select (ST_Dump(geom)).geom as geom from tb
      )
      , td as (
        select  (row_number() over())::integer as path, geom, ST_NPoints(geom) as points from tc order by points desc
      )
      insert into ${toTable} (target_id, path, type, category, geom, points, length) 
      select $1::bigint as target_id, path, $2::varchar as type, $3::varchar as category, geom, 
      points, st_length(geom) as length from td order by path asc`,
      [id, type, category]
    );
  }


  async dumpLines(pg, id, type, category, verticesNum) {
    const realVerticesNum = verticesNum - 1;
    await this.dumpLinesToTmpTable(pg, id, type, category);
    const toTable = `${this.#lineDump}`;
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);

    let path = 0;
    let count;
    const limit = 1000;
    do {
      const rows = await pg
        .query(
          `select id, path from ${this.#lineDump}_tmp where target_id = $1 and type = $2 and category = $3 and path > $4 order by path asc limit $5`,
          [id, type, category, path, limit]
        )
        .then(res => {
          return res.rows || [];
        })
      ;
      count = rows.length;
      let nextPath = 0;
      for await (const row of rows) {
        const tmpId = +row['id'];
        nextPath = +row['path'];
        const sql = `with 
        ta as (
          select geom from ${this.#lineDump}_tmp where id = $4
        )
        , tb as (
          select ST_PointN(geom, 
            ((generate_series(1, ST_NPoints(geom) / ${realVerticesNum} + 1) - 1) * ${realVerticesNum} + 1)) as geom 
          from ta
        )
        , tc as (
          select ST_Collect(geom) as geom from tb
        )
        , td as (
          select ST_Split(ta.geom, tc.geom) as geom from ta, tc
        )
        , te as (
          select (ST_Dump(geom)).geom as geom from td
        )
        , tf as (
          select ${nextPath}::integer as path, geom, ST_NPoints(geom) as points from te order by points desc
        )
        insert into ${toTable} (target_id, path, type, category, geom, points, length) 
        select $1::bigint as target_id, path, $2::varchar as type, $3::varchar as category, geom, 
        points, st_length(geom) as length from tf order by path asc`;
        await pg.query(sql, [id, type, category, tmpId]);
      }
      console.log(`dump from tmp dump table ${id}|${type}|${category} #${path} - #${nextPath}`);
      path = nextPath;
    } while (count > 0);
  }


  async dumpLinesOld(pg, id, type, category) {
    const fromTable = 'boundary.line';
    const toTable = `${this.#lineDump}`;
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);

    await pg.query(`with 
      ta as (
        select (ST_Dump(geom)).geom as geom from ${fromTable}
        where id = $1 and type = $2 and category = $3
      )
      , tb as (
        select ST_MakeValid(
          ST_Node(
            ST_LineMerge(
              ST_RemoveRepeatedPoints(
                geom
              )
            )
          )
        ) as geom from ta
      )
      , tc as (
        select (ST_Dump(geom)).geom as geom from tb
      )
      , td as (
        select ST_Subdivide(geom, 4096) as geom from tc
      )
      , te as (
        select  (row_number() over())::integer as path, geom from td
      )
      insert into ${toTable} (target_id, path, type, category, geom, points, length) 
      select $1::bigint as target_id, path, $2::varchar as type, $3::varchar as category, geom, 
      ST_NPoints(geom) as points, st_length(geom) as length from te order by path asc`,
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
      for await (const row of rows) {
        const id = +row['id'];
        nextId = id;
        await Utils.call(`计算边 ${id}|${row['target_id']}|${row['path']} [${row['type']}|${row['category']}]`, async () => {
          await that.calcEdge(pg, id);
        });
      }
      console.log(`#${startId} - #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }


  async calcTopo2Dump(pg) {
    let sql;
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
      for await (const row of rows) {
        const id = +row['id'];
        nextId = id;
        i += 1;
        let ids, dumpIds;
        sql = `with 
        ta as (
          select geom from ${this.#lineTopo} where id = $1
        )
        , tb as (
          select t.id as id, ST_Intersection(
            t.geom, 
            ta.geom
          ) as geom from ${this.#lineDump} as t, ta 
          where (t.geom && ta.geom) 
          and ST_Intersects(t.geom, ta.geom)
        )
        , tc as (
          select id from tb 
          where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')
        )
        select distinct id from tc`;
        ids = await pg
          .query(sql, [id])
          .then(res => {
            return res.rows.map(row => +row['id']);
          })
        ;
        dumpIds = Lodash.uniq(ids);
        // if (dumpIds.length === 0) {
        //   sql = `with
        //   ta as (
        //     select geom from ${this.#lineTopo} where id = $1
        //   )
        //   , tb as (
        //     select t.id as id, ST_Intersection(
        //       t.geom,
        //       ta.geom
        //     ) as geom from ${this.#lineDump} as t, ta
        //     where (t.geom && ta.geom)
        //     and ST_Intersects(t.geom, ta.geom)
        //   )
        //   , tc as (
        //     select id from tb
        //   )
        //   select distinct id from tc`;
        //   ids = await pg
        //     .query(sql, [id])
        //     .then(res => {
        //       return res.rows.map(row => +row['id']);
        //     })
        //   ;
        //   dumpIds = Lodash.uniq(ids);
        // }
        console.log(dumpIds);
        if (dumpIds.length > 0) {
          sql = `insert into ${this.#lineTopo} (id, dump_ids) 
          values ($1::bigint, $2::bigint[]) 
          on conflict (id) do update set dump_ids = excluded.dump_ids`;
          await pg.query(sql, [id, `{${dumpIds.join(',')}}`]);
        } else {
          // throw new Error(`topo edge#${id} dose not math any dump lines`);
          console.log(`====================================> topo edge#${id} dose not math any dump lines`);
        }
      }
      console.log(`#${startId} - #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }


  async calcDump2TopoEdge(pg, dumpId, tol) {
    let sql;
    sql = `with 
    ta as (
      select geom from ${this.#lineDump} where id = $1
    )
    , tb as (
      select t.id as id from ${this.#lineTopo} as t, ta 
      where (t.geom && ta.geom) and ST_Distance(t.geom, ta.geom) < $2
    )
    select distinct id from tb`;
    const topoIds = await pg.query(sql, [dumpId, tol])
      .then(res => {
        return res.rows.map(row => +row['id']);
      })
    ;
    sql = `select ST_AsHEXEWKB(geom) as geom from ${this.#lineDump} where id = $1`;
    const geomDump = await pg.query(sql, [dumpId])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
    const ids = [];
    for await (const topoId of topoIds) {
      sql = `select ST_AsHEXEWKB(geom) as geom from ${this.#lineTopo} where id = $1`;
      const geomTopo = await pg.query(sql, [topoId])
        .then(res => {
          return res.rows[0]['geom'];
        })
      ;
      // 比较距离
      sql = `with 
      ta as (
        select (ST_DumpPoints($1::geometry)).geom as geom
      )
      , tb as (
        select ST_Distance($2::geometry, geom) as distance from ta
      )
      select max(distance) as max_distance from tb`;
      const maxDistance = await pg.query(sql, [geomTopo, geomDump])
        .then(res => {
          return +res.rows[0]['max_distance']
        })
      ;
      if (maxDistance < tol) {
        ids.push(topoId);
      }
    }
    return ids;
  }


  async calcDump2TopoEdges(pg, tol) {
    let sql;
    let startId = 0;
    let count;
    const limit  = 100;
    let i = 0;

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
      for await (const row of rows) {
        const id = +row['id'];
        nextId = id;
        i += 1;
        await Utils.call(`${this.#lineDump} 边 ${i}#${id}|${row['target_id']}|${row['path']} [${row['type']}|${row['category']}]`, async () => {
          const topoIds = await that.calcDump2TopoEdge(pg, id, tol);
          if (topoIds.length > 0) {
            console.log(topoIds);
            sql = `insert into ${that.#lineDump} (id, topo_ids) 
            values ($1::bigint, $2::bigint[]) 
            on conflict (id) do update set topo_ids = excluded.topo_ids`;
            await pg.query(sql, [id, `{${topoIds.join(',')}}`]);
          } else {
            console.log(`====================================> 无拓扑关系`);
          }
        });
      }
      console.log(`#${startId} - #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }


  async checkDuplicateEdge(pg, id) {
    let sql;
    sql = `with 
    ta as (
      select geom from ${this.#lineTopo} where id = $1
    )
    select t.id as id from ${this.#lineTopo} as t, ta  
    where t.id > $1 and (t.geom && ta.geom and ST_Intersects(t.geom, ta.geom)) 
    and (ST_Equals(t.geom, ta.geom) or ST_Equals(ST_Reverse(t.geom), ta.geom))`;
    const theIds = await pg.query(sql, [id])
      .then(res => {
        return res.rows.map(row => +row['id']);
      })
    ;
    for await (const theId of theIds) {
      // 相等的 可以删除
      sql = `delete from ${this.#lineTopo} where id = $1`;
      await pg.query(sql, [theId]);
      console.log(`====================================> delete #${id} reverse duplicate edge#${theId}`);
    }
  }


  async checkCollapseEdge(pg, id) {
    let sql;
    sql = `with 
    ta as (
      select geom from ${this.#lineTopo} where id = $1
    )
    , tb as (
      select t.id as id, ST_Intersection(t.geom, ta.geom) as geom from ${this.#lineTopo} as t, ta 
      where t.id > $1 and (t.geom && ta.geom and ST_Intersects(t.geom, ta.geom))
    )
    select id from tb where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint') and ST_NPoints(geom) > 0`;
    const theIds = await pg.query(sql, [id])
      .then(res => {
        return res.rows.map(row => +row['id']);
      })
    ;
    if (theIds.length > 0) {
      console.log(`====================================> edge #${id} collapsed with edges:`, theIds);
      await this.fixCollapseEdge(pg, id, theIds);
    }
  }


  async checkDuplicateEdges(pg) {
    let startId = 1 - 1;
    let count;
    const limit  = 2000;
    do {
      const rows = await pg
        .query(`select id from ${this.#lineTopo} where id > $1 order by id asc limit $2`, [startId, limit])
        .then(res => {
          return res.rows || [];
        })
      ;
      count = rows.length;
      let nextId = 0;
      if (count > 0) {
        nextId = rows[count - 1]['id'];
        const that = this;
        await Utils.call(`#${startId} - #${nextId}`, async () => {
          for await (const row of rows) {
            const id = +row['id'];
            await that.checkDuplicateEdge(pg, id);
          }
        });
      }
      startId = nextId;
    } while (count > 0);
  }


  async topoSnapEdges(pg, tol) {
    let startId = 1 - 1;
    let count;
    const limit  = 2000;
    do {
      const rows = await pg
        .query(`select id from ${this.#lineTopo} where id > $1 order by id asc limit $2`, [startId, limit])
        .then(res => {
          return res.rows || [];
        })
      ;
      count = rows.length;
      let nextId = 0;
      if (count > 0) {
        nextId = rows[count - 1]['id'];
        const that = this;
        await Utils.call(`#${startId} - #${nextId}`, async () => {
          for await (const row of rows) {
            const id = +row['id'];
            await that.topoSnapEdge(pg, id, tol);
          }
        });
      }
      startId = nextId;
    } while (count > 0);
  }


  async topoSnapEdge(pg, id, tol) {
    let geom;
    geom = await pg
      .query(`select ST_AsHEXEWKB(geom) as geom from ${this.#lineTopo} where id = $1`, [id])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;

    geom = await Utils.call(`topo#${id} ====> Repeated-point removed`, async () => {
      return await LibLWGeom.removeRepeatedPoints(pg, geom, tol);
    });
    geom = await Utils.call(`topo#${id} ====> Self-node`, async () => {
      return await LibLWGeom.node(pg, geom);
    });


  }


  async checkCollapseEdges(pg) {
    let startId = 1 - 1;
    let count;
    const limit  = 2000;
    do {
      const rows = await pg
        .query(`select id from ${this.#lineTopo} where id > $1 order by id asc limit $2`, [startId, limit])
        .then(res => {
          return res.rows || [];
        })
      ;
      count = rows.length;
      let nextId = 0;
      if (count > 0) {
        nextId = rows[count - 1]['id'];
        const that = this;
        await Utils.call(`#${startId} - #${nextId}`, async () => {
          for await (const row of rows) {
            const id = +row['id'];
            await that.checkCollapseEdge(pg, id);
          }
        });
      }
      startId = nextId;
    } while (count > 0);
  }

  async fixCollapseEdge(pg, id, theIds) {
    // 清空tmp表
    let sql;
    // 从topo取出来写入topo
    sql = `with 
    ta as (
      select geom from ${this.#lineDump} where id = $1
      union all 
      select geom from ${this.#lineTopo} where id in (${theIds.join(', ')})
    )
    , tb as (
      select ST_Union(geom) as geom from ta
    )
    , tc as (
      select (ST_Dump(geom)).geom as geom from tb
    )
    insert into ${this.#lineTopo} (geom) 
    select geom from tc`;
    await pg.query(sql, [id]);

    // 删除原有的
    await pg.query(`delete from ${this.#lineTopo} where id in (${[id, ...theIds].join(', ')})`);
    console.log(`====================================> re-calc intersects edges:`, [id, ...theIds]);
  }



  async calcEdge(pg, id) {
    let sql;
    // 从dump取出来写入topo
    sql = `with 
    ta as (
      select geom from ${this.#lineDump} where id = $1
    )
    select t.id as id from ${this.#lineTopo} as t, ta 
    where (t.geom && ta.geom) and ST_Intersects(t.geom, ta.geom) 
    and ST_NPoints(ST_Intersection(t.geom, ta.geom)) > 0`;
    const theIds = await pg
      .query(sql, [id])
      .then(res => {
        return res.rows.map(row => +row['id']);
      })
    ;
    console.log(theIds);
    if (theIds.length === 0) {
      console.log(`无交集，直接插入`);
      sql = `with 
      ta as (
        select geom from ${this.#lineDump} where id = $1
      )
      insert into ${this.#lineTopo} (geom) 
      select geom from ta 
      on conflict (id) do update set geom = excluded.geom`;
      return await pg.query(sql, [id]);
    }
    sql = `select ST_AsHEXEWKB(geom) as geom from ${this.#lineDump} where id = $1`;
    const geomDump = await pg.query(sql, [id]).then(res => res.rows[0]['geom']);
    let geomDumpTmp = geomDump;
    const geomPoints = [];
    for await (const theId of theIds) {
      sql = `select ST_AsHEXEWKB(geom) as geom from ${this.#lineTopo} where id = $1`;
      const geomTopo = await pg.query(sql, [theId]).then(res => res.rows[0]['geom']);
      // 交集的起始点和结束点
      sql = `with 
      ta as (
        select ST_Intersection($1::geometry, $2::geometry) as geom
      )
      , tb as (
        select geom from ta 
        where ST_GeometryType(geom) in ('ST_Point', 'ST_MultiPoint') 
        union all 
        select ST_LineMerge(geom) as geom from ta 
        where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint') 
      )
      , tc as (
        select (ST_Dump(geom)).geom as geom from tb where geom is not null
      )
      , td as (
        select ST_AsHEXEWKB(geom) as geom from tc 
        where ST_GeometryType(geom) in ('ST_Point', 'ST_MultiPoint') 
        union all 
        select ST_AsHEXEWKB(ST_StartPoint(geom)) as geom from tc 
        where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint') 
        union all 
        select ST_AsHEXEWKB(ST_EndPoint(geom)) as geom from tc
        where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint') 
      )
      select geom from td where geom is not null`;
      const rows = await pg.query(sql, [geomDump, geomTopo])
        .then(res => res.rows);
      for await (const row of rows) {
        geomPoints.push(row['geom']);
      }
      if (rows.length > 0) {
        sql = `with 
        ta as (
          select ST_Intersection($1::geometry, $2::geometry) as geom
        )
        , tb as (
          select geom from ta 
          where ST_GeometryType(geom) in ('ST_Point', 'ST_MultiPoint') 
          union all 
          select ST_LineMerge(geom) as geom from ta 
          where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint') 
        )
        , tc as (
          select (ST_Dump(geom)).geom as geom from tb where geom is not null
        )
        , td as (
          select geom from tc 
          where ST_GeometryType(geom) in ('ST_Point', 'ST_MultiPoint') 
          union all 
          select ST_StartPoint(geom) as geom from tc 
          where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint') 
          union all 
          select ST_EndPoint(geom) as geom from tc
          where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint') 
        )
        , te as (
          select ST_RemoveRepeatedPoints(ST_Collect(geom)) as geom from td
        )
        , tf as (
          select ST_Split($2::geometry, geom) as geom from te
        )
        , tg as (
          select (ST_Dump(geom)).geom as geom from tf
        )
        insert into ${this.#lineTopo} (geom) 
        select geom from tg`;
        await pg.query(sql, [geomDump, geomTopo]);
      }
      sql = `select ST_AsHEXEWKB(ST_Difference($1::geometry, $2::geometry)) as geom`;
      geomDumpTmp = await pg.query(sql, [geomDumpTmp, geomTopo])
        .then(res => res.rows[0]['geom']);
    }
    const geomNodes = Lodash.uniq(geomPoints);
    if (geomNodes.length === 0) {
      console.log(`交集是起始点或结束点, 直接插入`);
      sql = `with 
      ta as (
        select geom from ${this.#lineDump} where id = $1
      )
      insert into ${this.#lineTopo} (geom) 
      select geom from ta 
      on conflict (id) do update set geom = excluded.geom`;
      return await pg.query(sql, [id]);
    }
    // 最后插入剩下的
    if (geomDumpTmp !== null) {
      sql = `insert into ${this.#lineTopo} (geom) 
      values ($1::geometry)`;
      await pg.query(sql, [geomDumpTmp]);
    }

    // 删除原有的
    await pg.query(`delete from ${this.#lineTopo} where id in (${theIds.join(', ')})`);
  }


}


export default LibTopoLine;