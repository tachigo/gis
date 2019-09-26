'use strict';



class LibMfwCustom {

  /**
   * 获取和中国相交的
   * @param pg
   * @returns {Promise<Array<{id, zhName}>>}
   */
  static async countryIntersectWithChina(pg) {
    const table = 'gps.world';
    const sql = `with 
    ta as (
      select geom from ${table} where id = 1
    )
    select tb.id as id, tb.zh_name as zh_name, tb.iso as iso from ${table} as tb, ta 
    where tb.id > 900000 and level <= 1 and st_intersects(ta.geom, tb.geom) = true order by id asc`;
    const res = await pg.query(sql);
    const items = [];
    const ids = [];
    for await (const row of res.rows) {
      ids.push(row['id']);
      items.push({
        id: row['id'],
        zhName: row['zh_name'],
      });
    }
    return items;
  }

}


export default LibMfwCustom;