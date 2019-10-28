'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Utils = _interopRequireDefault(require("./../../modules/Utils"));

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }

var id = 0;

function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }

class LibTopoLine {
  constructor(lineDumpSchema, lineDumpTable, lineTopoSchema, lineTopoTable) {
    Object.defineProperty(this, _lineDumpSchema, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _lineDumpTable, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _lineDump, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _lineTopoSchema, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _lineTopoTable, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _lineTopo, {
      writable: true,
      value: void 0
    });
    _classPrivateFieldLooseBase(this, _lineDumpSchema)[_lineDumpSchema] = lineDumpSchema;
    _classPrivateFieldLooseBase(this, _lineDumpTable)[_lineDumpTable] = lineDumpTable;
    _classPrivateFieldLooseBase(this, _lineDump)[_lineDump] = `${lineDumpSchema}.${lineDumpTable}`;
    _classPrivateFieldLooseBase(this, _lineTopoSchema)[_lineTopoSchema] = lineTopoSchema;
    _classPrivateFieldLooseBase(this, _lineTopoTable)[_lineTopoTable] = lineTopoTable;
    _classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo] = `${lineTopoSchema}.${lineTopoTable}`;
  }

  async initDump2TopoRelation(pg) {
    try {
      await pg.query(`drop index if exists ${_classPrivateFieldLooseBase(this, _lineDumpSchema)[_lineDumpSchema]}_${_classPrivateFieldLooseBase(this, _lineDumpTable)[_lineDumpTable]}_topo_ids_idx cascade`);
    } catch (e) {
      console.error(e.message);
    }

    try {
      await pg.query(`alter table ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} drop column if exists topo_ids`);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`alter table ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} add column topo_ids bigint[]`);
    await pg.query(`create index ${_classPrivateFieldLooseBase(this, _lineDumpSchema)[_lineDumpSchema]}_${_classPrivateFieldLooseBase(this, _lineDumpTable)[_lineDumpTable]}_topo_ids_idx on ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} using gin (topo_ids)`);
  }

  async initTopo2DumpRelation(pg) {
    try {
      await pg.query(`drop index if exists ${_classPrivateFieldLooseBase(this, _lineTopoSchema)[_lineTopoSchema]}_${_classPrivateFieldLooseBase(this, _lineTopoTable)[_lineTopoTable]}_dump_ids_index cascade`);
    } catch (e) {
      console.error(e.message);
    }

    try {
      await pg.query(`alter table ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} drop column if exists dump_ids`);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`alter table ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} add column dump_ids bigint[]`);
    await pg.query(`create index ${_classPrivateFieldLooseBase(this, _lineTopoSchema)[_lineTopoSchema]}_${_classPrivateFieldLooseBase(this, _lineTopoTable)[_lineTopoTable]}_dump_ids_idx on ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} using gin (dump_ids)`);
  }

  async initDumpTable(pg) {
    try {
      await pg.query(`drop table if exists ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} cascade`);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`create table if not exists ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]}
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
    await pg.query(`create index ${_classPrivateFieldLooseBase(this, _lineDumpSchema)[_lineDumpSchema]}_${_classPrivateFieldLooseBase(this, _lineDumpTable)[_lineDumpTable]}_geom_idx on ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} using gist (geom)`);

    try {
      await pg.query(`drop table if exists ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]}_tmp cascade`);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`create table if not exists ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]}_tmp
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
    await pg.query(`create index ${_classPrivateFieldLooseBase(this, _lineDumpSchema)[_lineDumpSchema]}_${_classPrivateFieldLooseBase(this, _lineDumpTable)[_lineDumpTable]}_tmp_geom_idx on ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]}_tmp using gist (geom)`);
  }

  async dumpLinesToTmpTable(pg, id, type, category) {
    const fromTable = 'boundary.line';
    const toTable = `${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]}_tmp`;
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
      points, st_length(geom) as length from td order by path asc`, [id, type, category]);
  }

  async dumpLines(pg, id, type, category, verticesNum) {
    const realVerticesNum = verticesNum - 1;
    await this.dumpLinesToTmpTable(pg, id, type, category);
    const toTable = `${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]}`;
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
    let path = 0;
    let count;
    const limit = 1000;

    do {
      const rows = await pg.query(`select id, path from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]}_tmp where target_id = $1 and type = $2 and category = $3 and path > $4 order by path asc limit $5`, [id, type, category, path, limit]).then(res => {
        return res.rows || [];
      });
      count = rows.length;
      let nextPath = 0;

      for await (const row of rows) {
        const tmpId = +row['id'];
        nextPath = +row['path'];
        const sql = `with 
        ta as (
          select geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]}_tmp where id = $4
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
    const toTable = `${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]}`;
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
      ST_NPoints(geom) as points, st_length(geom) as length from te order by path asc`, [id, type, category]);
  }

  async initTopoTable(pg) {
    try {
      await pg.query(`drop table ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} cascade`);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`create table if not exists ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}
    (
        id bigserial primary key,
        geom geometry,
        constraint enforce_srid_geom check (st_srid(geom) = 4326)
    )`);
    await pg.query(`create index ${_classPrivateFieldLooseBase(this, _lineTopoSchema)[_lineTopoSchema]}_${_classPrivateFieldLooseBase(this, _lineTopoTable)[_lineTopoTable]}_geom_idx on ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} using gist (geom)`);

    try {
      await pg.query(`drop table ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp cascade`);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`create table if not exists ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp
    (
        id bigserial primary key,
        geom geometry,
        constraint enforce_srid_geom check (st_srid(geom) = 4326)
    )`);
    await pg.query(`create index ${_classPrivateFieldLooseBase(this, _lineTopoSchema)[_lineTopoSchema]}_${_classPrivateFieldLooseBase(this, _lineTopoTable)[_lineTopoTable]}_tmp_geom_idx on ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp using gist (geom)`);
  }

  async calcEdges(pg, maxVerticesNum) {
    let startId = 0;
    let count;
    const limit = 100;

    do {
      const rows = await pg.query(`select id, target_id, path, type, category from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id > $1 order by id asc limit $2`, [startId, limit]).then(res => {
        return res.rows || [];
      });
      count = rows.length;
      let nextId = 0;
      const that = this;

      for await (const row of rows) {
        const id = +row['id'];
        nextId = id;
        await _Utils.default.call(`计算边 ${id}|${row['target_id']}|${row['path']} [${row['type']}|${row['category']}]`, async () => {
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
    const limit = 100;
    let i = 0;

    do {
      const rows = await pg.query(`select id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id > $1 order by id asc limit $2`, [startId, limit]).then(res => {
        return res.rows || [];
      });
      count = rows.length;
      let nextId = 0;
      const that = this;

      for await (const row of rows) {
        const id = +row['id'];
        nextId = id;
        i += 1;
        await _Utils.default.call(`关联 ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} 边 ${i}#${id} 的 dump 关系`, async () => {
          let ids;
          let dumpIds;
          const sql1 = `with 
          ta as (
            select geom from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} where id = $1
          )
          , tb as (
            select t.id as id, ST_Intersection(
              t.geom, 
              ta.geom
            ) as geom from ${_classPrivateFieldLooseBase(that, _lineDump)[_lineDump]} as t, ta 
            where (t.geom && ta.geom) 
            and ST_Intersects(t.geom, ta.geom)
          )
          , tc as (
            select id from tb 
            where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')
          )
          select distinct id from tc`;
          const rows1 = await pg.query(sql1, [id]).then(res => {
            return res.rows || [];
          });
          ids = rows1.map(item => +item['id']);
          dumpIds = _lodash.default.uniq(ids);

          if (dumpIds === 0) {
            const sql2 = `with 
            ta as (
              select geom from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} where id = $1
            )
            , tb as (
              select t.id as id, ST_Intersection(
                t.geom, 
                ta.geom
              ) as geom from ${_classPrivateFieldLooseBase(that, _lineDump)[_lineDump]} as t, ta 
              where (t.geom && ta.geom) 
              and ST_Intersects(t.geom, ta.geom)
            )
            , tc as (
              select id from tb 
            )
            select distinct id from tc`;
            const rows2 = await pg.query(sql2, [id]).then(res => {
              return res.rows || [];
            });
            ids = rows2.map(item => +item['id']);
            dumpIds = _lodash.default.uniq(ids);
          }

          console.log(dumpIds);

          if (dumpIds.length > 0) {
            const sql2 = `insert into ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} (id, dump_ids) 
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
    const limit = 100;
    let i = 0;

    do {
      const rows = await pg.query(`select id, target_id, path, type, category from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id > $1 order by id asc limit $2`, [startId, limit]).then(res => {
        return res.rows || [];
      });
      count = rows.length;
      let nextId = 0;
      const that = this;

      for await (const row of rows) {
        const id = +row['id'];
        nextId = id;
        i += 1;
        await _Utils.default.call(`关联 ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} 边 ${i}#${id}|${row['target_id']}|${row['path']} [${row['type']}|${row['category']}] 的拓扑关系`, async () => {
          let ids;
          let topoIds;
          const sql1 = `with 
          ta as (
            select geom from ${_classPrivateFieldLooseBase(that, _lineDump)[_lineDump]} where id = $1
          )
          , tb as (
            select t.id as id, ST_Intersection(
              t.geom,
              ta.geom
            ) as geom from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} as t, ta 
            where (t.geom && ta.geom) and ST_Intersects(t.geom, ta.geom)
          )
          , tc as (
            select id from tb 
            where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')
          )
          select distinct id from tc`;
          const rows1 = await pg.query(sql1, [id]).then(res => {
            return res.rows || [];
          });
          ids = rows1.map(item => +item['id']);
          topoIds = _lodash.default.uniq(ids);

          if (topoIds.length === 0) {
            const sql2 = `with 
            ta as (
              select geom from ${_classPrivateFieldLooseBase(that, _lineDump)[_lineDump]} where id = $1
            )
            , tb as (
              select t.id as id, ST_Intersection(
                t.geom,
                ta.geom
              ) as geom from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} as t, ta 
              where (t.geom && ta.geom) and ST_Intersects(t.geom, ta.geom)
            )
            , tc as (
              select id from tb 
            )
            select distinct id from tc`;
            const rows2 = await pg.query(sql2, [id]).then(res => {
              return res.rows || [];
            });
            ids = rows2.map(item => +item['id']);
            topoIds = _lodash.default.uniq(ids);
          }

          console.log(topoIds);

          if (topoIds.length > 0) {
            const sql2 = `insert into ${_classPrivateFieldLooseBase(that, _lineDump)[_lineDump]} (id, topo_ids) 
            values ($1::bigint, $2::bigint[]) 
            on conflict (id) do update set topo_ids = excluded.topo_ids`;
            await pg.query(sql2, [id, `{${topoIds.join(',')}}`]);
          } else {
            console.log(`${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} 边 ${i}#${id}|${row['target_id']}|${row['path']} [${row['type']}|${row['category']}] 无拓扑关系`);
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
    const limit = 100;
    let i = 0;

    do {
      const rows = await pg.query(`select id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id > $1 order by id asc limit $2`, [startId, limit]).then(res => {
        return res.rows || [];
      });
      count = rows.length;
      let nextId = 0;
      const that = this;

      for await (const row of rows) {
        const id = +row['id'];
        nextId = id;
        i += 1;
        await _Utils.default.call(`检查 ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} 边 ${i}#${id}`, async () => {
          const sql = `with 
          ta as (
            select geom from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} where id = $1
          )
          , tb as (
            select t.id as id, ST_Intersection(t.geom, ta.geom) as geom from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} as t, ta 
            where t.id > $1 and (t.geom && ta.geom and ST_Intersects(t.geom, ta.geom))
          )
          select id from tb where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint') and ST_NPoints(geom) > 0`;
          const res = await pg.query(sql, [id]).then(res => {
            return res.rows || [];
          });
          const items = res.map(item => +item['id']);

          if (items.length > 0) {
            console.log(`edge #${id} intersects with edges`, items); // throw new Error(`edge #${id} intersects with edges: [${items.join(',')}]`);

            const notEquals = [];

            for await (const theId of items) {
              // 检查是否是相等的，如果是相等的，就可以删掉
              const sql = `with
              ta as (
                select geom from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} where id = $1
              )
              , tb as (
                select id, geom from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} where id = $2
              )
              select tb.id as id from ta, tb where ST_Equals(ta.geom, tb.geom)`;
              const rows = await pg.query(sql, [id, theId]).then(res => {
                return res.rows || [];
              });

              if (rows.length > 0) {
                // 相等的 可以删除
                await pg.query(`====================================> delete from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} where id = $1`, [theId]);
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
    await pg.query(`delete from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp`); // 从topo取出来写入topo

    const sql = `with 
    ta as (
      select geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id = $1
    )
    , tb as (
      select ST_Union(geom) as geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id in (${theIds.join(',')})
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
    insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp (geom) 
    select geom from th`;
    await pg.query(sql, [id]);
    const realVerticesNum = maxVerticesNum - 1;
    const rows2 = await pg.query(`select id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp`).then(res => {
      return res.rows || [];
    });

    for await (const row of rows2) {
      const sql = `with 
      ta as (
        select geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp where id = $1
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
      insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} (geom) 
      select geom from te`;
      await pg.query(sql, [+row['id']]);
    } // 删除原有的


    await pg.query(`delete from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id in (${[id, ...theIds].join(', ')})`);
    console.log(`====================================> re-calc intersects edges:`, [id, ...theIds]);
  }

  async calcEdge(pg, id, maxVerticesNum) {
    const realVerticesNum = maxVerticesNum - 1; // 从dump取出来写入topo

    const sql1 = `with 
    ta as (
      select geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id = $1
    )
    select t.id as id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} as t, ta 
    where (t.geom && ta.geom) and ST_Intersects(t.geom, ta.geom) 
    and ST_NPoints(ST_Intersection(t.geom, ta.geom)) > 0`;
    const rows1 = await pg.query(sql1, [id]).then(res => {
      return res.rows || [];
    });
    const intersectIds = rows1.map(row => +row['id']);
    console.log(intersectIds);

    if (intersectIds.length === 0) {
      console.log(`无交集，直接插入`);
      return await pg.query(`with 
        ta as (
          select geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id = $1
        )
        insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} (geom) 
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
        on conflict (id) do update set geom = excluded.geom`, [id]);
    } // 清空tmp表


    await pg.query(`delete from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp`);
    const sql2 = `with 
    ta as (
      select geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id = $1
    )
    , tb as (
      select ST_Union(geom) as geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id in (${intersectIds.join(', ')})
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
    insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp (geom) 
    select geom from th`;
    await pg.query(sql2, [id]);
    const rows2 = await pg.query(`select id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp`).then(res => {
      return res.rows || [];
    });

    for await (const row of rows2) {
      const sql = `with 
      ta as (
        select geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp where id = $1
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
      insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} (geom) 
      select geom from te`;
      await pg.query(sql, [+row['id']]);
    } // 删除原有的


    await pg.query(`delete from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id in (${intersectIds.join(', ')})`);
  }

}

var _lineDumpSchema = _classPrivateFieldLooseKey("lineDumpSchema");

var _lineDumpTable = _classPrivateFieldLooseKey("lineDumpTable");

var _lineDump = _classPrivateFieldLooseKey("lineDump");

var _lineTopoSchema = _classPrivateFieldLooseKey("lineTopoSchema");

var _lineTopoTable = _classPrivateFieldLooseKey("lineTopoTable");

var _lineTopo = _classPrivateFieldLooseKey("lineTopo");

var _default = LibTopoLine;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvTGliVG9wb0xpbmUuanMiXSwibmFtZXMiOlsiTGliVG9wb0xpbmUiLCJjb25zdHJ1Y3RvciIsImxpbmVEdW1wU2NoZW1hIiwibGluZUR1bXBUYWJsZSIsImxpbmVUb3BvU2NoZW1hIiwibGluZVRvcG9UYWJsZSIsImluaXREdW1wMlRvcG9SZWxhdGlvbiIsInBnIiwicXVlcnkiLCJlIiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImluaXRUb3BvMkR1bXBSZWxhdGlvbiIsImluaXREdW1wVGFibGUiLCJkdW1wTGluZXNUb1RtcFRhYmxlIiwiaWQiLCJ0eXBlIiwiY2F0ZWdvcnkiLCJmcm9tVGFibGUiLCJ0b1RhYmxlIiwiZHVtcExpbmVzIiwidmVydGljZXNOdW0iLCJyZWFsVmVydGljZXNOdW0iLCJwYXRoIiwiY291bnQiLCJsaW1pdCIsInJvd3MiLCJ0aGVuIiwicmVzIiwibGVuZ3RoIiwibmV4dFBhdGgiLCJyb3ciLCJ0bXBJZCIsInNxbCIsImxvZyIsImR1bXBMaW5lc09sZCIsImluaXRUb3BvVGFibGUiLCJjYWxjRWRnZXMiLCJtYXhWZXJ0aWNlc051bSIsInN0YXJ0SWQiLCJuZXh0SWQiLCJ0aGF0IiwiVXRpbHMiLCJjYWxsIiwiY2FsY0VkZ2UiLCJjYWxjVG9wbzJEdW1wIiwiaSIsImlkcyIsImR1bXBJZHMiLCJzcWwxIiwicm93czEiLCJtYXAiLCJpdGVtIiwiTG9kYXNoIiwidW5pcSIsInNxbDIiLCJyb3dzMiIsImpvaW4iLCJjYWxjRHVtcDJUb3BvIiwidG9wb0lkcyIsImNoZWNrRWRnZXMiLCJpdGVtcyIsIm5vdEVxdWFscyIsInRoZUlkIiwicHVzaCIsImZpeEVkZ2VDYWxjIiwidGhlSWRzIiwiaW50ZXJzZWN0SWRzIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQUVBOztBQUVBOzs7Ozs7Ozs7O0FBRUEsTUFBTUEsV0FBTixDQUFrQjtBQVdoQkMsRUFBQUEsV0FBVyxDQUFDQyxjQUFELEVBQWlCQyxhQUFqQixFQUFnQ0MsY0FBaEMsRUFBZ0RDLGFBQWhELEVBQStEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ3hFLDBFQUF1QkgsY0FBdkI7QUFDQSx3RUFBc0JDLGFBQXRCO0FBQ0EsOERBQWtCLEdBQUVELGNBQWUsSUFBR0MsYUFBYyxFQUFwRDtBQUVBLDBFQUF1QkMsY0FBdkI7QUFDQSx3RUFBc0JDLGFBQXRCO0FBQ0EsOERBQWtCLEdBQUVELGNBQWUsSUFBR0MsYUFBYyxFQUFwRDtBQUNEOztBQUdELFFBQU1DLHFCQUFOLENBQTRCQyxFQUE1QixFQUFnQztBQUM5QixRQUFJO0FBQ0YsWUFBTUEsRUFBRSxDQUFDQyxLQUFILENBQVUsd0JBQUQsNEJBQXdCLElBQXhCLG1DQUE2QyxJQUE3Qyw0QkFBZ0QsSUFBaEQsaUNBQW9FLHVCQUE3RSxDQUFOO0FBQ0QsS0FGRCxDQUVFLE9BQU9DLENBQVAsRUFBVTtBQUNWQyxNQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBY0YsQ0FBQyxDQUFDRyxPQUFoQjtBQUNEOztBQUVELFFBQUk7QUFDRixZQUFNTCxFQUFFLENBQUNDLEtBQUgsQ0FBVSxlQUFELDRCQUFlLElBQWYsdUJBQThCLGlDQUF2QyxDQUFOO0FBQ0QsS0FGRCxDQUVFLE9BQU9DLENBQVAsRUFBVTtBQUNWQyxNQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBY0YsQ0FBQyxDQUFDRyxPQUFoQjtBQUNEOztBQUVELFVBQU1MLEVBQUUsQ0FBQ0MsS0FBSCxDQUFVLGVBQUQsNEJBQWUsSUFBZix1QkFBOEIsK0JBQXZDLENBQU47QUFDQSxVQUFNRCxFQUFFLENBQUNDLEtBQUgsQ0FBVSxnQkFBRCw0QkFBZ0IsSUFBaEIsbUNBQXFDLElBQXJDLDRCQUF3QyxJQUF4QyxpQ0FBNEQsb0JBQTVELDRCQUErRSxJQUEvRSx1QkFBOEYsdUJBQXZHLENBQU47QUFDRDs7QUFHRCxRQUFNSyxxQkFBTixDQUE0Qk4sRUFBNUIsRUFBZ0M7QUFDOUIsUUFBSTtBQUNGLFlBQU1BLEVBQUUsQ0FBQ0MsS0FBSCxDQUFVLHdCQUFELDRCQUF3QixJQUF4QixtQ0FBNkMsSUFBN0MsNEJBQWdELElBQWhELGlDQUFvRSx5QkFBN0UsQ0FBTjtBQUNELEtBRkQsQ0FFRSxPQUFPQyxDQUFQLEVBQVU7QUFDVkMsTUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNGLENBQUMsQ0FBQ0csT0FBaEI7QUFDRDs7QUFFRCxRQUFJO0FBQ0YsWUFBTUwsRUFBRSxDQUFDQyxLQUFILENBQVUsZUFBRCw0QkFBZSxJQUFmLHVCQUE4QixpQ0FBdkMsQ0FBTjtBQUNELEtBRkQsQ0FFRSxPQUFPQyxDQUFQLEVBQVU7QUFDVkMsTUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNGLENBQUMsQ0FBQ0csT0FBaEI7QUFDRDs7QUFFRCxVQUFNTCxFQUFFLENBQUNDLEtBQUgsQ0FBVSxlQUFELDRCQUFlLElBQWYsdUJBQThCLCtCQUF2QyxDQUFOO0FBQ0EsVUFBTUQsRUFBRSxDQUFDQyxLQUFILENBQVUsZ0JBQUQsNEJBQWdCLElBQWhCLG1DQUFxQyxJQUFyQyw0QkFBd0MsSUFBeEMsaUNBQTRELG9CQUE1RCw0QkFBK0UsSUFBL0UsdUJBQThGLHVCQUF2RyxDQUFOO0FBQ0Q7O0FBR0QsUUFBTU0sYUFBTixDQUFvQlAsRUFBcEIsRUFBd0I7QUFDdEIsUUFBSTtBQUNGLFlBQU1BLEVBQUUsQ0FBQ0MsS0FBSCxDQUFVLHdCQUFELDRCQUF3QixJQUF4Qix1QkFBdUMsVUFBaEQsQ0FBTjtBQUNELEtBRkQsQ0FFRSxPQUFPQyxDQUFQLEVBQVU7QUFDVkMsTUFBQUEsT0FBTyxDQUFDQyxLQUFSLENBQWNGLENBQUMsQ0FBQ0csT0FBaEI7QUFDRDs7QUFDRCxVQUFNTCxFQUFFLENBQUNDLEtBQUgsQ0FBVSw4QkFBRCw0QkFBOEIsSUFBOUIsdUJBQTZDOzs7Ozs7Ozs7OztNQUF0RCxDQUFOO0FBWUEsVUFBTUQsRUFBRSxDQUFDQyxLQUFILENBQVUsZ0JBQUQsNEJBQWdCLElBQWhCLG1DQUFxQyxJQUFyQyw0QkFBd0MsSUFBeEMsaUNBQTRELGdCQUE1RCw0QkFBMkUsSUFBM0UsdUJBQTBGLG9CQUFuRyxDQUFOOztBQUVBLFFBQUk7QUFDRixZQUFNRCxFQUFFLENBQUNDLEtBQUgsQ0FBVSx3QkFBRCw0QkFBd0IsSUFBeEIsdUJBQXVDLGNBQWhELENBQU47QUFDRCxLQUZELENBRUUsT0FBT0MsQ0FBUCxFQUFVO0FBQ1ZDLE1BQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjRixDQUFDLENBQUNHLE9BQWhCO0FBQ0Q7O0FBRUQsVUFBTUwsRUFBRSxDQUFDQyxLQUFILENBQVUsOEJBQUQsNEJBQThCLElBQTlCLHVCQUE2Qzs7Ozs7Ozs7Ozs7TUFBdEQsQ0FBTjtBQVlBLFVBQU1ELEVBQUUsQ0FBQ0MsS0FBSCxDQUFVLGdCQUFELDRCQUFnQixJQUFoQixtQ0FBcUMsSUFBckMsNEJBQXdDLElBQXhDLGlDQUE0RCxvQkFBNUQsNEJBQStFLElBQS9FLHVCQUE4Rix3QkFBdkcsQ0FBTjtBQUNEOztBQUdELFFBQU1PLG1CQUFOLENBQTBCUixFQUExQixFQUE4QlMsRUFBOUIsRUFBa0NDLElBQWxDLEVBQXdDQyxRQUF4QyxFQUFrRDtBQUNoRCxVQUFNQyxTQUFTLEdBQUcsZUFBbEI7QUFDQSxVQUFNQyxPQUFPLEdBQUksR0FBRCw0QkFBRyxJQUFILHVCQUFrQixNQUFsQztBQUNBLFVBQU1iLEVBQUUsQ0FBQ0MsS0FBSCxDQUFVLGVBQWNZLE9BQVEsdURBQWhDLEVBQXdGLENBQUNKLEVBQUQsRUFBS0MsSUFBTCxFQUFXQyxRQUFYLENBQXhGLENBQU47QUFFQSxVQUFNWCxFQUFFLENBQUNDLEtBQUgsQ0FBVTs7bURBRStCVyxTQUFVOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQkFvQnpDQyxPQUFROztrRUF0QmxCLEVBeUJKLENBQUNKLEVBQUQsRUFBS0MsSUFBTCxFQUFXQyxRQUFYLENBekJJLENBQU47QUEyQkQ7O0FBR0QsUUFBTUcsU0FBTixDQUFnQmQsRUFBaEIsRUFBb0JTLEVBQXBCLEVBQXdCQyxJQUF4QixFQUE4QkMsUUFBOUIsRUFBd0NJLFdBQXhDLEVBQXFEO0FBQ25ELFVBQU1DLGVBQWUsR0FBR0QsV0FBVyxHQUFHLENBQXRDO0FBQ0EsVUFBTSxLQUFLUCxtQkFBTCxDQUF5QlIsRUFBekIsRUFBNkJTLEVBQTdCLEVBQWlDQyxJQUFqQyxFQUF1Q0MsUUFBdkMsQ0FBTjtBQUNBLFVBQU1FLE9BQU8sR0FBSSxHQUFELDRCQUFHLElBQUgsdUJBQWtCLEVBQWxDO0FBQ0EsVUFBTWIsRUFBRSxDQUFDQyxLQUFILENBQVUsZUFBY1ksT0FBUSx1REFBaEMsRUFBd0YsQ0FBQ0osRUFBRCxFQUFLQyxJQUFMLEVBQVdDLFFBQVgsQ0FBeEYsQ0FBTjtBQUVBLFFBQUlNLElBQUksR0FBRyxDQUFYO0FBQ0EsUUFBSUMsS0FBSjtBQUNBLFVBQU1DLEtBQUssR0FBRyxJQUFkOztBQUNBLE9BQUc7QUFDRCxZQUFNQyxJQUFJLEdBQUcsTUFBTXBCLEVBQUUsQ0FDbEJDLEtBRGdCLENBRWQsd0JBQUQsNEJBQXdCLElBQXhCLHVCQUF1QyxvR0FGeEIsRUFHZixDQUFDUSxFQUFELEVBQUtDLElBQUwsRUFBV0MsUUFBWCxFQUFxQk0sSUFBckIsRUFBMkJFLEtBQTNCLENBSGUsRUFLaEJFLElBTGdCLENBS1hDLEdBQUcsSUFBSTtBQUNYLGVBQU9BLEdBQUcsQ0FBQ0YsSUFBSixJQUFZLEVBQW5CO0FBQ0QsT0FQZ0IsQ0FBbkI7QUFTQUYsTUFBQUEsS0FBSyxHQUFHRSxJQUFJLENBQUNHLE1BQWI7QUFDQSxVQUFJQyxRQUFRLEdBQUcsQ0FBZjs7QUFDQSxpQkFBVyxNQUFNQyxHQUFqQixJQUF3QkwsSUFBeEIsRUFBOEI7QUFDNUIsY0FBTU0sS0FBSyxHQUFHLENBQUNELEdBQUcsQ0FBQyxJQUFELENBQWxCO0FBQ0FELFFBQUFBLFFBQVEsR0FBRyxDQUFDQyxHQUFHLENBQUMsTUFBRCxDQUFmO0FBQ0EsY0FBTUUsR0FBRyxHQUFJOzs2QkFBRCw0QkFFUyxJQUZULHVCQUV3Qjs7OztzREFJVVgsZUFBZ0IsZ0JBQWVBLGVBQWdCOzs7Ozs7Ozs7Ozs7O21CQWFsRlEsUUFBUzs7c0JBRU5YLE9BQVE7O29FQXJCdEI7QUF3QkEsY0FBTWIsRUFBRSxDQUFDQyxLQUFILENBQVMwQixHQUFULEVBQWMsQ0FBQ2xCLEVBQUQsRUFBS0MsSUFBTCxFQUFXQyxRQUFYLEVBQXFCZSxLQUFyQixDQUFkLENBQU47QUFDRDs7QUFDRHZCLE1BQUFBLE9BQU8sQ0FBQ3lCLEdBQVIsQ0FBYSw0QkFBMkJuQixFQUFHLElBQUdDLElBQUssSUFBR0MsUUFBUyxLQUFJTSxJQUFLLE9BQU1PLFFBQVMsRUFBdkY7QUFDQVAsTUFBQUEsSUFBSSxHQUFHTyxRQUFQO0FBQ0QsS0EzQ0QsUUEyQ1NOLEtBQUssR0FBRyxDQTNDakI7QUE0Q0Q7O0FBR0QsUUFBTVcsWUFBTixDQUFtQjdCLEVBQW5CLEVBQXVCUyxFQUF2QixFQUEyQkMsSUFBM0IsRUFBaUNDLFFBQWpDLEVBQTJDO0FBQ3pDLFVBQU1DLFNBQVMsR0FBRyxlQUFsQjtBQUNBLFVBQU1DLE9BQU8sR0FBSSxHQUFELDRCQUFHLElBQUgsdUJBQWtCLEVBQWxDO0FBQ0EsVUFBTWIsRUFBRSxDQUFDQyxLQUFILENBQVUsZUFBY1ksT0FBUSx1REFBaEMsRUFBd0YsQ0FBQ0osRUFBRCxFQUFLQyxJQUFMLEVBQVdDLFFBQVgsQ0FBeEYsQ0FBTjtBQUVBLFVBQU1YLEVBQUUsQ0FBQ0MsS0FBSCxDQUFVOzttREFFK0JXLFNBQVU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQXVCekNDLE9BQVE7O3NGQXpCbEIsRUE0QkosQ0FBQ0osRUFBRCxFQUFLQyxJQUFMLEVBQVdDLFFBQVgsQ0E1QkksQ0FBTjtBQThCRDs7QUFHRCxRQUFNbUIsYUFBTixDQUFvQjlCLEVBQXBCLEVBQXdCO0FBQ3RCLFFBQUk7QUFDRixZQUFNQSxFQUFFLENBQUNDLEtBQUgsQ0FBVSxjQUFELDRCQUFjLElBQWQsdUJBQTZCLFVBQXRDLENBQU47QUFDRCxLQUZELENBRUUsT0FBT0MsQ0FBUCxFQUFVO0FBQ1ZDLE1BQUFBLE9BQU8sQ0FBQ0MsS0FBUixDQUFjRixDQUFDLENBQUNHLE9BQWhCO0FBQ0Q7O0FBQ0QsVUFBTUwsRUFBRSxDQUFDQyxLQUFILENBQVUsOEJBQUQsNEJBQThCLElBQTlCLHVCQUE2Qzs7Ozs7TUFBdEQsQ0FBTjtBQU1BLFVBQU1ELEVBQUUsQ0FBQ0MsS0FBSCxDQUFVLGdCQUFELDRCQUFnQixJQUFoQixtQ0FBcUMsSUFBckMsNEJBQXdDLElBQXhDLGlDQUE0RCxnQkFBNUQsNEJBQTJFLElBQTNFLHVCQUEwRixvQkFBbkcsQ0FBTjs7QUFFQSxRQUFJO0FBQ0YsWUFBTUQsRUFBRSxDQUFDQyxLQUFILENBQVUsY0FBRCw0QkFBYyxJQUFkLHVCQUE2QixjQUF0QyxDQUFOO0FBQ0QsS0FGRCxDQUVFLE9BQU9DLENBQVAsRUFBVTtBQUNWQyxNQUFBQSxPQUFPLENBQUNDLEtBQVIsQ0FBY0YsQ0FBQyxDQUFDRyxPQUFoQjtBQUNEOztBQUNELFVBQU1MLEVBQUUsQ0FBQ0MsS0FBSCxDQUFVLDhCQUFELDRCQUE4QixJQUE5Qix1QkFBNkM7Ozs7O01BQXRELENBQU47QUFNQSxVQUFNRCxFQUFFLENBQUNDLEtBQUgsQ0FBVSxnQkFBRCw0QkFBZ0IsSUFBaEIsbUNBQXFDLElBQXJDLDRCQUF3QyxJQUF4QyxpQ0FBNEQsb0JBQTVELDRCQUErRSxJQUEvRSx1QkFBOEYsd0JBQXZHLENBQU47QUFDRDs7QUFHRCxRQUFNOEIsU0FBTixDQUFnQi9CLEVBQWhCLEVBQW9CZ0MsY0FBcEIsRUFBb0M7QUFDbEMsUUFBSUMsT0FBTyxHQUFHLENBQWQ7QUFDQSxRQUFJZixLQUFKO0FBQ0EsVUFBTUMsS0FBSyxHQUFJLEdBQWY7O0FBQ0EsT0FBRztBQUNELFlBQU1DLElBQUksR0FBRyxNQUFNcEIsRUFBRSxDQUNsQkMsS0FEZ0IsQ0FDVCxtREFBRCw0QkFBbUQsSUFBbkQsdUJBQWtFLHlDQUR4RCxFQUNrRyxDQUFDZ0MsT0FBRCxFQUFVZCxLQUFWLENBRGxHLEVBRWhCRSxJQUZnQixDQUVYQyxHQUFHLElBQUk7QUFDWCxlQUFPQSxHQUFHLENBQUNGLElBQUosSUFBWSxFQUFuQjtBQUNELE9BSmdCLENBQW5CO0FBTUFGLE1BQUFBLEtBQUssR0FBR0UsSUFBSSxDQUFDRyxNQUFiO0FBQ0EsVUFBSVcsTUFBTSxHQUFHLENBQWI7QUFDQSxZQUFNQyxJQUFJLEdBQUcsSUFBYjs7QUFDQSxpQkFBVyxNQUFNVixHQUFqQixJQUF3QkwsSUFBeEIsRUFBOEI7QUFDNUIsY0FBTVgsRUFBRSxHQUFHLENBQUNnQixHQUFHLENBQUMsSUFBRCxDQUFmO0FBQ0FTLFFBQUFBLE1BQU0sR0FBR3pCLEVBQVQ7QUFDQSxjQUFNMkIsZUFBTUMsSUFBTixDQUFZLE9BQU01QixFQUFHLElBQUdnQixHQUFHLENBQUMsV0FBRCxDQUFjLElBQUdBLEdBQUcsQ0FBQyxNQUFELENBQVMsS0FBSUEsR0FBRyxDQUFDLE1BQUQsQ0FBUyxJQUFHQSxHQUFHLENBQUMsVUFBRCxDQUFhLEdBQTNGLEVBQStGLFlBQVk7QUFDL0csZ0JBQU1VLElBQUksQ0FBQ0csUUFBTCxDQUFjdEMsRUFBZCxFQUFrQlMsRUFBbEIsRUFBc0J1QixjQUF0QixDQUFOO0FBQ0QsU0FGSyxDQUFOO0FBR0Q7O0FBQ0Q3QixNQUFBQSxPQUFPLENBQUN5QixHQUFSLENBQWEsSUFBR0ssT0FBUSxPQUFNQyxNQUFPLEVBQXJDO0FBQ0FELE1BQUFBLE9BQU8sR0FBR0MsTUFBVjtBQUNELEtBbkJELFFBbUJTaEIsS0FBSyxHQUFHLENBbkJqQjtBQW9CRDs7QUFHRCxRQUFNcUIsYUFBTixDQUFvQnZDLEVBQXBCLEVBQXdCO0FBQ3RCLFFBQUlpQyxPQUFPLEdBQUcsQ0FBZDtBQUNBLFFBQUlmLEtBQUo7QUFDQSxVQUFNQyxLQUFLLEdBQUksR0FBZjtBQUNBLFFBQUlxQixDQUFDLEdBQUcsQ0FBUjs7QUFDQSxPQUFHO0FBQ0QsWUFBTXBCLElBQUksR0FBRyxNQUFNcEIsRUFBRSxDQUNsQkMsS0FEZ0IsQ0FDVCxrQkFBRCw0QkFBa0IsSUFBbEIsdUJBQWlDLHlDQUR2QixFQUNpRSxDQUFDZ0MsT0FBRCxFQUFVZCxLQUFWLENBRGpFLEVBRWhCRSxJQUZnQixDQUVYQyxHQUFHLElBQUk7QUFDWCxlQUFPQSxHQUFHLENBQUNGLElBQUosSUFBWSxFQUFuQjtBQUNELE9BSmdCLENBQW5CO0FBTUFGLE1BQUFBLEtBQUssR0FBR0UsSUFBSSxDQUFDRyxNQUFiO0FBQ0EsVUFBSVcsTUFBTSxHQUFHLENBQWI7QUFDQSxZQUFNQyxJQUFJLEdBQUcsSUFBYjs7QUFDQSxpQkFBVyxNQUFNVixHQUFqQixJQUF3QkwsSUFBeEIsRUFBOEI7QUFDNUIsY0FBTVgsRUFBRSxHQUFHLENBQUNnQixHQUFHLENBQUMsSUFBRCxDQUFmO0FBQ0FTLFFBQUFBLE1BQU0sR0FBR3pCLEVBQVQ7QUFDQStCLFFBQUFBLENBQUMsSUFBSSxDQUFMO0FBQ0EsY0FBTUosZUFBTUMsSUFBTixDQUFZLE1BQUQsNEJBQU0sSUFBTix1QkFBcUIsTUFBS0csQ0FBRSxJQUFHL0IsRUFBRyxZQUE3QyxFQUEwRCxZQUFZO0FBQzFFLGNBQUlnQyxHQUFKO0FBQ0EsY0FBSUMsT0FBSjtBQUNBLGdCQUFNQyxJQUFJLEdBQUk7OytCQUFELDRCQUVRUixJQUZSLHVCQUV1Qjs7Ozs7OzZCQUZ2Qiw0QkFRTUEsSUFSTix1QkFRcUI7Ozs7Ozs7O3FDQVJsQztBQWlCQSxnQkFBTVMsS0FBSyxHQUFHLE1BQU01QyxFQUFFLENBQ25CQyxLQURpQixDQUNYMEMsSUFEVyxFQUNMLENBQUNsQyxFQUFELENBREssRUFFakJZLElBRmlCLENBRVpDLEdBQUcsSUFBSTtBQUNYLG1CQUFPQSxHQUFHLENBQUNGLElBQUosSUFBWSxFQUFuQjtBQUNELFdBSmlCLENBQXBCO0FBTUFxQixVQUFBQSxHQUFHLEdBQUdHLEtBQUssQ0FBQ0MsR0FBTixDQUFVQyxJQUFJLElBQUksQ0FBQ0EsSUFBSSxDQUFDLElBQUQsQ0FBdkIsQ0FBTjtBQUNBSixVQUFBQSxPQUFPLEdBQUdLLGdCQUFPQyxJQUFQLENBQVlQLEdBQVosQ0FBVjs7QUFDQSxjQUFJQyxPQUFPLEtBQUssQ0FBaEIsRUFBbUI7QUFDakIsa0JBQU1PLElBQUksR0FBSTs7aUNBQUQsNEJBRVFkLElBRlIsdUJBRXVCOzs7Ozs7K0JBRnZCLDRCQVFNQSxJQVJOLHVCQVFxQjs7Ozs7Ozt1Q0FSbEM7QUFnQkEsa0JBQU1lLEtBQUssR0FBRyxNQUFNbEQsRUFBRSxDQUNuQkMsS0FEaUIsQ0FDWGdELElBRFcsRUFDTCxDQUFDeEMsRUFBRCxDQURLLEVBRWpCWSxJQUZpQixDQUVaQyxHQUFHLElBQUk7QUFDWCxxQkFBT0EsR0FBRyxDQUFDRixJQUFKLElBQVksRUFBbkI7QUFDRCxhQUppQixDQUFwQjtBQU1BcUIsWUFBQUEsR0FBRyxHQUFHUyxLQUFLLENBQUNMLEdBQU4sQ0FBVUMsSUFBSSxJQUFJLENBQUNBLElBQUksQ0FBQyxJQUFELENBQXZCLENBQU47QUFDQUosWUFBQUEsT0FBTyxHQUFHSyxnQkFBT0MsSUFBUCxDQUFZUCxHQUFaLENBQVY7QUFDRDs7QUFDRHRDLFVBQUFBLE9BQU8sQ0FBQ3lCLEdBQVIsQ0FBWWMsT0FBWjs7QUFDQSxjQUFJQSxPQUFPLENBQUNuQixNQUFSLEdBQWlCLENBQXJCLEVBQXdCO0FBQ3RCLGtCQUFNMEIsSUFBSSxHQUFJLGVBQUQsNEJBQWVkLElBQWYsdUJBQThCOzt3RUFBM0M7QUFHQSxrQkFBTW5DLEVBQUUsQ0FBQ0MsS0FBSCxDQUFTZ0QsSUFBVCxFQUFlLENBQUN4QyxFQUFELEVBQU0sSUFBR2lDLE9BQU8sQ0FBQ1MsSUFBUixDQUFhLEdBQWIsQ0FBa0IsR0FBM0IsQ0FBZixDQUFOO0FBQ0QsV0FMRCxNQUtPO0FBQ0w7QUFDQWhELFlBQUFBLE9BQU8sQ0FBQ3lCLEdBQVIsQ0FBYSxhQUFZbkIsRUFBRywrQkFBNUI7QUFDRDtBQUNGLFNBaEVLLENBQU47QUFpRUQ7O0FBQ0ROLE1BQUFBLE9BQU8sQ0FBQ3lCLEdBQVIsQ0FBYSxJQUFHSyxPQUFRLE9BQU1DLE1BQU8sRUFBckM7QUFDQUQsTUFBQUEsT0FBTyxHQUFHQyxNQUFWO0FBQ0QsS0FsRkQsUUFrRlNoQixLQUFLLEdBQUcsQ0FsRmpCO0FBbUZEOztBQUdELFFBQU1rQyxhQUFOLENBQW9CcEQsRUFBcEIsRUFBd0I7QUFDdEIsUUFBSWlDLE9BQU8sR0FBRyxDQUFkO0FBQ0EsUUFBSWYsS0FBSjtBQUNBLFVBQU1DLEtBQUssR0FBSSxHQUFmO0FBQ0EsUUFBSXFCLENBQUMsR0FBRyxDQUFSOztBQUVBLE9BQUc7QUFDRCxZQUFNcEIsSUFBSSxHQUFHLE1BQU1wQixFQUFFLENBQ2xCQyxLQURnQixDQUNULG1EQUFELDRCQUFtRCxJQUFuRCx1QkFBa0UseUNBRHhELEVBQ2tHLENBQUNnQyxPQUFELEVBQVVkLEtBQVYsQ0FEbEcsRUFFaEJFLElBRmdCLENBRVhDLEdBQUcsSUFBSTtBQUNYLGVBQU9BLEdBQUcsQ0FBQ0YsSUFBSixJQUFZLEVBQW5CO0FBQ0QsT0FKZ0IsQ0FBbkI7QUFNQUYsTUFBQUEsS0FBSyxHQUFHRSxJQUFJLENBQUNHLE1BQWI7QUFDQSxVQUFJVyxNQUFNLEdBQUcsQ0FBYjtBQUNBLFlBQU1DLElBQUksR0FBRyxJQUFiOztBQUNBLGlCQUFXLE1BQU1WLEdBQWpCLElBQXdCTCxJQUF4QixFQUE4QjtBQUM1QixjQUFNWCxFQUFFLEdBQUcsQ0FBQ2dCLEdBQUcsQ0FBQyxJQUFELENBQWY7QUFDQVMsUUFBQUEsTUFBTSxHQUFHekIsRUFBVDtBQUNBK0IsUUFBQUEsQ0FBQyxJQUFJLENBQUw7QUFDQSxjQUFNSixlQUFNQyxJQUFOLENBQVksTUFBRCw0QkFBTSxJQUFOLHVCQUFxQixNQUFLRyxDQUFFLElBQUcvQixFQUFHLElBQUdnQixHQUFHLENBQUMsV0FBRCxDQUFjLElBQUdBLEdBQUcsQ0FBQyxNQUFELENBQVMsS0FBSUEsR0FBRyxDQUFDLE1BQUQsQ0FBUyxJQUFHQSxHQUFHLENBQUMsVUFBRCxDQUFhLFNBQW5ILEVBQTZILFlBQVk7QUFDN0ksY0FBSWdCLEdBQUo7QUFDQSxjQUFJWSxPQUFKO0FBQ0EsZ0JBQU1WLElBQUksR0FBSTs7K0JBQUQsNEJBRVFSLElBRlIsdUJBRXVCOzs7Ozs7NkJBRnZCLDRCQVFNQSxJQVJOLHVCQVFxQjs7Ozs7OztxQ0FSbEM7QUFnQkEsZ0JBQU1TLEtBQUssR0FBRyxNQUFNNUMsRUFBRSxDQUNuQkMsS0FEaUIsQ0FDWDBDLElBRFcsRUFDTCxDQUFDbEMsRUFBRCxDQURLLEVBRWpCWSxJQUZpQixDQUVaQyxHQUFHLElBQUk7QUFDWCxtQkFBT0EsR0FBRyxDQUFDRixJQUFKLElBQVksRUFBbkI7QUFDRCxXQUppQixDQUFwQjtBQU1BcUIsVUFBQUEsR0FBRyxHQUFHRyxLQUFLLENBQUNDLEdBQU4sQ0FBVUMsSUFBSSxJQUFJLENBQUNBLElBQUksQ0FBQyxJQUFELENBQXZCLENBQU47QUFDQU8sVUFBQUEsT0FBTyxHQUFHTixnQkFBT0MsSUFBUCxDQUFZUCxHQUFaLENBQVY7O0FBQ0EsY0FBSVksT0FBTyxDQUFDOUIsTUFBUixLQUFtQixDQUF2QixFQUEwQjtBQUN4QixrQkFBTTBCLElBQUksR0FBSTs7aUNBQUQsNEJBRVFkLElBRlIsdUJBRXVCOzs7Ozs7K0JBRnZCLDRCQVFNQSxJQVJOLHVCQVFxQjs7Ozs7O3VDQVJsQztBQWVBLGtCQUFNZSxLQUFLLEdBQUcsTUFBTWxELEVBQUUsQ0FDbkJDLEtBRGlCLENBQ1hnRCxJQURXLEVBQ0wsQ0FBQ3hDLEVBQUQsQ0FESyxFQUVqQlksSUFGaUIsQ0FFWkMsR0FBRyxJQUFJO0FBQ1gscUJBQU9BLEdBQUcsQ0FBQ0YsSUFBSixJQUFZLEVBQW5CO0FBQ0QsYUFKaUIsQ0FBcEI7QUFNQXFCLFlBQUFBLEdBQUcsR0FBR1MsS0FBSyxDQUFDTCxHQUFOLENBQVVDLElBQUksSUFBSSxDQUFDQSxJQUFJLENBQUMsSUFBRCxDQUF2QixDQUFOO0FBQ0FPLFlBQUFBLE9BQU8sR0FBR04sZ0JBQU9DLElBQVAsQ0FBWVAsR0FBWixDQUFWO0FBQ0Q7O0FBQ0R0QyxVQUFBQSxPQUFPLENBQUN5QixHQUFSLENBQVl5QixPQUFaOztBQUNBLGNBQUlBLE9BQU8sQ0FBQzlCLE1BQVIsR0FBaUIsQ0FBckIsRUFBd0I7QUFDdEIsa0JBQU0wQixJQUFJLEdBQUksZUFBRCw0QkFBZWQsSUFBZix1QkFBOEI7O3dFQUEzQztBQUdBLGtCQUFNbkMsRUFBRSxDQUFDQyxLQUFILENBQVNnRCxJQUFULEVBQWUsQ0FBQ3hDLEVBQUQsRUFBTSxJQUFHNEMsT0FBTyxDQUFDRixJQUFSLENBQWEsR0FBYixDQUFrQixHQUEzQixDQUFmLENBQU47QUFDRCxXQUxELE1BS087QUFDTGhELFlBQUFBLE9BQU8sQ0FBQ3lCLEdBQVIsQ0FBYSxHQUFELDRCQUFHLElBQUgsdUJBQWtCLE1BQUtZLENBQUUsSUFBRy9CLEVBQUcsSUFBR2dCLEdBQUcsQ0FBQyxXQUFELENBQWMsSUFBR0EsR0FBRyxDQUFDLE1BQUQsQ0FBUyxLQUFJQSxHQUFHLENBQUMsTUFBRCxDQUFTLElBQUdBLEdBQUcsQ0FBQyxVQUFELENBQWEsU0FBakg7QUFDRDtBQUNGLFNBN0RLLENBQU47QUE4REQ7O0FBQ0R0QixNQUFBQSxPQUFPLENBQUN5QixHQUFSLENBQWEsSUFBR0ssT0FBUSxPQUFNQyxNQUFPLEVBQXJDO0FBQ0FELE1BQUFBLE9BQU8sR0FBR0MsTUFBVjtBQUNELEtBL0VELFFBK0VTaEIsS0FBSyxHQUFHLENBL0VqQjtBQWdGRDs7QUFHRCxRQUFNb0MsVUFBTixDQUFpQnRELEVBQWpCLEVBQXFCZ0MsY0FBckIsRUFBcUM7QUFDbkMsUUFBSUMsT0FBTyxHQUFHLElBQUksQ0FBbEI7QUFDQSxRQUFJZixLQUFKO0FBQ0EsVUFBTUMsS0FBSyxHQUFJLEdBQWY7QUFDQSxRQUFJcUIsQ0FBQyxHQUFHLENBQVI7O0FBQ0EsT0FBRztBQUNELFlBQU1wQixJQUFJLEdBQUcsTUFBTXBCLEVBQUUsQ0FDbEJDLEtBRGdCLENBQ1Qsa0JBQUQsNEJBQWtCLElBQWxCLHVCQUFpQyx5Q0FEdkIsRUFDaUUsQ0FBQ2dDLE9BQUQsRUFBVWQsS0FBVixDQURqRSxFQUVoQkUsSUFGZ0IsQ0FFWEMsR0FBRyxJQUFJO0FBQ1gsZUFBT0EsR0FBRyxDQUFDRixJQUFKLElBQVksRUFBbkI7QUFDRCxPQUpnQixDQUFuQjtBQU1BRixNQUFBQSxLQUFLLEdBQUdFLElBQUksQ0FBQ0csTUFBYjtBQUNBLFVBQUlXLE1BQU0sR0FBRyxDQUFiO0FBQ0EsWUFBTUMsSUFBSSxHQUFHLElBQWI7O0FBQ0EsaUJBQVcsTUFBTVYsR0FBakIsSUFBd0JMLElBQXhCLEVBQThCO0FBQzVCLGNBQU1YLEVBQUUsR0FBRyxDQUFDZ0IsR0FBRyxDQUFDLElBQUQsQ0FBZjtBQUNBUyxRQUFBQSxNQUFNLEdBQUd6QixFQUFUO0FBQ0ErQixRQUFBQSxDQUFDLElBQUksQ0FBTDtBQUNBLGNBQU1KLGVBQU1DLElBQU4sQ0FBWSxNQUFELDRCQUFNLElBQU4sdUJBQXFCLE1BQUtHLENBQUUsSUFBRy9CLEVBQUcsRUFBN0MsRUFBZ0QsWUFBWTtBQUNoRSxnQkFBTWtCLEdBQUcsR0FBSTs7K0JBQUQsNEJBRVNRLElBRlQsdUJBRXdCOzs7K0VBRnhCLDRCQUt5REEsSUFMekQsdUJBS3dFOzs7c0hBTHBGO0FBU0EsZ0JBQU1iLEdBQUcsR0FBRyxNQUFNdEIsRUFBRSxDQUFDQyxLQUFILENBQVMwQixHQUFULEVBQWMsQ0FBQ2xCLEVBQUQsQ0FBZCxFQUNmWSxJQURlLENBQ1ZDLEdBQUcsSUFBSTtBQUNYLG1CQUFPQSxHQUFHLENBQUNGLElBQUosSUFBWSxFQUFuQjtBQUNELFdBSGUsQ0FBbEI7QUFLQSxnQkFBTW1DLEtBQUssR0FBR2pDLEdBQUcsQ0FBQ3VCLEdBQUosQ0FBUUMsSUFBSSxJQUFJLENBQUNBLElBQUksQ0FBQyxJQUFELENBQXJCLENBQWQ7O0FBQ0EsY0FBSVMsS0FBSyxDQUFDaEMsTUFBTixHQUFlLENBQW5CLEVBQXNCO0FBQ3BCcEIsWUFBQUEsT0FBTyxDQUFDeUIsR0FBUixDQUFhLFNBQVFuQixFQUFHLHdCQUF4QixFQUFpRDhDLEtBQWpELEVBRG9CLENBRXBCOztBQUNBLGtCQUFNQyxTQUFTLEdBQUcsRUFBbEI7O0FBQ0EsdUJBQVcsTUFBTUMsS0FBakIsSUFBMEJGLEtBQTFCLEVBQWlDO0FBQy9CO0FBQ0Esb0JBQU01QixHQUFHLEdBQUk7O21DQUFELDRCQUVTUSxJQUZULHVCQUV3Qjs7O3VDQUZ4Qiw0QkFLYUEsSUFMYix1QkFLNEI7OytFQUx4QztBQVFBLG9CQUFNZixJQUFJLEdBQUcsTUFBTXBCLEVBQUUsQ0FDbEJDLEtBRGdCLENBQ1YwQixHQURVLEVBQ0wsQ0FBQ2xCLEVBQUQsRUFBS2dELEtBQUwsQ0FESyxFQUVoQnBDLElBRmdCLENBRVhDLEdBQUcsSUFBSTtBQUNYLHVCQUFPQSxHQUFHLENBQUNGLElBQUosSUFBWSxFQUFuQjtBQUNELGVBSmdCLENBQW5COztBQU1BLGtCQUFJQSxJQUFJLENBQUNHLE1BQUwsR0FBYyxDQUFsQixFQUFxQjtBQUNuQjtBQUNBLHNCQUFNdkIsRUFBRSxDQUFDQyxLQUFILENBQVUscURBQUQsNEJBQXFEa0MsSUFBckQsdUJBQW9FLGdCQUE3RSxFQUE4RixDQUFDc0IsS0FBRCxDQUE5RixDQUFOO0FBQ0F0RCxnQkFBQUEsT0FBTyxDQUFDeUIsR0FBUixDQUFhLHlCQUF3QjZCLEtBQU0sRUFBM0M7QUFDRCxlQUpELE1BSU87QUFDTEQsZ0JBQUFBLFNBQVMsQ0FBQ0UsSUFBVixDQUFlRCxLQUFmO0FBQ0Q7QUFDRjs7QUFDRCxnQkFBSUQsU0FBUyxDQUFDakMsTUFBVixHQUFtQixDQUF2QixFQUEwQjtBQUN4QnBCLGNBQUFBLE9BQU8sQ0FBQ3lCLEdBQVIsQ0FBYSwrQ0FBOENuQixFQUFHLG1DQUE5RCxFQUFrRytDLFNBQWxHO0FBQ0Esb0JBQU1yQixJQUFJLENBQUN3QixXQUFMLENBQWlCM0QsRUFBakIsRUFBcUJTLEVBQXJCLEVBQXlCK0MsU0FBekIsRUFBb0N4QixjQUFwQyxDQUFOO0FBQ0Q7QUFDRjtBQUNGLFNBakRLLENBQU47QUFrREQ7O0FBQ0Q3QixNQUFBQSxPQUFPLENBQUN5QixHQUFSLENBQWEsSUFBR0ssT0FBUSxPQUFNQyxNQUFPLEVBQXJDO0FBQ0FELE1BQUFBLE9BQU8sR0FBR0MsTUFBVjtBQUNELEtBbkVELFFBbUVTaEIsS0FBSyxHQUFHLENBbkVqQjtBQW9FRDs7QUFHRCxRQUFNeUMsV0FBTixDQUFrQjNELEVBQWxCLEVBQXNCUyxFQUF0QixFQUEwQm1ELE1BQTFCLEVBQWtDNUIsY0FBbEMsRUFBa0Q7QUFDaEQ7QUFDQSxVQUFNaEMsRUFBRSxDQUFDQyxLQUFILENBQVUsZUFBRCw0QkFBZSxJQUFmLHVCQUE4QixNQUF2QyxDQUFOLENBRmdELENBR2hEOztBQUNBLFVBQU0wQixHQUFHLEdBQUk7O3lCQUFELDRCQUVTLElBRlQsdUJBRXdCOzs7MkNBRnhCLDRCQUsyQixJQUwzQix1QkFLMEMsaUJBQWdCaUMsTUFBTSxDQUFDVCxJQUFQLENBQVksR0FBWixDQUFpQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBTDNFLDRCQXdDRSxJQXhDRix1QkF3Q2lCO3dCQXhDN0I7QUEwQ0EsVUFBTW5ELEVBQUUsQ0FBQ0MsS0FBSCxDQUFTMEIsR0FBVCxFQUFjLENBQUNsQixFQUFELENBQWQsQ0FBTjtBQUVBLFVBQU1PLGVBQWUsR0FBR2dCLGNBQWMsR0FBRyxDQUF6QztBQUNBLFVBQU1rQixLQUFLLEdBQUcsTUFBTWxELEVBQUUsQ0FDbkJDLEtBRGlCLENBQ1Ysa0JBQUQsNEJBQWtCLElBQWxCLHVCQUFpQyxNQUR0QixFQUVqQm9CLElBRmlCLENBRVpDLEdBQUcsSUFBSTtBQUNYLGFBQU9BLEdBQUcsQ0FBQ0YsSUFBSixJQUFZLEVBQW5CO0FBQ0QsS0FKaUIsQ0FBcEI7O0FBTUEsZUFBVyxNQUFNSyxHQUFqQixJQUF3QnlCLEtBQXhCLEVBQStCO0FBQzdCLFlBQU12QixHQUFHLEdBQUk7OzJCQUFELDRCQUVTLElBRlQsdUJBRXdCOzs7O29EQUlVWCxlQUFnQixnQkFBZUEsZUFBZ0I7Ozs7Ozs7Ozs7OztvQkFOakYsNEJBa0JFLElBbEJGLHVCQWtCaUI7MEJBbEI3QjtBQW9CQSxZQUFNaEIsRUFBRSxDQUFDQyxLQUFILENBQVMwQixHQUFULEVBQWMsQ0FBQyxDQUFDRixHQUFHLENBQUMsSUFBRCxDQUFMLENBQWQsQ0FBTjtBQUNELEtBN0UrQyxDQThFaEQ7OztBQUNBLFVBQU16QixFQUFFLENBQUNDLEtBQUgsQ0FBVSxlQUFELDRCQUFlLElBQWYsdUJBQThCLGlCQUFnQixDQUFDUSxFQUFELEVBQUssR0FBR21ELE1BQVIsRUFBZ0JULElBQWhCLENBQXFCLElBQXJCLENBQTJCLEdBQWxGLENBQU47QUFDQWhELElBQUFBLE9BQU8sQ0FBQ3lCLEdBQVIsQ0FBYSxpRUFBYixFQUErRSxDQUFDbkIsRUFBRCxFQUFLLEdBQUdtRCxNQUFSLENBQS9FO0FBQ0Q7O0FBRUQsUUFBTXRCLFFBQU4sQ0FBZXRDLEVBQWYsRUFBbUJTLEVBQW5CLEVBQXVCdUIsY0FBdkIsRUFBdUM7QUFDckMsVUFBTWhCLGVBQWUsR0FBR2dCLGNBQWMsR0FBRyxDQUF6QyxDQURxQyxDQUVyQzs7QUFDQSxVQUFNVyxJQUFJLEdBQUk7O3lCQUFELDRCQUVRLElBRlIsdUJBRXVCOzs2QkFGdkIsNEJBSVksSUFKWix1QkFJMkI7O3lEQUp4QztBQU9BLFVBQU1DLEtBQUssR0FBRyxNQUFNNUMsRUFBRSxDQUNuQkMsS0FEaUIsQ0FDWDBDLElBRFcsRUFDTCxDQUFDbEMsRUFBRCxDQURLLEVBRWpCWSxJQUZpQixDQUVaQyxHQUFHLElBQUk7QUFDWCxhQUFPQSxHQUFHLENBQUNGLElBQUosSUFBWSxFQUFuQjtBQUNELEtBSmlCLENBQXBCO0FBTUEsVUFBTXlDLFlBQVksR0FBR2pCLEtBQUssQ0FBQ0MsR0FBTixDQUFVcEIsR0FBRyxJQUFJLENBQUNBLEdBQUcsQ0FBQyxJQUFELENBQXJCLENBQXJCO0FBQ0F0QixJQUFBQSxPQUFPLENBQUN5QixHQUFSLENBQVlpQyxZQUFaOztBQUNBLFFBQUlBLFlBQVksQ0FBQ3RDLE1BQWIsS0FBd0IsQ0FBNUIsRUFBK0I7QUFDN0JwQixNQUFBQSxPQUFPLENBQUN5QixHQUFSLENBQWEsVUFBYjtBQUNBLGFBQU8sTUFBTTVCLEVBQUUsQ0FDWkMsS0FEVSxDQUNIOzs2QkFBRCw0QkFFYyxJQUZkLHVCQUU2Qjs7c0JBRjdCLDRCQUlPLElBSlAsdUJBSXNCOzs7Ozs7Ozs7Ozs0REFMbEIsRUFnQjJDLENBQUNRLEVBQUQsQ0FoQjNDLENBQWI7QUFrQkQsS0F0Q29DLENBd0NyQzs7O0FBQ0EsVUFBTVQsRUFBRSxDQUFDQyxLQUFILENBQVUsZUFBRCw0QkFBZSxJQUFmLHVCQUE4QixNQUF2QyxDQUFOO0FBRUEsVUFBTWdELElBQUksR0FBSTs7eUJBQUQsNEJBRVEsSUFGUix1QkFFdUI7OzsyQ0FGdkIsNEJBSzBCLElBTDFCLHVCQUt5QyxpQkFBZ0JZLFlBQVksQ0FBQ1YsSUFBYixDQUFrQixJQUFsQixDQUF3Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBTGpGLDRCQXdDQyxJQXhDRCx1QkF3Q2dCO3dCQXhDN0I7QUEwQ0EsVUFBTW5ELEVBQUUsQ0FBQ0MsS0FBSCxDQUFTZ0QsSUFBVCxFQUFlLENBQUN4QyxFQUFELENBQWYsQ0FBTjtBQUVBLFVBQU15QyxLQUFLLEdBQUcsTUFBTWxELEVBQUUsQ0FDbkJDLEtBRGlCLENBQ1Ysa0JBQUQsNEJBQWtCLElBQWxCLHVCQUFpQyxNQUR0QixFQUVqQm9CLElBRmlCLENBRVpDLEdBQUcsSUFBSTtBQUNYLGFBQU9BLEdBQUcsQ0FBQ0YsSUFBSixJQUFZLEVBQW5CO0FBQ0QsS0FKaUIsQ0FBcEI7O0FBTUEsZUFBVyxNQUFNSyxHQUFqQixJQUF3QnlCLEtBQXhCLEVBQStCO0FBQzdCLFlBQU12QixHQUFHLEdBQUk7OzJCQUFELDRCQUVTLElBRlQsdUJBRXdCOzs7O29EQUlVWCxlQUFnQixnQkFBZUEsZUFBZ0I7Ozs7Ozs7Ozs7OztvQkFOakYsNEJBa0JFLElBbEJGLHVCQWtCaUI7MEJBbEI3QjtBQW9CQSxZQUFNaEIsRUFBRSxDQUFDQyxLQUFILENBQVMwQixHQUFULEVBQWMsQ0FBQyxDQUFDRixHQUFHLENBQUMsSUFBRCxDQUFMLENBQWQsQ0FBTjtBQUNELEtBbkhvQyxDQXFIckM7OztBQUNBLFVBQU16QixFQUFFLENBQUNDLEtBQUgsQ0FBVSxlQUFELDRCQUFlLElBQWYsdUJBQThCLGlCQUFnQjRELFlBQVksQ0FBQ1YsSUFBYixDQUFrQixJQUFsQixDQUF3QixHQUEvRSxDQUFOO0FBQ0Q7O0FBdnVCZTs7Ozs7Ozs7Ozs7Ozs7ZUFndkJIMUQsVyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFV0aWxzIGZyb20gJy4vLi4vLi4vbW9kdWxlcy9VdGlscyc7XG5cbmltcG9ydCBMb2Rhc2ggZnJvbSAnbG9kYXNoJztcblxuY2xhc3MgTGliVG9wb0xpbmUge1xuXG4gICNsaW5lRHVtcFNjaGVtYTtcbiAgI2xpbmVEdW1wVGFibGU7XG4gICNsaW5lRHVtcDtcblxuICAjbGluZVRvcG9TY2hlbWE7XG4gICNsaW5lVG9wb1RhYmxlO1xuICAjbGluZVRvcG87XG5cblxuICBjb25zdHJ1Y3RvcihsaW5lRHVtcFNjaGVtYSwgbGluZUR1bXBUYWJsZSwgbGluZVRvcG9TY2hlbWEsIGxpbmVUb3BvVGFibGUpIHtcbiAgICB0aGlzLiNsaW5lRHVtcFNjaGVtYSA9IGxpbmVEdW1wU2NoZW1hO1xuICAgIHRoaXMuI2xpbmVEdW1wVGFibGUgPSBsaW5lRHVtcFRhYmxlO1xuICAgIHRoaXMuI2xpbmVEdW1wID0gYCR7bGluZUR1bXBTY2hlbWF9LiR7bGluZUR1bXBUYWJsZX1gO1xuXG4gICAgdGhpcy4jbGluZVRvcG9TY2hlbWEgPSBsaW5lVG9wb1NjaGVtYTtcbiAgICB0aGlzLiNsaW5lVG9wb1RhYmxlID0gbGluZVRvcG9UYWJsZTtcbiAgICB0aGlzLiNsaW5lVG9wbyA9IGAke2xpbmVUb3BvU2NoZW1hfS4ke2xpbmVUb3BvVGFibGV9YDtcbiAgfVxuXG5cbiAgYXN5bmMgaW5pdER1bXAyVG9wb1JlbGF0aW9uKHBnKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBkcm9wIGluZGV4IGlmIGV4aXN0cyAke3RoaXMuI2xpbmVEdW1wU2NoZW1hfV8ke3RoaXMuI2xpbmVEdW1wVGFibGV9X3RvcG9faWRzX2lkeCBjYXNjYWRlYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgYWx0ZXIgdGFibGUgJHt0aGlzLiNsaW5lRHVtcH0gZHJvcCBjb2x1bW4gaWYgZXhpc3RzIHRvcG9faWRzYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cblxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBhbHRlciB0YWJsZSAke3RoaXMuI2xpbmVEdW1wfSBhZGQgY29sdW1uIHRvcG9faWRzIGJpZ2ludFtdYCk7XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSBpbmRleCAke3RoaXMuI2xpbmVEdW1wU2NoZW1hfV8ke3RoaXMuI2xpbmVEdW1wVGFibGV9X3RvcG9faWRzX2lkeCBvbiAke3RoaXMuI2xpbmVEdW1wfSB1c2luZyBnaW4gKHRvcG9faWRzKWApO1xuICB9XG5cblxuICBhc3luYyBpbml0VG9wbzJEdW1wUmVsYXRpb24ocGcpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYGRyb3AgaW5kZXggaWYgZXhpc3RzICR7dGhpcy4jbGluZVRvcG9TY2hlbWF9XyR7dGhpcy4jbGluZVRvcG9UYWJsZX1fZHVtcF9pZHNfaW5kZXggY2FzY2FkZWApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYGFsdGVyIHRhYmxlICR7dGhpcy4jbGluZVRvcG99IGRyb3AgY29sdW1uIGlmIGV4aXN0cyBkdW1wX2lkc2ApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICBhd2FpdCBwZy5xdWVyeShgYWx0ZXIgdGFibGUgJHt0aGlzLiNsaW5lVG9wb30gYWRkIGNvbHVtbiBkdW1wX2lkcyBiaWdpbnRbXWApO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgaW5kZXggJHt0aGlzLiNsaW5lVG9wb1NjaGVtYX1fJHt0aGlzLiNsaW5lVG9wb1RhYmxlfV9kdW1wX2lkc19pZHggb24gJHt0aGlzLiNsaW5lVG9wb30gdXNpbmcgZ2luIChkdW1wX2lkcylgKTtcbiAgfVxuXG5cbiAgYXN5bmMgaW5pdER1bXBUYWJsZShwZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgZHJvcCB0YWJsZSBpZiBleGlzdHMgJHt0aGlzLiNsaW5lRHVtcH0gY2FzY2FkZWApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSB0YWJsZSBpZiBub3QgZXhpc3RzICR7dGhpcy4jbGluZUR1bXB9XG4gICAgKFxuICAgICAgICBpZCBiaWdzZXJpYWwgcHJpbWFyeSBrZXksXG4gICAgICAgIHRhcmdldF9pZCBiaWdpbnQsXG4gICAgICAgIHBhdGggaW50LFxuICAgICAgICB0eXBlIHZhcmNoYXIsXG4gICAgICAgIGNhdGVnb3J5IHZhcmNoYXIsXG4gICAgICAgIHBvaW50cyBpbnRlZ2VyLFxuICAgICAgICBsZW5ndGggZmxvYXQsXG4gICAgICAgIGdlb20gZ2VvbWV0cnksXG4gICAgICAgIGNvbnN0cmFpbnQgZW5mb3JjZV9zcmlkX2dlb20gY2hlY2sgKHN0X3NyaWQoZ2VvbSkgPSA0MzI2KVxuICAgIClgKTtcbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIGluZGV4ICR7dGhpcy4jbGluZUR1bXBTY2hlbWF9XyR7dGhpcy4jbGluZUR1bXBUYWJsZX1fZ2VvbV9pZHggb24gJHt0aGlzLiNsaW5lRHVtcH0gdXNpbmcgZ2lzdCAoZ2VvbSlgKTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgZHJvcCB0YWJsZSBpZiBleGlzdHMgJHt0aGlzLiNsaW5lRHVtcH1fdG1wIGNhc2NhZGVgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSB0YWJsZSBpZiBub3QgZXhpc3RzICR7dGhpcy4jbGluZUR1bXB9X3RtcFxuICAgIChcbiAgICAgICAgaWQgYmlnc2VyaWFsIHByaW1hcnkga2V5LFxuICAgICAgICB0YXJnZXRfaWQgYmlnaW50LFxuICAgICAgICBwYXRoIGludCxcbiAgICAgICAgdHlwZSB2YXJjaGFyLFxuICAgICAgICBjYXRlZ29yeSB2YXJjaGFyLFxuICAgICAgICBwb2ludHMgaW50ZWdlcixcbiAgICAgICAgbGVuZ3RoIGZsb2F0LFxuICAgICAgICBnZW9tIGdlb21ldHJ5LFxuICAgICAgICBjb25zdHJhaW50IGVuZm9yY2Vfc3JpZF9nZW9tIGNoZWNrIChzdF9zcmlkKGdlb20pID0gNDMyNilcbiAgICApYCk7XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSBpbmRleCAke3RoaXMuI2xpbmVEdW1wU2NoZW1hfV8ke3RoaXMuI2xpbmVEdW1wVGFibGV9X3RtcF9nZW9tX2lkeCBvbiAke3RoaXMuI2xpbmVEdW1wfV90bXAgdXNpbmcgZ2lzdCAoZ2VvbSlgKTtcbiAgfVxuXG5cbiAgYXN5bmMgZHVtcExpbmVzVG9UbXBUYWJsZShwZywgaWQsIHR5cGUsIGNhdGVnb3J5KSB7XG4gICAgY29uc3QgZnJvbVRhYmxlID0gJ2JvdW5kYXJ5LmxpbmUnO1xuICAgIGNvbnN0IHRvVGFibGUgPSBgJHt0aGlzLiNsaW5lRHVtcH1fdG1wYDtcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0b1RhYmxlfSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHtmcm9tVGFibGV9XG4gICAgICAgIHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM1xuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCBTVF9NYWtlVmFsaWQoXG4gICAgICAgICAgU1RfTm9kZShcbiAgICAgICAgICAgIFNUX0xpbmVNZXJnZShcbiAgICAgICAgICAgICAgU1RfUmVtb3ZlUmVwZWF0ZWRQb2ludHMoXG4gICAgICAgICAgICAgICAgZ2VvbVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApIGFzIGdlb20gZnJvbSB0YVxuICAgICAgKVxuICAgICAgLCB0YyBhcyAoXG4gICAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGJcbiAgICAgIClcbiAgICAgICwgdGQgYXMgKFxuICAgICAgICBzZWxlY3QgIChyb3dfbnVtYmVyKCkgb3ZlcigpKTo6aW50ZWdlciBhcyBwYXRoLCBnZW9tLCBTVF9OUG9pbnRzKGdlb20pIGFzIHBvaW50cyBmcm9tIHRjIG9yZGVyIGJ5IHBvaW50cyBkZXNjXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke3RvVGFibGV9ICh0YXJnZXRfaWQsIHBhdGgsIHR5cGUsIGNhdGVnb3J5LCBnZW9tLCBwb2ludHMsIGxlbmd0aCkgXG4gICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyB0YXJnZXRfaWQsIHBhdGgsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCBnZW9tLCBcbiAgICAgIHBvaW50cywgc3RfbGVuZ3RoKGdlb20pIGFzIGxlbmd0aCBmcm9tIHRkIG9yZGVyIGJ5IHBhdGggYXNjYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcbiAgfVxuXG5cbiAgYXN5bmMgZHVtcExpbmVzKHBnLCBpZCwgdHlwZSwgY2F0ZWdvcnksIHZlcnRpY2VzTnVtKSB7XG4gICAgY29uc3QgcmVhbFZlcnRpY2VzTnVtID0gdmVydGljZXNOdW0gLSAxO1xuICAgIGF3YWl0IHRoaXMuZHVtcExpbmVzVG9UbXBUYWJsZShwZywgaWQsIHR5cGUsIGNhdGVnb3J5KTtcbiAgICBjb25zdCB0b1RhYmxlID0gYCR7dGhpcy4jbGluZUR1bXB9YDtcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0b1RhYmxlfSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pO1xuXG4gICAgbGV0IHBhdGggPSAwO1xuICAgIGxldCBjb3VudDtcbiAgICBjb25zdCBsaW1pdCA9IDEwMDA7XG4gICAgZG8ge1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAgIC5xdWVyeShcbiAgICAgICAgICBgc2VsZWN0IGlkLCBwYXRoIGZyb20gJHt0aGlzLiNsaW5lRHVtcH1fdG1wIHdoZXJlIHRhcmdldF9pZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDMgYW5kIHBhdGggPiAkNCBvcmRlciBieSBwYXRoIGFzYyBsaW1pdCAkNWAsXG4gICAgICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeSwgcGF0aCwgbGltaXRdXG4gICAgICAgIClcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBjb3VudCA9IHJvd3MubGVuZ3RoO1xuICAgICAgbGV0IG5leHRQYXRoID0gMDtcbiAgICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgY29uc3QgdG1wSWQgPSArcm93WydpZCddO1xuICAgICAgICBuZXh0UGF0aCA9ICtyb3dbJ3BhdGgnXTtcbiAgICAgICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgICAgIHRhIGFzIChcbiAgICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGhpcy4jbGluZUR1bXB9X3RtcCB3aGVyZSBpZCA9ICQ0XG4gICAgICAgIClcbiAgICAgICAgLCB0YiBhcyAoXG4gICAgICAgICAgc2VsZWN0IFNUX1BvaW50TihnZW9tLCBcbiAgICAgICAgICAgICgoZ2VuZXJhdGVfc2VyaWVzKDEsIFNUX05Qb2ludHMoZ2VvbSkgLyAke3JlYWxWZXJ0aWNlc051bX0gKyAxKSAtIDEpICogJHtyZWFsVmVydGljZXNOdW19ICsgMSkpIGFzIGdlb20gXG4gICAgICAgICAgZnJvbSB0YVxuICAgICAgICApXG4gICAgICAgICwgdGMgYXMgKFxuICAgICAgICAgIHNlbGVjdCBTVF9Db2xsZWN0KGdlb20pIGFzIGdlb20gZnJvbSB0YlxuICAgICAgICApXG4gICAgICAgICwgdGQgYXMgKFxuICAgICAgICAgIHNlbGVjdCBTVF9TcGxpdCh0YS5nZW9tLCB0Yy5nZW9tKSBhcyBnZW9tIGZyb20gdGEsIHRjXG4gICAgICAgIClcbiAgICAgICAgLCB0ZSBhcyAoXG4gICAgICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSB0ZFxuICAgICAgICApXG4gICAgICAgICwgdGYgYXMgKFxuICAgICAgICAgIHNlbGVjdCAke25leHRQYXRofTo6aW50ZWdlciBhcyBwYXRoLCBnZW9tLCBTVF9OUG9pbnRzKGdlb20pIGFzIHBvaW50cyBmcm9tIHRlIG9yZGVyIGJ5IHBvaW50cyBkZXNjXG4gICAgICAgIClcbiAgICAgICAgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSAodGFyZ2V0X2lkLCBwYXRoLCB0eXBlLCBjYXRlZ29yeSwgZ2VvbSwgcG9pbnRzLCBsZW5ndGgpIFxuICAgICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyB0YXJnZXRfaWQsIHBhdGgsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCBnZW9tLCBcbiAgICAgICAgcG9pbnRzLCBzdF9sZW5ndGgoZ2VvbSkgYXMgbGVuZ3RoIGZyb20gdGYgb3JkZXIgYnkgcGF0aCBhc2NgO1xuICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZCwgdHlwZSwgY2F0ZWdvcnksIHRtcElkXSk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgZHVtcCBmcm9tIHRtcCBkdW1wIHRhYmxlICR7aWR9fCR7dHlwZX18JHtjYXRlZ29yeX0gIyR7cGF0aH0gLSAjJHtuZXh0UGF0aH1gKTtcbiAgICAgIHBhdGggPSBuZXh0UGF0aDtcbiAgICB9IHdoaWxlIChjb3VudCA+IDApO1xuICB9XG5cblxuICBhc3luYyBkdW1wTGluZXNPbGQocGcsIGlkLCB0eXBlLCBjYXRlZ29yeSkge1xuICAgIGNvbnN0IGZyb21UYWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCB0b1RhYmxlID0gYCR7dGhpcy4jbGluZUR1bXB9YDtcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0b1RhYmxlfSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHtmcm9tVGFibGV9XG4gICAgICAgIHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM1xuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCBTVF9NYWtlVmFsaWQoXG4gICAgICAgICAgU1RfTm9kZShcbiAgICAgICAgICAgIFNUX0xpbmVNZXJnZShcbiAgICAgICAgICAgICAgU1RfUmVtb3ZlUmVwZWF0ZWRQb2ludHMoXG4gICAgICAgICAgICAgICAgZ2VvbVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApIGFzIGdlb20gZnJvbSB0YVxuICAgICAgKVxuICAgICAgLCB0YyBhcyAoXG4gICAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGJcbiAgICAgIClcbiAgICAgICwgdGQgYXMgKFxuICAgICAgICBzZWxlY3QgU1RfU3ViZGl2aWRlKGdlb20sIDQwOTYpIGFzIGdlb20gZnJvbSB0Y1xuICAgICAgKVxuICAgICAgLCB0ZSBhcyAoXG4gICAgICAgIHNlbGVjdCAgKHJvd19udW1iZXIoKSBvdmVyKCkpOjppbnRlZ2VyIGFzIHBhdGgsIGdlb20gZnJvbSB0ZFxuICAgICAgKVxuICAgICAgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSAodGFyZ2V0X2lkLCBwYXRoLCB0eXBlLCBjYXRlZ29yeSwgZ2VvbSwgcG9pbnRzLCBsZW5ndGgpIFxuICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgdGFyZ2V0X2lkLCBwYXRoLCAkMjo6dmFyY2hhciBhcyB0eXBlLCAkMzo6dmFyY2hhciBhcyBjYXRlZ29yeSwgZ2VvbSwgXG4gICAgICBTVF9OUG9pbnRzKGdlb20pIGFzIHBvaW50cywgc3RfbGVuZ3RoKGdlb20pIGFzIGxlbmd0aCBmcm9tIHRlIG9yZGVyIGJ5IHBhdGggYXNjYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcbiAgfVxuXG5cbiAgYXN5bmMgaW5pdFRvcG9UYWJsZShwZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgZHJvcCB0YWJsZSAke3RoaXMuI2xpbmVUb3BvfSBjYXNjYWRlYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIHRhYmxlIGlmIG5vdCBleGlzdHMgJHt0aGlzLiNsaW5lVG9wb31cbiAgICAoXG4gICAgICAgIGlkIGJpZ3NlcmlhbCBwcmltYXJ5IGtleSxcbiAgICAgICAgZ2VvbSBnZW9tZXRyeSxcbiAgICAgICAgY29uc3RyYWludCBlbmZvcmNlX3NyaWRfZ2VvbSBjaGVjayAoc3Rfc3JpZChnZW9tKSA9IDQzMjYpXG4gICAgKWApO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgaW5kZXggJHt0aGlzLiNsaW5lVG9wb1NjaGVtYX1fJHt0aGlzLiNsaW5lVG9wb1RhYmxlfV9nZW9tX2lkeCBvbiAke3RoaXMuI2xpbmVUb3BvfSB1c2luZyBnaXN0IChnZW9tKWApO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBkcm9wIHRhYmxlICR7dGhpcy4jbGluZVRvcG99X3RtcCBjYXNjYWRlYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIHRhYmxlIGlmIG5vdCBleGlzdHMgJHt0aGlzLiNsaW5lVG9wb31fdG1wXG4gICAgKFxuICAgICAgICBpZCBiaWdzZXJpYWwgcHJpbWFyeSBrZXksXG4gICAgICAgIGdlb20gZ2VvbWV0cnksXG4gICAgICAgIGNvbnN0cmFpbnQgZW5mb3JjZV9zcmlkX2dlb20gY2hlY2sgKHN0X3NyaWQoZ2VvbSkgPSA0MzI2KVxuICAgIClgKTtcbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIGluZGV4ICR7dGhpcy4jbGluZVRvcG9TY2hlbWF9XyR7dGhpcy4jbGluZVRvcG9UYWJsZX1fdG1wX2dlb21faWR4IG9uICR7dGhpcy4jbGluZVRvcG99X3RtcCB1c2luZyBnaXN0IChnZW9tKWApO1xuICB9XG5cblxuICBhc3luYyBjYWxjRWRnZXMocGcsIG1heFZlcnRpY2VzTnVtKSB7XG4gICAgbGV0IHN0YXJ0SWQgPSAwO1xuICAgIGxldCBjb3VudDtcbiAgICBjb25zdCBsaW1pdCAgPSAxMDA7XG4gICAgZG8ge1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAgIC5xdWVyeShgc2VsZWN0IGlkLCB0YXJnZXRfaWQsIHBhdGgsIHR5cGUsIGNhdGVnb3J5IGZyb20gJHt0aGlzLiNsaW5lRHVtcH0gd2hlcmUgaWQgPiAkMSBvcmRlciBieSBpZCBhc2MgbGltaXQgJDJgLCBbc3RhcnRJZCwgbGltaXRdKVxuICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgfSlcbiAgICAgIDtcbiAgICAgIGNvdW50ID0gcm93cy5sZW5ndGg7XG4gICAgICBsZXQgbmV4dElkID0gMDtcbiAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICBjb25zdCBpZCA9ICtyb3dbJ2lkJ107XG4gICAgICAgIG5leHRJZCA9IGlkO1xuICAgICAgICBhd2FpdCBVdGlscy5jYWxsKGDorqHnrpfovrkgJHtpZH18JHtyb3dbJ3RhcmdldF9pZCddfXwke3Jvd1sncGF0aCddfSBbJHtyb3dbJ3R5cGUnXX18JHtyb3dbJ2NhdGVnb3J5J119XWAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGF0LmNhbGNFZGdlKHBnLCBpZCwgbWF4VmVydGljZXNOdW0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGAjJHtzdGFydElkfSAtICMke25leHRJZH1gKTtcbiAgICAgIHN0YXJ0SWQgPSBuZXh0SWQ7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2FsY1RvcG8yRHVtcChwZykge1xuICAgIGxldCBzdGFydElkID0gMDtcbiAgICBsZXQgY291bnQ7XG4gICAgY29uc3QgbGltaXQgID0gMTAwO1xuICAgIGxldCBpID0gMDtcbiAgICBkbyB7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgICAgLnF1ZXJ5KGBzZWxlY3QgaWQgZnJvbSAke3RoaXMuI2xpbmVUb3BvfSB3aGVyZSBpZCA+ICQxIG9yZGVyIGJ5IGlkIGFzYyBsaW1pdCAkMmAsIFtzdGFydElkLCBsaW1pdF0pXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgICAgY291bnQgPSByb3dzLmxlbmd0aDtcbiAgICAgIGxldCBuZXh0SWQgPSAwO1xuICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgIGNvbnN0IGlkID0gK3Jvd1snaWQnXTtcbiAgICAgICAgbmV4dElkID0gaWQ7XG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChg5YWz6IGUICR7dGhpcy4jbGluZVRvcG99IOi+uSAke2l9IyR7aWR9IOeahCBkdW1wIOWFs+ezu2AsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBsZXQgaWRzO1xuICAgICAgICAgIGxldCBkdW1wSWRzO1xuICAgICAgICAgIGNvbnN0IHNxbDEgPSBgd2l0aCBcbiAgICAgICAgICB0YSBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGhhdC4jbGluZVRvcG99IHdoZXJlIGlkID0gJDFcbiAgICAgICAgICApXG4gICAgICAgICAgLCB0YiBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgdC5pZCBhcyBpZCwgU1RfSW50ZXJzZWN0aW9uKFxuICAgICAgICAgICAgICB0Lmdlb20sIFxuICAgICAgICAgICAgICB0YS5nZW9tXG4gICAgICAgICAgICApIGFzIGdlb20gZnJvbSAke3RoYXQuI2xpbmVEdW1wfSBhcyB0LCB0YSBcbiAgICAgICAgICAgIHdoZXJlICh0Lmdlb20gJiYgdGEuZ2VvbSkgXG4gICAgICAgICAgICBhbmQgU1RfSW50ZXJzZWN0cyh0Lmdlb20sIHRhLmdlb20pXG4gICAgICAgICAgKVxuICAgICAgICAgICwgdGMgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGlkIGZyb20gdGIgXG4gICAgICAgICAgICB3aGVyZSBTVF9HZW9tZXRyeVR5cGUoZ2VvbSkgbm90IGluICgnU1RfUG9pbnQnLCAnU1RfTXVsdGlQb2ludCcpXG4gICAgICAgICAgKVxuICAgICAgICAgIHNlbGVjdCBkaXN0aW5jdCBpZCBmcm9tIHRjYDtcbiAgICAgICAgICBjb25zdCByb3dzMSA9IGF3YWl0IHBnXG4gICAgICAgICAgICAucXVlcnkoc3FsMSwgW2lkXSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgO1xuICAgICAgICAgIGlkcyA9IHJvd3MxLm1hcChpdGVtID0+ICtpdGVtWydpZCddKTtcbiAgICAgICAgICBkdW1wSWRzID0gTG9kYXNoLnVuaXEoaWRzKTtcbiAgICAgICAgICBpZiAoZHVtcElkcyA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3Qgc3FsMiA9IGB3aXRoIFxuICAgICAgICAgICAgdGEgYXMgKFxuICAgICAgICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGhhdC4jbGluZVRvcG99IHdoZXJlIGlkID0gJDFcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgICwgdGIgYXMgKFxuICAgICAgICAgICAgICBzZWxlY3QgdC5pZCBhcyBpZCwgU1RfSW50ZXJzZWN0aW9uKFxuICAgICAgICAgICAgICAgIHQuZ2VvbSwgXG4gICAgICAgICAgICAgICAgdGEuZ2VvbVxuICAgICAgICAgICAgICApIGFzIGdlb20gZnJvbSAke3RoYXQuI2xpbmVEdW1wfSBhcyB0LCB0YSBcbiAgICAgICAgICAgICAgd2hlcmUgKHQuZ2VvbSAmJiB0YS5nZW9tKSBcbiAgICAgICAgICAgICAgYW5kIFNUX0ludGVyc2VjdHModC5nZW9tLCB0YS5nZW9tKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLCB0YyBhcyAoXG4gICAgICAgICAgICAgIHNlbGVjdCBpZCBmcm9tIHRiIFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgc2VsZWN0IGRpc3RpbmN0IGlkIGZyb20gdGNgO1xuICAgICAgICAgICAgY29uc3Qgcm93czIgPSBhd2FpdCBwZ1xuICAgICAgICAgICAgICAucXVlcnkoc3FsMiwgW2lkXSlcbiAgICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICA7XG4gICAgICAgICAgICBpZHMgPSByb3dzMi5tYXAoaXRlbSA9PiAraXRlbVsnaWQnXSk7XG4gICAgICAgICAgICBkdW1wSWRzID0gTG9kYXNoLnVuaXEoaWRzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc29sZS5sb2coZHVtcElkcyk7XG4gICAgICAgICAgaWYgKGR1bXBJZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3Qgc3FsMiA9IGBpbnNlcnQgaW50byAke3RoYXQuI2xpbmVUb3BvfSAoaWQsIGR1bXBfaWRzKSBcbiAgICAgICAgICAgIHZhbHVlcyAoJDE6OmJpZ2ludCwgJDI6OmJpZ2ludFtdKSBcbiAgICAgICAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBkdW1wX2lkcyA9IGV4Y2x1ZGVkLmR1bXBfaWRzYDtcbiAgICAgICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbDIsIFtpZCwgYHske2R1bXBJZHMuam9pbignLCcpfX1gXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgdG9wbyBlZGdlIyR7aWR9IGRvc2Ugbm90IG1hdGggYW55IGR1bXAgbGluZXNgKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGB0b3BvIGVkZ2UjJHtpZH0gZG9zZSBub3QgbWF0aCBhbnkgZHVtcCBsaW5lc2ApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgIyR7c3RhcnRJZH0gLSAjJHtuZXh0SWR9YCk7XG4gICAgICBzdGFydElkID0gbmV4dElkO1xuICAgIH0gd2hpbGUgKGNvdW50ID4gMCk7XG4gIH1cblxuXG4gIGFzeW5jIGNhbGNEdW1wMlRvcG8ocGcpIHtcbiAgICBsZXQgc3RhcnRJZCA9IDA7XG4gICAgbGV0IGNvdW50O1xuICAgIGNvbnN0IGxpbWl0ICA9IDEwMDtcbiAgICBsZXQgaSA9IDA7XG5cbiAgICBkbyB7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgICAgLnF1ZXJ5KGBzZWxlY3QgaWQsIHRhcmdldF9pZCwgcGF0aCwgdHlwZSwgY2F0ZWdvcnkgZnJvbSAke3RoaXMuI2xpbmVEdW1wfSB3aGVyZSBpZCA+ICQxIG9yZGVyIGJ5IGlkIGFzYyBsaW1pdCAkMmAsIFtzdGFydElkLCBsaW1pdF0pXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgICAgY291bnQgPSByb3dzLmxlbmd0aDtcbiAgICAgIGxldCBuZXh0SWQgPSAwO1xuICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgIGNvbnN0IGlkID0gK3Jvd1snaWQnXTtcbiAgICAgICAgbmV4dElkID0gaWQ7XG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChg5YWz6IGUICR7dGhpcy4jbGluZUR1bXB9IOi+uSAke2l9IyR7aWR9fCR7cm93Wyd0YXJnZXRfaWQnXX18JHtyb3dbJ3BhdGgnXX0gWyR7cm93Wyd0eXBlJ119fCR7cm93WydjYXRlZ29yeSddfV0g55qE5ouT5omR5YWz57O7YCwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGxldCBpZHM7XG4gICAgICAgICAgbGV0IHRvcG9JZHM7XG4gICAgICAgICAgY29uc3Qgc3FsMSA9IGB3aXRoIFxuICAgICAgICAgIHRhIGFzIChcbiAgICAgICAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0aGF0LiNsaW5lRHVtcH0gd2hlcmUgaWQgPSAkMVxuICAgICAgICAgIClcbiAgICAgICAgICAsIHRiIGFzIChcbiAgICAgICAgICAgIHNlbGVjdCB0LmlkIGFzIGlkLCBTVF9JbnRlcnNlY3Rpb24oXG4gICAgICAgICAgICAgIHQuZ2VvbSxcbiAgICAgICAgICAgICAgdGEuZ2VvbVxuICAgICAgICAgICAgKSBhcyBnZW9tIGZyb20gJHt0aGF0LiNsaW5lVG9wb30gYXMgdCwgdGEgXG4gICAgICAgICAgICB3aGVyZSAodC5nZW9tICYmIHRhLmdlb20pIGFuZCBTVF9JbnRlcnNlY3RzKHQuZ2VvbSwgdGEuZ2VvbSlcbiAgICAgICAgICApXG4gICAgICAgICAgLCB0YyBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgaWQgZnJvbSB0YiBcbiAgICAgICAgICAgIHdoZXJlIFNUX0dlb21ldHJ5VHlwZShnZW9tKSBub3QgaW4gKCdTVF9Qb2ludCcsICdTVF9NdWx0aVBvaW50JylcbiAgICAgICAgICApXG4gICAgICAgICAgc2VsZWN0IGRpc3RpbmN0IGlkIGZyb20gdGNgO1xuICAgICAgICAgIGNvbnN0IHJvd3MxID0gYXdhaXQgcGdcbiAgICAgICAgICAgIC5xdWVyeShzcWwxLCBbaWRdKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICA7XG4gICAgICAgICAgaWRzID0gcm93czEubWFwKGl0ZW0gPT4gK2l0ZW1bJ2lkJ10pO1xuICAgICAgICAgIHRvcG9JZHMgPSBMb2Rhc2gudW5pcShpZHMpO1xuICAgICAgICAgIGlmICh0b3BvSWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3Qgc3FsMiA9IGB3aXRoIFxuICAgICAgICAgICAgdGEgYXMgKFxuICAgICAgICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGhhdC4jbGluZUR1bXB9IHdoZXJlIGlkID0gJDFcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgICwgdGIgYXMgKFxuICAgICAgICAgICAgICBzZWxlY3QgdC5pZCBhcyBpZCwgU1RfSW50ZXJzZWN0aW9uKFxuICAgICAgICAgICAgICAgIHQuZ2VvbSxcbiAgICAgICAgICAgICAgICB0YS5nZW9tXG4gICAgICAgICAgICAgICkgYXMgZ2VvbSBmcm9tICR7dGhhdC4jbGluZVRvcG99IGFzIHQsIHRhIFxuICAgICAgICAgICAgICB3aGVyZSAodC5nZW9tICYmIHRhLmdlb20pIGFuZCBTVF9JbnRlcnNlY3RzKHQuZ2VvbSwgdGEuZ2VvbSlcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgICwgdGMgYXMgKFxuICAgICAgICAgICAgICBzZWxlY3QgaWQgZnJvbSB0YiBcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIHNlbGVjdCBkaXN0aW5jdCBpZCBmcm9tIHRjYDtcbiAgICAgICAgICAgIGNvbnN0IHJvd3MyID0gYXdhaXQgcGdcbiAgICAgICAgICAgICAgLnF1ZXJ5KHNxbDIsIFtpZF0pXG4gICAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgO1xuICAgICAgICAgICAgaWRzID0gcm93czIubWFwKGl0ZW0gPT4gK2l0ZW1bJ2lkJ10pO1xuICAgICAgICAgICAgdG9wb0lkcyA9IExvZGFzaC51bmlxKGlkcyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUubG9nKHRvcG9JZHMpO1xuICAgICAgICAgIGlmICh0b3BvSWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHNxbDIgPSBgaW5zZXJ0IGludG8gJHt0aGF0LiNsaW5lRHVtcH0gKGlkLCB0b3BvX2lkcykgXG4gICAgICAgICAgICB2YWx1ZXMgKCQxOjpiaWdpbnQsICQyOjpiaWdpbnRbXSkgXG4gICAgICAgICAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgdG9wb19pZHMgPSBleGNsdWRlZC50b3BvX2lkc2A7XG4gICAgICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwyLCBbaWQsIGB7JHt0b3BvSWRzLmpvaW4oJywnKX19YF0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgJHt0aGlzLiNsaW5lRHVtcH0g6L65ICR7aX0jJHtpZH18JHtyb3dbJ3RhcmdldF9pZCddfXwke3Jvd1sncGF0aCddfSBbJHtyb3dbJ3R5cGUnXX18JHtyb3dbJ2NhdGVnb3J5J119XSDml6Dmi5PmiZHlhbPns7tgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coYCMke3N0YXJ0SWR9IC0gIyR7bmV4dElkfWApO1xuICAgICAgc3RhcnRJZCA9IG5leHRJZDtcbiAgICB9IHdoaWxlIChjb3VudCA+IDApO1xuICB9XG5cblxuICBhc3luYyBjaGVja0VkZ2VzKHBnLCBtYXhWZXJ0aWNlc051bSkge1xuICAgIGxldCBzdGFydElkID0gMSAtIDE7XG4gICAgbGV0IGNvdW50O1xuICAgIGNvbnN0IGxpbWl0ICA9IDEwMDtcbiAgICBsZXQgaSA9IDA7XG4gICAgZG8ge1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAgIC5xdWVyeShgc2VsZWN0IGlkIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gd2hlcmUgaWQgPiAkMSBvcmRlciBieSBpZCBhc2MgbGltaXQgJDJgLCBbc3RhcnRJZCwgbGltaXRdKVxuICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgfSlcbiAgICAgIDtcbiAgICAgIGNvdW50ID0gcm93cy5sZW5ndGg7XG4gICAgICBsZXQgbmV4dElkID0gMDtcbiAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICBjb25zdCBpZCA9ICtyb3dbJ2lkJ107XG4gICAgICAgIG5leHRJZCA9IGlkO1xuICAgICAgICBpICs9IDE7XG4gICAgICAgIGF3YWl0IFV0aWxzLmNhbGwoYOajgOafpSAke3RoaXMuI2xpbmVUb3BvfSDovrkgJHtpfSMke2lkfWAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICAgICAgICB0YSBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGhhdC4jbGluZVRvcG99IHdoZXJlIGlkID0gJDFcbiAgICAgICAgICApXG4gICAgICAgICAgLCB0YiBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgdC5pZCBhcyBpZCwgU1RfSW50ZXJzZWN0aW9uKHQuZ2VvbSwgdGEuZ2VvbSkgYXMgZ2VvbSBmcm9tICR7dGhhdC4jbGluZVRvcG99IGFzIHQsIHRhIFxuICAgICAgICAgICAgd2hlcmUgdC5pZCA+ICQxIGFuZCAodC5nZW9tICYmIHRhLmdlb20gYW5kIFNUX0ludGVyc2VjdHModC5nZW9tLCB0YS5nZW9tKSlcbiAgICAgICAgICApXG4gICAgICAgICAgc2VsZWN0IGlkIGZyb20gdGIgd2hlcmUgU1RfR2VvbWV0cnlUeXBlKGdlb20pIG5vdCBpbiAoJ1NUX1BvaW50JywgJ1NUX011bHRpUG9pbnQnKSBhbmQgU1RfTlBvaW50cyhnZW9tKSA+IDBgO1xuICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkXSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgO1xuICAgICAgICAgIGNvbnN0IGl0ZW1zID0gcmVzLm1hcChpdGVtID0+ICtpdGVtWydpZCddKTtcbiAgICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGVkZ2UgIyR7aWR9IGludGVyc2VjdHMgd2l0aCBlZGdlc2AsIGl0ZW1zKTtcbiAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgZWRnZSAjJHtpZH0gaW50ZXJzZWN0cyB3aXRoIGVkZ2VzOiBbJHtpdGVtcy5qb2luKCcsJyl9XWApO1xuICAgICAgICAgICAgY29uc3Qgbm90RXF1YWxzID0gW107XG4gICAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IHRoZUlkIG9mIGl0ZW1zKSB7XG4gICAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuaYr+ebuOetieeahO+8jOWmguaenOaYr+ebuOetieeahO+8jOWwseWPr+S7peWIoOaOiVxuICAgICAgICAgICAgICBjb25zdCBzcWwgPSBgd2l0aFxuICAgICAgICAgICAgICB0YSBhcyAoXG4gICAgICAgICAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoYXQuI2xpbmVUb3BvfSB3aGVyZSBpZCA9ICQxXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgLCB0YiBhcyAoXG4gICAgICAgICAgICAgICAgc2VsZWN0IGlkLCBnZW9tIGZyb20gJHt0aGF0LiNsaW5lVG9wb30gd2hlcmUgaWQgPSAkMlxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIHNlbGVjdCB0Yi5pZCBhcyBpZCBmcm9tIHRhLCB0YiB3aGVyZSBTVF9FcXVhbHModGEuZ2VvbSwgdGIuZ2VvbSlgO1xuICAgICAgICAgICAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgICAgICAgICAgICAucXVlcnkoc3FsLCBbaWQsIHRoZUlkXSlcbiAgICAgICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgaWYgKHJvd3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIOebuOetieeahCDlj6/ku6XliKDpmaRcbiAgICAgICAgICAgICAgICBhd2FpdCBwZy5xdWVyeShgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PiBkZWxldGUgZnJvbSAke3RoYXQuI2xpbmVUb3BvfSB3aGVyZSBpZCA9ICQxYCwgW3RoZUlkXSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYGRlbGV0ZSBkdXBsaWNhdGUgZWRnZSMke3RoZUlkfWApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vdEVxdWFscy5wdXNoKHRoZUlkKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vdEVxdWFscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0+IGVkZ2UgIyR7aWR9IGludGVyc2VjdHMgd2l0aCBub3QgZXF1YWwgZWRnZXM6YCwgbm90RXF1YWxzKTtcbiAgICAgICAgICAgICAgYXdhaXQgdGhhdC5maXhFZGdlQ2FsYyhwZywgaWQsIG5vdEVxdWFscywgbWF4VmVydGljZXNOdW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgIyR7c3RhcnRJZH0gLSAjJHtuZXh0SWR9YCk7XG4gICAgICBzdGFydElkID0gbmV4dElkO1xuICAgIH0gd2hpbGUgKGNvdW50ID4gMCk7XG4gIH1cblxuXG4gIGFzeW5jIGZpeEVkZ2VDYWxjKHBnLCBpZCwgdGhlSWRzLCBtYXhWZXJ0aWNlc051bSkge1xuICAgIC8vIOa4heepunRtcOihqFxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSAke3RoaXMuI2xpbmVUb3BvfV90bXBgKTtcbiAgICAvLyDku450b3Bv5Y+W5Ye65p2l5YaZ5YWldG9wb1xuICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgIHRhIGFzIChcbiAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gd2hlcmUgaWQgPSAkMVxuICAgIClcbiAgICAsIHRiIGFzIChcbiAgICAgIHNlbGVjdCBTVF9VbmlvbihnZW9tKSBhcyBnZW9tIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gd2hlcmUgaWQgaW4gKCR7dGhlSWRzLmpvaW4oJywnKX0pXG4gICAgKVxuICAgICwgdGMgYXMgKFxuICAgICAgc2VsZWN0IFNUX0ludGVyc2VjdGlvbih0YS5nZW9tLCB0Yi5nZW9tKSBhcyBnZW9tIGZyb20gdGEsIHRiXG4gICAgKVxuICAgICwgdGQgYXMgKFxuICAgICAgc2VsZWN0IFNUX1VuaW9uKHRhLmdlb20sIHRiLmdlb20pIGFzIGdlb20gZnJvbSB0YSwgdGJcbiAgICApXG4gICAgLCB0ZSBhcyAoXG5cdCAgICBzZWxlY3QgU1RfU3ltRGlmZmVyZW5jZSh0ZC5nZW9tLCB0Yy5nZW9tKSBhcyBnZW9tIGZyb20gdGQsIHRjXG4gICAgKVxuICAgICwgdGYgYXMgKFxuICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSB0YyBcbiAgICAgIHdoZXJlIGdlb20gaXMgbm90IG51bGwgYW5kIFNUX0lzRW1wdHkoZ2VvbSkgPSBmYWxzZVxuICAgICAgdW5pb24gYWxsIFxuICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSB0ZSBcbiAgICAgIHdoZXJlIGdlb20gaXMgbm90IG51bGwgYW5kIFNUX0lzRW1wdHkoZ2VvbSkgPSBmYWxzZSBcbiAgICApXG4gICAgLCB0ZyBhcyAoXG4gICAgICBzZWxlY3QgXG4gICAgICBTVF9NYWtlVmFsaWQoXG4gICAgICAgIFNUX05vZGUoXG4gICAgICAgICAgU1RfTGluZU1lcmdlKFxuICAgICAgICAgICAgU1RfUmVtb3ZlUmVwZWF0ZWRQb2ludHMoXG4gICAgICAgICAgICAgIFNUX1VuaW9uKGdlb20pXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApIFxuICAgICAgYXMgZ2VvbSBmcm9tIHRmIFxuICAgICAgd2hlcmUgU1RfR2VvbWV0cnlUeXBlKGdlb20pIG5vdCBpbiAoJ1NUX1BvaW50JywgJ1NUX011bHRpUG9pbnQnKVxuICAgIClcbiAgICAsIHRoIGFzIChcbiAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGdcbiAgICApXG4gICAgaW5zZXJ0IGludG8gJHt0aGlzLiNsaW5lVG9wb31fdG1wIChnZW9tKSBcbiAgICBzZWxlY3QgZ2VvbSBmcm9tIHRoYDtcbiAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZF0pO1xuXG4gICAgY29uc3QgcmVhbFZlcnRpY2VzTnVtID0gbWF4VmVydGljZXNOdW0gLSAxO1xuICAgIGNvbnN0IHJvd3MyID0gYXdhaXQgcGdcbiAgICAgIC5xdWVyeShgc2VsZWN0IGlkIGZyb20gJHt0aGlzLiNsaW5lVG9wb31fdG1wYClcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgIH0pXG4gICAgO1xuICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJvd3MyKSB7XG4gICAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICAgIHRhIGFzIChcbiAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoaXMuI2xpbmVUb3BvfV90bXAgd2hlcmUgaWQgPSAkMVxuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCBTVF9Qb2ludE4oZ2VvbSwgXG4gICAgICAgICAgKChnZW5lcmF0ZV9zZXJpZXMoMSwgU1RfTlBvaW50cyhnZW9tKSAvICR7cmVhbFZlcnRpY2VzTnVtfSArIDEpIC0gMSkgKiAke3JlYWxWZXJ0aWNlc051bX0gKyAxKSkgYXMgZ2VvbSBcbiAgICAgICAgZnJvbSB0YVxuICAgICAgKVxuICAgICAgLCB0YyBhcyAoXG4gICAgICAgIHNlbGVjdCBTVF9Db2xsZWN0KGdlb20pIGFzIGdlb20gZnJvbSB0YlxuICAgICAgKVxuICAgICAgLCB0ZCBhcyAoXG4gICAgICAgIHNlbGVjdCBTVF9TcGxpdCh0YS5nZW9tLCB0Yy5nZW9tKSBhcyBnZW9tIGZyb20gdGEsIHRjXG4gICAgICApXG4gICAgICAsIHRlIGFzIChcbiAgICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSB0ZFxuICAgICAgKVxuICAgICAgaW5zZXJ0IGludG8gJHt0aGlzLiNsaW5lVG9wb30gKGdlb20pIFxuICAgICAgc2VsZWN0IGdlb20gZnJvbSB0ZWA7XG4gICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFsrcm93WydpZCddXSk7XG4gICAgfVxuICAgIC8vIOWIoOmZpOWOn+acieeahFxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSAke3RoaXMuI2xpbmVUb3BvfSB3aGVyZSBpZCBpbiAoJHtbaWQsIC4uLnRoZUlkc10uam9pbignLCAnKX0pYCk7XG4gICAgY29uc29sZS5sb2coYD09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT4gcmUtY2FsYyBpbnRlcnNlY3RzIGVkZ2VzOmAsIFtpZCwgLi4udGhlSWRzXSk7XG4gIH1cblxuICBhc3luYyBjYWxjRWRnZShwZywgaWQsIG1heFZlcnRpY2VzTnVtKSB7XG4gICAgY29uc3QgcmVhbFZlcnRpY2VzTnVtID0gbWF4VmVydGljZXNOdW0gLSAxO1xuICAgIC8vIOS7jmR1bXDlj5blh7rmnaXlhpnlhaV0b3BvXG4gICAgY29uc3Qgc3FsMSA9IGB3aXRoIFxuICAgIHRhIGFzIChcbiAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0aGlzLiNsaW5lRHVtcH0gd2hlcmUgaWQgPSAkMVxuICAgIClcbiAgICBzZWxlY3QgdC5pZCBhcyBpZCBmcm9tICR7dGhpcy4jbGluZVRvcG99IGFzIHQsIHRhIFxuICAgIHdoZXJlICh0Lmdlb20gJiYgdGEuZ2VvbSkgYW5kIFNUX0ludGVyc2VjdHModC5nZW9tLCB0YS5nZW9tKSBcbiAgICBhbmQgU1RfTlBvaW50cyhTVF9JbnRlcnNlY3Rpb24odC5nZW9tLCB0YS5nZW9tKSkgPiAwYDtcbiAgICBjb25zdCByb3dzMSA9IGF3YWl0IHBnXG4gICAgICAucXVlcnkoc3FsMSwgW2lkXSlcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgIH0pXG4gICAgO1xuICAgIGNvbnN0IGludGVyc2VjdElkcyA9IHJvd3MxLm1hcChyb3cgPT4gK3Jvd1snaWQnXSk7XG4gICAgY29uc29sZS5sb2coaW50ZXJzZWN0SWRzKTtcbiAgICBpZiAoaW50ZXJzZWN0SWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5sb2coYOaXoOS6pOmbhu+8jOebtOaOpeaPkuWFpWApO1xuICAgICAgcmV0dXJuIGF3YWl0IHBnXG4gICAgICAgIC5xdWVyeShgd2l0aCBcbiAgICAgICAgdGEgYXMgKFxuICAgICAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0aGlzLiNsaW5lRHVtcH0gd2hlcmUgaWQgPSAkMVxuICAgICAgICApXG4gICAgICAgIGluc2VydCBpbnRvICR7dGhpcy4jbGluZVRvcG99IChnZW9tKSBcbiAgICAgICAgc2VsZWN0IFxuICAgICAgICAgIFNUX01ha2VWYWxpZChcbiAgICAgICAgICAgIFNUX05vZGUoXG4gICAgICAgICAgICAgIFNUX0xpbmVNZXJnZShcbiAgICAgICAgICAgICAgICBTVF9SZW1vdmVSZXBlYXRlZFBvaW50cyhcbiAgICAgICAgICAgICAgICAgIGdlb21cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgICApIGFzIGdlb20gZnJvbSB0YSBcbiAgICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IGdlb20gPSBleGNsdWRlZC5nZW9tYCwgW2lkXSlcbiAgICAgIDtcbiAgICB9XG5cbiAgICAvLyDmuIXnqbp0bXDooahcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0aGlzLiNsaW5lVG9wb31fdG1wYCk7XG5cbiAgICBjb25zdCBzcWwyID0gYHdpdGggXG4gICAgdGEgYXMgKFxuICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoaXMuI2xpbmVEdW1wfSB3aGVyZSBpZCA9ICQxXG4gICAgKVxuICAgICwgdGIgYXMgKFxuICAgICAgc2VsZWN0IFNUX1VuaW9uKGdlb20pIGFzIGdlb20gZnJvbSAke3RoaXMuI2xpbmVUb3BvfSB3aGVyZSBpZCBpbiAoJHtpbnRlcnNlY3RJZHMuam9pbignLCAnKX0pXG4gICAgKSBcbiAgICAsIHRjIGFzIChcbiAgICAgIHNlbGVjdCBTVF9JbnRlcnNlY3Rpb24odGEuZ2VvbSwgdGIuZ2VvbSkgYXMgZ2VvbSBmcm9tIHRhLCB0YlxuICAgIClcbiAgICAsIHRkIGFzIChcbiAgICAgIHNlbGVjdCBTVF9Vbmlvbih0YS5nZW9tLCB0Yi5nZW9tKSBhcyBnZW9tIGZyb20gdGEsIHRiXG4gICAgKVxuICAgICwgdGUgYXMgKFxuXHQgICAgc2VsZWN0IFNUX1N5bURpZmZlcmVuY2UodGQuZ2VvbSwgdGMuZ2VvbSkgYXMgZ2VvbSBmcm9tIHRkLCB0Y1xuICAgIClcbiAgICAsIHRmIGFzIChcbiAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGMgXG4gICAgICB3aGVyZSBnZW9tIGlzIG5vdCBudWxsIGFuZCBTVF9Jc0VtcHR5KGdlb20pID0gZmFsc2VcbiAgICAgIHVuaW9uIGFsbCBcbiAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGUgXG4gICAgICB3aGVyZSBnZW9tIGlzIG5vdCBudWxsIGFuZCBTVF9Jc0VtcHR5KGdlb20pID0gZmFsc2UgXG4gICAgKVxuICAgICwgdGcgYXMgKFxuICAgICAgc2VsZWN0IFxuICAgICAgU1RfTWFrZVZhbGlkKFxuICAgICAgICBTVF9Ob2RlKFxuICAgICAgICAgIFNUX0xpbmVNZXJnZShcbiAgICAgICAgICAgIFNUX1JlbW92ZVJlcGVhdGVkUG9pbnRzKFxuICAgICAgICAgICAgICBTVF9VbmlvbihnZW9tKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKSBcbiAgICAgIGFzIGdlb20gZnJvbSB0ZiBcbiAgICAgIHdoZXJlIFNUX0dlb21ldHJ5VHlwZShnZW9tKSBub3QgaW4gKCdTVF9Qb2ludCcsICdTVF9NdWx0aVBvaW50JylcbiAgICApXG4gICAgLCB0aCBhcyAoXG4gICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tIHRnXG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7dGhpcy4jbGluZVRvcG99X3RtcCAoZ2VvbSkgXG4gICAgc2VsZWN0IGdlb20gZnJvbSB0aGA7XG4gICAgYXdhaXQgcGcucXVlcnkoc3FsMiwgW2lkXSk7XG5cbiAgICBjb25zdCByb3dzMiA9IGF3YWl0IHBnXG4gICAgICAucXVlcnkoYHNlbGVjdCBpZCBmcm9tICR7dGhpcy4jbGluZVRvcG99X3RtcGApXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICB9KVxuICAgIDtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzMikge1xuICAgICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0aGlzLiNsaW5lVG9wb31fdG1wIHdoZXJlIGlkID0gJDFcbiAgICAgIClcbiAgICAgICwgdGIgYXMgKFxuICAgICAgICBzZWxlY3QgU1RfUG9pbnROKGdlb20sIFxuICAgICAgICAgICgoZ2VuZXJhdGVfc2VyaWVzKDEsIFNUX05Qb2ludHMoZ2VvbSkgLyAke3JlYWxWZXJ0aWNlc051bX0gKyAxKSAtIDEpICogJHtyZWFsVmVydGljZXNOdW19ICsgMSkpIGFzIGdlb20gXG4gICAgICAgIGZyb20gdGFcbiAgICAgIClcbiAgICAgICwgdGMgYXMgKFxuICAgICAgICBzZWxlY3QgU1RfQ29sbGVjdChnZW9tKSBhcyBnZW9tIGZyb20gdGJcbiAgICAgIClcbiAgICAgICwgdGQgYXMgKFxuICAgICAgICBzZWxlY3QgU1RfU3BsaXQodGEuZ2VvbSwgdGMuZ2VvbSkgYXMgZ2VvbSBmcm9tIHRhLCB0Y1xuICAgICAgKVxuICAgICAgLCB0ZSBhcyAoXG4gICAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGRcbiAgICAgIClcbiAgICAgIGluc2VydCBpbnRvICR7dGhpcy4jbGluZVRvcG99IChnZW9tKSBcbiAgICAgIHNlbGVjdCBnZW9tIGZyb20gdGVgO1xuICAgICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbK3Jvd1snaWQnXV0pO1xuICAgIH1cblxuICAgIC8vIOWIoOmZpOWOn+acieeahFxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSAke3RoaXMuI2xpbmVUb3BvfSB3aGVyZSBpZCBpbiAoJHtpbnRlcnNlY3RJZHMuam9pbignLCAnKX0pYCk7XG4gIH1cblxuXG5cblxuXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgTGliVG9wb0xpbmU7Il19