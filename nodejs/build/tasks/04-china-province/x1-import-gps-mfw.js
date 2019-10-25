'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _terraformerWktParser = _interopRequireDefault(require("terraformer-wkt-parser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/china-province-gps/gps.shp`;
  const dbfFilename = `${_modules.default.Utils.dataDir}/shapefile/china-province-gps/gps.dbf`;
  const pgTableName = 'gps.mfw';

  const lineResolve = async result => {
    const properties = result.value.properties;

    const geometry = _terraformerWktParser.default.convert(result.value.geometry);

    const startTime = new Date().getTime(); // 计时

    const sql = `insert into ${pgTableName} (id, parent_id, level, iso, zh_name, en_name, geom, region_id, mdd_id, key)
    values (
      $1::bigint, $2::bigint, $3::integer, $4::varchar,
      $5::varchar, $6::varchar, ST_Multi(ST_GeomFromText($7, 4326))::geometry, 
      $8::bigint, $9::bigint, $10::varchar
    )
    on conflict (id) do update
    set parent_id = excluded.parent_id, level = excluded.level, iso = excluded.iso, 
    zh_name = excluded.zh_name, en_name = excluded.en_name, geom = excluded.geom`;
    const params = [properties['id'], properties['parent_id'], properties['level'], properties['iso'], properties['zh_name'], properties['en_name'], geometry, properties['region_id'], properties['mdd_id'], properties['key']]; // console.log(properties);

    await pg.query(sql, params).catch(e => {
      console.log(sql);
      throw e;
    });
    const endTime = new Date().getTime();
    const costTime = endTime - startTime;
    await _modules.default.Utils.log(`${pgTableName}#${properties['id']} cost ... ${costTime / 1000} s`);
  };

  await _modules.default.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC1jaGluYS1wcm92aW5jZS94MS1pbXBvcnQtZ3BzLW1mdy5qcyJdLCJuYW1lcyI6WyJwZyIsIiQiLCJQZ1NRTCIsImNsaWVudCIsInNocEZpbGVuYW1lIiwiVXRpbHMiLCJkYXRhRGlyIiwiZGJmRmlsZW5hbWUiLCJwZ1RhYmxlTmFtZSIsImxpbmVSZXNvbHZlIiwicmVzdWx0IiwicHJvcGVydGllcyIsInZhbHVlIiwiZ2VvbWV0cnkiLCJXS1QiLCJjb252ZXJ0Iiwic3RhcnRUaW1lIiwiRGF0ZSIsImdldFRpbWUiLCJzcWwiLCJwYXJhbXMiLCJxdWVyeSIsImNhdGNoIiwiZSIsImNvbnNvbGUiLCJsb2ciLCJlbmRUaW1lIiwiY29zdFRpbWUiLCJTaGFwZUZpbGUiLCJyZWFkTGluZSIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBOztBQUNBOzs7O0FBRUEsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHLE1BQU1DLGlCQUFFQyxLQUFGLENBQVFDLE1BQVIsQ0FBZSxXQUFmLENBQWpCO0FBQ0EsUUFBTUMsV0FBVyxHQUFJLEdBQUVILGlCQUFFSSxLQUFGLENBQVFDLE9BQVEsdUNBQXZDO0FBQ0EsUUFBTUMsV0FBVyxHQUFJLEdBQUVOLGlCQUFFSSxLQUFGLENBQVFDLE9BQVEsdUNBQXZDO0FBQ0EsUUFBTUUsV0FBVyxHQUFHLFNBQXBCOztBQUNBLFFBQU1DLFdBQVcsR0FBRyxNQUFPQyxNQUFQLElBQWtCO0FBQ3BDLFVBQU1DLFVBQVUsR0FBR0QsTUFBTSxDQUFDRSxLQUFQLENBQWFELFVBQWhDOztBQUNBLFVBQU1FLFFBQVEsR0FBR0MsOEJBQUlDLE9BQUosQ0FBWUwsTUFBTSxDQUFDRSxLQUFQLENBQWFDLFFBQXpCLENBQWpCOztBQUNBLFVBQU1HLFNBQVMsR0FBSSxJQUFJQyxJQUFKLEVBQUQsQ0FBYUMsT0FBYixFQUFsQixDQUhvQyxDQUdNOztBQUMxQyxVQUFNQyxHQUFHLEdBQUksZUFBY1gsV0FBWTs7Ozs7Ozs7aUZBQXZDO0FBU0EsVUFBTVksTUFBTSxHQUFHLENBQ2JULFVBQVUsQ0FBQyxJQUFELENBREcsRUFDS0EsVUFBVSxDQUFDLFdBQUQsQ0FEZixFQUM4QkEsVUFBVSxDQUFDLE9BQUQsQ0FEeEMsRUFDbURBLFVBQVUsQ0FBQyxLQUFELENBRDdELEVBRWJBLFVBQVUsQ0FBQyxTQUFELENBRkcsRUFFVUEsVUFBVSxDQUFDLFNBQUQsQ0FGcEIsRUFFaUNFLFFBRmpDLEVBRTJDRixVQUFVLENBQUMsV0FBRCxDQUZyRCxFQUdiQSxVQUFVLENBQUMsUUFBRCxDQUhHLEVBR1NBLFVBQVUsQ0FBQyxLQUFELENBSG5CLENBQWYsQ0Fib0MsQ0FrQnBDOztBQUNBLFVBQU1YLEVBQUUsQ0FBQ3FCLEtBQUgsQ0FBU0YsR0FBVCxFQUFjQyxNQUFkLEVBQ0hFLEtBREcsQ0FDR0MsQ0FBQyxJQUFJO0FBQ1ZDLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZTixHQUFaO0FBQ0EsWUFBTUksQ0FBTjtBQUNELEtBSkcsQ0FBTjtBQU1BLFVBQU1HLE9BQU8sR0FBSSxJQUFJVCxJQUFKLEVBQUQsQ0FBYUMsT0FBYixFQUFoQjtBQUNBLFVBQU1TLFFBQVEsR0FBR0QsT0FBTyxHQUFHVixTQUEzQjtBQUNBLFVBQU1mLGlCQUFFSSxLQUFGLENBQVFvQixHQUFSLENBQWEsR0FBRWpCLFdBQVksSUFBR0csVUFBVSxDQUFDLElBQUQsQ0FBTyxhQUFZZ0IsUUFBUSxHQUFHLElBQUssSUFBM0UsQ0FBTjtBQUNELEdBNUJEOztBQTZCQSxRQUFNMUIsaUJBQUUyQixTQUFGLENBQVlDLFFBQVosQ0FBcUJ6QixXQUFyQixFQUFrQ0csV0FBbEMsRUFBK0NFLFdBQS9DLENBQU47QUFFQSxRQUFNVCxFQUFFLENBQUM4QixPQUFILEVBQU47QUFDRCxDQXJDRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcbmltcG9ydCBXS1QgZnJvbSBcInRlcnJhZm9ybWVyLXdrdC1wYXJzZXJcIjtcblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLmNsaWVudCgnbG9jYWxob3N0Jyk7XG4gIGNvbnN0IHNocEZpbGVuYW1lID0gYCR7JC5VdGlscy5kYXRhRGlyfS9zaGFwZWZpbGUvY2hpbmEtcHJvdmluY2UtZ3BzL2dwcy5zaHBgO1xuICBjb25zdCBkYmZGaWxlbmFtZSA9IGAkeyQuVXRpbHMuZGF0YURpcn0vc2hhcGVmaWxlL2NoaW5hLXByb3ZpbmNlLWdwcy9ncHMuZGJmYDtcbiAgY29uc3QgcGdUYWJsZU5hbWUgPSAnZ3BzLm1mdyc7XG4gIGNvbnN0IGxpbmVSZXNvbHZlID0gYXN5bmMgKHJlc3VsdCkgPT4ge1xuICAgIGNvbnN0IHByb3BlcnRpZXMgPSByZXN1bHQudmFsdWUucHJvcGVydGllcztcbiAgICBjb25zdCBnZW9tZXRyeSA9IFdLVC5jb252ZXJ0KHJlc3VsdC52YWx1ZS5nZW9tZXRyeSk7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTsgLy8g6K6h5pe2XG4gICAgY29uc3Qgc3FsID0gYGluc2VydCBpbnRvICR7cGdUYWJsZU5hbWV9IChpZCwgcGFyZW50X2lkLCBsZXZlbCwgaXNvLCB6aF9uYW1lLCBlbl9uYW1lLCBnZW9tLCByZWdpb25faWQsIG1kZF9pZCwga2V5KVxuICAgIHZhbHVlcyAoXG4gICAgICAkMTo6YmlnaW50LCAkMjo6YmlnaW50LCAkMzo6aW50ZWdlciwgJDQ6OnZhcmNoYXIsXG4gICAgICAkNTo6dmFyY2hhciwgJDY6OnZhcmNoYXIsIFNUX011bHRpKFNUX0dlb21Gcm9tVGV4dCgkNywgNDMyNikpOjpnZW9tZXRyeSwgXG4gICAgICAkODo6YmlnaW50LCAkOTo6YmlnaW50LCAkMTA6OnZhcmNoYXJcbiAgICApXG4gICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGVcbiAgICBzZXQgcGFyZW50X2lkID0gZXhjbHVkZWQucGFyZW50X2lkLCBsZXZlbCA9IGV4Y2x1ZGVkLmxldmVsLCBpc28gPSBleGNsdWRlZC5pc28sIFxuICAgIHpoX25hbWUgPSBleGNsdWRlZC56aF9uYW1lLCBlbl9uYW1lID0gZXhjbHVkZWQuZW5fbmFtZSwgZ2VvbSA9IGV4Y2x1ZGVkLmdlb21gO1xuICAgIGNvbnN0IHBhcmFtcyA9IFtcbiAgICAgIHByb3BlcnRpZXNbJ2lkJ10sIHByb3BlcnRpZXNbJ3BhcmVudF9pZCddLCBwcm9wZXJ0aWVzWydsZXZlbCddLCBwcm9wZXJ0aWVzWydpc28nXSxcbiAgICAgIHByb3BlcnRpZXNbJ3poX25hbWUnXSwgcHJvcGVydGllc1snZW5fbmFtZSddLCBnZW9tZXRyeSwgcHJvcGVydGllc1sncmVnaW9uX2lkJ10sXG4gICAgICBwcm9wZXJ0aWVzWydtZGRfaWQnXSwgcHJvcGVydGllc1sna2V5J11dO1xuXG4gICAgLy8gY29uc29sZS5sb2cocHJvcGVydGllcyk7XG4gICAgYXdhaXQgcGcucXVlcnkoc3FsLCBwYXJhbXMpXG4gICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKHNxbCk7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9KVxuICAgIDtcbiAgICBjb25zdCBlbmRUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICBjb25zdCBjb3N0VGltZSA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG4gICAgYXdhaXQgJC5VdGlscy5sb2coYCR7cGdUYWJsZU5hbWV9IyR7cHJvcGVydGllc1snaWQnXX0gY29zdCAuLi4gJHtjb3N0VGltZSAvIDEwMDB9IHNgKTtcbiAgfTtcbiAgYXdhaXQgJC5TaGFwZUZpbGUucmVhZExpbmUoc2hwRmlsZW5hbWUsIGRiZkZpbGVuYW1lLCBsaW5lUmVzb2x2ZSk7XG5cbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=