'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibBoundary = _interopRequireDefault(require("./../03-boundary/LibBoundary"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const theId = 900096;
  const pg = await _modules.default.PgSQL.client('localhost');
  await _modules.default.Utils.call(`初始化外国边界数据`, _LibBoundary.default.initForeignBoundaries.bind(_LibBoundary.default), [pg, theId]);
  await _modules.default.Utils.call(`准备外国水域数据`, _LibBoundary.default.unionForeignWaterFeatures.bind(_LibBoundary.default), [pg, theId]);
  await _modules.default.Utils.call(`计算外国边界数据`, _LibBoundary.default.calcForeignBoundaries.bind(_LibBoundary.default), [pg, theId]);
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy96ei10b29scy8wMS1zcGVjLWJvdW5kYXJ5LmpzIl0sIm5hbWVzIjpbInRoZUlkIiwicGciLCIkIiwiUGdTUUwiLCJjbGllbnQiLCJVdGlscyIsImNhbGwiLCJMaWJCb3VuZGFyeSIsImluaXRGb3JlaWduQm91bmRhcmllcyIsImJpbmQiLCJ1bmlvbkZvcmVpZ25XYXRlckZlYXR1cmVzIiwiY2FsY0ZvcmVpZ25Cb3VuZGFyaWVzIiwicmVsZWFzZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBSUE7O0FBRUE7Ozs7QUFFQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxLQUFLLEdBQUcsTUFBZDtBQUVBLFFBQU1DLEVBQUUsR0FBRyxNQUFNQyxpQkFBRUMsS0FBRixDQUFRQyxNQUFSLENBQWUsV0FBZixDQUFqQjtBQUVBLFFBQU1GLGlCQUFFRyxLQUFGLENBQVFDLElBQVIsQ0FBYyxXQUFkLEVBQTBCQyxxQkFBWUMscUJBQVosQ0FBa0NDLElBQWxDLENBQXVDRixvQkFBdkMsQ0FBMUIsRUFBK0UsQ0FBQ04sRUFBRCxFQUFLRCxLQUFMLENBQS9FLENBQU47QUFDQSxRQUFNRSxpQkFBRUcsS0FBRixDQUFRQyxJQUFSLENBQWMsVUFBZCxFQUF5QkMscUJBQVlHLHlCQUFaLENBQXNDRCxJQUF0QyxDQUEyQ0Ysb0JBQTNDLENBQXpCLEVBQWtGLENBQUNOLEVBQUQsRUFBS0QsS0FBTCxDQUFsRixDQUFOO0FBQ0EsUUFBTUUsaUJBQUVHLEtBQUYsQ0FBUUMsSUFBUixDQUFjLFVBQWQsRUFBeUJDLHFCQUFZSSxxQkFBWixDQUFrQ0YsSUFBbEMsQ0FBdUNGLG9CQUF2QyxDQUF6QixFQUE4RSxDQUFDTixFQUFELEVBQUtELEtBQUwsQ0FBOUUsQ0FBTjtBQUVBLFFBQU1DLEVBQUUsQ0FBQ1csT0FBSCxFQUFOO0FBQ0QsQ0FWRCIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuXG5cbmltcG9ydCAkIGZyb20gJy4vLi4vLi4vbW9kdWxlcyc7XG5cbmltcG9ydCBMaWJCb3VuZGFyeSBmcm9tICcuLy4uLzAzLWJvdW5kYXJ5L0xpYkJvdW5kYXJ5JztcblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgdGhlSWQgPSA5MDAwOTY7XG5cbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLmNsaWVudCgnbG9jYWxob3N0Jyk7XG5cbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDliJ3lp4vljJblpJblm73ovrnnlYzmlbDmja5gLCBMaWJCb3VuZGFyeS5pbml0Rm9yZWlnbkJvdW5kYXJpZXMuYmluZChMaWJCb3VuZGFyeSksIFtwZywgdGhlSWRdKTtcbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDlh4blpIflpJblm73msLTln5/mlbDmja5gLCBMaWJCb3VuZGFyeS51bmlvbkZvcmVpZ25XYXRlckZlYXR1cmVzLmJpbmQoTGliQm91bmRhcnkpLCBbcGcsIHRoZUlkXSk7XG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg6K6h566X5aSW5Zu96L6555WM5pWw5o2uYCwgTGliQm91bmRhcnkuY2FsY0ZvcmVpZ25Cb3VuZGFyaWVzLmJpbmQoTGliQm91bmRhcnkpLCBbcGcsIHRoZUlkXSk7XG5cbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=