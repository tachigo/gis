'use strict';

import Utils from './../../modules/Utils';

class LibLine {

  static async getForeignList(pg) {
    const table = 'gps.mfw';
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


  static async calcForeignOuterJunctures(pg, theId = 0) {
    const list = await this.getForeignList(pg);
    for await (const item of list) {
      if (theId > 0) {
        if (theId === item.id) {
          await Utils.call(
            `计算${item.name}#${item.id}的外圈陆地边界线`,
            this.calcOuterJuncture.bind(this),
            [pg, item.id, item.name]
          );
        }
      } else {
        await Utils.call(
          `计算${item.name}#${item.id}的外圈陆地边界线`,
          this.calcOuterJuncture.bind(this),
          [pg, item.id, item.name]
        );
      }
    }
  }


  static async calcForeignInnerJunctures(pg, theId = 0) {
    const list = await this.getForeignList(pg);
    for await (const item of list) {
      if (theId > 0) {
        if (theId === item.id) {
          await Utils.call(
            `计算${item.name}#${item.id}的内圈陆地边界线`,
            this.calcInnerJuncture.bind(this),
            [pg, item.id, item.name]
          );
        }
      } else {
        await Utils.call(
          `计算${item.name}#${item.id}的内圈陆地边界线`,
          this.calcInnerJuncture.bind(this),
          [pg, item.id, item.name]
        );
      }
    }
  }


  static async calcForeignCoastlines(pg, theId = 0) {
    const list = await this.getForeignList(pg);
    for await (const item of list) {
      if (theId > 0) {
        if (theId === item.id) {
          await Utils.call(
            `计算${item.name}#${item.id}的海岸边界线`,
            this.calcCoastline.bind(this),
            [pg, item.id, item.name]
          );
        }
      } else {
        await Utils.call(
          `计算${item.name}#${item.id}的海岸边界线`,
          this.calcCoastline.bind(this),
          [pg, item.id, item.name]
        );
      }
    }
  }


  static async calcCoastline(pg, id, name) {
    // 通过 boundary 和 juncture 做差集来求 coastline
    const boundaryTable = 'boundary.mfw';
    const lineTable = 'boundary.line';
    const type = 'outer';
    const category = 'coastline';

    await pg.query(
      `delete from ${lineTable} where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    );

    // 是否有juncture
    const rows = await pg
      .query(`select id from ${lineTable} where id = $1 and category = $2`, [id, 'juncture'])
      .then(res => {
        return res.rows || [];
      })
    ;

    if (rows.length > 0) {
      // 有juncture
      const sql = `with 
      ta as (
        select (st_dump(geom)).geom as geom from ${boundaryTable} where id = $1
      )
      , tb as (
        select 1 as id, st_collect(st_exteriorring(geom)) as geom from ta 
      )
      , tc as (
        select 1 as id, st_collect(geom) as geom 
        from ${lineTable} where id = $1 and category = 'juncture'
      )
      , td as (
        select $1::bigint as id, $2::varchar as type, $3::varchar as category, $4::varchar as name, 
        st_difference(tb.geom, st_makevalid(tc.geom)) as geom 
        from tb left join tc on tb.id = tc.id
      )
      insert into ${lineTable} (id, type, category, name, geom) 
      select id, type, category, name, geom 
      from td where st_npoints(geom) > 0 
      on conflict (id, type, category) do update set 
      name = excluded.name, geom = excluded.geom`;
      await pg.query(sql, [id, type, category, name]);
    } else {
      // 无juncture
      const sql = `with 
      ta as (
        select (st_dump(geom)).geom as geom from ${boundaryTable} where id = $1
      )
      , tb as (
        select 1 as id, st_collect(st_exteriorring(geom)) as geom from ta 
      )
      , tc as (
        select $1::bigint as id, $2::varchar as type, $3::varchar as category, $4::varchar as name, geom 
        from tb  
      )
      insert into ${lineTable} (id, type, category, name, geom) 
      select id, type, category, name, geom 
      from tc where st_npoints(geom) > 0 
      on conflict (id, type, category) do update set 
      name = excluded.name, geom = excluded.geom`;

      await pg.query(sql, [id, type, category, name]);
    }

    await this.lineMerge(pg, id, type, category);

    // geom type
    const row = await pg.query(
      `select st_geometrytype(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    ).then(res => {
      return res.rows[0] || {};
    });
    const geometryType = row['geom_type'] || '无海岸边界线';
    console.log(`${name}#${id}: ${geometryType}`);
  }



  static async calcInnerJuncture(pg, id, name) {
    // 通过gps与boundary的交集求juncture
    const gpsTable = 'gps.mfw';
    const boundaryTable = 'boundary.mfw';
    const lineTable = 'boundary.line';
    const type = 'inner';
    const category = 'juncture';

    await pg.query(
      `delete from ${lineTable} where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    );

    const sql = `with 
    ta as (
      select (st_dump(geom)).geom as geom from ${boundaryTable} where id = $1
    )
    , tb as (
      select st_dumprings(geom) as dump from ta
    )
    , tc as (
      select (dump).path[1] as path, (dump).geom as geom from tb 
    )
    , td as (
      select 1 as id, st_linemerge(st_collect(st_boundary(geom))) as geom from tc where path > 0
    )
    , te as (
      select 1 as id, st_linemerge(st_boundary(geom)) as geom from ${gpsTable} where id = $1
    )
    , tf as (
      select $1::bigint as id, $2::varchar as type, $3::varchar as category, $4::varchar as name, 
      st_intersection(te.geom, st_makevalid(td.geom)) as geom 
      from te left join td on te.id = td.id
    )
    insert into ${lineTable} (id, type, category, name, geom) 
    select id, type, category, name, geom from tf 
    where st_npoints(geom) > 0
    on conflict (id, type, category) do update set 
    name = excluded.name, geom = excluded.geom`;

    await pg.query(sql, [id, type, category, name]);

    await this.lineMerge(pg, id, type, category);

    // geom type
    const row = await pg.query(
      `select st_geometrytype(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    ).then(res => {
      return res.rows[0] || {};
    });
    const geometryType = row['geom_type'] || '无内圈陆地边界线';
    console.log(`${name}#${id}: ${geometryType}`);
  }


  static async calcOuterJuncture(pg, id, name) {
    // 通过gps与boundary的交集求juncture
    const gpsTable = 'gps.mfw';
    const boundaryTable = 'boundary.mfw';
    const lineTable = 'boundary.line';
    const type = 'outer';
    const category = 'juncture';

    await pg.query(
      `delete from ${lineTable} where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    );

    const sql = `with 
    ta as (
      select (st_dump(geom)).geom as geom from ${boundaryTable} where id = $1
    )
    , tb as (
      select 1 as id, st_linemerge(st_collect(st_exteriorring(geom))) as geom from ta
    )
    , tc as (
      select 1 as id, st_linemerge(st_boundary(geom)) as geom from ${gpsTable} where id = $1
    )
    , td as (
      select $1::bigint as id, $2::varchar as type, $3::varchar as name, 
      st_intersection(tb.geom, st_makevalid(tc.geom)) as geom 
      from tb left join tc on tb.id = tc.id
    )
    insert into ${lineTable} (id, type, category, name, geom) 
    select id, type, $4::varchar as category, name, geom from td 
    where st_npoints(geom) > 0 
    on conflict (id, type, category) do update set 
    name = excluded.name, geom = excluded.geom`;

    await pg.query(sql, [id, type, name, category]);

    await this.lineMerge(pg, id, type, category);

    // geom type
    const row = await pg.query(
      `select st_geometrytype(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    ).then(res => {
      return res.rows[0] || {};
    });
    const geometryType = row['geom_type'] || '无外圈陆地边界线';
    console.log(`${name}#${id}: ${geometryType}`);
  }



  static async lineMerge(pg, id, type, category) {
    const table = 'boundary.line';
    await pg.query(
      `update ${table} set geom = st_linemerge(geom) where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    );
  }


}


export default LibLine;