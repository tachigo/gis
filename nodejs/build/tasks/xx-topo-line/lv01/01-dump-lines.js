'use strict';

var _modules = _interopRequireDefault(require("./../../../modules"));

var _Strategy = _interopRequireDefault(require("./../Strategy"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  const strategy = await new _Strategy.default(1, pg);
  await _modules.default.Utils.call(`导出线`, strategy.loadBoundaryList.bind(strategy), [async (id, name) => {
    await _modules.default.Utils.call(`导出线 ${name}#${id}`, strategy.loadLineList.bind(strategy), [id, async (id, type, category) => {
      await _modules.default.Utils.call(`导出线 ${name}#${id} [${type}|${category}]`, strategy.dumpLines.bind(strategy), [id, type, category]);
    }]);
  }]);
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvbHYwMS8wMS1kdW1wLWxpbmVzLmpzIl0sIm5hbWVzIjpbInBnIiwiJCIsIlBnU1FMIiwiY2xpZW50Iiwic3RyYXRlZ3kiLCJTdHJhdGVneSIsIlV0aWxzIiwiY2FsbCIsImxvYWRCb3VuZGFyeUxpc3QiLCJiaW5kIiwiaWQiLCJuYW1lIiwibG9hZExpbmVMaXN0IiwidHlwZSIsImNhdGVnb3J5IiwiZHVtcExpbmVzIiwicmVsZWFzZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBR0E7O0FBRUE7Ozs7QUFHQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxFQUFFLEdBQUcsTUFBTUMsaUJBQUVDLEtBQUYsQ0FBUUMsTUFBUixDQUFlLFdBQWYsQ0FBakI7QUFFQSxRQUFNQyxRQUFRLEdBQUcsTUFBTSxJQUFJQyxpQkFBSixDQUFhLENBQWIsRUFBZ0JMLEVBQWhCLENBQXZCO0FBRUEsUUFBTUMsaUJBQUVLLEtBQUYsQ0FBUUMsSUFBUixDQUFjLEtBQWQsRUFBb0JILFFBQVEsQ0FBQ0ksZ0JBQVQsQ0FBMEJDLElBQTFCLENBQStCTCxRQUEvQixDQUFwQixFQUE4RCxDQUFDLE9BQU9NLEVBQVAsRUFBV0MsSUFBWCxLQUFvQjtBQUN2RixVQUFNVixpQkFBRUssS0FBRixDQUFRQyxJQUFSLENBQWMsT0FBTUksSUFBSyxJQUFHRCxFQUFHLEVBQS9CLEVBQWtDTixRQUFRLENBQUNRLFlBQVQsQ0FBc0JILElBQXRCLENBQTJCTCxRQUEzQixDQUFsQyxFQUF3RSxDQUFDTSxFQUFELEVBQUssT0FBT0EsRUFBUCxFQUFXRyxJQUFYLEVBQWlCQyxRQUFqQixLQUE4QjtBQUMvRyxZQUFNYixpQkFBRUssS0FBRixDQUFRQyxJQUFSLENBQWMsT0FBTUksSUFBSyxJQUFHRCxFQUFHLEtBQUlHLElBQUssSUFBR0MsUUFBUyxHQUFwRCxFQUF3RFYsUUFBUSxDQUFDVyxTQUFULENBQW1CTixJQUFuQixDQUF3QkwsUUFBeEIsQ0FBeEQsRUFBMkYsQ0FBQ00sRUFBRCxFQUFLRyxJQUFMLEVBQVdDLFFBQVgsQ0FBM0YsQ0FBTjtBQUNELEtBRjZFLENBQXhFLENBQU47QUFHRCxHQUptRSxDQUE5RCxDQUFOO0FBTUEsUUFBTWQsRUFBRSxDQUFDZ0IsT0FBSCxFQUFOO0FBQ0QsQ0FaRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuXG5pbXBvcnQgJCBmcm9tICcuLy4uLy4uLy4uL21vZHVsZXMnO1xuXG5pbXBvcnQgU3RyYXRlZ3kgZnJvbSAnLi8uLi9TdHJhdGVneSc7XG5cblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLmNsaWVudCgnbG9jYWxob3N0Jyk7XG5cbiAgY29uc3Qgc3RyYXRlZ3kgPSBhd2FpdCBuZXcgU3RyYXRlZ3koMSwgcGcpO1xuXG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg5a+85Ye657q/YCwgc3RyYXRlZ3kubG9hZEJvdW5kYXJ5TGlzdC5iaW5kKHN0cmF0ZWd5KSwgW2FzeW5jIChpZCwgbmFtZSkgPT4ge1xuICAgIGF3YWl0ICQuVXRpbHMuY2FsbChg5a+85Ye657q/ICR7bmFtZX0jJHtpZH1gLCBzdHJhdGVneS5sb2FkTGluZUxpc3QuYmluZChzdHJhdGVneSksIFtpZCwgYXN5bmMgKGlkLCB0eXBlLCBjYXRlZ29yeSkgPT4ge1xuICAgICAgYXdhaXQgJC5VdGlscy5jYWxsKGDlr7zlh7rnur8gJHtuYW1lfSMke2lkfSBbJHt0eXBlfXwke2NhdGVnb3J5fV1gLCBzdHJhdGVneS5kdW1wTGluZXMuYmluZChzdHJhdGVneSksIFtpZCwgdHlwZSwgY2F0ZWdvcnldKTtcbiAgICB9XSk7XG4gIH1dKTtcblxuICBhd2FpdCBwZy5yZWxlYXNlKCk7XG59KSgpOyJdfQ==