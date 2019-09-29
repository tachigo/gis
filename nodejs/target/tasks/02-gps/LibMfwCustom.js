'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _modules = _interopRequireDefault(require("./../../modules"));

var _terraformerWktParser = _interopRequireDefault(require("terraformer-wkt-parser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
        zhName: row['zh_name']
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
    const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/china-maritime/china.shp`;
    const dbfFilename = `${_modules.default.Utils.dataDir}/shapefile/china-maritime/china.dbf`;
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
    await this.removeInteriorRing(pg, id);
    await _modules.default.PgSQL.getPostGis().validatePolygon(pg, id, table, 'id', 'geom');
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
      await _modules.default.Utils.call(`${item.zhName}#${aId}`, this.geomADiffB2A.bind(this), [pg, aId, bId]);
    }
  }

  static async fixOthers01(pg) {
    // 乌克兰和俄罗斯的克里米亚半岛归俄罗斯 乌克兰 - 俄罗斯 => 乌克兰
    const that = this;
    await _modules.default.Utils.call(`乌克兰#900177 - 俄罗斯#900136 => 乌克兰#900177`, async () => {
      await that.geomADiffB2A(pg, 900177, 900136);
    });
  }

  static async fixOthers02(pg) {
    // 苏丹和南苏丹的交集归苏丹 南苏丹 - 苏丹 => 南苏丹
    const that = this;
    await _modules.default.Utils.call(`南苏丹#900156 - 苏丹#900159 => 南苏丹#900156`, async () => {
      await that.geomADiffB2A(pg, 900156, 900159);
    });
  }

  static async fixOthers03(pg) {
    // 摩洛哥和西撒哈拉的交集归西撒哈拉 摩洛哥 - 西撒哈拉 => 摩洛哥
    const that = this;
    await _modules.default.Utils.call(`摩洛哥#900112 - 西撒哈拉#900185 => 摩洛哥#900112`, async () => {
      await that.geomADiffB2A(pg, 900112, 900185);
    });
  }

  static async fixOthers04(pg) {
    // 摩洛哥和西班牙
    const that = this;
    await _modules.default.Utils.call(`摩洛哥#900112 - 西班牙#900157 => 摩洛哥#900112`, async () => {
      await that.geomADiffB2A(pg, 900112, 900157);
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
      await _modules.default.Utils.call(`${item.zhName}#${bId}`, this.geomADiffB2A.bind(this), [pg, id, bId]);
    }
  }

  static async fixOthers06(pg) {
    // 克罗地亚#900040 塞尔维亚#900146
    // 塞尔维亚#900146 - 克罗地亚#900040 => 塞尔维亚#900146
    const that = this;
    await _modules.default.Utils.call(`塞尔维亚#900146 - 克罗地亚#900040 => 塞尔维亚#900146`, async () => {
      await that.geomADiffB2A(pg, 900146, 900040);
    }); // 将塞尔维亚取凸包后与周围国家取差集

    const id = 900146; // 塞尔维亚

    const table = 'gps.mfw';
    await pg.query(`update ${table} set geom = st_convexhull(geom) where id = $1::bigint`, [id]);
    const countryIntersectWith = await this.countryIntersectWith(pg, id);
    console.log(countryIntersectWith);

    for await (const item of countryIntersectWith) {
      const bId = item.id;
      await _modules.default.Utils.call(`${item.zhName}#${bId}`, this.geomADiffB2A.bind(this), [pg, id, bId]);
    }
  }

}

