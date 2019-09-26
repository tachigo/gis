'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibMfwCustom = _interopRequireDefault(require("./LibMfwCustom"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.pool('localhost');
  await _modules.default.Utils.call(`处理问题`, async () => {
    console.log(pg);
  });
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMi1ncHMvMDItbWZ3X2N1c3RvbS5qcyJdLCJuYW1lcyI6WyJwZyIsIiQiLCJQZ1NRTCIsInBvb2wiLCJVdGlscyIsImNhbGwiLCJjb25zb2xlIiwibG9nIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTs7QUFHQTs7OztBQUVBLENBQUMsWUFBWTtBQUNYLFFBQU1BLEVBQUUsR0FBRyxNQUFNQyxpQkFBRUMsS0FBRixDQUFRQyxJQUFSLENBQWEsV0FBYixDQUFqQjtBQUNBLFFBQU1GLGlCQUFFRyxLQUFGLENBQVFDLElBQVIsQ0FBYyxNQUFkLEVBQXFCLFlBQVk7QUFDckNDLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZUCxFQUFaO0FBQ0QsR0FGSyxDQUFOO0FBR0QsQ0FMRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuXG5pbXBvcnQgTGliTWZ3Q3VzdG9tIGZyb20gJy4vTGliTWZ3Q3VzdG9tJztcblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLnBvb2woJ2xvY2FsaG9zdCcpO1xuICBhd2FpdCAkLlV0aWxzLmNhbGwoYOWkhOeQhumXrumimGAsIGFzeW5jICgpID0+IHtcbiAgICBjb25zb2xlLmxvZyhwZyk7XG4gIH0pO1xufSkoKTsiXX0=