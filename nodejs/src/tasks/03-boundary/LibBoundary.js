'use strict';

import Utils from './../../modules/Utils';


class LibBoundary {


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


  static async calcForeignBoundary(pg) {
    const list = await this.getForeignList(pg);
    const gpsTable = 'gps.mfw';
    const featureTable = 'boundary.water_feature';
    const table = 'boundary.mfw';

    for await (const item of list) {
      await Utils.call(`${item.name}#${item.id}`, async () => {
        const sql2 = `with
        ta as (
          select 1 as id, geom
          from ${featureTable} where id = $1 and fid = $2
        )
        , tb as (
          select 1 as id, st_makevalid(geom) as geom from ${gpsTable} where id = $1
        )
        , tc as (
          select $1::bigint as id, st_difference(tb.geom, st_makevalid(ta.geom)) as geom
          from ta left join tb on ta.id = tb.id
        )
        insert into ${table} (id, geom)
        select id, geom from tc
        on conflict (id) do update set geom = excluded.geom`;
        await pg.query(sql2, [id, 'f0']);
      });
    }
  }


  static async unionForeignWaterFeature(pg) {
    const list = await this.getForeignList(pg);
    const featureTable = 'boundary.water_feature';

    for await (const item of list) {
      await Utils.call(`${item.name}#${item.id}`, async () => {
        const rows = await pg
          .query(`select fid from ${featureTable} where id = $1 order by fid asc limit 1`, [item.id])
          .then(res => {
            return res.rows || [];
          })
        ;
        if (rows.length > 0) {
          await pg.query(`delete from ${featureTable} where id = $1 and fid = $2`, [item.id, 'f0']);
          const sql = `with
          ta as (
            select (st_dump(geom)).geom as geom
            from ${featureTable} where id = $1 and fid != $2
          )
          , tb as (
            select st_buffer(st_collect(geom), 0) as geom from ta
          )
          insert into ${featureTable} (id, fid, geom)
          select $1::bigint as id, $2::varchar as fid, geom from tb
          on conflict (id, fid) do update set geom = excluded.geom`;
          await pg.query(sql, [item.id, 'f0']);
        }
      });
    }
  }

  static async initForeignBoundary(pg) {
    const list = await this.getForeignList(pg);

    const fromTable = 'gps.mfw';
    const toTable = 'boundary.mfw';

    const that = this;
    for await (const item of list) {
      await Utils.call(`${item.name}#${item.id}`, async () => {
        const sql = `insert into ${toTable} 
        (id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id) 
        select id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id 
        from ${fromTable} where id = $1::bigint 
        on conflict (id) do update set 
        parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso, 
        zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom, 
        region_id = excluded.region_id, mdd_id = excluded.mdd_id`;
        await pg.query(sql, [item.id]);
        await that.prepareWaterFeatures(pg, item.id);
      });
    }
  }


  static async prepareWaterFeatures(pg, id) {
    const featureTable = 'boundary.water_feature';
    await pg.query(`delete from ${featureTable} where id = $1`, [id]);

    const gpsTable = 'gps.mfw';
    const featureSourceTable = 'osm.feature_water';

    const sql = `with 
    ta as (
      select geom from ${gpsTable} where id = $1
    )
    , tb as (
      select 'f' || ${featureSourceTable}.id as fid, ${featureSourceTable}.geom as geom 
      from ${featureSourceTable}, ta
      where st_intersects(${featureSourceTable}.geom, ta.geom) = true
    )
    insert into ${featureTable} (id, fid, geom)
    select $1::bigint as id, fid::varchar, st_makevalid(geom) as geom from tb
    on conflict (id, fid) do update set 
    geom = excluded.geom`;
    await pg.query(sql, [id]);
  }
}


export default LibBoundary;