'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const shpFilename = `${_modules.default.Utils.dataDir}/shapefile/tmp-china-province/gps.shp`;
  const id = 16;

  if (id === 0) {
    await _modules.default.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from gps.world where id > 10 and id < 50', 'geom');
  } else {
    await _modules.default.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', `select * from gps.world where id = ${id}`, 'geom');
  }
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wNC1jaGluYS1wcm92aW5jZS8wMS1leHBvcnQtZ3BzLXdvcmxkLmpzIl0sIm5hbWVzIjpbInNocEZpbGVuYW1lIiwiJCIsIlV0aWxzIiwiZGF0YURpciIsImlkIiwiUGdTUUwiLCJnZXRQb3N0R2lzIiwiZXhwb3J0U2hhcGVGaWxlIl0sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTs7OztBQUVBLENBQUMsWUFBWTtBQUNYLFFBQU1BLFdBQVcsR0FBSSxHQUFFQyxpQkFBRUMsS0FBRixDQUFRQyxPQUFRLHVDQUF2QztBQUNBLFFBQU1DLEVBQUUsR0FBRyxFQUFYOztBQUNBLE1BQUlBLEVBQUUsS0FBSyxDQUFYLEVBQWM7QUFDWixVQUFNSCxpQkFBRUksS0FBRixDQUFRQyxVQUFSLEdBQXFCQyxlQUFyQixDQUFxQ1AsV0FBckMsRUFBa0QsV0FBbEQsRUFBK0QsbURBQS9ELEVBQW9ILE1BQXBILENBQU47QUFDRCxHQUZELE1BRU87QUFDTCxVQUFNQyxpQkFBRUksS0FBRixDQUFRQyxVQUFSLEdBQXFCQyxlQUFyQixDQUFxQ1AsV0FBckMsRUFBa0QsV0FBbEQsRUFBZ0Usc0NBQXFDSSxFQUFHLEVBQXhHLEVBQTJHLE1BQTNHLENBQU47QUFDRDtBQUNGLENBUkQiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCAkIGZyb20gJy4vLi4vLi4vbW9kdWxlcyc7XG5cbihhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHNocEZpbGVuYW1lID0gYCR7JC5VdGlscy5kYXRhRGlyfS9zaGFwZWZpbGUvdG1wLWNoaW5hLXByb3ZpbmNlL2dwcy5zaHBgO1xuICBjb25zdCBpZCA9IDE2O1xuICBpZiAoaWQgPT09IDApIHtcbiAgICBhd2FpdCAkLlBnU1FMLmdldFBvc3RHaXMoKS5leHBvcnRTaGFwZUZpbGUoc2hwRmlsZW5hbWUsICdsb2NhbGhvc3QnLCAnc2VsZWN0ICogZnJvbSBncHMud29ybGQgd2hlcmUgaWQgPiAxMCBhbmQgaWQgPCA1MCcsICdnZW9tJyk7XG4gIH0gZWxzZSB7XG4gICAgYXdhaXQgJC5QZ1NRTC5nZXRQb3N0R2lzKCkuZXhwb3J0U2hhcGVGaWxlKHNocEZpbGVuYW1lLCAnbG9jYWxob3N0JywgYHNlbGVjdCAqIGZyb20gZ3BzLndvcmxkIHdoZXJlIGlkID0gJHtpZH1gLCAnZ2VvbScpO1xuICB9XG59KSgpOyJdfQ==