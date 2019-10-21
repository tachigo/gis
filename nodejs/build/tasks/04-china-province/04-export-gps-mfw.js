'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/tmp-china-province/gps.shp`;
  await _modules.default.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from gps.mfw where id > 10 and id < 50', 'geom');
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC1jaGluYS1wcm92aW5jZS8wNC1leHBvcnQtZ3BzLW1mdy5qcyJdLCJuYW1lcyI6WyJzaHBGaWxlbmFtZSIsIiQiLCJVdGlscyIsImRhdGFEaXIiLCJQZ1NRTCIsImdldFBvc3RHaXMiLCJleHBvcnRTaGFwZUZpbGUiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBOzs7O0FBRUEsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsV0FBVyxHQUFJLEdBQUVDLGlCQUFFQyxLQUFGLENBQVFDLE9BQVEsdUNBQXZDO0FBQ0EsUUFBTUYsaUJBQUVHLEtBQUYsQ0FBUUMsVUFBUixHQUFxQkMsZUFBckIsQ0FBcUNOLFdBQXJDLEVBQWtELFdBQWxELEVBQStELGlEQUEvRCxFQUFrSCxNQUFsSCxDQUFOO0FBQ0QsQ0FIRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3Qgc2hwRmlsZW5hbWUgPSBgJHskLlV0aWxzLmRhdGFEaXJ9L3NoYXBlZmlsZS90bXAtY2hpbmEtcHJvdmluY2UvZ3BzLnNocGA7XG4gIGF3YWl0ICQuUGdTUUwuZ2V0UG9zdEdpcygpLmV4cG9ydFNoYXBlRmlsZShzaHBGaWxlbmFtZSwgJ2xvY2FsaG9zdCcsICdzZWxlY3QgKiBmcm9tIGdwcy5tZncgd2hlcmUgaWQgPiAxMCBhbmQgaWQgPCA1MCcsICdnZW9tJyk7XG59KSgpOyJdfQ==