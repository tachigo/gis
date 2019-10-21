'use strict';



import $ from './../../modules';
import Utils from "../../modules/Utils";

class LibChinaProvince {


  static async initGps(pg) {
    await pg.query(`delete from gps.world where id > 10 and id < 50`);
    await pg.query(`delete from gps.mfw where id > 10 and id < 50`);
  }


  static async initProvinceGpsWorld(pg) {
    const fromTable = 'amap.china';
    const toTable = 'gps.world';
    const sql = `insert into ${toTable} (id, parent_id, level, iso, zh_name, en_name, geom) 
    select id, parent_id, level, iso, zh_name, en_name, ST_Multi(geom) as geom 
    from ${fromTable} where id > 10 and id < 50
    on conflict (id) do update set 
    parent_id = excluded.parent_id, level = excluded.level, iso = excluded.iso,
    zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom`;
    await pg.query(sql);
  }


  static async initProvinceGpsMfw(pg, id) {
    await $.AMap.getProvinces(
      async (item) => {
        return +item.id === id;
      },
      async (item) => {
        const fromTable = 'gps.world';
        const toTable = 'gps.mfw';
        const regionId = item.mfwId;
        let data = await $.Mfw.getRegionRestFul().getRegionInfo(regionId);
        let mddId = data['mddid'];
        let name = data['cname'];
        console.log(id, name, mddId, regionId);
        const sql = `insert into ${toTable} 
        (id, parent_id, key, level, iso, zh_name, en_name, region_id, mdd_id) 
        select 
        id, parent_id, key, level, iso, $1::varchar as zh_name, en_name, 
        $2::bigint as region_id, $3::bigint as mdd_id  
        from ${fromTable} where id = $4 
        on conflict (id) do update set 
        parent_id = excluded.parent_id, key = excluded.key, 
        level = excluded.level, iso = excluded.iso,
        zh_name = excluded.zh_name, en_name = excluded.en_name, 
        mdd_id = excluded.mdd_id, region_id = excluded.region_id`;
        await pg.query(sql, [name, regionId, mddId, id]);
      }
    );
  }


