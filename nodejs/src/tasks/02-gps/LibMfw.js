'use strict';


import $ from './../../modules';

class LibMfw {

  static async mapForeignData(pg) {
    await $.OSM.getCountryTree().each(async (index, item) => {
      const id = index + 900000;
      let mddId = 0;
      let name = item.zhName;
      if (item.mfwId !== undefined) {
        const regionId = item.mfwId;
        if (regionId > 0) {
          const data = await $.Mfw.getRegionRestFul().getRegionInfo(regionId);
          mddId = data['mddid'];
          if (data['cname'] && data['cname'].length > 0) {
            name = data['cname'];
          }
        }
        console.log(id, name, mddId, regionId);
        const fromTable = 'gps.world';
        const toTable = 'gps.mfw';
        const sql = `insert into ${toTable} 
        (id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id) 
        select 
        id, parent_id, key, level, iso, $1::varchar as zh_name, en_name, geom, 
        $2::bigint as region_id, $3::bigint as mdd_id  
        from ${fromTable} where id = $4 
        on conflict (id) do update set 
        parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso,
        zh_name = excluded.zh_name, en_name = excluded.en_name, 
        geom = excluded.geom, mdd_id = excluded.mdd_id, region_id = excluded.region_id`;
        await pg.query(sql, [name, regionId, mddId, id]);
      }
    });
  }


  static async mapChinaCountryData(pg) {
    const fromTable = 'gps.world';
    const toTable = 'gps.mfw';
    // 中国
    const chinaRegionId = 17348;
    let data = await $.Mfw.getRegionRestFul().getRegionInfo(chinaRegionId);
    let mddId = data['mddid'];
    let name = data['cname'];
    console.log(1, name, mddId, chinaRegionId);
    const sql = `insert into ${toTable} 
    (id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id) 
    select 
    id, parent_id, key, level, iso, $1::varchar as zh_name, en_name, geom, 
    $2::bigint as region_id, $3::bigint as mdd_id  
    from ${fromTable} where id = $4 
    on conflict (id) do update set 
    parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso,
    zh_name = excluded.zh_name, en_name = excluded.en_name, 
    geom = excluded.geom, mdd_id = excluded.mdd_id, region_id = excluded.region_id`;
    await pg.query(sql, [name, chinaRegionId, mddId, 1]);
  }
}


export default LibMfw;