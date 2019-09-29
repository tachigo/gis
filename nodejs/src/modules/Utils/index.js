'use strict';

import Moment from 'moment';
import Fs from 'fs';
import Path from 'path';
import Os from 'os';
import JsonFile from 'jsonfile';


class Utils {

  static rootDir = Path.dirname(
    Path.dirname(__dirname)
  );

  static dataDir = Path.dirname(
    Path.dirname(
      Path.dirname(__dirname)
    )
  ) + '/data';

  static osHomeDir = Os.homedir();

  static async getConfiguration(key) {
    const configFilename = `${this.rootDir}/config/${key}.json`;
    let json = {};
    if (Fs.existsSync(configFilename)) {
      json = JsonFile.readFileSync(configFilename);
    } else {
      throw new Error(`配置文件 ${configFilename} 不存在`);
    }
    return json;
  }


  static depth = -1;

  static async call(desc, asyncFunc, args = []) {
    this.depth += 1;
    let indents = [''];
    if (this.depth !== 0) {
      indents = (new Array(this.depth)).fill('');
    }
    const beginTime = new Date().getTime();
    const beginDateTime = Moment(beginTime).format('YYYY-MM-DD HH:mm:ss');
    const startLog = `start ${desc} ...`;
    console.log(`[${beginDateTime}]`, ...indents, startLog);

    const ret = await asyncFunc(...args);

    const endTime = new Date().getTime();
    const endDateTime = Moment(endTime).format('YYYY-MM-DD HH:mm:ss');
    const costTime = endTime - beginTime;
    const finishLog = `final ${desc} => cost ${costTime / 1000} s`;
    console.log(`[${endDateTime}]`, ...indents, finishLog);
    this.depth -= 1;
    return ret;
  }

  static async log(...args) {
    const time = new Date().getTime();
    const dateTime = Moment(time).format('YYYY-MM-DD HH:mm:ss');
    args.unshift(`[${dateTime}]`);
    console.log(...args);
  }

  static async mkDir(dir) {
    try {
      if (!Fs.existsSync(dir)) {
        Fs.mkdirSync(dir);
      }
    } catch {
      await this.mkDir(Path.dirname(dir));
      await this.mkDir(dir);
    }
  }

  static async rmDir(dir) {
    if (!Fs.existsSync(dir)) {
      return;
    }
    try {
      Fs.unlinkSync(dir);
    } catch {
      Fs
        .readdirSync(dir)
        .forEach(async (file) => {
          const p = `${dir}/${file}`;
          if (Fs.statSync(p).isDirectory()) {
            await this.rmDir(p);
          } else {
            Fs.unlinkSync(p);
          }
        })
      ;
    }
  }
}

export default Utils;