  static async getProvinceGpsMfwList(pg) {
    const table = 'gps.mfw';
    const sql = `select id, zh_name from ${table} where id > 1 and id < 50 order by id asc`;
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


  static async fillProvinceGpsMfw(pg) {
    const excludeIds = [41, 36, 35, 36, 30, 38, 15, 18, 17, 16];
    await $.AMap.getProvinces(
      async (item) => {
        return !excludeIds.includes(+item['id']);
      },
      async (item) => {
        const fromTable = 'gps.world';
        const toTable = 'gps.mfw';
        const regionId = item.mfwId;
        let data = await $.Mfw.getRegionRestFul().getRegionInfo(regionId);
        let mddId = data['mddid'];
        let name = data['cname'];
        console.log(item['id'], name, mddId, regionId);
        const sql = `insert into ${toTable} 
        (id, parent_id, key, level, iso, zh_name, en_name, region_id, mdd_id, geom) 
        select 
        id, parent_id, key, level, iso, $1::varchar as zh_name, en_name, 
        $2::bigint as region_id, $3::bigint as mdd_id, geom 
        from ${fromTable} where id = $4
        on conflict (id) do update set 
        parent_id = excluded.parent_id, key = excluded.key, 
        level = excluded.level, iso = excluded.iso,
        zh_name = excluded.zh_name, en_name = excluded.en_name, 
        mdd_id = excluded.mdd_id, region_id = excluded.region_id, geom = excluded.geom`;
        await pg.query(sql, [name, regionId, mddId, item['id']]);
      }
    );
  }


  static async gps2boundary(pg, id) {
    const gpsTable = 'gps.mfw';
    const boundaryTable = 'boundary.mfw';
    const sql = `with 
    ta as (
      select id, parent_id, key, level, iso, zh_name, en_name, region_id, mdd_id, geom
      from ${gpsTable} where id = $1 
    )
    , tb as (
      select $1::bigint as id, geom from boundary.mfw where id = 1
    )
    , tc as (
      select ta.id as id, parent_id, key, level, iso, zh_name, en_name, region_id, mdd_id, 
      ST_Intersection(ST_MakeValid(ta.geom), ST_MakeValid(tb.geom)) as geom 
      from ta left join tb on ta.id = tb.id
    )
    insert into ${boundaryTable} (id, parent_id, key, level, iso, zh_name, en_name, region_id, mdd_id, geom) 
    select id, parent_id, key, level, iso, zh_name, en_name, region_id, mdd_id, geom from tc
    on conflict (id) do update set 
    parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso, 
    zh_name = excluded.zh_name, en_name = excluded.en_name, region_id = excluded.region_id, mdd_id = excluded.mdd_id, 
    geom = excluded.geom`;
    await pg.query(sql, [id]);
  }


  static async fixGpsMfw(pg, aId, bId) {
    const table = 'gps.mfw';
    const sql = `with 
    ta as (
      select 1 as id, geom from ${table} where id = $1
    )
    , tb as (
      select 1 as id, geom from ${table} where id = $2 
    )
    , tc as (
      select ST_Difference(ta.geom, tb.geom) as geom from ta left join tb on ta.id = tb.id
    )
    insert into ${table} (id, geom) 
    select $1::bigint as id, geom from tc 
    on conflict (id) do update set geom = excluded.geom`;
    await pg.query(sql, [aId, bId]);
  }



  static async getBoundaryList(pg) {
    const table = 'boundary.mfw';
    const sql = `select id, zh_name from ${table} where id > 10 and id < 50 order by id asc`;
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


  static async calcOuterCoastlines(pg, theId = 0) {
    const list = await this.getBoundaryList(pg);
    for await (const item of list) {
      if (theId > 0) {
        if (theId === item.id) {
          await Utils.call(
            `计算${item.name}#${item.id}的外圈海岸边界线`,
            this.calcOuterCoastline.bind(this),
            [pg, item.id, item.name]
          );
        }
      } else {
        await Utils.call(
          `计算${item.name}#${item.id}的外圈海岸边界线`,
          this.calcOuterCoastline.bind(this),
          [pg, item.id, item.name]
        );
      }
    }
  }



  static async calcOuterCoastline(pg, id, name) {
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
        select (ST_Dump(geom)).geom as geom from ${boundaryTable} where id = $1
      )
      , tb as (
        select 1 as id, ST_Collect(ST_ExteriorRing(geom)) as geom from ta 
      )
      , tc as (
        select 1 as id, ST_Collect(geom) as geom 
        from ${lineTable} where id = $1 and category = 'juncture'
      )
      , td as (
        select $1::bigint as id, $2::varchar as type, $3::varchar as category, $4::varchar as name, 
        ST_Difference(ST_MakeValid(tb.geom), ST_MakeValid(tc.geom)) as geom 
        from tb left join tc on tb.id = tc.id
      )
      insert into ${lineTable} (id, type, category, name, geom) 
      select id, type, category, name, geom 
      from td where ST_NPoints(geom) > 0 
      on conflict (id, type, category) do update set 
      name = excluded.name, geom = excluded.geom`;
      await pg.query(sql, [id, type, category, name]);
    } else {
      // 无juncture
      const sql = `with 
      ta as (
        select (ST_Dump(geom)).geom as geom from ${boundaryTable} where id = $1
      )
      , tb as (
        select 1 as id, ST_Collect(ST_ExteriorRing(geom)) as geom from ta 
      )
      , tc as (
        select $1::bigint as id, $2::varchar as type, $3::varchar as category, $4::varchar as name, geom 
        from tb  
      )
      insert into ${lineTable} (id, type, category, name, geom) 
      select id, type, category, name, geom 
      from tc where ST_NPoints(geom) > 0 
      on conflict (id, type, category) do update set 
      name = excluded.name, geom = excluded.geom`;

      await pg.query(sql, [id, type, category, name]);
    }

    await this.lineMerge(pg, id, type, category);

    // geom type
    const row = await pg.query(
      `select ST_GeometryType(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    ).then(res => {
      return res.rows[0] || {};
    });
    const geometryType = row['geom_type'] || '无外圈海岸边界线';
    console.log(`${name}#${id}: ${geometryType}`);
  }


  static async lineMerge(pg, id, type, category) {
    const table = 'boundary.line';
    await pg.query(
      `update ${table} set geom = ST_LineMerge(geom) where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    );
  }

  static async calcInnerJunctures(pg, theId = 0) {
    const list = await this.getBoundaryList(pg);
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


  static async calcOuterJunctures(pg, theId = 0) {
    const list = await this.getBoundaryList(pg);
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


  static async calcInnerJuncture(pg, id, name) {
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
      select (ST_Dump(geom)).geom as geom from ${boundaryTable} where id = $1
    )
    , tb as (
      select (ST_DumpRings(geom)) as dump from ta
    )
    , tc as (
      select (dump).path[1] as path, (dump).geom as geom from tb 
    )
    , td as (
      select $1::bigint as id, $2::varchar as type, $3::varchar as category, 
      $4::varchar as name, ST_LineMerge(ST_Collect(ST_Boundary(geom))) as geom 
      from tc where path > 0
    )
    insert into ${lineTable} (id, type, category, name, geom) 
    select id, type, category, name, geom from td
    where ST_NPoints(geom) > 0 
    on conflict (id, type, category) do update set 
    name = excluded.name, geom = excluded.geom`;

    await pg.query(sql, [id, type, category, name]);

    await this.lineMerge(pg, id, type, category);

    // geom type
    const row = await pg.query(
      `select ST_GeometryType(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    ).then(res => {
      return res.rows[0] || {};
    });
    const geometryType = row['geom_type'] || '无内圈圈陆地边界线';
    console.log(`${name}#${id}: ${geometryType}`);
  }


  static async calcOuterJuncture(pg, id, name) {
    // 通过与中国海岸线做差集
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
      select 1 as id, geom from ${lineTable} where id = 1 and type = 'outer' and category = 'coastline'
    )
    , tb as (
      select (ST_Dump(geom)).geom as geom from ${boundaryTable} where id = $1
    )
    , tc as (
      select 1 as id, ST_LineMerge(ST_Collect(ST_ExteriorRing(geom))) as geom from tb
    )
    , td as (
      select ST_Difference(ST_MakeValid(tc.geom), ST_MakeValid(ta.geom)) as geom 
      from ta left join tc on ta.id = tc.id
    )
    , te as (
      select (ST_Dump(geom)).geom as geom from td 
    )
    , tf as (
      select geom from te 
      where (ST_IsClosed(geom) = false and ST_NPoints(geom) > 4 and ST_Length(geom::geography) / 1000 > 4) 
      or (ST_IsClosed(geom) = true)
    )
    , tg as (
      select $1::bigint as id, $2::varchar as type, $3::varchar as category, 
      $4::varchar as name, ST_LineMerge(ST_Collect(geom)) as geom from tf 
    )
    insert into ${lineTable} (id, type, category, name, geom) 
    select id, type, category, name, geom from tg
    where ST_NPoints(geom) > 0 
    on conflict (id, type, category) do update set 
    name = excluded.name, geom = excluded.geom`;

    await pg.query(sql, [id, type, category, name]);

    await this.lineMerge(pg, id, type, category);

    // geom type
    const row = await pg.query(
      `select ST_GeometryType(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`,
      [id, type, category]
    ).then(res => {
      return res.rows[0] || {};
    });
    const geometryType = row['geom_type'] || '无外圈陆地边界线';
    console.log(`${name}#${id}: ${geometryType}`);
  }

}

export default LibChinaProvince;