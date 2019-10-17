'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _Library = _interopRequireDefault(require("./Library"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  await _modules.default.Utils.call(`加载中国各省数据`, async () => {
    await _modules.default.AMap.loadProvinces(async (index, zhName, level, parentIndex, iso, geoJson) => {
      await _Library.default.save(pg, index, parentIndex, iso, zhName, geoJson, level);
    });
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMS1hbWFwLzAxLXByb3ZpbmNlcy5qcyJdLCJuYW1lcyI6WyJwZyIsIiQiLCJQZ1NRTCIsImNsaWVudCIsIlV0aWxzIiwiY2FsbCIsIkFNYXAiLCJsb2FkUHJvdmluY2VzIiwiaW5kZXgiLCJ6aE5hbWUiLCJsZXZlbCIsInBhcmVudEluZGV4IiwiaXNvIiwiZ2VvSnNvbiIsIkxpYnJhcnkiLCJzYXZlIiwicmVsZWFzZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7O0FBRUE7Ozs7QUFHQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxFQUFFLEdBQUcsTUFBTUMsaUJBQUVDLEtBQUYsQ0FBUUMsTUFBUixDQUFlLFdBQWYsQ0FBakI7QUFDQSxRQUFNRixpQkFBRUcsS0FBRixDQUFRQyxJQUFSLENBQWMsVUFBZCxFQUF5QixZQUFZO0FBQ3pDLFVBQU1KLGlCQUFFSyxJQUFGLENBQU9DLGFBQVAsQ0FBcUIsT0FBT0MsS0FBUCxFQUFjQyxNQUFkLEVBQXNCQyxLQUF0QixFQUE2QkMsV0FBN0IsRUFBMENDLEdBQTFDLEVBQStDQyxPQUEvQyxLQUEyRDtBQUNwRixZQUFNQyxpQkFBUUMsSUFBUixDQUFhZixFQUFiLEVBQWlCUSxLQUFqQixFQUF3QkcsV0FBeEIsRUFBcUNDLEdBQXJDLEVBQTBDSCxNQUExQyxFQUFrREksT0FBbEQsRUFBMkRILEtBQTNELENBQU47QUFDRCxLQUZLLENBQU47QUFHRCxHQUpLLENBQU47QUFLQSxRQUFNVixFQUFFLENBQUNnQixPQUFILEVBQU47QUFDRCxDQVJEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgJCBmcm9tICcuLy4uLy4uL21vZHVsZXMnO1xuXG5pbXBvcnQgTGlicmFyeSBmcm9tIFwiLi9MaWJyYXJ5XCI7XG5cblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLmNsaWVudCgnbG9jYWxob3N0Jyk7XG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg5Yqg6L295Lit5Zu95ZCE55yB5pWw5o2uYCwgYXN5bmMgKCkgPT4ge1xuICAgIGF3YWl0ICQuQU1hcC5sb2FkUHJvdmluY2VzKGFzeW5jIChpbmRleCwgemhOYW1lLCBsZXZlbCwgcGFyZW50SW5kZXgsIGlzbywgZ2VvSnNvbikgPT4ge1xuICAgICAgYXdhaXQgTGlicmFyeS5zYXZlKHBnLCBpbmRleCwgcGFyZW50SW5kZXgsIGlzbywgemhOYW1lLCBnZW9Kc29uLCBsZXZlbCk7XG4gICAgfSk7XG4gIH0pO1xuICBhd2FpdCBwZy5yZWxlYXNlKCk7XG59KSgpOyJdfQ==