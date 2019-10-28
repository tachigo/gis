'use strict';

import Utils from './../../modules/Utils';

import Lodash from 'lodash';

class LibTopoLine {

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

    try {
      await pg.query(`drop table ${this.#lineTopo}_tmp cascade`);
    } catch (e) {
      console.error(e.message);
    }
    await pg.query(`create table if not exists ${this.#lineTopo}_tmp
    (
        id bigserial primary key,
        geom geometry,
        constraint enforce_srid_geom check (st_srid(geom) = 4326)
    )`);
    await pg.query(`create index ${this.#lineTopoSchema}_${this.#lineTopoTable}_tmp_geom_idx on ${this.#lineTopo}_tmp using gist (geom)`);
  }


  async calcEdges(pg, maxVerticesNum) {
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
          await that.calcEdge(pg, id, maxVerticesNum);
        });
      }
      console.log(`#${startId} - #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }


  async calcTopo2Dump(pg) {
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
        await Utils.call(`关联 ${this.#lineTopo} 边 ${i}#${id} 的 dump 关系`, async () => {
          let ids;
          let dumpIds;
          const sql1 = `with 
          ta as (
            select geom from ${that.#lineTopo} where id = $1
          )
          , tb as (
            select t.id as id, ST_Intersection(
              t.geom, 
              ta.geom
            ) as geom from ${that.#lineDump} as t, ta 
            where (t.geom && ta.geom) 
            and ST_Intersects(t.geom, ta.geom)
          )
          , tc as (
            select id from tb 
            where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')
          )
          select distinct id from tc`;
          const rows1 = await pg
            .query(sql1, [id])
            .then(res => {
              return res.rows || [];
            })
          ;
          ids = rows1.map(item => +item['id']);
          dumpIds = Lodash.uniq(ids);
          if (dumpIds === 0) {
            const sql2 = `with 
            ta as (
              select geom from ${that.#lineTopo} where id = $1
            )
            , tb as (
              select t.id as id, ST_Intersection(
                t.geom, 
                ta.geom
              ) as geom from ${that.#lineDump} as t, ta 
              where (t.geom && ta.geom) 
              and ST_Intersects(t.geom, ta.geom)
            )
            , tc as (
              select id from tb 
            )
            select distinct id from tc`;
            const rows2 = await pg
              .query(sql2, [id])
              .then(res => {
                return res.rows || [];
              })
            ;
            ids = rows2.map(item => +item['id']);
            dumpIds = Lodash.uniq(ids);
          }
          console.log(dumpIds);
          if (dumpIds.length > 0) {
            const sql2 = `insert into ${that.#lineTopo} (id, dump_ids) 
            values ($1::bigint, $2::bigint[]) 
            on conflict (id) do update set dump_ids = excluded.dump_ids`;
            await pg.query(sql2, [id, `{${dumpIds.join(',')}}`]);
          } else {
            // throw new Error(`topo edge#${id} dose not math any dump lines`);
            console.log(`topo edge#${id} dose not math any dump lines`);
          }
        });
      }
      console.log(`#${startId} - #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }


  async calcDump2Topo(pg) {
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
        await Utils.call(`关联 ${this.#lineDump} 边 ${i}#${id}|${row['target_id']}|${row['path']} [${row['type']}|${row['category']}] 的拓扑关系`, async () => {
          let ids;
          let topoIds;
          const sql1 = `with 
          ta as (
            select geom from ${that.#lineDump} where id = $1
          )
          , tb as (
            select t.id as id, ST_Intersection(
              t.geom,
              ta.geom
            ) as geom from ${that.#lineTopo} as t, ta 
            where (t.geom && ta.geom) and ST_Intersects(t.geom, ta.geom)
          )
          , tc as (
            select id from tb 
            where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')
          )
          select distinct id from tc`;
          const rows1 = await pg
            .query(sql1, [id])
            .then(res => {
              return res.rows || [];
            })
          ;
          ids = rows1.map(item => +item['id']);
          topoIds = Lodash.uniq(ids);
          if (topoIds.length === 0) {
            const sql2 = `with 
            ta as (
              select geom from ${that.#lineDump} where id = $1
            )
            , tb as (
              select t.id as id, ST_Intersection(
                t.geom,
                ta.geom
              ) as geom from ${that.#lineTopo} as t, ta 
              where (t.geom && ta.geom) and ST_Intersects(t.geom, ta.geom)
            )
            , tc as (
              select id from tb 
            )
            select distinct id from tc`;
            const rows2 = await pg
              .query(sql2, [id])
              .then(res => {
                return res.rows || [];
              })
            ;
            ids = rows2.map(item => +item['id']);
            topoIds = Lodash.uniq(ids);
          }
          console.log(topoIds);
          if (topoIds.length > 0) {
            const sql2 = `insert into ${that.#lineDump} (id, topo_ids) 
            values ($1::bigint, $2::bigint[]) 
            on conflict (id) do update set topo_ids = excluded.topo_ids`;
            await pg.query(sql2, [id, `{${topoIds.join(',')}}`]);
          } else {
            console.log(`${this.#lineDump} 边 ${i}#${id}|${row['target_id']}|${row['path']} [${row['type']}|${row['category']}] 无拓扑关系`);
          }
        });
      }
      console.log(`#${startId} - #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }


  async checkEdges(pg, maxVerticesNum) {
    let startId = 1 - 1;
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
        await Utils.call(`检查 ${this.#lineTopo} 边 ${i}#${id}`, async () => {
          const sql = `with 
          ta as (
            select geom from ${that.#lineTopo} where id = $1
          )
          , tb as (
            select t.id as id, ST_Intersection(t.geom, ta.geom) as geom from ${that.#lineTopo} as t, ta 
            where t.id > $1 and (t.geom && ta.geom and ST_Intersects(t.geom, ta.geom))
          )
          select id from tb where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint') and ST_NPoints(geom) > 0`;
          const res = await pg.query(sql, [id])
            .then(res => {
              return res.rows || [];
            })
          ;
          const items = res.map(item => +item['id']);
          if (items.length > 0) {
            console.log(`edge #${id} intersects with edges`, items);
            // throw new Error(`edge #${id} intersects with edges: [${items.join(',')}]`);
            const notEquals = [];
            for await (const theId of items) {
              // 检查是否是相等的，如果是相等的，就可以删掉
              const sql = `with
              ta as (
                select geom from ${that.#lineTopo} where id = $1
              )
              , tb as (
                select id, geom from ${that.#lineTopo} where id = $2
              )
              select tb.id as id from ta, tb where ST_Equals(ta.geom, tb.geom)`;
              const rows = await pg
                .query(sql, [id, theId])
                .then(res => {
                  return res.rows || [];
                })
              ;
              if (rows.length > 0) {
                // 相等的 可以删除
                await pg.query(`====================================> delete from ${that.#lineTopo} where id = $1`, [theId]);
                console.log(`delete duplicate edge#${theId}`);
              } else {
                notEquals.push(theId);
              }
            }
            if (notEquals.length > 0) {
              console.log(`====================================> edge #${id} intersects with not equal edges:`, notEquals);
              await that.fixEdgeCalc(pg, id, notEquals, maxVerticesNum);
            }
          }
        });
      }
      console.log(`#${startId} - #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }


  async fixEdgeCalc(pg, id, theIds, maxVerticesNum) {
    // 清空tmp表
    await pg.query(`delete from ${this.#lineTopo}_tmp`);
    // 从topo取出来写入topo
    const sql = `with 
    ta as (
      select geom from ${this.#lineTopo} where id = $1
    )
    , tb as (
      select ST_Union(geom) as geom from ${this.#lineTopo} where id in (${theIds.join(',')})
    )
    , tc as (
      select ST_Intersection(ta.geom, tb.geom) as geom from ta, tb
    )
    , td as (
      select ST_Union(ta.geom, tb.geom) as geom from ta, tb
    )
    , te as (
	    select ST_SymDifference(td.geom, tc.geom) as geom from td, tc
    )
    , tf as (
      select (ST_Dump(geom)).geom as geom from tc 
      where geom is not null and ST_IsEmpty(geom) = false
      union all 
      select (ST_Dump(geom)).geom as geom from te 
      where geom is not null and ST_IsEmpty(geom) = false 
    )
    , tg as (
      select 
      ST_MakeValid(
        ST_Node(
          ST_LineMerge(
            ST_RemoveRepeatedPoints(
              ST_Union(geom)
            )
          )
        )
      ) 
      as geom from tf 
      where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')
    )
    , th as (
      select (ST_Dump(geom)).geom as geom from tg
    )
    insert into ${this.#lineTopo}_tmp (geom) 
    select geom from th`;
    await pg.query(sql, [id]);

    const realVerticesNum = maxVerticesNum - 1;
    const rows2 = await pg
      .query(`select id from ${this.#lineTopo}_tmp`)
      .then(res => {
        return res.rows || [];
      })
    ;
    for await (const row of rows2) {
      const sql = `with 
      ta as (
        select geom from ${this.#lineTopo}_tmp where id = $1
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
      insert into ${this.#lineTopo} (geom) 
      select geom from te`;
      await pg.query(sql, [+row['id']]);
    }
    // 删除原有的
    await pg.query(`delete from ${this.#lineTopo} where id in (${[id, ...theIds].join(', ')})`);
    console.log(`====================================> re-calc intersects edges:`, [id, ...theIds]);
  }

  async calcEdge(pg, id, maxVerticesNum) {
    const realVerticesNum = maxVerticesNum - 1;
    // 从dump取出来写入topo
    const sql1 = `with 
    ta as (
      select geom from ${this.#lineDump} where id = $1
    )
    select t.id as id from ${this.#lineTopo} as t, ta 
    where (t.geom && ta.geom) and ST_Intersects(t.geom, ta.geom) 
    and ST_NPoints(ST_Intersection(t.geom, ta.geom)) > 0`;
    const rows1 = await pg
      .query(sql1, [id])
      .then(res => {
        return res.rows || [];
      })
    ;
    const intersectIds = rows1.map(row => +row['id']);
    console.log(intersectIds);
    if (intersectIds.length === 0) {
      console.log(`无交集，直接插入`);
      return await pg
        .query(`with 
        ta as (
          select geom from ${this.#lineDump} where id = $1
        )
        insert into ${this.#lineTopo} (geom) 
        select 
          ST_MakeValid(
            ST_Node(
              ST_LineMerge(
                ST_RemoveRepeatedPoints(
                  geom
                )
              )
            )
          ) as geom from ta 
        on conflict (id) do update set geom = excluded.geom`, [id])
      ;
    }

    // 清空tmp表
    await pg.query(`delete from ${this.#lineTopo}_tmp`);

    const sql2 = `with 
    ta as (
      select geom from ${this.#lineDump} where id = $1
    )
    , tb as (
      select ST_Union(geom) as geom from ${this.#lineTopo} where id in (${intersectIds.join(', ')})
    ) 
    , tc as (
      select ST_Intersection(ta.geom, tb.geom) as geom from ta, tb
    )
    , td as (
      select ST_Union(ta.geom, tb.geom) as geom from ta, tb
    )
    , te as (
	    select ST_SymDifference(td.geom, tc.geom) as geom from td, tc
    )
    , tf as (
      select (ST_Dump(geom)).geom as geom from tc 
      where geom is not null and ST_IsEmpty(geom) = false
      union all 
      select (ST_Dump(geom)).geom as geom from te 
      where geom is not null and ST_IsEmpty(geom) = false 
    )
    , tg as (
      select 
      ST_MakeValid(
        ST_Node(
          ST_LineMerge(
            ST_RemoveRepeatedPoints(
              ST_Union(geom)
            )
          )
        )
      ) 
      as geom from tf 
      where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')
    )
    , th as (
      select (ST_Dump(geom)).geom as geom from tg
    )
    insert into ${this.#lineTopo}_tmp (geom) 
    select geom from th`;
    await pg.query(sql2, [id]);

    const rows2 = await pg
      .query(`select id from ${this.#lineTopo}_tmp`)
      .then(res => {
        return res.rows || [];
      })
    ;
    for await (const row of rows2) {
      const sql = `with 
      ta as (
        select geom from ${this.#lineTopo}_tmp where id = $1
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
      insert into ${this.#lineTopo} (geom) 
      select geom from te`;
      await pg.query(sql, [+row['id']]);
    }

    // 删除原有的
    await pg.query(`delete from ${this.#lineTopo} where id in (${intersectIds.join(', ')})`);
  }





}


export default LibTopoLine;