'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Utils = _interopRequireDefault(require("./../../modules/Utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }

var id = 0;

function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }

class LibTopology {
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

  async initDumpTable(pg) {
    try {
      await pg.query(`drop table ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} cascade`);
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
  }

  async dumpJuncture(pg, id, type) {
    const fromTable = 'boundary.line';
    const toTable = `${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]}`;
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
      st_npoints(geom) as points, st_length(geom) as length from te order by path asc`, [id, type, category]);
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
    const toTable = `${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]}`;
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
      st_npoints(geom) as points, st_length(geom) as length from te order by path asc`, [id, type, category]);
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
      const theId = 0;

      for await (const row of rows) {
        const id = +row['id'];
        nextId = id;

        if (id < theId) {
          continue;
        }

        await _Utils.default.call(`计算边 ${id}|${row['target_id']}|${row['path']} [${row['type']}|${row['category']}]`, async () => {
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
        await _Utils.default.call(`检查边 ${i}#${id}`, async () => {
          const sql = `with 
          ta as (
            select geom from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} where id = $1
          )
          , tb as (
            select t.id as id, ST_Intersection(t.geom, ta.geom) as geom from ${_classPrivateFieldLooseBase(that, _lineTopo)[_lineTopo]} as t right join ta 
            on (t.geom && ta.geom and ST_Intersects(t.geom, ta.geom))
            where t.id != $1
          )
          select id from tb where ST_GeometryType(geom) not in ('ST_Point', 'ST_MultiPoint')`;
          const res = await pg.query(sql, [id]).then(res => {
            return res.rows || [];
          });
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
    return await pg.query(`select st_asText(geom) as wkt from ${_classPrivateFieldLooseBase(this, _lineDump)[_lineDump]} where id = $1`, [id]).then(res => {
      const row = res.rows[0] || {};
      return row['wkt'] || '';
    });
  }

  async calcEdge(pg, id) {
    // 从dump取出来写入topo
    const wkt = await this.getLineDumpGeomWkt(pg, id);
    const sql1 = `select id from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where geom && ST_GeomFromText($1, 4326) 
    and st_intersects(geom, ST_GeomFromText($1, 4326))`;
    const rows1 = await pg.query(sql1, [wkt]).then(res => {
      return res.rows || [];
    });
    const intersectIds = rows1.map(row => +row['id']);
    console.log(intersectIds);

    if (intersectIds.length === 0) {
      console.log(`无交集，直接插入`);
      return await pg.query(`insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} (geom) 
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
        )`, [wkt]);
    }

    const sql2 = `with 
    ta as (
      select id, geom from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id in (${intersectIds.join(', ')})
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
    insert into ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} (geom) 
    select geom from tg`;
    await pg.query(sql2, [wkt]); // 删除原有的

    await pg.query(`delete from ${_classPrivateFieldLooseBase(this, _lineTopo)[_lineTopo]} where id in (${intersectIds.join(', ')})`);
  }

}

var _lineDumpSchema = _classPrivateFieldLooseKey("lineDumpSchema");

var _lineDumpTable = _classPrivateFieldLooseKey("lineDumpTable");

var _lineDump = _classPrivateFieldLooseKey("lineDump");

var _lineTopoSchema = _classPrivateFieldLooseKey("lineTopoSchema");

var _lineTopoTable = _classPrivateFieldLooseKey("lineTopoTable");

var _lineTopo = _classPrivateFieldLooseKey("lineTopo");

var _default = LibTopology;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC10b3BvbG9neS9MaWJUb3BvbG9neS5qcyJdLCJuYW1lcyI6WyJMaWJUb3BvbG9neSIsImNvbnN0cnVjdG9yIiwibGluZUR1bXBTY2hlbWEiLCJsaW5lRHVtcFRhYmxlIiwibGluZVRvcG9TY2hlbWEiLCJsaW5lVG9wb1RhYmxlIiwiaW5pdER1bXBUYWJsZSIsInBnIiwicXVlcnkiLCJlIiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImR1bXBKdW5jdHVyZSIsImlkIiwidHlwZSIsImZyb21UYWJsZSIsInRvVGFibGUiLCJjYXRlZ29yeSIsImdldEZvcmVpZ25MaXN0IiwidGFibGUiLCJzcWwiLCJyZXMiLCJsaXN0Iiwicm93Iiwicm93cyIsInB1c2giLCJuYW1lIiwiZHVtcENvYXN0bGluZSIsImluaXRUb3BvVGFibGUiLCJjYWxjRWRnZXMiLCJzdGFydElkIiwiY291bnQiLCJsaW1pdCIsInRoZW4iLCJsZW5ndGgiLCJuZXh0SWQiLCJ0aGF0IiwidGhlSWQiLCJVdGlscyIsImNhbGwiLCJjYWxjRWRnZSIsImxvZyIsImNoZWNrRWRnZXMiLCJpIiwiaXRlbXMiLCJtYXAiLCJpdGVtIiwiZ2V0TGluZUR1bXBHZW9tV2t0Iiwid2t0Iiwic3FsMSIsInJvd3MxIiwiaW50ZXJzZWN0SWRzIiwic3FsMiIsImpvaW4iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBRUE7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxXQUFOLENBQWtCO0FBVWhCQyxFQUFBQSxXQUFXLENBQUNDLGNBQUQsRUFBaUJDLGFBQWpCLEVBQWdDQyxjQUFoQyxFQUFnREMsYUFBaEQsRUFBK0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDeEUsMEVBQXVCSCxjQUF2QjtBQUNBLHdF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NkJBQUQsNEJBRVksSUFGWix1QkFFMkIsaUJBQWdCRCxZQUFZLENBQUNFLElBQWIsQ0FBa0IsSUFBbEIsQ0FBd0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztrQkFGbkUsNEJBd0RDLElBeERELHVCQXdEZ0I7d0JBeEQ3QjtBQTBEQSxVQUFNL0MsRUFBRSxDQUFDQyxLQUFILENBQVM2QyxJQUFULEVBQWUsQ0FBQ0osR0FBRCxDQUFmLENBQU4sQ0F6RnFCLENBMkZyQjs7QUFDQSxVQUFNMUMsRUFBRSxDQUFDQyxLQUFILENBQVUsZUFBRCw0QkFBZSxJQUFmLHVCQUE4QixpQkFBZ0I0QyxZQUFZLENBQUNFLElBQWIsQ0FBa0IsSUFBbEIsQ0FBd0IsR0FBL0UsQ0FBTjtBQUNEOztBQWxVZTs7Ozs7Ozs7Ozs7Ozs7ZUF1VUh0RCxXIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgVXRpbHMgZnJvbSAnLi8uLi8uLi9tb2R1bGVzL1V0aWxzJztcblxuY2xhc3MgTGliVG9wb2xvZ3kge1xuXG4gICNsaW5lRHVtcFNjaGVtYTtcbiAgI2xpbmVEdW1wVGFibGU7XG4gICNsaW5lRHVtcDtcblxuICAjbGluZVRvcG9TY2hlbWE7XG4gICNsaW5lVG9wb1RhYmxlO1xuICAjbGluZVRvcG87XG5cbiAgY29uc3RydWN0b3IobGluZUR1bXBTY2hlbWEsIGxpbmVEdW1wVGFibGUsIGxpbmVUb3BvU2NoZW1hLCBsaW5lVG9wb1RhYmxlKSB7XG4gICAgdGhpcy4jbGluZUR1bXBTY2hlbWEgPSBsaW5lRHVtcFNjaGVtYTtcbiAgICB0aGlzLiNsaW5lRHVtcFRhYmxlID0gbGluZUR1bXBUYWJsZTtcbiAgICB0aGlzLiNsaW5lRHVtcCA9IGAke2xpbmVEdW1wU2NoZW1hfS4ke2xpbmVEdW1wVGFibGV9YDtcblxuICAgIHRoaXMuI2xpbmVUb3BvU2NoZW1hID0gbGluZVRvcG9TY2hlbWE7XG4gICAgdGhpcy4jbGluZVRvcG9UYWJsZSA9IGxpbmVUb3BvVGFibGU7XG4gICAgdGhpcy4jbGluZVRvcG8gPSBgJHtsaW5lVG9wb1NjaGVtYX0uJHtsaW5lVG9wb1RhYmxlfWA7XG4gIH1cblxuXG4gIGFzeW5jIGluaXREdW1wVGFibGUocGcpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYGRyb3AgdGFibGUgJHt0aGlzLiNsaW5lRHVtcH0gY2FzY2FkZWApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSB0YWJsZSBpZiBub3QgZXhpc3RzICR7dGhpcy4jbGluZUR1bXB9XG4gICAgKFxuICAgICAgICBpZCBiaWdzZXJpYWwgcHJpbWFyeSBrZXksXG4gICAgICAgIHRhcmdldF9pZCBiaWdpbnQsXG4gICAgICAgIHBhdGggaW50LFxuICAgICAgICB0eXBlIHZhcmNoYXIsXG4gICAgICAgIGNhdGVnb3J5IHZhcmNoYXIsXG4gICAgICAgIHBvaW50cyBpbnRlZ2VyLFxuICAgICAgICBsZW5ndGggZmxvYXQsXG4gICAgICAgIGdlb20gZ2VvbWV0cnksXG4gICAgICAgIGNvbnN0cmFpbnQgZW5mb3JjZV9zcmlkX2dlb20gY2hlY2sgKHN0X3NyaWQoZ2VvbSkgPSA0MzI2KVxuICAgIClgKTtcbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIGluZGV4ICR7dGhpcy4jbGluZUR1bXBTY2hlbWF9XyR7dGhpcy4jbGluZUR1bXBUYWJsZX1fZ2VvbV9pZHggb24gJHt0aGlzLiNsaW5lRHVtcH0gdXNpbmcgZ2lzdCAoZ2VvbSlgKTtcbiAgfVxuXG5cbiAgYXN5bmMgZHVtcEp1bmN0dXJlKHBnLCBpZCwgdHlwZSkge1xuICAgIGNvbnN0IGZyb21UYWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCB0b1RhYmxlID0gYCR7dGhpcy4jbGluZUR1bXB9YDtcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdqdW5jdHVyZSc7XG4gICAgYXdhaXQgcGcucXVlcnkoYGRlbGV0ZSBmcm9tICR7dG9UYWJsZX0gd2hlcmUgdGFyZ2V0X2lkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsIFtpZCwgdHlwZSwgY2F0ZWdvcnldKTtcblxuICAgIGF3YWl0IHBnLnF1ZXJ5KGB3aXRoIFxuICAgICAgdGEgYXMgKFxuICAgICAgICBzZWxlY3QgKHN0X2R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tICR7ZnJvbVRhYmxlfVxuICAgICAgICB3aGVyZSBpZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNcbiAgICAgIClcbiAgICAgICwgdGIgYXMgKFxuICAgICAgICBzZWxlY3QgU1RfTm9kZShTVF9SZW1vdmVSZXBlYXRlZFBvaW50cyhnZW9tKSkgYXMgZ2VvbSBmcm9tIHRhXG4gICAgICApXG4gICAgICAsIHRjIGFzIChcbiAgICAgICAgc2VsZWN0IChzdF9kdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSB0YlxuICAgICAgKVxuICAgICAgLCB0ZCBhcyAoXG4gICAgICAgIHNlbGVjdCBzdF9zdWJkaXZpZGUoZ2VvbSwgNDA5NikgYXMgZ2VvbSBmcm9tIHRjXG4gICAgICApXG4gICAgICAsIHRlIGFzIChcbiAgICAgICAgc2VsZWN0ICAocm93X251bWJlcigpIG92ZXIoKSk6OmludGVnZXIgYXMgcGF0aCwgZ2VvbSBmcm9tIHRkXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke3RvVGFibGV9ICh0YXJnZXRfaWQsIHBhdGgsIHR5cGUsIGNhdGVnb3J5LCBnZW9tLCBwb2ludHMsIGxlbmd0aCkgXG4gICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyB0YXJnZXRfaWQsIHBhdGgsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCBnZW9tLCBcbiAgICAgIHN0X25wb2ludHMoZ2VvbSkgYXMgcG9pbnRzLCBzdF9sZW5ndGgoZ2VvbSkgYXMgbGVuZ3RoIGZyb20gdGUgb3JkZXIgYnkgcGF0aCBhc2NgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApO1xuICB9XG5cblxuXG4gIHN0YXRpYyBhc3luYyBnZXRGb3JlaWduTGlzdChwZykge1xuICAgIGNvbnN0IHRhYmxlID0gJ2JvdW5kYXJ5Lm1mdyc7XG4gICAgY29uc3Qgc3FsID0gYHNlbGVjdCBpZCwgemhfbmFtZSBmcm9tICR7dGFibGV9IHdoZXJlIGlkID4gOTAwMDAwIG9yZGVyIGJ5IGlkIGFzY2A7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgcGcucXVlcnkoc3FsKTtcbiAgICBjb25zdCBsaXN0ID0gW107XG4gICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2YgcmVzLnJvd3MpIHtcbiAgICAgIGxpc3QucHVzaCh7XG4gICAgICAgIGlkOiArcm93WydpZCddLFxuICAgICAgICBuYW1lOiByb3dbJ3poX25hbWUnXVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBsaXN0O1xuICB9XG5cblxuICBhc3luYyBkdW1wQ29hc3RsaW5lKHBnLCBpZCkge1xuICAgIGNvbnN0IGZyb21UYWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCB0b1RhYmxlID0gYCR7dGhpcy4jbGluZUR1bXB9YDtcbiAgICBjb25zdCB0eXBlID0gJ291dGVyJztcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdjb2FzdGxpbmUnO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSAke3RvVGFibGV9IHdoZXJlIHRhcmdldF9pZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNgLCBbaWQsIHR5cGUsIGNhdGVnb3J5XSk7XG5cbiAgICBhd2FpdCBwZy5xdWVyeShgd2l0aCBcbiAgICAgIHRhIGFzIChcbiAgICAgICAgc2VsZWN0IChzdF9kdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSAke2Zyb21UYWJsZX1cbiAgICAgICAgd2hlcmUgaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzXG4gICAgICApXG4gICAgICAsIHRiIGFzIChcbiAgICAgICAgc2VsZWN0IFNUX05vZGUoU1RfUmVtb3ZlUmVwZWF0ZWRQb2ludHMoZ2VvbSkpIGFzIGdlb20gZnJvbSB0YVxuICAgICAgKVxuICAgICAgLCB0YyBhcyAoXG4gICAgICAgIHNlbGVjdCAoc3RfZHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGJcbiAgICAgIClcbiAgICAgICwgdGQgYXMgKFxuICAgICAgICBzZWxlY3Qgc3Rfc3ViZGl2aWRlKGdlb20sIDQwOTYpIGFzIGdlb20gZnJvbSB0Y1xuICAgICAgKVxuICAgICAgLCB0ZSBhcyAoXG4gICAgICAgIHNlbGVjdCAgKHJvd19udW1iZXIoKSBvdmVyKCkpOjppbnRlZ2VyIGFzIHBhdGgsIGdlb20gZnJvbSB0ZFxuICAgICAgKVxuICAgICAgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSAodGFyZ2V0X2lkLCBwYXRoLCB0eXBlLCBjYXRlZ29yeSwgZ2VvbSwgcG9pbnRzLCBsZW5ndGgpIFxuICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgdGFyZ2V0X2lkLCBwYXRoLCAkMjo6dmFyY2hhciBhcyB0eXBlLCAkMzo6dmFyY2hhciBhcyBjYXRlZ29yeSwgZ2VvbSwgXG4gICAgICBzdF9ucG9pbnRzKGdlb20pIGFzIHBvaW50cywgc3RfbGVuZ3RoKGdlb20pIGFzIGxlbmd0aCBmcm9tIHRlIG9yZGVyIGJ5IHBhdGggYXNjYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcbiAgfVxuXG5cbiAgYXN5bmMgaW5pdFRvcG9UYWJsZShwZykge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgZHJvcCB0YWJsZSAke3RoaXMuI2xpbmVUb3BvfSBjYXNjYWRlYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIHRhYmxlIGlmIG5vdCBleGlzdHMgJHt0aGlzLiNsaW5lVG9wb31cbiAgICAoXG4gICAgICAgIGlkIGJpZ3NlcmlhbCBwcmltYXJ5IGtleSxcbiAgICAgICAgZ2VvbSBnZW9tZXRyeSxcbiAgICAgICAgY29uc3RyYWludCBlbmZvcmNlX3NyaWRfZ2VvbSBjaGVjayAoc3Rfc3JpZChnZW9tKSA9IDQzMjYpXG4gICAgKWApO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgaW5kZXggJHt0aGlzLiNsaW5lVG9wb1NjaGVtYX1fJHt0aGlzLiNsaW5lVG9wb1RhYmxlfV9nZW9tX2lkeCBvbiAke3RoaXMuI2xpbmVUb3BvfSB1c2luZyBnaXN0IChnZW9tKWApO1xuICB9XG5cblxuICBhc3luYyBjYWxjRWRnZXMocGcpIHtcbiAgICBsZXQgc3RhcnRJZCA9IDA7XG4gICAgbGV0IGNvdW50O1xuICAgIGNvbnN0IGxpbWl0ICA9IDEwMDtcbiAgICBkbyB7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgICAgLnF1ZXJ5KGBzZWxlY3QgaWQsIHRhcmdldF9pZCwgcGF0aCwgdHlwZSwgY2F0ZWdvcnkgZnJvbSAke3RoaXMuI2xpbmVEdW1wfSB3aGVyZSBpZCA+ICQxIG9yZGVyIGJ5IGlkIGFzYyBsaW1pdCAkMmAsIFtzdGFydElkLCBsaW1pdF0pXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgICAgY291bnQgPSByb3dzLmxlbmd0aDtcbiAgICAgIGxldCBuZXh0SWQgPSAwO1xuICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgICBjb25zdCB0aGVJZCA9IDA7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgIGNvbnN0IGlkID0gK3Jvd1snaWQnXTtcbiAgICAgICAgbmV4dElkID0gaWQ7XG4gICAgICAgIGlmIChpZCA8IHRoZUlkKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChg6K6h566X6L65ICR7aWR9fCR7cm93Wyd0YXJnZXRfaWQnXX18JHtyb3dbJ3BhdGgnXX0gWyR7cm93Wyd0eXBlJ119fCR7cm93WydjYXRlZ29yeSddfV1gLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhhdC5jYWxjRWRnZShwZywgaWQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGAjJHtzdGFydElkfSAtICMke25leHRJZH1gKTtcbiAgICAgIHN0YXJ0SWQgPSBuZXh0SWQ7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2hlY2tFZGdlcyhwZykge1xuICAgIGxldCBzdGFydElkID0gMDtcbiAgICBsZXQgY291bnQ7XG4gICAgY29uc3QgbGltaXQgID0gMTAwO1xuICAgIGxldCBpID0gMDtcbiAgICBkbyB7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgICAgLnF1ZXJ5KGBzZWxlY3QgaWQgZnJvbSAke3RoaXMuI2xpbmVUb3BvfSB3aGVyZSBpZCA+ICQxIG9yZGVyIGJ5IGlkIGFzYyBsaW1pdCAkMmAsIFtzdGFydElkLCBsaW1pdF0pXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgICAgY291bnQgPSByb3dzLmxlbmd0aDtcbiAgICAgIGxldCBuZXh0SWQgPSAwO1xuICAgICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgIGNvbnN0IGlkID0gK3Jvd1snaWQnXTtcbiAgICAgICAgbmV4dElkID0gaWQ7XG4gICAgICAgIGkgKz0gMTtcbiAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChg5qOA5p+l6L65ICR7aX0jJHtpZH1gLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgICAgICAgdGEgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoYXQuI2xpbmVUb3BvfSB3aGVyZSBpZCA9ICQxXG4gICAgICAgICAgKVxuICAgICAgICAgICwgdGIgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IHQuaWQgYXMgaWQsIFNUX0ludGVyc2VjdGlvbih0Lmdlb20sIHRhLmdlb20pIGFzIGdlb20gZnJvbSAke3RoYXQuI2xpbmVUb3BvfSBhcyB0IHJpZ2h0IGpvaW4gdGEgXG4gICAgICAgICAgICBvbiAodC5nZW9tICYmIHRhLmdlb20gYW5kIFNUX0ludGVyc2VjdHModC5nZW9tLCB0YS5nZW9tKSlcbiAgICAgICAgICAgIHdoZXJlIHQuaWQgIT0gJDFcbiAgICAgICAgICApXG4gICAgICAgICAgc2VsZWN0IGlkIGZyb20gdGIgd2hlcmUgU1RfR2VvbWV0cnlUeXBlKGdlb20pIG5vdCBpbiAoJ1NUX1BvaW50JywgJ1NUX011bHRpUG9pbnQnKWA7XG4gICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgcGcucXVlcnkoc3FsLCBbaWRdKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICA7XG4gICAgICAgICAgY29uc3QgaXRlbXMgPSByZXMubWFwKGl0ZW0gPT4gK2l0ZW1bJ2lkJ10pO1xuICAgICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgZWRnZSAjJHtpZH0gaW50ZXJzZWN0cyB3aXRoIGVkZ2VzYCwgaXRlbXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgIyR7c3RhcnRJZH0gLSAjJHtuZXh0SWR9YCk7XG4gICAgICBzdGFydElkID0gbmV4dElkO1xuICAgIH0gd2hpbGUgKGNvdW50ID4gMCk7XG4gIH1cblxuXG4gIGFzeW5jIGdldExpbmVEdW1wR2VvbVdrdChwZywgaWQpIHtcbiAgICByZXR1cm4gYXdhaXQgcGdcbiAgICAgIC5xdWVyeShcbiAgICAgICAgYHNlbGVjdCBzdF9hc1RleHQoZ2VvbSkgYXMgd2t0IGZyb20gJHt0aGlzLiNsaW5lRHVtcH0gd2hlcmUgaWQgPSAkMWAsXG4gICAgICAgIFtpZF1cbiAgICAgIClcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHJlcy5yb3dzWzBdIHx8IHt9O1xuICAgICAgICByZXR1cm4gcm93Wyd3a3QnXSB8fCAnJztcbiAgICAgIH0pO1xuICB9XG5cblxuICBhc3luYyBjYWxjRWRnZShwZywgaWQpIHtcbiAgICAvLyDku45kdW1w5Y+W5Ye65p2l5YaZ5YWldG9wb1xuICAgIGNvbnN0IHdrdCA9IGF3YWl0IHRoaXMuZ2V0TGluZUR1bXBHZW9tV2t0KHBnLCBpZCk7XG4gICAgY29uc3Qgc3FsMSA9IGBzZWxlY3QgaWQgZnJvbSAke3RoaXMuI2xpbmVUb3BvfSB3aGVyZSBnZW9tICYmIFNUX0dlb21Gcm9tVGV4dCgkMSwgNDMyNikgXG4gICAgYW5kIHN0X2ludGVyc2VjdHMoZ2VvbSwgU1RfR2VvbUZyb21UZXh0KCQxLCA0MzI2KSlgO1xuICAgIGNvbnN0IHJvd3MxID0gYXdhaXQgcGdcbiAgICAgIC5xdWVyeShzcWwxLCBbd2t0XSlcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgIH0pXG4gICAgO1xuICAgIGNvbnN0IGludGVyc2VjdElkcyA9IHJvd3MxLm1hcChyb3cgPT4gK3Jvd1snaWQnXSk7XG4gICAgY29uc29sZS5sb2coaW50ZXJzZWN0SWRzKTtcbiAgICBpZiAoaW50ZXJzZWN0SWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5sb2coYOaXoOS6pOmbhu+8jOebtOaOpeaPkuWFpWApO1xuICAgICAgcmV0dXJuIGF3YWl0IHBnXG4gICAgICAgIC5xdWVyeShgaW5zZXJ0IGludG8gJHt0aGlzLiNsaW5lVG9wb30gKGdlb20pIFxuICAgICAgICB2YWx1ZXMgKFxuICAgICAgICAgIFNUX01ha2VWYWxpZChcbiAgICAgICAgICAgIFNUX05vZGUoXG4gICAgICAgICAgICAgIFNUX0xpbmVNZXJnZShcbiAgICAgICAgICAgICAgICBTVF9SZW1vdmVSZXBlYXRlZFBvaW50cyhcbiAgICAgICAgICAgICAgICAgIFNUX0dlb21Gcm9tVGV4dCgkMSwgNDMyNilcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgIClgLCBbd2t0XSlcbiAgICAgIDtcbiAgICB9XG5cbiAgICBjb25zdCBzcWwyID0gYHdpdGggXG4gICAgdGEgYXMgKFxuICAgICAgc2VsZWN0IGlkLCBnZW9tIGZyb20gJHt0aGlzLiNsaW5lVG9wb30gd2hlcmUgaWQgaW4gKCR7aW50ZXJzZWN0SWRzLmpvaW4oJywgJyl9KVxuICAgICkgXG4gICAgLCB0YiBhcyAoXG4gICAgICBzZWxlY3QgaWQsIGdlb20gYXMgb3JpZ2luX2dlb20sIFxuXHQgICAgU1RfSW50ZXJzZWN0aW9uKGdlb20sXG5cdCAgICAgIFNUX01ha2VWYWxpZChcbiAgICAgICAgICBTVF9Ob2RlKFxuICAgICAgICAgICAgU1RfTGluZU1lcmdlKFxuICAgICAgICAgICAgICBTVF9SZW1vdmVSZXBlYXRlZFBvaW50cyhcbiAgICAgICAgICAgICAgICBTVF9HZW9tRnJvbVRleHQoJDEsIDQzMjYpXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgICkgXG5cdCAgICApIGFzIGludGVyc2VjdF9nZW9tIGZyb20gdGFcbiAgICApXG4gICAgLCB0YyBhcyAoXG5cdCAgICBzZWxlY3QgU1RfU3ltRGlmZmVyZW5jZShvcmlnaW5fZ2VvbSwgXG5cdCAgICAgIFNUX01ha2VWYWxpZChcbiAgICAgICAgICBTVF9Ob2RlKFxuICAgICAgICAgICAgU1RfTGluZU1lcmdlKFxuICAgICAgICAgICAgICBTVF9SZW1vdmVSZXBlYXRlZFBvaW50cyhcbiAgICAgICAgICAgICAgICBTVF9HZW9tRnJvbVRleHQoJDEsIDQzMjYpXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgICkgXG5cdCAgICApIGFzIGdlb20gZnJvbSB0YlxuICAgIClcbiAgICAsIHRkIGFzIChcbiAgICAgIHNlbGVjdCAoU1RfRHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gdGMgXG4gICAgICB3aGVyZSBnZW9tIGlzIG5vdCBudWxsIGFuZCBTVF9Jc0VtcHR5KGdlb20pID0gZmFsc2VcbiAgICAgIHVuaW9uIGFsbCBcbiAgICAgIHNlbGVjdCAoU1RfRHVtcChpbnRlcnNlY3RfZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tIHRiIFxuICAgICAgd2hlcmUgaW50ZXJzZWN0X2dlb20gaXMgbm90IG51bGwgYW5kIFNUX0lzRW1wdHkoaW50ZXJzZWN0X2dlb20pID0gZmFsc2UgXG4gICAgKVxuICAgICwgdGUgYXMgKFxuICAgICAgc2VsZWN0IFxuICAgICAgU1RfTWFrZVZhbGlkKFxuICAgICAgICBTVF9Ob2RlKFxuICAgICAgICAgIFNUX0xpbmVNZXJnZShcbiAgICAgICAgICAgIFNUX1JlbW92ZVJlcGVhdGVkUG9pbnRzKFxuICAgICAgICAgICAgICBTVF9VbmlvbihnZW9tKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKSBhcyBnZW9tIGZyb20gdGRcbiAgICApXG4gICAgLCB0ZiBhcyAoXG4gICAgICBzZWxlY3QgKFNUX0R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tIHRlXG4gICAgKVxuICAgICwgdGcgYXMgKFxuICAgICAgc2VsZWN0IFNUX1N1YmRpdmlkZShnZW9tLCA0MDk2KSBhcyBnZW9tIGZyb20gdGZcbiAgICApXG4gICAgaW5zZXJ0IGludG8gJHt0aGlzLiNsaW5lVG9wb30gKGdlb20pIFxuICAgIHNlbGVjdCBnZW9tIGZyb20gdGdgO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbDIsIFt3a3RdKTtcblxuICAgIC8vIOWIoOmZpOWOn+acieeahFxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSAke3RoaXMuI2xpbmVUb3BvfSB3aGVyZSBpZCBpbiAoJHtpbnRlcnNlY3RJZHMuam9pbignLCAnKX0pYCk7XG4gIH1cblxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IExpYlRvcG9sb2d5OyJdfQ==