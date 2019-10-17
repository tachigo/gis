'use strict';

var _modules = _interopRequireDefault(require("./../../modules"));

var _LibFeature = _interopRequireDefault(require("./LibFeature"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// --max_old_space_size=16000
(async () => {
  const pg = await _modules.default.PgSQL.client('localhost');
  await _modules.default.Utils.call(`导入water feature`, async () => {
    const dataDir = `${_modules.default.Utils.dataDir}/shapefile/osm-data`;
    const shpFilename = `${dataDir}/water-polygons-split-4326/water_polygons.shp`;
    const dbfFilename = `${dataDir}/water-polygons-split-4326/water_polygons.dbf`;
    const pgTable = 'osm.feature_water';
    await _LibFeature.default.loadFromShapeFile(pg, shpFilename, dbfFilename, pgTable, 0, 0);
  });
  await pg.release();
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMC1vc20vMDUtZmVhdHVyZV93YXRlci5qcyJdLCJuYW1lcyI6WyJwZyIsIiQiLCJQZ1NRTCIsImNsaWVudCIsIlV0aWxzIiwiY2FsbCIsImRhdGFEaXIiLCJzaHBGaWxlbmFtZSIsImRiZkZpbGVuYW1lIiwicGdUYWJsZSIsIkxpYkZlYXR1cmUiLCJsb2FkRnJvbVNoYXBlRmlsZSIsInJlbGVhc2UiXSwibWFwcGluZ3MiOiJBQUFBOztBQUdBOztBQUVBOzs7O0FBRUE7QUFDQSxDQUFDLFlBQVk7QUFDWCxRQUFNQSxFQUFFLEdBQUcsTUFBTUMsaUJBQUVDLEtBQUYsQ0FBUUMsTUFBUixDQUFlLFdBQWYsQ0FBakI7QUFDQSxRQUFNRixpQkFBRUcsS0FBRixDQUFRQyxJQUFSLENBQWMsaUJBQWQsRUFBZ0MsWUFBWTtBQUNoRCxVQUFNQyxPQUFPLEdBQUksR0FBRUwsaUJBQUVHLEtBQUYsQ0FBUUUsT0FBUSxxQkFBbkM7QUFDQSxVQUFNQyxXQUFXLEdBQUksR0FBRUQsT0FBUSwrQ0FBL0I7QUFDQSxVQUFNRSxXQUFXLEdBQUksR0FBRUYsT0FBUSwrQ0FBL0I7QUFDQSxVQUFNRyxPQUFPLEdBQUcsbUJBQWhCO0FBRUEsVUFBTUMsb0JBQVdDLGlCQUFYLENBQTZCWCxFQUE3QixFQUFpQ08sV0FBakMsRUFBOENDLFdBQTlDLEVBQTJEQyxPQUEzRCxFQUFvRSxDQUFwRSxFQUF1RSxDQUF2RSxDQUFOO0FBRUQsR0FSSyxDQUFOO0FBU0EsUUFBTVQsRUFBRSxDQUFDWSxPQUFILEVBQU47QUFDRCxDQVpEIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5cbmltcG9ydCAkIGZyb20gJy4vLi4vLi4vbW9kdWxlcyc7XG5cbmltcG9ydCBMaWJGZWF0dXJlIGZyb20gJy4vTGliRmVhdHVyZSc7XG5cbi8vIC0tbWF4X29sZF9zcGFjZV9zaXplPTE2MDAwXG4oYXN5bmMgKCkgPT4ge1xuICBjb25zdCBwZyA9IGF3YWl0ICQuUGdTUUwuY2xpZW50KCdsb2NhbGhvc3QnKTtcbiAgYXdhaXQgJC5VdGlscy5jYWxsKGDlr7zlhaV3YXRlciBmZWF0dXJlYCwgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGRhdGFEaXIgPSBgJHskLlV0aWxzLmRhdGFEaXJ9L3NoYXBlZmlsZS9vc20tZGF0YWA7XG4gICAgY29uc3Qgc2hwRmlsZW5hbWUgPSBgJHtkYXRhRGlyfS93YXRlci1wb2x5Z29ucy1zcGxpdC00MzI2L3dhdGVyX3BvbHlnb25zLnNocGA7XG4gICAgY29uc3QgZGJmRmlsZW5hbWUgPSBgJHtkYXRhRGlyfS93YXRlci1wb2x5Z29ucy1zcGxpdC00MzI2L3dhdGVyX3BvbHlnb25zLmRiZmA7XG4gICAgY29uc3QgcGdUYWJsZSA9ICdvc20uZmVhdHVyZV93YXRlcic7XG5cbiAgICBhd2FpdCBMaWJGZWF0dXJlLmxvYWRGcm9tU2hhcGVGaWxlKHBnLCBzaHBGaWxlbmFtZSwgZGJmRmlsZW5hbWUsIHBnVGFibGUsIDAsIDApO1xuXG4gIH0pO1xuICBhd2FpdCBwZy5yZWxlYXNlKCk7XG59KSgpOyJdfQ==