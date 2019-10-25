'use strict';

var _modules = _interopRequireDefault(require("./../../../modules"));

var _Strategy = _interopRequireDefault(require("./../Strategy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const strategy = await new _Strategy.default(2, pg);
  await _modules.default.Utils.call(`计算 topo2dump 关系`, async () => {
    await strategy.calcTopo2DumpRelation();
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvbHYwMi8wOC10b3BvMmR1bXAuanMiXSwibmFtZXMiOlsicGciLCIkIiwiUGdTUUwiLCJjbGllbnQiLCJzdHJhdGVneSIsIlN0cmF0ZWd5IiwiVXRpbHMiLCJjYWxsIiwiY2FsY1RvcG8yRHVtcFJlbGF0aW9uIiwicmVsZWFzZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBR0E7O0FBRUE7Ozs7QUFHQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxFQUFFLEdBQUcsTUFBTUMsaUJBQUVDLEtBQUYsQ0FBUUMsTUFBUixDQUFlLFdBQWYsQ0FBakI7QUFFQSxRQUFNQyxRQUFRLEdBQUcsTUFBTSxJQUFJQyxpQkFBSixDQUFhLENBQWIsRUFBZ0JMLEVBQWhCLENBQXZCO0FBRUEsUUFBTUMsaUJBQUVLLEtBQUYsQ0FBUUMsSUFBUixDQUFjLGlCQUFkLEVBQWdDLFlBQVk7QUFDaEQsVUFBTUgsUUFBUSxDQUFDSSxxQkFBVCxFQUFOO0FBQ0QsR0FGSyxDQUFOO0FBSUEsUUFBTVIsRUFBRSxDQUFDUyxPQUFILEVBQU47QUFDRCxDQVZEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5cbmltcG9ydCAkIGZyb20gJy4vLi4vLi4vLi4vbW9kdWxlcyc7XG5cbmltcG9ydCBTdHJhdGVneSBmcm9tICcuLy4uL1N0cmF0ZWd5JztcblxuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBwZyA9IGF3YWl0ICQuUGdTUUwuY2xpZW50KCdsb2NhbGhvc3QnKTtcblxuICBjb25zdCBzdHJhdGVneSA9IGF3YWl0IG5ldyBTdHJhdGVneSgyLCBwZyk7XG5cbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDorqHnrpcgdG9wbzJkdW1wIOWFs+ezu2AsIGFzeW5jICgpID0+IHtcbiAgICBhd2FpdCBzdHJhdGVneS5jYWxjVG9wbzJEdW1wUmVsYXRpb24oKTtcbiAgfSk7XG5cbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=