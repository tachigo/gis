'use strict';

var _modules = _interopRequireDefault(require("./../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/tmp-china-maritime/china.shp`;
  await _modules.default.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select id, geom from gps.mfw where id = 1', 'geom');
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY3JpcHRzLzAwLWV4cG9ydC1jaGluYS1ncHMuanMiXSwibmFtZXMiOlsic2hwRmlsZW5hbWUiLCIkIiwiVXRpbHMiLCJkYXRhRGlyIiwiUGdTUUwiLCJnZXRQb3N0R2lzIiwiZXhwb3J0U2hhcGVGaWxlIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTs7OztBQUVBLENBQUMsWUFBWTtBQUNYLFFBQU1BLFdBQVcsR0FBSSxHQUFFQyxpQkFBRUMsS0FBRixDQUFRQyxPQUFRLHlDQUF2QztBQUNBLFFBQU1GLGlCQUFFRyxLQUFGLENBQVFDLFVBQVIsR0FBcUJDLGVBQXJCLENBQXFDTixXQUFyQyxFQUFrRCxXQUFsRCxFQUErRCwyQ0FBL0QsRUFBNEcsTUFBNUcsQ0FBTjtBQUNELENBSEQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCAkIGZyb20gJy4vLi4vbW9kdWxlcyc7XG5cbihhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHNocEZpbGVuYW1lID0gYCR7JC5VdGlscy5kYXRhRGlyfS9zaGFwZWZpbGUvdG1wLWNoaW5hLW1hcml0aW1lL2NoaW5hLnNocGA7XG4gIGF3YWl0ICQuUGdTUUwuZ2V0UG9zdEdpcygpLmV4cG9ydFNoYXBlRmlsZShzaHBGaWxlbmFtZSwgJ2xvY2FsaG9zdCcsICdzZWxlY3QgaWQsIGdlb20gZnJvbSBncHMubWZ3IHdoZXJlIGlkID0gMScsICdnZW9tJyk7XG59KSgpOyJdfQ==