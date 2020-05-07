'use strict';

var _modules = _interopRequireDefault(require("./../../../modules"));

var _Strategy = _interopRequireDefault(require("./../Strategy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const strategy = await new _Strategy.default(1, pg);
  await _modules.default.Utils.call(`计算拓扑边`, async () => {
    await strategy.calcEdges(4096);
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvbHYwMS8wMy10b3BvLWVkZ2UuanMiXSwibmFtZXMiOlsicGciLCIkIiwiUGdTUUwiLCJjbGllbnQiLCJzdHJhdGVneSIsIlN0cmF0ZWd5IiwiVXRpbHMiLCJjYWxsIiwiY2FsY0VkZ2VzIiwicmVsZWFzZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBR0E7O0FBRUE7Ozs7QUFHQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxFQUFFLEdBQUcsTUFBTUMsaUJBQUVDLEtBQUYsQ0FBUUMsTUFBUixDQUFlLFdBQWYsQ0FBakI7QUFFQSxRQUFNQyxRQUFRLEdBQUcsTUFBTSxJQUFJQyxpQkFBSixDQUFhLENBQWIsRUFBZ0JMLEVBQWhCLENBQXZCO0FBRUEsUUFBTUMsaUJBQUVLLEtBQUYsQ0FBUUMsSUFBUixDQUFjLE9BQWQsRUFBc0IsWUFBWTtBQUN0QyxVQUFNSCxRQUFRLENBQUNJLFNBQVQsQ0FBbUIsSUFBbkIsQ0FBTjtBQUNELEdBRkssQ0FBTjtBQUlBLFFBQU1SLEVBQUUsQ0FBQ1MsT0FBSCxFQUFOO0FBQ0QsQ0FWRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuXG5pbXBvcnQgJCBmcm9tICcuLy4uLy4uLy4uL21vZHVsZXMnO1xuXG5pbXBvcnQgU3RyYXRlZ3kgZnJvbSAnLi8uLi9TdHJhdGVneSc7XG5cblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLmNsaWVudCgnbG9jYWxob3N0Jyk7XG5cbiAgY29uc3Qgc3RyYXRlZ3kgPSBhd2FpdCBuZXcgU3RyYXRlZ3koMSwgcGcpO1xuXG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg6K6h566X5ouT5omR6L65YCwgYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IHN0cmF0ZWd5LmNhbGNFZGdlcyg0MDk2KTtcbiAgfSk7XG5cbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=