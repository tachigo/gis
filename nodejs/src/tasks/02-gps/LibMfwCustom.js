'use strict';

import $ from './../../modules';
import WKT from "terraformer-wkt-parser";

class LibMfwCustom {

  static async countryIntersectWith(pg, id) {
    const table = 'gps.mfw';
    const sql = `with 
    ta as (
      select geom from ${table} where id = $1::bigint
    )
    select tb.id as id, tb.zh_name as zh_name, tb.iso as iso from ${table} as tb, ta 
    where tb.id > 900000 and level::integer <= 1 and tb.id != $1::bigint and st_intersects(ta.geom, tb.geom) = true order by id asc`;
    const res = await pg.query(sql, [id]);
    const items = [];
    for await (const row of res.rows) {
      items.push({
        id: +row['id'],
        zhName: row['zh_name'],
      });
    }
    return items;
  }




  static async removeInteriorRing(pg, id) {
    const table = 'gps.mfw';
    const sql = `with 
    ta as (
      select (st_dump(geom)).geom as geom from ${table} where id = $1
    )
    , tb as (
      select st_exteriorring(geom) as geom from ta
    )
    , tc as (
      select st_polygonize(geom) as geom from tb
    )
    insert into ${table} (id, geom) 
    select $1::bigint as id, st_multi(geom) as geom from tc 
    on conflict (id) do update set geom = excluded.geom`;
    await pg.query(sql, [id]);
  }



