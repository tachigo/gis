'use strict';



class LibTopoBoundary {

  static async init(pg) {
    const fromTable = 'boundary.mfw';
    const toTable = 'topo.boundary';

    const sql = `insert into ${toTable} (id, parent_id, key, level, iso, zh_name, en_name, region_id, mdd_id) 
    select id, parent_id, key, level, iso, zh_name, en_name, region_id, mdd_id from ${fromTable} 
    on conflict (id) do update set 
    parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso, 
    zh_name = excluded.zh_name, en_name = excluded.en_name, region_id = excluded.region_id, mdd_id = excluded.mdd_id`;
    await pg.query(sql);
  }


  static async getForeignList(pg) {
    const table = 'topo.boundary';
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
}


export default LibTopoBoundary;