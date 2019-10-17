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

class LibTopoLine {
  constructor(topologyName, dumpTable, topoTable, schema) {
    Object.defineProperty(this, _topologyName, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _dumpTable, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _dumpSchema, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _dumpSchemaTable, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _topoTable, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _topoSchema, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _topoSchemaTable, {
      writable: true,
      value: void 0
    });
    _classPrivateFieldLooseBase(this, _topologyName)[_topologyName] = topologyName;
    _classPrivateFieldLooseBase(this, _dumpTable)[_dumpTable] = dumpTable;
    _classPrivateFieldLooseBase(this, _topoTable)[_topoTable] = topoTable;
    _classPrivateFieldLooseBase(this, _dumpSchema)[_dumpSchema] = schema;
    _classPrivateFieldLooseBase(this, _topoSchema)[_topoSchema] = schema;
    _classPrivateFieldLooseBase(this, _dumpSchemaTable)[_dumpSchemaTable] = `${_classPrivateFieldLooseBase(this, _dumpSchema)[_dumpSchema]}.${_classPrivateFieldLooseBase(this, _dumpTable)[_dumpTable]}`;
    _classPrivateFieldLooseBase(this, _topoSchemaTable)[_topoSchemaTable] = `${_classPrivateFieldLooseBase(this, _topoSchema)[_topoSchema]}.${_classPrivateFieldLooseBase(this, _topoTable)[_topoTable]}`;
  }

