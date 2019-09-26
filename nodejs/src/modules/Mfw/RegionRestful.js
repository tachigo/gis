'use strict';

import Axios from 'axios';

const http = Axios.create({
  baseURL: 'http://www.mafengwo.cn/rest/region',
  headers: {
    'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; 360SE)'
  }
});

class RegionRestful {

  static async getRegionInfo(regionId) {
    const result = await http.get(`/item/${regionId}`)
      .then(res => {
        return res.data || {};
      })
    ;
    return result.data || {};
  }
}

export default RegionRestful;