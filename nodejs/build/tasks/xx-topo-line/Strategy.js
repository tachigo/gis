'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _LibTopoLine = _interopRequireDefault(require("./LibTopoLine"));

var _pad = _interopRequireDefault(require("pad"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }

var id = 0;

function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }

class Strategy {
  /**
   * @var LibTopoLine
   */
  constructor(topologyLevel, pg) {
    Object.defineProperty(this, _topologyLevel, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _topology, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _pg, {
      writable: true,
      value: void 0
    });
    _classPrivateFieldLooseBase(this, _topologyLevel)[_topologyLevel] = topologyLevel;
    _classPrivateFieldLooseBase(this, _pg)[_pg] = pg;
    _classPrivateFieldLooseBase(this, _topology)[_topology] = this.getTopology();
  }
  /**
   * @returns {LibTopoLine}
   */


  getTopology() {
    const levelNumber = (0, _pad.default)(2, _classPrivateFieldLooseBase(this, _topologyLevel)[_topologyLevel], '0');
    const lineDumpSchema = 'topo';
    const lineDumpTable = `lv${levelNumber}_line_dump`;
    const lineTopoSchema = 'topo';
    const lineTopoTable = `lv${levelNumber}_line_topo`;
    return new _LibTopoLine.default(lineDumpSchema, lineDumpTable, lineTopoSchema, lineTopoTable);
  }

  async dumpInit() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].initDumpTable(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

  async loadBoundaryList(asyncFallback) {
    const table = 'boundary.mfw';
    const limit = 100;
    let count;
    let startId = 0;

    const level = _classPrivateFieldLooseBase(this, _topologyLevel)[_topologyLevel];

    let sql;

    if (level <= 1) {
      sql = `select id, zh_name from ${table} where id > $1 and level::integer <= 1 order by id asc limit ${limit}`;
    } else if (level === 2) {
      sql = `select id, zh_name from ${table} where id > $1 and ((id >= 1 and id < 50) or id > 900000) and level::integer <= 2 order by id asc limit ${limit}`;
    } else if (level === 3) {
      sql = `select id, zh_name from ${table} where id > $1 and level::integer <= 2 order by id asc limit ${limit}`;
    } else {
      throw new Error('topology level out of range');
    }

    do {
      const rows = await _classPrivateFieldLooseBase(this, _pg)[_pg].query(sql, [startId]).then(res => {
        return res.rows || [];
      });
      let nextId = 0;
      count = rows.length;

      for await (const row of rows) {
        await asyncFallback(+row['id'], row['zh_name']);
        nextId = +row['id'];
      }

      console.log(`finish load boundary.mfw from #${startId} to #${nextId}`);
      startId = nextId;
    } while (count > 0);
  }

  async loadLineList(id, asyncFallback) {
    const table = 'boundary.line';
    const sql = `select id, type, category from ${table} where id = $1`;
    const rows = await _classPrivateFieldLooseBase(this, _pg)[_pg].query(sql, [id]).then(res => {
      return res.rows || [];
    });

    for await (const row of rows) {
      await asyncFallback(+row['id'], row['type'], row['category']);
    }
  }

  async dumpLines(id, type, category, maxVerticesNum) {
    return await _classPrivateFieldLooseBase(this, _topology)[_topology].dumpLines(_classPrivateFieldLooseBase(this, _pg)[_pg], id, type, category, maxVerticesNum);
  }

  async topoInit() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].initTopoTable(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

  async calcEdges(maxVerticesNum) {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].calcEdges(_classPrivateFieldLooseBase(this, _pg)[_pg], maxVerticesNum);
  }

  async checkEdges(maxVerticesNum) {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].checkEdges(_classPrivateFieldLooseBase(this, _pg)[_pg], maxVerticesNum);
  }

  async initDump2TopoRelation() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].initDump2TopoRelation(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

  async initTopo2DumpRelation() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].initTopo2DumpRelation(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

  async calcTopo2DumpRelation() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].calcTopo2Dump(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

  async calcDump2TopoRelation() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].calcDump2Topo(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

}

