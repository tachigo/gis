'use strict';

var _modules = _interopRequireDefault(require("./../../../modules"));

var _Strategy = _interopRequireDefault(require("./../Strategy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const strategy = await new _Strategy.default(1, pg);
  await _modules.default.Utils.call(`拟合修复 topo2dump 关系`, async () => {
    await strategy.fixCalcTopoo2DumpRelation();
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvbHYwMS8wNi1maXgtdG9wbzJkdW1wLmpzIl0sIm5hbWVzIjpbInBnIiwiJCIsIlBnU1FMIiwiY2xpZW50Iiwic3RyYXRlZ3kiLCJTdHJhdGVneSIsIlV0aWxzIiwiY2FsbCIsImZpeENhbGNUb3BvbzJEdW1wUmVsYXRpb24iLCJyZWxlYXNlIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFHQTs7QUFFQTs7OztBQUdBLENBQUMsWUFBWTtBQUNYLFFBQU1BLEVBQUUsR0FBRyxNQUFNQyxpQkFBRUMsS0FBRixDQUFRQyxNQUFSLENBQWUsV0FBZixDQUFqQjtBQUVBLFFBQU1DLFFBQVEsR0FBRyxNQUFNLElBQUlDLGlCQUFKLENBQWEsQ0FBYixFQUFnQkwsRUFBaEIsQ0FBdkI7QUFFQSxRQUFNQyxpQkFBRUssS0FBRixDQUFRQyxJQUFSLENBQWMsbUJBQWQsRUFBa0MsWUFBWTtBQUNsRCxVQUFNSCxRQUFRLENBQUNJLHlCQUFULEVBQU47QUFDRCxHQUZLLENBQU47QUFJQSxRQUFNUixFQUFFLENBQUNTLE9BQUgsRUFBTjtBQUNELENBVkQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi8uLi9tb2R1bGVzJztcblxuaW1wb3J0IFN0cmF0ZWd5IGZyb20gJy4vLi4vU3RyYXRlZ3knO1xuXG5cbihhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHBnID0gYXdhaXQgJC5QZ1NRTC5jbGllbnQoJ2xvY2FsaG9zdCcpO1xuXG4gIGNvbnN0IHN0cmF0ZWd5ID0gYXdhaXQgbmV3IFN0cmF0ZWd5KDEsIHBnKTtcblxuICBhd2FpdCAkLlV0aWxzLmNhbGwoYOaLn+WQiOS/ruWkjSB0b3BvMmR1bXAg5YWz57O7YCwgYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IHN0cmF0ZWd5LmZpeENhbGNUb3BvbzJEdW1wUmVsYXRpb24oKTtcbiAgfSk7XG5cbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=