  async createTopology(pg) {
    await pg.query(`select topology.CreateTopology($1, 4326)`, [_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]]);
  }

  async dropTopology(pg) {
    await pg.query(`select topology.DropTopology($1)`, [_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]]);
  }

  async backupTopology(pg) {
    const topologyName = `${_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]}_backup`;

    try {
      await pg.query(`select topology.DropTopology($1)`, [topologyName]);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`select topology.CopyTopology($1::varchar, $2::varchar)`, [_classPrivateFieldLooseBase(this, _topologyName)[_topologyName], topologyName]);

    try {
      await pg.query(`alter table ${_classPrivateFieldLooseBase(this, _topoSchemaTable)[_topoSchemaTable]} drop column topo_geom`);
    } catch (e) {
      console.error(e.message);
    }

    try {
      await pg.query(`alter table ${_classPrivateFieldLooseBase(this, _topoSchemaTable)[_topoSchemaTable]} drop constraint check_topogeom_topo_geom`);
    } catch (e) {
      console.error(e.message);
    }

    const backupTopologyId = await this.getBackupTopologyId(pg);
    const backupTopologyLayerId = await this.getBackupTopologyLayerId(pg);
    await pg.query(`alter table ${_classPrivateFieldLooseBase(this, _topoSchemaTable)[_topoSchemaTable]} add column topo_geom topogeometry`);
    await pg.query(`alter table ${_classPrivateFieldLooseBase(this, _topoSchemaTable)[_topoSchemaTable]} add constraint check_topogeom_topo_geom 
    check ((topo_geom).topology_id = ${+backupTopologyId} 
    and (topo_geom).layer_id = ${+backupTopologyLayerId} 
    and (topo_geom).type = 2)`);
  }

  async getBackupTopologyId(pg) {
    const topologyName = `${_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]}_backup`;
    const rows = await pg.query(`select id from topology.topology where name = $1`, [topologyName]).then(res => {
      return res.rows || [];
    });
    return rows[0]['id'] || 0;
  }

  async getBackupTopologyLayerId(pg) {
    const topologyId = await this.getBackupTopologyId(pg);
    const rows = await pg.query(`select layer_id from topology.layer where topology_id = $1`, [+topologyId]).then(res => {
      return res.rows || [];
    });
    return rows[0]['layer_id'] || 0;
  }

  async backupTopologyData(pg, id, type, category) {
    const backupTopologyId = await this.getBackupTopologyId(pg);
    const backupLayerId = await this.getBackupTopologyLayerId(pg);
    await pg.query(`delete from ${_classPrivateFieldLooseBase(this, _topoSchemaTable)[_topoSchemaTable]} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
    await pg.query(`insert into ${_classPrivateFieldLooseBase(this, _topoSchemaTable)[_topoSchemaTable]} (id, target_id, path, type, category)
      select id, target_id, path, type, category from ${_classPrivateFieldLooseBase(this, _dumpSchemaTable)[_dumpSchemaTable]}
      where target_id = $1 and type = $2 and category = $3
      on conflict (id) do update set
      target_id = excluded.target_id, path = excluded.path,
      type = excluded.type, category = excluded.category`, [id, type, category]);
    await pg.query(`with 
      ta as (
        select id, (topo_geom).id as feature_id, (topo_geom).type as feature_type from ${_classPrivateFieldLooseBase(this, _dumpSchemaTable)[_dumpSchemaTable]} 
        where target_id = $1 and type = $2 and category = $3
      )
      , tb as (
        select id, ($4::integer, $5::integer, feature_id, feature_type)::topogeometry as topo_geom from ta
      )
      insert into ${_classPrivateFieldLooseBase(this, _topoSchemaTable)[_topoSchemaTable]} (id, topo_geom) 
      select id, topo_geom from tb 
      on conflict (id) do update set topo_geom = excluded.topo_geom`, [id, type, category, backupTopologyId, backupLayerId]);
  }

  async buildBackup(pg, id, type, category) {
    await pg.query(`update ${_classPrivateFieldLooseBase(this, _topoSchemaTable)[_topoSchemaTable]} set geom = topo_geom::geometry where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
    await pg.query(`update ${_classPrivateFieldLooseBase(this, _topoSchemaTable)[_topoSchemaTable]} set points = st_npoints(geom), length = st_length(geom) where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
  }

  async initTables(pg) {
    await this.initDumpTable(pg);
    await this.initTopoTable(pg);
  }

  async initDumpTable(pg) {
    const table = `${_classPrivateFieldLooseBase(this, _dumpSchemaTable)[_dumpSchemaTable]}`;

    try {
      await pg.query(`drop table ${table} cascade`);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`create table if not exists ${table}
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
    await pg.query(`create index ${_classPrivateFieldLooseBase(this, _topoSchema)[_topoSchema]}_${_classPrivateFieldLooseBase(this, _dumpTable)[_dumpTable]}_geom_idx on ${table} using gist (geom)`);
    await pg.query(`select topology.AddTopoGeometryColumn($1, '${_classPrivateFieldLooseBase(this, _topoSchema)[_topoSchema]}', '${_classPrivateFieldLooseBase(this, _dumpTable)[_dumpTable]}', 'topo_geom', 'LINE')`, [_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]]);
  }

  async initTopoTable(pg) {
    const table = `${_classPrivateFieldLooseBase(this, _topoSchemaTable)[_topoSchemaTable]}`;

    try {
      await pg.query(`drop table ${table} cascade`);
    } catch (e) {
      console.error(e.message);
    }

    await pg.query(`create table if not exists ${table}
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
    await pg.query(`create index ${_classPrivateFieldLooseBase(this, _topoSchema)[_topoSchema]}_${_classPrivateFieldLooseBase(this, _topoTable)[_topoTable]}_geom_idx on ${table} using gist (geom)`);
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

  async dumpJuncture(pg, id, type) {
    const fromTable = 'boundary.line';
    const toTable = `${_classPrivateFieldLooseBase(this, _dumpSchemaTable)[_dumpSchemaTable]}`;
    const category = 'juncture';
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
    await pg.query(`with 
      ta as (
        select (st_dump(geom)).geom as geom from ${fromTable}
        where id = $1 and type = $2 and category = $3
      )
      , tb as (
        select (row_number() over())::integer as path, geom from ta
      )
      insert into ${toTable} (target_id, path, type, category, geom, points, length) 
      select $1::bigint as target_id, path, $2::varchar as type, $3::varchar as category, geom, 
      st_npoints(geom) as points, st_length(geom) as length from tb order by path asc`, [id, type, category]);
  }

  async dumpJunctureAvgVertices(pg, id, type) {
    const fromTable = 'boundary.line';
    const toTable = `${_classPrivateFieldLooseBase(this, _dumpSchemaTable)[_dumpSchemaTable]}`;
    const category = 'juncture';
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
    await pg.query(`with 
      ta as (
        select (st_dump(geom)).geom as geom from ${fromTable}
        where id = $1 and type = $2 and category = $3
      )
      , tb as (
        select st_subdivide(geom, 10000) as geom from ta
      )
      , tc as (
        select (row_number() over())::integer as path, geom from tb
      )
      insert into ${toTable} (target_id, path, type, category, geom, points, length) 
      select $1::bigint as target_id, path, $2::varchar as type, $3::varchar as category, geom, 
      st_npoints(geom) as points, st_length(geom) as length from tc order by path asc`, [id, type, category]);
  }

  async edgeJuncture(pg, id, type) {
    const topologyName = _classPrivateFieldLooseBase(this, _topologyName)[_topologyName];

    const list = await this.getJunctureDump(pg, id, type);

    for await (const item of list) {
      await _Utils.default.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(`with 
          ta as (
            select geom from ${_classPrivateFieldLooseBase(this, _dumpSchemaTable)[_dumpSchemaTable]} where id = $1
          )
          select TopoGeo_AddLineString($2::varchar, geom, 0) from ta`, [+item['id'], topologyName]);
      });
    }
  }

  async mapJuncture(pg, id, type) {
    const layerId = await this.getTopologyLayerId(pg);

    const topologyName = _classPrivateFieldLooseBase(this, _topologyName)[_topologyName];

    const list = await this.getJunctureDump(pg, id, type);
    const that = this;

    for await (const item of list) {
      await _Utils.default.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(`update ${_classPrivateFieldLooseBase(that, _dumpSchemaTable)[_dumpSchemaTable]} set topo_geom = topology.toTopoGeom(geom, $1::varchar, $2::integer) where id = $3`, [topologyName, layerId, +item['id']]);
      });
    }
  }

  async dumpCoastline(pg, id) {
    const fromTable = 'boundary.line';
    const toTable = `${_classPrivateFieldLooseBase(this, _dumpSchemaTable)[_dumpSchemaTable]}`;
    const type = 'outer';
    const category = 'coastline';
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
    await pg.query(`with 
      ta as (
        select (st_dump(geom)).geom as geom from ${fromTable}
        where id = $1 and type = $2 and category = $3
      )
      , tb as (
        select (row_number() over())::integer as path, geom from ta
      )
      insert into ${toTable} (target_id, path, type, category, geom, points, length) 
      select $1::bigint as target_id, path, $2::varchar as type, $3::varchar as category, geom, 
      st_npoints(geom) as points, st_length(geom) as length from tb order by path asc`, [id, type, category]);
  }

  async dumpCoastlineAvgVertices(pg, id) {
    const fromTable = 'boundary.line';
    const toTable = `${_classPrivateFieldLooseBase(this, _dumpSchemaTable)[_dumpSchemaTable]}`;
    const type = 'outer';
    const category = 'coastline';
    await pg.query(`delete from ${toTable} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
    await pg.query(`with 
      ta as (
        select (st_dump(geom)).geom as geom from ${fromTable}
        where id = $1 and type = $2 and category = $3
      )
      , tb as (
        select st_subdivide(geom, 10000) as geom from ta
      )
      , tc as (
        select (row_number() over())::integer as path, geom from tb
      )
      insert into ${toTable} (target_id, path, type, category, geom, points, length) 
      select $1::bigint as target_id, path, $2::varchar as type, $3::varchar as category, geom, 
      st_npoints(geom) as points, st_length(geom) as length from tc order by path asc`, [id, type, category]);
  }

  async edgeCoastline(pg, id) {
    const startItemId = 0;

    const topologyName = _classPrivateFieldLooseBase(this, _topologyName)[_topologyName];

    const type = 'outer';
    const list = await this.getCoastlineDump(pg, id, type);
    const that = this;

    for await (const item of list) {
      if (item['id'] < startItemId) {
        continue;
      }

      await _Utils.default.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(`with 
          ta as (
            select geom from ${_classPrivateFieldLooseBase(that, _dumpSchemaTable)[_dumpSchemaTable]} where id = $1
          )
          select TopoGeo_AddLineString($2::varchar, geom, 0) from ta`, [+item['id'], topologyName]);
      });
    }
  }

  async mapCoastline(pg, id) {
    const startItemId = 52250;
    const layerId = await this.getTopologyLayerId(pg);

    const topologyName = _classPrivateFieldLooseBase(this, _topologyName)[_topologyName];

    const type = 'outer';
    const list = await this.getCoastlineDump(pg, id, type);
    const that = this;

    for await (const item of list) {
      if (item['id'] < startItemId) {
        continue;
      }

      await _Utils.default.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(`update ${_classPrivateFieldLooseBase(that, _dumpSchemaTable)[_dumpSchemaTable]} set topo_geom = topology.toTopoGeom(geom, $1::varchar, $2::integer) where id = $3`, [topologyName, layerId, +item['id']]);
      });
    }
  }

  async getCoastlineDump(pg, id, type) {
    const table = `${_classPrivateFieldLooseBase(this, _dumpSchemaTable)[_dumpSchemaTable]}`;
    const category = 'coastline';
    const sql = `select id, target_id, path from ${table} where target_id = $1 and type = $2 and category = $3 order by id asc, path asc`;
    return await pg.query(sql, [id, type, category]).then(res => {
      return res.rows || [];
    });
  }

  async getJunctureDump(pg, id, type) {
    const table = `${_classPrivateFieldLooseBase(this, _dumpSchemaTable)[_dumpSchemaTable]}`;
    const category = 'juncture';
    const sql = `select id, target_id, path from ${table} where target_id = $1 and type = $2 and category = $3 order by id asc, path asc`;
    return await pg.query(sql, [id, type, category]).then(res => {
      return res.rows || [];
    });
  }

  async getTopologyId(pg) {
    const rows = await pg.query(`select id from topology.topology where name = $1`, [_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]]).then(res => {
      return res.rows || [];
    });
    return rows[0]['id'] || 0;
  }

  async getTopologyLayerId(pg) {
    const topologyId = await this.getTopologyId(pg);
    const rows = await pg.query(`select layer_id from topology.layer where topology_id = $1`, [+topologyId]).then(res => {
      return res.rows || [];
    });
    return rows[0]['layer_id'] || 0;
  }

  async registerTopologySimplifyFunction(pg) {
    await pg.query(`CREATE OR REPLACE FUNCTION public.${_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]}_SimplifyEdgeGeomToBackup(anedge int, maxtolerance float8)
RETURNS float8 AS $$
DECLARE
  tol float8;
  sql varchar;
BEGIN
  tol := maxtolerance;
  LOOP
    sql := 'SELECT topology.ST_ChangeEdgeGeom('${_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]}_backup', ' || anedge
      || ', ST_SimplifyPreserveTopology(geom, ' || tol || ')) FROM '
      || ${_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]} || '.edge WHERE edge_id = ' || anedge;
    BEGIN
      RAISE DEBUG 'Running %', sql;
      EXECUTE sql;
      RETURN tol;
    EXCEPTION
     WHEN OTHERS THEN
      RAISE WARNING 'Simplification of edge % with tolerance % failed: %', anedge, tol, SQLERRM;
      tol := round( (tol/2.0) * 1e8 ) / 1e8; -- round to get to zero quicker
      IF tol = 0 THEN RAISE WARNING '%', SQLERRM; END IF;
    END;
  END LOOP;
END
$$ LANGUAGE 'plpgsql' STABLE STRICTs`);
  }

  async doTopoBackup(pg, id, type, category, maxTolerance) {
    const sql = `with 
    ta as (
      select geom from boundary.line where id = $1 and type = $2 and category = $3
    )
    , tb as (
      select e.edge_id as edge_id from ${_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]}_backup.edge_data as e, ta 
      where st_intersects(ta.geom, e.geom) = true order by e.edge_id asc
    )
    select edge_id, public.${_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]}_SimplifyEdgeGeomToBackup(edge_id, $4::float) from tb`;
    await pg.query(sql, [id, type, category, maxTolerance]);
  }

}

