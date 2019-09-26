'use strict';

import Axios from 'axios';
import XmlJs from 'xml-js';
import Utils from './../Utils';

import CountryTree from './CountryTree';

class OSM {

  static api = Axios.create({
    baseURL: 'https://www.openstreetmap.org/api/0.6',
    headers: {
      'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; 360SE)'
    }
  });

  static getCountryTree() {
    return CountryTree;
  }

  static async relationFull(osmIds) {
    const relations = {};
    for await (const osmId of osmIds) {
      await Utils.log(`https://www.openstreetmap.org/api/0.6/relation/${osmId}/full`);
      relations[osmId] = await this.api.get(`/relation/${osmId}/full`)
        .then(res => {
          const xml = res.data;
          return XmlJs.xml2js(xml, {
            compact: true
          });
        })
      ;
    }
    return relations;
  }


  static async relationWays(osmId, osmXmlObj) {
    const nodeList = osmXmlObj['osm']['node'];
    const nodes = {};
    for await (const node of nodeList) {
      const attr = node['_attributes'];
      const lat = +attr['lat'];
      const lon = +attr['lon'];
      const nodeId = +attr['id'];
      if (!nodes[nodeId]) {
        nodes[nodeId] = {
          lat, lon
        };
      }
    }

    let wayList;
    if (Array.isArray(osmXmlObj['osm']['way'])) {
      wayList = osmXmlObj['osm']['way'];
    } else {
      wayList = [osmXmlObj['osm']['way']];
    }
    const ways = {};
    for await (const way of wayList) {
      const attr = way['_attributes'];
      const wayId = +attr['id'];
      const nds = way['nd'];
      const lineString = [];
      for await (const nd of nds) {
        const ndId = nd['_attributes']['ref'];
        const node = nodes[ndId] || {};
        if (node) {
          lineString.push([node.lon, node.lat]);
        }
      }
      ways[wayId] = {
        type: 'LineString',
        coordinates: lineString
      };
    }
    const result = [];
    let relationList;
    if (Array.isArray(osmXmlObj['osm']['relation'])) {
      relationList = osmXmlObj['osm']['relation'];
    } else {
      relationList = [osmXmlObj['osm']['relation']];
    }
    for await (const relation of relationList) {
      const attr = relation['_attributes'];
      const relationId = +attr['id'];
      if (relationId === +osmId) {
        let memberList;
        if (Array.isArray(relation['member'])) {
          memberList = relation['member'];
        } else {
          memberList = [relation['member']];
        }
        for await (const member of memberList) {
          const attr = member['_attributes'];
          const type = attr['type'];
          const role = attr['role'];
          if (type === 'way') {
            const wayId = attr['ref'];
            const geometry = ways[wayId];
            const item = {
              relation: relationId,
              way: wayId,
              role: role,
              geometry: geometry,
            };
            result.push(item);
          }
        }
      }
    }
    return result;
  }
}



export default OSM;