'use strict';


// --max_old_space_size=16000

import $ from './../../modules';
import WKT from 'terraformer-wkt-parser';

const dataDir = `${$.Utils.osHomeDir}/Documents/data/osm-data`;

const pgFeatureLandTableName = 'osm.feature_land';
const osmFeatureLandShpFilename = `${dataDir}/land-polygons-split-4326/land_polygons.shp`;
const osmFeatureLandDbfFilename = `${dataDir}/land-polygons-split-4326/land_polygons.dbf`;

const pgFeatureCoastlineTableName = 'osm.feature_coastline';
const osmFeatureCoastlineShpFilename = `${dataDir}/coastlines-split-4326/lines.shp`;
const osmFeatureCoastlineDbfFilename = `${dataDir}/coastlines-split-4326/lines.dbf`;

const pgFeatureWaterTableName = 'osm.feature_water';
const osmFeatureWaterShpFilename = `${dataDir}/water-polygons-split-4326/water_polygons.shp`;
const osmFeatureWaterDbfFilename = `${dataDir}/water-polygons-split-4326/water_polygons.dbf`;


const parseShpFile = async (pg, shpFilename, dbfFilename, pgTableName, fromId, toId) => {
  let id = 0;
  const lineResolve = async (result) => {
    id += 1;
    // id ∈ [fromId, toId]
    if (id >= fromId && (!toId || id <= toId)) {
      const geometry = WKT.convert(result.value.geometry);
      const startTime = (new Date()).getTime(); // 计时
      const sql = `insert into ${pgTableName} (id, geom) 
      values ($1::bigint, ST_Multi(ST_GeomFromText($2, 4326))::geometry) 
      on conflict (id) do update 
      set geom = excluded.geom`;
      const params = [id, geometry];
      await pg.query(sql, params)
        .catch(e => {
          console.log(sql);
          throw e;
        })
      ;
      const endTime = (new Date()).getTime();
      const costTime = endTime - startTime;
      await $.Utils.log(`${pgTableName}#${id} cost ... ${costTime / 1000} s`);
    }
  };
  await $.ShapeFile.readLine(shpFilename, dbfFilename, lineResolve);
};



(async () => {
  const pg = await $.PgSQL.pool('localhost');

  // 导入陆地数据
  await $.Utils.call(
    `load shp file data to ${pgFeatureLandTableName}`,
    parseShpFile,
    [pg, osmFeatureLandShpFilename, osmFeatureLandDbfFilename, pgFeatureLandTableName, 0, 0]
  );

  // 导入海岸线数据
  await $.Utils.call(
    `load shp file data to ${pgFeatureCoastlineTableName}`,
    parseShpFile,
    [pg, osmFeatureCoastlineShpFilename, osmFeatureCoastlineDbfFilename, pgFeatureCoastlineTableName, 0, 0]
  );

  // 导入海域数据
  await $.Utils.call(
    `load shp file data to ${pgFeatureWaterTableName}`,
    parseShpFile,
    [pg, osmFeatureWaterShpFilename, osmFeatureWaterDbfFilename, pgFeatureWaterTableName, 0, 0]
  );
})();