var _topologyName = _classPrivateFieldLooseKey("topologyName");

var _dumpTable = _classPrivateFieldLooseKey("dumpTable");

var _dumpSchema = _classPrivateFieldLooseKey("dumpSchema");

var _dumpSchemaTable = _classPrivateFieldLooseKey("dumpSchemaTable");

var _topoTable = _classPrivateFieldLooseKey("topoTable");

var _topoSchema = _classPrivateFieldLooseKey("topoSchema");

var _topoSchemaTable = _classPrivateFieldLooseKey("topoSchemaTable");

var _default = LibTopoLine;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC10b3BvLWxpbmUvTGliVG9wb0xpbmUuanMiXSwibmFtZXMiOlsiTGliVG9wb0xpbmUiLCJjb25zdHJ1Y3RvciIsInRvcG9sb2d5TmFtZSIsImR1bXBUYWJsZSIsInRvcG9UYWJsZSIsInNjaGVtYSIsImNyZWF0ZVRvcG9sb2d5IiwicGciLCJxdWVyeSIsImRyb3BUb3BvbG9neSIsImJhY2t1cFRvcG9sb2d5IiwiZSIsImNvbnNvbGUiLCJlcnJvciIsIm1lc3NhZ2UiLCJiYWNrdXBUb3BvbG9neUlkIiwiZ2V0QmFja3VwVG9wb2xvZ3lJZCIsImJhY2t1cFRvcG9sb2d5TGF5ZXJJZCIsImdldEJhY2t1cFRvcG9sb2d5TGF5ZXJJZCIsInJvd3MiLCJ0aGVuIiwicmVzIiwidG9wb2xvZ3lJZCIsImJhY2t1cFRvcG9sb2d5RGF0YSIsImlkIiwidHlwZSIsImNhdGVnb3J5IiwiYmFja3VwTGF5ZXJJZCIsImJ1aWxkQmFja3VwIiwiaW5pdFRhYmxlcyIsImluaXREdW1wVGFibGUiLCJpbml0VG9wb1RhYmxlIiwidGFibGUiLCJnZXRGb3JlaWduTGlzdCIsInNxbCIsImxpc3QiLCJyb3ciLCJwdXNoIiwibmFtZSIsImR1bXBKdW5jdHVyZSIsImZyb21UYWJsZSIsInRvVGFibGUiLCJkdW1wSnVuY3R1cmVBdmdWZXJ0aWNlcyIsImVkZ2VKdW5jdHVyZSIsImdldEp1bmN0dXJlRHVtcCIsIml0ZW0iLCJVdGlscyIsImNhbGwiLCJtYXBKdW5jdHVyZSIsImxheWVySWQiLCJnZXRUb3BvbG9neUxheWVySWQiLCJ0aGF0IiwiZHVtcENvYXN0bGluZSIsImR1bXBDb2FzdGxpbmVBdmdWZXJ0aWNlcyIsImVkZ2VDb2FzdGxpbmUiLCJzdGFydEl0ZW1JZCIsImdldENvYXN0bGluZUR1bXAiLCJtYXBDb2FzdGxpbmUiLCJnZXRUb3BvbG9neUlkIiwicmVnaXN0ZXJUb3BvbG9neVNpbXBsaWZ5RnVuY3Rpb24iLCJkb1RvcG9CYWNrdXAiLCJt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TUFBTSxLQUFLb0MsYUFBTCxDQUFtQm5ELEVBQW5CLENBQXpCO0FBQ0EsVUFBTVksSUFBSSxHQUFHLE1BQU1aLEVBQUUsQ0FDbEJDLEtBRGdCLENBQ1QsNERBRFMsRUFDb0QsQ0FBQyxDQUFDYyxVQUFGLENBRHBELEVBRWhCRixJQUZnQixDQUVYQyxHQUFHLElBQUk7QUFDWCxhQUFPQSxHQUFHLENBQUNGLElBQUosSUFBWSxFQUFuQjtBQUNELEtBSmdCLENBQW5CO0FBTUEsV0FBT0EsSUFBSSxDQUFDLENBQUQsQ0FBSixDQUFRLFVBQVIsS0FBdUIsQ0FBOUI7QUFDRDs7QUFJRCxRQUFNd0MsZ0NBQU4sQ0FBdUNwRCxFQUF2QyxFQUEyQztBQUN6QyxVQUFNQSxFQUFFLENBQUNDLEtBQUgsQ0FBVSxxQ0FBRCw0QkFBcUMsSUFBckMsK0JBQXdEOzs7Ozs7OztpREFBeEQsNEJBUThCLElBUjlCLCtCQVFpRDs7V0FSakQsNEJBVVIsSUFWUSwrQkFVVzs7Ozs7Ozs7Ozs7OztxQ0FWcEIsQ0FBTjtBQXdCRDs7QUFHRCxRQUFNb0QsWUFBTixDQUFtQnJELEVBQW5CLEVBQXVCaUIsRUFBdkIsRUFBMkJDLElBQTNCLEVBQWlDQyxRQUFqQyxFQUEyQ21DLFlBQTNDLEVBQXlEO0FBQ3ZELFVBQU0zQixHQUFHLEdBQUk7Ozs7O3lDQUFELDRCQUt5QixJQUx6QiwrQkFLNEM7Ozs2QkFMNUMsNEJBUWEsSUFSYiwrQkFRZ0MsdURBUjVDO0FBU0EsVUFBTTNCLEVBQUUsQ0FBQ0MsS0FBSCxDQUFTMEIsR0FBVCxFQUFjLENBQUNWLEVBQUQsRUFBS0MsSUFBTCxFQUFXQyxRQUFYLEVBQXFCbUMsWUFBckIsQ0FBZCxDQUFOO0FBQ0Q7O0FBbmNlOzs7Ozs7Ozs7Ozs7Ozs7O2VBdWNIN0QsVyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFV0aWxzIGZyb20gJy4vLi4vLi4vbW9kdWxlcy9VdGlscyc7XG5cblxuY2xhc3MgTGliVG9wb0xpbmUge1xuXG4gICN0b3BvbG9neU5hbWU7XG5cbiAgI2R1bXBUYWJsZTtcbiAgI2R1bXBTY2hlbWE7XG4gICNkdW1wU2NoZW1hVGFibGU7XG4gICN0b3BvVGFibGU7XG4gICN0b3BvU2NoZW1hO1xuICAjdG9wb1NjaGVtYVRhYmxlO1xuXG4gIGNvbnN0cnVjdG9yKHRvcG9sb2d5TmFtZSwgZHVtcFRhYmxlLCB0b3BvVGFibGUsIHNjaGVtYSkge1xuICAgIHRoaXMuI3RvcG9sb2d5TmFtZSA9IHRvcG9sb2d5TmFtZTtcbiAgICB0aGlzLiNkdW1wVGFibGUgPSBkdW1wVGFibGU7XG4gICAgdGhpcy4jdG9wb1RhYmxlID0gdG9wb1RhYmxlO1xuICAgIHRoaXMuI2R1bXBTY2hlbWEgPSBzY2hlbWE7XG4gICAgdGhpcy4jdG9wb1NjaGVtYSA9IHNjaGVtYTtcbiAgICB0aGlzLiNkdW1wU2NoZW1hVGFibGUgPSBgJHt0aGlzLiNkdW1wU2NoZW1hfS4ke3RoaXMuI2R1bXBUYWJsZX1gO1xuICAgIHRoaXMuI3RvcG9TY2hlbWFUYWJsZSA9IGAke3RoaXMuI3RvcG9TY2hlbWF9LiR7dGhpcy4jdG9wb1RhYmxlfWA7XG4gIH1cblxuICBhc3luYyBjcmVhdGVUb3BvbG9neShwZykge1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBzZWxlY3QgdG9wb2xvZ3kuQ3JlYXRlVG9wb2xvZ3koJDEsIDQzMjYpYCwgW3RoaXMuI3RvcG9sb2d5TmFtZV0pO1xuICB9XG5cbiAgYXN5bmMgZHJvcFRvcG9sb2d5KHBnKSB7XG4gICAgYXdhaXQgcGcucXVlcnkoYHNlbGVjdCB0b3BvbG9neS5Ecm9wVG9wb2xvZ3koJDEpYCwgW3RoaXMuI3RvcG9sb2d5TmFtZV0pO1xuICB9XG5cblxuICBhc3luYyBiYWNrdXBUb3BvbG9neShwZykge1xuICAgIGNvbnN0IHRvcG9sb2d5TmFtZSA9IGAke3RoaXMuI3RvcG9sb2d5TmFtZX1fYmFja3VwYDtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYHNlbGVjdCB0b3BvbG9neS5Ecm9wVG9wb2xvZ3koJDEpYCwgW3RvcG9sb2d5TmFtZV0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG4gICAgYXdhaXQgcGcucXVlcnkoYHNlbGVjdCB0b3BvbG9neS5Db3B5VG9wb2xvZ3koJDE6OnZhcmNoYXIsICQyOjp2YXJjaGFyKWAsIFt0aGlzLiN0b3BvbG9neU5hbWUsIHRvcG9sb2d5TmFtZV0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBhbHRlciB0YWJsZSAke3RoaXMuI3RvcG9TY2hlbWFUYWJsZX0gZHJvcCBjb2x1bW4gdG9wb19nZW9tYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYGFsdGVyIHRhYmxlICR7dGhpcy4jdG9wb1NjaGVtYVRhYmxlfSBkcm9wIGNvbnN0cmFpbnQgY2hlY2tfdG9wb2dlb21fdG9wb19nZW9tYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBjb25zdCBiYWNrdXBUb3BvbG9neUlkID0gYXdhaXQgdGhpcy5nZXRCYWNrdXBUb3BvbG9neUlkKHBnKTtcbiAgICBjb25zdCBiYWNrdXBUb3BvbG9neUxheWVySWQgPSBhd2FpdCB0aGlzLmdldEJhY2t1cFRvcG9sb2d5TGF5ZXJJZChwZyk7XG4gICAgYXdhaXQgcGcucXVlcnkoYGFsdGVyIHRhYmxlICR7dGhpcy4jdG9wb1NjaGVtYVRhYmxlfSBhZGQgY29sdW1uIHRvcG9fZ2VvbSB0b3BvZ2VvbWV0cnlgKTtcbiAgICBhd2FpdCBwZy5xdWVyeShgYWx0ZXIgdGFibGUgJHt0aGlzLiN0b3BvU2NoZW1hVGFibGV9IGFkZCBjb25zdHJhaW50IGNoZWNrX3RvcG9nZW9tX3RvcG9fZ2VvbSBcbiAgICBjaGVjayAoKHRvcG9fZ2VvbSkudG9wb2xvZ3lfaWQgPSAkeytiYWNrdXBUb3BvbG9neUlkfSBcbiAgICBhbmQgKHRvcG9fZ2VvbSkubGF5ZXJfaWQgPSAkeytiYWNrdXBUb3BvbG9neUxheWVySWR9IFxuICAgIGFuZCAodG9wb19nZW9tKS50eXBlID0gMilgKTtcbiAgfVxuXG4gIGFzeW5jIGdldEJhY2t1cFRvcG9sb2d5SWQocGcpIHtcbiAgICBjb25zdCB0b3BvbG9neU5hbWUgPSBgJHt0aGlzLiN0b3BvbG9neU5hbWV9X2JhY2t1cGA7XG4gICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAucXVlcnkoYHNlbGVjdCBpZCBmcm9tIHRvcG9sb2d5LnRvcG9sb2d5IHdoZXJlIG5hbWUgPSAkMWAsIFt0b3BvbG9neU5hbWVdKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgfSlcbiAgICA7XG4gICAgcmV0dXJuIHJvd3NbMF1bJ2lkJ10gfHwgMDtcbiAgfVxuXG4gIGFzeW5jIGdldEJhY2t1cFRvcG9sb2d5TGF5ZXJJZChwZykge1xuICAgIGNvbnN0IHRvcG9sb2d5SWQgPSBhd2FpdCB0aGlzLmdldEJhY2t1cFRvcG9sb2d5SWQocGcpO1xuICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgLnF1ZXJ5KGBzZWxlY3QgbGF5ZXJfaWQgZnJvbSB0b3BvbG9neS5sYXllciB3aGVyZSB0b3BvbG9neV9pZCA9ICQxYCwgWyt0b3BvbG9neUlkXSlcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgIH0pXG4gICAgO1xuICAgIHJldHVybiByb3dzWzBdWydsYXllcl9pZCddIHx8IDA7XG4gIH1cblxuICBhc3luYyBiYWNrdXBUb3BvbG9neURhdGEocGcsIGlkLCB0eXBlLCBjYXRlZ29yeSkge1xuICAgIGNvbnN0IGJhY2t1cFRvcG9sb2d5SWQgPSBhd2FpdCB0aGlzLmdldEJhY2t1cFRvcG9sb2d5SWQocGcpO1xuICAgIGNvbnN0IGJhY2t1cExheWVySWQgPSBhd2FpdCB0aGlzLmdldEJhY2t1cFRvcG9sb2d5TGF5ZXJJZChwZyk7XG5cbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0aGlzLiN0b3BvU2NoZW1hVGFibGV9IHdoZXJlIHRhcmdldF9pZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNgLCBbaWQsIHR5cGUsIGNhdGVnb3J5XSk7XG4gICAgYXdhaXQgcGcucXVlcnkoYGluc2VydCBpbnRvICR7dGhpcy4jdG9wb1NjaGVtYVRhYmxlfSAoaWQsIHRhcmdldF9pZCwgcGF0aCwgdHlwZSwgY2F0ZWdvcnkpXG4gICAgICBzZWxlY3QgaWQsIHRhcmdldF9pZCwgcGF0aCwgdHlwZSwgY2F0ZWdvcnkgZnJvbSAke3RoaXMuI2R1bXBTY2hlbWFUYWJsZX1cbiAgICAgIHdoZXJlIHRhcmdldF9pZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNcbiAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldFxuICAgICAgdGFyZ2V0X2lkID0gZXhjbHVkZWQudGFyZ2V0X2lkLCBwYXRoID0gZXhjbHVkZWQucGF0aCxcbiAgICAgIHR5cGUgPSBleGNsdWRlZC50eXBlLCBjYXRlZ29yeSA9IGV4Y2x1ZGVkLmNhdGVnb3J5YCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcblxuICAgIGF3YWl0IHBnLnF1ZXJ5KGB3aXRoIFxuICAgICAgdGEgYXMgKFxuICAgICAgICBzZWxlY3QgaWQsICh0b3BvX2dlb20pLmlkIGFzIGZlYXR1cmVfaWQsICh0b3BvX2dlb20pLnR5cGUgYXMgZmVhdHVyZV90eXBlIGZyb20gJHt0aGlzLiNkdW1wU2NoZW1hVGFibGV9IFxuICAgICAgICB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzXG4gICAgICApXG4gICAgICAsIHRiIGFzIChcbiAgICAgICAgc2VsZWN0IGlkLCAoJDQ6OmludGVnZXIsICQ1OjppbnRlZ2VyLCBmZWF0dXJlX2lkLCBmZWF0dXJlX3R5cGUpOjp0b3BvZ2VvbWV0cnkgYXMgdG9wb19nZW9tIGZyb20gdGFcbiAgICAgIClcbiAgICAgIGluc2VydCBpbnRvICR7dGhpcy4jdG9wb1NjaGVtYVRhYmxlfSAoaWQsIHRvcG9fZ2VvbSkgXG4gICAgICBzZWxlY3QgaWQsIHRvcG9fZ2VvbSBmcm9tIHRiIFxuICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IHRvcG9fZ2VvbSA9IGV4Y2x1ZGVkLnRvcG9fZ2VvbWAsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5LCBiYWNrdXBUb3BvbG9neUlkLCBiYWNrdXBMYXllcklkXVxuICAgICk7XG4gIH1cblxuXG4gIGFzeW5jIGJ1aWxkQmFja3VwKHBnLCBpZCwgdHlwZSwgY2F0ZWdvcnkpIHtcbiAgICBhd2FpdCBwZy5xdWVyeShcbiAgICAgIGB1cGRhdGUgJHt0aGlzLiN0b3BvU2NoZW1hVGFibGV9IHNldCBnZW9tID0gdG9wb19nZW9tOjpnZW9tZXRyeSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcbiAgICBhd2FpdCBwZy5xdWVyeShcbiAgICAgIGB1cGRhdGUgJHt0aGlzLiN0b3BvU2NoZW1hVGFibGV9IHNldCBwb2ludHMgPSBzdF9ucG9pbnRzKGdlb20pLCBsZW5ndGggPSBzdF9sZW5ndGgoZ2VvbSkgd2hlcmUgdGFyZ2V0X2lkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICk7XG4gIH1cblxuICBhc3luYyBpbml0VGFibGVzKHBnKSB7XG4gICAgYXdhaXQgdGhpcy5pbml0RHVtcFRhYmxlKHBnKTtcbiAgICBhd2FpdCB0aGlzLmluaXRUb3BvVGFibGUocGcpO1xuICB9XG5cbiAgYXN5bmMgaW5pdER1bXBUYWJsZShwZykge1xuICAgIGNvbnN0IHRhYmxlID0gYCR7dGhpcy4jZHVtcFNjaGVtYVRhYmxlfWA7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBkcm9wIHRhYmxlICR7dGFibGV9IGNhc2NhZGVgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgfVxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgdGFibGUgaWYgbm90IGV4aXN0cyAke3RhYmxlfVxuICAgIChcbiAgICAgICAgaWQgYmlnc2VyaWFsIHByaW1hcnkga2V5LFxuICAgICAgICB0YXJnZXRfaWQgYmlnaW50LFxuICAgICAgICBwYXRoIGludCxcbiAgICAgICAgdHlwZSB2YXJjaGFyLFxuICAgICAgICBjYXRlZ29yeSB2YXJjaGFyLFxuICAgICAgICBwb2ludHMgaW50ZWdlcixcbiAgICAgICAgbGVuZ3RoIGZsb2F0LFxuICAgICAgICBnZW9tIGdlb21ldHJ5LFxuICAgICAgICBjb25zdHJhaW50IGVuZm9yY2Vfc3JpZF9nZW9tIGNoZWNrIChzdF9zcmlkKGdlb20pID0gNDMyNilcbiAgICApYCk7XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSBpbmRleCAke3RoaXMuI3RvcG9TY2hlbWF9XyR7dGhpcy4jZHVtcFRhYmxlfV9nZW9tX2lkeCBvbiAke3RhYmxlfSB1c2luZyBnaXN0IChnZW9tKWApO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBzZWxlY3QgdG9wb2xvZ3kuQWRkVG9wb0dlb21ldHJ5Q29sdW1uKCQxLCAnJHt0aGlzLiN0b3BvU2NoZW1hfScsICcke3RoaXMuI2R1bXBUYWJsZX0nLCAndG9wb19nZW9tJywgJ0xJTkUnKWAsIFt0aGlzLiN0b3BvbG9neU5hbWVdKTtcbiAgfVxuXG4gIGFzeW5jIGluaXRUb3BvVGFibGUocGcpIHtcbiAgICBjb25zdCB0YWJsZSA9IGAke3RoaXMuI3RvcG9TY2hlbWFUYWJsZX1gO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgZHJvcCB0YWJsZSAke3RhYmxlfSBjYXNjYWRlYCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIHRhYmxlIGlmIG5vdCBleGlzdHMgJHt0YWJsZX1cbiAgICAoXG4gICAgICAgIGlkIGJpZ3NlcmlhbCBwcmltYXJ5IGtleSxcbiAgICAgICAgdGFyZ2V0X2lkIGJpZ2ludCxcbiAgICAgICAgcGF0aCBpbnQsXG4gICAgICAgIHR5cGUgdmFyY2hhcixcbiAgICAgICAgY2F0ZWdvcnkgdmFyY2hhcixcbiAgICAgICAgcG9pbnRzIGludGVnZXIsXG4gICAgICAgIGxlbmd0aCBmbG9hdCxcbiAgICAgICAgZ2VvbSBnZW9tZXRyeSxcbiAgICAgICAgY29uc3RyYWludCBlbmZvcmNlX3NyaWRfZ2VvbSBjaGVjayAoc3Rfc3JpZChnZW9tKSA9IDQzMjYpXG4gICAgKWApO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgaW5kZXggJHt0aGlzLiN0b3BvU2NoZW1hfV8ke3RoaXMuI3RvcG9UYWJsZX1fZ2VvbV9pZHggb24gJHt0YWJsZX0gdXNpbmcgZ2lzdCAoZ2VvbSlgKTtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGdldEZvcmVpZ25MaXN0KHBnKSB7XG4gICAgY29uc3QgdGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgICBjb25zdCBzcWwgPSBgc2VsZWN0IGlkLCB6aF9uYW1lIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPiA5MDAwMDAgb3JkZXIgYnkgaWQgYXNjYDtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBwZy5xdWVyeShzcWwpO1xuICAgIGNvbnN0IGxpc3QgPSBbXTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByZXMucm93cykge1xuICAgICAgbGlzdC5wdXNoKHtcbiAgICAgICAgaWQ6ICtyb3dbJ2lkJ10sXG4gICAgICAgIG5hbWU6IHJvd1snemhfbmFtZSddXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Q7XG4gIH1cblxuXG4gIGFzeW5jIGR1bXBKdW5jdHVyZShwZywgaWQsIHR5cGUpIHtcbiAgICBjb25zdCBmcm9tVGFibGUgPSAnYm91bmRhcnkubGluZSc7XG4gICAgY29uc3QgdG9UYWJsZSA9IGAke3RoaXMuI2R1bXBTY2hlbWFUYWJsZX1gO1xuICAgIGNvbnN0IGNhdGVnb3J5ID0gJ2p1bmN0dXJlJztcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0b1RhYmxlfSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCAoc3RfZHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHtmcm9tVGFibGV9XG4gICAgICAgIHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM1xuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCAocm93X251bWJlcigpIG92ZXIoKSk6OmludGVnZXIgYXMgcGF0aCwgZ2VvbSBmcm9tIHRhXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke3RvVGFibGV9ICh0YXJnZXRfaWQsIHBhdGgsIHR5cGUsIGNhdGVnb3J5LCBnZW9tLCBwb2ludHMsIGxlbmd0aCkgXG4gICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyB0YXJnZXRfaWQsIHBhdGgsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCBnZW9tLCBcbiAgICAgIHN0X25wb2ludHMoZ2VvbSkgYXMgcG9pbnRzLCBzdF9sZW5ndGgoZ2VvbSkgYXMgbGVuZ3RoIGZyb20gdGIgb3JkZXIgYnkgcGF0aCBhc2NgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApO1xuICB9XG5cblxuICBhc3luYyBkdW1wSnVuY3R1cmVBdmdWZXJ0aWNlcyhwZywgaWQsIHR5cGUpIHtcbiAgICBjb25zdCBmcm9tVGFibGUgPSAnYm91bmRhcnkubGluZSc7XG4gICAgY29uc3QgdG9UYWJsZSA9IGAke3RoaXMuI2R1bXBTY2hlbWFUYWJsZX1gO1xuICAgIGNvbnN0IGNhdGVnb3J5ID0gJ2p1bmN0dXJlJztcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0b1RhYmxlfSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCAoc3RfZHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHtmcm9tVGFibGV9XG4gICAgICAgIHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM1xuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCBzdF9zdWJkaXZpZGUoZ2VvbSwgMTAwMDApIGFzIGdlb20gZnJvbSB0YVxuICAgICAgKVxuICAgICAgLCB0YyBhcyAoXG4gICAgICAgIHNlbGVjdCAocm93X251bWJlcigpIG92ZXIoKSk6OmludGVnZXIgYXMgcGF0aCwgZ2VvbSBmcm9tIHRiXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke3RvVGFibGV9ICh0YXJnZXRfaWQsIHBhdGgsIHR5cGUsIGNhdGVnb3J5LCBnZW9tLCBwb2ludHMsIGxlbmd0aCkgXG4gICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyB0YXJnZXRfaWQsIHBhdGgsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCBnZW9tLCBcbiAgICAgIHN0X25wb2ludHMoZ2VvbSkgYXMgcG9pbnRzLCBzdF9sZW5ndGgoZ2VvbSkgYXMgbGVuZ3RoIGZyb20gdGMgb3JkZXIgYnkgcGF0aCBhc2NgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApO1xuICB9XG5cblxuICBhc3luYyBlZGdlSnVuY3R1cmUocGcsIGlkLCB0eXBlKSB7XG4gICAgY29uc3QgdG9wb2xvZ3lOYW1lID0gdGhpcy4jdG9wb2xvZ3lOYW1lO1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCB0aGlzLmdldEp1bmN0dXJlRHVtcChwZywgaWQsIHR5cGUpO1xuICAgIGZvciBhd2FpdCAoY29uc3QgaXRlbSBvZiBsaXN0KSB7XG4gICAgICBhd2FpdCBVdGlscy5jYWxsKGAke2l0ZW1bJ2lkJ119fCR7aXRlbVsndGFyZ2V0X2lkJ119fCR7aXRlbVsncGF0aCddfWAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgcGcucXVlcnkoXG4gICAgICAgICAgYHdpdGggXG4gICAgICAgICAgdGEgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoaXMuI2R1bXBTY2hlbWFUYWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgICAgICAgIClcbiAgICAgICAgICBzZWxlY3QgVG9wb0dlb19BZGRMaW5lU3RyaW5nKCQyOjp2YXJjaGFyLCBnZW9tLCAwKSBmcm9tIHRhYCxcbiAgICAgICAgICBbK2l0ZW1bJ2lkJ10sIHRvcG9sb2d5TmFtZV1cbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG5cbiAgYXN5bmMgbWFwSnVuY3R1cmUocGcsIGlkLCB0eXBlKSB7XG4gICAgY29uc3QgbGF5ZXJJZCA9IGF3YWl0IHRoaXMuZ2V0VG9wb2xvZ3lMYXllcklkKHBnKTtcbiAgICBjb25zdCB0b3BvbG9neU5hbWUgPSB0aGlzLiN0b3BvbG9neU5hbWU7XG4gICAgY29uc3QgbGlzdCA9IGF3YWl0IHRoaXMuZ2V0SnVuY3R1cmVEdW1wKHBnLCBpZCwgdHlwZSk7XG4gICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgZm9yIGF3YWl0IChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICAgIGF3YWl0IFV0aWxzLmNhbGwoYCR7aXRlbVsnaWQnXX18JHtpdGVtWyd0YXJnZXRfaWQnXX18JHtpdGVtWydwYXRoJ119YCwgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBwZy5xdWVyeShcbiAgICAgICAgICBgdXBkYXRlICR7dGhhdC4jZHVtcFNjaGVtYVRhYmxlfSBzZXQgdG9wb19nZW9tID0gdG9wb2xvZ3kudG9Ub3BvR2VvbShnZW9tLCAkMTo6dmFyY2hhciwgJDI6OmludGVnZXIpIHdoZXJlIGlkID0gJDNgLFxuICAgICAgICAgIFt0b3BvbG9neU5hbWUsIGxheWVySWQsICtpdGVtWydpZCddXVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cblxuICBhc3luYyBkdW1wQ29hc3RsaW5lKHBnLCBpZCkge1xuICAgIGNvbnN0IGZyb21UYWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCB0b1RhYmxlID0gYCR7dGhpcy4jZHVtcFNjaGVtYVRhYmxlfWA7XG4gICAgY29uc3QgdHlwZSA9ICdvdXRlcic7XG4gICAgY29uc3QgY2F0ZWdvcnkgPSAnY29hc3RsaW5lJztcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0b1RhYmxlfSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCAoc3RfZHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHtmcm9tVGFibGV9XG4gICAgICAgIHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM1xuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCAocm93X251bWJlcigpIG92ZXIoKSk6OmludGVnZXIgYXMgcGF0aCwgZ2VvbSBmcm9tIHRhXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke3RvVGFibGV9ICh0YXJnZXRfaWQsIHBhdGgsIHR5cGUsIGNhdGVnb3J5LCBnZW9tLCBwb2ludHMsIGxlbmd0aCkgXG4gICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyB0YXJnZXRfaWQsIHBhdGgsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCBnZW9tLCBcbiAgICAgIHN0X25wb2ludHMoZ2VvbSkgYXMgcG9pbnRzLCBzdF9sZW5ndGgoZ2VvbSkgYXMgbGVuZ3RoIGZyb20gdGIgb3JkZXIgYnkgcGF0aCBhc2NgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApO1xuICB9XG5cblxuICBhc3luYyBkdW1wQ29hc3RsaW5lQXZnVmVydGljZXMocGcsIGlkKSB7XG4gICAgY29uc3QgZnJvbVRhYmxlID0gJ2JvdW5kYXJ5LmxpbmUnO1xuICAgIGNvbnN0IHRvVGFibGUgPSBgJHt0aGlzLiNkdW1wU2NoZW1hVGFibGV9YDtcbiAgICBjb25zdCB0eXBlID0gJ291dGVyJztcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdjb2FzdGxpbmUnO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSAke3RvVGFibGV9IHdoZXJlIHRhcmdldF9pZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNgLCBbaWQsIHR5cGUsIGNhdGVnb3J5XSk7XG5cbiAgICBhd2FpdCBwZy5xdWVyeShgd2l0aCBcbiAgICAgIHRhIGFzIChcbiAgICAgICAgc2VsZWN0IChzdF9kdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSAke2Zyb21UYWJsZX1cbiAgICAgICAgd2hlcmUgaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzXG4gICAgICApXG4gICAgICAsIHRiIGFzIChcbiAgICAgICAgc2VsZWN0IHN0X3N1YmRpdmlkZShnZW9tLCAxMDAwMCkgYXMgZ2VvbSBmcm9tIHRhXG4gICAgICApXG4gICAgICAsIHRjIGFzIChcbiAgICAgICAgc2VsZWN0IChyb3dfbnVtYmVyKCkgb3ZlcigpKTo6aW50ZWdlciBhcyBwYXRoLCBnZW9tIGZyb20gdGJcbiAgICAgIClcbiAgICAgIGluc2VydCBpbnRvICR7dG9UYWJsZX0gKHRhcmdldF9pZCwgcGF0aCwgdHlwZSwgY2F0ZWdvcnksIGdlb20sIHBvaW50cywgbGVuZ3RoKSBcbiAgICAgIHNlbGVjdCAkMTo6YmlnaW50IGFzIHRhcmdldF9pZCwgcGF0aCwgJDI6OnZhcmNoYXIgYXMgdHlwZSwgJDM6OnZhcmNoYXIgYXMgY2F0ZWdvcnksIGdlb20sIFxuICAgICAgc3RfbnBvaW50cyhnZW9tKSBhcyBwb2ludHMsIHN0X2xlbmd0aChnZW9tKSBhcyBsZW5ndGggZnJvbSB0YyBvcmRlciBieSBwYXRoIGFzY2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICk7XG4gIH1cblxuXG4gIGFzeW5jIGVkZ2VDb2FzdGxpbmUocGcsIGlkKSB7XG4gICAgY29uc3Qgc3RhcnRJdGVtSWQgPSAwO1xuICAgIGNvbnN0IHRvcG9sb2d5TmFtZSA9IHRoaXMuI3RvcG9sb2d5TmFtZTtcbiAgICBjb25zdCB0eXBlID0gJ291dGVyJztcbiAgICBjb25zdCBsaXN0ID0gYXdhaXQgdGhpcy5nZXRDb2FzdGxpbmVEdW1wKHBnLCBpZCwgdHlwZSk7XG4gICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgZm9yIGF3YWl0IChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICAgIGlmIChpdGVtWydpZCddIDwgc3RhcnRJdGVtSWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBhd2FpdCBVdGlscy5jYWxsKGAke2l0ZW1bJ2lkJ119fCR7aXRlbVsndGFyZ2V0X2lkJ119fCR7aXRlbVsncGF0aCddfWAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgcGcucXVlcnkoXG4gICAgICAgICAgYHdpdGggXG4gICAgICAgICAgdGEgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGdlb20gZnJvbSAke3RoYXQuI2R1bXBTY2hlbWFUYWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgICAgICAgIClcbiAgICAgICAgICBzZWxlY3QgVG9wb0dlb19BZGRMaW5lU3RyaW5nKCQyOjp2YXJjaGFyLCBnZW9tLCAwKSBmcm9tIHRhYCxcbiAgICAgICAgICBbK2l0ZW1bJ2lkJ10sIHRvcG9sb2d5TmFtZV1cbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG5cbiAgYXN5bmMgbWFwQ29hc3RsaW5lKHBnLCBpZCkge1xuICAgIGNvbnN0IHN0YXJ0SXRlbUlkID0gNTIyNTA7XG4gICAgY29uc3QgbGF5ZXJJZCA9IGF3YWl0IHRoaXMuZ2V0VG9wb2xvZ3lMYXllcklkKHBnKTtcbiAgICBjb25zdCB0b3BvbG9neU5hbWUgPSB0aGlzLiN0b3BvbG9neU5hbWU7XG4gICAgY29uc3QgdHlwZSA9ICdvdXRlcic7XG4gICAgY29uc3QgbGlzdCA9IGF3YWl0IHRoaXMuZ2V0Q29hc3RsaW5lRHVtcChwZywgaWQsIHR5cGUpO1xuICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgIGZvciBhd2FpdCAoY29uc3QgaXRlbSBvZiBsaXN0KSB7XG4gICAgICBpZiAoaXRlbVsnaWQnXSA8IHN0YXJ0SXRlbUlkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgYXdhaXQgVXRpbHMuY2FsbChgJHtpdGVtWydpZCddfXwke2l0ZW1bJ3RhcmdldF9pZCddfXwke2l0ZW1bJ3BhdGgnXX1gLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHBnLnF1ZXJ5KFxuICAgICAgICAgIGB1cGRhdGUgJHt0aGF0LiNkdW1wU2NoZW1hVGFibGV9IHNldCB0b3BvX2dlb20gPSB0b3BvbG9neS50b1RvcG9HZW9tKGdlb20sICQxOjp2YXJjaGFyLCAkMjo6aW50ZWdlcikgd2hlcmUgaWQgPSAkM2AsXG4gICAgICAgICAgW3RvcG9sb2d5TmFtZSwgbGF5ZXJJZCwgK2l0ZW1bJ2lkJ11dXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuXG4gIGFzeW5jIGdldENvYXN0bGluZUR1bXAocGcsIGlkLCB0eXBlKSB7XG4gICAgY29uc3QgdGFibGUgPSBgJHt0aGlzLiNkdW1wU2NoZW1hVGFibGV9YDtcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdjb2FzdGxpbmUnO1xuICAgIGNvbnN0IHNxbCA9IGBzZWxlY3QgaWQsIHRhcmdldF9pZCwgcGF0aCBmcm9tICR7dGFibGV9IHdoZXJlIHRhcmdldF9pZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDMgb3JkZXIgYnkgaWQgYXNjLCBwYXRoIGFzY2A7XG4gICAgcmV0dXJuIGF3YWl0IHBnXG4gICAgICAucXVlcnkoc3FsLCBbaWQsIHR5cGUsIGNhdGVnb3J5XSlcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgIH0pXG4gICAgO1xuICB9XG5cblxuICBhc3luYyBnZXRKdW5jdHVyZUR1bXAocGcsIGlkLCB0eXBlKSB7XG4gICAgY29uc3QgdGFibGUgPSBgJHt0aGlzLiNkdW1wU2NoZW1hVGFibGV9YDtcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdqdW5jdHVyZSc7XG4gICAgY29uc3Qgc3FsID0gYHNlbGVjdCBpZCwgdGFyZ2V0X2lkLCBwYXRoIGZyb20gJHt0YWJsZX0gd2hlcmUgdGFyZ2V0X2lkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkMyBvcmRlciBieSBpZCBhc2MsIHBhdGggYXNjYDtcbiAgICByZXR1cm4gYXdhaXQgcGdcbiAgICAgIC5xdWVyeShzcWwsIFtpZCwgdHlwZSwgY2F0ZWdvcnldKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgfSlcbiAgICA7XG4gIH1cblxuICBhc3luYyBnZXRUb3BvbG9neUlkKHBnKSB7XG4gICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAucXVlcnkoYHNlbGVjdCBpZCBmcm9tIHRvcG9sb2d5LnRvcG9sb2d5IHdoZXJlIG5hbWUgPSAkMWAsIFt0aGlzLiN0b3BvbG9neU5hbWVdKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgfSlcbiAgICA7XG4gICAgcmV0dXJuIHJvd3NbMF1bJ2lkJ10gfHwgMDtcbiAgfVxuXG5cblxuICBhc3luYyBnZXRUb3BvbG9neUxheWVySWQocGcpIHtcbiAgICBjb25zdCB0b3BvbG9neUlkID0gYXdhaXQgdGhpcy5nZXRUb3BvbG9neUlkKHBnKTtcbiAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgIC5xdWVyeShgc2VsZWN0IGxheWVyX2lkIGZyb20gdG9wb2xvZ3kubGF5ZXIgd2hlcmUgdG9wb2xvZ3lfaWQgPSAkMWAsIFsrdG9wb2xvZ3lJZF0pXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICB9KVxuICAgIDtcbiAgICByZXR1cm4gcm93c1swXVsnbGF5ZXJfaWQnXSB8fCAwO1xuICB9XG5cblxuXG4gIGFzeW5jIHJlZ2lzdGVyVG9wb2xvZ3lTaW1wbGlmeUZ1bmN0aW9uKHBnKSB7XG4gICAgYXdhaXQgcGcucXVlcnkoYENSRUFURSBPUiBSRVBMQUNFIEZVTkNUSU9OIHB1YmxpYy4ke3RoaXMuI3RvcG9sb2d5TmFtZX1fU2ltcGxpZnlFZGdlR2VvbVRvQmFja3VwKGFuZWRnZSBpbnQsIG1heHRvbGVyYW5jZSBmbG9hdDgpXG5SRVRVUk5TIGZsb2F0OCBBUyAkJFxuREVDTEFSRVxuICB0b2wgZmxvYXQ4O1xuICBzcWwgdmFyY2hhcjtcbkJFR0lOXG4gIHRvbCA6PSBtYXh0b2xlcmFuY2U7XG4gIExPT1BcbiAgICBzcWwgOj0gJ1NFTEVDVCB0b3BvbG9neS5TVF9DaGFuZ2VFZGdlR2VvbSgnJHt0aGlzLiN0b3BvbG9neU5hbWV9X2JhY2t1cCcsICcgfHwgYW5lZGdlXG4gICAgICB8fCAnLCBTVF9TaW1wbGlmeVByZXNlcnZlVG9wb2xvZ3koZ2VvbSwgJyB8fCB0b2wgfHwgJykpIEZST00gJ1xuICAgICAgfHwgJHt0aGlzLiN0b3BvbG9neU5hbWV9IHx8ICcuZWRnZSBXSEVSRSBlZGdlX2lkID0gJyB8fCBhbmVkZ2U7XG4gICAgQkVHSU5cbiAgICAgIFJBSVNFIERFQlVHICdSdW5uaW5nICUnLCBzcWw7XG4gICAgICBFWEVDVVRFIHNxbDtcbiAgICAgIFJFVFVSTiB0b2w7XG4gICAgRVhDRVBUSU9OXG4gICAgIFdIRU4gT1RIRVJTIFRIRU5cbiAgICAgIFJBSVNFIFdBUk5JTkcgJ1NpbXBsaWZpY2F0aW9uIG9mIGVkZ2UgJSB3aXRoIHRvbGVyYW5jZSAlIGZhaWxlZDogJScsIGFuZWRnZSwgdG9sLCBTUUxFUlJNO1xuICAgICAgdG9sIDo9IHJvdW5kKCAodG9sLzIuMCkgKiAxZTggKSAvIDFlODsgLS0gcm91bmQgdG8gZ2V0IHRvIHplcm8gcXVpY2tlclxuICAgICAgSUYgdG9sID0gMCBUSEVOIFJBSVNFIFdBUk5JTkcgJyUnLCBTUUxFUlJNOyBFTkQgSUY7XG4gICAgRU5EO1xuICBFTkQgTE9PUDtcbkVORFxuJCQgTEFOR1VBR0UgJ3BscGdzcWwnIFNUQUJMRSBTVFJJQ1RzYCk7XG4gIH1cblxuXG4gIGFzeW5jIGRvVG9wb0JhY2t1cChwZywgaWQsIHR5cGUsIGNhdGVnb3J5LCBtYXhUb2xlcmFuY2UpIHtcbiAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICB0YSBhcyAoXG4gICAgICBzZWxlY3QgZ2VvbSBmcm9tIGJvdW5kYXJ5LmxpbmUgd2hlcmUgaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzXG4gICAgKVxuICAgICwgdGIgYXMgKFxuICAgICAgc2VsZWN0IGUuZWRnZV9pZCBhcyBlZGdlX2lkIGZyb20gJHt0aGlzLiN0b3BvbG9neU5hbWV9X2JhY2t1cC5lZGdlX2RhdGEgYXMgZSwgdGEgXG4gICAgICB3aGVyZSBzdF9pbnRlcnNlY3RzKHRhLmdlb20sIGUuZ2VvbSkgPSB0cnVlIG9yZGVyIGJ5IGUuZWRnZV9pZCBhc2NcbiAgICApXG4gICAgc2VsZWN0IGVkZ2VfaWQsIHB1YmxpYy4ke3RoaXMuI3RvcG9sb2d5TmFtZX1fU2ltcGxpZnlFZGdlR2VvbVRvQmFja3VwKGVkZ2VfaWQsICQ0OjpmbG9hdCkgZnJvbSB0YmA7XG4gICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWQsIHR5cGUsIGNhdGVnb3J5LCBtYXhUb2xlcmFuY2VdKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IExpYlRvcG9MaW5lOyJdfQ==