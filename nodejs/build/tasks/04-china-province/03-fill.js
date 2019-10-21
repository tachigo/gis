'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibChinaProvince = _interopRequireDefault(require("./LibChinaProvince"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  await _modules.default.Utils.call(`中国省`, async () => {
    await _LibChinaProvince.default.fillProvinceGpsMfw(pg);
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC1jaGluYS1wcm92aW5jZS8wMy1maWxsLmpzIl0sIm5hbWVzIjpbInBnIiwiJCIsIlBnU1FMIiwiY2xpZW50IiwiVXRpbHMiLCJjYWxsIiwiTGliQ2hpbmFQcm92aW5jZSIsImZpbGxQcm92aW5jZUdwc01mdyIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBOztBQUVBOzs7O0FBR0EsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHLE1BQU1DLGlCQUFFQyxLQUFGLENBQVFDLE1BQVIsQ0FBZSxXQUFmLENBQWpCO0FBQ0EsUUFBTUYsaUJBQUVHLEtBQUYsQ0FBUUMsSUFBUixDQUFjLEtBQWQsRUFBb0IsWUFBWTtBQUNwQyxVQUFNQywwQkFBaUJDLGtCQUFqQixDQUFvQ1AsRUFBcEMsQ0FBTjtBQUNELEdBRkssQ0FBTjtBQUdBLFFBQU1BLEVBQUUsQ0FBQ1EsT0FBSCxFQUFOO0FBQ0QsQ0FORCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuaW1wb3J0IExpYkNoaW5hUHJvdmluY2UgZnJvbSAnLi9MaWJDaGluYVByb3ZpbmNlJztcblxuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBwZyA9IGF3YWl0ICQuUGdTUUwuY2xpZW50KCdsb2NhbGhvc3QnKTtcbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDkuK3lm73nnIFgLCBhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgTGliQ2hpbmFQcm92aW5jZS5maWxsUHJvdmluY2VHcHNNZncocGcpO1xuICB9KTtcbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=