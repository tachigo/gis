'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _xmlJs = _interopRequireDefault(require("xml-js"));

var _Utils = _interopRequireDefault(require("./../Utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class OSM {
  static async relationFull(osmIds) {
    const relations = {};

    for await (const osmId of osmIds) {
      await _Utils.default.log(`https://www.openstreetmap.org/api/0.6/relation/${osmId}/full`);
      relations[osmId] = await this.api.get(`/relation/${osmId}/full`).then(res => {
        const xml = res.data;
        return _xmlJs.default.xml2js(xml, {
          compact: true
        });
      });
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
          lat,
          lon
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
              geometry: geometry
            };
            result.push(item);
          }
        }
      }
    }

    return result;
  }

}

OSM.api = _axios.default.create({
  baseURL: 'https://www.openstreetmap.org/api/0.6',
  headers: {
    'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; 360SE)'
  }
});
var _default = OSM;
exports.default = _default;