'use strict';

var _modules = _interopRequireDefault(require("./../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/tmp-all-gps/gps.shp`;
  await _modules.default.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from gps.mfw where id = 1 or id > 900000', 'geom');
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY3JpcHRzLzA0LWV4cG9ydC1tZnctZ3BzLmpzIl0sIm5hbWVzIjpbInNocEZpbGVuYW1lIiwiJCIsIlV0aWxzIiwiZGF0YURpciIsIlBnU1FMIiwiZ2V0UG9zdEdpcyIsImV4cG9ydFNoYXBlRmlsZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7Ozs7QUFFQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxXQUFXLEdBQUksR0FBRUMsaUJBQUVDLEtBQUYsQ0FBUUMsT0FBUSxnQ0FBdkM7QUFDQSxRQUFNRixpQkFBRUcsS0FBRixDQUFRQyxVQUFSLEdBQXFCQyxlQUFyQixDQUFxQ04sV0FBckMsRUFBa0QsV0FBbEQsRUFBK0QsbURBQS9ELEVBQW9ILE1BQXBILENBQU47QUFDRCxDQUhEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgJCBmcm9tICcuLy4uL21vZHVsZXMnO1xuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBzaHBGaWxlbmFtZSA9IGAkeyQuVXRpbHMuZGF0YURpcn0vc2hhcGVmaWxlL3RtcC1hbGwtZ3BzL2dwcy5zaHBgO1xuICBhd2FpdCAkLlBnU1FMLmdldFBvc3RHaXMoKS5leHBvcnRTaGFwZUZpbGUoc2hwRmlsZW5hbWUsICdsb2NhbGhvc3QnLCAnc2VsZWN0ICogZnJvbSBncHMubWZ3IHdoZXJlIGlkID0gMSBvciBpZCA+IDkwMDAwMCcsICdnZW9tJyk7XG59KSgpOyJdfQ==