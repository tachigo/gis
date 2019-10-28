'use strict';

var _modules = _interopRequireDefault(require("./../../../modules"));

var _Strategy = _interopRequireDefault(require("./../Strategy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const strategy = await new _Strategy.default(2, pg);
  await _modules.default.Utils.call(`初始化关系`, async () => {
    await strategy.initTopo2DumpRelation();
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvbHYwMi8wNy10b3BvMmR1bXAtaW5pdC5qcyJdLCJuYW1lcyI6WyJwZyIsIiQiLCJQZ1NRTCIsImNsaWVudCIsInN0cmF0ZWd5IiwiU3RyYXRlZ3kiLCJVdGlscyIsImNhbGwiLCJpbml0VG9wbzJEdW1wUmVsYXRpb24iLCJyZWxlYXNlIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFHQTs7QUFFQTs7OztBQUdBLENBQUMsWUFBWTtBQUNYLFFBQU1BLEVBQUUsR0FBRyxNQUFNQyxpQkFBRUMsS0FBRixDQUFRQyxNQUFSLENBQWUsV0FBZixDQUFqQjtBQUVBLFFBQU1DLFFBQVEsR0FBRyxNQUFNLElBQUlDLGlCQUFKLENBQWEsQ0FBYixFQUFnQkwsRUFBaEIsQ0FBdkI7QUFFQSxRQUFNQyxpQkFBRUssS0FBRixDQUFRQyxJQUFSLENBQWMsT0FBZCxFQUFzQixZQUFZO0FBQ3RDLFVBQU1ILFFBQVEsQ0FBQ0kscUJBQVQsRUFBTjtBQUNELEdBRkssQ0FBTjtBQUlBLFFBQU1SLEVBQUUsQ0FBQ1MsT0FBSCxFQUFOO0FBQ0QsQ0FWRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuXG5pbXBvcnQgJCBmcm9tICcuLy4uLy4uLy4uL21vZHVsZXMnO1xuXG5pbXBvcnQgU3RyYXRlZ3kgZnJvbSAnLi8uLi9TdHJhdGVneSc7XG5cblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLmNsaWVudCgnbG9jYWxob3N0Jyk7XG5cbiAgY29uc3Qgc3RyYXRlZ3kgPSBhd2FpdCBuZXcgU3RyYXRlZ3koMiwgcGcpO1xuXG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg5Yid5aeL5YyW5YWz57O7YCwgYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IHN0cmF0ZWd5LmluaXRUb3BvMkR1bXBSZWxhdGlvbigpO1xuICB9KTtcblxuICBhd2FpdCBwZy5yZWxlYXNlKCk7XG59KSgpOyJdfQ==