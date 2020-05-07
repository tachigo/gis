'use strict';

var _modules = _interopRequireDefault(require("./../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  // const shpFilename = `${$.Utils.dataDir}/shapefile/tmp-all-boundary/boundary.shp`;
  // await $.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from boundary.mfw', 'geom');
  const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/tmp-all-boundary/boundary.shp`;
  await _modules.default.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select zh_name, id, region_id, mdd_id, geom from boundary.mfw where parent_id = 0 or parent_id = 1 order by id asc', 'geom');
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY3JpcHRzLzAzLWV4cG9ydC1tZnctYm91bmRhcnkuanMiXSwibmFtZXMiOlsic2hwRmlsZW5hbWUiLCIkIiwiVXRpbHMiLCJkYXRhRGlyIiwiUGdTUUwiLCJnZXRQb3N0R2lzIiwiZXhwb3J0U2hhcGVGaWxlIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTs7OztBQUVBLENBQUMsWUFBWTtBQUNYO0FBQ0E7QUFDRSxRQUFNQSxXQUFXLEdBQUksR0FBRUMsaUJBQUVDLEtBQUYsQ0FBUUMsT0FBUSwwQ0FBdkM7QUFDQSxRQUFNRixpQkFBRUcsS0FBRixDQUFRQyxVQUFSLEdBQXFCQyxlQUFyQixDQUFxQ04sV0FBckMsRUFBa0QsV0FBbEQsRUFBK0Qsb0hBQS9ELEVBQXFMLE1BQXJMLENBQU47QUFDSCxDQUxEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgJCBmcm9tICcuLy4uL21vZHVsZXMnO1xuXG4oYXN5bmMgKCkgPT4ge1xuICAvLyBjb25zdCBzaHBGaWxlbmFtZSA9IGAkeyQuVXRpbHMuZGF0YURpcn0vc2hhcGVmaWxlL3RtcC1hbGwtYm91bmRhcnkvYm91bmRhcnkuc2hwYDtcbiAgLy8gYXdhaXQgJC5QZ1NRTC5nZXRQb3N0R2lzKCkuZXhwb3J0U2hhcGVGaWxlKHNocEZpbGVuYW1lLCAnbG9jYWxob3N0JywgJ3NlbGVjdCAqIGZyb20gYm91bmRhcnkubWZ3JywgJ2dlb20nKTtcbiAgICBjb25zdCBzaHBGaWxlbmFtZSA9IGAkeyQuVXRpbHMuZGF0YURpcn0vc2hhcGVmaWxlL3RtcC1hbGwtYm91bmRhcnkvYm91bmRhcnkuc2hwYDtcbiAgICBhd2FpdCAkLlBnU1FMLmdldFBvc3RHaXMoKS5leHBvcnRTaGFwZUZpbGUoc2hwRmlsZW5hbWUsICdsb2NhbGhvc3QnLCAnc2VsZWN0IHpoX25hbWUsIGlkLCByZWdpb25faWQsIG1kZF9pZCwgZ2VvbSBmcm9tIGJvdW5kYXJ5Lm1mdyB3aGVyZSBwYXJlbnRfaWQgPSAwIG9yIHBhcmVudF9pZCA9IDEgb3JkZXIgYnkgaWQgYXNjJywgJ2dlb20nKTtcbn0pKCk7Il19