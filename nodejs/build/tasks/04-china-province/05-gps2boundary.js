'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibChinaProvince = _interopRequireDefault(require("./LibChinaProvince"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  await pg.query(`delete from boundary.mfw where id > 10 and id < 50`);
  await _modules.default.Utils.call(`中国省 gps -> boundary`, async () => {
    const list = await _LibChinaProvince.default.getProvinceGpsMfwList(pg);

    for await (const item of list) {
      await _modules.default.Utils.call(`${item['name']}#${item['id']}`, async () => {
        await _LibChinaProvince.default.gps2boundary(pg, item['id']);
      });
    }
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC1jaGluYS1wcm92aW5jZS8wNS1ncHMyYm91bmRhcnkuanMiXSwibmFtZXMiOlsicGciLCIkIiwiUGdTUUwiLCJjbGllbnQiLCJxdWVyeSIsIlV0aWxzIiwiY2FsbCIsImxpc3QiLCJMaWJDaGluYVByb3ZpbmNlIiwiZ2V0UHJvdmluY2VHcHNNZndMaXN0IiwiaXRlbSIsImdwczJib3VuZGFyeSIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBOztBQUVBOzs7O0FBR0EsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHLE1BQU1DLGlCQUFFQyxLQUFGLENBQVFDLE1BQVIsQ0FBZSxXQUFmLENBQWpCO0FBQ0EsUUFBTUgsRUFBRSxDQUFDSSxLQUFILENBQVUsb0RBQVYsQ0FBTjtBQUNBLFFBQU1ILGlCQUFFSSxLQUFGLENBQVFDLElBQVIsQ0FBYyxxQkFBZCxFQUFvQyxZQUFZO0FBQ3BELFVBQU1DLElBQUksR0FBRyxNQUFNQywwQkFBaUJDLHFCQUFqQixDQUF1Q1QsRUFBdkMsQ0FBbkI7O0FBQ0EsZUFBVyxNQUFNVSxJQUFqQixJQUF5QkgsSUFBekIsRUFBK0I7QUFDN0IsWUFBTU4saUJBQUVJLEtBQUYsQ0FBUUMsSUFBUixDQUFjLEdBQUVJLElBQUksQ0FBQyxNQUFELENBQVMsSUFBR0EsSUFBSSxDQUFDLElBQUQsQ0FBTyxFQUEzQyxFQUE4QyxZQUFZO0FBQzlELGNBQU1GLDBCQUFpQkcsWUFBakIsQ0FBOEJYLEVBQTlCLEVBQWtDVSxJQUFJLENBQUMsSUFBRCxDQUF0QyxDQUFOO0FBQ0QsT0FGSyxDQUFOO0FBR0Q7QUFDRixHQVBLLENBQU47QUFRQSxRQUFNVixFQUFFLENBQUNZLE9BQUgsRUFBTjtBQUNELENBWkQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCAkIGZyb20gJy4vLi4vLi4vbW9kdWxlcyc7XG5cbmltcG9ydCBMaWJDaGluYVByb3ZpbmNlIGZyb20gJy4vTGliQ2hpbmFQcm92aW5jZSc7XG5cblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLmNsaWVudCgnbG9jYWxob3N0Jyk7XG4gIGF3YWl0IHBnLnF1ZXJ5KGBkZWxldGUgZnJvbSBib3VuZGFyeS5tZncgd2hlcmUgaWQgPiAxMCBhbmQgaWQgPCA1MGApO1xuICBhd2FpdCAkLlV0aWxzLmNhbGwoYOS4reWbveecgSBncHMgLT4gYm91bmRhcnlgLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgbGlzdCA9IGF3YWl0IExpYkNoaW5hUHJvdmluY2UuZ2V0UHJvdmluY2VHcHNNZndMaXN0KHBnKTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IGl0ZW0gb2YgbGlzdCkge1xuICAgICAgYXdhaXQgJC5VdGlscy5jYWxsKGAke2l0ZW1bJ25hbWUnXX0jJHtpdGVtWydpZCddfWAsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgTGliQ2hpbmFQcm92aW5jZS5ncHMyYm91bmRhcnkocGcsIGl0ZW1bJ2lkJ10pO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=