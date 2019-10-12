'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _modules = _interopRequireDefault(require("../../modules"));

var _terraformerWktParser = _interopRequireDefault(require("terraformer-wkt-parser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class LibChina {
  static async prepareChinaBoundary(pg) {
    const fromTable = 'gps.mfw';
    const toTable = 'boundary.mfw';
    const sql = `insert into ${toTable} 
    (id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id) 
    select id, parent_id, key, level, iso, zh_name, en_name, geom, region_id, mdd_id 
    from ${fromTable} where id = $1::bigint 
    on conflict (id) do update set 
    parent_id = excluded.parent_id, key = excluded.key, level = excluded.level, iso = excluded.iso, 
    zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom, 
    region_id = excluded.region_id, mdd_id = excluded.mdd_id`;
    await pg.query(sql, [1]);
  }

  static async importChinaSouth10(pg) {
    const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/十段线/十段线.shp`;
    const dbfFilename = `${_modules.default.Utils.dataDir}/shapefile/十段线/十段线.dbf`;
    const geoJson = {
      type: 'MultiLineString'
    };
    const coordinates = [];

    const lineResolve = async result => {
      const geometry = result.value.geometry;
      coordinates.push(geometry.coordinates);
    };

    await _modules.default.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);
    geoJson['coordinates'] = coordinates;

    const wktString = _terraformerWktParser.default.convert(geoJson).toString('utf8');

    const table = 'boundary.line';
    const id = 1;
    const type = 'extra';
    const category = 'china_south_10';
    const name = '中国';
    await pg.query(`delete from ${table} where id = $1 and type = $2 and category = $3`, [id, type, category]);
    const sql = `insert into ${table} (id, type, category, name, geom) 
    values ($1::bigint, $2::varchar, $3::varchar, $4::varchar, st_geomfromtext($5, 4326)) 
    on conflict (id, type, category) do update set 
    name = excluded.name, geom = excluded.geom`;
    await pg.query(sql, [id, type, category, name, wktString]);
  }

  static async importChinaBoundary(pg) {
    const table = 'boundary.mfw';
    const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/china-boundary/china.shp`;
    const dbfFilename = `${_modules.default.Utils.dataDir}/shapefile/china-boundary/china.dbf`;
    const id = 1;

    const lineResolve = async result => {
      const geometry = _terraformerWktParser.default.convert(result.value.geometry);

      const startTime = new Date().getTime(); // 计时

      const sql = `insert into ${table} (id, geom) 
      values ($1::bigint, ST_Multi(ST_GeomFromText($2, 4326))::geometry) 
      on conflict (id) do update 
      set geom = excluded.geom`;
      const params = [id, geometry];
      await pg.query(sql, params).catch(e => {
        console.log(sql);
        throw e;
      });
      const endTime = new Date().getTime();
      const costTime = endTime - startTime;
      console.log(`${table}#${id} cost ... ${costTime / 1000} s`);
    };

    await _modules.default.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);
    await _modules.default.PgSQL.getPostGis().validatePolygon(pg, id, table, 'id', 'geom');
  }

  static async fixChinaBoundary(pg) {
    // 和gps数据做交集
    const gpsTable = 'gps.mfw';
    const boundaryTable = 'boundary.mfw';
    const id = 1;
    const sql = `with 
    ta as (
      select 1 as id, geom from ${gpsTable} where id = $1
    )
    , tb as (
      select 1 as id, geom from ${boundaryTable} where id = $1
    )
    , tc as (
      select $1::bigint as id, st_intersection(st_makevalid(ta.geom), st_makevalid(tb.geom)) as geom 
      from ta left join tb on ta.id = tb.id
    )
    insert into ${boundaryTable} (id, geom) 
    select id, geom from tc 
    on conflict (id) do update set geom = excluded.geom`;
    await pg.query(sql, [id]);
  }

}