var _topologyLevel = _classPrivateFieldLooseKey("topologyLevel");

var _topology = _classPrivateFieldLooseKey("topology");

var _pg = _classPrivateFieldLooseKey("pg");

var _default = Strategy;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvU3RyYXRlZ3kuanMiXSwibmFtZXMiOlsiU3RyYXRlZ3kiLCJjb25zdHJ1Y3RvciIsInRvcG9sb2d5TGV2ZWwiLCJwZyIsImdldFRvcG9sb2d5IiwibGV2ZWxOdW1iZXIiLCJsaW5lRHVtcFNjaGVtYSIsImxpbmVEdW1wVGFibGUiLCJsaW5lVG9wb1NjaGVtYSIsImxpbmVUb3BvVGFibGUiLCJMaWJUb3BvTGluZSIsImR1bXBJbml0IiwiaW5pdER1bXBUYWJsZSIsImxvYWRCb3VuZGFyeUxpc3QiLCJhc3luY0ZhbGxiYWNrIiwidGFibGUiLCJsaW1pdCIsImNvdW50Iiwic3RhcnRJZCIsImxldmVsIiwic3FsIiwiRXJyb3IiLCJyb3dzIiwicXVlcnkiLCJ0aGVuIiwicmVzIiwibmV4dElkIiwibGVuZ3RoIiwicm93IiwiY29uc29sZSIsImxvZyIsImxvYWRMaW5lTGlzdCIsImlkIiwiZHVtcExpbmVzIiwidHlwZSIsImNhdGVnb3J5IiwibWF4VmVydGljZXNOdW0iLCJ0b3BvSW5pdCIsImluaXRUb3BvVGFibGUiLCJjYWxjRWRnZXMiLCJjaGVja0VkZ2VzIiwiaW5pdER1bXAyVG9wb1JlbGF0aW9uIiwiaW5pdFRvcG8yRHVtcFJlbGF0aW9uIiwiY2FsY1RvcG8yRHVtcFJlbGF0aW9uIiwiY2FsY1RvcG8yRHVtcCIsImNhbGNEdW1wMlRvcG9SZWxhdGlvbiIsImNhbGNEdW1wMlRvcG8iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBRUE7O0FBRUE7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxRQUFOLENBQWU7QUFLYjs7O0FBT0FDLEVBQUFBLFdBQVcsQ0FBQ0MsYUFBRCxFQUFnQkMsRUFBaEIsRUFBb0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDN0Isd0VBQXNCRCxhQUF0QjtBQUNBLGtEQUFXQyxFQUFYO0FBQ0EsOERBQWlCLEtBQUtD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TGluZSc7XG5cbmltcG9ydCBwYWQgZnJvbSAncGFkJztcblxuY2xhc3MgU3RyYXRlZ3kge1xuXG5cbiAgI3RvcG9sb2d5TGV2ZWw7XG5cbiAgLyoqXG4gICAqIEB2YXIgTGliVG9wb0xpbmVcbiAgICovXG4gICN0b3BvbG9neTtcblxuICAjcGc7XG5cbiAgY29uc3RydWN0b3IodG9wb2xvZ3lMZXZlbCwgcGcpIHtcbiAgICB0aGlzLiN0b3BvbG9neUxldmVsID0gdG9wb2xvZ3lMZXZlbDtcbiAgICB0aGlzLiNwZyA9IHBnO1xuICAgIHRoaXMuI3RvcG9sb2d5ID0gdGhpcy5nZXRUb3BvbG9neSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtMaWJUb3BvTGluZX1cbiAgICovXG4gIGdldFRvcG9sb2d5KCkge1xuICAgIGNvbnN0IGxldmVsTnVtYmVyID0gcGFkKDIsIHRoaXMuI3RvcG9sb2d5TGV2ZWwsICcwJyk7XG4gICAgY29uc3QgbGluZUR1bXBTY2hlbWEgPSAndG9wbyc7XG4gICAgY29uc3QgbGluZUR1bXBUYWJsZSA9IGBsdiR7bGV2ZWxOdW1iZXJ9X2xpbmVfZHVtcGA7XG4gICAgY29uc3QgbGluZVRvcG9TY2hlbWEgPSAndG9wbyc7XG4gICAgY29uc3QgbGluZVRvcG9UYWJsZSA9IGBsdiR7bGV2ZWxOdW1iZXJ9X2xpbmVfdG9wb2A7XG4gICAgcmV0dXJuIG5ldyBMaWJUb3BvTGluZShsaW5lRHVtcFNjaGVtYSwgbGluZUR1bXBUYWJsZSwgbGluZVRvcG9TY2hlbWEsIGxpbmVUb3BvVGFibGUpO1xuICB9XG5cblxuICBhc3luYyBkdW1wSW5pdCgpIHtcbiAgICBhd2FpdCB0aGlzLiN0b3BvbG9neS5pbml0RHVtcFRhYmxlKHRoaXMuI3BnKTtcbiAgfVxuXG5cbiAgYXN5bmMgbG9hZEJvdW5kYXJ5TGlzdChhc3luY0ZhbGxiYWNrKSB7XG4gICAgY29uc3QgdGFibGUgPSAnYm91bmRhcnkubWZ3JztcbiAgICBjb25zdCBsaW1pdCA9IDEwMDtcbiAgICBsZXQgY291bnQ7XG4gICAgbGV0IHN0YXJ0SWQgPSAwO1xuICAgIGNvbnN0IGxldmVsID0gdGhpcy4jdG9wb2xvZ3lMZXZlbDtcbiAgICBsZXQgc3FsO1xuICAgIGlmIChsZXZlbCA8PSAxKSB7XG4gICAgICBzcWwgPSBgc2VsZWN0IGlkLCB6aF9uYW1lIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPiAkMSBhbmQgbGV2ZWw6OmludGVnZXIgPD0gMSBvcmRlciBieSBpZCBhc2MgbGltaXQgJHtsaW1pdH1gO1xuICAgIH0gZWxzZSBpZiAobGV2ZWwgPT09IDIpIHtcbiAgICAgIHNxbCA9IGBzZWxlY3QgaWQsIHpoX25hbWUgZnJvbSAke3RhYmxlfSB3aGVyZSBpZCA+ICQxIGFuZCAoKGlkID49IDEgYW5kIGlkIDwgNTApIG9yIGlkID4gOTAwMDAwKSBhbmQgbGV2ZWw6OmludGVnZXIgPD0gMiBvcmRlciBieSBpZCBhc2MgbGltaXQgJHtsaW1pdH1gXG4gICAgfSBlbHNlIGlmIChsZXZlbCA9PT0gMykge1xuICAgICAgc3FsID0gYHNlbGVjdCBpZCwgemhfbmFtZSBmcm9tICR7dGFibGV9IHdoZXJlIGlkID4gJDEgYW5kIGxldmVsOjppbnRlZ2VyIDw9IDIgb3JkZXIgYnkgaWQgYXNjIGxpbWl0ICR7bGltaXR9YFxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RvcG9sb2d5IGxldmVsIG91dCBvZiByYW5nZScpO1xuICAgIH1cblxuICAgIGRvIHtcbiAgICAgIGNvbnN0IHJvd3MgPSBhd2FpdCB0aGlzLiNwZ1xuICAgICAgICAucXVlcnkoc3FsLCBbc3RhcnRJZF0pXG4gICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgICB9KVxuICAgICAgO1xuICAgICAgbGV0IG5leHRJZCA9IDA7XG4gICAgICBjb3VudCA9IHJvd3MubGVuZ3RoO1xuICAgICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICBhd2FpdCBhc3luY0ZhbGxiYWNrKCtyb3dbJ2lkJ10sIHJvd1snemhfbmFtZSddKTtcbiAgICAgICAgbmV4dElkID0gK3Jvd1snaWQnXTtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUubG9nKGBmaW5pc2ggbG9hZCBib3VuZGFyeS5tZncgZnJvbSAjJHtzdGFydElkfSB0byAjJHtuZXh0SWR9YCk7XG4gICAgICBzdGFydElkID0gbmV4dElkO1xuICAgIH0gd2hpbGUgKGNvdW50ID4gMCk7XG4gIH1cblxuXG4gIGFzeW5jIGxvYWRMaW5lTGlzdChpZCwgYXN5bmNGYWxsYmFjaykge1xuICAgIGNvbnN0IHRhYmxlID0gJ2JvdW5kYXJ5LmxpbmUnO1xuICAgIGNvbnN0IHNxbCA9IGBzZWxlY3QgaWQsIHR5cGUsIGNhdGVnb3J5IGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPSAkMWA7XG4gICAgY29uc3Qgcm93cyA9IGF3YWl0IHRoaXMuI3BnXG4gICAgICAucXVlcnkoc3FsLCBbaWRdKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgcmV0dXJuIHJlcy5yb3dzIHx8IFtdO1xuICAgICAgfSlcbiAgICA7XG4gICAgZm9yIGF3YWl0IChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgYXdhaXQgYXN5bmNGYWxsYmFjaygrcm93WydpZCddLCByb3dbJ3R5cGUnXSwgcm93WydjYXRlZ29yeSddKTtcbiAgICB9XG4gIH1cblxuXG4gIGFzeW5jIGR1bXBMaW5lcyhpZCwgdHlwZSwgY2F0ZWdvcnksIG1heFZlcnRpY2VzTnVtKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmR1bXBMaW5lcyh0aGlzLiNwZywgaWQsIHR5cGUsIGNhdGVnb3J5LCBtYXhWZXJ0aWNlc051bSk7XG4gIH1cblxuXG4gIGFzeW5jIHRvcG9Jbml0KCkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmluaXRUb3BvVGFibGUodGhpcy4jcGcpO1xuICB9XG5cblxuICBhc3luYyBjYWxjRWRnZXMobWF4VmVydGljZXNOdW0pIHtcbiAgICBhd2FpdCB0aGlzLiN0b3BvbG9neS5jYWxjRWRnZXModGhpcy4jcGcsIG1heFZlcnRpY2VzTnVtKTtcbiAgfVxuXG4gIGFzeW5jIGNoZWNrRWRnZXMobWF4VmVydGljZXNOdW0pIHtcbiAgICBhd2FpdCB0aGlzLiN0b3BvbG9neS5jaGVja0VkZ2VzKHRoaXMuI3BnLCBtYXhWZXJ0aWNlc051bSk7XG4gIH1cblxuXG4gIGFzeW5jIGluaXREdW1wMlRvcG9SZWxhdGlvbigpIHtcbiAgICBhd2FpdCB0aGlzLiN0b3BvbG9neS5pbml0RHVtcDJUb3BvUmVsYXRpb24odGhpcy4jcGcpO1xuICB9XG5cblxuICBhc3luYyBpbml0VG9wbzJEdW1wUmVsYXRpb24oKSB7XG4gICAgYXdhaXQgdGhpcy4jdG9wb2xvZ3kuaW5pdFRvcG8yRHVtcFJlbGF0aW9uKHRoaXMuI3BnKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2FsY1RvcG8yRHVtcFJlbGF0aW9uKCkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmNhbGNUb3BvMkR1bXAodGhpcy4jcGcpO1xuICB9XG5cbiAgYXN5bmMgY2FsY0R1bXAyVG9wb1JlbGF0aW9uKCkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmNhbGNEdW1wMlRvcG8odGhpcy4jcGcpO1xuICB9XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgU3RyYXRlZ3k7Il19