'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibTopoBoundary = _interopRequireDefault(require("./LibTopoBoundary"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = _modules.default.PgSQL.pool('localhost');

  await _modules.default.Utils.call(`初始化 topo.boundary`, async () => {
    await _LibTopoBoundary.default.init(pg);
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNS10b3BvLWJvdW5kYXJ5LzAwLWluaXQuanMiXSwibmFtZXMiOlsicGciLCIkIiwiUGdTUUwiLCJwb29sIiwiVXRpbHMiLCJjYWxsIiwiTGliVG9wb0JvdW5kYXJ5IiwiaW5pdCIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOztBQUVBOzs7O0FBRUEsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHQyxpQkFBRUMsS0FBRixDQUFRQyxJQUFSLENBQWEsV0FBYixDQUFYOztBQUVBLFFBQU1GLGlCQUFFRyxLQUFGLENBQVFDLElBQVIsQ0FBYyxtQkFBZCxFQUFrQyxZQUFZO0FBQ2xELFVBQU1DLHlCQUFnQkMsSUFBaEIsQ0FBcUJQLEVBQXJCLENBQU47QUFDRCxHQUZLLENBQU47QUFJQSxRQUFNQSxFQUFFLENBQUNRLE9BQUgsRUFBTjtBQUNELENBUkQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuaW1wb3J0IExpYlRvcG9Cb3VuZGFyeSBmcm9tICcuL0xpYlRvcG9Cb3VuZGFyeSc7XG5cbihhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHBnID0gJC5QZ1NRTC5wb29sKCdsb2NhbGhvc3QnKTtcblxuICBhd2FpdCAkLlV0aWxzLmNhbGwoYOWIneWni+WMliB0b3BvLmJvdW5kYXJ5YCwgYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0IExpYlRvcG9Cb3VuZGFyeS5pbml0KHBnKTtcbiAgfSk7XG5cbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=