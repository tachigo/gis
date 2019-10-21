'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _terraformerWktParser = _interopRequireDefault(require("terraformer-wkt-parser"));

var _LibChinaProvince = _interopRequireDefault(require("./LibChinaProvince"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost'); // 41, 36, 35, 36, 30, 38, 15, 18, 17, 16

  const id = 16;
  await _LibChinaProvince.default.initProvinceGpsMfw(pg, id);
  const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/tmp-${id}/${id}.shp`;
  const dbfFilename = `${_modules.default.Utils.dataDir}/shapefile/tmp-${id}/${id}.dbf`;
  const pgTableName = 'gps.mfw';

  const lineResolve = async result => {
    const geometry = _terraformerWktParser.default.convert(result.value.geometry);

    const startTime = new Date().getTime(); // 计时

    const sql = `insert into ${pgTableName} (id, geom)
    values (
      $1::bigint, ST_Multi(ST_GeomFromText($2, 4326))::geometry
    )
    on conflict (id) do update set geom = excluded.geom`;
    const params = [id, geometry];
    await pg.query(sql, params).catch(e => {
      console.log(sql);
      throw e;
    });
    await pg.query(`with 
      ta as (
        select 1 as id, geom from ${pgTableName} where id = $1
      )
      , tb as (
        select 1 as id, geom from ${pgTableName} where id = 1
      )
      , tc as (
        select ST_Intersection(ta.geom, tb.geom) as geom from ta left join tb on ta.id = tb.id
      )
      insert into ${pgTableName} (id, geom) 
      select $1::bigint as id, geom from tc 
      on conflict (id) do update set geom = excluded.geom`, [id]);
    await _modules.default.PgSQL.getPostGis().validatePolygon(pg, id, pgTableName, 'id', 'geom');
    const list = await _LibChinaProvince.default.getProvinceGpsMfwList(pg);

    for await (const row of list) {
      if (row['id'] === id) {
        continue;
      }

      await _modules.default.Utils.call(`${id} - ${row['name']}#${row['id']} => ${id}`, _LibChinaProvince.default.fixGpsMfw.bind(_LibChinaProvince.default), [pg, id, row['id']]);
    }

    await _modules.default.PgSQL.getPostGis().validatePolygon(pg, id, pgTableName, 'id', 'geom');
    const endTime = new Date().getTime();
    const costTime = endTime - startTime;
    await _modules.default.Utils.log(`${pgTableName}#${id} cost ... ${costTime / 1000} s`);
  };

  await _modules.default.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC1jaGluYS1wcm92aW5jZS8wMi1pbXBvcnQtZ3BzLW1mdy5qcyJdLCJuYW1lcyI6WyJwZyIsIiQiLCJQZ1NRTCIsImNsaWVudCIsImlkIiwiTGliQ2hpbmFQcm92aW5jZSIsImluaXRQcm92aW5jZUdwc01mdyIsInNocEZpbGVuYW1lIiwiVXRpbHMiLCJkYXRhRGlyIiwiZGJmRmlsZW5hbWUiLCJwZ1RhYmxlTmFtZSIsImxpbmVSZXNvbHZlIiwicmVzdWx0IiwiZ2VvbWV0cnkiLCJXS1QiLCJjb252ZXJ0IiwidmFsdWUiLCJzdGFydFRpbWUiLCJEYXRlIiwiZ2V0VGltZSIsInNxbCIsInBhcmFtcyIsInF1ZXJ5IiwiY2F0Y2giLCJlIiwiY29uc29sZSIsImxvZyIsImdldFBvc3RHaXMiLCJ2YWxpZGF0ZVBvbHlnb24iLCJsaXN0IiwiZ2V0UHJvdmluY2VHcHNNZndMaXN0Iiwicm93IiwiY2FsbCIsImZpeEdwc01mdyIsImJpbmQiLCJlbmRUaW1lIiwiY29zdFRpbWUiLCJTaGFwZUZpbGUiLCJyZWFkTGluZSIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBOztBQUNBOztBQUNBOzs7O0FBRUEsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHLE1BQU1DLGlCQUFFQyxLQUFGLENBQVFDLE1BQVIsQ0FBZSxXQUFmLENBQWpCLENBRFcsQ0FFWDs7QUFDQSxRQUFNQyxFQUFFLEdBQUcsRUFBWDtBQUNBLFFBQU1DLDBCQUFpQkMsa0JBQWpCLENBQW9DTixFQUFwQyxFQUF3Q0ksRUFBeEMsQ0FBTjtBQUVBLFFBQU1HLFdBQVcsR0FBSSxHQUFFTixpQkFBRU8sS0FBRixDQUFRQyxPQUFRLGtCQUFpQkwsRUFBRyxJQUFHQSxFQUFHLE1BQWpFO0FBQ0EsUUFBTU0sV0FBVyxHQUFJLEdBQUVULGlCQUFFTyxLQUFGLENBQVFDLE9BQVEsa0JBQWlCTCxFQUFHLElBQUdBLEVBQUcsTUFBakU7QUFDQSxRQUFNTyxXQUFXLEdBQUcsU0FBcEI7O0FBQ0EsUUFBTUMsV0FBVyxHQUFHLE1BQU9DLE1BQVAsSUFBa0I7QUFDcEMsVUFBTUMsUUFBUSxHQUFHQyw4QkFBSUMsT0FBSixDQUFZSCxNQUFNLENBQUNJLEtBQVAsQ0FBYUgsUUFBekIsQ0FBakI7O0FBQ0EsVUFBTUksU0FBUyxHQUFJLElBQUlDLElBQUosRUFBRCxDQUFhQyxPQUFiLEVBQWxCLENBRm9DLENBRU07O0FBQzFDLFVBQU1DLEdBQUcsR0FBSSxlQUFjVixXQUFZOzs7O3dEQUF2QztBQUtBLFVBQU1XLE1BQU0sR0FBRyxDQUFDbEIsRUFBRCxFQUFLVSxRQUFMLENBQWY7QUFDQSxVQUFNZCxFQUFFLENBQUN1QixLQUFILENBQVNGLEdBQVQsRUFBY0MsTUFBZCxFQUNIRSxLQURHLENBQ0dDLENBQUMsSUFBSTtBQUNWQyxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWU4sR0FBWjtBQUNBLFlBQU1JLENBQU47QUFDRCxLQUpHLENBQU47QUFPQSxVQUFNekIsRUFBRSxDQUFDdUIsS0FBSCxDQUNIOztvQ0FFNkJaLFdBQVk7OztvQ0FHWkEsV0FBWTs7Ozs7b0JBSzVCQSxXQUFZOzswREFYdEIsRUFjSixDQUFDUCxFQUFELENBZEksQ0FBTjtBQWdCQSxVQUFNSCxpQkFBRUMsS0FBRixDQUFRMEIsVUFBUixHQUFxQkMsZUFBckIsQ0FBcUM3QixFQUFyQyxFQUF5Q0ksRUFBekMsRUFBNkNPLFdBQTdDLEVBQTBELElBQTFELEVBQWdFLE1BQWhFLENBQU47QUFFQSxVQUFNbUIsSUFBSSxHQUFHLE1BQU16QiwwQkFBaUIwQixxQkFBakIsQ0FBdUMvQixFQUF2QyxDQUFuQjs7QUFDQSxlQUFXLE1BQU1nQyxHQUFqQixJQUF3QkYsSUFBeEIsRUFBOEI7QUFDNUIsVUFBSUUsR0FBRyxDQUFDLElBQUQsQ0FBSCxLQUFjNUIsRUFBbEIsRUFBc0I7QUFDcEI7QUFDRDs7QUFDRCxZQUFNSCxpQkFBRU8sS0FBRixDQUFReUIsSUFBUixDQUNILEdBQUU3QixFQUFHLE1BQUs0QixHQUFHLENBQUMsTUFBRCxDQUFTLElBQUdBLEdBQUcsQ0FBQyxJQUFELENBQU8sT0FBTTVCLEVBQUcsRUFEekMsRUFFSkMsMEJBQWlCNkIsU0FBakIsQ0FBMkJDLElBQTNCLENBQWdDOUIseUJBQWhDLENBRkksRUFHSixDQUFDTCxFQUFELEVBQUtJLEVBQUwsRUFBUzRCLEdBQUcsQ0FBQyxJQUFELENBQVosQ0FISSxDQUFOO0FBS0Q7O0FBQ0QsVUFBTS9CLGlCQUFFQyxLQUFGLENBQVEwQixVQUFSLEdBQXFCQyxlQUFyQixDQUFxQzdCLEVBQXJDLEVBQXlDSSxFQUF6QyxFQUE2Q08sV0FBN0MsRUFBMEQsSUFBMUQsRUFBZ0UsTUFBaEUsQ0FBTjtBQUVBLFVBQU15QixPQUFPLEdBQUksSUFBSWpCLElBQUosRUFBRCxDQUFhQyxPQUFiLEVBQWhCO0FBQ0EsVUFBTWlCLFFBQVEsR0FBR0QsT0FBTyxHQUFHbEIsU0FBM0I7QUFDQSxVQUFNakIsaUJBQUVPLEtBQUYsQ0FBUW1CLEdBQVIsQ0FBYSxHQUFFaEIsV0FBWSxJQUFHUCxFQUFHLGFBQVlpQyxRQUFRLEdBQUcsSUFBSyxJQUE3RCxDQUFOO0FBQ0QsR0FsREQ7O0FBbURBLFFBQU1wQyxpQkFBRXFDLFNBQUYsQ0FBWUMsUUFBWixDQUFxQmhDLFdBQXJCLEVBQWtDRyxXQUFsQyxFQUErQ0UsV0FBL0MsQ0FBTjtBQUVBLFFBQU1aLEVBQUUsQ0FBQ3dDLE9BQUgsRUFBTjtBQUNELENBL0REIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgJCBmcm9tICcuLy4uLy4uL21vZHVsZXMnO1xuaW1wb3J0IFdLVCBmcm9tIFwidGVycmFmb3JtZXItd2t0LXBhcnNlclwiO1xuaW1wb3J0IExpYkNoaW5hUHJvdmluY2UgZnJvbSBcIi4vTGliQ2hpbmFQcm92aW5jZVwiO1xuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBwZyA9IGF3YWl0ICQuUGdTUUwuY2xpZW50KCdsb2NhbGhvc3QnKTtcbiAgLy8gNDEsIDM2LCAzNSwgMzYsIDMwLCAzOCwgMTUsIDE4LCAxNywgMTZcbiAgY29uc3QgaWQgPSAxNjtcbiAgYXdhaXQgTGliQ2hpbmFQcm92aW5jZS5pbml0UHJvdmluY2VHcHNNZncocGcsIGlkKTtcblxuICBjb25zdCBzaHBGaWxlbmFtZSA9IGAkeyQuVXRpbHMuZGF0YURpcn0vc2hhcGVmaWxlL3RtcC0ke2lkfS8ke2lkfS5zaHBgO1xuICBjb25zdCBkYmZGaWxlbmFtZSA9IGAkeyQuVXRpbHMuZGF0YURpcn0vc2hhcGVmaWxlL3RtcC0ke2lkfS8ke2lkfS5kYmZgO1xuICBjb25zdCBwZ1RhYmxlTmFtZSA9ICdncHMubWZ3JztcbiAgY29uc3QgbGluZVJlc29sdmUgPSBhc3luYyAocmVzdWx0KSA9PiB7XG4gICAgY29uc3QgZ2VvbWV0cnkgPSBXS1QuY29udmVydChyZXN1bHQudmFsdWUuZ2VvbWV0cnkpO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7IC8vIOiuoeaXtlxuICAgIGNvbnN0IHNxbCA9IGBpbnNlcnQgaW50byAke3BnVGFibGVOYW1lfSAoaWQsIGdlb20pXG4gICAgdmFsdWVzIChcbiAgICAgICQxOjpiaWdpbnQsIFNUX011bHRpKFNUX0dlb21Gcm9tVGV4dCgkMiwgNDMyNikpOjpnZW9tZXRyeVxuICAgIClcbiAgICBvbiBjb25mbGljdCAoaWQpIGRvIHVwZGF0ZSBzZXQgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuICAgIGNvbnN0IHBhcmFtcyA9IFtpZCwgZ2VvbWV0cnldO1xuICAgIGF3YWl0IHBnLnF1ZXJ5KHNxbCwgcGFyYW1zKVxuICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhzcWwpO1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfSlcbiAgICA7XG5cbiAgICBhd2FpdCBwZy5xdWVyeShcbiAgICAgIGB3aXRoIFxuICAgICAgdGEgYXMgKFxuICAgICAgICBzZWxlY3QgMSBhcyBpZCwgZ2VvbSBmcm9tICR7cGdUYWJsZU5hbWV9IHdoZXJlIGlkID0gJDFcbiAgICAgIClcbiAgICAgICwgdGIgYXMgKFxuICAgICAgICBzZWxlY3QgMSBhcyBpZCwgZ2VvbSBmcm9tICR7cGdUYWJsZU5hbWV9IHdoZXJlIGlkID0gMVxuICAgICAgKVxuICAgICAgLCB0YyBhcyAoXG4gICAgICAgIHNlbGVjdCBTVF9JbnRlcnNlY3Rpb24odGEuZ2VvbSwgdGIuZ2VvbSkgYXMgZ2VvbSBmcm9tIHRhIGxlZnQgam9pbiB0YiBvbiB0YS5pZCA9IHRiLmlkXG4gICAgICApXG4gICAgICBpbnNlcnQgaW50byAke3BnVGFibGVOYW1lfSAoaWQsIGdlb20pIFxuICAgICAgc2VsZWN0ICQxOjpiaWdpbnQgYXMgaWQsIGdlb20gZnJvbSB0YyBcbiAgICAgIG9uIGNvbmZsaWN0IChpZCkgZG8gdXBkYXRlIHNldCBnZW9tID0gZXhjbHVkZWQuZ2VvbWAsXG4gICAgICBbaWRdXG4gICAgKTtcbiAgICBhd2FpdCAkLlBnU1FMLmdldFBvc3RHaXMoKS52YWxpZGF0ZVBvbHlnb24ocGcsIGlkLCBwZ1RhYmxlTmFtZSwgJ2lkJywgJ2dlb20nKTtcblxuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCBMaWJDaGluYVByb3ZpbmNlLmdldFByb3ZpbmNlR3BzTWZ3TGlzdChwZyk7XG4gICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2YgbGlzdCkge1xuICAgICAgaWYgKHJvd1snaWQnXSA9PT0gaWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBhd2FpdCAkLlV0aWxzLmNhbGwoXG4gICAgICAgIGAke2lkfSAtICR7cm93WyduYW1lJ119IyR7cm93WydpZCddfSA9PiAke2lkfWAsXG4gICAgICAgIExpYkNoaW5hUHJvdmluY2UuZml4R3BzTWZ3LmJpbmQoTGliQ2hpbmFQcm92aW5jZSksXG4gICAgICAgIFtwZywgaWQsIHJvd1snaWQnXV1cbiAgICAgICk7XG4gICAgfVxuICAgIGF3YWl0ICQuUGdTUUwuZ2V0UG9zdEdpcygpLnZhbGlkYXRlUG9seWdvbihwZywgaWQsIHBnVGFibGVOYW1lLCAnaWQnLCAnZ2VvbScpO1xuXG4gICAgY29uc3QgZW5kVGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgY29uc3QgY29zdFRpbWUgPSBlbmRUaW1lIC0gc3RhcnRUaW1lO1xuICAgIGF3YWl0ICQuVXRpbHMubG9nKGAke3BnVGFibGVOYW1lfSMke2lkfSBjb3N0IC4uLiAke2Nvc3RUaW1lIC8gMTAwMH0gc2ApO1xuICB9O1xuICBhd2FpdCAkLlNoYXBlRmlsZS5yZWFkTGluZShzaHBGaWxlbmFtZSwgZGJmRmlsZW5hbWUsIGxpbmVSZXNvbHZlKTtcblxuICBhd2FpdCBwZy5yZWxlYXNlKCk7XG59KSgpOyJdfQ==