var _default = LibChina;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMy1ib3VuZGFyeS9MaWJDaGluYS5qcyJdLCJuYW1lcyI6WyJMaWJDaGluYSIsInByZXBhcmVDaGluYUJvdW5kYXJ5IiwicGciLCJmcm9tVGFibGUiLCJ0b1RhYmxlIiwic3FsIiwicXVlcnkiLCJpbXBvcnRDaGluYVNvdXRoMTAiLCJzaHBGaWxlbmFtZSIsIiQiLCJVdGlscyIsImRhdGFEaXIiLCJkYmZGaWxlbmFtZSIsImdlb0pzb24iLCJ0eXBlIiwiY29vcmRpbmF0ZXMiLCJsaW5lUmVzb2x2ZSIsInJlc3VsdCIsImdlb21ldHJ5IiwidmFsdWUiLCJwdXNoIiwiU2hhcGVGaWxlIiwicmVhZExpbmUiLCJ3a3RTdHJpbmciLCJXS1QiLCJjb252ZXJ0IiwidG9TdHJpbmciLCJ0YWJsZSIsImlkIiwiY2F0ZWdvcnkiLCJuYW1lIiwiaW1wb3J0Q2hpbmFCb3VuZGFyeSIsInN0YXJ0VGltZSIsIkRhdGUiLCJnZXRUaW1lIiwicGFyYW1zIiwiY2F0Y2giLCJlIiwiY29uc29sZSIsImxvZyIsImVuZFRpbWUiLCJjb3N0VGltZSIsIlBnU1FMIiwiZ2V0UG9zdEdpcyIsInZhbGlkYXRlUG9seWdvbiIsImZpeENoaW5hQm91bmRhcnkiLCJncHNUYWJsZSIsImJvdW5kYXJ5VGFibGUiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBR0E7O0FBQ0E7Ozs7QUFFQSxNQUFNQSxRQUFOLENBQWU7QUFFYixlQUFhQyxvQkFBYixDQUFrQ0MsRUFBbEMsRUFBc0M7QUFDcEMsVUFBTUMsU0FBUyxHQUFHLFNBQWxCO0FBQ0EsVUFBTUMsT0FBTyxHQUFHLGNBQWhCO0FBQ0EsVUFBTUMsR0FBRyxHQUFJLGVBQWNELE9BQVE7OztXQUc1QkQsU0FBVTs7Ozs2REFIakI7QUFRQSxVQUFNRCxFQUFFLENBQUNJLEtBQUgsQ0FBU0QsR0FBVCxFQUFjLENBQUMsQ0FBRCxDQUFkLENBQU47QUFDRDs7QUFHRCxlQUFhRSxrQkFBYixDQUFnQ0wsRUFBaEMsRUFB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LENBQXFCZCxXQUFyQixFQUFrQ0ksV0FBbEMsRUFBK0NJLFdBQS9DLENBQU47QUFDQSxVQUFNUCxpQkFBRWlDLEtBQUYsQ0FBUUMsVUFBUixHQUFxQkMsZUFBckIsQ0FBcUMxQyxFQUFyQyxFQUF5QzBCLEVBQXpDLEVBQTZDRCxLQUE3QyxFQUFvRCxJQUFwRCxFQUEwRCxNQUExRCxDQUFOO0FBQ0Q7O0FBR0QsZUFBYWtCLGdCQUFiLENBQThCM0MsRUFBOUIsRUFBa0M7QUFDaEM7QUFDQSxVQUFNNEMsUUFBUSxHQUFHLFNBQWpCO0FBQ0EsVUFBTUMsYUFBYSxHQUFHLGNBQXRCO0FBQ0EsVUFBTW5CLEVBQUUsR0FBRyxDQUFYO0FBQ0EsVUFBTXZCLEdBQUcsR0FBSTs7a0NBRWlCeUMsUUFBUzs7O2tDQUdUQyxhQUFjOzs7Ozs7a0JBTTlCQSxhQUFjOzt3REFYNUI7QUFjQSxVQUFNN0MsRUFBRSxDQUFDSSxLQUFILENBQVNELEdBQVQsRUFBYyxDQUFDdUIsRUFBRCxDQUFkLENBQU47QUFDRDs7QUFoR1k7O2VBd0dBNUIsUSIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuXG5pbXBvcnQgJCBmcm9tIFwiLi4vLi4vbW9kdWxlc1wiO1xuaW1wb3J0IFdLVCBmcm9tIFwidGVycmFmb3JtZXItd2t0LXBhcnNlclwiO1xuXG5jbGFzcyBMaWJDaGluYSB7XG5cbiAgc3RhdGljIGFzeW5jIHByZXBhcmVDaGluYUJvdW5kYXJ5KHBnKSB7XG4gICAgY29uc3QgZnJvbVRhYmxlID0gJ2dwcy5tZncnO1xuICAgIGNvbnN0IHRvVGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgICBjb25zdCBzcWwgPSBgaW5zZXJ0IGludG8gJHt0b1RhYmxlfSBcbiAgICAoaWQsIHBhcmVudF9pZCwga2V5LCBsZXZlbCwgaXNvLCB6aF9uYW1lLCBlbl9uYW1lLCBnZW9tLCByZWdpb25faWQsIG1kZF9pZCkgXG4gICAgc2VsZWN0IGlkLCBwYXJlbnRfaWQsIGtleSwgbGV2ZWwsIGlzbywgemhfbmFtZSwgZW5fbmFtZSwgZ2VvbSwgcmVnaW9uX2lkLCBtZGRfaWQgXG4gICAgZnJvbSAke2Zyb21UYWJsZX0gd2hlcmUgaWQgPSAkMTo6YmlnaW50IFxuICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBcbiAgICBwYXJlbnRfaWQgPSBleGNsdWRlZC5wYXJlbnRfaWQsIGtleSA9IGV4Y2x1ZGVkLmtleSwgbGV2ZWwgPSBleGNsdWRlZC5sZXZlbCwgaXNvID0gZXhjbHVkZWQuaXNvLCBcbiAgICB6aF9uYW1lID0gZXhjbHVkZWQuemhfbmFtZSwgZW5fbmFtZSA9IGV4Y2x1ZGVkLmVuX25hbWUsIGdlb20gPSBleGNsdWRlZC5nZW9tLCBcbiAgICByZWdpb25faWQgPSBleGNsdWRlZC5yZWdpb25faWQsIG1kZF9pZCA9IGV4Y2x1ZGVkLm1kZF9pZGA7XG4gICAgYXdhaXQgcGcucXVlcnkoc3FsLCBbMV0pO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgaW1wb3J0Q2hpbmFTb3V0aDEwKHBnKSB7XG4gICAgY29uc3Qgc2hwRmlsZW5hbWUgPSBgJHskLlV0aWxzLmRhdGFEaXJ9L3NoYXBlZmlsZS/ljYHmrrXnur8v5Y2B5q6157q/LnNocGA7XG4gICAgY29uc3QgZGJmRmlsZW5hbWUgPSBgJHskLlV0aWxzLmRhdGFEaXJ9L3NoYXBlZmlsZS/ljYHmrrXnur8v5Y2B5q6157q/LmRiZmA7XG4gICAgY29uc3QgZ2VvSnNvbiA9IHtcbiAgICAgIHR5cGU6ICdNdWx0aUxpbmVTdHJpbmcnXG4gICAgfTtcbiAgICBjb25zdCBjb29yZGluYXRlcyA9IFtdO1xuICAgIGNvbnN0IGxpbmVSZXNvbHZlID0gYXN5bmMgKHJlc3VsdCkgPT4ge1xuICAgICAgY29uc3QgZ2VvbWV0cnkgPSByZXN1bHQudmFsdWUuZ2VvbWV0cnk7XG4gICAgICBjb29yZGluYXRlcy5wdXNoKGdlb21ldHJ5LmNvb3JkaW5hdGVzKTtcbiAgICB9O1xuICAgIGF3YWl0ICQuU2hhcGVGaWxlLnJlYWRMaW5lKHNocEZpbGVuYW1lLCBkYmZGaWxlbmFtZSwgbGluZVJlc29sdmUpO1xuICAgIGdlb0pzb25bJ2Nvb3JkaW5hdGVzJ10gPSBjb29yZGluYXRlcztcbiAgICBjb25zdCB3a3RTdHJpbmcgPSBXS1QuY29udmVydChnZW9Kc29uKS50b1N0cmluZygndXRmOCcpO1xuICAgIGNvbnN0IHRhYmxlID0gJ2JvdW5kYXJ5LmxpbmUnO1xuICAgIGNvbnN0IGlkID0gMTtcbiAgICBjb25zdCB0eXBlID0gJ2V4dHJhJztcbiAgICBjb25zdCBjYXRlZ29yeSA9ICdjaGluYV9zb3V0aF8xMCc7XG4gICAgY29uc3QgbmFtZSA9ICfkuK3lm70nO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KFxuICAgICAgYGRlbGV0ZSBmcm9tICR7dGFibGV9IHdoZXJlIGlkID0gJDEgYW5kIHR5cGUgPSAkMiBhbmQgY2F0ZWdvcnkgPSAkM2AsXG4gICAgICBbaWQsIHR5cGUsIGNhdGVnb3J5XVxuICAgICk7XG4gICAgY29uc3Qgc3FsID0gYGluc2VydCBpbnRvICR7dGFibGV9IChpZCwgdHlwZSwgY2F0ZWdvcnksIG5hbWUsIGdlb20pIFxuICAgIHZhbHVlcyAoJDE6OmJpZ2ludCwgJDI6OnZhcmNoYXIsICQzOjp2YXJjaGFyLCAkNDo6dmFyY2hhciwgc3RfZ2VvbWZyb210ZXh0KCQ1LCA0MzI2KSkgXG4gICAgb24gY29uZmxpY3QgKGlkLCB0eXBlLCBjYXRlZ29yeSkgZG8gdXBkYXRlIHNldCBcbiAgICBuYW1lID0gZXhjbHVkZWQubmFtZSwgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkLCB0eXBlLCBjYXRlZ29yeSwgbmFtZSwgd2t0U3RyaW5nXSk7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBpbXBvcnRDaGluYUJvdW5kYXJ5KHBnKSB7XG4gICAgY29uc3QgdGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgICBjb25zdCBzaHBGaWxlbmFtZSA9IGAkeyQuVXRpbHMuZGF0YURpcn0vc2hhcGVmaWxlL2NoaW5hLWJvdW5kYXJ5L2NoaW5hLnNocGA7XG4gICAgY29uc3QgZGJmRmlsZW5hbWUgPSBgJHskLlV0aWxzLmRhdGFEaXJ9L3NoYXBlZmlsZS9jaGluYS1ib3VuZGFyeS9jaGluYS5kYmZgO1xuICAgIGNvbnN0IGlkID0gMTtcbiAgICBjb25zdCBsaW5lUmVzb2x2ZSA9IGFzeW5jIChyZXN1bHQpID0+IHtcbiAgICAgIGNvbnN0IGdlb21ldHJ5ID0gV0tULmNvbnZlcnQocmVzdWx0LnZhbHVlLmdlb21ldHJ5KTtcbiAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7IC8vIOiuoeaXtlxuICAgICAgY29uc3Qgc3FsID0gYGluc2VydCBpbnRvICR7dGFibGV9IChpZCwgZ2VvbSkgXG4gICAgICB2YWx1ZXMgKCQxOjpiaWdpbnQsIFNUX011bHRpKFNUX0dlb21Gcm9tVGV4dCgkMiwgNDMyNikpOjpnZW9tZXRyeSkgXG4gICAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBcbiAgICAgIHNldCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgICBjb25zdCBwYXJhbXMgPSBbaWQsIGdlb21ldHJ5XTtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgcGFyYW1zKVxuICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coc3FsKTtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgICAgY29uc3QgZW5kVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICBjb25zdCBjb3N0VGltZSA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICBjb25zb2xlLmxvZyhgJHt0YWJsZX0jJHtpZH0gY29zdCAuLi4gJHtjb3N0VGltZSAvIDEwMDB9IHNgKTtcbiAgICB9O1xuICAgIGF3YWl0ICQuU2hhcGVGaWxlLnJlYWRMaW5lKHNocEZpbGVuYW1lLCBkYmZGaWxlbmFtZSwgbGluZVJlc29sdmUpO1xuICAgIGF3YWl0ICQuUGdTUUwuZ2V0UG9zdEdpcygpLnZhbGlkYXRlUG9seWdvbihwZywgaWQsIHRhYmxlLCAnaWQnLCAnZ2VvbScpO1xuICB9XG5cblxuICBzdGF0aWMgYXN5bmMgZml4Q2hpbmFCb3VuZGFyeShwZykge1xuICAgIC8vIOWSjGdwc+aVsOaNruWBmuS6pOmbhlxuICAgIGNvbnN0IGdwc1RhYmxlID0gJ2dwcy5tZncnO1xuICAgIGNvbnN0IGJvdW5kYXJ5VGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgICBjb25zdCBpZCA9IDE7XG4gICAgY29uc3Qgc3FsID0gYHdpdGggXG4gICAgdGEgYXMgKFxuICAgICAgc2VsZWN0IDEgYXMgaWQsIGdlb20gZnJvbSAke2dwc1RhYmxlfSB3aGVyZSBpZCA9ICQxXG4gICAgKVxuICAgICwgdGIgYXMgKFxuICAgICAgc2VsZWN0IDEgYXMgaWQsIGdlb20gZnJvbSAke2JvdW5kYXJ5VGFibGV9IHdoZXJlIGlkID0gJDFcbiAgICApXG4gICAgLCB0YyBhcyAoXG4gICAgICBzZWxlY3QgJDE6OmJpZ2ludCBhcyBpZCwgc3RfaW50ZXJzZWN0aW9uKHN0X21ha2V2YWxpZCh0YS5nZW9tKSwgc3RfbWFrZXZhbGlkKHRiLmdlb20pKSBhcyBnZW9tIFxuICAgICAgZnJvbSB0YSBsZWZ0IGpvaW4gdGIgb24gdGEuaWQgPSB0Yi5pZFxuICAgIClcbiAgICBpbnNlcnQgaW50byAke2JvdW5kYXJ5VGFibGV9IChpZCwgZ2VvbSkgXG4gICAgc2VsZWN0IGlkLCBnZW9tIGZyb20gdGMgXG4gICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgc2V0IGdlb20gPSBleGNsdWRlZC5nZW9tYDtcbiAgICBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZF0pO1xuICB9XG5cblxuXG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBMaWJDaGluYTsiXX0=