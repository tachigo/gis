'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibOSM = _interopRequireDefault(require("./LibOSM"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.pool('localhost');
  await _modules.default.Utils.call(`导出Relation Way`, _LibOSM.default.relationDump.bind(_LibOSM.default), [pg]);
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMC1vc20vMDEtcmVsYXRpb25fZHVtcC5qcyJdLCJuYW1lcyI6WyJwZyIsIiQiLCJQZ1NRTCIsInBvb2wiLCJVdGlscyIsImNhbGwiLCJMaWJPU00iLCJyZWxhdGlvbkR1bXAiLCJiaW5kIiwicmVsZWFzZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBR0E7O0FBRUE7Ozs7QUFFQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxFQUFFLEdBQUcsTUFBTUMsaUJBQUVDLEtBQUYsQ0FBUUMsSUFBUixDQUFhLFdBQWIsQ0FBakI7QUFDQSxRQUFNRixpQkFBRUcsS0FBRixDQUFRQyxJQUFSLENBQWMsZ0JBQWQsRUFBK0JDLGdCQUFPQyxZQUFQLENBQW9CQyxJQUFwQixDQUF5QkYsZUFBekIsQ0FBL0IsRUFBaUUsQ0FBQ04sRUFBRCxDQUFqRSxDQUFOO0FBQ0EsUUFBTUEsRUFBRSxDQUFDUyxPQUFILEVBQU47QUFDRCxDQUpEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5cbmltcG9ydCAkIGZyb20gJy4vLi4vLi4vbW9kdWxlcyc7XG5cbmltcG9ydCBMaWJPU00gZnJvbSAnLi9MaWJPU00nO1xuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBwZyA9IGF3YWl0ICQuUGdTUUwucG9vbCgnbG9jYWxob3N0Jyk7XG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg5a+85Ye6UmVsYXRpb24gV2F5YCwgTGliT1NNLnJlbGF0aW9uRHVtcC5iaW5kKExpYk9TTSksIFtwZ10pO1xuICBhd2FpdCBwZy5yZWxlYXNlKCk7XG59KSgpOyJdfQ==