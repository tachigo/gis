'use strict';

import $ from './../modules';

(async () => {
  // const shpFilename = `${$.Utils.dataDir}/shapefile/tmp-all-boundary/boundary.shp`;
  // await $.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select * from boundary.mfw', 'geom');
    const shpFilename = `${$.Utils.dataDir}/shapefile/mfw-all-boundary/boundary.shp`;
    await $.PgSQL.getPostGis().exportShapeFile(shpFilename, 'localhost', 'select zh_name, id, region_id, mdd_id, geom from boundary.mfw where parent_id = 0 or parent_id = 1 order by id asc', 'geom');
})();

// mapshaper '/Users/liuliwu/Documents/github.com/gis/nodejs/data/shapefile/mfw-all-boundary/boundary.shp' -simplify visvalingam 70% keep-shapes -o '/Users/liuliwu/Desktop/simplify70-mfw-boundary/boundary.shp'
//
// mapshaper '/Users/liuliwu/Desktop/simplify70-mfw-boundary/boundary.shp' -simplify visvalingam 70% keep-shapes -o '/Users/liuliwu/Desktop/simplify70-70-mfw-boundary/boundary.shp'
//
// mapshaper '/Users/liuliwu/Desktop/simplify70-70-mfw-boundary/boundary.shp' -simplify visvalingam 50% keep-shapes -o '/Users/liuliwu/Desktop/simplify70-70-50-mfw-boundary/boundary.shp'
//
// mapshaper '/Users/liuliwu/Desktop/simplify70-70-50-mfw-boundary/boundary.shp' -simplify visvalingam 50% keep-shapes -o '/Users/liuliwu/Desktop/simplify70-70-50-50-mfw-boundary/boundary.shp'
//
// mapshaper '/Users/liuliwu/Desktop/simplify70-70-50-50-mfw-boundary/boundary.shp' -simplify visvalingam 30% keep-shapes -o '/Users/liuliwu/Desktop/simplify70-70-50-50-30-mfw-boundary/boundary.shp'
//
// mapshaper '/Users/liuliwu/Desktop/simplify70-70-50-50-30-mfw-boundary/boundary.shp' -simplify visvalingam 10% keep-shapes -o '/Users/liuliwu/Desktop/simplify70-70-50-50-30-10-mfw-boundary/boundary.shp'