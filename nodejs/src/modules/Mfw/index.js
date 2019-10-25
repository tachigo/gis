'use strict';

import RegionRestful from './RegionRestful';
import MapProcessor from './MapProcessor';

class Mfw {

  static getRegionRestFul() {
    return RegionRestful;
  }

  static getMapProcessor() {
    return MapProcessor;
  }
}


export default Mfw;