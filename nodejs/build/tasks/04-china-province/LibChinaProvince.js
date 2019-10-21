'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _modules = _interopRequireDefault(require("./../../modules"));

var _Utils = _interopRequireDefault(require("../../modules/Utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    await _modules.default.AMap.getProvinces(async item => {
      return +item.id === id;
    }, async item => {
      const fromTable = 'gps.world';
      const toTable = 'gps.mfw';
      const regionId = item.mfwId;
      let data = await _modules.default.Mfw.getRegionRestFul().getRegionInfo(regionId);
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
    });
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
    await _modules.default.AMap.getProvinces(async item => {
      return !excludeIds.includes(+item['id']);
    }, async item => {
      const fromTable = 'gps.world';
      const toTable = 'gps.mfw';
      const regionId = item.mfwId;
      let data = await _modules.default.Mfw.getRegionRestFul().getRegionInfo(regionId);
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
    });
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
          await _Utils.default.call(`计算${item.name}#${item.id}的外圈海岸边界线`, this.calcOuterCoastline.bind(this), [pg, item.id, item.name]);
        }
      } else {
        await _Utils.default.call(`计算${item.name}#${item.id}的外圈海岸边界线`, this.calcOuterCoastline.bind(this), [pg, item.id, item.name]);
      }
    }
  }

  static async calcOuterCoastline(pg, id, name) {
    const boundaryTable = 'boundary.mfw';
    const lineTable = 'boundary.line';
    const type = 'outer';
    const category = 'coastline';
    await pg.query(`delete from ${lineTable} where id = $1 and type = $2 and category = $3`, [id, type, category]); // 是否有juncture

    const rows = await pg.query(`select id from ${lineTable} where id = $1 and category = $2`, [id, 'juncture']).then(res => {
      return res.rows || [];
    });

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

    await this.lineMerge(pg, id, type, category); // geom type

    const row = await pg.query(`select ST_GeometryType(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`, [id, type, category]).then(res => {
      return res.rows[0] || {};
    });
    const geometryType = row['geom_type'] || '无外圈海岸边界线';
    console.log(`${name}#${id}: ${geometryType}`);
  }

  static async lineMerge(pg, id, type, category) {
    const table = 'boundary.line';
    await pg.query(`update ${table} set geom = ST_LineMerge(geom) where id = $1 and type = $2 and category = $3`, [id, type, category]);
  }

  static async calcInnerJunctures(pg, theId = 0) {
    const list = await this.getBoundaryList(pg);

    for await (const item of list) {
      if (theId > 0) {
        if (theId === item.id) {
          await _Utils.default.call(`计算${item.name}#${item.id}的内圈陆地边界线`, this.calcInnerJuncture.bind(this), [pg, item.id, item.name]);
        }
      } else {
        await _Utils.default.call(`计算${item.name}#${item.id}的内圈陆地边界线`, this.calcInnerJuncture.bind(this), [pg, item.id, item.name]);
      }
    }
  }

  static async calcOuterJunctures(pg, theId = 0) {
    const list = await this.getBoundaryList(pg);

    for await (const item of list) {
      if (theId > 0) {
        if (theId === item.id) {
          await _Utils.default.call(`计算${item.name}#${item.id}的外圈陆地边界线`, this.calcOuterJuncture.bind(this), [pg, item.id, item.name]);
        }
      } else {
        await _Utils.default.call(`计算${item.name}#${item.id}的外圈陆地边界线`, this.calcOuterJuncture.bind(this), [pg, item.id, item.name]);
      }
    }
  }

  static async calcInnerJuncture(pg, id, name) {
    const boundaryTable = 'boundary.mfw';
    const lineTable = 'boundary.line';
    const type = 'inner';
    const category = 'juncture';
    await pg.query(`delete from ${lineTable} where id = $1 and type = $2 and category = $3`, [id, type, category]);
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
    await this.lineMerge(pg, id, type, category); // geom type

    const row = await pg.query(`select ST_GeometryType(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`, [id, type, category]).then(res => {
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
    await pg.query(`delete from ${lineTable} where id = $1 and type = $2 and category = $3`, [id, type, category]);
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
    await this.lineMerge(pg, id, type, category); // geom type

    const row = await pg.query(`select ST_GeometryType(geom) as geom_type from ${lineTable} 
      where id = $1 and type = $2 and category = $3`, [id, type, category]).then(res => {
      return res.rows[0] || {};
    });
    const geometryType = row['geom_type'] || '无外圈陆地边界线';
    console.log(`${name}#${id}: ${geometryType}`);
  }

}

var _default = LibChinaProvince;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC1jaGluYS1wcm92aW5jZS9MaWJDaGluYVByb3ZpbmNlLmpzIl0sIm5hbWVzIjpbIkxpYkNoaW5hUHJvdmluY2UiLCJpbml0R3BzIiwicGciLCJxdWVyeSIsImluaXRQcm92aW5jZUdwc1dvcmxkIiwiZnJvbVRhYmxlIiwidG9UYWJsZSIsInNxbCIsImluaXRQcm92aW5jZUdwc01mdyIsImlkIiwiJCIsIkFNYXAiLCJnZXRQcm92aW5jZXMiLCJpdGVtIiwicmVnaW9uSWQiLCJtZndJZCIsImRhdGEiLCJNZnciLCJnZXRSZWdpb25SZXN0RnVsIiwiZ2V0UmVnaW9uSW5mbyIsIm1kZElkIiwibmFtZSIsImNvbnNvbGUiLCJsb2ciLCJnZXRQcm92aW5jZUdwc01md0xpc3QiLCJ0YWJsZSIsInJlcyIsImxpc3QiLCJyb3ciLCJyb3dzIiwicHVzaCIsImZpbGxQcm92aW5jZUdwc01mdyIsImV4Y2x1ZGVJZHMiLCJpbmNsdWRlcyIsImdwczJib3VuZGFyeSIsImdwc1RhYmxlIiwiYm91bmRhcnlUYWJsZSIsImZpeEdwc01mdyIsImFJZCIsImJJZCIsImdldEJvdW5kYXJ5TGlzdCIsImNhbGNPdXRlckNvYXN0bGluZXMiLCJ0aGVJZCIsIlV0aWxzIiwiY2FsbCIsImNhbGNPdXRlckNvYXN0bGluZSIsImJpbmQiLCJsaW5lVGFibGUiLCJ0eXBlIiwiY2F0ZWdvcnkiLCJ0aGVuIiwibGVuZ3RoIiwibGluZU1lcmdlIiwiZ2VvbWV0cnlUeXBlIiwiY2FsY0lubmVySnVuY3R1cmVzIiwiY2FsY0lubmVySnVuY3R1cmUiLCJjYWxjT3V0ZXJKdW5jdHVyZXMiLCJjYWxjT3V0ZXJKdW5jdHVyZSJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFJQTs7QUFDQTs7OztBQUVBLE1BQU1BLGdCQUFOLENBQXVCO0FBR3JCLGVBQWFDLE9BQWIsQ0FBcUJDLEVBQXJCLEVBQXlCO0FBQ3ZCLFVBQU1BLEVBQUUsQ0FBQ0MsS0FBSCxDQUFVLGlEQUFW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QXFCNUIsSUFBckIsQ0FBZCxDQUFOO0FBRUEsVUFBTSxLQUFLK0IsU0FBTCxDQUFlbEQsRUFBZixFQUFtQk8sRUFBbkIsRUFBdUJ1QyxJQUF2QixFQUE2QkMsUUFBN0IsQ0FBTixDQS9DMkMsQ0FpRDNDOztBQUNBLFVBQU1yQixHQUFHLEdBQUcsTUFBTTFCLEVBQUUsQ0FBQ0MsS0FBSCxDQUNmLGtEQUFpRDRDLFNBQVU7b0RBRDVDLEVBR2hCLENBQUN0QyxFQUFELEVBQUt1QyxJQUFMLEVBQVdDLFFBQVgsQ0FIZ0IsRUFJaEJDLElBSmdCLENBSVh4QixHQUFHLElBQUk7QUFDWixhQUFPQSxHQUFHLENBQUNHLElBQUosQ0FBUyxDQUFULEtBQWUsRUFBdEI7QUFDRCxLQU5pQixDQUFsQjtBQU9BLFVBQU13QixZQUFZLEdBQUd6QixHQUFHLENBQUMsV0FBRCxDQUFILElBQW9CLFVBQXpDO0FBQ0FOLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLEdBQUVGLElBQUssSUFBR1osRUFBRyxLQUFJNEMsWUFBYSxFQUEzQztBQUNEOztBQXZhb0I7O2VBMmFSckQsZ0IiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuXG5pbXBvcnQgJCBmcm9tICcuLy4uLy4uL21vZHVsZXMnO1xuaW1wb3J0IFV0aWxzIGZyb20gXCIuLi8uLi9tb2R1bGVzL1V0aWxzXCI7XG5cbmNsYXNzIExpYkNoaW5hUHJvdmluY2Uge1xuXG5cbiAgc3RhdGljIGFzeW5jIGluaXRHcHMocGcpIHtcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gZ3BzLndvcmxkIHdoZXJlIGlkID4gMTAgYW5kIGlkIDwgNTBgKTtcbiAgICBhd2FpdCBwZy5xdWVyeShgZGVsZXRlIGZyb20gZ3BzLm1mdyB3aGVyZSBpZCA+IDEwIGFuZCBpZCA8IDUwYCk7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBpbml0UHJvdmluY2VHcHNXb3JsZChwZykge1xuICAgIGNvbnN0IGZyb21UYWJsZSA9ICdhbWFwLmNoaW5hJztcbiAgICBjb25zdCB0b1RhYmxlID0gJ2dwcy53b3JsZCc7XG4gICAgY29uc3Qgc3FsID0gYGluc2VydCBpbnRvICR7dG9UYWJsZX0gKGlkLCBwYXJlbnRfaWQsIGxldmVsLCBpc28sIHpoX25hbWUsIGVuX25hbWUsIGdlb20pIFxuICAgIHNlbGVjdCBpZCwgcGFyZW50X2lkLCBsZXZlbCwgaXNvLCB6aF9uYW1lLCBlbl9uYW1lLCBTVF9NdWx0aShnZW9tKSBhcyBnZW9tIFxuICAgIGZyb20gJHtmcm9tVGFibGV9IHdoZXJlIGlkID4gMTAgYW5kIGlkIDwgNTBcbiAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgXG4gICAgcGFyZW50X2lkID0gZXhjbHVkZWQucGFyZW50X2lkLCBsZXZlbCA9IGV4Y2x1ZGVkLmxldmVsLCBpc28gPSBleGNsdWRlZC5pc28sXG4gICAgemhfbmFtZSA9IGV4Y2x1ZGVkLnpoX25hbWUsIGVuX25hbWUgPSBleGNsdWRlZC5lbl9uYW1lLCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgYXdhaXQgcGcucXVlcnkoc3FsKTtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGluaXRQcm92aW5jZUdwc01mdyhwZywgaWQpIHtcbiAgICBhd2FpdCAkLkFNYXAuZ2V0UHJvdmluY2VzKFxuICAgICAgYXN5bmMgKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuICtpdGVtLmlkID09PSBpZDtcbiAgICAgIH0sXG4gICAgICBhc3luYyAoaXRlbSkgPT4ge1xuICAgICAgICBjb25zdCBmcm9tVGFibGUgPSAnZ3BzLndvcmxkJztcbiAgICAgICAgY29uc3QgdG9UYWJsZSA9ICdncHMubWZ3JztcbiAgICAgICAgY29uc3QgcmVnaW9uSWQgPSBpdGVtLm1md0lkO1xuICAgICAgICBsZXQgZGF0YSA9IGF3YWl0ICQuTWZ3LmdldFJlZ2lvblJlc3RGdWwoKS5nZXRSZWdpb25JbmZvKHJlZ2lvbklkKTtcbiAgICAgICAgbGV0IG1kZElkID0gZGF0YVsnbWRkaWQnXTtcbiAgICAgICAgbGV0IG5hbWUgPSBkYXRhWydjbmFtZSddO1xuICAgICAgICBjb25zb2xlLmxvZyhpZCwgbmFtZSwgbWRkSWQsIHJlZ2lvbklkKTtcbiAgICAgICAgY29uc3Qgc3FsID0gYGluc2VydCBpbnRvICR7dG9UYWJsZX0gXG4gICAgICAgIChpZCwgcGFyZW50X2lkLCBrZXksIGxldmVsLCBpc28sIHpoX25hbWUsIGVuX25hbWUsIHJlZ2lvbl9pZCwgbWRkX2lkKSBcbiAgICAgICAgc2VsZWN0IFxuICAgICAgICBpZCwgcGFyZW50X2lkLCBrZXksIGxldmVsLCBpc28sICQxOjp2YXJjaGFyIGFzIHpoX25hbWUsIGVuX25hbWUsIFxuICAgICAgICAkMjo6YmlnaW50IGFzIHJlZ2lvbl9pZCwgJDM6OmJpZ2ludCBhcyBtZGRfaWQgIFxuICAgICAgICBmcm9tICR7ZnJvbVRhYmxlfSB3aGVyZSBpZCA9ICQ0IFxuICAgICAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgXG4gICAgICAgIHBhcmVudF9pZCA9IGV4Y2x1ZGVkLnBhcmVudF9pZCwga2V5ID0gZXhjbHVkZWQua2V5LCBcbiAgICAgICAgbGV2ZWwgPSBleGNsdWRlZC5sZXZlbCwgaXNvID0gZXhjbHVkZWQuaXNvLFxuICAgICAgICB6aF9uYW1lID0gZXhjbHVkZWQuemhfbmFtZSwgZW5fbmFtZSA9IGV4Y2x1ZGVkLmVuX25hbWUsIFxuICAgICAgICBtZGRfaWQgPSBleGNsdWRlZC5tZGRfaWQsIHJlZ2lvbl9pZCA9IGV4Y2x1ZGVkLnJlZ2lvbl9pZGA7XG4gICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW25hbWUsIHJlZ2lvbklkLCBtZGRJZCwgaWRdKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgZ2V0UHJvdmluY2VHcHNNZndMaXN0KHBnKSB7XG4gICAgY29uc3QgdGFibGUgPSAnZ3BzLm1mdyc7XG4gICAgY29uc3Qgc3FsID0gYHNlbGVjdCBpZCwgemhfbmFtZSBmcm9tICR7dGFibGV9IHdoZXJlIGlkID4gMSBhbmQgaWQgPCA1MCBvcmRlciBieSBpZCBhc2NgO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBnLnF1ZXJ5KHNxbCk7XG4gICAgY29uc3QgbGlzdCA9IFtdO1xuICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJlcy5yb3dzKSB7XG4gICAgICBsaXN0LnB1c2goe1xuICAgICAgICBpZDogK3Jvd1snaWQnXSxcbiAgICAgICAgbmFtZTogcm93Wyd6aF9uYW1lJ11cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbGlzdDtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGZpbGxQcm92aW5jZUdwc01mdyhwZykge1xuICAgIGNvbnN0IGV4Y2x1ZGVJZHMgPSBbNDEsIDM2LCAzNSwgMzYsIDMwLCAzOCwgMTUsIDE4LCAxNywgMTZdO1xuICAgIGF3YWl0ICQuQU1hcC5nZXRQcm92aW5jZXMoXG4gICAgICBhc3luYyAoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gIWV4Y2x1ZGVJZHMuaW5jbHVkZXMoK2l0ZW1bJ2lkJ10pO1xuICAgICAgfSxcbiAgICAgIGFzeW5jIChpdGVtKSA9PiB7XG4gICAgICAgIGNvbnN0IGZyb21UYWJsZSA9ICdncHMud29ybGQnO1xuICAgICAgICBjb25zdCB0b1RhYmxlID0gJ2dwcy5tZncnO1xuICAgICAgICBjb25zdCByZWdpb25JZCA9IGl0ZW0ubWZ3SWQ7XG4gICAgICAgIGxldCBkYXRhID0gYXdhaXQgJC5NZncuZ2V0UmVnaW9uUmVzdEZ1bCgpLmdldFJlZ2lvbkluZm8ocmVnaW9uSWQpO1xuICAgICAgICBsZXQgbWRkSWQgPSBkYXRhWydtZGRpZCddO1xuICAgICAgICBsZXQgbmFtZSA9IGRhdGFbJ2NuYW1lJ107XG4gICAgICAgIGNvbnNvbGUubG9nKGl0ZW1bJ2lkJ10sIG5hbWUsIG1kZElkLCByZWdpb25JZCk7XG4gICAgICAgIGNvbnN0IHNxbCA9IGBpbnNlcnQgaW50byAke3RvVGFibGV9IFxuICAgICAgICAoaWQsIHBhcmVudF9pZCwga2V5LCBsZXZlbCwgaXNvLCB6aF9uYW1lLCBlbl9uYW1lLCByZWdpb25faWQsIG1kZF9pZCwgZ2VvbSkgXG4gICAgICAgIHNlbGVjdCBcbiAgICAgICAgaWQsIHBhcmVudF9pZCwga2V5LCBsZXZlbCwgaXNvLCAkMTo6dmFyY2hhciBhcyB6aF9uYW1lLCBlbl9uYW1lLCBcbiAgICAgICAgJDI6OmJpZ2ludCBhcyByZWdpb25faWQsICQzOjpiaWdpbnQgYXMgbWRkX2lkLCBnZW9tIFxuICAgICAgICBmcm9tICR7ZnJvbVRhYmxlfSB3aGVyZSBpZCA9ICQ0XG4gICAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBcbiAgICAgICAgcGFyZW50X2lkID0gZXhjbHVkZWQucGFyZW50X2lkLCBrZXkgPSBleGNsdWRlZC5rZXksIFxuICAgICAgICBsZXZlbCA9IGV4Y2x1ZGVkLmxldmVsLCBpc28gPSBleGNsdWRlZC5pc28sXG4gICAgICAgIHpoX25hbWUgPSBleGNsdWRlZC56aF9uYW1lLCBlbl9uYW1lID0gZXhjbHVkZWQuZW5fbmFtZSwgXG4gICAgICAgIG1kZF9pZCA9IGV4Y2x1ZGVkLm1kZF9pZCwgcmVnaW9uX2lkID0gZXhjbHVkZWQucmVnaW9uX2lkLCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW25hbWUsIHJlZ2lvbklkLCBtZGRJZCwgaXRlbVsnaWQnXV0pO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBncHMyYm91bmRhcnkocGcsIGlkKSB7XG4gICAgY29uc3QgZ3BzVGFibGUgPSAnZ3BzLm1mdyc7XG4gICAgY29uc3QgYm91bmRhcnlUYWJsZSA9ICdib3VuZGFyeS5tZncnO1xuICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgIHRhIGFzIChcbiAgICAgIHNlbGVjdCBpZCwgcGFyZW50X2lkLCBrZXksIGxldmVsLCBpc28sIHpoX25hbWUsIGVuX25hbWUsIHJlZ2lvbl9pZCwgbWRkX2lkLCBnZW9tXG4gICAgICBmcm9tICR7Z3BzVGFibGV9IHdoZXJlIGlkID0gJDEgXG4gICAgKVxuICAgICwgdGIgYXMgKFxuICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgaWQsIGdlb20gZnJvbSBib3VuZGFyeS5tZncgd2hlcmUgaWQgPSAxXG4gICAgKVxuICAgICwgdGMgYXMgKFxuICAgICAgc2VsZWN0IHRhLmlkIGFzIGlkLCBwYXJlbnRfaWQsIGtleSwgbGV2ZWwsIGlzbywgemhfbmFtZSwgZW5fbmFtZSwgcmVnaW9uX2lkLCBtZGRfaWQsIFxuICAgICAgU1RfSW50ZXJzZWN0aW9uKFNUX01ha2VWYWxpZCh0YS5nZW9tKSwgU1RfTWFrZVZhbGlkKHRiLmdlb20pKSBhcyBnZW9tIFxuICAgICAgZnJvbSB0YSBsZWZ0IGpvaW4gdGIgb24gdGEuaWQgPSB0Yi5pZFxuICAgIClcbiAgICBpbnNlcnQgaW50byAke2JvdW5kYXJ5VGFibGV9IChpZCwgcGFyZW50X2lkLCBrZXksIGxldmVsLCBpc28sIHpoX25hbWUsIGVuX25hbWUsIHJlZ2lvbl9pZCwgbWRkX2lkLCBnZW9tKSBcbiAgICBzZWxlY3QgaWQsIHBhcmVudF9pZCwga2V5LCBsZXZlbCwgaXNvLCB6aF9uYW1lLCBlbl9uYW1lLCByZWdpb25faWQsIG1kZF9pZCwgZ2VvbSBmcm9tIHRjXG4gICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IFxuICAgIHBhcmVudF9pZCA9IGV4Y2x1ZGVkLnBhcmVudF9pZCwga2V5ID0gZXhjbHVkZWQua2V5LCBsZXZlbCA9IGV4Y2x1ZGVkLmxldmVsLCBpc28gPSBleGNsdWRlZC5pc28sIFxuICAgIHpoX25hbWUgPSBleGNsdWRlZC56aF9uYW1lLCBlbl9uYW1lID0gZXhjbHVkZWQuZW5fbmFtZSwgcmVnaW9uX2lkID0gZXhjbHVkZWQucmVnaW9uX2lkLCBtZGRfaWQgPSBleGNsdWRlZC5tZGRfaWQsIFxuICAgIGdlb20gPSBleGNsdWRlZC5nZW9tYDtcbiAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZF0pO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgZml4R3BzTWZ3KHBnLCBhSWQsIGJJZCkge1xuICAgIGNvbnN0IHRhYmxlID0gJ2dwcy5tZncnO1xuICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgIHRhIGFzIChcbiAgICAgIHNlbGVjdCAxIGFzIGlkLCBnZW9tIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgIClcbiAgICAsIHRiIGFzIChcbiAgICAgIHNlbGVjdCAxIGFzIGlkLCBnZW9tIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPSAkMiBcbiAgICApXG4gICAgLCB0YyBhcyAoXG4gICAgICBzZWxlY3QgU1RfRGlmZmVyZW5jZSh0YS5nZW9tLCB0Yi5nZW9tKSBhcyBnZW9tIGZyb20gdGEgbGVmdCBqb2luIHRiIG9uIHRhLmlkID0gdGIuaWRcbiAgICApXG4gICAgaW5zZXJ0IGludG8gJHt0YWJsZX0gKGlkLCBnZW9tKSBcbiAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyBpZCwgZ2VvbSBmcm9tIHRjIFxuICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbYUlkLCBiSWRdKTtcbiAgfVxuXG5cblxuICBzdGF0aWMgYXN5bmMgZ2V0Qm91bmRhcnlMaXN0KHBnKSB7XG4gICAgY29uc3QgdGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgICBjb25zdCBzcWwgPSBgc2VsZWN0IGlkLCB6aF9uYW1lIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPiAxMCBhbmQgaWQgPCA1MCBvcmRlciBieSBpZCBhc2NgO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBnLnF1ZXJ5KHNxbCk7XG4gICAgY29uc3QgbGlzdCA9IFtdO1xuICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJlcy5yb3dzKSB7XG4gICAgICBsaXN0LnB1c2goe1xuICAgICAgICBpZDogK3Jvd1snaWQnXSxcbiAgICAgICAgbmFtZTogcm93Wyd6aF9uYW1lJ11cbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbGlzdDtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGNhbGNPdXRlckNvYXN0bGluZXMocGcsIHRoZUlkID0gMCkge1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCB0aGlzLmdldEJvdW5kYXJ5TGlzdChwZyk7XG4gICAgZm9yIGF3YWl0IChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICAgIGlmICh0aGVJZCA+IDApIHtcbiAgICAgICAgaWYgKHRoZUlkID09PSBpdGVtLmlkKSB7XG4gICAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChcbiAgICAgICAgICAgIGDorqHnrpcke2l0ZW0ubmFtZX0jJHtpdGVtLmlkfeeahOWkluWciOa1t+WyuOi+ueeVjOe6v2AsXG4gICAgICAgICAgICB0aGlzLmNhbGNPdXRlckNvYXN0bGluZS5iaW5kKHRoaXMpLFxuICAgICAgICAgICAgW3BnLCBpdGVtLmlkLCBpdGVtLm5hbWVdXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChcbiAgICAgICAgICBg6K6h566XJHtpdGVtLm5hbWV9IyR7aXRlbS5pZH3nmoTlpJblnIjmtbflsrjovrnnlYznur9gLFxuICAgICAgICAgIHRoaXMuY2FsY091dGVyQ29hc3RsaW5lLmJpbmQodGhpcyksXG4gICAgICAgICAgW3BnLCBpdGVtLmlkLCBpdGVtLm5hbWVdXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuXG4gIHN0YXRpYyBhc3luYyBjYWxjT3V0ZXJDb2FzdGxpbmUocGcsIGlkLCBuYW1lKSB7XG4gICAgY29uc3QgYm91bmRhcnlUYWJsZSA9ICdib3VuZGFyeS5tZncnO1xuICAgIGNvbnN0IGxpbmVUYWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCB0eXBlID0gJ291dGVyJztcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdjb2FzdGxpbmUnO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoXG4gICAgICBgZGVsZXRlIGZyb20gJHtsaW5lVGFibGV9IHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICk7XG5cbiAgICAvLyDmmK/lkKbmnIlqdW5jdHVyZVxuICAgIGNvbnN0IHJvd3MgPSBhd2FpdCBwZ1xuICAgICAgLnF1ZXJ5KGBzZWxlY3QgaWQgZnJvbSAke2xpbmVUYWJsZX0gd2hlcmUgaWQgPSAkMSBhbmQgY2F0ZWdvcnkgPSAkMmAsIFtpZCwgJ2p1bmN0dXJlJ10pXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICB9KVxuICAgIDtcblxuICAgIGlmIChyb3dzLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIOaciWp1bmN0dXJlXG4gICAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICAgIHRhIGFzIChcbiAgICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSAke2JvdW5kYXJ5VGFibGV9IHdoZXJlIGlkID0gJDFcbiAgICAgIClcbiAgICAgICwgdGIgYXMgKFxuICAgICAgICBzZWxlY3QgMSBhcyBpZCwgU1RfQ29sbGVjdChTVF9FeHRlcmlvclJpbmcoZ2VvbSkpIGFzIGdlb20gZnJvbSB0YSBcbiAgICAgIClcbiAgICAgICwgdGMgYXMgKFxuICAgICAgICBzZWxlY3QgMSBhcyBpZCwgU1RfQ29sbGVjdChnZW9tKSBhcyBnZW9tIFxuICAgICAgICBmcm9tICR7bGluZVRhYmxlfSB3aGVyZSBpZCA9ICQxIGFuZCBjYXRlZ29yeSA9ICdqdW5jdHVyZSdcbiAgICAgIClcbiAgICAgICwgdGQgYXMgKFxuICAgICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyBpZCwgJDI6OnZhcmNoYXIgYXMgdHlwZSwgJDM6OnZhcmNoYXIgYXMgY2F0ZWdvcnksICQ0Ojp2YXJjaGFyIGFzIG5hbWUsIFxuICAgICAgICBTVF9EaWZmZXJlbmNlKFNUX01ha2VWYWxpZCh0Yi5nZW9tKSwgU1RfTWFrZVZhbGlkKHRjLmdlb20pKSBhcyBnZW9tIFxuICAgICAgICBmcm9tIHRiIGxlZnQgam9pbiB0YyBvbiB0Yi5pZCA9IHRjLmlkXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke2xpbmVUYWJsZX0gKGlkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZSwgZ2VvbSkgXG4gICAgICBzZWxlY3QgaWQsIHR5cGUsIGNhdGVnb3J5LCBuYW1lLCBnZW9tIFxuICAgICAgZnJvbSB0ZCB3aGVyZSBTVF9OUG9pbnRzKGdlb20pID4gMCBcbiAgICAgIG9uIGNvbmZsaWN0IChpZCwgdHlwZSwgY2F0ZWdvcnkpIGRvIHVwZGF0ZSBzZXQgXG4gICAgICBuYW1lID0gZXhjbHVkZWQubmFtZSwgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuICAgICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWQsIHR5cGUsIGNhdGVnb3J5LCBuYW1lXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIOaXoGp1bmN0dXJlXG4gICAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICAgIHRhIGFzIChcbiAgICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSAke2JvdW5kYXJ5VGFibGV9IHdoZXJlIGlkID0gJDFcbiAgICAgIClcbiAgICAgICwgdGIgYXMgKFxuICAgICAgICBzZWxlY3QgMSBhcyBpZCwgU1RfQ29sbGVjdChTVF9FeHRlcmlvclJpbmcoZ2VvbSkpIGFzIGdlb20gZnJvbSB0YSBcbiAgICAgIClcbiAgICAgICwgdGMgYXMgKFxuICAgICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyBpZCwgJDI6OnZhcmNoYXIgYXMgdHlwZSwgJDM6OnZhcmNoYXIgYXMgY2F0ZWdvcnksICQ0Ojp2YXJjaGFyIGFzIG5hbWUsIGdlb20gXG4gICAgICAgIGZyb20gdGIgIFxuICAgICAgKVxuICAgICAgaW5zZXJ0IGludG8gJHtsaW5lVGFibGV9IChpZCwgdHlwZSwgY2F0ZWdvcnksIG5hbWUsIGdlb20pIFxuICAgICAgc2VsZWN0IGlkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZSwgZ2VvbSBcbiAgICAgIGZyb20gdGMgd2hlcmUgU1RfTlBvaW50cyhnZW9tKSA+IDAgXG4gICAgICBvbiBjb25mbGljdCAoaWQsIHR5cGUsIGNhdGVnb3J5KSBkbyB1cGRhdGUgc2V0IFxuICAgICAgbmFtZSA9IGV4Y2x1ZGVkLm5hbWUsIGdlb20gPSBleGNsdWRlZC5nZW9tYDtcblxuICAgICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWQsIHR5cGUsIGNhdGVnb3J5LCBuYW1lXSk7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5saW5lTWVyZ2UocGcsIGlkLCB0eXBlLCBjYXRlZ29yeSk7XG5cbiAgICAvLyBnZW9tIHR5cGVcbiAgICBjb25zdCByb3cgPSBhd2FpdCBwZy5xdWVyeShcbiAgICAgIGBzZWxlY3QgU1RfR2VvbWV0cnlUeXBlKGdlb20pIGFzIGdlb21fdHlwZSBmcm9tICR7bGluZVRhYmxlfSBcbiAgICAgIHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICkudGhlbihyZXMgPT4ge1xuICAgICAgcmV0dXJuIHJlcy5yb3dzWzBdIHx8IHt9O1xuICAgIH0pO1xuICAgIGNvbnN0IGdlb21ldHJ5VHlwZSA9IHJvd1snZ2VvbV90eXBlJ10gfHwgJ+aXoOWkluWciOa1t+WyuOi+ueeVjOe6vyc7XG4gICAgY29uc29sZS5sb2coYCR7bmFtZX0jJHtpZH06ICR7Z2VvbWV0cnlUeXBlfWApO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgbGluZU1lcmdlKHBnLCBpZCwgdHlwZSwgY2F0ZWdvcnkpIHtcbiAgICBjb25zdCB0YWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBhd2FpdCBwZy5xdWVyeShcbiAgICAgIGB1cGRhdGUgJHt0YWJsZX0gc2V0IGdlb20gPSBTVF9MaW5lTWVyZ2UoZ2VvbSkgd2hlcmUgaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBjYWxjSW5uZXJKdW5jdHVyZXMocGcsIHRoZUlkID0gMCkge1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCB0aGlzLmdldEJvdW5kYXJ5TGlzdChwZyk7XG4gICAgZm9yIGF3YWl0IChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICAgIGlmICh0aGVJZCA+IDApIHtcbiAgICAgICAgaWYgKHRoZUlkID09PSBpdGVtLmlkKSB7XG4gICAgICAgICAgYXdhaXQgVXRpbHMuY2FsbChcbiAgICAgICAgICAgIGDorqHnrpcke2l0ZW0ubmFtZX0jJHtpdGVtLmlkfeeahOWGheWciOmZhuWcsOi+ueeVjOe6v2AsXG4gICAgICAgICAgICB0aGlzLmNhbGNJbm5lckp1bmN0dXJlLmJpbmQodGhpcyksXG4gICAgICAgICAgICBbcGcsIGl0ZW0uaWQsIGl0ZW0ubmFtZV1cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCBVdGlscy5jYWxsKFxuICAgICAgICAgIGDorqHnrpcke2l0ZW0ubmFtZX0jJHtpdGVtLmlkfeeahOWGheWciOmZhuWcsOi+ueeVjOe6v2AsXG4gICAgICAgICAgdGhpcy5jYWxjSW5uZXJKdW5jdHVyZS5iaW5kKHRoaXMpLFxuICAgICAgICAgIFtwZywgaXRlbS5pZCwgaXRlbS5uYW1lXVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGNhbGNPdXRlckp1bmN0dXJlcyhwZywgdGhlSWQgPSAwKSB7XG4gICAgY29uc3QgbGlzdCA9IGF3YWl0IHRoaXMuZ2V0Qm91bmRhcnlMaXN0KHBnKTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgbGlzdCkge1xuICAgICAgaWYgKHRoZUlkID4gMCkge1xuICAgICAgICBpZiAodGhlSWQgPT09IGl0ZW0uaWQpIHtcbiAgICAgICAgICBhd2FpdCBVdGlscy5jYWxsKFxuICAgICAgICAgICAgYOiuoeeulyR7aXRlbS5uYW1lfSMke2l0ZW0uaWR955qE5aSW5ZyI6ZmG5Zyw6L6555WM57q/YCxcbiAgICAgICAgICAgIHRoaXMuY2FsY091dGVySnVuY3R1cmUuYmluZCh0aGlzKSxcbiAgICAgICAgICAgIFtwZywgaXRlbS5pZCwgaXRlbS5uYW1lXVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF3YWl0IFV0aWxzLmNhbGwoXG4gICAgICAgICAgYOiuoeeulyR7aXRlbS5uYW1lfSMke2l0ZW0uaWR955qE5aSW5ZyI6ZmG5Zyw6L6555WM57q/YCxcbiAgICAgICAgICB0aGlzLmNhbGNPdXRlckp1bmN0dXJlLmJpbmQodGhpcyksXG4gICAgICAgICAgW3BnLCBpdGVtLmlkLCBpdGVtLm5hbWVdXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgY2FsY0lubmVySnVuY3R1cmUocGcsIGlkLCBuYW1lKSB7XG4gICAgY29uc3QgYm91bmRhcnlUYWJsZSA9ICdib3VuZGFyeS5tZncnO1xuICAgIGNvbnN0IGxpbmVUYWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCB0eXBlID0gJ2lubmVyJztcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdqdW5jdHVyZSc7XG5cbiAgICBhd2FpdCBwZy5xdWVyeShcbiAgICAgIGBkZWxldGUgZnJvbSAke2xpbmVUYWJsZX0gd2hlcmUgaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKTtcblxuXG4gICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgdGEgYXMgKFxuICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSAke2JvdW5kYXJ5VGFibGV9IHdoZXJlIGlkID0gJDFcbiAgICApXG4gICAgLCB0YiBhcyAoXG4gICAgICBzZWxlY3QgKFNUX0R1bXBSaW5ncyhnZW9tKSkgYXMgZHVtcCBmcm9tIHRhXG4gICAgKVxuICAgICwgdGMgYXMgKFxuICAgICAgc2VsZWN0IChkdW1wKS5wYXRoWzFdIGFzIHBhdGgsIChkdW1wKS5nZW9tIGFzIGdlb20gZnJvbSB0YiBcbiAgICApXG4gICAgLCB0ZCBhcyAoXG4gICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyBpZCwgJDI6OnZhcmNoYXIgYXMgdHlwZSwgJDM6OnZhcmNoYXIgYXMgY2F0ZWdvcnksIFxuICAgICAgJDQ6OnZhcmNoYXIgYXMgbmFtZSwgU1RfTGluZU1lcmdlKFNUX0NvbGxlY3QoU1RfQm91bmRhcnkoZ2VvbSkpKSBhcyBnZW9tIFxuICAgICAgZnJvbSB0YyB3aGVyZSBwYXRoID4gMFxuICAgIClcbiAgICBpbnNlcnQgaW50byAke2xpbmVUYWJsZX0gKGlkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZSwgZ2VvbSkgXG4gICAgc2VsZWN0IGlkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZSwgZ2VvbSBmcm9tIHRkXG4gICAgd2hlcmUgU1RfTlBvaW50cyhnZW9tKSA+IDAgXG4gICAgb24gY29uZmxpY3QgKGlkLCB0eXBlLCBjYXRlZ29yeSkgZG8gdXBkYXRlIHNldCBcbiAgICBuYW1lID0gZXhjbHVkZWQubmFtZSwgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuXG4gICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbaWQsIHR5cGUsIGNhdGVnb3J5LCBuYW1lXSk7XG5cbiAgICBhd2FpdCB0aGlzLmxpbmVNZXJnZShwZywgaWQsIHR5cGUsIGNhdGVnb3J5KTtcblxuICAgIC8vIGdlb20gdHlwZVxuICAgIGNvbnN0IHJvdyA9IGF3YWl0IHBnLnF1ZXJ5KFxuICAgICAgYHNlbGVjdCBTVF9HZW9tZXRyeVR5cGUoZ2VvbSkgYXMgZ2VvbV90eXBlIGZyb20gJHtsaW5lVGFibGV9IFxuICAgICAgd2hlcmUgaWQgPSAkMSBhbmQgdHlwZSA9ICQyIGFuZCBjYXRlZ29yeSA9ICQzYCxcbiAgICAgIFtpZCwgdHlwZSwgY2F0ZWdvcnldXG4gICAgKS50aGVuKHJlcyA9PiB7XG4gICAgICByZXR1cm4gcmVzLnJvd3NbMF0gfHwge307XG4gICAgfSk7XG4gICAgY29uc3QgZ2VvbWV0cnlUeXBlID0gcm93WydnZW9tX3R5cGUnXSB8fCAn5peg5YaF5ZyI5ZyI6ZmG5Zyw6L6555WM57q/JztcbiAgICBjb25zb2xlLmxvZyhgJHtuYW1lfSMke2lkfTogJHtnZW9tZXRyeVR5cGV9YCk7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBjYWxjT3V0ZXJKdW5jdHVyZShwZywgaWQsIG5hbWUpIHtcbiAgICAvLyDpgJrov4fkuI7kuK3lm73mtbflsrjnur/lgZrlt67pm4ZcbiAgICBjb25zdCBib3VuZGFyeVRhYmxlID0gJ2JvdW5kYXJ5Lm1mdyc7XG4gICAgY29uc3QgbGluZVRhYmxlID0gJ2JvdW5kYXJ5LmxpbmUnO1xuICAgIGNvbnN0IHR5cGUgPSAnb3V0ZXInO1xuICAgIGNvbnN0IGNhdGVnb3J5ID0gJ2p1bmN0dXJlJztcblxuICAgIGF3YWl0IHBnLnF1ZXJ5KFxuICAgICAgYGRlbGV0ZSBmcm9tICR7bGluZVRhYmxlfSB3aGVyZSBpZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApO1xuXG5cbiAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICB0YSBhcyAoXG4gICAgICBzZWxlY3QgMSBhcyBpZCwgZ2VvbSBmcm9tICR7bGluZVRhYmxlfSB3aGVyZSBpZCA9IDEgYW5kIHR5cGUgPSAnb3V0ZXInIGFuZCBjYXRlZ29yeSA9ICdjb2FzdGxpbmUnXG4gICAgKVxuICAgICwgdGIgYXMgKFxuICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSAke2JvdW5kYXJ5VGFibGV9IHdoZXJlIGlkID0gJDFcbiAgICApXG4gICAgLCB0YyBhcyAoXG4gICAgICBzZWxlY3QgMSBhcyBpZCwgU1RfTGluZU1lcmdlKFNUX0NvbGxlY3QoU1RfRXh0ZXJpb3JSaW5nKGdlb20pKSkgYXMgZ2VvbSBmcm9tIHRiXG4gICAgKVxuICAgICwgdGQgYXMgKFxuICAgICAgc2VsZWN0IFNUX0RpZmZlcmVuY2UoU1RfTWFrZVZhbGlkKHRjLmdlb20pLCBTVF9NYWtlVmFsaWQodGEuZ2VvbSkpIGFzIGdlb20gXG4gICAgICBmcm9tIHRhIGxlZnQgam9pbiB0YyBvbiB0YS5pZCA9IHRjLmlkXG4gICAgKVxuICAgICwgdGUgYXMgKFxuICAgICAgc2VsZWN0IChTVF9EdW1wKGdlb20pKS5nZW9tIGFzIGdlb20gZnJvbSB0ZCBcbiAgICApXG4gICAgLCB0ZiBhcyAoXG4gICAgICBzZWxlY3QgZ2VvbSBmcm9tIHRlIFxuICAgICAgd2hlcmUgKFNUX0lzQ2xvc2VkKGdlb20pID0gZmFsc2UgYW5kIFNUX05Qb2ludHMoZ2VvbSkgPiA0IGFuZCBTVF9MZW5ndGgoZ2VvbTo6Z2VvZ3JhcGh5KSAvIDEwMDAgPiA0KSBcbiAgICAgIG9yIChTVF9Jc0Nsb3NlZChnZW9tKSA9IHRydWUpXG4gICAgKVxuICAgICwgdGcgYXMgKFxuICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgaWQsICQyOjp2YXJjaGFyIGFzIHR5cGUsICQzOjp2YXJjaGFyIGFzIGNhdGVnb3J5LCBcbiAgICAgICQ0Ojp2YXJjaGFyIGFzIG5hbWUsIFNUX0xpbmVNZXJnZShTVF9Db2xsZWN0KGdlb20pKSBhcyBnZW9tIGZyb20gdGYgXG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7bGluZVRhYmxlfSAoaWQsIHR5cGUsIGNhdGVnb3J5LCBuYW1lLCBnZW9tKSBcbiAgICBzZWxlY3QgaWQsIHR5cGUsIGNhdGVnb3J5LCBuYW1lLCBnZW9tIGZyb20gdGdcbiAgICB3aGVyZSBTVF9OUG9pbnRzKGdlb20pID4gMCBcbiAgICBvbiBjb25mbGljdCAoaWQsIHR5cGUsIGNhdGVnb3J5KSBkbyB1cGRhdGUgc2V0IFxuICAgIG5hbWUgPSBleGNsdWRlZC5uYW1lLCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG5cbiAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZCwgdHlwZSwgY2F0ZWdvcnksIG5hbWVdKTtcblxuICAgIGF3YWl0IHRoaXMubGluZU1lcmdlKHBnLCBpZCwgdHlwZSwgY2F0ZWdvcnkpO1xuXG4gICAgLy8gZ2VvbSB0eXBlXG4gICAgY29uc3Qgcm93ID0gYXdhaXQgcGcucXVlcnkoXG4gICAgICBgc2VsZWN0IFNUX0dlb21ldHJ5VHlwZShnZW9tKSBhcyBnZW9tX3R5cGUgZnJvbSAke2xpbmVUYWJsZX0gXG4gICAgICB3aGVyZSBpZCA9ICQxIGFuZCB0eXBlID0gJDIgYW5kIGNhdGVnb3J5ID0gJDNgLFxuICAgICAgW2lkLCB0eXBlLCBjYXRlZ29yeV1cbiAgICApLnRoZW4ocmVzID0+IHtcbiAgICAgIHJldHVybiByZXMucm93c1swXSB8fCB7fTtcbiAgICB9KTtcbiAgICBjb25zdCBnZW9tZXRyeVR5cGUgPSByb3dbJ2dlb21fdHlwZSddIHx8ICfml6DlpJblnIjpmYblnLDovrnnlYznur8nO1xuICAgIGNvbnNvbGUubG9nKGAke25hbWV9IyR7aWR9OiAke2dlb21ldHJ5VHlwZX1gKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IExpYkNoaW5hUHJvdmluY2U7Il19