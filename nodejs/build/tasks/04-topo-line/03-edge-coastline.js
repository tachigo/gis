'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibTopology = _interopRequireDefault(require("./LibTopology"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.pool('localhost');
  const topologyName = 'line_topo';
  const topology = new _LibTopology.default(topologyName);
  await _modules.default.Utils.call(`外国 海岸边界线`, async () => {
    const list = await _LibTopology.default.getForeignList(pg);

    for await (const item of list) {
      const id = +item['id'];
      const name = item['name'];
      await _modules.default.Utils.call(`${name}#${id} 海岸边界线`, topology.edgeCoastline.bind(topology), [pg, id]);
    }
  });
  await _modules.default.Utils.call(`中国 海岸边界线`, async () => {
    const id = 1;
    const name = '中国';
    await _modules.default.Utils.call(`${name}#${id} 海岸边界线`, topology.edgeCoastline.bind(topology), [pg, id]);
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC10b3BvLWxpbmUvMDMtZWRnZS1jb2FzdGxpbmUuanMiXSwibmFtZXMiOlsicGciLCIkIiwiUGdTUUwiLCJwb29sIiwidG9wb2xvZ3lOYW1lIiwidG9wb2xvZ3kiLCJMaWJUb3BvbG9neSIsIlV0aWxzIiwiY2FsbCIsImxpc3QiLCJnZXRGb3JlaWduTGlzdCIsIml0ZW0iLCJpZCIsIm5hbWUiLCJlZGdlQ29hc3RsaW5lIiwiYmluZCIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOztBQUVBOzs7O0FBR0EsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHLE1BQU1DLGlCQUFFQyxLQUFGLENBQVFDLElBQVIsQ0FBYSxXQUFiLENBQWpCO0FBQ0EsUUFBTUMsWUFBWSxHQUFHLFdBQXJCO0FBQ0EsUUFBTUMsUUFBUSxHQUFHLElBQUlDLG9CQUFKLENBQWdCRixZQUFoQixDQUFqQjtBQUVBLFFBQU1ILGlCQUFFTSxLQUFGLENBQVFDLElBQVIsQ0FBYyxVQUFkLEVBQXlCLFlBQVk7QUFDekMsVUFBTUMsSUFBSSxHQUFHLE1BQU1ILHFCQUFZSSxjQUFaLENBQTJCVixFQUEzQixDQUFuQjs7QUFDQSxlQUFXLE1BQU1XLElBQWpCLElBQXlCRixJQUF6QixFQUErQjtBQUM3QixZQUFNRyxFQUFFLEdBQUcsQ0FBQ0QsSUFBSSxDQUFDLElBQUQsQ0FBaEI7QUFDQSxZQUFNRSxJQUFJLEdBQUdGLElBQUksQ0FBQyxNQUFELENBQWpCO0FBQ0EsWUFBTVYsaUJBQUVNLEtBQUYsQ0FBUUMsSUFBUixDQUFjLEdBQUVLLElBQUssSUFBR0QsRUFBRyxRQUEzQixFQUFvQ1AsUUFBUSxDQUFDUyxhQUFULENBQXVCQyxJQUF2QixDQUE0QlYsUUFBNUIsQ0FBcEMsRUFBMkUsQ0FBQ0wsRUFBRCxFQUFLWSxFQUFMLENBQTNFLENBQU47QUFDRDtBQUNGLEdBUEssQ0FBTjtBQVNBLFFBQU1YLGlCQUFFTSxLQUFGLENBQVFDLElBQVIsQ0FBYyxVQUFkLEVBQXlCLFlBQVk7QUFDekMsVUFBTUksRUFBRSxHQUFHLENBQVg7QUFDQSxVQUFNQyxJQUFJLEdBQUcsSUFBYjtBQUNBLFVBQU1aLGlCQUFFTSxLQUFGLENBQVFDLElBQVIsQ0FBYyxHQUFFSyxJQUFLLElBQUdELEVBQUcsUUFBM0IsRUFBb0NQLFFBQVEsQ0FBQ1MsYUFBVCxDQUF1QkMsSUFBdkIsQ0FBNEJWLFFBQTVCLENBQXBDLEVBQTJFLENBQUNMLEVBQUQsRUFBS1ksRUFBTCxDQUEzRSxDQUFOO0FBQ0QsR0FKSyxDQUFOO0FBT0EsUUFBTVosRUFBRSxDQUFDZ0IsT0FBSCxFQUFOO0FBQ0QsQ0F0QkQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuaW1wb3J0IExpYlRvcG9sb2d5IGZyb20gJy4vTGliVG9wb2xvZ3knO1xuXG5cbihhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHBnID0gYXdhaXQgJC5QZ1NRTC5wb29sKCdsb2NhbGhvc3QnKTtcbiAgY29uc3QgdG9wb2xvZ3lOYW1lID0gJ2xpbmVfdG9wbyc7XG4gIGNvbnN0IHRvcG9sb2d5ID0gbmV3IExpYlRvcG9sb2d5KHRvcG9sb2d5TmFtZSk7XG5cbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDlpJblm70g5rW35bK46L6555WM57q/YCwgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGxpc3QgPSBhd2FpdCBMaWJUb3BvbG9neS5nZXRGb3JlaWduTGlzdChwZyk7XG4gICAgZm9yIGF3YWl0IChjb25zdCBpdGVtIG9mIGxpc3QpIHtcbiAgICAgIGNvbnN0IGlkID0gK2l0ZW1bJ2lkJ107XG4gICAgICBjb25zdCBuYW1lID0gaXRlbVsnbmFtZSddO1xuICAgICAgYXdhaXQgJC5VdGlscy5jYWxsKGAke25hbWV9IyR7aWR9IOa1t+WyuOi+ueeVjOe6v2AsIHRvcG9sb2d5LmVkZ2VDb2FzdGxpbmUuYmluZCh0b3BvbG9neSksIFtwZywgaWRdKTtcbiAgICB9XG4gIH0pO1xuXG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg5Lit5Zu9IOa1t+WyuOi+ueeVjOe6v2AsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBpZCA9IDE7XG4gICAgY29uc3QgbmFtZSA9ICfkuK3lm70nO1xuICAgIGF3YWl0ICQuVXRpbHMuY2FsbChgJHtuYW1lfSMke2lkfSDmtbflsrjovrnnlYznur9gLCB0b3BvbG9neS5lZGdlQ29hc3RsaW5lLmJpbmQodG9wb2xvZ3kpLCBbcGcsIGlkXSk7XG4gIH0pO1xuXG5cbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=