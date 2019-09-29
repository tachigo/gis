'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibOSM = _interopRequireDefault(require("./LibOSM"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.pool('localhost');
  await _modules.default.Utils.call(`遍历OSM 国家树`, _LibOSM.default.relationWay.bind(_LibOSM.default), [pg]);
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMC1vc20vMDAtcmVsYXRpb25fd2F5LmpzIl0sIm5hbWVzIjpbInBnIiwiJCIsIlBnU1FMIiwicG9vbCIsIlV0aWxzIiwiY2FsbCIsIkxpYk9TTSIsInJlbGF0aW9uV2F5IiwiYmluZCIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOztBQUVBOzs7O0FBRUEsQ0FBQyxZQUFZO0FBQ1gsUUFBTUEsRUFBRSxHQUFHLE1BQU1DLGlCQUFFQyxLQUFGLENBQVFDLElBQVIsQ0FBYSxXQUFiLENBQWpCO0FBQ0EsUUFBTUYsaUJBQUVHLEtBQUYsQ0FBUUMsSUFBUixDQUFjLFdBQWQsRUFBMEJDLGdCQUFPQyxXQUFQLENBQW1CQyxJQUFuQixDQUF3QkYsZUFBeEIsQ0FBMUIsRUFBMkQsQ0FBQ04sRUFBRCxDQUEzRCxDQUFOO0FBQ0EsUUFBTUEsRUFBRSxDQUFDUyxPQUFILEVBQU47QUFDRCxDQUpEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5cbmltcG9ydCAkIGZyb20gJy4vLi4vLi4vbW9kdWxlcyc7XG5cbmltcG9ydCBMaWJPU00gZnJvbSAnLi9MaWJPU00nO1xuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBwZyA9IGF3YWl0ICQuUGdTUUwucG9vbCgnbG9jYWxob3N0Jyk7XG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg6YGN5Y6GT1NNIOWbveWutuagkWAsIExpYk9TTS5yZWxhdGlvbldheS5iaW5kKExpYk9TTSksIFtwZ10pO1xuICBhd2FpdCBwZy5yZWxlYXNlKCk7XG59KSgpOyJdfQ==