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

  async initRelation() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].initRelationColumn(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

  async calcTopo2DumpRelation() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].calcTopo2Dump(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

  async calcDump2TopoRelation() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].calcDump2Topo(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

  async fixCalcDump2TopoRelation() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].fixDump2Topos(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

}

var _topologyLevel = _classPrivateFieldLooseKey("topologyLevel");

var _topology = _classPrivateFieldLooseKey("topology");

var _pg = _classPrivateFieldLooseKey("pg");

var _default = Strategy;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvU3RyYXRlZ3kuanMiXSwibmFtZXMiOlsiU3RyYXRlZ3kiLCJjb25zdHJ1Y3RvciIsInRvcG9sb2d5TGV2ZWwiLCJwZyIsImdldFRvcG9sb2d5IiwibGV2ZWxOdW1iZXIiLCJsaW5lRHVtcFNjaGVtYSIsImxpbmVEdW1wVGFibGUiLCJsaW5lVG9wb1NjaGVtYSIsImxpbmVUb3BvVGFibGUiLCJMaWJUb3BvTGluZSIsImR1bXBJbml0IiwiaW5pdER1bXBUYWJsZSIsImxvYWRCb3VuZGFyeUxpc3QiLCJhc3luY0ZhbGxiYWNrIiwidGFibGUiLCJsaW1pdCIsImNvdW50Iiwic3RhcnRJZCIsImxldmVsIiwic3FsIiwiRXJyb3IiLCJyb3dzIiwicXVlcnkiLCJ0aGVuIiwicmVzIiwibmV4dElkIiwibGVuZ3RoIiwicm93IiwiY29uc29sZSIsImxvZyIsImxvYWRMaW5lTGlzdCIsImlkIiwiZHVtcExpbmVzIiwidHlwZSIsImNhdGVnb3J5IiwibWF4VmVydGljZXNOdW0iLCJ0b3BvSW5pdCIsImluaXRUb3BvVGFibGUiLCJjYWxjRWRnZXMiLCJjaGVja0VkZ2VzIiwiaW5pdFJlbGF0aW9uIiwiaW5pdFJlbGF0aW9uQ29sdW1uIiwiY2FsY1RvcG8yRHVtcFJlbGF0aW9uIiwiY2FsY1RvcG8yRHVtcCIsImNhbGNEdW1wMlRvcG9SZWxhdGlvbiIsImNhbGNEdW1wMlRvcG8iLCJmaXhDYWxjRHVtcDJUb3BvUmVsYXRpb24iLCJmaXhEdW1wMlRvcG9zIl0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7OztBQUVBOztBQUVBOzs7Ozs7Ozs7O0FBRUEsTUFBTUEsUUFBTixDQUFlO0FBS2I7OztBQU9BQyxFQUFBQSxXQUFXLENBQUNDLGFBQUQsRUFBZ0JDLEVBQWhCLEVBQW9CO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQzdCLHdFQUFzQkQsYUFBdEI7QUFD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dCBMaWJUb3BvTGluZSBmcm9tICcuL0xpYlRvcG9MaW5lJztcblxuaW1wb3J0IHBhZCBmcm9tICdwYWQnO1xuXG5jbGFzcyBTdHJhdGVneSB7XG5cblxuICAjdG9wb2xvZ3lMZXZlbDtcblxuICAvKipcbiAgICogQHZhciBMaWJUb3BvTGluZVxuICAgKi9cbiAgI3RvcG9sb2d5O1xuXG4gICNwZztcblxuICBjb25zdHJ1Y3Rvcih0b3BvbG9neUxldmVsLCBwZykge1xuICAgIHRoaXMuI3RvcG9sb2d5TGV2ZWwgPSB0b3BvbG9neUxldmVsO1xuICAgIHRoaXMuI3BnID0gcGc7XG4gICAgdGhpcy4jdG9wb2xvZ3kgPSB0aGlzLmdldFRvcG9sb2d5KCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMge0xpYlRvcG9MaW5lfVxuICAgKi9cbiAgZ2V0VG9wb2xvZ3koKSB7XG4gICAgY29uc3QgbGV2ZWxOdW1iZXIgPSBwYWQoMiwgdGhpcy4jdG9wb2xvZ3lMZXZlbCwgJzAnKTtcbiAgICBjb25zdCBsaW5lRHVtcFNjaGVtYSA9ICd0b3BvJztcbiAgICBjb25zdCBsaW5lRHVtcFRhYmxlID0gYGx2JHtsZXZlbE51bWJlcn1fbGluZV9kdW1wYDtcbiAgICBjb25zdCBsaW5lVG9wb1NjaGVtYSA9ICd0b3BvJztcbiAgICBjb25zdCBsaW5lVG9wb1RhYmxlID0gYGx2JHtsZXZlbE51bWJlcn1fbGluZV90b3BvYDtcbiAgICByZXR1cm4gbmV3IExpYlRvcG9MaW5lKGxpbmVEdW1wU2NoZW1hLCBsaW5lRHVtcFRhYmxlLCBsaW5lVG9wb1NjaGVtYSwgbGluZVRvcG9UYWJsZSk7XG4gIH1cblxuXG4gIGFzeW5jIGR1bXBJbml0KCkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmluaXREdW1wVGFibGUodGhpcy4jcGcpO1xuICB9XG5cblxuICBhc3luYyBsb2FkQm91bmRhcnlMaXN0KGFzeW5jRmFsbGJhY2spIHtcbiAgICBjb25zdCB0YWJsZSA9ICdib3VuZGFyeS5tZncnO1xuICAgIGNvbnN0IGxpbWl0ID0gMTAwO1xuICAgIGxldCBjb3VudDtcbiAgICBsZXQgc3RhcnRJZCA9IDA7XG4gICAgY29uc3QgbGV2ZWwgPSB0aGlzLiN0b3BvbG9neUxldmVsO1xuICAgIGxldCBzcWw7XG4gICAgaWYgKGxldmVsIDw9IDEpIHtcbiAgICAgIHNxbCA9IGBzZWxlY3QgaWQsIHpoX25hbWUgZnJvbSAke3RhYmxlfSB3aGVyZSBpZCA+ICQxIGFuZCBsZXZlbDo6aW50ZWdlciA8PSAxIG9yZGVyIGJ5IGlkIGFzYyBsaW1pdCAke2xpbWl0fWA7XG4gICAgfSBlbHNlIGlmIChsZXZlbCA9PT0gMikge1xuICAgICAgc3FsID0gYHNlbGVjdCBpZCwgemhfbmFtZSBmcm9tICR7dGFibGV9IHdoZXJlIGlkID4gJDEgYW5kICgoaWQgPj0gMSBhbmQgaWQgPCA1MCkgb3IgaWQgPiA5MDAwMDApIGFuZCBsZXZlbDo6aW50ZWdlciA8PSAyIG9yZGVyIGJ5IGlkIGFzYyBsaW1pdCAke2xpbWl0fWBcbiAgICB9IGVsc2UgaWYgKGxldmVsID09PSAzKSB7XG4gICAgICBzcWwgPSBgc2VsZWN0IGlkLCB6aF9uYW1lIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPiAkMSBhbmQgbGV2ZWw6OmludGVnZXIgPD0gMiBvcmRlciBieSBpZCBhc2MgbGltaXQgJHtsaW1pdH1gXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndG9wb2xvZ3kgbGV2ZWwgb3V0IG9mIHJhbmdlJyk7XG4gICAgfVxuXG4gICAgZG8ge1xuICAgICAgY29uc3Qgcm93cyA9IGF3YWl0IHRoaXMuI3BnXG4gICAgICAgIC5xdWVyeShzcWwsIFtzdGFydElkXSlcbiAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICAgIH0pXG4gICAgICA7XG4gICAgICBsZXQgbmV4dElkID0gMDtcbiAgICAgIGNvdW50ID0gcm93cy5sZW5ndGg7XG4gICAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgIGF3YWl0IGFzeW5jRmFsbGJhY2soK3Jvd1snaWQnXSwgcm93Wyd6aF9uYW1lJ10pO1xuICAgICAgICBuZXh0SWQgPSArcm93WydpZCddO1xuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coYGZpbmlzaCBsb2FkIGJvdW5kYXJ5Lm1mdyBmcm9tICMke3N0YXJ0SWR9IHRvICMke25leHRJZH1gKTtcbiAgICAgIHN0YXJ0SWQgPSBuZXh0SWQ7XG4gICAgfSB3aGlsZSAoY291bnQgPiAwKTtcbiAgfVxuXG5cbiAgYXN5bmMgbG9hZExpbmVMaXN0KGlkLCBhc3luY0ZhbGxiYWNrKSB7XG4gICAgY29uc3QgdGFibGUgPSAnYm91bmRhcnkubGluZSc7XG4gICAgY29uc3Qgc3FsID0gYHNlbGVjdCBpZCwgdHlwZSwgY2F0ZWdvcnkgZnJvbSAke3RhYmxlfSB3aGVyZSBpZCA9ICQxYDtcbiAgICBjb25zdCByb3dzID0gYXdhaXQgdGhpcy4jcGdcbiAgICAgIC5xdWVyeShzcWwsIFtpZF0pXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICByZXR1cm4gcmVzLnJvd3MgfHwgW107XG4gICAgICB9KVxuICAgIDtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICBhd2FpdCBhc3luY0ZhbGxiYWNrKCtyb3dbJ2lkJ10sIHJvd1sndHlwZSddLCByb3dbJ2NhdGVnb3J5J10pO1xuICAgIH1cbiAgfVxuXG5cbiAgYXN5bmMgZHVtcExpbmVzKGlkLCB0eXBlLCBjYXRlZ29yeSwgbWF4VmVydGljZXNOdW0pIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jdG9wb2xvZ3kuZHVtcExpbmVzKHRoaXMuI3BnLCBpZCwgdHlwZSwgY2F0ZWdvcnksIG1heFZlcnRpY2VzTnVtKTtcbiAgfVxuXG5cbiAgYXN5bmMgdG9wb0luaXQoKSB7XG4gICAgYXdhaXQgdGhpcy4jdG9wb2xvZ3kuaW5pdFRvcG9UYWJsZSh0aGlzLiNwZyk7XG4gIH1cblxuXG4gIGFzeW5jIGNhbGNFZGdlcyhtYXhWZXJ0aWNlc051bSkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmNhbGNFZGdlcyh0aGlzLiNwZywgbWF4VmVydGljZXNOdW0pO1xuICB9XG5cbiAgYXN5bmMgY2hlY2tFZGdlcyhtYXhWZXJ0aWNlc051bSkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmNoZWNrRWRnZXModGhpcy4jcGcsIG1heFZlcnRpY2VzTnVtKTtcbiAgfVxuXG5cbiAgYXN5bmMgaW5pdFJlbGF0aW9uKCkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmluaXRSZWxhdGlvbkNvbHVtbih0aGlzLiNwZyk7XG4gIH1cblxuXG4gIGFzeW5jIGNhbGNUb3BvMkR1bXBSZWxhdGlvbigpIHtcbiAgICBhd2FpdCB0aGlzLiN0b3BvbG9neS5jYWxjVG9wbzJEdW1wKHRoaXMuI3BnKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2FsY0R1bXAyVG9wb1JlbGF0aW9uKCkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmNhbGNEdW1wMlRvcG8odGhpcy4jcGcpO1xuICB9XG5cbiAgYXN5bmMgZml4Q2FsY0R1bXAyVG9wb1JlbGF0aW9uKCkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmZpeER1bXAyVG9wb3ModGhpcy4jcGcpO1xuICB9XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgU3RyYXRlZ3k7Il19