'use strict';


class LibPrepare {

  static async clearData(pg) {
    const table = 'gps.world';
    await pg.query(`delete from ${table}`);
  }

  static async importOSM(pg) {
    const fromTable = 'osm.relation_aggregate';
    const toTable = 'gps.world';
    const sql = `insert into ${toTable} (id, parent_id, level, iso, zh_name, en_name, geom) 
    select id, parent_id, level, iso, zh_name, en_name, st_multi(geom) as geom 
    from ${fromTable} 
    on conflict (id) do update set 
    parent_id = excluded.parent_id, level = excluded.level, iso = excluded.iso,
    zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom`;
    await pg.query(sql);
  }

  static async importAMap(pg) {
    const fromTable = 'amap.china';
    const toTable = 'gps.world';
    const sql = `insert into ${toTable} (id, parent_id, level, iso, zh_name, en_name, geom) 
    select id, parent_id, level, iso, zh_name, en_name, st_multi(geom) as geom 
    from ${fromTable} 
    on conflict (id) do update set 
    parent_id = excluded.parent_id, level = excluded.level, iso = excluded.iso,
    zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom`;
    await pg.query(sql);
  }
}


export default LibPrepare;