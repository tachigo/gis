'use strict';

var _modules = _interopRequireDefault(require("./../../../modules"));

var _Strategy = _interopRequireDefault(require("./../Strategy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const strategy = await new _Strategy.default(2, pg);
  await _modules.default.Utils.call(`拟合修复 dump2topo 关系`, async () => {
    await strategy.fixCalcDump2TopoRelation();
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvbHYwMi8wNy1maXgtZHVtcDJ0b3BvLmpzIl0sIm5hbWVzIjpbInBnIiwiJCIsIlBnU1FMIiwiY2xpZW50Iiwic3RyYXRlZ3kiLCJTdHJhdGVneSIsIlV0aWxzIiwiY2FsbCIsImZpeENhbGNEdW1wMlRvcG9SZWxhdGlvbiIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOztBQUVBOzs7O0FBR0EsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHLE1BQU1DLGlCQUFFQyxLQUFGLENBQVFDLE1BQVIsQ0FBZSxXQUFmLENBQWpCO0FBRUEsUUFBTUMsUUFBUSxHQUFHLE1BQU0sSUFBSUMsaUJBQUosQ0FBYSxDQUFiLEVBQWdCTCxFQUFoQixDQUF2QjtBQUVBLFFBQU1DLGlCQUFFSyxLQUFGLENBQVFDLElBQVIsQ0FBYyxtQkFBZCxFQUFrQyxZQUFZO0FBQ2xELFVBQU1ILFFBQVEsQ0FBQ0ksd0JBQVQsRUFBTjtBQUNELEdBRkssQ0FBTjtBQUlBLFFBQU1SLEVBQUUsQ0FBQ1MsT0FBSCxFQUFOO0FBQ0QsQ0FWRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuXG5pbXBvcnQgJCBmcm9tICcuLy4uLy4uLy4uL21vZHVsZXMnO1xuXG5pbXBvcnQgU3RyYXRlZ3kgZnJvbSAnLi8uLi9TdHJhdGVneSc7XG5cblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLmNsaWVudCgnbG9jYWxob3N0Jyk7XG5cbiAgY29uc3Qgc3RyYXRlZ3kgPSBhd2FpdCBuZXcgU3RyYXRlZ3koMiwgcGcpO1xuXG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg5ouf5ZCI5L+u5aSNIGR1bXAydG9wbyDlhbPns7tgLCBhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgc3RyYXRlZ3kuZml4Q2FsY0R1bXAyVG9wb1JlbGF0aW9uKCk7XG4gIH0pO1xuXG4gIGF3YWl0IHBnLnJlbGVhc2UoKTtcbn0pKCk7Il19