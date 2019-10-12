'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const http = _axios.default.create({
  baseURL: 'http://www.mafengwo.cn/rest/region',
  headers: {
    'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; 360SE)'
  }
});

class RegionRestful {
  static async getRegionInfo(regionId) {
    const result = await http.get(`/item/${regionId}`).then(res => {
      return res.data || {};
    });
    return result.data || {};
  }

}

var _default = RegionRestful;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2R1bGVzL01mdy9SZWdpb25SZXN0ZnVsLmpzIl0sIm5hbWVzIjpbImh0dHAiLCJBeGlvcyIsImNyZWF0ZSIsImJhc2VVUkwiLCJoZWFkZXJzIiwiUmVnaW9uUmVzdGZ1bCIsImdldFJlZ2lvbkluZm8iLCJyZWdpb25JZCIsInJlc3VsdCIsImdldCIsInRoZW4iLCJyZXMiLCJkYXRhIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQUVBOzs7O0FBRUEsTUFBTUEsSUFBSSxHQUFHQyxlQUFNQyxNQUFOLENBQWE7QUFDeEJDLEVBQUFBLE9BQU8sRUFBRSxvQ0FEZTtBQUV4QkMsRUFBQUEsT0FBTyxFQUFFO0FBQ1Asa0JBQWM7QUFEUDtBQUZlLENBQWIsQ0FBYjs7QUFPQSxNQUFNQyxhQUFOLENBQW9CO0FBRWxCLGVBQWFDLGFBQWIsQ0FBMkJDLFFBQTNCLEVBQXFDO0FBQ25DLFVBQU1DLE1BQU0sR0FBRyxNQUFNUixJQUFJLENBQUNTLEdBQUwsQ0FBVSxTQUFRRixRQUFTLEVBQTNCLEVBQ2xCRyxJQURrQixDQUNiQyxHQUFHLElBQUk7QUFDWCxhQUFPQSxHQUFHLENBQUNDLElBQUosSUFBWSxFQUFuQjtBQUNELEtBSGtCLENBQXJCO0FBS0EsV0FBT0osTUFBTSxDQUFDSSxJQUFQLElBQWUsRUFBdEI7QUFDRDs7QUFUaUI7O2VBWUxQLGEiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBBeGlvcyBmcm9tICdheGlvcyc7XG5cbmNvbnN0IGh0dHAgPSBBeGlvcy5jcmVhdGUoe1xuICBiYXNlVVJMOiAnaHR0cDovL3d3dy5tYWZlbmd3by5jbi9yZXN0L3JlZ2lvbicsXG4gIGhlYWRlcnM6IHtcbiAgICAnVXNlci1BZ2VudCc6ICdNb3ppbGxhLzQuMCAoY29tcGF0aWJsZTsgTVNJRSA3LjA7IFdpbmRvd3MgTlQgNS4xOyAzNjBTRSknXG4gIH1cbn0pO1xuXG5jbGFzcyBSZWdpb25SZXN0ZnVsIHtcblxuICBzdGF0aWMgYXN5bmMgZ2V0UmVnaW9uSW5mbyhyZWdpb25JZCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGh0dHAuZ2V0KGAvaXRlbS8ke3JlZ2lvbklkfWApXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICByZXR1cm4gcmVzLmRhdGEgfHwge307XG4gICAgICB9KVxuICAgIDtcbiAgICByZXR1cm4gcmVzdWx0LmRhdGEgfHwge307XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUmVnaW9uUmVzdGZ1bDsiXX0=