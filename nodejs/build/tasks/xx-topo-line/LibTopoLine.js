'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Utils = _interopRequireDefault(require("./../../modules/Utils"));

var _LibLWGeom = _interopRequireDefault(require("./LibLWGeom"));

var _lodash = _interopRequireDefault(require("lodash"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }

var id = 0;

function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }

class LibTopoLine {
  constructor(lineDumpSchema, lineDumpTable, lineTopoSchema, lineTopoTable, nodeTopoSchema, nodeTopoTable) {
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
    Object.defineProperty(this, _nodeTopoSchema, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _nodeTopoTable, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _nodeTopo, {
      writable: true,
      value: void 0
    });
    _classPrivateFieldLooseBase(this, _lineDumpSchema)[_lineDumpSchema] = lineDumpSchema;
    _classPrivateFieldLooseBase(this, _lineDumpTable)[_lineDumpTable] = lineDumpTable;
    _classPrivateFieldLooseBase(this, _lineDump)[_lineDump] = `${lineDumpSchema}.${lineDumpTable}`;
    _classPrivateFieldLooseBase(this, _lineTopoSchema)[_lineTopoSchema] = lineTopoSchema;
    _classPrivateFieldLooseBase(this, _lineTopoTable)[_lineTopoTable] = lineTopoTable;
    _classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo] = `${lineTopoSchema}.${lineTopoTable}`;
    _classPrivateFieldLooseBase(this, _nodeTopoSchema)[_nodeTopoSchema] = nodeTopoSchema;
    _classPrivateFieldLooseBase(this, _nodeTopoTable)[_nodeTopoTable] = nodeTopoTable;
    _classPrivateFieldLooseBase(this, _nodeTopo)[_nodeTopo] = `${_classPrivateFieldLooseBase(this, _nodeTopoSchema)[_nodeTopoSchema]}.${_classPrivateFieldLooseBase(this, _nodeTopoTable)[_nodeTopoTable]}`;
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
  }

  async calcEdges(pg) {
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
    const limit = 100;
    let i = 0;

    do {
      const rows = await pg.query(`select id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id > $1 order by id asc limit $2`, [startId, limit]).then(res => {
        return res.rows || [];
      });
      count = rows.length;
      let nextId = 0;

      for await (const row of rows) {
        const id = +row['id'];
        nextId = id;
        i += 1;
        let ids, dumpIds;
        sql = `with 
        ta as (
          select geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id = $1
        )
        , tb as (
          select t.id as id, ST_Intersection(
            t.geom, 
            ta.geom
          ) as geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} as t, ta 
          where (t.geom && ta.geom) 
          and ST_Intersects(t.geom, ta.geom)
        )
        , tc as (
          select id from tb 
          where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')
        )
        select distinct id from tc`;
        ids = await pg.query(sql, [id]).then(res => {
          return res.rows.map(row => +row['id']);
        });
        dumpIds = _lodash.default.uniq(ids); // if (dumpIds.length === 0) {
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
          sql = `insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} (id, dump_ids) 
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
      select geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id = $1
    )
    , tb as (
      select t.id as id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} as t, ta 
      where (t.geom && ta.geom) and ST_Distance(t.geom, ta.geom) < $2
    )
    select distinct id from tb`;
    const topoIds = await pg.query(sql, [dumpId, tol]).then(res => {
      return res.rows.map(row => +row['id']);
    });
    sql = `select ST_AsHEXEWKB(geom) as geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id = $1`;
    const geomDump = await pg.query(sql, [dumpId]).then(res => {
      return res.rows[0]['geom'];
    });
    const ids = [];

    for await (const topoId of topoIds) {
      sql = `select ST_AsHEXEWKB(geom) as geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id = $1`;
      const geomTopo = await pg.query(sql, [topoId]).then(res => {
        return res.rows[0]['geom'];
      }); // 比较距离

      sql = `with 
      ta as (
        select (ST_DumpPoints($1::geometry)).geom as geom
      )
      , tb as (
        select ST_Distance($2::geometry, geom) as distance from ta
      )
      select max(distance) as max_distance from tb`;
      const maxDistance = await pg.query(sql, [geomTopo, geomDump]).then(res => {
        return +res.rows[0]['max_distance'];
      });

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
        await _Utils.default.call(`${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} 边 ${i}#${id}|${row['target_id']}|${row['path']} [${row['type']}|${row['category']}]`, async () => {
          const topoIds = await that.calcDump2TopoEdge(pg, id, tol);

          if (topoIds.length > 0) {
            console.log(topoIds);
            sql = `insert into ${_classPrivateFieldLooseBase(that, _lineDump)[_lineDump]} (id, topo_ids) 
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
      select geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id = $1
    )
    select t.id as id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} as t, ta  
    where t.id > $1 and (t.geom && ta.geom and ST_Intersects(t.geom, ta.geom)) 
    and (ST_Equals(t.geom, ta.geom) or ST_Equals(ST_Reverse(t.geom), ta.geom))`;
    const theIds = await pg.query(sql, [id]).then(res => {
      return res.rows.map(row => +row['id']);
    });

    for await (const theId of theIds) {
      // 相等的 可以删除
      sql = `delete from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id = $1`;
      await pg.query(sql, [theId]);
      console.log(`====================================> delete #${id} reverse duplicate edge#${theId}`);
    }
  }

  async checkCollapseEdge(pg, id) {
    let sql;
    sql = `with 
    ta as (
      select geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id = $1
    )
    , tb as (
      select t.id as id, ST_Intersection(t.geom, ta.geom) as geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} as t, ta 
      where t.id > $1 and (t.geom && ta.geom and ST_Intersects(t.geom, ta.geom))
    )
    select id from tb where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint') and ST_NPoints(geom) > 0`;
    const theIds = await pg.query(sql, [id]).then(res => {
      return res.rows.map(row => +row['id']);
    });

    if (theIds.length > 0) {
      console.log(`====================================> edge #${id} collapsed with edges:`, theIds);
      await this.fixCollapseEdge(pg, id, theIds);
    }
  }

  async checkDuplicateEdges(pg) {
    let startId = 1 - 1;
    let count;
    const limit = 2000;

    do {
      const rows = await pg.query(`select id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id > $1 order by id asc limit $2`, [startId, limit]).then(res => {
        return res.rows || [];
      });
      count = rows.length;
      let nextId = 0;

      if (count > 0) {
        nextId = rows[count - 1]['id'];
        const that = this;
        await _Utils.default.call(`#${startId} - #${nextId}`, async () => {
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
    const limit = 2000;

    do {
      const rows = await pg.query(`select id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id > $1 order by id asc limit $2`, [startId, limit]).then(res => {
        return res.rows || [];
      });
      count = rows.length;
      let nextId = 0;

      if (count > 0) {
        nextId = rows[count - 1]['id'];
        const that = this;
        await _Utils.default.call(`#${startId} - #${nextId}`, async () => {
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
    geom = await pg.query(`select ST_AsHEXEWKB(geom) as geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id = $1`, [id]).then(res => {
      return res.rows[0]['geom'];
    });
    geom = await _Utils.default.call(`topo#${id} ====> Repeated-point removed`, async () => {
      return await _LibLWGeom.default.removeRepeatedPoints(pg, geom, tol);
    });
    geom = await _Utils.default.call(`topo#${id} ====> Self-node`, async () => {
      return await _LibLWGeom.default.node(pg, geom);
    });
  }

  async checkCollapseEdges(pg) {
    let startId = 1 - 1;
    let count;
    const limit = 2000;

    do {
      const rows = await pg.query(`select id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id > $1 order by id asc limit $2`, [startId, limit]).then(res => {
        return res.rows || [];
      });
      count = rows.length;
      let nextId = 0;

      if (count > 0) {
        nextId = rows[count - 1]['id'];
        const that = this;
        await _Utils.default.call(`#${startId} - #${nextId}`, async () => {
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
    let sql; // 从topo取出来写入topo

    sql = `with 
    ta as (
      select geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id = $1
      union all 
      select geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id in (${theIds.join(', ')})
    )
    , tb as (
      select ST_Union(geom) as geom from ta
    )
    , tc as (
      select (ST_Dump(geom)).geom as geom from tb
    )
    insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} (geom) 
    select geom from tc`;
    await pg.query(sql, [id]); // 删除原有的

    await pg.query(`delete from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id in (${[id, ...theIds].join(', ')})`);
    console.log(`====================================> re-calc intersects edges:`, [id, ...theIds]);
  }

  async calcEdge(pg, id) {
    let sql; // 从dump取出来写入topo

    sql = `with 
    ta as (
      select geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id = $1
    )
    select t.id as id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} as t, ta 
    where (t.geom && ta.geom) and ST_Intersects(t.geom, ta.geom) 
    and ST_NPoints(ST_Intersection(t.geom, ta.geom)) > 0`;
    const theIds = await pg.query(sql, [id]).then(res => {
      return res.rows.map(row => +row['id']);
    });
    console.log(theIds);

    if (theIds.length === 0) {
      console.log(`无交集，直接插入`);
      sql = `with 
      ta as (
        select geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id = $1
      )
      insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} (geom) 
      select geom from ta 
      on conflict (id) do update set geom = excluded.geom`;
      return await pg.query(sql, [id]);
    }

    sql = `select ST_AsHEXEWKB(geom) as geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id = $1`;
    const geomDump = await pg.query(sql, [id]).then(res => res.rows[0]['geom']);
    let geomDumpTmp = geomDump;
    const geomPoints = [];

    for await (const theId of theIds) {
      sql = `select ST_AsHEXEWKB(geom) as geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id = $1`;
      const geomTopo = await pg.query(sql, [theId]).then(res => res.rows[0]['geom']); // 交集的起始点和结束点

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
      const rows = await pg.query(sql, [geomDump, geomTopo]).then(res => res.rows);

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
        insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} (geom) 
        select geom from tg`;
        await pg.query(sql, [geomDump, geomTopo]);
      }

      sql = `select ST_AsHEXEWKB(ST_Difference($1::geometry, $2::geometry)) as geom`;
      geomDumpTmp = await pg.query(sql, [geomDumpTmp, geomTopo]).then(res => res.rows[0]['geom']);
    }

    const geomNodes = _lodash.default.uniq(geomPoints);

    if (geomNodes.length === 0) {
      console.log(`交集是起始点或结束点, 直接插入`);
      sql = `with 
      ta as (
        select geom from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id = $1
      )
      insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} (geom) 
      select geom from ta 
      on conflict (id) do update set geom = excluded.geom`;
      return await pg.query(sql, [id]);
    } // 最后插入剩下的


    if (geomDumpTmp !== null) {
      sql = `insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} (geom) 
      values ($1::geometry)`;
      await pg.query(sql, [geomDumpTmp]);
    } // 删除原有的


    await pg.query(`delete from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id in (${theIds.join(', ')})`);
  }

}

var _lineDumpSchema = _classPrivateFieldLooseKey("lineDumpSchema");

var _lineDumpTable = _classPrivateFieldLooseKey("lineDumpTable");

var _lineDump = _classPrivateFieldLooseKey("lineDump");

var _lineTopoSchema = _classPrivateFieldLooseKey("lineTopoSchema");

var _lineTopoTable = _classPrivateFieldLooseKey("lineTopoTable");

var _lineTopo = _classPrivateFieldLooseKey("lineTopo");

var _nodeTopoSchema = _classPrivateFieldLooseKey("nodeTopoSchema");

var _nodeTopoTable = _classPrivateFieldLooseKey("nodeTopoTable");

var _nodeTopo = _classPrivateFieldLooseKey("nodeTopo");

var _default = LibTopoLine;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvTGliVG9wb0xpbmUuanMiXSwibmFtZXMiOlsiTGliVG9wb0xpbmUiLCJjb25zdHJ1Y3RvciIsImxpbmVEdW1wU2NoZW1hIiwibGluZUR1bXBUYWJsZSIsImxpbmVUb3BvU2NoZW1hIiwibGluZVRvcG9UYWJsZSIsIm5vZGVUb3BvU2NoZW1hIiwibm9kZVRvcG9UYWJsZSIsImluaXREdW1wMlRvcG9SZWxhdGlvbiIsInBnIiwicXVlcnkiLCJlIiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImluaXRUb3BvMkR1bXBSZWxhdGlvbiIsImluaXREdW1wVGFibGUiLCJkdW1wTGluZXNUb1RtcFRhYmxlIiwiaWQiLCJ0eXBlIiwiY2F0ZWdvcnkiLCJmcm9tVGFibGUiLCJ0b1RhYmxlIiwiZHVtcExpbmVzIiwidmVydGljZXNOdW0iLCJyZWFsVmVydGljZXNOdW0iLCJwYXRoIiwiY291bnQiLCJsaW1pdCIsInJvd3MiLCJ0aGVuIiwicmVzIiwibGVuZ3RoIiwibmV4dFBhdGgiLCJyb3ciLCJ0bXBJZCIsInNxbCIsImxvZyIsImR1bXBMaW5lc09sZCIsImluaXRUb3BvVGFibGUiLCJjYWxjRWRnZXMiLCJzdGFydElkIiwibmV4dElkIiwidGhhdCIsIlV0aWxzIiwiY2FsbCIsImNhbGNFZGdlIiwiY2FsY1RvcG8yRHVtcCIsImkiLCJpZHMiLCJkdW1wSWRzIiwibWFwIiwiTG9kYXNoIiwidW5pcSIsImpvaW4iLCJjYWxjRHVtcDJUb3BvRWRnZSIsImR1bXBJZCIsInRvbCIsInRvcG9JZHMiLCJnZW9tRHVtcCIsInRvcG9JZCIsImdlb21Ub3BvIiwibWF4RGlzdGFuY2UiLCJwdXNoIiwiY2FsY0R1bXAyVG9wb0VkZ2VzIiwiY2hlY2tEdXBsaWNhdGVFZGdlIiwidGhlSWRzIiwidGhlSWQiLCJjaGVja0NvbGxhcHNlRWRnZSIsImZpeENvbGxhcHNlRWRnZSIsImNoZWNrRHVwbGljYXRlRWRnZXMiLCJ0b3BvU25hcEVkZ2VzIiwidG9wb1NuYXBFZGdlIiwiZ2VvbSIsIkxpYkxXR2VvbSIsInJlbW92ZVJlcGVhdGVkUG9pbnRzIiwibm9kZSIsImNoZWNrQ29sbGFwc2VFZGdlcyIsImdlb21EdW1wVG1wIiwiZ2VvbVBvaW50cyIsImdlb21Ob2RlcyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFFQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztBQUVBLE1BQU1BLFdBQU4sQ0FBa0I7QUFnQmhCQyxFQUFBQSxXQUFXLENBQUNDLGNBQUQsRUFBaUJDLGFBQWpCLEVBQWdDQyxjQUFoQyxFQUFnREMsYUFBaEQsRUFBK0RDLGNBQS9ELEVBQStFQyxhQUEvRSxFQUE4RjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUN2RywwRUFBdUJMLGNBQXZCO0FBQ0Esd0VBQXNCQyxhQUF0QjtBQUNBLDhEQUFrQixHQUFFRCxjQUFlLElBQUdDLGFBQWMsRUFBcEQ7QUFFQSwwRUFBdUJDLGNBQXZCO0FBQ0Esd0VBQXNCQyxhQUF0QjtBQUNBLDhEQUFrQixHQUFFRCxjQUFlLElBQUdDLGFBQWMsRUFBcEQ7QUFFQSwwRUFBdUJDLGNBQXZCO0FBQ0Esd0VBQXNCQyxhQUF0QjtBQUNBLDhEQUFrQixHQUFELDRCQUFHLElBQUgsbUNBQXdCLElBQXhCLDRCQUEyQixJQUEzQixpQ0FBK0MsRUFBaEU7QUFDRDs7QUFHRCxRQUFNQyxxQkFBTixDQUE0QkMsRUFBNUIsRUFBZ0M7QUFDOUIsUUFBSTtBQUNGLFlBQU1BLEVBQUUsQ0FBQ0MsS0FBSCxDQUFVLHdCQUFELDRCQUF3QixJQUF4QixtQ0FBNkMsSUFBN0MsNEJBQWdELElBQWhELGlDQUFvRSx1QkFBN0UsQ0FBTjtB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LENBQ1pDLEdBQUcsSUFBSUEsR0FBRyxDQUFDRixJQUFKLENBQVMsQ0FBVCxFQUFZLE1BQVosQ0FESyxDQUFwQjtBQUVEOztBQUNELFVBQU1tRCxTQUFTLEdBQUc1QixnQkFBT0MsSUFBUCxDQUFZMEIsVUFBWixDQUFsQjs7QUFDQSxRQUFJQyxTQUFTLENBQUNoRCxNQUFWLEtBQXFCLENBQXpCLEVBQTRCO0FBQzFCcEIsTUFBQUEsT0FBTyxDQUFDeUIsR0FBUixDQUFhLGtCQUFiO0FBQ0FELE1BQUFBLEdBQUcsR0FBSTs7MkJBQUQsNEJBRWUsSUFGZix1QkFFOEI7O29CQUY5Qiw0QkFJUSxJQUpSLHVCQUl1Qjs7MERBSjdCO0FBT0EsYUFBTyxNQUFNM0IsRUFBRSxDQUFDQyxLQUFILENBQVMwQixHQUFULEVBQWMsQ0FBQ2xCLEVBQUQsQ0FBZCxDQUFiO0FBQ0QsS0F2SG9CLENBd0hyQjs7O0FBQ0EsUUFBSTRELFdBQVcsS0FBSyxJQUFwQixFQUEwQjtBQUN4QjFDLE1BQUFBLEdBQUcsR0FBSSxlQUFELDRCQUFlLElBQWYsdUJBQThCOzRCQUFwQztBQUVBLFlBQU0zQixFQUFFLENBQUNDLEtBQUgsQ0FBUzBCLEdBQVQsRUFBYyxDQUFDMEMsV0FBRCxDQUFkLENBQU47QUFDRCxLQTdIb0IsQ0ErSHJCOzs7QUFDQSxVQUFNckUsRUFBRSxDQUFDQyxLQUFILENBQVUsZUFBRCw0QkFBZSxJQUFmLHVCQUE4QixpQkFBZ0J3RCxNQUFNLENBQUNaLElBQVAsQ0FBWSxJQUFaLENBQWtCLEdBQXpFLENBQU47QUFDRDs7QUEzdkJlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQWl3Qkh0RCxXIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi8uLi8uLi9tb2R1bGVzL1V0aWxzJztcbmltcG9ydCBMaWJMV0dlb20gZnJvbSAnLi9MaWJMV0dlb20nO1xuaW1wb3J0IExvZGFzaCBmcm9tICdsb2Rhc2gnO1xuXG5jbGFzcyBMaWJUb3BvTGluZSB7XG5cbiAgI2xpbmVEdW1wU2NoZW1hO1xuICAjbGluZUR1bXBUYWJsZTtcbiAgI2xpbmVEdW1wO1xuXG4gICNsaW5lVG9wb1NjaGVtYTtcbiAgI2xpbmVUb3BvVGFibGU7XG4gICNsaW5lVG9wbztcblxuXG4gICNub2RlVG9wb1NjaGVtYTtcbiAgI25vZGVUb3BvVGFibGU7XG4gICNub2RlVG9wbztcblxuXG4gIGNvbnN0cnVjdG9yKGxpbmVEdW1wU2NoZW1hLCBsaW5lRHVtcFRhYmxlLCBsaW5lVG9wb1NjaGVtYSwgbGluZVRvcG9UYWJsZSwgbm9kZVRvcG9TY2hlbWEsIG5vZGVUb3BvVGFibGUpIHtcbiAgICB0aGlzLiNsaW5lRHVtcFNjaGVtYSA9IGxpbmVEdW1wU2NoZW1hO1xuICAgIHRoaXMuI2xpbmVEdW1wVGFibGUgPSBsaW5lRHVtcFRhYmxlO1xuICAgIHRoaXMuI2xpbmVEdW1wID0gYCR7bGluZUR1bXBTY2hlbWF9LiR7bGluZUR1bXBUYWJsZX1gO1xuXG4gICAgdGhpcy4jbGluZVRvcG9TY2hlbWEgPSBsaW5lVG9wb1NjaGVtYTtcbiAgICB0aGlzLiNsaW5lVG9wb1RhYmxlID0gbGluZVRvcG9UYWJsZTtcbiAgICB0aGlzLiNsaW5lVG9wbyA9IGAke2xpbmVUb3BvU2NoZW1hfS4ke2xpbmVUb3BvVGFibGV9YDtcblxuICAgIHRoaXMuI25vZGVUb3BvU2NoZW1hID0gbm9kZVRvcG9TY2hlbWE7XG4gICAgdGhpcy4jbm9kZVRvcG9UYWJsZSA9IG5vZGVUb3BvVGFibGU7XG4gICAgdGhpcy4jbm9kZVRvcG8gPSBgJHt0aGlzLiNub2RlVG9wb1NjaGVtYX0uJHt0aGlzLiNub2RlVG9wb1RhYmxlfWA7XG4gIH1cblxuXG4gIGFzeW5jIGluaXREdW1wMlRvcG9SZWxhdGlvbihwZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgZHJvcCBpbmRleCBpZiBleGlzdHMgJHt0aGlzLiNsaW5lRHVtcFNjaGVtYX1fJHt0aGlzLiNsaW5lRHVtcFRhYmxlfV90b3BvX2lkc19pZHggY2FzY2FkZWApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYGFsdGVyIHRhYmxlICR7dGhpcy4jbGluZUR1bXB9IGRyb3AgY29sdW1uIGlmIGV4aXN0cyB0b3BvX2lkc2ApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICBhd2FpdCBwZy5xdWVyeShgYWx0ZXIgdGFibGUgJHt0aGlzLiNsaW5lRHVtcH0gYWRkIGNvbHVtbiB0b3BvX2lkcyBiaWdpbnRbXWApO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgaW5kZXggJHt0aGlzLiNsaW5lRHVtcFNjaGVtYX1fJHt0aGlzLiNsaW5lRHVtcFRhYmxlfV90b3BvX2lkc19pZHggb24gJHt0aGlzLiNsaW5lRHVtcH0gdXNpbmcgZ2luICh0b3BvX2lkcylgKTtcbiAgfVxuXG5cbiAgYXN5bmMgaW5pdFRvcG8yRHVtcFJlbGF0aW9uKHBnKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBkcm9wIGluZGV4IGlmIGV4aXN0cyAke3RoaXMuI2xpbmVUb3BvU2NoZW1hfV8ke3RoaXMuI2xpbmVUb3BvVGFibGV9X2R1bXBfaWRzX2luZGV4IGNhc2NhZGVgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBhbHRlciB0YWJsZSAke3RoaXMuI2xpbmVUb3BvfSBkcm9wIGNvbHVtbiBpZiBleGlzdHMgZHVtcF9pZHNgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgYXdhaXQgcGcucXVlcnkoYGFsdGVyIHRhYmxlICR7dGhpcy4jbGluZVRvcG99IGFkZCBjb2x1bW4gZHVtcF9pZHMgYmlnaW50W11gKTtcbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIGluZGV4ICR7dGhpcy4jbGluZVRvcG9TY2hlbWF9XyR7dGhpcy4jbGluZVRvcG9UYWJsZX1fZHVtcF9pZHNfaWR4IG9uICR7dGhpcy4jbGluZVRvcG99IHVzaW5nIGdpbiAoZHVtcF9pZHMpYCk7XG4gIH1cblxuXG4gIGFzeW5jIGluaXREdW1wVGFibGUocGcpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYGRyb3AgdGFibGUgaWYgZXhpc3RzICR7dGhpcy4jbGluZUR1bXB9IGNhc2NhZGVgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgfVxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgdGFibGUgaWYgbm90IGV4aXN0cyAke3RoaXMuI2xpbmVEdW1wfVxuICAgIChcbiAgICAgICAgaWQgYmlnc2VyaWFsIHByaW1hcnkga2V5LFxuICAgICAgICB0YXJnZXRfaWQgYmlnaW50LFxuICAgICAgICBwYXRoIGludCxcbiAgICAgICAgdHlwZSB2YXJjaGFyLFxuICAgICAgICBjYXRlZ29yeSB2YXJjaGFyLFxuICAgICAgICBwb2ludHMgaW50ZWdlcixcbiAgICAgICAgbGVuZ3RoIGZsb2F0LFxuICAgICAgICBnZW9tIGdlb21ldHJ5LFxuICAgICAgICBjb25zdHJhaW50IGVuZm9yY2Vfc3JpZF9nZW9tIGNoZWNrIChzdF9zcmlkKGdlb20pID0gNDMyNilcbiAgICApYCk7XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSBpbmRleCAke3RoaXMuI2xpbmVEdW1wU2NoZW1hfV8ke3RoaXMuI2xpbmVEdW1wVGFibGV9X2dlb21faWR4IG9uICR7dGhpcy4jbGluZUR1bXB9IHVzaW5nIGdpc3QgKGdlb20pYCk7XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYGRyb3AgdGFibGUgaWYgZXhpc3RzICR7dGhpcy4jbGluZUR1bXB9X3RtcCBjYXNjYWRlYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cblxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgdGFibGUgaWYgbm90IGV4aXN0cyAke3RoaXMuI2xpbmVEdW1wfV90bXBcbiAgICAoXG4gICAgICAgIGlkIGJpZ3NlcmlhbCBwcmltYXJ5IGtleSxcbiAgICAgICAgdGFyZ2V0X2lkIGJpZ2ludCxcbiAgICAgICAgcGF0aCBpbnQsXG4gICAgICAgIHR5cGUgdmFyY2hhcixcbiAgICAgICAgY2F0ZWdvcnkgdmFyY2hhcixcbiAgICAgICAgcG9pbnRzIGludGVnZXIsXG4gICAgICAgIGxlbmd0aCBmbG9hdCxcbiAgICAgICAgZ2VvbSBnZW9tZXRyeSxcbiAgICAgICAgY29uc3RyYWludCBlbmZvcmNlX3NyaWRfZ2VvbSBjaGVjayAoc3Rfc3JpZChnZW9tKSA9IDQzMjYpXG4gICAgKWApO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgaW5kZXggJHt0aGlzLiNsaW5lRHVtcFNjaGVtYX1fJHt0aGlzLiNsaW5lRHVtcFRhYmxlfV90bXBfZ2VvbV9pZHggb24gJHt0aGlzLiNsaW5lRHVtcH1fdG1wIHVzaW5nIGdpc3QgKGdlb20pYCk7XG4gIH1cblxuXG4gIGFzeW5jIGR1bXBMaW5lc1RvVG1wVGFibGUocGcsIGlkLCB0eXBlLCBjYXRlZ29yeSkge1xuICAgIGNvbnN0IGZyb21UYWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCB0b1RhYmxlID0gYCR7dGhpcy4jbGluZUR1bXB9X3RtcGA7XG4gICAgYXdhaXQgcGcucXVlcnkoYGRlbGV0ZSBmcm9tICR7dG9UYWJsZX0gd2hlcmUgdGFyZ2V0X2lkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsIFtpZCwgdHlwZSwgY2F0ZWdvcnldKTtcblxuICAgIGF3YWl0IHBnLnF1ZXJ5KGB3aXRoIFxuICAgICAgdGEgYXMgKFxuICAgICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tICR7ZnJvbVRhYmxlfVxuICAgICAgICB3aGVyZSBpZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNcbiAgICAgIClcbiAgICAgICwgdGIgYXMgKFxuICAgICAgICBzZWxlY3QgU1RfTWFrZVZhbGlkKFxuICAgICAgICAgIFNUX05vZGUoXG4gICAgICAgICAgICBTVF9MaW5lTWVyZ2UoXG4gICAgICAgICAgICAgIFNUX1JlbW92ZVJlcGVhdGVkUG9pbnRzKFxuICAgICAgICAgICAgICAgIGdlb21cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKSBhcyBnZW9tIGZyb20gdGFcbiAgICAgIClcbiAgICAgICwgdGMgYXMgKFxuICAgICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tIHRiXG4gICAgICApXG4gICAgICAsIHRkIGFzIChcbiAgICAgICAgc2VsZWN0ICAocm93X251bWJlcigpIG92ZXIoKSk6OmludGVnZXIgYXMgcGF0aCwgZ2VvbSwgU1RfTlBvaW50cyhnZW9tKSBhcyBwb2ludHMgZnJvbSB0YyBvcmRlciBieSBwb2ludHMgZGVzY1xuICAgICAgKVxuICAgICAgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSAodGFyZ2V0X2lkLCBwYXRoLCB0eXBlLCBjYXRlZ29yeSwgZ2VvbSwgcG9pbnRzLCBsZW5ndGgpIFxuICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgdGFyZ2V0X2lkLCBwYXRoLCAkMjo6dmFyY2hhciBhcyB0eXBlLCAkMzo6dmFyY2hhciBhcyBjYXRlZ29yeSwgZ2VvbSwgXG4gICAgICBwb2ludHMsIHN0X2xlbmd0aChnZW9tKSBhcyBsZW5ndGggZnJvbSB0ZCBvcmRlciBieSBwYXRoIGFzY2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICk7XG4gIH1cblxuXG4gIGFzeW5jIGR1bXBMaW5lcyhwZywgaWQsIHR5cGUsIGNhdGVnb3J5LCB2ZXJ0aWNlc051bSkge1xuICAgIGNvbnN0IHJlYWxWZXJ0aWNlc051bSA9IHZlcnRpY2VzTnVtIC0gMTtcbiAgICBhd2FpdCB0aGlzLmR1bXBMaW5lc1RvVG1wVGFibGUocGcsIGlkLCB0eXBlLCBjYXRlZ29yeSk7XG4gICAgY29uc3QgdG9UYWJsZSA9IGAke3RoaXMuI2xpbmVEdW1wfWA7XG4gICAgYXdhaXQgcGcucXVlcnkoYGRlbGV0ZSBmcm9tICR7dG9UYWJsZX0gd2hlcmUgdGFyZ2V0X2lkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsIFtpZCwgdHlwZSwgY2F0ZWdvcnldKTtcblxuICAgIGxldCBwYXRoID0gMDtcbiAgICBsZXQgY291bnQ7XG4gICAgY29uc3QgbGltaXQgPSAxMDAwO1xuICAgIGRvIHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgICAucXVlcnkoXG4gICAgICAgICAgYHNlbGVjdCBpZCwgcGF0aCBmcm9tICR7dGhpcy4jbGluZUR1bXB9X3RtcCB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzIGFuZCBwYXRoID4gJDQgb3JkZXIgYnkgcGF0aCBhc2MgbGltaXQgJDVgLFxuICAgICAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnksIHBhdGgsIGxpbWl0XVxuICAgICAgICApXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgICAgY291bnQgPSByb3dzLmxlbmd0aDtcbiAgICAgIGxldCBuZXh0UGF0aCA9IDA7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgIGNvbnN0IHRtcElkID0gK3Jvd1snaWQnXTtcbiAgICAgICAgbmV4dFBhdGggPSArcm93WydwYXRoJ107XG4gICAgICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgICAgICB0YSBhcyAoXG4gICAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoaXMuI2xpbmVEdW1wfV90bXAgd2hlcmUgaWQgPSAkNFxuICAgICAgICApXG4gICAgICAgICwgdGIgYXMgKFxuICAgICAgICAgIHNlbGVjdCBTVF9Qb2ludE4oZ2VvbSwgXG4gICAgICAgICAgICAoKGdlbmVyYXRlX3NlcmllcygxLCBTVF9OUG9pbnRzKGdlb20pIC8gJHtyZWFsVmVydGljZXNOdW19ICsgMSkgLSAxKSAqICR7cmVhbFZlcnRpY2VzTnVtfSArIDEpKSBhcyBnZW9tIFxuICAgICAgICAgIGZyb20gdGFcbiAgICAgICAgKVxuICAgICAgICAsIHRjIGFzIChcbiAgICAgICAgICBzZWxlY3QgU1RfQ29sbGVjdChnZW9tKSBhcyBnZW9tIGZyb20gdGJcbiAgICAgICAgKVxuICAgICAgICAsIHRkIGFzIChcbiAgICAgICAgICBzZWxlY3QgU1RfU3BsaXQodGEuZ2VvbSwgdGMuZ2VvbSkgYXMgZ2VvbSBmcm9tIHRhLCB0Y1xuICAgICAgICApXG4gICAgICAgICwgdGUgYXMgKFxuICAgICAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGRcbiAgICAgICAgKVxuICAgICAgICAsIHRmIGFzIChcbiAgICAgICAgICBzZWxlY3QgJHtuZXh0UGF0aH06OmludGVnZXIgYXMgcGF0aCwgZ2VvbSwgU1RfTlBvaW50cyhnZW9tKSBhcyBwb2ludHMgZnJvbSB0ZSBvcmRlciBieSBwb2ludHMgZGVzY1xuICAgICAgICApXG4gICAgICAgIGluc2VydCBpbnRvICR7dG9UYWJsZX0gKHRhcmdldF9pZCwgcGF0aCwgdHlwZSwgY2F0ZWdvcnksIGdlb20sIHBvaW50cywgbGVuZ3RoKSBcbiAgICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgdGFyZ2V0X2lkLCBwYXRoLCAkMjo6dmFyY2hhciBhcyB0eXBlLCAkMzo6dmFyY2hhciBhcyBjYXRlZ29yeSwgZ2VvbSwgXG4gICAgICAgIHBvaW50cywgc3RfbGVuZ3RoKGdlb20pIGFzIGxlbmd0aCBmcm9tIHRmIG9yZGVyIGJ5IHBhdGggYXNjYDtcbiAgICAgICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWQsIHR5cGUsIGNhdGVnb3J5LCB0bXBJZF0pO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coYGR1bXAgZnJvbSB0bXAgZHVtcCB0YWJsZSAke2lkfXwke3R5cGV9fCR7Y2F0ZWdvcnl9ICMke3BhdGh9IC0gIyR7bmV4dFBhdGh9YCk7XG4gICAgICBwYXRoID0gbmV4dFBhdGg7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG5cbiAgYXN5bmMgZHVtcExpbmVzT2xkKHBnLCBpZCwgdHlwZSwgY2F0ZWdvcnkpIHtcbiAgICBjb25zdCBmcm9tVGFibGUgPSAnYm91bmRhcnkubGluZSc7XG4gICAgY29uc3QgdG9UYWJsZSA9IGAke3RoaXMuI2xpbmVEdW1wfWA7XG4gICAgYXdhaXQgcGcucXVlcnkoYGRlbGV0ZSBmcm9tICR7dG9UYWJsZX0gd2hlcmUgdGFyZ2V0X2lkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsIFtpZCwgdHlwZSwgY2F0ZWdvcnldKTtcblxuICAgIGF3YWl0IHBnLnF1ZXJ5KGB3aXRoIFxuICAgICAgdGEgYXMgKFxuICAgICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tICR7ZnJvbVRhYmxlfVxuICAgICAgICB3aGVyZSBpZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNcbiAgICAgIClcbiAgICAgICwgdGIgYXMgKFxuICAgICAgICBzZWxlY3QgU1RfTWFrZVZhbGlkKFxuICAgICAgICAgIFNUX05vZGUoXG4gICAgICAgICAgICBTVF9MaW5lTWVyZ2UoXG4gICAgICAgICAgICAgIFNUX1JlbW92ZVJlcGVhdGVkUG9pbnRzKFxuICAgICAgICAgICAgICAgIGdlb21cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKSBhcyBnZW9tIGZyb20gdGFcbiAgICAgIClcbiAgICAgICwgdGMgYXMgKFxuICAgICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tIHRiXG4gICAgICApXG4gICAgICAsIHRkIGFzIChcbiAgICAgICAgc2VsZWN0IFNUX1N1YmRpdmlkZShnZW9tLCA0MDk2KSBhcyBnZW9tIGZyb20gdGNcbiAgICAgIClcbiAgICAgICwgdGUgYXMgKFxuICAgICAgICBzZWxlY3QgIChyb3dfbnVtYmVyKCkgb3ZlcigpKTo6aW50ZWdlciBhcyBwYXRoLCBnZW9tIGZyb20gdGRcbiAgICAgIClcbiAgICAgIGluc2VydCBpbnRvICR7dG9UYWJsZX0gKHRhcmdldF9pZCwgcGF0aCwgdHlwZSwgY2F0ZWdvcnksIGdlb20sIHBvaW50cywgbGVuZ3RoKSBcbiAgICAgIHNlbGVjdCAkMTo6YmlnaW50IGFzIHRhcmdldF9pZCwgcGF0aCwgJDI6OnZhcmNoYXIgYXMgdHlwZSwgJDM6OnZhcmNoYXIgYXMgY2F0ZWdvcnksIGdlb20sIFxuICAgICAgU1RfTlBvaW50cyhnZW9tKSBhcyBwb2ludHMsIHN0X2xlbmd0aChnZW9tKSBhcyBsZW5ndGggZnJvbSB0ZSBvcmRlciBieSBwYXRoIGFzY2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICk7XG4gIH1cblxuICBhc3luYyBpbml0VG9wb1RhYmxlKHBnKSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBkcm9wIHRhYmxlICR7dGhpcy4jbGluZVRvcG99IGNhc2NhZGVgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgfVxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgdGFibGUgaWYgbm90IGV4aXN0cyAke3RoaXMuI2xpbmVUb3BvfVxuICAgIChcbiAgICAgICAgaWQgYmlnc2VyaWFsIHByaW1hcnkga2V5LFxuICAgICAgICBnZW9tIGdlb21ldHJ5LFxuICAgICAgICBjb25zdHJhaW50IGVuZm9yY2Vfc3JpZF9nZW9tIGNoZWNrIChzdF9zcmlkKGdlb20pID0gNDMyNilcbiAgICApYCk7XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSBpbmRleCAke3RoaXMuI2xpbmVUb3BvU2NoZW1hfV8ke3RoaXMuI2xpbmVUb3BvVGFibGV9X2dlb21faWR4IG9uICR7dGhpcy4jbGluZVRvcG99IHVzaW5nIGdpc3QgKGdlb20pYCk7XG4gIH1cblxuXG4gIGFzeW5jIGNhbGNFZGdlcyhwZykge1xuICAgIGxldCBzdGFydElkID0gMDtcbiAgICBsZXQgY291bnQ7XG4gICAgY29uc3QgbGltaXQgID0gMTAwO1xuICAgIGRvIHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgICAucXVlcnkoYHNlbGVjdCBpZCwgdGFyZ2V0X2lkLCBwYXRoLCB0eXBlLCBjYXRlZ29yeSBmcm9tICR7dGhpcy4jbGluZUR1bXB9IHdoZXJlIGlkID4gJDEgb3JkZXIgYnkgaWQgYXNjIGxpbWl0ICQyYCwgW3N0YXJ0SWQsIGxpbWl0XSlcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBjb3VudCA9IHJvd3MubGVuZ3RoO1xuICAgICAgbGV0IG5leHRJZCA9IDA7XG4gICAgICBjb25zdCB0aGF0ID0gdGhpcztcbiAgICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgY29uc3QgaWQgPSArcm93WydpZCddO1xuICAgICAgICBuZXh0SWQgPSBpZDtcbiAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChg6K6h566X6L65ICR7aWR9fCR7cm93Wyd0YXJnZXRfaWQnXX18JHtyb3dbJ3BhdGgnXX0gWyR7cm93Wyd0eXBlJ119fCR7cm93WydjYXRlZ29yeSddfV1gLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhhdC5jYWxjRWRnZShwZywgaWQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGAjJHtzdGFydElkfSAtICMke25leHRJZH1gKTtcbiAgICAgIHN0YXJ0SWQgPSBuZXh0SWQ7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2FsY1RvcG8yRHVtcChwZykge1xuICAgIGxldCBzcWw7XG4gICAgbGV0IHN0YXJ0SWQgPSAwO1xuICAgIGxldCBjb3VudDtcbiAgICBjb25zdCBsaW1pdCAgPSAxMDA7XG4gICAgbGV0IGkgPSAwO1xuICAgIGRvIHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgICAucXVlcnkoYHNlbGVjdCBpZCBmcm9tICR7dGhpcy4jbGluZVRvcG99IHdoZXJlIGlkID4gJDEgb3JkZXIgYnkgaWQgYXNjIGxpbWl0ICQyYCwgW3N0YXJ0SWQsIGxpbWl0XSlcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBjb3VudCA9IHJvd3MubGVuZ3RoO1xuICAgICAgbGV0IG5leHRJZCA9IDA7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgIGNvbnN0IGlkID0gK3Jvd1snaWQnXTtcbiAgICAgICAgbmV4dElkID0gaWQ7XG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgbGV0IGlkcywgZHVtcElkcztcbiAgICAgICAgc3FsID0gYHdpdGggXG4gICAgICAgIHRhIGFzIChcbiAgICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGhpcy4jbGluZVRvcG99IHdoZXJlIGlkID0gJDFcbiAgICAgICAgKVxuICAgICAgICAsIHRiIGFzIChcbiAgICAgICAgICBzZWxlY3QgdC5pZCBhcyBpZCwgU1RfSW50ZXJzZWN0aW9uKFxuICAgICAgICAgICAgdC5nZW9tLCBcbiAgICAgICAgICAgIHRhLmdlb21cbiAgICAgICAgICApIGFzIGdlb20gZnJvbSAke3RoaXMuI2xpbmVEdW1wfSBhcyB0LCB0YSBcbiAgICAgICAgICB3aGVyZSAodC5nZW9tICYmIHRhLmdlb20pIFxuICAgICAgICAgIGFuZCBTVF9JbnRlcnNlY3RzKHQuZ2VvbSwgdGEuZ2VvbSlcbiAgICAgICAgKVxuICAgICAgICAsIHRjIGFzIChcbiAgICAgICAgICBzZWxlY3QgaWQgZnJvbSB0YiBcbiAgICAgICAgICB3aGVyZSBTVF9HZW9tZXRyeVR5cGUoZ2VvbSkgbm90IGluICgnU1RfUG9pbnQnLCAnU1RfTXVsdGlQb2ludCcpXG4gICAgICAgIClcbiAgICAgICAgc2VsZWN0IGRpc3RpbmN0IGlkIGZyb20gdGNgO1xuICAgICAgICBpZHMgPSBhd2FpdCBwZ1xuICAgICAgICAgIC5xdWVyeShzcWwsIFtpZF0pXG4gICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZXMucm93cy5tYXAocm93ID0+ICtyb3dbJ2lkJ10pO1xuICAgICAgICAgIH0pXG4gICAgICAgIDtcbiAgICAgICAgZHVtcElkcyA9IExvZGFzaC51bmlxKGlkcyk7XG4gICAgICAgIC8vIGlmIChkdW1wSWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyAgIHNxbCA9IGB3aXRoXG4gICAgICAgIC8vICAgdGEgYXMgKFxuICAgICAgICAvLyAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoaXMuI2xpbmVUb3BvfSB3aGVyZSBpZCA9ICQxXG4gICAgICAgIC8vICAgKVxuICAgICAgICAvLyAgICwgdGIgYXMgKFxuICAgICAgICAvLyAgICAgc2VsZWN0IHQuaWQgYXMgaWQsIFNUX0ludGVyc2VjdGlvbihcbiAgICAgICAgLy8gICAgICAgdC5nZW9tLFxuICAgICAgICAvLyAgICAgICB0YS5nZW9tXG4gICAgICAgIC8vICAgICApIGFzIGdlb20gZnJvbSAke3RoaXMuI2xpbmVEdW1wfSBhcyB0LCB0YVxuICAgICAgICAvLyAgICAgd2hlcmUgKHQuZ2VvbSAmJiB0YS5nZW9tKVxuICAgICAgICAvLyAgICAgYW5kIFNUX0ludGVyc2VjdHModC5nZW9tLCB0YS5nZW9tKVxuICAgICAgICAvLyAgIClcbiAgICAgICAgLy8gICAsIHRjIGFzIChcbiAgICAgICAgLy8gICAgIHNlbGVjdCBpZCBmcm9tIHRiXG4gICAgICAgIC8vICAgKVxuICAgICAgICAvLyAgIHNlbGVjdCBkaXN0aW5jdCBpZCBmcm9tIHRjYDtcbiAgICAgICAgLy8gICBpZHMgPSBhd2FpdCBwZ1xuICAgICAgICAvLyAgICAgLnF1ZXJ5KHNxbCwgW2lkXSlcbiAgICAgICAgLy8gICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIC8vICAgICAgIHJldHVybiByZXMucm93cy5tYXAocm93ID0+ICtyb3dbJ2lkJ10pO1xuICAgICAgICAvLyAgICAgfSlcbiAgICAgICAgLy8gICA7XG4gICAgICAgIC8vICAgZHVtcElkcyA9IExvZGFzaC51bmlxKGlkcyk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgY29uc29sZS5sb2coZHVtcElkcyk7XG4gICAgICAgIGlmIChkdW1wSWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBzcWwgPSBgaW5zZXJ0IGludG8gJHt0aGlzLiNsaW5lVG9wb30gKGlkLCBkdW1wX2lkcykgXG4gICAgICAgICAgdmFsdWVzICgkMTo6YmlnaW50LCAkMjo6YmlnaW50W10pIFxuICAgICAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBkdW1wX2lkcyA9IGV4Y2x1ZGVkLmR1bXBfaWRzYDtcbiAgICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZCwgYHske2R1bXBJZHMuam9pbignLCcpfX1gXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gdGhyb3cgbmV3IEVycm9yKGB0b3BvIGVkZ2UjJHtpZH0gZG9zZSBub3QgbWF0aCBhbnkgZHVtcCBsaW5lc2ApO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0+IHRvcG8gZWRnZSMke2lkfSBkb3NlIG5vdCBtYXRoIGFueSBkdW1wIGxpbmVzYCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGAjJHtzdGFydElkfSAtICMke25leHRJZH1gKTtcbiAgICAgIHN0YXJ0SWQgPSBuZXh0SWQ7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2FsY0R1bXAyVG9wb0VkZ2UocGcsIGR1bXBJZCwgdG9sKSB7XG4gICAgbGV0IHNxbDtcbiAgICBzcWwgPSBgd2l0aCBcbiAgICB0YSBhcyAoXG4gICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGhpcy4jbGluZUR1bXB9IHdoZXJlIGlkID0gJDFcbiAgICApXG4gICAgLCB0YiBhcyAoXG4gICAgICBzZWxlY3QgdC5pZCBhcyBpZCBmcm9tICR7dGhpcy4jbGluZVRvcG99IGFzIHQsIHRhIFxuICAgICAgd2hlcmUgKHQuZ2VvbSAmJiB0YS5nZW9tKSBhbmQgU1RfRGlzdGFuY2UodC5nZW9tLCB0YS5nZW9tKSA8ICQyXG4gICAgKVxuICAgIHNlbGVjdCBkaXN0aW5jdCBpZCBmcm9tIHRiYDtcbiAgICBjb25zdCB0b3BvSWRzID0gYXdhaXQgcGcucXVlcnkoc3FsLCBbZHVtcElkLCB0b2xdKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzLm1hcChyb3cgPT4gK3Jvd1snaWQnXSk7XG4gICAgICB9KVxuICAgIDtcbiAgICBzcWwgPSBgc2VsZWN0IFNUX0FzSEVYRVdLQihnZW9tKSBhcyBnZW9tIGZyb20gJHt0aGlzLiNsaW5lRHVtcH0gd2hlcmUgaWQgPSAkMWA7XG4gICAgY29uc3QgZ2VvbUR1bXAgPSBhd2FpdCBwZy5xdWVyeShzcWwsIFtkdW1wSWRdKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzWzBdWydnZW9tJ107XG4gICAgICB9KVxuICAgIDtcbiAgICBjb25zdCBpZHMgPSBbXTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHRvcG9JZCBvZiB0b3BvSWRzKSB7XG4gICAgICBzcWwgPSBgc2VsZWN0IFNUX0FzSEVYRVdLQihnZW9tKSBhcyBnZW9tIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gd2hlcmUgaWQgPSAkMWA7XG4gICAgICBjb25zdCBnZW9tVG9wbyA9IGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW3RvcG9JZF0pXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5yb3dzWzBdWydnZW9tJ107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICAvLyDmr5TovoPot53nprtcbiAgICAgIHNxbCA9IGB3aXRoIFxuICAgICAgdGEgYXMgKFxuICAgICAgICBzZWxlY3QgKFNUX0R1bXBQb2ludHMoJDE6Omdlb21ldHJ5KSkuZ2VvbSBhcyBnZW9tXG4gICAgICApXG4gICAgICAsIHRiIGFzIChcbiAgICAgICAgc2VsZWN0IFNUX0Rpc3RhbmNlKCQyOjpnZW9tZXRyeSwgZ2VvbSkgYXMgZGlzdGFuY2UgZnJvbSB0YVxuICAgICAgKVxuICAgICAgc2VsZWN0IG1heChkaXN0YW5jZSkgYXMgbWF4X2Rpc3RhbmNlIGZyb20gdGJgO1xuICAgICAgY29uc3QgbWF4RGlzdGFuY2UgPSBhd2FpdCBwZy5xdWVyeShzcWwsIFtnZW9tVG9wbywgZ2VvbUR1bXBdKVxuICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgIHJldHVybiArcmVzLnJvd3NbMF1bJ21heF9kaXN0YW5jZSddXG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBpZiAobWF4RGlzdGFuY2UgPCB0b2wpIHtcbiAgICAgICAgaWRzLnB1c2godG9wb0lkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlkcztcbiAgfVxuXG5cbiAgYXN5bmMgY2FsY0R1bXAyVG9wb0VkZ2VzKHBnLCB0b2wpIHtcbiAgICBsZXQgc3FsO1xuICAgIGxldCBzdGFydElkID0gMDtcbiAgICBsZXQgY291bnQ7XG4gICAgY29uc3QgbGltaXQgID0gMTAwO1xuICAgIGxldCBpID0gMDtcblxuICAgIGRvIHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgICAucXVlcnkoYHNlbGVjdCBpZCwgdGFyZ2V0X2lkLCBwYXRoLCB0eXBlLCBjYXRlZ29yeSBmcm9tICR7dGhpcy4jbGluZUR1bXB9IHdoZXJlIGlkID4gJDEgb3JkZXIgYnkgaWQgYXNjIGxpbWl0ICQyYCwgW3N0YXJ0SWQsIGxpbWl0XSlcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBjb3VudCA9IHJvd3MubGVuZ3RoO1xuICAgICAgbGV0IG5leHRJZCA9IDA7XG4gICAgICBjb25zdCB0aGF0ID0gdGhpcztcbiAgICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgY29uc3QgaWQgPSArcm93WydpZCddO1xuICAgICAgICBuZXh0SWQgPSBpZDtcbiAgICAgICAgaSArPSAxO1xuICAgICAgICBhd2FpdCBVdGlscy5jYWxsKGAke3RoaXMuI2xpbmVEdW1wfSDovrkgJHtpfSMke2lkfXwke3Jvd1sndGFyZ2V0X2lkJ119fCR7cm93WydwYXRoJ119IFske3Jvd1sndHlwZSddfXwke3Jvd1snY2F0ZWdvcnknXX1dYCwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHRvcG9JZHMgPSBhd2FpdCB0aGF0LmNhbGNEdW1wMlRvcG9FZGdlKHBnLCBpZCwgdG9sKTtcbiAgICAgICAgICBpZiAodG9wb0lkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0b3BvSWRzKTtcbiAgICAgICAgICAgIHNxbCA9IGBpbnNlcnQgaW50byAke3RoYXQuI2xpbmVEdW1wfSAoaWQsIHRvcG9faWRzKSBcbiAgICAgICAgICAgIHZhbHVlcyAoJDE6OmJpZ2ludCwgJDI6OmJpZ2ludFtdKSBcbiAgICAgICAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCB0b3BvX2lkcyA9IGV4Y2x1ZGVkLnRvcG9faWRzYDtcbiAgICAgICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkLCBgeyR7dG9wb0lkcy5qb2luKCcsJyl9fWBdKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYD09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT4g5peg5ouT5omR5YWz57O7YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGAjJHtzdGFydElkfSAtICMke25leHRJZH1gKTtcbiAgICAgIHN0YXJ0SWQgPSBuZXh0SWQ7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2hlY2tEdXBsaWNhdGVFZGdlKHBnLCBpZCkge1xuICAgIGxldCBzcWw7XG4gICAgc3FsID0gYHdpdGggXG4gICAgdGEgYXMgKFxuICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoaXMuI2xpbmVUb3BvfSB3aGVyZSBpZCA9ICQxXG4gICAgKVxuICAgIHNlbGVjdCB0LmlkIGFzIGlkIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gYXMgdCwgdGEgIFxuICAgIHdoZXJlIHQuaWQgPiAkMSBhbmQgKHQuZ2VvbSAmJiB0YS5nZW9tIGFuZCBTVF9JbnRlcnNlY3RzKHQuZ2VvbSwgdGEuZ2VvbSkpIFxuICAgIGFuZCAoU1RfRXF1YWxzKHQuZ2VvbSwgdGEuZ2VvbSkgb3IgU1RfRXF1YWxzKFNUX1JldmVyc2UodC5nZW9tKSwgdGEuZ2VvbSkpYDtcbiAgICBjb25zdCB0aGVJZHMgPSBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZF0pXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICByZXR1cm4gcmVzLnJvd3MubWFwKHJvdyA9PiArcm93WydpZCddKTtcbiAgICAgIH0pXG4gICAgO1xuICAgIGZvciBhd2FpdCAoY29uc3QgdGhlSWQgb2YgdGhlSWRzKSB7XG4gICAgICAvLyDnm7jnrYnnmoQg5Y+v5Lul5Yig6ZmkXG4gICAgICBzcWwgPSBgZGVsZXRlIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gd2hlcmUgaWQgPSAkMWA7XG4gICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFt0aGVJZF0pO1xuICAgICAgY29uc29sZS5sb2coYD09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT4gZGVsZXRlICMke2lkfSByZXZlcnNlIGR1cGxpY2F0ZSBlZGdlIyR7dGhlSWR9YCk7XG4gICAgfVxuICB9XG5cblxuICBhc3luYyBjaGVja0NvbGxhcHNlRWRnZShwZywgaWQpIHtcbiAgICBsZXQgc3FsO1xuICAgIHNxbCA9IGB3aXRoIFxuICAgIHRhIGFzIChcbiAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gd2hlcmUgaWQgPSAkMVxuICAgIClcbiAgICAsIHRiIGFzIChcbiAgICAgIHNlbGVjdCB0LmlkIGFzIGlkLCBTVF9JbnRlcnNlY3Rpb24odC5nZW9tLCB0YS5nZW9tKSBhcyBnZW9tIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gYXMgdCwgdGEgXG4gICAgICB3aGVyZSB0LmlkID4gJDEgYW5kICh0Lmdlb20gJiYgdGEuZ2VvbSBhbmQgU1RfSW50ZXJzZWN0cyh0Lmdlb20sIHRhLmdlb20pKVxuICAgIClcbiAgICBzZWxlY3QgaWQgZnJvbSB0YiB3aGVyZSBTVF9HZW9tZXRyeVR5cGUoZ2VvbSkgbm90IGluICgnU1RfUG9pbnQnLCAnU1RfTXVsdGlQb2ludCcpIGFuZCBTVF9OUG9pbnRzKGdlb20pID4gMGA7XG4gICAgY29uc3QgdGhlSWRzID0gYXdhaXQgcGcucXVlcnkoc3FsLCBbaWRdKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzLm1hcChyb3cgPT4gK3Jvd1snaWQnXSk7XG4gICAgICB9KVxuICAgIDtcbiAgICBpZiAodGhlSWRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKGA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0+IGVkZ2UgIyR7aWR9IGNvbGxhcHNlZCB3aXRoIGVkZ2VzOmAsIHRoZUlkcyk7XG4gICAgICBhd2FpdCB0aGlzLmZpeENvbGxhcHNlRWRnZShwZywgaWQsIHRoZUlkcyk7XG4gICAgfVxuICB9XG5cblxuICBhc3luYyBjaGVja0R1cGxpY2F0ZUVkZ2VzKHBnKSB7XG4gICAgbGV0IHN0YXJ0SWQgPSAxIC0gMTtcbiAgICBsZXQgY291bnQ7XG4gICAgY29uc3QgbGltaXQgID0gMjAwMDtcbiAgICBkbyB7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgICAgLnF1ZXJ5KGBzZWxlY3QgaWQgZnJvbSAke3RoaXMuI2xpbmVUb3BvfSB3aGVyZSBpZCA+ICQxIG9yZGVyIGJ5IGlkIGFzYyBsaW1pdCAkMmAsIFtzdGFydElkLCBsaW1pdF0pXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgICAgY291bnQgPSByb3dzLmxlbmd0aDtcbiAgICAgIGxldCBuZXh0SWQgPSAwO1xuICAgICAgaWYgKGNvdW50ID4gMCkge1xuICAgICAgICBuZXh0SWQgPSByb3dzW2NvdW50IC0gMV1bJ2lkJ107XG4gICAgICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgICAgICBhd2FpdCBVdGlscy5jYWxsKGAjJHtzdGFydElkfSAtICMke25leHRJZH1gLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgY29uc3QgaWQgPSArcm93WydpZCddO1xuICAgICAgICAgICAgYXdhaXQgdGhhdC5jaGVja0R1cGxpY2F0ZUVkZ2UocGcsIGlkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgc3RhcnRJZCA9IG5leHRJZDtcbiAgICB9IHdoaWxlIChjb3VudCA+IDApO1xuICB9XG5cblxuICBhc3luYyB0b3BvU25hcEVkZ2VzKHBnLCB0b2wpIHtcbiAgICBsZXQgc3RhcnRJZCA9IDEgLSAxO1xuICAgIGxldCBjb3VudDtcbiAgICBjb25zdCBsaW1pdCAgPSAyMDAwO1xuICAgIGRvIHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgICAucXVlcnkoYHNlbGVjdCBpZCBmcm9tICR7dGhpcy4jbGluZVRvcG99IHdoZXJlIGlkID4gJDEgb3JkZXIgYnkgaWQgYXNjIGxpbWl0ICQyYCwgW3N0YXJ0SWQsIGxpbWl0XSlcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBjb3VudCA9IHJvd3MubGVuZ3RoO1xuICAgICAgbGV0IG5leHRJZCA9IDA7XG4gICAgICBpZiAoY291bnQgPiAwKSB7XG4gICAgICAgIG5leHRJZCA9IHJvd3NbY291bnQgLSAxXVsnaWQnXTtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgICAgIGF3YWl0IFV0aWxzLmNhbGwoYCMke3N0YXJ0SWR9IC0gIyR7bmV4dElkfWAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgICAgICBjb25zdCBpZCA9ICtyb3dbJ2lkJ107XG4gICAgICAgICAgICBhd2FpdCB0aGF0LnRvcG9TbmFwRWRnZShwZywgaWQsIHRvbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHN0YXJ0SWQgPSBuZXh0SWQ7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG5cbiAgYXN5bmMgdG9wb1NuYXBFZGdlKHBnLCBpZCwgdG9sKSB7XG4gICAgbGV0IGdlb207XG4gICAgZ2VvbSA9IGF3YWl0IHBnXG4gICAgICAucXVlcnkoYHNlbGVjdCBTVF9Bc0hFWEVXS0IoZ2VvbSkgYXMgZ2VvbSBmcm9tICR7dGhpcy4jbGluZVRvcG99IHdoZXJlIGlkID0gJDFgLCBbaWRdKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzWzBdWydnZW9tJ107XG4gICAgICB9KVxuICAgIDtcblxuICAgIGdlb20gPSBhd2FpdCBVdGlscy5jYWxsKGB0b3BvIyR7aWR9ID09PT0+IFJlcGVhdGVkLXBvaW50IHJlbW92ZWRgLCBhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gYXdhaXQgTGliTFdHZW9tLnJlbW92ZVJlcGVhdGVkUG9pbnRzKHBnLCBnZW9tLCB0b2wpO1xuICAgIH0pO1xuICAgIGdlb20gPSBhd2FpdCBVdGlscy5jYWxsKGB0b3BvIyR7aWR9ID09PT0+IFNlbGYtbm9kZWAsIGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBhd2FpdCBMaWJMV0dlb20ubm9kZShwZywgZ2VvbSk7XG4gICAgfSk7XG5cblxuICB9XG5cblxuICBhc3luYyBjaGVja0NvbGxhcHNlRWRnZXMocGcpIHtcbiAgICBsZXQgc3RhcnRJZCA9IDEgLSAxO1xuICAgIGxldCBjb3VudDtcbiAgICBjb25zdCBsaW1pdCAgPSAyMDAwO1xuICAgIGRvIHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgICAucXVlcnkoYHNlbGVjdCBpZCBmcm9tICR7dGhpcy4jbGluZVRvcG99IHdoZXJlIGlkID4gJDEgb3JkZXIgYnkgaWQgYXNjIGxpbWl0ICQyYCwgW3N0YXJ0SWQsIGxpbWl0XSlcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBjb3VudCA9IHJvd3MubGVuZ3RoO1xuICAgICAgbGV0IG5leHRJZCA9IDA7XG4gICAgICBpZiAoY291bnQgPiAwKSB7XG4gICAgICAgIG5leHRJZCA9IHJvd3NbY291bnQgLSAxXVsnaWQnXTtcbiAgICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgICAgIGF3YWl0IFV0aWxzLmNhbGwoYCMke3N0YXJ0SWR9IC0gIyR7bmV4dElkfWAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgICAgICBjb25zdCBpZCA9ICtyb3dbJ2lkJ107XG4gICAgICAgICAgICBhd2FpdCB0aGF0LmNoZWNrQ29sbGFwc2VFZGdlKHBnLCBpZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHN0YXJ0SWQgPSBuZXh0SWQ7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG4gIGFzeW5jIGZpeENvbGxhcHNlRWRnZShwZywgaWQsIHRoZUlkcykge1xuICAgIC8vIOa4heepunRtcOihqFxuICAgIGxldCBzcWw7XG4gICAgLy8g5LuOdG9wb+WPluWHuuadpeWGmeWFpXRvcG9cbiAgICBzcWwgPSBgd2l0aCBcbiAgICB0YSBhcyAoXG4gICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGhpcy4jbGluZUR1bXB9IHdoZXJlIGlkID0gJDFcbiAgICAgIHVuaW9uIGFsbCBcbiAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gd2hlcmUgaWQgaW4gKCR7dGhlSWRzLmpvaW4oJywgJyl9KVxuICAgIClcbiAgICAsIHRiIGFzIChcbiAgICAgIHNlbGVjdCBTVF9VbmlvbihnZW9tKSBhcyBnZW9tIGZyb20gdGFcbiAgICApXG4gICAgLCB0YyBhcyAoXG4gICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tIHRiXG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7dGhpcy4jbGluZVRvcG99IChnZW9tKSBcbiAgICBzZWxlY3QgZ2VvbSBmcm9tIHRjYDtcbiAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZF0pO1xuXG4gICAgLy8g5Yig6Zmk5Y6f5pyJ55qEXG4gICAgYXdhaXQgcGcucXVlcnkoYGRlbGV0ZSBmcm9tICR7dGhpcy4jbGluZVRvcG99IHdoZXJlIGlkIGluICgke1tpZCwgLi4udGhlSWRzXS5qb2luKCcsICcpfSlgKTtcbiAgICBjb25zb2xlLmxvZyhgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PiByZS1jYWxjIGludGVyc2VjdHMgZWRnZXM6YCwgW2lkLCAuLi50aGVJZHNdKTtcbiAgfVxuXG5cblxuICBhc3luYyBjYWxjRWRnZShwZywgaWQpIHtcbiAgICBsZXQgc3FsO1xuICAgIC8vIOS7jmR1bXDlj5blh7rmnaXlhpnlhaV0b3BvXG4gICAgc3FsID0gYHdpdGggXG4gICAgdGEgYXMgKFxuICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoaXMuI2xpbmVEdW1wfSB3aGVyZSBpZCA9ICQxXG4gICAgKVxuICAgIHNlbGVjdCB0LmlkIGFzIGlkIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gYXMgdCwgdGEgXG4gICAgd2hlcmUgKHQuZ2VvbSAmJiB0YS5nZW9tKSBhbmQgU1RfSW50ZXJzZWN0cyh0Lmdlb20sIHRhLmdlb20pIFxuICAgIGFuZCBTVF9OUG9pbnRzKFNUX0ludGVyc2VjdGlvbih0Lmdlb20sIHRhLmdlb20pKSA+IDBgO1xuICAgIGNvbnN0IHRoZUlkcyA9IGF3YWl0IHBnXG4gICAgICAucXVlcnkoc3FsLCBbaWRdKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzLm1hcChyb3cgPT4gK3Jvd1snaWQnXSk7XG4gICAgICB9KVxuICAgIDtcbiAgICBjb25zb2xlLmxvZyh0aGVJZHMpO1xuICAgIGlmICh0aGVJZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhg5peg5Lqk6ZuG77yM55u05o6l5o+S5YWlYCk7XG4gICAgICBzcWwgPSBgd2l0aCBcbiAgICAgIHRhIGFzIChcbiAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoaXMuI2xpbmVEdW1wfSB3aGVyZSBpZCA9ICQxXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke3RoaXMuI2xpbmVUb3BvfSAoZ2VvbSkgXG4gICAgICBzZWxlY3QgZ2VvbSBmcm9tIHRhIFxuICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IGdlb20gPSBleGNsdWRlZC5nZW9tYDtcbiAgICAgIHJldHVybiBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZF0pO1xuICAgIH1cbiAgICBzcWwgPSBgc2VsZWN0IFNUX0FzSEVYRVdLQihnZW9tKSBhcyBnZW9tIGZyb20gJHt0aGlzLiNsaW5lRHVtcH0gd2hlcmUgaWQgPSAkMWA7XG4gICAgY29uc3QgZ2VvbUR1bXAgPSBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZF0pLnRoZW4ocmVzID0+IHJlcy5yb3dzWzBdWydnZW9tJ10pO1xuICAgIGxldCBnZW9tRHVtcFRtcCA9IGdlb21EdW1wO1xuICAgIGNvbnN0IGdlb21Qb2ludHMgPSBbXTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHRoZUlkIG9mIHRoZUlkcykge1xuICAgICAgc3FsID0gYHNlbGVjdCBTVF9Bc0hFWEVXS0IoZ2VvbSkgYXMgZ2VvbSBmcm9tICR7dGhpcy4jbGluZVRvcG99IHdoZXJlIGlkID0gJDFgO1xuICAgICAgY29uc3QgZ2VvbVRvcG8gPSBhd2FpdCBwZy5xdWVyeShzcWwsIFt0aGVJZF0pLnRoZW4ocmVzID0+IHJlcy5yb3dzWzBdWydnZW9tJ10pO1xuICAgICAgLy8g5Lqk6ZuG55qE6LW35aeL54K55ZKM57uT5p2f54K5XG4gICAgICBzcWwgPSBgd2l0aCBcbiAgICAgIHRhIGFzIChcbiAgICAgICAgc2VsZWN0IFNUX0ludGVyc2VjdGlvbigkMTo6Z2VvbWV0cnksICQyOjpnZW9tZXRyeSkgYXMgZ2VvbVxuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCBnZW9tIGZyb20gdGEgXG4gICAgICAgIHdoZXJlIFNUX0dlb21ldHJ5VHlwZShnZW9tKSBpbiAoJ1NUX1BvaW50JywgJ1NUX011bHRpUG9pbnQnKSBcbiAgICAgICAgdW5pb24gYWxsIFxuICAgICAgICBzZWxlY3QgU1RfTGluZU1lcmdlKGdlb20pIGFzIGdlb20gZnJvbSB0YSBcbiAgICAgICAgd2hlcmUgU1RfR2VvbWV0cnlUeXBlKGdlb20pIG5vdCBpbiAoJ1NUX1BvaW50JywgJ1NUX011bHRpUG9pbnQnKSBcbiAgICAgIClcbiAgICAgICwgdGMgYXMgKFxuICAgICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tIHRiIHdoZXJlIGdlb20gaXMgbm90IG51bGxcbiAgICAgIClcbiAgICAgICwgdGQgYXMgKFxuICAgICAgICBzZWxlY3QgU1RfQXNIRVhFV0tCKGdlb20pIGFzIGdlb20gZnJvbSB0YyBcbiAgICAgICAgd2hlcmUgU1RfR2VvbWV0cnlUeXBlKGdlb20pIGluICgnU1RfUG9pbnQnLCAnU1RfTXVsdGlQb2ludCcpIFxuICAgICAgICB1bmlvbiBhbGwgXG4gICAgICAgIHNlbGVjdCBTVF9Bc0hFWEVXS0IoU1RfU3RhcnRQb2ludChnZW9tKSkgYXMgZ2VvbSBmcm9tIHRjIFxuICAgICAgICB3aGVyZSBTVF9HZW9tZXRyeVR5cGUoZ2VvbSkgbm90IGluICgnU1RfUG9pbnQnLCAnU1RfTXVsdGlQb2ludCcpIFxuICAgICAgICB1bmlvbiBhbGwgXG4gICAgICAgIHNlbGVjdCBTVF9Bc0hFWEVXS0IoU1RfRW5kUG9pbnQoZ2VvbSkpIGFzIGdlb20gZnJvbSB0Y1xuICAgICAgICB3aGVyZSBTVF9HZW9tZXRyeVR5cGUoZ2VvbSkgbm90IGluICgnU1RfUG9pbnQnLCAnU1RfTXVsdGlQb2ludCcpIFxuICAgICAgKVxuICAgICAgc2VsZWN0IGdlb20gZnJvbSB0ZCB3aGVyZSBnZW9tIGlzIG5vdCBudWxsYDtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZy5xdWVyeShzcWwsIFtnZW9tRHVtcCwgZ2VvbVRvcG9dKVxuICAgICAgICAudGhlbihyZXMgPT4gcmVzLnJvd3MpO1xuICAgICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICBnZW9tUG9pbnRzLnB1c2gocm93WydnZW9tJ10pO1xuICAgICAgfVxuICAgICAgaWYgKHJvd3MubGVuZ3RoID4gMCkge1xuICAgICAgICBzcWwgPSBgd2l0aCBcbiAgICAgICAgdGEgYXMgKFxuICAgICAgICAgIHNlbGVjdCBTVF9JbnRlcnNlY3Rpb24oJDE6Omdlb21ldHJ5LCAkMjo6Z2VvbWV0cnkpIGFzIGdlb21cbiAgICAgICAgKVxuICAgICAgICAsIHRiIGFzIChcbiAgICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tIHRhIFxuICAgICAgICAgIHdoZXJlIFNUX0dlb21ldHJ5VHlwZShnZW9tKSBpbiAoJ1NUX1BvaW50JywgJ1NUX011bHRpUG9pbnQnKSBcbiAgICAgICAgICB1bmlvbiBhbGwgXG4gICAgICAgICAgc2VsZWN0IFNUX0xpbmVNZXJnZShnZW9tKSBhcyBnZW9tIGZyb20gdGEgXG4gICAgICAgICAgd2hlcmUgU1RfR2VvbWV0cnlUeXBlKGdlb20pIG5vdCBpbiAoJ1NUX1BvaW50JywgJ1NUX011bHRpUG9pbnQnKSBcbiAgICAgICAgKVxuICAgICAgICAsIHRjIGFzIChcbiAgICAgICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tIHRiIHdoZXJlIGdlb20gaXMgbm90IG51bGxcbiAgICAgICAgKVxuICAgICAgICAsIHRkIGFzIChcbiAgICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tIHRjIFxuICAgICAgICAgIHdoZXJlIFNUX0dlb21ldHJ5VHlwZShnZW9tKSBpbiAoJ1NUX1BvaW50JywgJ1NUX011bHRpUG9pbnQnKSBcbiAgICAgICAgICB1bmlvbiBhbGwgXG4gICAgICAgICAgc2VsZWN0IFNUX1N0YXJ0UG9pbnQoZ2VvbSkgYXMgZ2VvbSBmcm9tIHRjIFxuICAgICAgICAgIHdoZXJlIFNUX0dlb21ldHJ5VHlwZShnZW9tKSBub3QgaW4gKCdTVF9Qb2ludCcsICdTVF9NdWx0aVBvaW50JykgXG4gICAgICAgICAgdW5pb24gYWxsIFxuICAgICAgICAgIHNlbGVjdCBTVF9FbmRQb2ludChnZW9tKSBhcyBnZW9tIGZyb20gdGNcbiAgICAgICAgICB3aGVyZSBTVF9HZW9tZXRyeVR5cGUoZ2VvbSkgbm90IGluICgnU1RfUG9pbnQnLCAnU1RfTXVsdGlQb2ludCcpIFxuICAgICAgICApXG4gICAgICAgICwgdGUgYXMgKFxuICAgICAgICAgIHNlbGVjdCBTVF9SZW1vdmVSZXBlYXRlZFBvaW50cyhTVF9Db2xsZWN0KGdlb20pKSBhcyBnZW9tIGZyb20gdGRcbiAgICAgICAgKVxuICAgICAgICAsIHRmIGFzIChcbiAgICAgICAgICBzZWxlY3QgU1RfU3BsaXQoJDI6Omdlb21ldHJ5LCBnZW9tKSBhcyBnZW9tIGZyb20gdGVcbiAgICAgICAgKVxuICAgICAgICAsIHRnIGFzIChcbiAgICAgICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tIHRmXG4gICAgICAgIClcbiAgICAgICAgaW5zZXJ0IGludG8gJHt0aGlzLiNsaW5lVG9wb30gKGdlb20pIFxuICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tIHRnYDtcbiAgICAgICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbZ2VvbUR1bXAsIGdlb21Ub3BvXSk7XG4gICAgICB9XG4gICAgICBzcWwgPSBgc2VsZWN0IFNUX0FzSEVYRVdLQihTVF9EaWZmZXJlbmNlKCQxOjpnZW9tZXRyeSwgJDI6Omdlb21ldHJ5KSkgYXMgZ2VvbWA7XG4gICAgICBnZW9tRHVtcFRtcCA9IGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2dlb21EdW1wVG1wLCBnZW9tVG9wb10pXG4gICAgICAgIC50aGVuKHJlcyA9PiByZXMucm93c1swXVsnZ2VvbSddKTtcbiAgICB9XG4gICAgY29uc3QgZ2VvbU5vZGVzID0gTG9kYXNoLnVuaXEoZ2VvbVBvaW50cyk7XG4gICAgaWYgKGdlb21Ob2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKGDkuqTpm4bmmK/otbflp4vngrnmiJbnu5PmnZ/ngrksIOebtOaOpeaPkuWFpWApO1xuICAgICAgc3FsID0gYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0aGlzLiNsaW5lRHVtcH0gd2hlcmUgaWQgPSAkMVxuICAgICAgKVxuICAgICAgaW5zZXJ0IGludG8gJHt0aGlzLiNsaW5lVG9wb30gKGdlb20pIFxuICAgICAgc2VsZWN0IGdlb20gZnJvbSB0YSBcbiAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgICByZXR1cm4gYXdhaXQgcGcucXVlcnkoc3FsLCBbaWRdKTtcbiAgICB9XG4gICAgLy8g5pyA5ZCO5o+S5YWl5Ymp5LiL55qEXG4gICAgaWYgKGdlb21EdW1wVG1wICE9PSBudWxsKSB7XG4gICAgICBzcWwgPSBgaW5zZXJ0IGludG8gJHt0aGlzLiNsaW5lVG9wb30gKGdlb20pIFxuICAgICAgdmFsdWVzICgkMTo6Z2VvbWV0cnkpYDtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2dlb21EdW1wVG1wXSk7XG4gICAgfVxuXG4gICAgLy8g5Yig6Zmk5Y6f5pyJ55qEXG4gICAgYXdhaXQgcGcucXVlcnkoYGRlbGV0ZSBmcm9tICR7dGhpcy4jbGluZVRvcG99IHdoZXJlIGlkIGluICgke3RoZUlkcy5qb2luKCcsICcpfSlgKTtcbiAgfVxuXG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBMaWJUb3BvTGluZTsiXX0=