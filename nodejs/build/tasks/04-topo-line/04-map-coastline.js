'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibTopoLine = _interopRequireDefault(require("./LibTopoLine"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const topologyName = 'line_topo';
  const dumpTable = 'line_dump';
  const topoTable = 'line_topo';
  const schema = 'topo';
  const topology = new _LibTopoLine.default(topologyName, dumpTable, topoTable, schema);
  await _modules.default.Utils.call(`外国 海岸边界线`, async () => {
    const startId = 900032;
    const pgp = await _modules.default.PgSQL.pool('localhost');
    const list = await _LibTopoLine.default.getForeignList(pgp);

    for await (const item of list) {
      const id = +item['id'];
      const name = item['name'];

      if (id < startId) {
        continue;
      }

      await _modules.default.Utils.call(`${name}#${id} 海岸边界线`, topology.mapCoastline.bind(topology), [pgp, id]);
    }
  });
  await _modules.default.Utils.call(`中国 海岸边界线`, async () => {
    const pg = await _modules.default.PgSQL.client('localhost');
    const id = 1;
    const name = '中国';
    await _modules.default.Utils.call(`${name}#${id} 海岸边界线`, topology.mapCoastline.bind(topology), [pg, id]);
    await pg.release();
  });
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC10b3BvLWxpbmUvMDQtbWFwLWNvYXN0bGluZS5qcyJdLCJuYW1lcyI6WyJ0b3BvbG9neU5hbWUiLCJkdW1wVGFibGUiLCJ0b3BvVGFibGUiLCJzY2hlbWEiLCJ0b3BvbG9neSIsIkxpYlRvcG9MaW5lIiwiJCIsIlV0aWxzIiwiY2FsbCIsInN0YXJ0SWQiLCJwZ3AiLCJQZ1NRTCIsInBvb2wiLCJsaXN0IiwiZ2V0Rm9yZWlnbkxpc3QiLCJpdGVtIiwiaWQiLCJuYW1lIiwibWFwQ29hc3RsaW5lIiwiYmluZCIsInBnIiwiY2xpZW50IiwicmVsZWFzZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBR0E7O0FBRUE7Ozs7QUFHQSxDQUFDLFlBQVk7QUFFWCxRQUFNQSxZQUFZLEdBQUcsV0FBckI7QUFDQSxRQUFNQyxTQUFTLEdBQUcsV0FBbEI7QUFDQSxRQUFNQyxTQUFTLEdBQUcsV0FBbEI7QUFDQSxRQUFNQyxNQUFNLEdBQUcsTUFBZjtBQUNBLFFBQU1DLFFBQVEsR0FBRyxJQUFJQyxvQkFBSixDQUFnQkwsWUFBaEIsRUFBOEJDLFNBQTlCLEVBQXlDQyxTQUF6QyxFQUFvREMsTUFBcEQsQ0FBakI7QUFFQSxRQUFNRyxpQkFBRUMsS0FBRixDQUFRQyxJQUFSLENBQWMsVUFBZCxFQUF5QixZQUFZO0FBQ3pDLFVBQU1DLE9BQU8sR0FBRyxNQUFoQjtBQUVBLFVBQU1DLEdBQUcsR0FBRyxNQUFNSixpQkFBRUssS0FBRixDQUFRQyxJQUFSLENBQWEsV0FBYixDQUFsQjtBQUNBLFVBQU1DLElBQUksR0FBRyxNQUFNUixxQkFBWVMsY0FBWixDQUEyQkosR0FBM0IsQ0FBbkI7O0FBQ0EsZUFBVyxNQUFNSyxJQUFqQixJQUF5QkYsSUFBekIsRUFBK0I7QUFDN0IsWUFBTUcsRUFBRSxHQUFHLENBQUNELElBQUksQ0FBQyxJQUFELENBQWhCO0FBQ0EsWUFBTUUsSUFBSSxHQUFHRixJQUFJLENBQUMsTUFBRCxDQUFqQjs7QUFDQSxVQUFJQyxFQUFFLEdBQUdQLE9BQVQsRUFBa0I7QUFDaEI7QUFDRDs7QUFFRCxZQUFNSCxpQkFBRUMsS0FBRixDQUFRQyxJQUFSLENBQWMsR0FBRVMsSUFBSyxJQUFHRCxFQUFHLFFBQTNCLEVBQW9DWixRQUFRLENBQUNjLFlBQVQsQ0FBc0JDLElBQXRCLENBQTJCZixRQUEzQixDQUFwQyxFQUEwRSxDQUFDTSxHQUFELEVBQU1NLEVBQU4sQ0FBMUUsQ0FBTjtBQUNEO0FBRUYsR0FmSyxDQUFOO0FBaUJBLFFBQU1WLGlCQUFFQyxLQUFGLENBQVFDLElBQVIsQ0FBYyxVQUFkLEVBQXlCLFlBQVk7QUFDekMsVUFBTVksRUFBRSxHQUFHLE1BQU1kLGlCQUFFSyxLQUFGLENBQVFVLE1BQVIsQ0FBZSxXQUFmLENBQWpCO0FBQ0EsVUFBTUwsRUFBRSxHQUFHLENBQVg7QUFDQSxVQUFNQyxJQUFJLEdBQUcsSUFBYjtBQUNBLFVBQU1YLGlCQUFFQyxLQUFGLENBQVFDLElBQVIsQ0FBYyxHQUFFUyxJQUFLLElBQUdELEVBQUcsUUFBM0IsRUFBb0NaLFFBQVEsQ0FBQ2MsWUFBVCxDQUFzQkMsSUFBdEIsQ0FBMkJmLFFBQTNCLENBQXBDLEVBQTBFLENBQUNnQixFQUFELEVBQUtKLEVBQUwsQ0FBMUUsQ0FBTjtBQUNBLFVBQU1JLEVBQUUsQ0FBQ0UsT0FBSCxFQUFOO0FBQ0QsR0FOSyxDQUFOO0FBU0QsQ0FsQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuaW1wb3J0IExpYlRvcG9MaW5lIGZyb20gJy4vTGliVG9wb0xpbmUnO1xuXG5cbihhc3luYyAoKSA9PiB7XG5cbiAgY29uc3QgdG9wb2xvZ3lOYW1lID0gJ2xpbmVfdG9wbyc7XG4gIGNvbnN0IGR1bXBUYWJsZSA9ICdsaW5lX2R1bXAnO1xuICBjb25zdCB0b3BvVGFibGUgPSAnbGluZV90b3BvJztcbiAgY29uc3Qgc2NoZW1hID0gJ3RvcG8nO1xuICBjb25zdCB0b3BvbG9neSA9IG5ldyBMaWJUb3BvTGluZSh0b3BvbG9neU5hbWUsIGR1bXBUYWJsZSwgdG9wb1RhYmxlLCBzY2hlbWEpO1xuXG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg5aSW5Zu9IOa1t+WyuOi+ueeVjOe6v2AsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBzdGFydElkID0gOTAwMDMyO1xuXG4gICAgY29uc3QgcGdwID0gYXdhaXQgJC5QZ1NRTC5wb29sKCdsb2NhbGhvc3QnKTtcbiAgICBjb25zdCBsaXN0ID0gYXdhaXQgTGliVG9wb0xpbmUuZ2V0Rm9yZWlnbkxpc3QocGdwKTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgbGlzdCkge1xuICAgICAgY29uc3QgaWQgPSAraXRlbVsnaWQnXTtcbiAgICAgIGNvbnN0IG5hbWUgPSBpdGVtWyduYW1lJ107XG4gICAgICBpZiAoaWQgPCBzdGFydElkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCAkLlV0aWxzLmNhbGwoYCR7bmFtZX0jJHtpZH0g5rW35bK46L6555WM57q/YCwgdG9wb2xvZ3kubWFwQ29hc3RsaW5lLmJpbmQodG9wb2xvZ3kpLCBbcGdwLCBpZF0pO1xuICAgIH1cblxuICB9KTtcblxuICBhd2FpdCAkLlV0aWxzLmNhbGwoYOS4reWbvSDmtbflsrjovrnnlYznur9gLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLmNsaWVudCgnbG9jYWxob3N0Jyk7XG4gICAgY29uc3QgaWQgPSAxO1xuICAgIGNvbnN0IG5hbWUgPSAn5Lit5Zu9JztcbiAgICBhd2FpdCAkLlV0aWxzLmNhbGwoYCR7bmFtZX0jJHtpZH0g5rW35bK46L6555WM57q/YCwgdG9wb2xvZ3kubWFwQ29hc3RsaW5lLmJpbmQodG9wb2xvZ3kpLCBbcGcsIGlkXSk7XG4gICAgYXdhaXQgcGcucmVsZWFzZSgpO1xuICB9KTtcblxuXG59KSgpOyJdfQ==