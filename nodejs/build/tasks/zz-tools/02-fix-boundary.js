'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const table = 'boundary.mfw';
  const id = 900096;
  await _modules.default.PgSQL.getPostGis().validatePolygon(pg, id, table, 'id', 'geom');
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy96ei10b29scy8wMi1maXgtYm91bmRhcnkuanMiXSwibmFtZXMiOlsicGciLCIkIiwiUGdTUUwiLCJjbGllbnQiLCJ0YWJsZSIsImlkIiwiZ2V0UG9zdEdpcyIsInZhbGlkYXRlUG9seWdvbiIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOzs7O0FBRUEsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHLE1BQU1DLGlCQUFFQyxLQUFGLENBQVFDLE1BQVIsQ0FBZSxXQUFmLENBQWpCO0FBRUEsUUFBTUMsS0FBSyxHQUFHLGNBQWQ7QUFDQSxRQUFNQyxFQUFFLEdBQUcsTUFBWDtBQUNBLFFBQU1KLGlCQUFFQyxLQUFGLENBQVFJLFVBQVIsR0FBcUJDLGVBQXJCLENBQXFDUCxFQUFyQyxFQUF5Q0ssRUFBekMsRUFBNkNELEtBQTdDLEVBQW9ELElBQXBELEVBQTBELE1BQTFELENBQU47QUFFQSxRQUFNSixFQUFFLENBQUNRLE9BQUgsRUFBTjtBQUNELENBUkQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLmNsaWVudCgnbG9jYWxob3N0Jyk7XG5cbiAgY29uc3QgdGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgY29uc3QgaWQgPSA5MDAwOTY7XG4gIGF3YWl0ICQuUGdTUUwuZ2V0UG9zdEdpcygpLnZhbGlkYXRlUG9seWdvbihwZywgaWQsIHRhYmxlLCAnaWQnLCAnZ2VvbScpO1xuXG4gIGF3YWl0IHBnLnJlbGVhc2UoKTtcbn0pKCk7Il19