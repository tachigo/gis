'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibOSM = _interopRequireDefault(require("./LibOSM"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  await _modules.default.Utils.call(`遍历OSM 国家树`, _LibOSM.default.relationWay.bind(_LibOSM.default), [pg]);
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMC1vc20vMDAtcmVsYXRpb25fd2F5LmpzIl0sIm5hbWVzIjpbInBnIiwiJCIsIlBnU1FMIiwiY2xpZW50IiwiVXRpbHMiLCJjYWxsIiwiTGliT1NNIiwicmVsYXRpb25XYXkiLCJiaW5kIiwicmVsZWFzZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBR0E7O0FBRUE7Ozs7QUFFQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxFQUFFLEdBQUcsTUFBTUMsaUJBQUVDLEtBQUYsQ0FBUUMsTUFBUixDQUFlLFdBQWYsQ0FBakI7QUFDQSxRQUFNRixpQkFBRUcsS0FBRixDQUFRQyxJQUFSLENBQWMsV0FBZCxFQUEwQkMsZ0JBQU9DLFdBQVAsQ0FBbUJDLElBQW5CLENBQXdCRixlQUF4QixDQUExQixFQUEyRCxDQUFDTixFQUFELENBQTNELENBQU47QUFDQSxRQUFNQSxFQUFFLENBQUNTLE9BQUgsRUFBTjtBQUNELENBSkQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuaW1wb3J0ICQgZnJvbSAnLi8uLi8uLi9tb2R1bGVzJztcblxuaW1wb3J0IExpYk9TTSBmcm9tICcuL0xpYk9TTSc7XG5cbihhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHBnID0gYXdhaXQgJC5QZ1NRTC5jbGllbnQoJ2xvY2FsaG9zdCcpO1xuICBhd2FpdCAkLlV0aWxzLmNhbGwoYOmBjeWOhk9TTSDlm73lrrbmoJFgLCBMaWJPU00ucmVsYXRpb25XYXkuYmluZChMaWJPU00pLCBbcGddKTtcbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=