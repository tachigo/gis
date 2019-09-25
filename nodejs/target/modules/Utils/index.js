'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _moment = _interopRequireDefault(require("moment"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Utils {
  static async call(desc, asyncFunc, args = []) {
    const beginTime = new Date().getTime();
    const beginDateTime = (0, _moment.default)(beginTime).format('YYYY-MM-DD HH:mm:ss');
    const startLog = `start ${desc} ...`;
    console.log(`[${beginDateTime}]`, startLog);
    const ret = await asyncFunc(...args);
    const endTime = new Date().getTime();
    const endDateTime = (0, _moment.default)(endTime).format('YYYY-MM-DD HH:mm:ss');
    const costTime = endTime - beginTime;
    const finishLog = `final ${desc} => cost ${costTime / 1000} s`;
    console.log(`[${endDateTime}]`, finishLog);
    return ret;
  }

  static async log(...args) {
    const time = new Date().getTime();
    const dateTime = (0, _moment.default)(time).format('YYYY-MM-DD HH:mm:ss');
    args.unshift(`[${dateTime}]`);
    console.log(...args);
  }

  static async mkDir(dir) {
    try {
      if (!_fs.default.existsSync(dir)) {
        _fs.default.mkdirSync(dir);
      }
    } catch {
      await this.mkDir(_path.default.dirname(dir));
      await this.mkDir(dir);
    }
  }

  static async rmDir(dir) {
    if (!_fs.default.existsSync(dir)) {
      return;
    }

    try {
      _fs.default.unlinkSync(dir);
    } catch {
      _fs.default.readdirSync(dir).forEach(async file => {
        const p = `${dir}/${file}`;

        if (_fs.default.statSync(p).isDirectory()) {
          await this.rmDir(p);
        } else {
          _fs.default.unlinkSync(p);
        }
      });
    }
  }

}

Utils.rootDir = _path.default.dirname(_path.default.dirname(__dirname));
var _default = Utils;
exports.default = _default;