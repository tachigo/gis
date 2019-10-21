'use strict';

import Axios from 'axios';
import JsonFile from 'jsonfile';

import Utils from './../Utils';

const aMapKey = 'fc3a1a6cbfe82ef7055e5f8b26c04f60';


const http = Axios.create({
  baseURL: '',
  headers: {
    'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; 360SE)'
  }
});

class AMap {

  static async getAMapDistrictInfo(keyword, filter) {
    const districts = [];
    const params = {
      keywords: keyword,
      extensions: 'all',
      // level: 'district',
      s: 'rsv3',
      output: 'json',
      key: aMapKey
    };
    if (filter) {
      params['filter'] = filter;
    }
    const data = await http
      .get('https://restapi.amap.com/v3/config/district', {
        params
      })
      .then(res => {
        return res.data['districts'];
      })
    ;
    for await (const item of data) {
      districts.push(item);
    }
    return districts;
  }


  static async polyLine2GeoJson(polyLine = '') {
    const geoJson = {
      type: 'MultiPolygon'
    };
    if (polyLine) {
      const lines = polyLine.split('|');
      const paths = [];
      lines.forEach(line => {
        const points = line.split(';');
        const path = [];
        points.forEach(point => {
          const pointArr = point.split(',');
          const lat = +pointArr[0];
          const lon = +pointArr[1];
          path.push([lat, lon]);
        });
        paths.push([path]);
      });
      geoJson.coordinates = paths;
    } else {
      geoJson.coordinates = [];
    }
    return geoJson;
  }


  static async getProvinces(filterFallback, fallback) {
    const list = await JsonFile.readFileSync(`${__dirname}/provinces.json`);
    for await (const item of list) {
      const filter = await filterFallback(item);
      if (filter) {
        await Utils.call(`获取 [${item.name}] 数据`, this.getProvince.bind(this), [item, fallback]);
      }
    }
  }

  static async getProvince(item, fallback) {
    await fallback(item);
  }

  static async loadProvinces(fallback) {
    const list = await JsonFile.readFileSync(`${__dirname}/provinces.json`);
    for await (const item of list) {
      await Utils.call(`加载 [${item.name}] 数据`, this.loadProvince.bind(this), [item, fallback]);
    }
  }

  static async loadProvince(item, fallback) {
    const data = await this.getAMapDistrictInfo(item['name']);
    const feature = data[0];
    let polyLine = '';
    if (feature && feature.polyline) {
      polyLine = feature.polyline;
    }
    const geoJson = await this.polyLine2GeoJson(polyLine);

    // index, zhName, level, parentIndex, iso, geoJson
    const params = [item.id, feature.name, 2, 1, '', geoJson];
    await fallback(...params);
  }

  static async loadChina(fallback) {
    const data = await this.getAMapDistrictInfo('中国');
    const feature = data[0];
    let polyLine = '';
    if (feature && feature.polyline) {
      polyLine = feature.polyline;
    }
    const geoJson = await this.polyLine2GeoJson(polyLine);

    // index, zhName, level, parentIndex, iso, geoJson
    const params = [1, feature.name, 1, 0, 'CHN', geoJson];
    await fallback(...params);
  }
}


export default AMap;