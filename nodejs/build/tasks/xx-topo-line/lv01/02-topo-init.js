'use strict';

var _modules = _interopRequireDefault(require("./../../../modules"));

var _Strategy = _interopRequireDefault(require("./../Strategy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const strategy = await new _Strategy.default(1, pg);
  await _modules.default.Utils.call(`初始化拓扑`, async () => {
    await strategy.topoInit();
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvbHYwMS8wMi10b3BvLWluaXQuanMiXSwibmFtZXMiOlsicGciLCIkIiwiUGdTUUwiLCJjbGllbnQiLCJzdHJhdGVneSIsIlN0cmF0ZWd5IiwiVXRpbHMiLCJjYWxsIiwidG9wb0luaXQiLCJyZWxlYXNlIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFHQTs7QUFFQTs7OztBQUdBLENBQUMsWUFBWTtBQUNYLFFBQU1BLEVBQUUsR0FBRyxNQUFNQyxpQkFBRUMsS0FBRixDQUFRQyxNQUFSLENBQWUsV0FBZixDQUFqQjtBQUVBLFFBQU1DLFFBQVEsR0FBRyxNQUFNLElBQUlDLGlCQUFKLENBQWEsQ0FBYixFQUFnQkwsRUFBaEIsQ0FBdkI7QUFFQSxRQUFNQyxpQkFBRUssS0FBRixDQUFRQyxJQUFSLENBQWMsT0FBZCxFQUFzQixZQUFZO0FBQ3RDLFVBQU1ILFFBQVEsQ0FBQ0ksUUFBVCxFQUFOO0FBQ0QsR0FGSyxDQUFOO0FBSUEsUUFBTVIsRUFBRSxDQUFDUyxPQUFILEVBQU47QUFDRCxDQVZEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5cbmltcG9ydCAkIGZyb20gJy4vLi4vLi4vLi4vbW9kdWxlcyc7XG5cbmltcG9ydCBTdHJhdGVneSBmcm9tICcuLy4uL1N0cmF0ZWd5JztcblxuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBwZyA9IGF3YWl0ICQuUGdTUUwuY2xpZW50KCdsb2NhbGhvc3QnKTtcblxuICBjb25zdCBzdHJhdGVneSA9IGF3YWl0IG5ldyBTdHJhdGVneSgxLCBwZyk7XG5cbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDliJ3lp4vljJbmi5PmiZFgLCBhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgc3RyYXRlZ3kudG9wb0luaXQoKTtcbiAgfSk7XG5cbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=