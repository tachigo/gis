'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var SHP = _interopRequireWildcard(require("shapefile"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; if (obj != null) { var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

class ShapeFile {
  static async readLine(shpFilename, dbfFilename, lineResolve) {
    return SHP.open(shpFilename, dbfFilename, {
      encoding: 'utf8'
    }).then(async source => {
      const line = async result => {
        if (!result.done) {
          await lineResolve(result);
          return await source.read().then(line);
        }
      };

      return await source.read().then(line);
    });
  }

}

var _default = ShapeFile;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9tb2R1bGVzL1NoYXBlRmlsZS9pbmRleC5qcyJdLCJuYW1lcyI6WyJTaGFwZUZpbGUiLCJyZWFkTGluZSIsInNocEZpbGVuYW1lIiwiZGJmRmlsZW5hbWUiLCJsaW5lUmVzb2x2ZSIsIlNIUCIsIm9wZW4iLCJlbmNvZGluZyIsInRoZW4iLCJzb3VyY2UiLCJsaW5lIiwicmVzdWx0IiwiZG9uZSIsInJlYWQiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBRUE7Ozs7OztBQUdBLE1BQU1BLFNBQU4sQ0FBZ0I7QUFFZCxlQUFhQyxRQUFiLENBQXNCQyxXQUF0QixFQUFtQ0MsV0FBbkMsRUFBZ0RDLFdBQWhELEVBQTZEO0FBQzNELFdBQU9DLEdBQUcsQ0FBQ0MsSUFBSixDQUFTSixXQUFULEVBQXNCQyxXQUF0QixFQUFtQztBQUN0Q0ksTUFBQUEsUUFBUSxFQUFFO0FBRDRCLEtBQW5DLEVBR0pDLElBSEksQ0FHQyxNQUFPQyxNQUFQLElBQWtCO0FBQ3RCLFlBQU1DLElBQUksR0FBRyxNQUFPQyxNQUFQLElBQWtCO0FBQzdCLFlBQUksQ0FBQ0EsTUFBTSxDQUFDQyxJQUFaLEVBQWtCO0FBQ2hCLGdCQUFNUixXQUFXLENBQUNPLE1BQUQsQ0FBakI7QUFDQSxpQkFBTyxNQUFNRixNQUFNLENBQUNJLElBQVAsR0FBY0wsSUFBZCxDQUFtQkUsSUFBbkIsQ0FBYjtBQUNEO0FBQ0YsT0FMRDs7QUFNQSxhQUFPLE1BQU1ELE1BQU0sQ0FBQ0ksSUFBUCxHQUFjTCxJQUFkLENBQW1CRSxJQUFuQixDQUFiO0FBQ0QsS0FYSSxDQUFQO0FBYUQ7O0FBaEJhOztlQXdCRFYsUyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICogYXMgU0hQIGZyb20gJ3NoYXBlZmlsZSc7XG5cblxuY2xhc3MgU2hhcGVGaWxlIHtcblxuICBzdGF0aWMgYXN5bmMgcmVhZExpbmUoc2hwRmlsZW5hbWUsIGRiZkZpbGVuYW1lLCBsaW5lUmVzb2x2ZSkge1xuICAgIHJldHVybiBTSFAub3BlbihzaHBGaWxlbmFtZSwgZGJmRmlsZW5hbWUsIHtcbiAgICAgICAgZW5jb2Rpbmc6ICd1dGY4J1xuICAgICAgfSlcbiAgICAgIC50aGVuKGFzeW5jIChzb3VyY2UpID0+IHtcbiAgICAgICAgY29uc3QgbGluZSA9IGFzeW5jIChyZXN1bHQpID0+IHtcbiAgICAgICAgICBpZiAoIXJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgICBhd2FpdCBsaW5lUmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHNvdXJjZS5yZWFkKCkudGhlbihsaW5lKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBhd2FpdCBzb3VyY2UucmVhZCgpLnRoZW4obGluZSk7XG4gICAgICB9KVxuICAgIDtcbiAgfVxuXG5cblxufVxuXG5cblxuZXhwb3J0IGRlZmF1bHQgU2hhcGVGaWxlOyJdfQ==