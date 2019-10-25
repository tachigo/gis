'use strict';

var _modules = _interopRequireDefault(require("./../../../modules"));

var _Strategy = _interopRequireDefault(require("./../Strategy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const strategy = await new _Strategy.default(1, pg);
  await _modules.default.Utils.call(`检查拓扑边`, async () => {
    await strategy.checkEdges();
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvbHYwMS8wNC10b3BvLWNoZWNrLmpzIl0sIm5hbWVzIjpbInBnIiwiJCIsIlBnU1FMIiwiY2xpZW50Iiwic3RyYXRlZ3kiLCJTdHJhdGVneSIsIlV0aWxzIiwiY2FsbCIsImNoZWNrRWRnZXMiLCJyZWxlYXNlIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFHQTs7QUFFQTs7OztBQUdBLENBQUMsWUFBWTtBQUNYLFFBQU1BLEVBQUUsR0FBRyxNQUFNQyxpQkFBRUMsS0FBRixDQUFRQyxNQUFSLENBQWUsV0FBZixDQUFqQjtBQUVBLFFBQU1DLFFBQVEsR0FBRyxNQUFNLElBQUlDLGlCQUFKLENBQWEsQ0FBYixFQUFnQkwsRUFBaEIsQ0FBdkI7QUFFQSxRQUFNQyxpQkFBRUssS0FBRixDQUFRQyxJQUFSLENBQWMsT0FBZCxFQUFzQixZQUFZO0FBQ3RDLFVBQU1ILFFBQVEsQ0FBQ0ksVUFBVCxFQUFOO0FBQ0QsR0FGSyxDQUFOO0FBSUEsUUFBTVIsRUFBRSxDQUFDUyxPQUFILEVBQU47QUFDRCxDQVZEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5cbmltcG9ydCAkIGZyb20gJy4vLi4vLi4vLi4vbW9kdWxlcyc7XG5cbmltcG9ydCBTdHJhdGVneSBmcm9tICcuLy4uL1N0cmF0ZWd5JztcblxuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBwZyA9IGF3YWl0ICQuUGdTUUwuY2xpZW50KCdsb2NhbGhvc3QnKTtcblxuICBjb25zdCBzdHJhdGVneSA9IGF3YWl0IG5ldyBTdHJhdGVneSgxLCBwZyk7XG5cbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDmo4Dmn6Xmi5PmiZHovrlgLCBhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgc3RyYXRlZ3kuY2hlY2tFZGdlcygpO1xuICB9KTtcblxuICBhd2FpdCBwZy5yZWxlYXNlKCk7XG59KSgpOyJdfQ==