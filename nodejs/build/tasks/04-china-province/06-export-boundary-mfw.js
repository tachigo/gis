'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/tmp-china-province/boundary.shp`;
  await _modules.default.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from boundary.mfw where id > 10 and id < 50', 'geom');
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC1jaGluYS1wcm92aW5jZS8wNi1leHBvcnQtYm91bmRhcnktbWZ3LmpzIl0sIm5hbWVzIjpbInNocEZpbGVuYW1lIiwiJCIsIlV0aWxzIiwiZGF0YURpciIsIlBnU1FMIiwiZ2V0UG9zdEdpcyIsImV4cG9ydFNoYXBlRmlsZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7Ozs7QUFFQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxXQUFXLEdBQUksR0FBRUMsaUJBQUVDLEtBQUYsQ0FBUUMsT0FBUSw0Q0FBdkM7QUFDQSxRQUFNRixpQkFBRUcsS0FBRixDQUFRQyxVQUFSLEdBQXFCQyxlQUFyQixDQUFxQ04sV0FBckMsRUFBa0QsV0FBbEQsRUFBK0Qsc0RBQS9ELEVBQXVILE1BQXZILENBQU47QUFDRCxDQUhEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgJCBmcm9tICcuLy4uLy4uL21vZHVsZXMnO1xuXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBzaHBGaWxlbmFtZSA9IGAkeyQuVXRpbHMuZGF0YURpcn0vc2hhcGVmaWxlL3RtcC1jaGluYS1wcm92aW5jZS9ib3VuZGFyeS5zaHBgO1xuICBhd2FpdCAkLlBnU1FMLmdldFBvc3RHaXMoKS5leHBvcnRTaGFwZUZpbGUoc2hwRmlsZW5hbWUsICdsb2NhbGhvc3QnLCAnc2VsZWN0ICogZnJvbSBib3VuZGFyeS5tZncgd2hlcmUgaWQgPiAxMCBhbmQgaWQgPCA1MCcsICdnZW9tJyk7XG59KSgpOyJdfQ==