  static async importChinaMaritime(pg) {
    const table = 'gps.mfw';
    const shpFilename = `${$.Utils.dataDir}/shapefile/china-maritime/china.shp`;
    const dbfFilename = `${$.Utils.dataDir}/shapefile/china-maritime/china.dbf`;
    const id = 1;
    const lineResolve = async (result) => {
      const geometry = WKT.convert(result.value.geometry);
      const startTime = (new Date()).getTime(); // 计时
      const sql = `insert into ${table} (id, geom) 
      values ($1::bigint, ST_Multi(ST_GeomFromText($2, 4326))::geometry) 
      on conflict (id) do update 
      set geom = excluded.geom`;
      const params = [id, geometry];
      await pg.query(sql, params)
        .catch(e => {
          console.log(sql);
          throw e;
        })
      ;
      const endTime = (new Date()).getTime();
      const costTime = endTime - startTime;
      console.log(`${table}#${id} cost ... ${costTime / 1000} s`);
    };
    await $.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);
    await this.removeInteriorRing(pg, id);
    await $.PgSQL.getPostGis().validatePolygon(pg, id, table, 'id', 'geom');
  }


  static async geomADiffB2A(pg, aId, bId) {
    const table = 'gps.mfw';
    const sql = `with
    ta as (select 1 as id, geom from ${table} where id = ${aId}) -- A
    , tb as (select 1 as id, geom from ${table} where id = ${bId}) -- B
    , fixed as (
       select ${aId} as id, st_difference(st_makevalid(ta.geom), st_makevalid(tb.geom)) as geom
       from ta left join tb
       on ta.id = tb.id
    )
    insert into ${table} (id, geom)
    select id, geom 
    from fixed
    on conflict (id) do update set 
    geom = excluded.geom;`;
    await pg.query(sql);
  }

  static async fixCountryIntersectsWithChina(pg) {
    const bId = 1;
    const countryIntersectWithChina = await this.countryIntersectWith(pg, bId);
    console.log(countryIntersectWithChina);
    for await (const item of countryIntersectWithChina) {
      const aId = item.id;
      await $.Utils.call(`${item.zhName}#${aId}`, this.geomADiffB2A.bind(this), [pg, aId, bId]);
      await $.PgSQL.getPostGis().validatePolygon(pg, aId, 'gps.mfw', 'id', 'geom');
    }
  }



  static async fixOthers01(pg) {
    // 乌克兰和俄罗斯的克里米亚半岛归俄罗斯 乌克兰 - 俄罗斯 => 乌克兰
    const that = this;
    await $.Utils.call(`乌克兰#900177 - 俄罗斯#900136 => 乌克兰#900177`, async () => {
      await that.geomADiffB2A(pg, 900177, 900136);
      await $.PgSQL.getPostGis().validatePolygon(pg, 900177, 'gps.mfw', 'id', 'geom');
    });
  }

  static async fixOthers02(pg) {
    // 苏丹和南苏丹的交集归苏丹 南苏丹 - 苏丹 => 南苏丹
    const that = this;
    await $.Utils.call(`南苏丹#900156 - 苏丹#900159 => 南苏丹#900156`, async () => {
      await that.geomADiffB2A(pg, 900156, 900159);
      await $.PgSQL.getPostGis().validatePolygon(pg, 900156, 'gps.mfw', 'id', 'geom');
    });
  }

  static async fixOthers03(pg) {
    // 摩洛哥和西撒哈拉的交集归西撒哈拉 摩洛哥 - 西撒哈拉 => 摩洛哥
    const that = this;
    await $.Utils.call(`摩洛哥#900112 - 西撒哈拉#900185 => 摩洛哥#900112`, async () => {
      await that.geomADiffB2A(pg, 900112, 900185);
      await $.PgSQL.getPostGis().validatePolygon(pg, 900112, 'gps.mfw', 'id', 'geom');
    });
  }


  static async fixOthers04(pg) {
    // 摩洛哥和西班牙
    const that = this;
    await $.Utils.call(`摩洛哥#900112 - 西班牙#900157 => 摩洛哥#900112`, async () => {
      await that.geomADiffB2A(pg, 900112, 900157);
      await $.PgSQL.getPostGis().validatePolygon(pg, 900112, 'gps.mfw', 'id', 'geom');
    });
  }


  static async fixOthers05(pg) {
    // 将南苏丹取凸包后与周围国家取差集
    const id = 900156; // 南苏丹
    const table = 'gps.mfw';
    await pg.query(`update ${table} set geom = st_convexhull(geom) where id = $1::bigint`, [id]);
    const countryIntersectWith = await this.countryIntersectWith(pg, id);
    console.log(countryIntersectWith);
    for await (const item of countryIntersectWith) {
      const bId = item.id;
      await $.Utils.call(`${item.zhName}#${bId}`, this.geomADiffB2A.bind(this), [pg, id, bId]);
      await $.PgSQL.getPostGis().validatePolygon(pg, id, 'gps.mfw', 'id', 'geom');
    }
  }


  static async fixOthers06(pg) {
    // 克罗地亚#900040 塞尔维亚#900146
    // 塞尔维亚#900146 - 克罗地亚#900040 => 塞尔维亚#900146
    const that = this;
    await $.Utils.call(`塞尔维亚#900146 - 克罗地亚#900040 => 塞尔维亚#900146`, async () => {
      await that.geomADiffB2A(pg, 900146, 900040);
      await $.PgSQL.getPostGis().validatePolygon(pg, 900146, 'gps.mfw', 'id', 'geom');
    });
    // 将塞尔维亚取凸包后与周围国家取差集
    const id = 900146; // 塞尔维亚
    const table = 'gps.mfw';
    await pg.query(`update ${table} set geom = st_convexhull(geom) where id = $1::bigint`, [id]);
    const countryIntersectWith = await this.countryIntersectWith(pg, id);
    console.log(countryIntersectWith);
    for await (const item of countryIntersectWith) {
      const bId = item.id;
      await $.Utils.call(`${item.zhName}#${bId}`, this.geomADiffB2A.bind(this), [pg, id, bId]);
      await $.PgSQL.getPostGis().validatePolygon(pg, id, 'gps.mfw', 'id', 'geom');
    }
  }


  static async fixOthers07(pg) {
    // 卢森堡#900096 德国#900059
    const that = this;
    await $.Utils.call(`卢森堡#900096 - 德国#900059 => 卢森堡#900096`, async () => {
      await that.geomADiffB2A(pg, 900096, 900059);
      await $.PgSQL.getPostGis().validatePolygon(pg, 900096, 'gps.mfw', 'id', 'geom');
    });
  }
}


export default LibMfwCustom;