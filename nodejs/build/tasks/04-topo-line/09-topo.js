'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibTopoLine = _interopRequireDefault(require("./LibTopoLine"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const topologyName = 'line_topo';
  const dumpTable = 'line_dump';
  const topoTable = 'line_topo';
  const schema = 'topo';
  const topology = new _LibTopoLine.default(topologyName, dumpTable, topoTable, schema);
  await topology.registerTopologySimplifyFunction(pg);
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC10b3BvLWxpbmUvMDktdG9wby5qcyJdLCJuYW1lcyI6WyJwZyIsIiQiLCJQZ1NRTCIsImNsaWVudCIsInRvcG9sb2d5TmFtZSIsImR1bXBUYWJsZSIsInRvcG9UYWJsZSIsInNjaGVtYSIsInRvcG9sb2d5IiwiTGliVG9wb0xpbmUiLCJyZWdpc3RlclRvcG9sb2d5U2ltcGxpZnlGdW5jdGlvbiIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOztBQUVBOzs7O0FBR0EsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHLE1BQU1DLGlCQUFFQyxLQUFGLENBQVFDLE1BQVIsQ0FBZSxXQUFmLENBQWpCO0FBQ0EsUUFBTUMsWUFBWSxHQUFHLFdBQXJCO0FBQ0EsUUFBTUMsU0FBUyxHQUFHLFdBQWxCO0FBQ0EsUUFBTUMsU0FBUyxHQUFHLFdBQWxCO0FBQ0EsUUFBTUMsTUFBTSxHQUFHLE1BQWY7QUFDQSxRQUFNQyxRQUFRLEdBQUcsSUFBSUMsb0JBQUosQ0FBZ0JMLFlBQWhCLEVBQThCQyxTQUE5QixFQUF5Q0MsU0FBekMsRUFBb0RDLE1BQXBELENBQWpCO0FBRUEsUUFBTUMsUUFBUSxDQUFDRSxnQ0FBVCxDQUEwQ1YsRUFBMUMsQ0FBTjtBQUdBLFFBQU1BLEVBQUUsQ0FBQ1csT0FBSCxFQUFOO0FBQ0QsQ0FaRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuXG5pbXBvcnQgJCBmcm9tICcuLy4uLy4uL21vZHVsZXMnO1xuXG5pbXBvcnQgTGliVG9wb0xpbmUgZnJvbSAnLi9MaWJUb3BvTGluZSc7XG5cblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLmNsaWVudCgnbG9jYWxob3N0Jyk7XG4gIGNvbnN0IHRvcG9sb2d5TmFtZSA9ICdsaW5lX3RvcG8nO1xuICBjb25zdCBkdW1wVGFibGUgPSAnbGluZV9kdW1wJztcbiAgY29uc3QgdG9wb1RhYmxlID0gJ2xpbmVfdG9wbyc7XG4gIGNvbnN0IHNjaGVtYSA9ICd0b3BvJztcbiAgY29uc3QgdG9wb2xvZ3kgPSBuZXcgTGliVG9wb0xpbmUodG9wb2xvZ3lOYW1lLCBkdW1wVGFibGUsIHRvcG9UYWJsZSwgc2NoZW1hKTtcblxuICBhd2FpdCB0b3BvbG9neS5yZWdpc3RlclRvcG9sb2d5U2ltcGxpZnlGdW5jdGlvbihwZyk7XG5cblxuICBhd2FpdCBwZy5yZWxlYXNlKCk7XG59KSgpOyJdfQ==