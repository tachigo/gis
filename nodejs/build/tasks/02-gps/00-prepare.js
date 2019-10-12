'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibPrepare = _interopRequireDefault(require("./LibPrepare"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.pool('localhost');
  await _modules.default.Utils.call(`准备数据`, async () => {
    // osm -> world
    // amap -> world
    await _modules.default.Utils.call(`清理数据`, _LibPrepare.default.clearData, [pg]);
    await _modules.default.Utils.call(`导入OSM数据`, _LibPrepare.default.importOSM, [pg]);
    await _modules.default.Utils.call(`导入AMap数据`, _LibPrepare.default.importAMap, [pg]);
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMi1ncHMvMDAtcHJlcGFyZS5qcyJdLCJuYW1lcyI6WyJwZyIsIiQiLCJQZ1NRTCIsInBvb2wiLCJVdGlscyIsImNhbGwiLCJMaWJQcmVwYXJlIiwiY2xlYXJEYXRhIiwiaW1wb3J0T1NNIiwiaW1wb3J0QU1hcCIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOztBQUVBOzs7O0FBR0EsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHLE1BQU1DLGlCQUFFQyxLQUFGLENBQVFDLElBQVIsQ0FBYSxXQUFiLENBQWpCO0FBQ0EsUUFBTUYsaUJBQUVHLEtBQUYsQ0FBUUMsSUFBUixDQUFjLE1BQWQsRUFBcUIsWUFBWTtBQUNyQztBQUNBO0FBQ0EsVUFBTUosaUJBQUVHLEtBQUYsQ0FBUUMsSUFBUixDQUFjLE1BQWQsRUFBcUJDLG9CQUFXQyxTQUFoQyxFQUEyQyxDQUFDUCxFQUFELENBQTNDLENBQU47QUFDQSxVQUFNQyxpQkFBRUcsS0FBRixDQUFRQyxJQUFSLENBQWMsU0FBZCxFQUF3QkMsb0JBQVdFLFNBQW5DLEVBQThDLENBQUNSLEVBQUQsQ0FBOUMsQ0FBTjtBQUNBLFVBQU1DLGlCQUFFRyxLQUFGLENBQVFDLElBQVIsQ0FBYyxVQUFkLEVBQXlCQyxvQkFBV0csVUFBcEMsRUFBZ0QsQ0FBQ1QsRUFBRCxDQUFoRCxDQUFOO0FBQ0QsR0FOSyxDQUFOO0FBT0EsUUFBTUEsRUFBRSxDQUFDVSxPQUFILEVBQU47QUFDRCxDQVZEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5cbmltcG9ydCAkIGZyb20gJy4vLi4vLi4vbW9kdWxlcyc7XG5cbmltcG9ydCBMaWJQcmVwYXJlIGZyb20gJy4vTGliUHJlcGFyZSc7XG5cblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLnBvb2woJ2xvY2FsaG9zdCcpO1xuICBhd2FpdCAkLlV0aWxzLmNhbGwoYOWHhuWkh+aVsOaNrmAsIGFzeW5jICgpID0+IHtcbiAgICAvLyBvc20gLT4gd29ybGRcbiAgICAvLyBhbWFwIC0+IHdvcmxkXG4gICAgYXdhaXQgJC5VdGlscy5jYWxsKGDmuIXnkIbmlbDmja5gLCBMaWJQcmVwYXJlLmNsZWFyRGF0YSwgW3BnXSk7XG4gICAgYXdhaXQgJC5VdGlscy5jYWxsKGDlr7zlhaVPU03mlbDmja5gLCBMaWJQcmVwYXJlLmltcG9ydE9TTSwgW3BnXSk7XG4gICAgYXdhaXQgJC5VdGlscy5jYWxsKGDlr7zlhaVBTWFw5pWw5o2uYCwgTGliUHJlcGFyZS5pbXBvcnRBTWFwLCBbcGddKTtcbiAgfSk7XG4gIGF3YWl0IHBnLnJlbGVhc2UoKTtcbn0pKCk7Il19