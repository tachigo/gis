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
  constructor(topologyName) {
    Object.defineProperty(this, _topologyName, {
      writable: true,
      value: void 0
    });
    _classPrivateFieldLooseBase(this, _topologyName)[_topologyName] = topologyName;
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
      await pg.query(`alter table topo.line_topo drop column topo_geom`);
    } catch (e) {
      console.error(e.message);
    }

    try {
      await pg.query(`alter table topo.line_topo drop constraint check_topogeom_topo_geom`);
    } catch (e) {
      console.error(e.message);
    }

    const backupTopologyId = await this.getBackupTopologyId(pg);
    const backupTopologyLayerId = await this.getBackupTopologyLayerId(pg);
    await pg.query(`alter table topo.line_topo add column topo_geom topogeometry`);
    await pg.query(`alter table topo.line_topo add constraint check_topogeom_topo_geom 
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
    await pg.query(`delete from topo.line_topo where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
    await pg.query(`insert into topo.line_topo (id, target_id, path, type, category)
      select id, target_id, path, type, category from topo.line_dump
      where target_id = $1 and type = $2 and category = $3
      on conflict (id) do update set
      target_id = excluded.target_id, path = excluded.path,
      type = excluded.type, category = excluded.category`, [id, type, category]);
    await pg.query(`with 
      ta as (
        select id, (topo_geom).id as feature_id, (topo_geom).type as feature_type from topo.line_dump 
        where target_id = $1 and type = $2 and category = $3
      )
      , tb as (
        select id, ($4::integer, $5::integer, feature_id, feature_type)::topogeometry as topo_geom from ta
      )
      insert into topo.line_topo (id, topo_geom) 
      select id, topo_geom from tb 
      on conflict (id) do update set topo_geom = excluded.topo_geom`, [id, type, category, backupTopologyId, backupLayerId]);
  }

  static async buildBackup(pg, id, type, category) {
    await pg.query(`update topo.line_topo set geom = topo_geom::geometry where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
    await pg.query(`update topo.line_topo set points = st_npoints(geom), length = st_length(geom) where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
  }

  async initTables(pg) {
    await this.initDumpTable(pg);
    await LibTopology.initTopoTable(pg);
  }

  async initDumpTable(pg) {
    const table = 'topo.line_dump';

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
    await pg.query(`create index topo_line_dump_geom_idx on ${table} using gist (geom)`);
    await pg.query(`select topology.AddTopoGeometryColumn($1, 'topo', 'line_dump', 'topo_geom', 'LINE')`, [_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]]);
  }

  static async initTopoTable(pg) {
    const table = 'topo.line_topo';

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
    await pg.query(`create index topo_line_topo_geom_idx on ${table} using gist (geom)`);
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

  static async dumpJunctureAvgVertices(pg, id, type) {
    const fromTable = 'boundary.line';
    const toTable = 'topo.line_dump';
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

    const list = await LibTopology.getJunctureDump(pg, id, type);

    for await (const item of list) {
      await _Utils.default.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(`with 
          ta as (
            select geom from topo.line_dump where id = $1
          )
          select TopoGeo_AddLineString($2::varchar, geom, 0) from ta`, [+item['id'], topologyName]);
      });
    }
  }

  async mapJuncture(pg, id, type) {
    const layerId = await this.getTopologyLayerId(pg);

    const topologyName = _classPrivateFieldLooseBase(this, _topologyName)[_topologyName];

    const list = await LibTopology.getJunctureDump(pg, id, type);

    for await (const item of list) {
      await _Utils.default.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(`update topo.line_dump set topo_geom = topology.toTopoGeom(geom, $1::varchar, $2::integer) where id = $3`, [topologyName, layerId, +item['id']]);
      });
    }
  }

  static async dumpCoastlineAvgVertices(pg, id) {
    const fromTable = 'boundary.line';
    const toTable = 'topo.line_dump';
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
    const topologyName = _classPrivateFieldLooseBase(this, _topologyName)[_topologyName];

    const type = 'outer';
    const list = await LibTopology.getCoastlineDump(pg, id, type);

    for await (const item of list) {
      await _Utils.default.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(`with 
          ta as (
            select geom from topo.line_dump where id = $1
          )
          select TopoGeo_AddLineString($2::varchar, geom, 0) from ta`, [+item['id'], topologyName]);
      });
    }
  }

  async mapCoastline(pg, id) {
    const layerId = await this.getTopologyLayerId(pg);

    const topologyName = _classPrivateFieldLooseBase(this, _topologyName)[_topologyName];

    const type = 'outer';
    const list = await LibTopology.getCoastlineDump(pg, id, type);

    for await (const item of list) {
      await _Utils.default.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(`update topo.line_dump set topo_geom = topology.toTopoGeom(geom, $1::varchar, $2::integer) where id = $3`, [topologyName, layerId, +item['id']]);
      });
    }
  }

  static async getCoastlineDump(pg, id, type) {
    const table = 'topo.line_dump';
    const category = 'coastline';
    const sql = `select id, target_id, path from ${table} where target_id = $1 and type = $2 and category = $3 order by id asc, path asc`;
    return await pg.query(sql, [id, type, category]).then(res => {
      return res.rows || [];
    });
  }

  static async getJunctureDump(pg, id, type) {
    const table = 'topo.line_dump';
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
      select e.edge_id as edge_id from line_topo_backup.edge_data as e, ta 
      where st_intersects(ta.geom, e.geom) = true order by e.edge_id asc
    )
    select edge_id, public.${_classPrivateFieldLooseBase(this, _topologyName)[_topologyName]}_SimplifyEdgeGeomToBackup('line_topo', edge_id, $4::float) from tb`;
    await pg.query(sql, [id, type, category, maxTolerance]);
  }

}

var _topologyName = _classPrivateFieldLooseKey("topologyName");

var _default = LibTopology;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC10b3BvLWxpbmUvTGliVG9wb2xvZ3kuanMiXSwibmFtZXMiOlsiTGliVG9wb2xvZ3kiLCJjb25zdHJ1Y3RvciIsInRvcG9sb2d5TmFtZSIsImNyZWF0ZVRvcG9sb2d5IiwicGciLCJxdWVyeSIsImRyb3BUb3BvbG9neSIsImJhY2t1cFRvcG9sb2d5IiwiZSIsImNvbnNvbGUiLCJlcnJvciIsIm1lc3NhZ2UiLCJiYWNrdXBUb3BvbG9neUlkIiwiZ2V0QmFja3VwVG9wb2xvZ3lJZCIsImJhY2t1cFRvcG9sb2d5TGF5ZXJJZCIsImdldEJhY2t1cFRvcG9sb2d5TGF5ZXJJZCIsInJvd3MiLCJ0aGVuIiwicmVzIiwidG9wb2xvZ3lJZCIsImJhY2t1cFRvcG9sb2d5RGF0YSIsImlkIiwidHlwZSIsImNhdGVnb3J5IiwiYmFja3VwTGF5ZXJJZCIsImJ1aWxkQmFja3VwIiwiaW5pdFRhYmxlcyIsImluaXREdW1wVGFibGUiLCJpbml0VG9wb1RhYmxlIiwidGFibGUiLCJnZXRGb3JlaWduTGlzdCIsInNxbCIsImxpc3QiLCJyb3ciLCJwdXNoIiwibmFtZSIsImR1bXBKdW5jdHVyZUF2Z1ZlcnRpY2VzIiwiZnJvbVRhYmxlIiwidG9UYWJsZSIsImVkZ2VKdW5jdHVyZSIsImdldEp1bmN0dXJlRHVtcCIsIml0ZW0iLCJVdGlscyIsImNhbGwiLCJtYXBKdW5jdHVyZSIsImxheWVySWQiLCJnZXRUb3BvbG9neUxheWVySWQiLCJkdW1wQ29hc3RsaW5lQXZnVmVydGljZXMiLCJlZGdlQ29hc3RsaW5lIiwiZ2V0Q29hc3RsaW5lRHVtcCIsIm1hcENvYXN0bGluZSIsImdldFRvcG9sb2d5SWQiLCJyZWdpc3RlclRvcG9sb2d5U2ltcGxpZnlGdW5jdGlvbiIsImRvVG9wb0JhY2t1cCIsIm1heFRvbGVyYW5jZSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFFQTs7Ozs7Ozs7OztBQUVBLE1BQU1BLFdBQU4sQ0FBa0I7QUFJaEJDLEVBQUFB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QXdEOzs7Ozs7OztpREFBeEQsNEJBUThCLElBUjlCLCtCQVFpRDs7V0FSakQsNEJBVVIsSUFWUSwrQkFVVzs7Ozs7Ozs7Ozs7OztxQ0FWcEIsQ0FBTjtBQXdCRDs7QUFHRCxRQUFNZ0QsWUFBTixDQUFtQmpELEVBQW5CLEVBQXVCaUIsRUFBdkIsRUFBMkJDLElBQTNCLEVBQWlDQyxRQUFqQyxFQUEyQytCLFlBQTNDLEVBQXlEO0FBQ3ZELFVBQU12QixHQUFHLEdBQUk7Ozs7Ozs7OzZCQUFELDRCQVFhLElBUmIsK0JBUWdDLG9FQVI1QztBQVNBLFVBQU0zQixFQUFFLENBQUNDLEtBQUgsQ0FBUzBCLEdBQVQsRUFBYyxDQUFDVixFQUFELEVBQUtDLElBQUwsRUFBV0MsUUFBWCxFQUFxQitCLFlBQXJCLENBQWQsQ0FBTjtBQUNEOztBQTlYZTs7OztlQWtZSHRELFciLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBVdGlscyBmcm9tICcuLy4uLy4uL21vZHVsZXMvVXRpbHMnO1xuXG5jbGFzcyBMaWJUb3BvbG9neSB7XG5cbiAgI3RvcG9sb2d5TmFtZTtcblxuICBjb25zdHJ1Y3Rvcih0b3BvbG9neU5hbWUpIHtcbiAgICB0aGlzLiN0b3BvbG9neU5hbWUgPSB0b3BvbG9neU5hbWU7XG4gIH1cblxuICBhc3luYyBjcmVhdGVUb3BvbG9neShwZykge1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBzZWxlY3QgdG9wb2xvZ3kuQ3JlYXRlVG9wb2xvZ3koJDEsIDQzMjYpYCwgW3RoaXMuI3RvcG9sb2d5TmFtZV0pO1xuICB9XG5cbiAgYXN5bmMgZHJvcFRvcG9sb2d5KHBnKSB7XG4gICAgYXdhaXQgcGcucXVlcnkoYHNlbGVjdCB0b3BvbG9neS5Ecm9wVG9wb2xvZ3koJDEpYCwgW3RoaXMuI3RvcG9sb2d5TmFtZV0pO1xuICB9XG5cblxuICBhc3luYyBiYWNrdXBUb3BvbG9neShwZykge1xuICAgIGNvbnN0IHRvcG9sb2d5TmFtZSA9IGAke3RoaXMuI3RvcG9sb2d5TmFtZX1fYmFja3VwYDtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYHNlbGVjdCB0b3BvbG9neS5Ecm9wVG9wb2xvZ3koJDEpYCwgW3RvcG9sb2d5TmFtZV0pO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG4gICAgYXdhaXQgcGcucXVlcnkoYHNlbGVjdCB0b3BvbG9neS5Db3B5VG9wb2xvZ3koJDE6OnZhcmNoYXIsICQyOjp2YXJjaGFyKWAsIFt0aGlzLiN0b3BvbG9neU5hbWUsIHRvcG9sb2d5TmFtZV0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBhbHRlciB0YWJsZSB0b3BvLmxpbmVfdG9wbyBkcm9wIGNvbHVtbiB0b3BvX2dlb21gKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwZy5xdWVyeShgYWx0ZXIgdGFibGUgdG9wby5saW5lX3RvcG8gZHJvcCBjb25zdHJhaW50IGNoZWNrX3RvcG9nZW9tX3RvcG9fZ2VvbWApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG4gICAgY29uc3QgYmFja3VwVG9wb2xvZ3lJZCA9IGF3YWl0IHRoaXMuZ2V0QmFja3VwVG9wb2xvZ3lJZChwZyk7XG4gICAgY29uc3QgYmFja3VwVG9wb2xvZ3lMYXllcklkID0gYXdhaXQgdGhpcy5nZXRCYWNrdXBUb3BvbG9neUxheWVySWQocGcpO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBhbHRlciB0YWJsZSB0b3BvLmxpbmVfdG9wbyBhZGQgY29sdW1uIHRvcG9fZ2VvbSB0b3BvZ2VvbWV0cnlgKTtcbiAgICBhd2FpdCBwZy5xdWVyeShgYWx0ZXIgdGFibGUgdG9wby5saW5lX3RvcG8gYWRkIGNvbnN0cmFpbnQgY2hlY2tfdG9wb2dlb21fdG9wb19nZW9tIFxuICAgIGNoZWNrICgodG9wb19nZW9tKS50b3BvbG9neV9pZCA9ICR7K2JhY2t1cFRvcG9sb2d5SWR9IFxuICAgIGFuZCAodG9wb19nZW9tKS5sYXllcl9pZCA9ICR7K2JhY2t1cFRvcG9sb2d5TGF5ZXJJZH0gXG4gICAgYW5kICh0b3BvX2dlb20pLnR5cGUgPSAyKWApO1xuICB9XG5cbiAgYXN5bmMgZ2V0QmFja3VwVG9wb2xvZ3lJZChwZykge1xuICAgIGNvbnN0IHRvcG9sb2d5TmFtZSA9IGAke3RoaXMuI3RvcG9sb2d5TmFtZX1fYmFja3VwYDtcbiAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgIC5xdWVyeShgc2VsZWN0IGlkIGZyb20gdG9wb2xvZ3kudG9wb2xvZ3kgd2hlcmUgbmFtZSA9ICQxYCwgW3RvcG9sb2d5TmFtZV0pXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICB9KVxuICAgIDtcbiAgICByZXR1cm4gcm93c1swXVsnaWQnXSB8fCAwO1xuICB9XG5cbiAgYXN5bmMgZ2V0QmFja3VwVG9wb2xvZ3lMYXllcklkKHBnKSB7XG4gICAgY29uc3QgdG9wb2xvZ3lJZCA9IGF3YWl0IHRoaXMuZ2V0QmFja3VwVG9wb2xvZ3lJZChwZyk7XG4gICAgY29uc3Qgcm93cyA9IGF3YWl0IHBnXG4gICAgICAucXVlcnkoYHNlbGVjdCBsYXllcl9pZCBmcm9tIHRvcG9sb2d5LmxheWVyIHdoZXJlIHRvcG9sb2d5X2lkID0gJDFgLCBbK3RvcG9sb2d5SWRdKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgfSlcbiAgICA7XG4gICAgcmV0dXJuIHJvd3NbMF1bJ2xheWVyX2lkJ10gfHwgMDtcbiAgfVxuXG4gIGFzeW5jIGJhY2t1cFRvcG9sb2d5RGF0YShwZywgaWQsIHR5cGUsIGNhdGVnb3J5KSB7XG4gICAgY29uc3QgYmFja3VwVG9wb2xvZ3lJZCA9IGF3YWl0IHRoaXMuZ2V0QmFja3VwVG9wb2xvZ3lJZChwZyk7XG4gICAgY29uc3QgYmFja3VwTGF5ZXJJZCA9IGF3YWl0IHRoaXMuZ2V0QmFja3VwVG9wb2xvZ3lMYXllcklkKHBnKTtcblxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSB0b3BvLmxpbmVfdG9wbyB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGBpbnNlcnQgaW50byB0b3BvLmxpbmVfdG9wbyAoaWQsIHRhcmdldF9pZCwgcGF0aCwgdHlwZSwgY2F0ZWdvcnkpXG4gICAgICBzZWxlY3QgaWQsIHRhcmdldF9pZCwgcGF0aCwgdHlwZSwgY2F0ZWdvcnkgZnJvbSB0b3BvLmxpbmVfZHVtcFxuICAgICAgd2hlcmUgdGFyZ2V0X2lkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM1xuICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0XG4gICAgICB0YXJnZXRfaWQgPSBleGNsdWRlZC50YXJnZXRfaWQsIHBhdGggPSBleGNsdWRlZC5wYXRoLFxuICAgICAgdHlwZSA9IGV4Y2x1ZGVkLnR5cGUsIGNhdGVnb3J5ID0gZXhjbHVkZWQuY2F0ZWdvcnlgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCBpZCwgKHRvcG9fZ2VvbSkuaWQgYXMgZmVhdHVyZV9pZCwgKHRvcG9fZ2VvbSkudHlwZSBhcyBmZWF0dXJlX3R5cGUgZnJvbSB0b3BvLmxpbmVfZHVtcCBcbiAgICAgICAgd2hlcmUgdGFyZ2V0X2lkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM1xuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCBpZCwgKCQ0OjppbnRlZ2VyLCAkNTo6aW50ZWdlciwgZmVhdHVyZV9pZCwgZmVhdHVyZV90eXBlKTo6dG9wb2dlb21ldHJ5IGFzIHRvcG9fZ2VvbSBmcm9tIHRhXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byB0b3BvLmxpbmVfdG9wbyAoaWQsIHRvcG9fZ2VvbSkgXG4gICAgICBzZWxlY3QgaWQsIHRvcG9fZ2VvbSBmcm9tIHRiIFxuICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IHRvcG9fZ2VvbSA9IGV4Y2x1ZGVkLnRvcG9fZ2VvbWAsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5LCBiYWNrdXBUb3BvbG9neUlkLCBiYWNrdXBMYXllcklkXVxuICAgICk7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBidWlsZEJhY2t1cChwZywgaWQsIHR5cGUsIGNhdGVnb3J5KSB7XG4gICAgYXdhaXQgcGcucXVlcnkoXG4gICAgICBgdXBkYXRlIHRvcG8ubGluZV90b3BvIHNldCBnZW9tID0gdG9wb19nZW9tOjpnZW9tZXRyeSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcbiAgICBhd2FpdCBwZy5xdWVyeShcbiAgICAgIGB1cGRhdGUgdG9wby5saW5lX3RvcG8gc2V0IHBvaW50cyA9IHN0X25wb2ludHMoZ2VvbSksIGxlbmd0aCA9IHN0X2xlbmd0aChnZW9tKSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGluaXRUYWJsZXMocGcpIHtcbiAgICBhd2FpdCB0aGlzLmluaXREdW1wVGFibGUocGcpO1xuICAgIGF3YWl0IExpYlRvcG9sb2d5LmluaXRUb3BvVGFibGUocGcpO1xuICB9XG5cbiAgYXN5bmMgaW5pdER1bXBUYWJsZShwZykge1xuICAgIGNvbnN0IHRhYmxlID0gJ3RvcG8ubGluZV9kdW1wJztcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcGcucXVlcnkoYGRyb3AgdGFibGUgJHt0YWJsZX0gY2FzY2FkZWApO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICB9XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSB0YWJsZSBpZiBub3QgZXhpc3RzICR7dGFibGV9XG4gICAgKFxuICAgICAgICBpZCBiaWdzZXJpYWwgcHJpbWFyeSBrZXksXG4gICAgICAgIHRhcmdldF9pZCBiaWdpbnQsXG4gICAgICAgIHBhdGggaW50LFxuICAgICAgICB0eXBlIHZhcmNoYXIsXG4gICAgICAgIGNhdGVnb3J5IHZhcmNoYXIsXG4gICAgICAgIHBvaW50cyBpbnRlZ2VyLFxuICAgICAgICBsZW5ndGggZmxvYXQsXG4gICAgICAgIGdlb20gZ2VvbWV0cnksXG4gICAgICAgIGNvbnN0cmFpbnQgZW5mb3JjZV9zcmlkX2dlb20gY2hlY2sgKHN0X3NyaWQoZ2VvbSkgPSA0MzI2KVxuICAgIClgKTtcbiAgICBhd2FpdCBwZy5xdWVyeShgY3JlYXRlIGluZGV4IHRvcG9fbGluZV9kdW1wX2dlb21faWR4IG9uICR7dGFibGV9IHVzaW5nIGdpc3QgKGdlb20pYCk7XG4gICAgYXdhaXQgcGcucXVlcnkoYHNlbGVjdCB0b3BvbG9neS5BZGRUb3BvR2VvbWV0cnlDb2x1bW4oJDEsICd0b3BvJywgJ2xpbmVfZHVtcCcsICd0b3BvX2dlb20nLCAnTElORScpYCwgW3RoaXMuI3RvcG9sb2d5TmFtZV0pO1xuICB9XG5cbiAgc3RhdGljIGFzeW5jIGluaXRUb3BvVGFibGUocGcpIHtcbiAgICBjb25zdCB0YWJsZSA9ICd0b3BvLmxpbmVfdG9wbyc7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KGBkcm9wIHRhYmxlICR7dGFibGV9IGNhc2NhZGVgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgfVxuICAgIGF3YWl0IHBnLnF1ZXJ5KGBjcmVhdGUgdGFibGUgaWYgbm90IGV4aXN0cyAke3RhYmxlfVxuICAgIChcbiAgICAgICAgaWQgYmlnc2VyaWFsIHByaW1hcnkga2V5LFxuICAgICAgICB0YXJnZXRfaWQgYmlnaW50LFxuICAgICAgICBwYXRoIGludCxcbiAgICAgICAgdHlwZSB2YXJjaGFyLFxuICAgICAgICBjYXRlZ29yeSB2YXJjaGFyLFxuICAgICAgICBwb2ludHMgaW50ZWdlcixcbiAgICAgICAgbGVuZ3RoIGZsb2F0LFxuICAgICAgICBnZW9tIGdlb21ldHJ5LFxuICAgICAgICBjb25zdHJhaW50IGVuZm9yY2Vfc3JpZF9nZW9tIGNoZWNrIChzdF9zcmlkKGdlb20pID0gNDMyNilcbiAgICApYCk7XG4gICAgYXdhaXQgcGcucXVlcnkoYGNyZWF0ZSBpbmRleCB0b3BvX2xpbmVfdG9wb19nZW9tX2lkeCBvbiAke3RhYmxlfSB1c2luZyBnaXN0IChnZW9tKWApO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgZ2V0Rm9yZWlnbkxpc3QocGcpIHtcbiAgICBjb25zdCB0YWJsZSA9ICdib3VuZGFyeS5tZncnO1xuICAgIGNvbnN0IHNxbCA9IGBzZWxlY3QgaWQsIHpoX25hbWUgZnJvbSAke3RhYmxlfSB3aGVyZSBpZCA+IDkwMDAwMCBvcmRlciBieSBpZCBhc2NgO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBnLnF1ZXJ5KHNxbCk7XG4gICAgY29uc3QgbGlzdCA9IFtdO1xuICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJlcy5yb3dzKSB7XG4gICAgICBsaXN0LnB1c2goe1xuICAgICAgICBpZDogK3Jvd1snaWQnXSxcbiAgICAgICAgbmFtZTogcm93Wyd6aF9uYW1lJ11cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbGlzdDtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGR1bXBKdW5jdHVyZUF2Z1ZlcnRpY2VzKHBnLCBpZCwgdHlwZSkge1xuICAgIGNvbnN0IGZyb21UYWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCB0b1RhYmxlID0gJ3RvcG8ubGluZV9kdW1wJztcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdqdW5jdHVyZSc7XG4gICAgYXdhaXQgcGcucXVlcnkoYGRlbGV0ZSBmcm9tICR7dG9UYWJsZX0gd2hlcmUgdGFyZ2V0X2lkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsIFtpZCwgdHlwZSwgY2F0ZWdvcnldKTtcblxuICAgIGF3YWl0IHBnLnF1ZXJ5KGB3aXRoIFxuICAgICAgdGEgYXMgKFxuICAgICAgICBzZWxlY3QgKHN0X2R1bXAoZ2VvbSkpLmdlb20gYXMgZ2VvbSBmcm9tICR7ZnJvbVRhYmxlfVxuICAgICAgICB3aGVyZSBpZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNcbiAgICAgIClcbiAgICAgICwgdGIgYXMgKFxuICAgICAgICBzZWxlY3Qgc3Rfc3ViZGl2aWRlKGdlb20sIDEwMDAwKSBhcyBnZW9tIGZyb20gdGFcbiAgICAgIClcbiAgICAgICwgdGMgYXMgKFxuICAgICAgICBzZWxlY3QgKHJvd19udW1iZXIoKSBvdmVyKCkpOjppbnRlZ2VyIGFzIHBhdGgsIGdlb20gZnJvbSB0YlxuICAgICAgKVxuICAgICAgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSAodGFyZ2V0X2lkLCBwYXRoLCB0eXBlLCBjYXRlZ29yeSwgZ2VvbSwgcG9pbnRzLCBsZW5ndGgpIFxuICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgdGFyZ2V0X2lkLCBwYXRoLCAkMjo6dmFyY2hhciBhcyB0eXBlLCAkMzo6dmFyY2hhciBhcyBjYXRlZ29yeSwgZ2VvbSwgXG4gICAgICBzdF9ucG9pbnRzKGdlb20pIGFzIHBvaW50cywgc3RfbGVuZ3RoKGdlb20pIGFzIGxlbmd0aCBmcm9tIHRjIG9yZGVyIGJ5IHBhdGggYXNjYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcbiAgfVxuXG5cbiAgYXN5bmMgZWRnZUp1bmN0dXJlKHBnLCBpZCwgdHlwZSkge1xuICAgIGNvbnN0IHRvcG9sb2d5TmFtZSA9IHRoaXMuI3RvcG9sb2d5TmFtZTtcbiAgICBjb25zdCBsaXN0ID0gYXdhaXQgTGliVG9wb2xvZ3kuZ2V0SnVuY3R1cmVEdW1wKHBnLCBpZCwgdHlwZSk7XG4gICAgZm9yIGF3YWl0IChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICAgIGF3YWl0IFV0aWxzLmNhbGwoYCR7aXRlbVsnaWQnXX18JHtpdGVtWyd0YXJnZXRfaWQnXX18JHtpdGVtWydwYXRoJ119YCwgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBwZy5xdWVyeShcbiAgICAgICAgICBgd2l0aCBcbiAgICAgICAgICB0YSBhcyAoXG4gICAgICAgICAgICBzZWxlY3QgZ2VvbSBmcm9tIHRvcG8ubGluZV9kdW1wIHdoZXJlIGlkID0gJDFcbiAgICAgICAgICApXG4gICAgICAgICAgc2VsZWN0IFRvcG9HZW9fQWRkTGluZVN0cmluZygkMjo6dmFyY2hhciwgZ2VvbSwgMCkgZnJvbSB0YWAsXG4gICAgICAgICAgWytpdGVtWydpZCddLCB0b3BvbG9neU5hbWVdXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuXG4gIGFzeW5jIG1hcEp1bmN0dXJlKHBnLCBpZCwgdHlwZSkge1xuICAgIGNvbnN0IGxheWVySWQgPSBhd2FpdCB0aGlzLmdldFRvcG9sb2d5TGF5ZXJJZChwZyk7XG4gICAgY29uc3QgdG9wb2xvZ3lOYW1lID0gdGhpcy4jdG9wb2xvZ3lOYW1lO1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCBMaWJUb3BvbG9neS5nZXRKdW5jdHVyZUR1bXAocGcsIGlkLCB0eXBlKTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgbGlzdCkge1xuICAgICAgYXdhaXQgVXRpbHMuY2FsbChgJHtpdGVtWydpZCddfXwke2l0ZW1bJ3RhcmdldF9pZCddfXwke2l0ZW1bJ3BhdGgnXX1gLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHBnLnF1ZXJ5KFxuICAgICAgICAgIGB1cGRhdGUgdG9wby5saW5lX2R1bXAgc2V0IHRvcG9fZ2VvbSA9IHRvcG9sb2d5LnRvVG9wb0dlb20oZ2VvbSwgJDE6OnZhcmNoYXIsICQyOjppbnRlZ2VyKSB3aGVyZSBpZCA9ICQzYCxcbiAgICAgICAgICBbdG9wb2xvZ3lOYW1lLCBsYXllcklkLCAraXRlbVsnaWQnXV1cbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGR1bXBDb2FzdGxpbmVBdmdWZXJ0aWNlcyhwZywgaWQpIHtcbiAgICBjb25zdCBmcm9tVGFibGUgPSAnYm91bmRhcnkubGluZSc7XG4gICAgY29uc3QgdG9UYWJsZSA9ICd0b3BvLmxpbmVfZHVtcCc7XG4gICAgY29uc3QgdHlwZSA9ICdvdXRlcic7XG4gICAgY29uc3QgY2F0ZWdvcnkgPSAnY29hc3RsaW5lJztcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gJHt0b1RhYmxlfSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoYHdpdGggXG4gICAgICB0YSBhcyAoXG4gICAgICAgIHNlbGVjdCAoc3RfZHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHtmcm9tVGFibGV9XG4gICAgICAgIHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM1xuICAgICAgKVxuICAgICAgLCB0YiBhcyAoXG4gICAgICAgIHNlbGVjdCBzdF9zdWJkaXZpZGUoZ2VvbSwgMTAwMDApIGFzIGdlb20gZnJvbSB0YVxuICAgICAgKVxuICAgICAgLCB0YyBhcyAoXG4gICAgICAgIHNlbGVjdCAocm93X251bWJlcigpIG92ZXIoKSk6OmludGVnZXIgYXMgcGF0aCwgZ2VvbSBmcm9tIHRiXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke3RvVGFibGV9ICh0YXJnZXRfaWQsIHBhdGgsIHR5cGUsIGNhdGVnb3J5LCBnZW9tLCBwb2ludHMsIGxlbmd0aCkgXG4gICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyB0YXJnZXRfaWQsIHBhdGgsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCBnZW9tLCBcbiAgICAgIHN0X25wb2ludHMoZ2VvbSkgYXMgcG9pbnRzLCBzdF9sZW5ndGgoZ2VvbSkgYXMgbGVuZ3RoIGZyb20gdGMgb3JkZXIgYnkgcGF0aCBhc2NgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApO1xuICB9XG5cblxuICBhc3luYyBlZGdlQ29hc3RsaW5lKHBnLCBpZCkge1xuICAgIGNvbnN0IHRvcG9sb2d5TmFtZSA9IHRoaXMuI3RvcG9sb2d5TmFtZTtcbiAgICBjb25zdCB0eXBlID0gJ291dGVyJztcbiAgICBjb25zdCBsaXN0ID0gYXdhaXQgTGliVG9wb2xvZ3kuZ2V0Q29hc3RsaW5lRHVtcChwZywgaWQsIHR5cGUpO1xuICAgIGZvciBhd2FpdCAoY29uc3QgaXRlbSBvZiBsaXN0KSB7XG4gICAgICBhd2FpdCBVdGlscy5jYWxsKGAke2l0ZW1bJ2lkJ119fCR7aXRlbVsndGFyZ2V0X2lkJ119fCR7aXRlbVsncGF0aCddfWAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgcGcucXVlcnkoXG4gICAgICAgICAgYHdpdGggXG4gICAgICAgICAgdGEgYXMgKFxuICAgICAgICAgICAgc2VsZWN0IGdlb20gZnJvbSB0b3BvLmxpbmVfZHVtcCB3aGVyZSBpZCA9ICQxXG4gICAgICAgICAgKVxuICAgICAgICAgIHNlbGVjdCBUb3BvR2VvX0FkZExpbmVTdHJpbmcoJDI6OnZhcmNoYXIsIGdlb20sIDApIGZyb20gdGFgLFxuICAgICAgICAgIFsraXRlbVsnaWQnXSwgdG9wb2xvZ3lOYW1lXVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cblxuICBhc3luYyBtYXBDb2FzdGxpbmUocGcsIGlkKSB7XG4gICAgY29uc3QgbGF5ZXJJZCA9IGF3YWl0IHRoaXMuZ2V0VG9wb2xvZ3lMYXllcklkKHBnKTtcbiAgICBjb25zdCB0b3BvbG9neU5hbWUgPSB0aGlzLiN0b3BvbG9neU5hbWU7XG4gICAgY29uc3QgdHlwZSA9ICdvdXRlcic7XG4gICAgY29uc3QgbGlzdCA9IGF3YWl0IExpYlRvcG9sb2d5LmdldENvYXN0bGluZUR1bXAocGcsIGlkLCB0eXBlKTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgbGlzdCkge1xuICAgICAgYXdhaXQgVXRpbHMuY2FsbChgJHtpdGVtWydpZCddfXwke2l0ZW1bJ3RhcmdldF9pZCddfXwke2l0ZW1bJ3BhdGgnXX1gLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHBnLnF1ZXJ5KFxuICAgICAgICAgIGB1cGRhdGUgdG9wby5saW5lX2R1bXAgc2V0IHRvcG9fZ2VvbSA9IHRvcG9sb2d5LnRvVG9wb0dlb20oZ2VvbSwgJDE6OnZhcmNoYXIsICQyOjppbnRlZ2VyKSB3aGVyZSBpZCA9ICQzYCxcbiAgICAgICAgICBbdG9wb2xvZ3lOYW1lLCBsYXllcklkLCAraXRlbVsnaWQnXV1cbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGdldENvYXN0bGluZUR1bXAocGcsIGlkLCB0eXBlKSB7XG4gICAgY29uc3QgdGFibGUgPSAndG9wby5saW5lX2R1bXAnO1xuICAgIGNvbnN0IGNhdGVnb3J5ID0gJ2NvYXN0bGluZSc7XG4gICAgY29uc3Qgc3FsID0gYHNlbGVjdCBpZCwgdGFyZ2V0X2lkLCBwYXRoIGZyb20gJHt0YWJsZX0gd2hlcmUgdGFyZ2V0X2lkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkMyBvcmRlciBieSBpZCBhc2MsIHBhdGggYXNjYDtcbiAgICByZXR1cm4gYXdhaXQgcGdcbiAgICAgIC5xdWVyeShzcWwsIFtpZCwgdHlwZSwgY2F0ZWdvcnldKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgfSlcbiAgICA7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBnZXRKdW5jdHVyZUR1bXAocGcsIGlkLCB0eXBlKSB7XG4gICAgY29uc3QgdGFibGUgPSAndG9wby5saW5lX2R1bXAnO1xuICAgIGNvbnN0IGNhdGVnb3J5ID0gJ2p1bmN0dXJlJztcbiAgICBjb25zdCBzcWwgPSBgc2VsZWN0IGlkLCB0YXJnZXRfaWQsIHBhdGggZnJvbSAke3RhYmxlfSB3aGVyZSB0YXJnZXRfaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzIG9yZGVyIGJ5IGlkIGFzYywgcGF0aCBhc2NgO1xuICAgIHJldHVybiBhd2FpdCBwZ1xuICAgICAgLnF1ZXJ5KHNxbCwgW2lkLCB0eXBlLCBjYXRlZ29yeV0pXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICB9KVxuICAgIDtcbiAgfVxuXG4gIGFzeW5jIGdldFRvcG9sb2d5SWQocGcpIHtcbiAgICBjb25zdCByb3dzID0gYXdhaXQgcGdcbiAgICAgIC5xdWVyeShgc2VsZWN0IGlkIGZyb20gdG9wb2xvZ3kudG9wb2xvZ3kgd2hlcmUgbmFtZSA9ICQxYCwgW3RoaXMuI3RvcG9sb2d5TmFtZV0pXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICB9KVxuICAgIDtcbiAgICByZXR1cm4gcm93c1swXVsnaWQnXSB8fCAwO1xuICB9XG5cblxuXG4gIGFzeW5jIGdldFRvcG9sb2d5TGF5ZXJJZChwZykge1xuICAgIGNvbnN0IHRvcG9sb2d5SWQgPSBhd2FpdCB0aGlzLmdldFRvcG9sb2d5SWQocGcpO1xuICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgLnF1ZXJ5KGBzZWxlY3QgbGF5ZXJfaWQgZnJvbSB0b3BvbG9neS5sYXllciB3aGVyZSB0b3BvbG9neV9pZCA9ICQxYCwgWyt0b3BvbG9neUlkXSlcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgIH0pXG4gICAgO1xuICAgIHJldHVybiByb3dzWzBdWydsYXllcl9pZCddIHx8IDA7XG4gIH1cblxuXG5cbiAgYXN5bmMgcmVnaXN0ZXJUb3BvbG9neVNpbXBsaWZ5RnVuY3Rpb24ocGcpIHtcbiAgICBhd2FpdCBwZy5xdWVyeShgQ1JFQVRFIE9SIFJFUExBQ0UgRlVOQ1RJT04gcHVibGljLiR7dGhpcy4jdG9wb2xvZ3lOYW1lfV9TaW1wbGlmeUVkZ2VHZW9tVG9CYWNrdXAoYW5lZGdlIGludCwgbWF4dG9sZXJhbmNlIGZsb2F0OClcblJFVFVSTlMgZmxvYXQ4IEFTICQkXG5ERUNMQVJFXG4gIHRvbCBmbG9hdDg7XG4gIHNxbCB2YXJjaGFyO1xuQkVHSU5cbiAgdG9sIDo9IG1heHRvbGVyYW5jZTtcbiAgTE9PUFxuICAgIHNxbCA6PSAnU0VMRUNUIHRvcG9sb2d5LlNUX0NoYW5nZUVkZ2VHZW9tKCcke3RoaXMuI3RvcG9sb2d5TmFtZX1fYmFja3VwJywgJyB8fCBhbmVkZ2VcbiAgICAgIHx8ICcsIFNUX1NpbXBsaWZ5UHJlc2VydmVUb3BvbG9neShnZW9tLCAnIHx8IHRvbCB8fCAnKSkgRlJPTSAnXG4gICAgICB8fCAke3RoaXMuI3RvcG9sb2d5TmFtZX0gfHwgJy5lZGdlIFdIRVJFIGVkZ2VfaWQgPSAnIHx8IGFuZWRnZTtcbiAgICBCRUdJTlxuICAgICAgUkFJU0UgREVCVUcgJ1J1bm5pbmcgJScsIHNxbDtcbiAgICAgIEVYRUNVVEUgc3FsO1xuICAgICAgUkVUVVJOIHRvbDtcbiAgICBFWENFUFRJT05cbiAgICAgV0hFTiBPVEhFUlMgVEhFTlxuICAgICAgUkFJU0UgV0FSTklORyAnU2ltcGxpZmljYXRpb24gb2YgZWRnZSAlIHdpdGggdG9sZXJhbmNlICUgZmFpbGVkOiAlJywgYW5lZGdlLCB0b2wsIFNRTEVSUk07XG4gICAgICB0b2wgOj0gcm91bmQoICh0b2wvMi4wKSAqIDFlOCApIC8gMWU4OyAtLSByb3VuZCB0byBnZXQgdG8gemVybyBxdWlja2VyXG4gICAgICBJRiB0b2wgPSAwIFRIRU4gUkFJU0UgV0FSTklORyAnJScsIFNRTEVSUk07IEVORCBJRjtcbiAgICBFTkQ7XG4gIEVORCBMT09QO1xuRU5EXG4kJCBMQU5HVUFHRSAncGxwZ3NxbCcgU1RBQkxFIFNUUklDVHNgKTtcbiAgfVxuXG5cbiAgYXN5bmMgZG9Ub3BvQmFja3VwKHBnLCBpZCwgdHlwZSwgY2F0ZWdvcnksIG1heFRvbGVyYW5jZSkge1xuICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgIHRhIGFzIChcbiAgICAgIHNlbGVjdCBnZW9tIGZyb20gYm91bmRhcnkubGluZSB3aGVyZSBpZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNcbiAgICApXG4gICAgLCB0YiBhcyAoXG4gICAgICBzZWxlY3QgZS5lZGdlX2lkIGFzIGVkZ2VfaWQgZnJvbSBsaW5lX3RvcG9fYmFja3VwLmVkZ2VfZGF0YSBhcyBlLCB0YSBcbiAgICAgIHdoZXJlIHN0X2ludGVyc2VjdHModGEuZ2VvbSwgZS5nZW9tKSA9IHRydWUgb3JkZXIgYnkgZS5lZGdlX2lkIGFzY1xuICAgIClcbiAgICBzZWxlY3QgZWRnZV9pZCwgcHVibGljLiR7dGhpcy4jdG9wb2xvZ3lOYW1lfV9TaW1wbGlmeUVkZ2VHZW9tVG9CYWNrdXAoJ2xpbmVfdG9wbycsIGVkZ2VfaWQsICQ0OjpmbG9hdCkgZnJvbSB0YmA7XG4gICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWQsIHR5cGUsIGNhdGVnb3J5LCBtYXhUb2xlcmFuY2VdKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IExpYlRvcG9sb2d5OyJdfQ==