'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibPrepare = _interopRequireDefault(require("./LibPrepare"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  await _modules.default.Utils.call(`准备数据`, async () => {
    // osm -> world
    // amap -> world
    await _modules.default.Utils.call(`清理数据`, _LibPrepare.default.clearData, [pg]);
    await _modules.default.Utils.call(`导入OSM数据`, _LibPrepare.default.importOSM, [pg]);
    await _modules.default.Utils.call(`导入AMap数据`, _LibPrepare.default.importAMap, [pg]);
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMi1ncHMvMDAtcHJlcGFyZS5qcyJdLCJuYW1lcyI6WyJwZyIsIiQiLCJQZ1NRTCIsImNsaWVudCIsIlV0aWxzIiwiY2FsbCIsIkxpYlByZXBhcmUiLCJjbGVhckRhdGEiLCJpbXBvcnRPU00iLCJpbXBvcnRBTWFwIiwicmVsZWFzZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBR0E7O0FBRUE7Ozs7QUFHQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxFQUFFLEdBQUcsTUFBTUMsaUJBQUVDLEtBQUYsQ0FBUUMsTUFBUixDQUFlLFdBQWYsQ0FBakI7QUFDQSxRQUFNRixpQkFBRUcsS0FBRixDQUFRQyxJQUFSLENBQWMsTUFBZCxFQUFxQixZQUFZO0FBQ3JDO0FBQ0E7QUFDQSxVQUFNSixpQkFBRUcsS0FBRixDQUFRQyxJQUFSLENBQWMsTUFBZCxFQUFxQkMsb0JBQVdDLFNBQWhDLEVBQTJDLENBQUNQLEVBQUQsQ0FBM0MsQ0FBTjtBQUNBLFVBQU1DLGlCQUFFRyxLQUFGLENBQVFDLElBQVIsQ0FBYyxTQUFkLEVBQXdCQyxvQkFBV0UsU0FBbkMsRUFBOEMsQ0FBQ1IsRUFBRCxDQUE5QyxDQUFOO0FBQ0EsVUFBTUMsaUJBQUVHLEtBQUYsQ0FBUUMsSUFBUixDQUFjLFVBQWQsRUFBeUJDLG9CQUFXRyxVQUFwQyxFQUFnRCxDQUFDVCxFQUFELENBQWhELENBQU47QUFDRCxHQU5LLENBQU47QUFPQSxRQUFNQSxFQUFFLENBQUNVLE9BQUgsRUFBTjtBQUNELENBVkQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuaW1wb3J0IExpYlByZXBhcmUgZnJvbSAnLi9MaWJQcmVwYXJlJztcblxuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBwZyA9IGF3YWl0ICQuUGdTUUwuY2xpZW50KCdsb2NhbGhvc3QnKTtcbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDlh4blpIfmlbDmja5gLCBhc3luYyAoKSA9PiB7XG4gICAgLy8gb3NtIC0+IHdvcmxkXG4gICAgLy8gYW1hcCAtPiB3b3JsZFxuICAgIGF3YWl0ICQuVXRpbHMuY2FsbChg5riF55CG5pWw5o2uYCwgTGliUHJlcGFyZS5jbGVhckRhdGEsIFtwZ10pO1xuICAgIGF3YWl0ICQuVXRpbHMuY2FsbChg5a+85YWlT1NN5pWw5o2uYCwgTGliUHJlcGFyZS5pbXBvcnRPU00sIFtwZ10pO1xuICAgIGF3YWl0ICQuVXRpbHMuY2FsbChg5a+85YWlQU1hcOaVsOaNrmAsIExpYlByZXBhcmUuaW1wb3J0QU1hcCwgW3BnXSk7XG4gIH0pO1xuICBhd2FpdCBwZy5yZWxlYXNlKCk7XG59KSgpOyJdfQ==