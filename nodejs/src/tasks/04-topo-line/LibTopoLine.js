'use strict';

import Utils from './../../modules/Utils';


class LibTopoLine {

  #topologyName;

  #dumpTable;
  #dumpSchema;
  #dumpSchemaTable;
  #topoTable;
  #topoSchema;
  #topoSchemaTable;

  constructor(topologyName, dumpTable, topoTable, schema) {
    this.#topologyName = topologyName;
    this.#dumpTable = dumpTable;
    this.#topoTable = topoTable;
    this.#dumpSchema = schema;
    this.#topoSchema = schema;
    this.#dumpSchemaTable = `${this.#dumpSchema}.${this.#dumpTable}`;
    this.#topoSchemaTable = `${this.#topoSchema}.${this.#topoTable}`;
  }

  async createTopology(pg) {
    await pg.query(`select topology.CreateTopology($1, 4326)`, [this.#topologyName]);
  }

  async dropTopology(pg) {
    await pg.query(`select topology.DropTopology($1)`, [this.#topologyName]);
  }


  async backupTopology(pg) {
    const topologyName = `${this.#topologyName}_backup`;
    try {
      await pg.query(`select topology.DropTopology($1)`, [topologyName]);
    } catch (e) {
      console.error(e.message);
    }
    await pg.query(`select topology.CopyTopology($1::varchar, $2::varchar)`, [this.#topologyName, topologyName]);

    try {
      await pg.query(`alter table ${this.#topoSchemaTable} drop column topo_geom`);
    } catch (e) {
      console.error(e.message);
    }
    try {
      await pg.query(`alter table ${this.#topoSchemaTable} drop constraint check_topogeom_topo_geom`);
    } catch (e) {
      console.error(e.message);
    }
    const backupTopologyId = await this.getBackupTopologyId(pg);
    const backupTopologyLayerId = await this.getBackupTopologyLayerId(pg);
    await pg.query(`alter table ${this.#topoSchemaTable} add column topo_geom topogeometry`);
    await pg.query(`alter table ${this.#topoSchemaTable} add constraint check_topogeom_topo_geom 
    check ((topo_geom).topology_id = ${+backupTopologyId} 
    and (topo_geom).layer_id = ${+backupTopologyLayerId} 
    and (topo_geom).type = 2)`);
  }

  async getBackupTopologyId(pg) {
    const topologyName = `${this.#topologyName}_backup`;
    const rows = await pg
      .query(`select id from topology.topology where name = $1`, [topologyName])
      .then(res => {
        return res.rows || [];
      })
    ;
    return rows[0]['id'] || 0;
  }

  async getBackupTopologyLayerId(pg) {
    const topologyId = await this.getBackupTopologyId(pg);
    const rows = await pg
      .query(`select layer_id from topology.layer where topology_id = $1`, [+topologyId])
      .then(res => {
        return res.rows || [];
      })
    ;
    return rows[0]['layer_id'] || 0;
  }

  async backupTopologyData(pg, id, type, category) {
    const backupTopologyId = await this.getBackupTopologyId(pg);
    const backupLayerId = await this.getBackupTopologyLayerId(pg);

    await pg.query(`delete from ${this.#topoSchemaTable} where target_id = $1 and type = $2 and category = $3`, [id, type, category]);
    await pg.query(`insert into ${this.#topoSchemaTable} (id, target_id, path, type, category)
      select id, target_id, path, type, category from ${this.#dumpSchemaTable}
      where target_id = $1 and type = $2 and category = $3
      on conflict (id) do update set
      target_id = excluded.target_id, path = excluded.path,
      type = excluded.type, category = excluded.category`,
      [id, type, category]
    );

    await pg.query(`with 
      ta as (
        select id, (topo_geom).id as feature_id, (topo_geom).type as feature_type from ${this.#dumpSchemaTable} 
        where target_id = $1 and type = $2 and category = $3
      )
      , tb as (
        select id, ($4::integer, $5::integer, feature_id, feature_type)::topogeometry as topo_geom from ta
      )
      insert into ${this.#topoSchemaTable} (id, topo_geom) 
      select id, topo_geom from tb 
      on conflict (id) do update set topo_geom = excluded.topo_geom`,
      [id, type, category, backupTopologyId, backupLayerId]
    );
  }


  async buildBackup(pg, id, type, category) {
    await pg.query(
      `update ${this.#topoSchemaTable} set geom = topo_geom::geometry where target_id = $1 and type = $2 and category = $3`,
      [id, type, category]
    );
    await pg.query(
      `update ${this.#topoSchemaTable} set points = st_npoints(geom), length = st_length(geom) where target_id = $1 and type = $2 and category = $3`,
      [id, type, category]
    );
  }

  async initTables(pg) {
    await this.initDumpTable(pg);
    await this.initTopoTable(pg);
  }

  async initDumpTable(pg) {
    const table = `${this.#dumpSchemaTable}`;
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
    await pg.query(`create index ${this.#topoSchema}_${this.#dumpTable}_geom_idx on ${table} using gist (geom)`);
    await pg.query(`select topology.AddTopoGeometryColumn($1, '${this.#topoSchema}', '${this.#dumpTable}', 'topo_geom', 'LINE')`, [this.#topologyName]);
  }

  async initTopoTable(pg) {
    const table = `${this.#topoSchemaTable}`;
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
    await pg.query(`create index ${this.#topoSchema}_${this.#topoTable}_geom_idx on ${table} using gist (geom)`);
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
    const toTable = `${this.#dumpSchemaTable}`;
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
      st_npoints(geom) as points, st_length(geom) as length from tb order by path asc`,
      [id, type, category]
    );
  }


  async dumpJunctureAvgVertices(pg, id, type) {
    const fromTable = 'boundary.line';
    const toTable = `${this.#dumpSchemaTable}`;
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
      st_npoints(geom) as points, st_length(geom) as length from tc order by path asc`,
      [id, type, category]
    );
  }


  async edgeJuncture(pg, id, type) {
    const topologyName = this.#topologyName;
    const list = await this.getJunctureDump(pg, id, type);
    for await (const item of list) {
      await Utils.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(
          `with 
          ta as (
            select geom from ${this.#dumpSchemaTable} where id = $1
          )
          select TopoGeo_AddLineString($2::varchar, geom, 0) from ta`,
          [+item['id'], topologyName]
        );
      });
    }
  }


  async mapJuncture(pg, id, type) {
    const layerId = await this.getTopologyLayerId(pg);
    const topologyName = this.#topologyName;
    const list = await this.getJunctureDump(pg, id, type);
    const that = this;
    for await (const item of list) {
      await Utils.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(
          `update ${that.#dumpSchemaTable} set topo_geom = topology.toTopoGeom(geom, $1::varchar, $2::integer) where id = $3`,
          [topologyName, layerId, +item['id']]
        );
      });
    }
  }


  async dumpCoastline(pg, id) {
    const fromTable = 'boundary.line';
    const toTable = `${this.#dumpSchemaTable}`;
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
      st_npoints(geom) as points, st_length(geom) as length from tb order by path asc`,
      [id, type, category]
    );
  }


  async dumpCoastlineAvgVertices(pg, id) {
    const fromTable = 'boundary.line';
    const toTable = `${this.#dumpSchemaTable}`;
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
      st_npoints(geom) as points, st_length(geom) as length from tc order by path asc`,
      [id, type, category]
    );
  }


  async edgeCoastline(pg, id) {
    const startItemId = 0;
    const topologyName = this.#topologyName;
    const type = 'outer';
    const list = await this.getCoastlineDump(pg, id, type);
    const that = this;
    for await (const item of list) {
      if (item['id'] < startItemId) {
        continue;
      }
      await Utils.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(
          `with 
          ta as (
            select geom from ${that.#dumpSchemaTable} where id = $1
          )
          select TopoGeo_AddLineString($2::varchar, geom, 0) from ta`,
          [+item['id'], topologyName]
        );
      });
    }
  }


  async mapCoastline(pg, id) {
    const startItemId = 52250;
    const layerId = await this.getTopologyLayerId(pg);
    const topologyName = this.#topologyName;
    const type = 'outer';
    const list = await this.getCoastlineDump(pg, id, type);
    const that = this;
    for await (const item of list) {
      if (item['id'] < startItemId) {
        continue;
      }
      await Utils.call(`${item['id']}|${item['target_id']}|${item['path']}`, async () => {
        await pg.query(
          `update ${that.#dumpSchemaTable} set topo_geom = topology.toTopoGeom(geom, $1::varchar, $2::integer) where id = $3`,
          [topologyName, layerId, +item['id']]
        );
      });
    }
  }


  async getCoastlineDump(pg, id, type) {
    const table = `${this.#dumpSchemaTable}`;
    const category = 'coastline';
    const sql = `select id, target_id, path from ${table} where target_id = $1 and type = $2 and category = $3 order by id asc, path asc`;
    return await pg
      .query(sql, [id, type, category])
      .then(res => {
        return res.rows || [];
      })
    ;
  }


  async getJunctureDump(pg, id, type) {
    const table = `${this.#dumpSchemaTable}`;
    const category = 'juncture';
    const sql = `select id, target_id, path from ${table} where target_id = $1 and type = $2 and category = $3 order by id asc, path asc`;
    return await pg
      .query(sql, [id, type, category])
      .then(res => {
        return res.rows || [];
      })
    ;
  }

  async getTopologyId(pg) {
    const rows = await pg
      .query(`select id from topology.topology where name = $1`, [this.#topologyName])
      .then(res => {
        return res.rows || [];
      })
    ;
    return rows[0]['id'] || 0;
  }



  async getTopologyLayerId(pg) {
    const topologyId = await this.getTopologyId(pg);
    const rows = await pg
      .query(`select layer_id from topology.layer where topology_id = $1`, [+topologyId])
      .then(res => {
        return res.rows || [];
      })
    ;
    return rows[0]['layer_id'] || 0;
  }



  async registerTopologySimplifyFunction(pg) {
    await pg.query(`CREATE OR REPLACE FUNCTION public.${this.#topologyName}_SimplifyEdgeGeomToBackup(anedge int, maxtolerance float8)
RETURNS float8 AS $$
DECLARE
  tol float8;
  sql varchar;
BEGIN
  tol := maxtolerance;
  LOOP
    sql := 'SELECT topology.ST_ChangeEdgeGeom('${this.#topologyName}_backup', ' || anedge
      || ', ST_SimplifyPreserveTopology(geom, ' || tol || ')) FROM '
      || ${this.#topologyName} || '.edge WHERE edge_id = ' || anedge;
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
      select e.edge_id as edge_id from ${this.#topologyName}_backup.edge_data as e, ta 
      where st_intersects(ta.geom, e.geom) = true order by e.edge_id asc
    )
    select edge_id, public.${this.#topologyName}_SimplifyEdgeGeomToBackup(edge_id, $4::float) from tb`;
    await pg.query(sql, [id, type, category, maxTolerance]);
  }
}


export default LibTopoLine;