'use strict';

var _modules = _interopRequireDefault(require("./../../../modules"));

var _Strategy = _interopRequireDefault(require("./../Strategy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const strategy = await new _Strategy.default(2, pg);
  await _modules.default.Utils.call(`初始化关系`, async () => {
    await strategy.initRelation();
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvbHYwMi8wNS1yZWxhdGlvbi1pbml0LmpzIl0sIm5hbWVzIjpbInBnIiwiJCIsIlBnU1FMIiwiY2xpZW50Iiwic3RyYXRlZ3kiLCJTdHJhdGVneSIsIlV0aWxzIiwiY2FsbCIsImluaXRSZWxhdGlvbiIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOztBQUVBOzs7O0FBR0EsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHLE1BQU1DLGlCQUFFQyxLQUFGLENBQVFDLE1BQVIsQ0FBZSxXQUFmLENBQWpCO0FBRUEsUUFBTUMsUUFBUSxHQUFHLE1BQU0sSUFBSUMsaUJBQUosQ0FBYSxDQUFiLEVBQWdCTCxFQUFoQixDQUF2QjtBQUVBLFFBQU1DLGlCQUFFSyxLQUFGLENBQVFDLElBQVIsQ0FBYyxPQUFkLEVBQXNCLFlBQVk7QUFDdEMsVUFBTUgsUUFBUSxDQUFDSSxZQUFULEVBQU47QUFDRCxHQUZLLENBQU47QUFJQSxRQUFNUixFQUFFLENBQUNTLE9BQUgsRUFBTjtBQUNELENBVkQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi8uLi9tb2R1bGVzJztcblxuaW1wb3J0IFN0cmF0ZWd5IGZyb20gJy4vLi4vU3RyYXRlZ3knO1xuXG5cbihhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHBnID0gYXdhaXQgJC5QZ1NRTC5jbGllbnQoJ2xvY2FsaG9zdCcpO1xuXG4gIGNvbnN0IHN0cmF0ZWd5ID0gYXdhaXQgbmV3IFN0cmF0ZWd5KDIsIHBnKTtcblxuICBhd2FpdCAkLlV0aWxzLmNhbGwoYOWIneWni+WMluWFs+ezu2AsIGFzeW5jICgpID0+IHtcbiAgICBhd2FpdCBzdHJhdGVneS5pbml0UmVsYXRpb24oKTtcbiAgfSk7XG5cbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=