'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/tmp-china-province/china-province.shp`;
  await _modules.default.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from amap.china where id > 10 and id < 50', 'geom');
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMS1hbWFwLzAyLWV4cG9ydC1wcm92aW5jZS5qcyJdLCJuYW1lcyI6WyJzaHBGaWxlbmFtZSIsIiQiLCJVdGlscyIsImRhdGFEaXIiLCJQZ1NRTCIsImdldFBvc3RHaXMiLCJleHBvcnRTaGFwZUZpbGUiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBOzs7O0FBRUEsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsV0FBVyxHQUFJLEdBQUVDLGlCQUFFQyxLQUFGLENBQVFDLE9BQVEsa0RBQXZDO0FBQ0EsUUFBTUYsaUJBQUVHLEtBQUYsQ0FBUUMsVUFBUixHQUFxQkMsZUFBckIsQ0FBcUNOLFdBQXJDLEVBQWtELFdBQWxELEVBQStELG9EQUEvRCxFQUFxSCxNQUFySCxDQUFOO0FBQ0QsQ0FIRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJ1xuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBzaHBGaWxlbmFtZSA9IGAkeyQuVXRpbHMuZGF0YURpcn0vc2hhcGVmaWxlL3RtcC1jaGluYS1wcm92aW5jZS9jaGluYS1wcm92aW5jZS5zaHBgO1xuICBhd2FpdCAkLlBnU1FMLmdldFBvc3RHaXMoKS5leHBvcnRTaGFwZUZpbGUoc2hwRmlsZW5hbWUsICdsb2NhbGhvc3QnLCAnc2VsZWN0ICogZnJvbSBhbWFwLmNoaW5hIHdoZXJlIGlkID4gMTAgYW5kIGlkIDwgNTAnLCAnZ2VvbScpO1xufSkoKTsiXX0=