var _default = LibMfwCustom;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMi1ncHMvTGliTWZ3Q3VzdG9tLmpzIl0sIm5hbWVzIjpbIkxpYk1md0N1c3RvbSIsImNvdW50cnlJbnRlcnNlY3RXaXRoIiwicGciLCJpZCIsInRhYmxlIiwic3FsIiwicmVzIiwicXVlcnkiLCJpdGVtcyIsInJvdyIsInJvd3MiLCJwdXNoIiwiemhOYW1lIiwicmVtb3ZlSW50ZXJpb3JSaW5nIiwiaW1wb3J0Q2hpbmFNYXJpdGltZSIsInNocEZpbGVuYW1lIiwiJCIsIlV0aWxzIiwiZGF0YURpciIsImRiZkZpbGVuYW1lIiwibGluZVJlc29sdmUiLCJyZXN1bHQiLCJnZW9tZXRyeSIsIldLVCIsImNvbnZlcnQiLCJ2YWx1ZSIsInN0YXJ0VGltZSIsIkRhdGUiLCJnZXRUaW1lIiwicGFyYW1zIiwiY2F0Y2giLCJlIiwiY29uc29sZSIsImxvZyIsImVuZFRpbWUiLCJjb3N0VGltZSIsIlNoYXBlRmlsZSIsInJlYWRMaW5lIiwiUGdTUUwiLCJnZXRQb3N0R2lzIiwidmFsaWRhdGVQb2x5Z29uIiwiZ2VvbUFEaWZmQjJBIiwiYUlkIiwiYklkIiwiZml4Q291bnRyeUludGVyc2VjdHNXaXRoQ2hpbmEiLCJjb3VudHJ5SW50ZXJzZWN0V2l0aENoaW5hIiwiaXRlbSIsImNhbGwiLCJiaW5kIiwiZml4T3RoZXJzMDEiLCJ0aGF0IiwiZml4T3RoZXJzMDIiLCJmaXhPdGhlcnMwMyIsImZpeE90aGVyczA0IiwiZml4T3RoZXJzMDUiLCJmaXhPdGhlcnMwNiJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7QUFFQTs7QUFDQTs7OztBQUVBLE1BQU1BLFlBQU4sQ0FBbUI7QUFFakIsZUFBYUMsb0JBQWIsQ0FBa0NDLEVBQWxDLEVBQXNDQyxFQUF0QyxFQUEwQztBQUN4QyxVQUFNQyxLQUFLLEdBQUcsU0FBZDtBQUNBLFVBQU1DLEdBQUcsR0FBSTs7eUJBRVFELEtBQU07O29FQUVxQ0EsS0FBTTtvSUFKdEU7QUFNQSxVQUFNRSxHQUFHLEdB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cEUsQ0FBTjtBQUNEO0FBQ0Y7O0FBeEtnQjs7ZUE0S0ozQyxZIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgJCBmcm9tICcuLy4uLy4uL21vZHVsZXMnO1xuaW1wb3J0IFdLVCBmcm9tIFwidGVycmFmb3JtZXItd2t0LXBhcnNlclwiO1xuXG5jbGFzcyBMaWJNZndDdXN0b20ge1xuXG4gIHN0YXRpYyBhc3luYyBjb3VudHJ5SW50ZXJzZWN0V2l0aChwZywgaWQpIHtcbiAgICBjb25zdCB0YWJsZSA9ICdncHMubWZ3JztcbiAgICBjb25zdCBzcWwgPSBgd2l0aCBcbiAgICB0YSBhcyAoXG4gICAgICBzZWxlY3QgZ2VvbSBmcm9tICR7dGFibGV9IHdoZXJlIGlkID0gJDE6OmJpZ2ludFxuICAgIClcbiAgICBzZWxlY3QgdGIuaWQgYXMgaWQsIHRiLnpoX25hbWUgYXMgemhfbmFtZSwgdGIuaXNvIGFzIGlzbyBmcm9tICR7dGFibGV9IGFzIHRiLCB0YSBcbiAgICB3aGVyZSB0Yi5pZCA+IDkwMDAwMCBhbmQgbGV2ZWw6OmludGVnZXIgPD0gMSBhbmQgdGIuaWQgIT0gJDE6OmJpZ2ludCBhbmQgc3RfaW50ZXJzZWN0cyh0YS5nZW9tLCB0Yi5nZW9tKSA9IHRydWUgb3JkZXIgYnkgaWQgYXNjYDtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBwZy5xdWVyeShzcWwsIFtpZF0pO1xuICAgIGNvbnN0IGl0ZW1zID0gW107XG4gICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2YgcmVzLnJvd3MpIHtcbiAgICAgIGl0ZW1zLnB1c2goe1xuICAgICAgICBpZDogK3Jvd1snaWQnXSxcbiAgICAgICAgemhOYW1lOiByb3dbJ3poX25hbWUnXSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gaXRlbXM7XG4gIH1cblxuXG5cblxuICBzdGF0aWMgYXN5bmMgcmVtb3ZlSW50ZXJpb3JSaW5nKHBnLCBpZCkge1xuICAgIGNvbnN0IHRhYmxlID0gJ2dwcy5tZncnO1xuICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgIHRhIGFzIChcbiAgICAgIHNlbGVjdCAoc3RfZHVtcChnZW9tKSkuZ2VvbSBhcyBnZW9tIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPSAkMVxuICAgIClcbiAgICAsIHRiIGFzIChcbiAgICAgIHNlbGVjdCBzdF9leHRlcmlvcnJpbmcoZ2VvbSkgYXMgZ2VvbSBmcm9tIHRhXG4gICAgKVxuICAgICwgdGMgYXMgKFxuICAgICAgc2VsZWN0IHN0X3BvbHlnb25pemUoZ2VvbSkgYXMgZ2VvbSBmcm9tIHRiXG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7dGFibGV9IChpZCwgZ2VvbSkgXG4gICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgaWQsIHN0X211bHRpKGdlb20pIGFzIGdlb20gZnJvbSB0YyBcbiAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgW2lkXSk7XG4gIH1cblxuXG5cbiAgc3RhdGljIGFzeW5jIGltcG9ydENoaW5hTWFyaXRpbWUocGcpIHtcbiAgICBjb25zdCB0YWJsZSA9ICdncHMubWZ3JztcbiAgICBjb25zdCBzaHBGaWxlbmFtZSA9IGAkeyQuVXRpbHMuZGF0YURpcn0vc2hhcGVmaWxlL2NoaW5hLW1hcml0aW1lL2NoaW5hLnNocGA7XG4gICAgY29uc3QgZGJmRmlsZW5hbWUgPSBgJHskLlV0aWxzLmRhdGFEaXJ9L3NoYXBlZmlsZS9jaGluYS1tYXJpdGltZS9jaGluYS5kYmZgO1xuICAgIGNvbnN0IGlkID0gMTtcbiAgICBjb25zdCBsaW5lUmVzb2x2ZSA9IGFzeW5jIChyZXN1bHQpID0+IHtcbiAgICAgIGNvbnN0IGdlb21ldHJ5ID0gV0tULmNvbnZlcnQocmVzdWx0LnZhbHVlLmdlb21ldHJ5KTtcbiAgICAgIGNvbnN0IHN0YXJ0VGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7IC8vIOiuoeaXtlxuICAgICAgY29uc3Qgc3FsID0gYGluc2VydCBpbnRvICR7dGFibGV9IChpZCwgZ2VvbSkgXG4gICAgICB2YWx1ZXMgKCQxOjpiaWdpbnQsIFNUX011bHRpKFNUX0dlb21Gcm9tVGV4dCgkMiwgNDMyNikpOjpnZW9tZXRyeSkgXG4gICAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBcbiAgICAgIHNldCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgICBjb25zdCBwYXJhbXMgPSBbaWQsIGdlb21ldHJ5XTtcbiAgICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgcGFyYW1zKVxuICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coc3FsKTtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgICAgY29uc3QgZW5kVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICBjb25zdCBjb3N0VGltZSA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICBjb25zb2xlLmxvZyhgJHt0YWJsZX0jJHtpZH0gY29zdCAuLi4gJHtjb3N0VGltZSAvIDEwMDB9IHNgKTtcbiAgICB9O1xuICAgIGF3YWl0ICQuU2hhcGVGaWxlLnJlYWRMaW5lKHNocEZpbGVuYW1lLCBkYmZGaWxlbmFtZSwgbGluZVJlc29sdmUpO1xuICAgIGF3YWl0IHRoaXMucmVtb3ZlSW50ZXJpb3JSaW5nKHBnLCBpZCk7XG4gICAgYXdhaXQgJC5QZ1NRTC5nZXRQb3N0R2lzKCkudmFsaWRhdGVQb2x5Z29uKHBnLCBpZCwgdGFibGUsICdpZCcsICdnZW9tJyk7XG4gIH1cblxuXG4gIHN0YXRpYyBhc3luYyBnZW9tQURpZmZCMkEocGcsIGFJZCwgYklkKSB7XG4gICAgY29uc3QgdGFibGUgPSAnZ3BzLm1mdyc7XG4gICAgY29uc3Qgc3FsID0gYHdpdGhcbiAgICB0YSBhcyAoc2VsZWN0IDEgYXMgaWQsIGdlb20gZnJvbSAke3RhYmxlfSB3aGVyZSBpZCA9ICR7YUlkfSkgLS0gQVxuICAgICwgdGIgYXMgKHNlbGVjdCAxIGFzIGlkLCBnZW9tIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPSAke2JJZH0pIC0tIEJcbiAgICAsIGZpeGVkIGFzIChcbiAgICAgICBzZWxlY3QgJHthSWR9IGFzIGlkLCBzdF9kaWZmZXJlbmNlKHN0X21ha2V2YWxpZCh0YS5nZW9tKSwgc3RfbWFrZXZhbGlkKHRiLmdlb20pKSBhcyBnZW9tXG4gICAgICAgZnJvbSB0YSBsZWZ0IGpvaW4gdGJcbiAgICAgICBvbiB0YS5pZCA9IHRiLmlkXG4gICAgKVxuICAgIGluc2VydCBpbnRvICR7dGFibGV9IChpZCwgZ2VvbSlcbiAgICBzZWxlY3QgaWQsIGdlb20gXG4gICAgZnJvbSBmaXhlZFxuICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBcbiAgICBnZW9tID0gZXhjbHVkZWQuZ2VvbTtgO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCk7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgZml4Q291bnRyeUludGVyc2VjdHNXaXRoQ2hpbmEocGcpIHtcbiAgICBjb25zdCBiSWQgPSAxO1xuICAgIGNvbnN0IGNvdW50cnlJbnRlcnNlY3RXaXRoQ2hpbmEgPSBhd2FpdCB0aGlzLmNvdW50cnlJbnRlcnNlY3RXaXRoKHBnLCBiSWQpO1xuICAgIGNvbnNvbGUubG9nKGNvdW50cnlJbnRlcnNlY3RXaXRoQ2hpbmEpO1xuICAgIGZvciBhd2FpdCAoY29uc3QgaXRlbSBvZiBjb3VudHJ5SW50ZXJzZWN0V2l0aENoaW5hKSB7XG4gICAgICBjb25zdCBhSWQgPSBpdGVtLmlkO1xuICAgICAgYXdhaXQgJC5VdGlscy5jYWxsKGAke2l0ZW0uemhOYW1lfSMke2FJZH1gLCB0aGlzLmdlb21BRGlmZkIyQS5iaW5kKHRoaXMpLCBbcGcsIGFJZCwgYklkXSk7XG4gICAgfVxuICB9XG5cblxuXG4gIHN0YXRpYyBhc3luYyBmaXhPdGhlcnMwMShwZykge1xuICAgIC8vIOS5jOWFi+WFsOWSjOS/hOe9l+aWr+eahOWFi+mHjOexs+S6muWNiuWym+W9kuS/hOe9l+aWryDkuYzlhYvlhbAgLSDkv4TnvZfmlq8gPT4g5LmM5YWL5YWwXG4gICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgYXdhaXQgJC5VdGlscy5jYWxsKGDkuYzlhYvlhbAjOTAwMTc3IC0g5L+E572X5pavIzkwMDEzNiA9PiDkuYzlhYvlhbAjOTAwMTc3YCwgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhhdC5nZW9tQURpZmZCMkEocGcsIDkwMDE3NywgOTAwMTM2KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBmaXhPdGhlcnMwMihwZykge1xuICAgIC8vIOiLj+S4ueWSjOWNl+iLj+S4ueeahOS6pOmbhuW9kuiLj+S4uSDljZfoi4/kuLkgLSDoi4/kuLkgPT4g5Y2X6IuP5Li5XG4gICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgYXdhaXQgJC5VdGlscy5jYWxsKGDljZfoi4/kuLkjOTAwMTU2IC0g6IuP5Li5IzkwMDE1OSA9PiDljZfoi4/kuLkjOTAwMTU2YCwgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhhdC5nZW9tQURpZmZCMkEocGcsIDkwMDE1NiwgOTAwMTU5KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBmaXhPdGhlcnMwMyhwZykge1xuICAgIC8vIOaRqea0m+WTpeWSjOilv+aSkuWTiOaLieeahOS6pOmbhuW9kuilv+aSkuWTiOaLiSDmkanmtJvlk6UgLSDopb/mkpLlk4jmi4kgPT4g5pGp5rSb5ZOlXG4gICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgYXdhaXQgJC5VdGlscy5jYWxsKGDmkanmtJvlk6UjOTAwMTEyIC0g6KW/5pKS5ZOI5ouJIzkwMDE4NSA9PiDmkanmtJvlk6UjOTAwMTEyYCwgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhhdC5nZW9tQURpZmZCMkEocGcsIDkwMDExMiwgOTAwMTg1KTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGZpeE90aGVyczA0KHBnKSB7XG4gICAgLy8g5pGp5rSb5ZOl5ZKM6KW/54+t54mZXG4gICAgY29uc3QgdGhhdCA9IHRoaXM7XG4gICAgYXdhaXQgJC5VdGlscy5jYWxsKGDmkanmtJvlk6UjOTAwMTEyIC0g6KW/54+t54mZIzkwMDE1NyA9PiDmkanmtJvlk6UjOTAwMTEyYCwgYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhhdC5nZW9tQURpZmZCMkEocGcsIDkwMDExMiwgOTAwMTU3KTtcbiAgICB9KTtcbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGZpeE90aGVyczA1KHBnKSB7XG4gICAgLy8g5bCG5Y2X6IuP5Li55Y+W5Ye45YyF5ZCO5LiO5ZGo5Zu05Zu95a625Y+W5beu6ZuGXG4gICAgY29uc3QgaWQgPSA5MDAxNTY7IC8vIOWNl+iLj+S4uVxuICAgIGNvbnN0IHRhYmxlID0gJ2dwcy5tZncnO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGB1cGRhdGUgJHt0YWJsZX0gc2V0IGdlb20gPSBzdF9jb252ZXhodWxsKGdlb20pIHdoZXJlIGlkID0gJDE6OmJpZ2ludGAsIFtpZF0pO1xuICAgIGNvbnN0IGNvdW50cnlJbnRlcnNlY3RXaXRoID0gYXdhaXQgdGhpcy5jb3VudHJ5SW50ZXJzZWN0V2l0aChwZywgaWQpO1xuICAgIGNvbnNvbGUubG9nKGNvdW50cnlJbnRlcnNlY3RXaXRoKTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgY291bnRyeUludGVyc2VjdFdpdGgpIHtcbiAgICAgIGNvbnN0IGJJZCA9IGl0ZW0uaWQ7XG4gICAgICBhd2FpdCAkLlV0aWxzLmNhbGwoYCR7aXRlbS56aE5hbWV9IyR7YklkfWAsIHRoaXMuZ2VvbUFEaWZmQjJBLmJpbmQodGhpcyksIFtwZywgaWQsIGJJZF0pO1xuICAgIH1cbiAgfVxuXG5cbiAgc3RhdGljIGFzeW5jIGZpeE90aGVyczA2KHBnKSB7XG4gICAgLy8g5YWL572X5Zyw5LqaIzkwMDA0MCDloZ7lsJTnu7TkupojOTAwMTQ2XG4gICAgLy8g5aGe5bCU57u05LqaIzkwMDE0NiAtIOWFi+e9l+WcsOS6miM5MDAwNDAgPT4g5aGe5bCU57u05LqaIzkwMDE0NlxuICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgIGF3YWl0ICQuVXRpbHMuY2FsbChg5aGe5bCU57u05LqaIzkwMDE0NiAtIOWFi+e9l+WcsOS6miM5MDAwNDAgPT4g5aGe5bCU57u05LqaIzkwMDE0NmAsIGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoYXQuZ2VvbUFEaWZmQjJBKHBnLCA5MDAxNDYsIDkwMDA0MCk7XG4gICAgfSk7XG4gICAgLy8g5bCG5aGe5bCU57u05Lqa5Y+W5Ye45YyF5ZCO5LiO5ZGo5Zu05Zu95a625Y+W5beu6ZuGXG4gICAgY29uc3QgaWQgPSA5MDAxNDY7IC8vIOWhnuWwlOe7tOS6mlxuICAgIGNvbnN0IHRhYmxlID0gJ2dwcy5tZncnO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KGB1cGRhdGUgJHt0YWJsZX0gc2V0IGdlb20gPSBzdF9jb252ZXhodWxsKGdlb20pIHdoZXJlIGlkID0gJDE6OmJpZ2ludGAsIFtpZF0pO1xuICAgIGNvbnN0IGNvdW50cnlJbnRlcnNlY3RXaXRoID0gYXdhaXQgdGhpcy5jb3VudHJ5SW50ZXJzZWN0V2l0aChwZywgaWQpO1xuICAgIGNvbnNvbGUubG9nKGNvdW50cnlJbnRlcnNlY3RXaXRoKTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgY291bnRyeUludGVyc2VjdFdpdGgpIHtcbiAgICAgIGNvbnN0IGJJZCA9IGl0ZW0uaWQ7XG4gICAgICBhd2FpdCAkLlV0aWxzLmNhbGwoYCR7aXRlbS56aE5hbWV9IyR7YklkfWAsIHRoaXMuZ2VvbUFEaWZmQjJBLmJpbmQodGhpcyksIFtwZywgaWQsIGJJZF0pO1xuICAgIH1cbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IExpYk1md0N1c3RvbTsiXX0=