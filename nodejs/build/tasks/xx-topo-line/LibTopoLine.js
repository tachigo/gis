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

  async initRelationColumn(pg) {
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
            select id from tb where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')
          )
          select distinct id from tc`;
          const rows1 = await pg.query(sql1, [id]).then(res => {
            return res.rows || [];
          });
          const ids = rows1.map(item => +item['id']);

          const dumpIds = _lodash.default.uniq(ids);

          console.log(dumpIds);

          if (dumpIds.length > 0) {
            const sql2 = `insert into ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} (id, dump_ids) 
            values ($1::bigint, $2::bigint[]) 
            on conflict (id) do update set dump_ids = excluded.dump_ids`;
            await pg.query(sql2, [id, `{${dumpIds.join(',')}}`]);
          } else {
            throw new Error(`topo edge#${id} dose not math any dump lines`);
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
            select id from tb where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')
          )
          select distinct id from tc`;
          const rows1 = await pg.query(sql1, [id]).then(res => {
            return res.rows || [];
          });
          const ids = rows1.map(item => +item['id']);

          const topoIds = _lodash.default.uniq(ids);

          console.log(topoIds);

          if (topoIds.length > 0) {
            const sql2 = `insert into ${_classPrivateFieldLooseBase(that, _lineDump)[_lineDump]} (id, topo_ids) 
            values ($1::bigint, $2::bigint[]) 
            on conflict (id) do update set topo_ids = excluded.topo_ids`;
            await pg.query(sql2, [id, `{${topoIds.join(',')}}`]); // for await (const topoId of topoIds) {
            //   const sql3 = `select unnest(dump_ids) as dump_id from ${that.#lineTopo} where id = $1`;
            //   const rows2 = await pg
            //     .query(sql3, [topoId])
            //     .then(res => {
            //       return res.rows || [];
            //     })
            //   ;
            //   const oldDumpIds = rows2.map(item => +item['dump_id']);
            //   oldDumpIds.push(id);
            //   const newDumpIds = Lodash.uniq(oldDumpIds);
            //   const sql4 = `insert into ${that.#lineTopo} (id, dump_ids)
            //   values ($1::bigint, $2::bigint[])
            //   on conflict (id) do update set dump_ids = excluded.dump_ids`;
            //   await pg.query(sql4, [topoId, `{${newDumpIds.join(',')}}`]);
            // }
          } else {
            console.log(`${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} 边 ${i}#${id}|${row['target_id']}|${row['path']} [${row['type']}|${row['category']}] 无拓扑关系`);
          }
        });
      }

      console.log(`#${startId} - #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }

  async fixDump2Topos(pg) {
    let count;
    let snapToGrid = 10;

    do {
      const rows = await pg.query(`select count(*) as count from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where topo_ids is null`).then(res => {
        return res.rows || [];
      });
      count = rows[0]['count'];

      if (count > 0) {
        console.log(`snap to grid 1e-${snapToGrid} in ${count}`);
        await this.fixDump2Topo(pg, snapToGrid);
        snapToGrid -= 1;
      }
    } while (count > 0 && snapToGrid > 5); // 不大于1e-5 1e-6还拟合不到 误差就太大了 就要找问题了


    const rows = await pg.query(`select count(*) as count from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where topo_ids is null`).then(res => {
      return res.rows || [];
    });
    count = rows[0]['count'];
    console.log(`final non-related ${count}`);
  }

  async fixDump2Topo(pg, snapToGrid) {
    let startId = 0;
    let count;
    const limit = 100;
    let i = 0;

    do {
      const rows = await pg.query(`select id, target_id, path, type, category from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id > $1 and topo_ids is null order by id asc limit $2`, [startId, limit]).then(res => {
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
          const sql1 = `with 
          ta as (
            select geom from ${_classPrivateFieldLooseBase(that, _lineDump)[_lineDump]} where id = $1
          )
          , tb as (
            select t.id as id, ST_Intersection(
              ST_SnapToGrid(t.geom, 1e-${snapToGrid}), 
              ST_SnapToGrid(ta.geom, 1e-${snapToGrid})
            ) as geom from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} as t, ta 
            where (t.geom && ta.geom) and ST_Intersects(t.geom, ta.geom)
          )
          , tc as (
            select id from tb where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')
          )
          select distinct id from tc`;
          const rows1 = await pg.query(sql1, [id]).then(res => {
            return res.rows || [];
          });
          const ids = rows1.map(item => +item['id']);

          const topoIds = _lodash.default.uniq(ids);

          console.log(topoIds);

          if (topoIds.length > 0) {
            const sql2 = `insert into ${_classPrivateFieldLooseBase(that, _lineDump)[_lineDump]} (id, topo_ids) 
            values ($1::bigint, $2::bigint[]) 
            on conflict (id) do update set topo_ids = excluded.topo_ids`;
            await pg.query(sql2, [id, `{${topoIds.join(',')}}`]); // for await (const topoId of topoIds) {
            //   const sql3 = `select unnest(dump_ids) as dump_id from ${that.#lineTopo} where id = $1`;
            //   const rows2 = await pg
            //     .query(sql3, [topoId])
            //     .then(res => {
            //       return res.rows || [];
            //     })
            //   ;
            //   const oldDumpIds = rows2.map(item => +item['dump_id']);
            //   oldDumpIds.push(id);
            //   const newDumpIds = Lodash.uniq(oldDumpIds);
            //   const sql4 = `insert into ${that.#lineTopo} (id, dump_ids)
            //   values ($1::bigint, $2::bigint[])
            //   on conflict (id) do update set dump_ids = excluded.dump_ids`;
            //   await pg.query(sql4, [topoId, `{${newDumpIds.join(',')}}`]);
            // }
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
          select id from tb where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')`;
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

              for await (const notEqualId of notEquals) {
                await that.fixEdgeCalc(pg, id, notEqualId, maxVerticesNum);
              }
            }
          }
        });
      }

      console.log(`#${startId} - #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }

  async fixEdgeCalc(pg, id, theId, maxVerticesNum) {
    // 清空tmp表
    await pg.query(`delete from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]}_tmp`); // 从topo取出来写入topo

    const sql = `with 
    ta as (
      select geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id = $1
    )
    , tb as (
      select geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id = $2
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
    await pg.query(sql, [id, theId]);
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


    await pg.query(`delete from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id in (${[id, theId].join(', ')})`);
    console.log(`====================================> re-calc intersects edges:`, [id, theId]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvTGliVG9wb0xpbmUuanMiXSwibmFtZXMiOlsiTGliVG9wb0xpbmUiLCJjb25zdHJ1Y3RvciIsImxpbmVEdW1wU2NoZW1hIiwibGluZUR1bXBUYWJsZSIsImxpbmVUb3BvU2NoZW1hIiwibGluZVRvcG9UYWJsZSIsImluaXRSZWxhdGlvbkNvbHVtbiIsInBnIiwicXVlcnkiLCJlIiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImluaXREdW1wVGFibGUiLCJkdW1wTGluZXNUb1RtcFRhYmxlIiwiaWQiLCJ0eXBlIiwiY2F0ZWdvcnkiLCJmcm9tVGFibGUiLCJ0b1RhYmxlIiwiZHVtcExpbmVzIiwidmVydGljZXNOdW0iLCJyZWFsVmVydGljZXNOdW0iLCJwYXRoIiwiY291bnQiLCJsaW1pdCIsInJvd3MiLCJ0aGVuIiwicmVzIiwibGVuZ3RoIiwibmV4dFBhdGgiLCJyb3ciLCJ0bXBJZCIsInNxbCIsImxvZyIsImR1bXBMaW5lc09sZCIsImluaXRUb3BvVGFibGUiLCJjYWxjRWRnZXMiLCJtYXhWZXJ0aWNlc051bSIsInN0YXJ0SWQiLCJuZXh0SWQiLCJ0aGF0IiwiVXRpbHMiLCJjYWxsIiwiY2FsY0VkZ2UiLCJjYWxjVG9wbzJEdW1wIiwiaSIsInNxbDEiLCJyb3dzMSIsImlkcyIsIm1hcCIsIml0ZW0iLCJkdW1wSWRzIiwiTG9kYXNoIiwidW5pcSIsInNxbDIiLCJqb2luIiwiRXJyb3IiLCJjYWxjRHVtcDJUb3BvIiwidG9wb0lkcyIsImZpeER1bXAyVG9wb3MiLCJzbmFwVG9HcmlkIiwiZml4RHVtcDJUb3BvIiwiY2hlY2tFZGdlcyIsIml0ZW1zIiwibm90RXF1YWxzIiwidGhlSWQiLCJwdXNoIiwibm90RXF1YWxJZCIsImZpeEVkZ2VDYWxjIiwicm93czIiLCJpbnRlcnNlY3RJZHMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBRUE7O0FBRUE7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxXQUFO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c3RyaWN0JztcblxuaW1wb3J0IFV0aWxzIGZyb20gJy4vLi4vLi4vbW9kdWxlcy9VdGlscyc7XG5cbmltcG9ydCBMb2Rhc2ggZnJvbSAnbG9kYXNoJztcblxuY2xhc3MgTGliVG9wb0xpbmUge1xuXG4gICNsaW5lRHVtcFNjaGVtYTtcbiAgI2xpbmVEdW1wVGFibGU7XG4gICNsaW5lRHVtcDtcblxuICAjbGluZVRvcG9TY2hlbWE7XG4gICNsaW5lVG9wb1RhYmxlO1xuICAjbGluZVRvcG87XG5cblxuICBjb25zdHJ1Y3RvcihsaW5lRHVtcFNjaGVtYSwgbGluZUR1bXBUYWJsZSwgbGluZVRvcG9TY2hlbWEsIGxpbmVUb3BvVGFibGUpIHtcbiAgICB0aGlzLiNsaW5lRHVtcFNjaGVtYSA9IGxpbmVEdW1wU2NoZW1hO1xuICAgIHRoaXMuI2xpbmVEdW1wVGFibGUgPSBsaW5lRHVtcFRhYmxlO1xuICAgIHRoaXMuI2xpbmVEdW1wID0gYCR7bGluZUR1bXBTY2hlbWF9LiR7bGluZUR1bXBUYWJsZX1gO1xuXG4gICAgdGhpcy4jbGluZVRvcG9TY2hlbWEgPSBsaW5lVG9wb1NjaGVtYTtcbiAgICB0aGlzLiNsaW5lVG9wb1RhYmxlID0gbGluZVRvcG9UYWJsZTtcbiAgICB0aGlzLiNsaW5lVG9wbyA9IGAke2xpbmVUb3BvU2NoZW1hfS4ke2xpbmVUb3BvVGFibGV9YDtcbiAgfVxuXG5cbiAgYXN5bmMgaW5pdFJlbGF0aW9uQ29sdW1uKHBnKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBkcm9wIGluZGV4IGlmIGV4aXN0cyAke3RoaXMuI2xpbmVEdW1wU2NoZW1hfV8ke3RoaXMuI2xpbmVEdW1wVGFibGV9X3RvcG9faWRzX2lkeCBjYXNjYWRlYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgYWx0ZXIgdGFibGUgJHt0aGlzLiNsaW5lRHVtcH0gZHJvcCBjb2x1bW4gaWYgZXhpc3RzIHRvcG9faWRzYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cblxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBhbHRlciB0YWJsZSAke3RoaXMuI2xpbmVEdW1wfSBhZGQgY29sdW1uIHRvcG9faWRzIGJpZ2ludFtdYCk7XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSBpbmRleCAke3RoaXMuI2xpbmVEdW1wU2NoZW1hfV8ke3RoaXMuI2xpbmVEdW1wVGFibGV9X3RvcG9faWRzX2lkeCBvbiAke3RoaXMuI2xpbmVEdW1wfSB1c2luZyBnaW4gKHRvcG9faWRzKWApO1xuXG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYGRyb3AgaW5kZXggaWYgZXhpc3RzICR7dGhpcy4jbGluZVRvcG9TY2hlbWF9XyR7dGhpcy4jbGluZVRvcG9UYWJsZX1fZHVtcF9pZHNfaW5kZXggY2FzY2FkZWApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYGFsdGVyIHRhYmxlICR7dGhpcy4jbGluZVRvcG99IGRyb3AgY29sdW1uIGlmIGV4aXN0cyBkdW1wX2lkc2ApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICBhd2FpdCBwZy5xdWVyeShgYWx0ZXIgdGFibGUgJHt0aGlzLiNsaW5lVG9wb30gYWRkIGNvbHVtbiBkdW1wX2lkcyBiaWdpbnRbXWApO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgaW5kZXggJHt0aGlzLiNsaW5lVG9wb1NjaGVtYX1fJHt0aGlzLiNsaW5lVG9wb1RhYmxlfV9kdW1wX2lkc19pZHggb24gJHt0aGlzLiNsaW5lVG9wb30gdXNpbmcgZ2luIChkdW1wX2lkcylgKTtcbiAgfVxuXG5cbiAgYXN5bmMgaW5pdER1bXBUYWJsZShwZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgZHJvcCB0YWJsZSBpZiBleGlzdHMgJHt0aGlzLiNsaW5lRHVtcH0gY2FzY2FkZWApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSB0YWJsZSBpZiBub3QgZXhpc3RzICR7dGhpcy4jbGluZUR1bXB9XG4gICAgKFxuICAgICAgICBpZCBiaWdzZXJpYWwgcHJpbWFyeSBrZXksXG4gICAgICAgIHRhcmdldF9pZCBiaWdpbnQsXG4gICAgICAgIHBhdGggaW50LFxuICAgICAgICB0eXBlIHZhcmNoYXIsXG4gICAgICAgIGNhdGVnb3J5IHZhcmNoYXIsXG4gICAgICAgIHBvaW50cyBpbnRlZ2VyLFxuICAgICAgICBsZW5ndGggZmxvYXQsXG4gICAgICAgIGdlb20gZ2VvbWV0cnksXG4gICAgICAgIGNvbnN0cmFpbnQgZW5mb3JjZV9zcmlkX2dlb20gY2hlY2sgKHN0X3NyaWQoZ2VvbSkgPSA0MzI2KVxuICAgIClgKTtcbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIGluZGV4ICR7dGhpcy4jbGluZUR1bXBTY2hlbWF9XyR7dGhpcy4jbGluZUR1bXBUYWJsZX1fZ2VvbV9pZHggb24gJHt0aGlzLiNsaW5lRHVtcH0gdXNpbmcgZ2lzdCAoZ2VvbSlgKTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgZHJvcCB0YWJsZSBpZiBleGlzdHMgJHt0aGlzLiNsaW5lRHVtcH1fdG1wIGNhc2NhZGVgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSB0YWJsZSBpZiBub3QgZXhpc3RzICR7dGhpcy4jbGluZUR1bXB9X3RtcFxuICAgIChcbiAgICAgICAgaWQgYmlnc2VyaWFsIHByaW1hcnkga2V5LFxuICAgICAgICB0YXJnZXRfaWQgYmlnaW50LFxuICAgICAgICBwYXRoIGludCxcbiAgICAgICAgdHlwZSB2YXJjaGFyLFxuICAgICAgICBjYXRlZ29yeSB2YXJjaGFyLFxuICAgICAgICBwb2ludHMgaW50ZWdlcixcbiAgICAgICAgbGVuZ3RoIGZsb2F0LFxuICAgICAgICBnZW9tIGdlb21ldHJ5LFxuICAgICAgICBjb25zdHJhaW50IGVuZm9yY2Vfc3JpZF9nZW9tIGNoZWNrIChzdF9zcmlkKGdlb20pID0gNDMyNilcbiAgICApYCk7XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSBpbmRleCAke3RoaXMuI2xpbmVEdW1wU2NoZW1hfV8ke3RoaXMuI2xpbmVEdW1wVGFibGV9X3RtcF9nZW9tX2lkeCBvbiAke3RoaXMuI2xpbmVEdW1wfV90bXAgdXNpbmcgZ2lzdCAoZ2VvbSlgKTtcbiAgfVxuXG5cbiAgYXN5bmMgZHVtcExpbmVzVG9UbXBUYWJsZShwZywgaWQsIHR5cGUsIGNhdGVnb3J5KSB7XG4gICAgY29uc3QgZnJvbVRhYmxlID0gJ2JvdW5kYXJ5LmxpbmUnO1xuICAgIGNvbnN0IHRvVGFibGUgPSBgJHt0aGlzLiNsaW5lRHVtcH1fdG1wYDtcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0b1RhYmxlfSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHtmcm9tVGFibGV9XG4gICAgICAgIHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM1xuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCBTVF9NYWtlVmFsaWQoXG4gICAgICAgICAgU1RfTm9kZShcbiAgICAgICAgICAgIFNUX0xpbmVNZXJnZShcbiAgICAgICAgICAgICAgU1RfUmVtb3ZlUmVwZWF0ZWRQb2ludHMoXG4gICAgICAgICAgICAgICAgZ2VvbVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApIGFzIGdlb20gZnJvbSB0YVxuICAgICAgKVxuICAgICAgLCB0YyBhcyAoXG4gICAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGJcbiAgICAgIClcbiAgICAgICwgdGQgYXMgKFxuICAgICAgICBzZWxlY3QgIChyb3dfbnVtYmVyKCkgb3ZlcigpKTo6aW50ZWdlciBhcyBwYXRoLCBnZW9tLCBTVF9OUG9pbnRzKGdlb20pIGFzIHBvaW50cyBmcm9tIHRjIG9yZGVyIGJ5IHBvaW50cyBkZXNjXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke3RvVGFibGV9ICh0YXJnZXRfaWQsIHBhdGgsIHR5cGUsIGNhdGVnb3J5LCBnZW9tLCBwb2ludHMsIGxlbmd0aCkgXG4gICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyB0YXJnZXRfaWQsIHBhdGgsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCBnZW9tLCBcbiAgICAgIHBvaW50cywgc3RfbGVuZ3RoKGdlb20pIGFzIGxlbmd0aCBmcm9tIHRkIG9yZGVyIGJ5IHBhdGggYXNjYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcbiAgfVxuXG5cbiAgYXN5bmMgZHVtcExpbmVzKHBnLCBpZCwgdHlwZSwgY2F0ZWdvcnksIHZlcnRpY2VzTnVtKSB7XG4gICAgY29uc3QgcmVhbFZlcnRpY2VzTnVtID0gdmVydGljZXNOdW0gLSAxO1xuICAgIGF3YWl0IHRoaXMuZHVtcExpbmVzVG9UbXBUYWJsZShwZywgaWQsIHR5cGUsIGNhdGVnb3J5KTtcbiAgICBjb25zdCB0b1RhYmxlID0gYCR7dGhpcy4jbGluZUR1bXB9YDtcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0b1RhYmxlfSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pO1xuXG4gICAgbGV0IHBhdGggPSAwO1xuICAgIGxldCBjb3VudDtcbiAgICBjb25zdCBsaW1pdCA9IDEwMDA7XG4gICAgZG8ge1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAgIC5xdWVyeShcbiAgICAgICAgICBgc2VsZWN0IGlkLCBwYXRoIGZyb20gJHt0aGlzLiNsaW5lRHVtcH1fdG1wIHdoZXJlIHRhcmdldF9pZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDMgYW5kIHBhdGggPiAkNCBvcmRlciBieSBwYXRoIGFzYyBsaW1pdCAkNWAsXG4gICAgICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeSwgcGF0aCwgbGltaXRdXG4gICAgICAgIClcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBjb3VudCA9IHJvd3MubGVuZ3RoO1xuICAgICAgbGV0IG5leHRQYXRoID0gMDtcbiAgICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgY29uc3QgdG1wSWQgPSArcm93WydpZCddO1xuICAgICAgICBuZXh0UGF0aCA9ICtyb3dbJ3BhdGgnXTtcbiAgICAgICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgICAgIHRhIGFzIChcbiAgICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGhpcy4jbGluZUR1bXB9X3RtcCB3aGVyZSBpZCA9ICQ0XG4gICAgICAgIClcbiAgICAgICAgLCB0YiBhcyAoXG4gICAgICAgICAgc2VsZWN0IFNUX1BvaW50TihnZW9tLCBcbiAgICAgICAgICAgICgoZ2VuZXJhdGVfc2VyaWVzKDEsIFNUX05Qb2ludHMoZ2VvbSkgLyAke3JlYWxWZXJ0aWNlc051bX0gKyAxKSAtIDEpICogJHtyZWFsVmVydGljZXNOdW19ICsgMSkpIGFzIGdlb20gXG4gICAgICAgICAgZnJvbSB0YVxuICAgICAgICApXG4gICAgICAgICwgdGMgYXMgKFxuICAgICAgICAgIHNlbGVjdCBTVF9Db2xsZWN0KGdlb20pIGFzIGdlb20gZnJvbSB0YlxuICAgICAgICApXG4gICAgICAgICwgdGQgYXMgKFxuICAgICAgICAgIHNlbGVjdCBTVF9TcGxpdCh0YS5nZW9tLCB0Yy5nZW9tKSBhcyBnZW9tIGZyb20gdGEsIHRjXG4gICAgICAgIClcbiAgICAgICAgLCB0ZSBhcyAoXG4gICAgICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSB0ZFxuICAgICAgICApXG4gICAgICAgICwgdGYgYXMgKFxuICAgICAgICAgIHNlbGVjdCAke25leHRQYXRofTo6aW50ZWdlciBhcyBwYXRoLCBnZW9tLCBTVF9OUG9pbnRzKGdlb20pIGFzIHBvaW50cyBmcm9tIHRlIG9yZGVyIGJ5IHBvaW50cyBkZXNjXG4gICAgICAgIClcbiAgICAgICAgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSAodGFyZ2V0X2lkLCBwYXRoLCB0eXBlLCBjYXRlZ29yeSwgZ2VvbSwgcG9pbnRzLCBsZW5ndGgpIFxuICAgICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyB0YXJnZXRfaWQsIHBhdGgsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCBnZW9tLCBcbiAgICAgICAgcG9pbnRzLCBzdF9sZW5ndGgoZ2VvbSkgYXMgbGVuZ3RoIGZyb20gdGYgb3JkZXIgYnkgcGF0aCBhc2NgO1xuICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZCwgdHlwZSwgY2F0ZWdvcnksIHRtcElkXSk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgZHVtcCBmcm9tIHRtcCBkdW1wIHRhYmxlICR7aWR9fCR7dHlwZX18JHtjYXRlZ29yeX0gIyR7cGF0aH0gLSAjJHtuZXh0UGF0aH1gKTtcbiAgICAgIHBhdGggPSBuZXh0UGF0aDtcbiAgICB9IHdoaWxlIChjb3VudCA+IDApO1xuICB9XG5cblxuICBhc3luYyBkdW1wTGluZXNPbGQocGcsIGlkLCB0eXBlLCBjYXRlZ29yeSkge1xuICAgIGNvbnN0IGZyb21UYWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCB0b1RhYmxlID0gYCR7dGhpcy4jbGluZUR1bXB9YDtcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0b1RhYmxlfSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHtmcm9tVGFibGV9XG4gICAgICAgIHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM1xuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCBTVF9NYWtlVmFsaWQoXG4gICAgICAgICAgU1RfTm9kZShcbiAgICAgICAgICAgIFNUX0xpbmVNZXJnZShcbiAgICAgICAgICAgICAgU1RfUmVtb3ZlUmVwZWF0ZWRQb2ludHMoXG4gICAgICAgICAgICAgICAgZ2VvbVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApIGFzIGdlb20gZnJvbSB0YVxuICAgICAgKVxuICAgICAgLCB0YyBhcyAoXG4gICAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGJcbiAgICAgIClcbiAgICAgICwgdGQgYXMgKFxuICAgICAgICBzZWxlY3QgU1RfU3ViZGl2aWRlKGdlb20sIDQwOTYpIGFzIGdlb20gZnJvbSB0Y1xuICAgICAgKVxuICAgICAgLCB0ZSBhcyAoXG4gICAgICAgIHNlbGVjdCAgKHJvd19udW1iZXIoKSBvdmVyKCkpOjppbnRlZ2VyIGFzIHBhdGgsIGdlb20gZnJvbSB0ZFxuICAgICAgKVxuICAgICAgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSAodGFyZ2V0X2lkLCBwYXRoLCB0eXBlLCBjYXRlZ29yeSwgZ2VvbSwgcG9pbnRzLCBsZW5ndGgpIFxuICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgdGFyZ2V0X2lkLCBwYXRoLCAkMjo6dmFyY2hhciBhcyB0eXBlLCAkMzo6dmFyY2hhciBhcyBjYXRlZ29yeSwgZ2VvbSwgXG4gICAgICBTVF9OUG9pbnRzKGdlb20pIGFzIHBvaW50cywgc3RfbGVuZ3RoKGdlb20pIGFzIGxlbmd0aCBmcm9tIHRlIG9yZGVyIGJ5IHBhdGggYXNjYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcbiAgfVxuXG5cbiAgYXN5bmMgaW5pdFRvcG9UYWJsZShwZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgZHJvcCB0YWJsZSAke3RoaXMuI2xpbmVUb3BvfSBjYXNjYWRlYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIHRhYmxlIGlmIG5vdCBleGlzdHMgJHt0aGlzLiNsaW5lVG9wb31cbiAgICAoXG4gICAgICAgIGlkIGJpZ3NlcmlhbCBwcmltYXJ5IGtleSxcbiAgICAgICAgZ2VvbSBnZW9tZXRyeSxcbiAgICAgICAgY29uc3RyYWludCBlbmZvcmNlX3NyaWRfZ2VvbSBjaGVjayAoc3Rfc3JpZChnZW9tKSA9IDQzMjYpXG4gICAgKWApO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgaW5kZXggJHt0aGlzLiNsaW5lVG9wb1NjaGVtYX1fJHt0aGlzLiNsaW5lVG9wb1RhYmxlfV9nZW9tX2lkeCBvbiAke3RoaXMuI2xpbmVUb3BvfSB1c2luZyBnaXN0IChnZW9tKWApO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBkcm9wIHRhYmxlICR7dGhpcy4jbGluZVRvcG99X3RtcCBjYXNjYWRlYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIHRhYmxlIGlmIG5vdCBleGlzdHMgJHt0aGlzLiNsaW5lVG9wb31fdG1wXG4gICAgKFxuICAgICAgICBpZCBiaWdzZXJpYWwgcHJpbWFyeSBrZXksXG4gICAgICAgIGdlb20gZ2VvbWV0cnksXG4gICAgICAgIGNvbnN0cmFpbnQgZW5mb3JjZV9zcmlkX2dlb20gY2hlY2sgKHN0X3NyaWQoZ2VvbSkgPSA0MzI2KVxuICAgIClgKTtcbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIGluZGV4ICR7dGhpcy4jbGluZVRvcG9TY2hlbWF9XyR7dGhpcy4jbGluZVRvcG9UYWJsZX1fdG1wX2dlb21faWR4IG9uICR7dGhpcy4jbGluZVRvcG99X3RtcCB1c2luZyBnaXN0IChnZW9tKWApO1xuICB9XG5cblxuICBhc3luYyBjYWxjRWRnZXMocGcsIG1heFZlcnRpY2VzTnVtKSB7XG4gICAgbGV0IHN0YXJ0SWQgPSAwO1xuICAgIGxldCBjb3VudDtcbiAgICBjb25zdCBsaW1pdCAgPSAxMDA7XG4gICAgZG8ge1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAgIC5xdWVyeShgc2VsZWN0IGlkLCB0YXJnZXRfaWQsIHBhdGgsIHR5cGUsIGNhdGVnb3J5IGZyb20gJHt0aGlzLiNsaW5lRHVtcH0gd2hlcmUgaWQgPiAkMSBvcmRlciBieSBpZCBhc2MgbGltaXQgJDJgLCBbc3RhcnRJZCwgbGltaXRdKVxuICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgfSlcbiAgICAgIDtcbiAgICAgIGNvdW50ID0gcm93cy5sZW5ndGg7XG4gICAgICBsZXQgbmV4dElkID0gMDtcbiAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICBjb25zdCBpZCA9ICtyb3dbJ2lkJ107XG4gICAgICAgIG5leHRJZCA9IGlkO1xuICAgICAgICBhd2FpdCBVdGlscy5jYWxsKGDorqHnrpfovrkgJHtpZH18JHtyb3dbJ3RhcmdldF9pZCddfXwke3Jvd1sncGF0aCddfSBbJHtyb3dbJ3R5cGUnXX18JHtyb3dbJ2NhdGVnb3J5J119XWAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGF0LmNhbGNFZGdlKHBnLCBpZCwgbWF4VmVydGljZXNOdW0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGAjJHtzdGFydElkfSAtICMke25leHRJZH1gKTtcbiAgICAgIHN0YXJ0SWQgPSBuZXh0SWQ7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2FsY1RvcG8yRHVtcChwZykge1xuICAgIGxldCBzdGFydElkID0gMDtcbiAgICBsZXQgY291bnQ7XG4gICAgY29uc3QgbGltaXQgID0gMTAwO1xuICAgIGxldCBpID0gMDtcbiAgICBkbyB7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgICAgLnF1ZXJ5KGBzZWxlY3QgaWQgZnJvbSAke3RoaXMuI2xpbmVUb3BvfSB3aGVyZSBpZCA+ICQxIG9yZGVyIGJ5IGlkIGFzYyBsaW1pdCAkMmAsIFtzdGFydElkLCBsaW1pdF0pXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgICAgY291bnQgPSByb3dzLmxlbmd0aDtcbiAgICAgIGxldCBuZXh0SWQgPSAwO1xuICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgIGNvbnN0IGlkID0gK3Jvd1snaWQnXTtcbiAgICAgICAgbmV4dElkID0gaWQ7XG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChg5YWz6IGUICR7dGhpcy4jbGluZVRvcG99IOi+uSAke2l9IyR7aWR9IOeahCBkdW1wIOWFs+ezu2AsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBjb25zdCBzcWwxID0gYHdpdGggXG4gICAgICAgICAgdGEgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoYXQuI2xpbmVUb3BvfSB3aGVyZSBpZCA9ICQxXG4gICAgICAgICAgKVxuICAgICAgICAgICwgdGIgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IHQuaWQgYXMgaWQsIFNUX0ludGVyc2VjdGlvbihcbiAgICAgICAgICAgICAgdC5nZW9tLCBcbiAgICAgICAgICAgICAgdGEuZ2VvbVxuICAgICAgICAgICAgKSBhcyBnZW9tIGZyb20gJHt0aGF0LiNsaW5lRHVtcH0gYXMgdCwgdGEgXG4gICAgICAgICAgICB3aGVyZSAodC5nZW9tICYmIHRhLmdlb20pIFxuICAgICAgICAgICAgYW5kIFNUX0ludGVyc2VjdHModC5nZW9tLCB0YS5nZW9tKVxuICAgICAgICAgIClcbiAgICAgICAgICAsIHRjIGFzIChcbiAgICAgICAgICAgIHNlbGVjdCBpZCBmcm9tIHRiIHdoZXJlIFNUX0dlb21ldHJ5VHlwZShnZW9tKSBub3QgaW4gKCdTVF9Qb2ludCcsICdTVF9NdWx0aVBvaW50JylcbiAgICAgICAgICApXG4gICAgICAgICAgc2VsZWN0IGRpc3RpbmN0IGlkIGZyb20gdGNgO1xuICAgICAgICAgIGNvbnN0IHJvd3MxID0gYXdhaXQgcGdcbiAgICAgICAgICAgIC5xdWVyeShzcWwxLCBbaWRdKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICA7XG4gICAgICAgICAgY29uc3QgaWRzID0gcm93czEubWFwKGl0ZW0gPT4gK2l0ZW1bJ2lkJ10pO1xuICAgICAgICAgIGNvbnN0IGR1bXBJZHMgPSBMb2Rhc2gudW5pcShpZHMpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGR1bXBJZHMpO1xuICAgICAgICAgIGlmIChkdW1wSWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHNxbDIgPSBgaW5zZXJ0IGludG8gJHt0aGF0LiNsaW5lVG9wb30gKGlkLCBkdW1wX2lkcykgXG4gICAgICAgICAgICB2YWx1ZXMgKCQxOjpiaWdpbnQsICQyOjpiaWdpbnRbXSkgXG4gICAgICAgICAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgZHVtcF9pZHMgPSBleGNsdWRlZC5kdW1wX2lkc2A7XG4gICAgICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwyLCBbaWQsIGB7JHtkdW1wSWRzLmpvaW4oJywnKX19YF0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHRvcG8gZWRnZSMke2lkfSBkb3NlIG5vdCBtYXRoIGFueSBkdW1wIGxpbmVzYCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGAjJHtzdGFydElkfSAtICMke25leHRJZH1gKTtcbiAgICAgIHN0YXJ0SWQgPSBuZXh0SWQ7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2FsY0R1bXAyVG9wbyhwZykge1xuICAgIGxldCBzdGFydElkID0gMDtcbiAgICBsZXQgY291bnQ7XG4gICAgY29uc3QgbGltaXQgID0gMTAwO1xuICAgIGxldCBpID0gMDtcblxuICAgIGRvIHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgICAucXVlcnkoYHNlbGVjdCBpZCwgdGFyZ2V0X2lkLCBwYXRoLCB0eXBlLCBjYXRlZ29yeSBmcm9tICR7dGhpcy4jbGluZUR1bXB9IHdoZXJlIGlkID4gJDEgb3JkZXIgYnkgaWQgYXNjIGxpbWl0ICQyYCwgW3N0YXJ0SWQsIGxpbWl0XSlcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBjb3VudCA9IHJvd3MubGVuZ3RoO1xuICAgICAgbGV0IG5leHRJZCA9IDA7XG4gICAgICBjb25zdCB0aGF0ID0gdGhpcztcbiAgICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgY29uc3QgaWQgPSArcm93WydpZCddO1xuICAgICAgICBuZXh0SWQgPSBpZDtcbiAgICAgICAgaSArPSAxO1xuICAgICAgICBhd2FpdCBVdGlscy5jYWxsKGDlhbPogZQgJHt0aGlzLiNsaW5lRHVtcH0g6L65ICR7aX0jJHtpZH18JHtyb3dbJ3RhcmdldF9pZCddfXwke3Jvd1sncGF0aCddfSBbJHtyb3dbJ3R5cGUnXX18JHtyb3dbJ2NhdGVnb3J5J119XSDnmoTmi5PmiZHlhbPns7tgLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc3FsMSA9IGB3aXRoIFxuICAgICAgICAgIHRhIGFzIChcbiAgICAgICAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0aGF0LiNsaW5lRHVtcH0gd2hlcmUgaWQgPSAkMVxuICAgICAgICAgIClcbiAgICAgICAgICAsIHRiIGFzIChcbiAgICAgICAgICAgIHNlbGVjdCB0LmlkIGFzIGlkLCBTVF9JbnRlcnNlY3Rpb24oXG4gICAgICAgICAgICAgIHQuZ2VvbSxcbiAgICAgICAgICAgICAgdGEuZ2VvbVxuICAgICAgICAgICAgKSBhcyBnZW9tIGZyb20gJHt0aGF0LiNsaW5lVG9wb30gYXMgdCwgdGEgXG4gICAgICAgICAgICB3aGVyZSAodC5nZW9tICYmIHRhLmdlb20pIGFuZCBTVF9JbnRlcnNlY3RzKHQuZ2VvbSwgdGEuZ2VvbSlcbiAgICAgICAgICApXG4gICAgICAgICAgLCB0YyBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgaWQgZnJvbSB0YiB3aGVyZSBTVF9HZW9tZXRyeVR5cGUoZ2VvbSkgbm90IGluICgnU1RfUG9pbnQnLCAnU1RfTXVsdGlQb2ludCcpXG4gICAgICAgICAgKVxuICAgICAgICAgIHNlbGVjdCBkaXN0aW5jdCBpZCBmcm9tIHRjYDtcbiAgICAgICAgICBjb25zdCByb3dzMSA9IGF3YWl0IHBnXG4gICAgICAgICAgICAucXVlcnkoc3FsMSwgW2lkXSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgO1xuICAgICAgICAgIGNvbnN0IGlkcyA9IHJvd3MxLm1hcChpdGVtID0+ICtpdGVtWydpZCddKTtcbiAgICAgICAgICBjb25zdCB0b3BvSWRzID0gTG9kYXNoLnVuaXEoaWRzKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyh0b3BvSWRzKTtcbiAgICAgICAgICBpZiAodG9wb0lkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBzcWwyID0gYGluc2VydCBpbnRvICR7dGhhdC4jbGluZUR1bXB9IChpZCwgdG9wb19pZHMpIFxuICAgICAgICAgICAgdmFsdWVzICgkMTo6YmlnaW50LCAkMjo6YmlnaW50W10pIFxuICAgICAgICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IHRvcG9faWRzID0gZXhjbHVkZWQudG9wb19pZHNgO1xuICAgICAgICAgICAgYXdhaXQgcGcucXVlcnkoc3FsMiwgW2lkLCBgeyR7dG9wb0lkcy5qb2luKCcsJyl9fWBdKTtcbiAgICAgICAgICAgIC8vIGZvciBhd2FpdCAoY29uc3QgdG9wb0lkIG9mIHRvcG9JZHMpIHtcbiAgICAgICAgICAgIC8vICAgY29uc3Qgc3FsMyA9IGBzZWxlY3QgdW5uZXN0KGR1bXBfaWRzKSBhcyBkdW1wX2lkIGZyb20gJHt0aGF0LiNsaW5lVG9wb30gd2hlcmUgaWQgPSAkMWA7XG4gICAgICAgICAgICAvLyAgIGNvbnN0IHJvd3MyID0gYXdhaXQgcGdcbiAgICAgICAgICAgIC8vICAgICAucXVlcnkoc3FsMywgW3RvcG9JZF0pXG4gICAgICAgICAgICAvLyAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIC8vICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgICAgIC8vICAgICB9KVxuICAgICAgICAgICAgLy8gICA7XG4gICAgICAgICAgICAvLyAgIGNvbnN0IG9sZER1bXBJZHMgPSByb3dzMi5tYXAoaXRlbSA9PiAraXRlbVsnZHVtcF9pZCddKTtcbiAgICAgICAgICAgIC8vICAgb2xkRHVtcElkcy5wdXNoKGlkKTtcbiAgICAgICAgICAgIC8vICAgY29uc3QgbmV3RHVtcElkcyA9IExvZGFzaC51bmlxKG9sZER1bXBJZHMpO1xuICAgICAgICAgICAgLy8gICBjb25zdCBzcWw0ID0gYGluc2VydCBpbnRvICR7dGhhdC4jbGluZVRvcG99IChpZCwgZHVtcF9pZHMpXG4gICAgICAgICAgICAvLyAgIHZhbHVlcyAoJDE6OmJpZ2ludCwgJDI6OmJpZ2ludFtdKVxuICAgICAgICAgICAgLy8gICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgZHVtcF9pZHMgPSBleGNsdWRlZC5kdW1wX2lkc2A7XG4gICAgICAgICAgICAvLyAgIGF3YWl0IHBnLnF1ZXJ5KHNxbDQsIFt0b3BvSWQsIGB7JHtuZXdEdW1wSWRzLmpvaW4oJywnKX19YF0pO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgJHt0aGlzLiNsaW5lRHVtcH0g6L65ICR7aX0jJHtpZH18JHtyb3dbJ3RhcmdldF9pZCddfXwke3Jvd1sncGF0aCddfSBbJHtyb3dbJ3R5cGUnXX18JHtyb3dbJ2NhdGVnb3J5J119XSDml6Dmi5PmiZHlhbPns7tgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coYCMke3N0YXJ0SWR9IC0gIyR7bmV4dElkfWApO1xuICAgICAgc3RhcnRJZCA9IG5leHRJZDtcbiAgICB9IHdoaWxlIChjb3VudCA+IDApO1xuICB9XG5cblxuICBhc3luYyBmaXhEdW1wMlRvcG9zKHBnKSB7XG4gICAgbGV0IGNvdW50O1xuICAgIGxldCBzbmFwVG9HcmlkID0gMTA7XG4gICAgZG8ge1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAgIC5xdWVyeShgc2VsZWN0IGNvdW50KCopIGFzIGNvdW50IGZyb20gJHt0aGlzLiNsaW5lRHVtcH0gd2hlcmUgdG9wb19pZHMgaXMgbnVsbGApXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgICAgY291bnQgPSByb3dzWzBdWydjb3VudCddO1xuICAgICAgaWYgKGNvdW50ID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgc25hcCB0byBncmlkIDFlLSR7c25hcFRvR3JpZH0gaW4gJHtjb3VudH1gKTtcbiAgICAgICAgYXdhaXQgdGhpcy5maXhEdW1wMlRvcG8ocGcsIHNuYXBUb0dyaWQpO1xuICAgICAgICBzbmFwVG9HcmlkIC09IDE7XG4gICAgICB9XG4gICAgfSB3aGlsZSAoY291bnQgPiAwICYmIHNuYXBUb0dyaWQgPiA1KTsgLy8g5LiN5aSn5LqOMWUtNSAxZS026L+Y5ouf5ZCI5LiN5YiwIOivr+W3ruWwseWkquWkp+S6hiDlsLHopoHmib7pl67popjkuoZcblxuICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgLnF1ZXJ5KGBzZWxlY3QgY291bnQoKikgYXMgY291bnQgZnJvbSAke3RoaXMuI2xpbmVEdW1wfSB3aGVyZSB0b3BvX2lkcyBpcyBudWxsYClcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgIH0pXG4gICAgO1xuICAgIGNvdW50ID0gcm93c1swXVsnY291bnQnXTtcbiAgICBjb25zb2xlLmxvZyhgZmluYWwgbm9uLXJlbGF0ZWQgJHtjb3VudH1gKTtcbiAgfVxuXG5cbiAgYXN5bmMgZml4RHVtcDJUb3BvKHBnLCBzbmFwVG9HcmlkKSB7XG4gICAgbGV0IHN0YXJ0SWQgPSAwO1xuICAgIGxldCBjb3VudDtcbiAgICBjb25zdCBsaW1pdCAgPSAxMDA7XG4gICAgbGV0IGkgPSAwO1xuXG4gICAgZG8ge1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAgIC5xdWVyeShgc2VsZWN0IGlkLCB0YXJnZXRfaWQsIHBhdGgsIHR5cGUsIGNhdGVnb3J5IGZyb20gJHt0aGlzLiNsaW5lRHVtcH0gd2hlcmUgaWQgPiAkMSBhbmQgdG9wb19pZHMgaXMgbnVsbCBvcmRlciBieSBpZCBhc2MgbGltaXQgJDJgLCBbc3RhcnRJZCwgbGltaXRdKVxuICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgfSlcbiAgICAgIDtcbiAgICAgIGNvdW50ID0gcm93cy5sZW5ndGg7XG4gICAgICBsZXQgbmV4dElkID0gMDtcbiAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICBjb25zdCBpZCA9ICtyb3dbJ2lkJ107XG4gICAgICAgIG5leHRJZCA9IGlkO1xuICAgICAgICBpICs9IDE7XG4gICAgICAgIGF3YWl0IFV0aWxzLmNhbGwoYOWFs+iBlCAke3RoaXMuI2xpbmVEdW1wfSDovrkgJHtpfSMke2lkfXwke3Jvd1sndGFyZ2V0X2lkJ119fCR7cm93WydwYXRoJ119IFske3Jvd1sndHlwZSddfXwke3Jvd1snY2F0ZWdvcnknXX1dIOeahOaLk+aJkeWFs+ezu2AsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBjb25zdCBzcWwxID0gYHdpdGggXG4gICAgICAgICAgdGEgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoYXQuI2xpbmVEdW1wfSB3aGVyZSBpZCA9ICQxXG4gICAgICAgICAgKVxuICAgICAgICAgICwgdGIgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IHQuaWQgYXMgaWQsIFNUX0ludGVyc2VjdGlvbihcbiAgICAgICAgICAgICAgU1RfU25hcFRvR3JpZCh0Lmdlb20sIDFlLSR7c25hcFRvR3JpZH0pLCBcbiAgICAgICAgICAgICAgU1RfU25hcFRvR3JpZCh0YS5nZW9tLCAxZS0ke3NuYXBUb0dyaWR9KVxuICAgICAgICAgICAgKSBhcyBnZW9tIGZyb20gJHt0aGF0LiNsaW5lVG9wb30gYXMgdCwgdGEgXG4gICAgICAgICAgICB3aGVyZSAodC5nZW9tICYmIHRhLmdlb20pIGFuZCBTVF9JbnRlcnNlY3RzKHQuZ2VvbSwgdGEuZ2VvbSlcbiAgICAgICAgICApXG4gICAgICAgICAgLCB0YyBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgaWQgZnJvbSB0YiB3aGVyZSBTVF9HZW9tZXRyeVR5cGUoZ2VvbSkgbm90IGluICgnU1RfUG9pbnQnLCAnU1RfTXVsdGlQb2ludCcpXG4gICAgICAgICAgKVxuICAgICAgICAgIHNlbGVjdCBkaXN0aW5jdCBpZCBmcm9tIHRjYDtcbiAgICAgICAgICBjb25zdCByb3dzMSA9IGF3YWl0IHBnXG4gICAgICAgICAgICAucXVlcnkoc3FsMSwgW2lkXSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgO1xuICAgICAgICAgIGNvbnN0IGlkcyA9IHJvd3MxLm1hcChpdGVtID0+ICtpdGVtWydpZCddKTtcbiAgICAgICAgICBjb25zdCB0b3BvSWRzID0gTG9kYXNoLnVuaXEoaWRzKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyh0b3BvSWRzKTtcbiAgICAgICAgICBpZiAodG9wb0lkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBzcWwyID0gYGluc2VydCBpbnRvICR7dGhhdC4jbGluZUR1bXB9IChpZCwgdG9wb19pZHMpIFxuICAgICAgICAgICAgdmFsdWVzICgkMTo6YmlnaW50LCAkMjo6YmlnaW50W10pIFxuICAgICAgICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IHRvcG9faWRzID0gZXhjbHVkZWQudG9wb19pZHNgO1xuICAgICAgICAgICAgYXdhaXQgcGcucXVlcnkoc3FsMiwgW2lkLCBgeyR7dG9wb0lkcy5qb2luKCcsJyl9fWBdKTtcblxuICAgICAgICAgICAgLy8gZm9yIGF3YWl0IChjb25zdCB0b3BvSWQgb2YgdG9wb0lkcykge1xuICAgICAgICAgICAgLy8gICBjb25zdCBzcWwzID0gYHNlbGVjdCB1bm5lc3QoZHVtcF9pZHMpIGFzIGR1bXBfaWQgZnJvbSAke3RoYXQuI2xpbmVUb3BvfSB3aGVyZSBpZCA9ICQxYDtcbiAgICAgICAgICAgIC8vICAgY29uc3Qgcm93czIgPSBhd2FpdCBwZ1xuICAgICAgICAgICAgLy8gICAgIC5xdWVyeShzcWwzLCBbdG9wb0lkXSlcbiAgICAgICAgICAgIC8vICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgLy8gICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICAgICAgLy8gICAgIH0pXG4gICAgICAgICAgICAvLyAgIDtcbiAgICAgICAgICAgIC8vICAgY29uc3Qgb2xkRHVtcElkcyA9IHJvd3MyLm1hcChpdGVtID0+ICtpdGVtWydkdW1wX2lkJ10pO1xuICAgICAgICAgICAgLy8gICBvbGREdW1wSWRzLnB1c2goaWQpO1xuICAgICAgICAgICAgLy8gICBjb25zdCBuZXdEdW1wSWRzID0gTG9kYXNoLnVuaXEob2xkRHVtcElkcyk7XG4gICAgICAgICAgICAvLyAgIGNvbnN0IHNxbDQgPSBgaW5zZXJ0IGludG8gJHt0aGF0LiNsaW5lVG9wb30gKGlkLCBkdW1wX2lkcylcbiAgICAgICAgICAgIC8vICAgdmFsdWVzICgkMTo6YmlnaW50LCAkMjo6YmlnaW50W10pXG4gICAgICAgICAgICAvLyAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBkdW1wX2lkcyA9IGV4Y2x1ZGVkLmR1bXBfaWRzYDtcbiAgICAgICAgICAgIC8vICAgYXdhaXQgcGcucXVlcnkoc3FsNCwgW3RvcG9JZCwgYHske25ld0R1bXBJZHMuam9pbignLCcpfX1gXSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGAjJHtzdGFydElkfSAtICMke25leHRJZH1gKTtcbiAgICAgIHN0YXJ0SWQgPSBuZXh0SWQ7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2hlY2tFZGdlcyhwZywgbWF4VmVydGljZXNOdW0pIHtcbiAgICBsZXQgc3RhcnRJZCA9IDEgLSAxO1xuICAgIGxldCBjb3VudDtcbiAgICBjb25zdCBsaW1pdCAgPSAxMDA7XG4gICAgbGV0IGkgPSAwO1xuICAgIGRvIHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgICAucXVlcnkoYHNlbGVjdCBpZCBmcm9tICR7dGhpcy4jbGluZVRvcG99IHdoZXJlIGlkID4gJDEgb3JkZXIgYnkgaWQgYXNjIGxpbWl0ICQyYCwgW3N0YXJ0SWQsIGxpbWl0XSlcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBjb3VudCA9IHJvd3MubGVuZ3RoO1xuICAgICAgbGV0IG5leHRJZCA9IDA7XG4gICAgICBjb25zdCB0aGF0ID0gdGhpcztcbiAgICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgY29uc3QgaWQgPSArcm93WydpZCddO1xuICAgICAgICBuZXh0SWQgPSBpZDtcbiAgICAgICAgaSArPSAxO1xuICAgICAgICBhd2FpdCBVdGlscy5jYWxsKGDmo4Dmn6UgJHt0aGlzLiNsaW5lVG9wb30g6L65ICR7aX0jJHtpZH1gLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgICAgICAgdGEgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoYXQuI2xpbmVUb3BvfSB3aGVyZSBpZCA9ICQxXG4gICAgICAgICAgKVxuICAgICAgICAgICwgdGIgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IHQuaWQgYXMgaWQsIFNUX0ludGVyc2VjdGlvbih0Lmdlb20sIHRhLmdlb20pIGFzIGdlb20gZnJvbSAke3RoYXQuI2xpbmVUb3BvfSBhcyB0LCB0YSBcbiAgICAgICAgICAgIHdoZXJlIHQuaWQgPiAkMSBhbmQgKHQuZ2VvbSAmJiB0YS5nZW9tIGFuZCBTVF9JbnRlcnNlY3RzKHQuZ2VvbSwgdGEuZ2VvbSkpXG4gICAgICAgICAgKVxuICAgICAgICAgIHNlbGVjdCBpZCBmcm9tIHRiIHdoZXJlIFNUX0dlb21ldHJ5VHlwZShnZW9tKSBub3QgaW4gKCdTVF9Qb2ludCcsICdTVF9NdWx0aVBvaW50JylgO1xuICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkXSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgO1xuICAgICAgICAgIGNvbnN0IGl0ZW1zID0gcmVzLm1hcChpdGVtID0+ICtpdGVtWydpZCddKTtcbiAgICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYGVkZ2UgIyR7aWR9IGludGVyc2VjdHMgd2l0aCBlZGdlc2AsIGl0ZW1zKTtcbiAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgZWRnZSAjJHtpZH0gaW50ZXJzZWN0cyB3aXRoIGVkZ2VzOiBbJHtpdGVtcy5qb2luKCcsJyl9XWApO1xuICAgICAgICAgICAgY29uc3Qgbm90RXF1YWxzID0gW107XG4gICAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IHRoZUlkIG9mIGl0ZW1zKSB7XG4gICAgICAgICAgICAgIC8vIOajgOafpeaYr+WQpuaYr+ebuOetieeahO+8jOWmguaenOaYr+ebuOetieeahO+8jOWwseWPr+S7peWIoOaOiVxuICAgICAgICAgICAgICBjb25zdCBzcWwgPSBgd2l0aFxuICAgICAgICAgICAgICB0YSBhcyAoXG4gICAgICAgICAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoYXQuI2xpbmVUb3BvfSB3aGVyZSBpZCA9ICQxXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgLCB0YiBhcyAoXG4gICAgICAgICAgICAgICAgc2VsZWN0IGlkLCBnZW9tIGZyb20gJHt0aGF0LiNsaW5lVG9wb30gd2hlcmUgaWQgPSAkMlxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIHNlbGVjdCB0Yi5pZCBhcyBpZCBmcm9tIHRhLCB0YiB3aGVyZSBTVF9FcXVhbHModGEuZ2VvbSwgdGIuZ2VvbSlgO1xuICAgICAgICAgICAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgICAgICAgICAgICAucXVlcnkoc3FsLCBbaWQsIHRoZUlkXSlcbiAgICAgICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgaWYgKHJvd3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIC8vIOebuOetieeahCDlj6/ku6XliKDpmaRcbiAgICAgICAgICAgICAgICBhd2FpdCBwZy5xdWVyeShgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PiBkZWxldGUgZnJvbSAke3RoYXQuI2xpbmVUb3BvfSB3aGVyZSBpZCA9ICQxYCwgW3RoZUlkXSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYGRlbGV0ZSBkdXBsaWNhdGUgZWRnZSMke3RoZUlkfWApO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vdEVxdWFscy5wdXNoKHRoZUlkKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vdEVxdWFscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0+IGVkZ2UgIyR7aWR9IGludGVyc2VjdHMgd2l0aCBub3QgZXF1YWwgZWRnZXM6YCwgbm90RXF1YWxzKTtcbiAgICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCBub3RFcXVhbElkIG9mIG5vdEVxdWFscykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoYXQuZml4RWRnZUNhbGMocGcsIGlkLCBub3RFcXVhbElkLCBtYXhWZXJ0aWNlc051bSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coYCMke3N0YXJ0SWR9IC0gIyR7bmV4dElkfWApO1xuICAgICAgc3RhcnRJZCA9IG5leHRJZDtcbiAgICB9IHdoaWxlIChjb3VudCA+IDApO1xuICB9XG5cblxuICBhc3luYyBmaXhFZGdlQ2FsYyhwZywgaWQsIHRoZUlkLCBtYXhWZXJ0aWNlc051bSkge1xuICAgIC8vIOa4heepunRtcOihqFxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSAke3RoaXMuI2xpbmVUb3BvfV90bXBgKTtcbiAgICAvLyDku450b3Bv5Y+W5Ye65p2l5YaZ5YWldG9wb1xuICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgIHRhIGFzIChcbiAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gd2hlcmUgaWQgPSAkMVxuICAgIClcbiAgICAsIHRiIGFzIChcbiAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gd2hlcmUgaWQgPSAkMlxuICAgIClcbiAgICAsIHRjIGFzIChcbiAgICAgIHNlbGVjdCBTVF9JbnRlcnNlY3Rpb24odGEuZ2VvbSwgdGIuZ2VvbSkgYXMgZ2VvbSBmcm9tIHRhLCB0YlxuICAgIClcbiAgICAsIHRkIGFzIChcbiAgICAgIHNlbGVjdCBTVF9Vbmlvbih0YS5nZW9tLCB0Yi5nZW9tKSBhcyBnZW9tIGZyb20gdGEsIHRiXG4gICAgKVxuICAgICwgdGUgYXMgKFxuXHQgICAgc2VsZWN0IFNUX1N5bURpZmZlcmVuY2UodGQuZ2VvbSwgdGMuZ2VvbSkgYXMgZ2VvbSBmcm9tIHRkLCB0Y1xuICAgIClcbiAgICAsIHRmIGFzIChcbiAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGMgXG4gICAgICB3aGVyZSBnZW9tIGlzIG5vdCBudWxsIGFuZCBTVF9Jc0VtcHR5KGdlb20pID0gZmFsc2VcbiAgICAgIHVuaW9uIGFsbCBcbiAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGUgXG4gICAgICB3aGVyZSBnZW9tIGlzIG5vdCBudWxsIGFuZCBTVF9Jc0VtcHR5KGdlb20pID0gZmFsc2UgXG4gICAgKVxuICAgICwgdGcgYXMgKFxuICAgICAgc2VsZWN0IFxuICAgICAgU1RfTWFrZVZhbGlkKFxuICAgICAgICBTVF9Ob2RlKFxuICAgICAgICAgIFNUX0xpbmVNZXJnZShcbiAgICAgICAgICAgIFNUX1JlbW92ZVJlcGVhdGVkUG9pbnRzKFxuICAgICAgICAgICAgICBTVF9VbmlvbihnZW9tKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKSBcbiAgICAgIGFzIGdlb20gZnJvbSB0ZiBcbiAgICAgIHdoZXJlIFNUX0dlb21ldHJ5VHlwZShnZW9tKSBub3QgaW4gKCdTVF9Qb2ludCcsICdTVF9NdWx0aVBvaW50JylcbiAgICApXG4gICAgLCB0aCBhcyAoXG4gICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tIHRnXG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7dGhpcy4jbGluZVRvcG99X3RtcCAoZ2VvbSkgXG4gICAgc2VsZWN0IGdlb20gZnJvbSB0aGA7XG4gICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWQsIHRoZUlkXSk7XG5cbiAgICBjb25zdCByZWFsVmVydGljZXNOdW0gPSBtYXhWZXJ0aWNlc051bSAtIDE7XG4gICAgY29uc3Qgcm93czIgPSBhd2FpdCBwZ1xuICAgICAgLnF1ZXJ5KGBzZWxlY3QgaWQgZnJvbSAke3RoaXMuI2xpbmVUb3BvfV90bXBgKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgfSlcbiAgICA7XG4gICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2Ygcm93czIpIHtcbiAgICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgICAgdGEgYXMgKFxuICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGhpcy4jbGluZVRvcG99X3RtcCB3aGVyZSBpZCA9ICQxXG4gICAgICApXG4gICAgICAsIHRiIGFzIChcbiAgICAgICAgc2VsZWN0IFNUX1BvaW50TihnZW9tLCBcbiAgICAgICAgICAoKGdlbmVyYXRlX3NlcmllcygxLCBTVF9OUG9pbnRzKGdlb20pIC8gJHtyZWFsVmVydGljZXNOdW19ICsgMSkgLSAxKSAqICR7cmVhbFZlcnRpY2VzTnVtfSArIDEpKSBhcyBnZW9tIFxuICAgICAgICBmcm9tIHRhXG4gICAgICApXG4gICAgICAsIHRjIGFzIChcbiAgICAgICAgc2VsZWN0IFNUX0NvbGxlY3QoZ2VvbSkgYXMgZ2VvbSBmcm9tIHRiXG4gICAgICApXG4gICAgICAsIHRkIGFzIChcbiAgICAgICAgc2VsZWN0IFNUX1NwbGl0KHRhLmdlb20sIHRjLmdlb20pIGFzIGdlb20gZnJvbSB0YSwgdGNcbiAgICAgIClcbiAgICAgICwgdGUgYXMgKFxuICAgICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tIHRkXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke3RoaXMuI2xpbmVUb3BvfSAoZ2VvbSkgXG4gICAgICBzZWxlY3QgZ2VvbSBmcm9tIHRlYDtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgWytyb3dbJ2lkJ11dKTtcbiAgICB9XG5cbiAgICAvLyDliKDpmaTljp/mnInnmoRcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gd2hlcmUgaWQgaW4gKCR7W2lkLCB0aGVJZF0uam9pbignLCAnKX0pYCk7XG4gICAgY29uc29sZS5sb2coYD09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT4gcmUtY2FsYyBpbnRlcnNlY3RzIGVkZ2VzOmAsIFtpZCwgdGhlSWRdKTtcbiAgfVxuXG4gIGFzeW5jIGNhbGNFZGdlKHBnLCBpZCwgbWF4VmVydGljZXNOdW0pIHtcbiAgICBjb25zdCByZWFsVmVydGljZXNOdW0gPSBtYXhWZXJ0aWNlc051bSAtIDE7XG4gICAgLy8g5LuOZHVtcOWPluWHuuadpeWGmeWFpXRvcG9cbiAgICBjb25zdCBzcWwxID0gYHdpdGggXG4gICAgdGEgYXMgKFxuICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoaXMuI2xpbmVEdW1wfSB3aGVyZSBpZCA9ICQxXG4gICAgKVxuICAgIHNlbGVjdCB0LmlkIGFzIGlkIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gYXMgdCwgdGEgXG4gICAgd2hlcmUgKHQuZ2VvbSAmJiB0YS5nZW9tKSBhbmQgU1RfSW50ZXJzZWN0cyh0Lmdlb20sIHRhLmdlb20pIFxuICAgIGFuZCBTVF9OUG9pbnRzKFNUX0ludGVyc2VjdGlvbih0Lmdlb20sIHRhLmdlb20pKSA+IDBgO1xuICAgIGNvbnN0IHJvd3MxID0gYXdhaXQgcGdcbiAgICAgIC5xdWVyeShzcWwxLCBbaWRdKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgfSlcbiAgICA7XG4gICAgY29uc3QgaW50ZXJzZWN0SWRzID0gcm93czEubWFwKHJvdyA9PiArcm93WydpZCddKTtcbiAgICBjb25zb2xlLmxvZyhpbnRlcnNlY3RJZHMpO1xuICAgIGlmIChpbnRlcnNlY3RJZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhg5peg5Lqk6ZuG77yM55u05o6l5o+S5YWlYCk7XG4gICAgICByZXR1cm4gYXdhaXQgcGdcbiAgICAgICAgLnF1ZXJ5KGB3aXRoIFxuICAgICAgICB0YSBhcyAoXG4gICAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoaXMuI2xpbmVEdW1wfSB3aGVyZSBpZCA9ICQxXG4gICAgICAgIClcbiAgICAgICAgaW5zZXJ0IGludG8gJHt0aGlzLiNsaW5lVG9wb30gKGdlb20pIFxuICAgICAgICBzZWxlY3QgXG4gICAgICAgICAgU1RfTWFrZVZhbGlkKFxuICAgICAgICAgICAgU1RfTm9kZShcbiAgICAgICAgICAgICAgU1RfTGluZU1lcmdlKFxuICAgICAgICAgICAgICAgIFNUX1JlbW92ZVJlcGVhdGVkUG9pbnRzKFxuICAgICAgICAgICAgICAgICAgZ2VvbVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICkgYXMgZ2VvbSBmcm9tIHRhIFxuICAgICAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gLCBbaWRdKVxuICAgICAgO1xuICAgIH1cblxuICAgIC8vIOa4heepunRtcOihqFxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSAke3RoaXMuI2xpbmVUb3BvfV90bXBgKTtcblxuICAgIGNvbnN0IHNxbDIgPSBgd2l0aCBcbiAgICB0YSBhcyAoXG4gICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGhpcy4jbGluZUR1bXB9IHdoZXJlIGlkID0gJDFcbiAgICApXG4gICAgLCB0YiBhcyAoXG4gICAgICBzZWxlY3QgU1RfVW5pb24oZ2VvbSkgYXMgZ2VvbSBmcm9tICR7dGhpcy4jbGluZVRvcG99IHdoZXJlIGlkIGluICgke2ludGVyc2VjdElkcy5qb2luKCcsICcpfSlcbiAgICApIFxuICAgICwgdGMgYXMgKFxuICAgICAgc2VsZWN0IFNUX0ludGVyc2VjdGlvbih0YS5nZW9tLCB0Yi5nZW9tKSBhcyBnZW9tIGZyb20gdGEsIHRiXG4gICAgKVxuICAgICwgdGQgYXMgKFxuICAgICAgc2VsZWN0IFNUX1VuaW9uKHRhLmdlb20sIHRiLmdlb20pIGFzIGdlb20gZnJvbSB0YSwgdGJcbiAgICApXG4gICAgLCB0ZSBhcyAoXG5cdCAgICBzZWxlY3QgU1RfU3ltRGlmZmVyZW5jZSh0ZC5nZW9tLCB0Yy5nZW9tKSBhcyBnZW9tIGZyb20gdGQsIHRjXG4gICAgKVxuICAgICwgdGYgYXMgKFxuICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSB0YyBcbiAgICAgIHdoZXJlIGdlb20gaXMgbm90IG51bGwgYW5kIFNUX0lzRW1wdHkoZ2VvbSkgPSBmYWxzZVxuICAgICAgdW5pb24gYWxsIFxuICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSB0ZSBcbiAgICAgIHdoZXJlIGdlb20gaXMgbm90IG51bGwgYW5kIFNUX0lzRW1wdHkoZ2VvbSkgPSBmYWxzZSBcbiAgICApXG4gICAgLCB0ZyBhcyAoXG4gICAgICBzZWxlY3QgXG4gICAgICBTVF9NYWtlVmFsaWQoXG4gICAgICAgIFNUX05vZGUoXG4gICAgICAgICAgU1RfTGluZU1lcmdlKFxuICAgICAgICAgICAgU1RfUmVtb3ZlUmVwZWF0ZWRQb2ludHMoXG4gICAgICAgICAgICAgIFNUX1VuaW9uKGdlb20pXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICApIFxuICAgICAgYXMgZ2VvbSBmcm9tIHRmIFxuICAgICAgd2hlcmUgU1RfR2VvbWV0cnlUeXBlKGdlb20pIG5vdCBpbiAoJ1NUX1BvaW50JywgJ1NUX011bHRpUG9pbnQnKVxuICAgIClcbiAgICAsIHRoIGFzIChcbiAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGdcbiAgICApXG4gICAgaW5zZXJ0IGludG8gJHt0aGlzLiNsaW5lVG9wb31fdG1wIChnZW9tKSBcbiAgICBzZWxlY3QgZ2VvbSBmcm9tIHRoYDtcbiAgICBhd2FpdCBwZy5xdWVyeShzcWwyLCBbaWRdKTtcblxuICAgIGNvbnN0IHJvd3MyID0gYXdhaXQgcGdcbiAgICAgIC5xdWVyeShgc2VsZWN0IGlkIGZyb20gJHt0aGlzLiNsaW5lVG9wb31fdG1wYClcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgIH0pXG4gICAgO1xuICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJvd3MyKSB7XG4gICAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICAgIHRhIGFzIChcbiAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoaXMuI2xpbmVUb3BvfV90bXAgd2hlcmUgaWQgPSAkMVxuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCBTVF9Qb2ludE4oZ2VvbSwgXG4gICAgICAgICAgKChnZW5lcmF0ZV9zZXJpZXMoMSwgU1RfTlBvaW50cyhnZW9tKSAvICR7cmVhbFZlcnRpY2VzTnVtfSArIDEpIC0gMSkgKiAke3JlYWxWZXJ0aWNlc051bX0gKyAxKSkgYXMgZ2VvbSBcbiAgICAgICAgZnJvbSB0YVxuICAgICAgKVxuICAgICAgLCB0YyBhcyAoXG4gICAgICAgIHNlbGVjdCBTVF9Db2xsZWN0KGdlb20pIGFzIGdlb20gZnJvbSB0YlxuICAgICAgKVxuICAgICAgLCB0ZCBhcyAoXG4gICAgICAgIHNlbGVjdCBTVF9TcGxpdCh0YS5nZW9tLCB0Yy5nZW9tKSBhcyBnZW9tIGZyb20gdGEsIHRjXG4gICAgICApXG4gICAgICAsIHRlIGFzIChcbiAgICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSB0ZFxuICAgICAgKVxuICAgICAgaW5zZXJ0IGludG8gJHt0aGlzLiNsaW5lVG9wb30gKGdlb20pIFxuICAgICAgc2VsZWN0IGdlb20gZnJvbSB0ZWA7XG4gICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFsrcm93WydpZCddXSk7XG4gICAgfVxuXG4gICAgLy8g5Yig6Zmk5Y6f5pyJ55qEXG4gICAgYXdhaXQgcGcucXVlcnkoYGRlbGV0ZSBmcm9tICR7dGhpcy4jbGluZVRvcG99IHdoZXJlIGlkIGluICgke2ludGVyc2VjdElkcy5qb2luKCcsICcpfSlgKTtcbiAgfVxuXG5cblxuXG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBMaWJUb3BvTGluZTsiXX0=