'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _modules = _interopRequireDefault(require("../../modules"));

var _terraformerWktParser = _interopRequireDefault(require("terraformer-wkt-parser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class LibFeature {
  static async loadFromShapeFile(pg, shpFilename, dbfFilename, pgTableName, fromId, toId) {
    let id = 0;

    const lineResolve = async result => {
      id += 1; // id ∈ [fromId, toId]

      if (id >= fromId && (!toId || id <= toId)) {
        const geometry = _terraformerWktParser.default.convert(result.value.geometry);

        const startTime = new Date().getTime(); // 计时

        const sql = `insert into ${pgTableName} (id, geom) 
        values ($1::bigint, ST_Multi(ST_GeomFromText($2, 4326))::geometry) 
        on conflict (id) do update 
        set geom = excluded.geom`;
        const params = [id, geometry];
        await pg.query(sql, params).catch(e => {
          console.log(sql);
          throw e;
        });
        const endTime = new Date().getTime();
        const costTime = endTime - startTime;
        await _modules.default.Utils.log(`${pgTableName}#${id} cost ... ${costTime / 1000} s`);
      }
    };

    await _modules.default.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);
  }

}

var _default = LibFeature;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMC1vc20vTGliRmVhdHVyZS5qcyJdLCJuYW1lcyI6WyJMaWJGZWF0dXJlIiwibG9hZEZyb21TaGFwZUZpbGUiLCJwZyIsInNocEZpbGVuYW1lIiwiZGJmRmlsZW5hbWUiLCJwZ1RhYmxlTmFtZSIsImZyb21JZCIsInRvSWQiLCJpZCIsImxpbmVSZXNvbHZlIiwicmVzdWx0IiwiZ2VvbWV0cnkiLCJXS1QiLCJjb252ZXJ0IiwidmFsdWUiLCJzdGFydFRpbWUiLCJEYXRlIiwiZ2V0VGltZSIsInNxbCIsInBhcmFtcyIsInF1ZXJ5IiwiY2F0Y2giLCJlIiwiY29uc29sZSIsImxvZyIsImVuZFRpbWUiLCJjb3N0VGltZSIsIiQiLCJVdGlscyIsIlNoYXBlRmlsZSIsInJlYWRMaW5lIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQUVBOztBQUNBOzs7O0FBR0EsTUFBTUEsVUFBTixDQUFpQjtBQUVmLGVBQWFDLGlCQUFiLENBQStCQyxFQUEvQixFQUFtQ0MsV0FBbkMsRUFBZ0RDLFdBQWhELEVBQTZEQyxXQUE3RCxFQUEwRUMsTUFBMUUsRUFBa0ZDLElBQWxGLEVBQXdGO0FBQ3RGLFFBQUlDLEVBQUUsR0FBRyxDQUFUOztBQUNBLFVBQU1DLFdBQVcsR0FBRyxNQUFPQyxNQUFQLElBQWtCO0FBQ3BDRixNQUFBQSxFQUFFLElBQUksQ0FBTixDQURvQyxDQUVwQzs7QUFDQSxVQUFJQSxFQUFFLElBQUlGLE1BQU4sS0FBaUIsQ0FBQ0MsSUFBRCxJQUFTQyxFQUFFLElBQUlELElBQWhDLENBQUosRUFBMkM7QUFDekMsY0FBTUksUUFBUSxHQUFHQyw4QkFBSUMsT0FBSixDQUFZSCxNQUFNLENBQUNJLEtBQVAsQ0FBYUgsUUFBekIsQ0FBakI7O0FBQ0EsY0FBTUksU0FBUyxHQUFJLElBQUlDLElBQUosRUFBRCxDQUFhQyxPQUFiLEVBQWxCLENBRnlDLENBRUM7O0FBQzFDLGNBQU1DLEdBQUcsR0FBSSxlQUFjYixXQUFZOzs7aUNBQXZDO0FBSUEsY0FBTWMsTUFBTSxHQUFHLENBQUNYLEVBQUQsRUFBS0csUUFBTCxDQUFmO0FBQ0EsY0FBTVQsRUFBRSxDQUFDa0IsS0FBSCxDQUFTRixHQUFULEVBQWNDLE1BQWQsRUFDSEUsS0FERyxDQUNHQyxDQUFDLElBQUk7QUFDVkMsVUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlOLEdBQVo7QUFDQSxnQkFBTUksQ0FBTjtBQUNELFNBSkcsQ0FBTjtBQU1BLGNBQU1HLE9BQU8sR0FBSSxJQUFJVCxJQUFKLEVBQUQsQ0FBYUMsT0FBYixFQUFoQjtBQUNBLGNBQU1TLFFBQVEsR0FBR0QsT0FBTyxHQUFHVixTQUEzQjtBQUNBLGNBQU1ZLGlCQUFFQyxLQUFGLENBQVFKLEdBQVIsQ0FBYSxHQUFFbkIsV0FBWSxJQUFHRyxFQUFHLGFBQVlrQixRQUFRLEdBQUcsSUFBSyxJQUE3RCxDQUFOO0FBQ0Q7QUFDRixLQXJCRDs7QUFzQkEsVUFBTUMsaUJBQUVFLFNBQUYsQ0FBWUMsUUFBWixDQUFxQjNCLFdBQXJCLEVBQWtDQyxXQUFsQyxFQUErQ0ssV0FBL0MsQ0FBTjtBQUNEOztBQTNCYzs7ZUErQkZULFUiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCAkIGZyb20gXCIuLi8uLi9tb2R1bGVzXCI7XG5pbXBvcnQgV0tUIGZyb20gXCJ0ZXJyYWZvcm1lci13a3QtcGFyc2VyXCI7XG5cblxuY2xhc3MgTGliRmVhdHVyZSB7XG5cbiAgc3RhdGljIGFzeW5jIGxvYWRGcm9tU2hhcGVGaWxlKHBnLCBzaHBGaWxlbmFtZSwgZGJmRmlsZW5hbWUsIHBnVGFibGVOYW1lLCBmcm9tSWQsIHRvSWQpIHtcbiAgICBsZXQgaWQgPSAwO1xuICAgIGNvbnN0IGxpbmVSZXNvbHZlID0gYXN5bmMgKHJlc3VsdCkgPT4ge1xuICAgICAgaWQgKz0gMTtcbiAgICAgIC8vIGlkIOKIiCBbZnJvbUlkLCB0b0lkXVxuICAgICAgaWYgKGlkID49IGZyb21JZCAmJiAoIXRvSWQgfHwgaWQgPD0gdG9JZCkpIHtcbiAgICAgICAgY29uc3QgZ2VvbWV0cnkgPSBXS1QuY29udmVydChyZXN1bHQudmFsdWUuZ2VvbWV0cnkpO1xuICAgICAgICBjb25zdCBzdGFydFRpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpOyAvLyDorqHml7ZcbiAgICAgICAgY29uc3Qgc3FsID0gYGluc2VydCBpbnRvICR7cGdUYWJsZU5hbWV9IChpZCwgZ2VvbSkgXG4gICAgICAgIHZhbHVlcyAoJDE6OmJpZ2ludCwgU1RfTXVsdGkoU1RfR2VvbUZyb21UZXh0KCQyLCA0MzI2KSk6Omdlb21ldHJ5KSBcbiAgICAgICAgb24gY29uZmxpY3QgKGlkKSBkbyB1cGRhdGUgXG4gICAgICAgIHNldCBnZW9tID0gZXhjbHVkZWQuZ2VvbWA7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IFtpZCwgZ2VvbWV0cnldO1xuICAgICAgICBhd2FpdCBwZy5xdWVyeShzcWwsIHBhcmFtcylcbiAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhzcWwpO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9KVxuICAgICAgICA7XG4gICAgICAgIGNvbnN0IGVuZFRpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICBjb25zdCBjb3N0VGltZSA9IGVuZFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICAgIGF3YWl0ICQuVXRpbHMubG9nKGAke3BnVGFibGVOYW1lfSMke2lkfSBjb3N0IC4uLiAke2Nvc3RUaW1lIC8gMTAwMH0gc2ApO1xuICAgICAgfVxuICAgIH07XG4gICAgYXdhaXQgJC5TaGFwZUZpbGUucmVhZExpbmUoc2hwRmlsZW5hbWUsIGRiZkZpbGVuYW1lLCBsaW5lUmVzb2x2ZSk7XG4gIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBMaWJGZWF0dXJlOyJdfQ==