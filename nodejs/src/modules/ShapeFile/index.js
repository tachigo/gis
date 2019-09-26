'use strict';

import * as SHP from 'shapefile';


class ShapeFile {

  static async readLine(shpFilename, dbfFilename, lineResolve) {
    return SHP.open(shpFilename, dbfFilename, {
        encoding: 'utf8'
      })
      .then(async (source) => {
        const line = async (result) => {
          if (!result.done) {
            await lineResolve(result);
            return await source.read().then(line);
          }
        };
        return await source.read().then(line);
      })
    ;
  }
}



export default ShapeFile;