'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibOSM = _interopRequireDefault(require("./../00-osm/LibOSM"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(async () => {
  const theId = 900253;
  const pg = await _modules.default.PgSQL.pool('localhost');
  await _modules.default.Utils.call(`遍历OSM 国家树`, _LibOSM.default.relationWay.bind(_LibOSM.default), [pg, theId]);
  await _modules.default.Utils.call(`导出Relation Way`, _LibOSM.default.relationDump.bind(_LibOSM.default), [pg, theId]);
  await _modules.default.Utils.call(`聚合Relation`, _LibOSM.default.relationAggregate.bind(_LibOSM.default), [pg, theId]);
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy96ei10b29scy8wMC1zcGVjLW9zbS5qcyJdLCJuYW1lcyI6WyJ0aGVJZCIsInBnIiwiJCIsIlBnU1FMIiwicG9vbCIsIlV0aWxzIiwiY2FsbCIsIkxpYk9TTSIsInJlbGF0aW9uV2F5IiwiYmluZCIsInJlbGF0aW9uRHVtcCIsInJlbGF0aW9uQWdncmVnYXRlIiwicmVsZWFzZSJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBR0E7O0FBRUE7Ozs7QUFFQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxLQUFLLEdBQUcsTUFBZDtBQUVBLFFBQU1DLEVBQUUsR0FBRyxNQUFNQyxpQkFBRUMsS0FBRixDQUFRQyxJQUFSLENBQWEsV0FBYixDQUFqQjtBQUNBLFFBQU1GLGlCQUFFRyxLQUFGLENBQVFDLElBQVIsQ0FBYyxXQUFkLEVBQTBCQyxnQkFBT0MsV0FBUCxDQUFtQkMsSUFBbkIsQ0FBd0JGLGVBQXhCLENBQTFCLEVBQTJELENBQUNOLEVBQUQsRUFBS0QsS0FBTCxDQUEzRCxDQUFOO0FBQ0EsUUFBTUUsaUJBQUVHLEtBQUYsQ0FBUUMsSUFBUixDQUFjLGdCQUFkLEVBQStCQyxnQkFBT0csWUFBUCxDQUFvQkQsSUFBcEIsQ0FBeUJGLGVBQXpCLENBQS9CLEVBQWlFLENBQUNOLEVBQUQsRUFBS0QsS0FBTCxDQUFqRSxDQUFOO0FBQ0EsUUFBTUUsaUJBQUVHLEtBQUYsQ0FBUUMsSUFBUixDQUFjLFlBQWQsRUFBMkJDLGdCQUFPSSxpQkFBUCxDQUF5QkYsSUFBekIsQ0FBOEJGLGVBQTlCLENBQTNCLEVBQWtFLENBQUNOLEVBQUQsRUFBS0QsS0FBTCxDQUFsRSxDQUFOO0FBQ0EsUUFBTUMsRUFBRSxDQUFDVyxPQUFILEVBQU47QUFDRCxDQVJEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5cbmltcG9ydCAkIGZyb20gJy4vLi4vLi4vbW9kdWxlcyc7XG5cbmltcG9ydCBMaWJPU00gZnJvbSAnLi8uLi8wMC1vc20vTGliT1NNJztcblxuKGFzeW5jICgpID0+IHtcbiAgY29uc3QgdGhlSWQgPSA5MDAyNTM7XG5cbiAgY29uc3QgcGcgPSBhd2FpdCAkLlBnU1FMLnBvb2woJ2xvY2FsaG9zdCcpO1xuICBhd2FpdCAkLlV0aWxzLmNhbGwoYOmBjeWOhk9TTSDlm73lrrbmoJFgLCBMaWJPU00ucmVsYXRpb25XYXkuYmluZChMaWJPU00pLCBbcGcsIHRoZUlkXSk7XG4gIGF3YWl0ICQuVXRpbHMuY2FsbChg5a+85Ye6UmVsYXRpb24gV2F5YCwgTGliT1NNLnJlbGF0aW9uRHVtcC5iaW5kKExpYk9TTSksIFtwZywgdGhlSWRdKTtcbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDogZrlkIhSZWxhdGlvbmAsIExpYk9TTS5yZWxhdGlvbkFnZ3JlZ2F0ZS5iaW5kKExpYk9TTSksIFtwZywgdGhlSWRdKTtcbiAgYXdhaXQgcGcucmVsZWFzZSgpO1xufSkoKTsiXX0=