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
    const nodeTopoSchema = 'topo';
    const nodeTopoTable = `lv${levelNumber}_node_topo`;
    return new _LibTopoLine.default(lineDumpSchema, lineDumpTable, lineTopoSchema, lineTopoTable, nodeTopoSchema, nodeTopoTable);
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

  async calcEdges() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].calcEdges(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

  async checkDuplicateEdges() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].checkDuplicateEdges(_classPrivateFieldLooseBase(this, _pg)[_pg]);
  }

  async checkCollapseEdges() {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].checkCollapseEdges(_classPrivateFieldLooseBase(this, _pg)[_pg]);
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

  async calcDump2TopoRelation(tolerance) {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].calcDump2TopoEdges(_classPrivateFieldLooseBase(this, _pg)[_pg], tolerance);
  }

  async topoSnapEdges(tolerance) {
    await _classPrivateFieldLooseBase(this, _topology)[_topology].topoSnapEdges(_classPrivateFieldLooseBase(this, _pg)[_pg], tolerance);
  }

}

var _topologyLevel = _classPrivateFieldLooseKey("topologyLevel");

var _topology = _classPrivateFieldLooseKey("topology");

var _pg = _classPrivateFieldLooseKey("pg");

var _default = Strategy;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy94eC10b3BvLWxpbmUvU3RyYXRlZ3kuanMiXSwibmFtZXMiOlsiU3RyYXRlZ3kiLCJjb25zdHJ1Y3RvciIsInRvcG9sb2d5TGV2ZWwiLCJwZyIsImdldFRvcG9sb2d5IiwibGV2ZWxOdW1iZXIiLCJsaW5lRHVtcFNjaGVtYSIsImxpbmVEdW1wVGFibGUiLCJsaW5lVG9wb1NjaGVtYSIsImxpbmVUb3BvVGFibGUiLCJub2RlVG9wb1NjaGVtYSIsIm5vZGVUb3BvVGFibGUiLCJMaWJUb3BvTGluZSIsImR1bXBJbml0IiwiaW5pdER1bXBUYWJsZSIsImxvYWRCb3VuZGFyeUxpc3QiLCJhc3luY0ZhbGxiYWNrIiwidGFibGUiLCJsaW1pdCIsImNvdW50Iiwic3RhcnRJZCIsImxldmVsIiwic3FsIiwiRXJyb3IiLCJyb3dzIiwicXVlcnkiLCJ0aGVuIiwicmVzIiwibmV4dElkIiwibGVuZ3RoIiwicm93IiwiY29uc29sZSIsImxvZyIsImxvYWRMaW5lTGlzdCIsImlkIiwiZHVtcExpbmVzIiwidHlwZSIsImNhdGVnb3J5IiwibWF4VmVydGljZXNOdW0iLCJ0b3BvSW5pdCIsImluaXRUb3BvVGFibGUiLCJjYWxjRWRnZXMiLCJjaGVja0R1cGxpY2F0ZUVkZ2VzIiwiY2hlY2tDb2xsYXBzZUVkZ2VzIiwiaW5pdER1bXAyVG9wb1JlbGF0aW9uIiwiaW5pdFRvcG8yRHVtcFJlbGF0aW9uIiwiY2FsY1RvcG8yRHVtcFJlbGF0aW9uIiwiY2FsY1RvcG8yRHVtcCIsImNhbGNEdW1wMlRvcG9SZWxhdGlvbiIsInRvbGVyYW5jZSIsImNhbGNEdW1wMlRvcG9FZGdlcyIsInRvcG9TbmFwRWRnZXMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBRUE7O0FBRUE7Ozs7Ozs7Ozs7QUFFQSxNQUFNQSxRQUFOLENBQWU7QUFLYjs7O0FBT0FDLEVBQUFBLFdBQVcsQ0FBQ0MsYUFBRCxFQUFnQkMsRUFBaEIsRUFBb0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDN0Isd0VBQXNCRCxhQUF0QjtBQUNBLGtEQUFXQyxFQUFYO0FBQ0EsOERBQWlCLEtBQUtDLFdBQUwsRUFBakI7QUFDRDtBQUVEOzs7OztBQUdBQSxFQUFBQSxXQUFXLEdBQUc7QUFDWixVQUFNQyxXQUFXLEdBQUcsa0JBQUksQ0FBSiw4QkFBTyxJQUFQLG1DQUE0QixHQUE1QixDQUFwQjtBQUNBLFVBQU1DLGNBQWMsR0FBRyxNQUF2QjtBQUNBLFVBQU1DLGFBQWEsR0FBSSxLQUFJRixXQUFZLFlBQXZDO0FBQ0EsVUFBTUcsY0FBYyxHQUFHLE1BQXZCO0FBQ0EsVUFBTUMsYUFBYSxHQUFJLEtBQUlKLFdBQVksWUFBdkM7QUFDQSxVQUFNSyxjQUFjLEdBQUcsTUFBdkI7QUFDQSxVQUFNQyxhQUFhLEdBQUksS0FBSU4sV0FBWSxZQUF2QztBQUNBLFdBQU8sSUFBSU8sb0JBQUosQ0FBZ0JOLGNBQWhCLEVBQWdDQyxhQUFoQyxFQUErQ0MsY0FBL0MsRUFBK0RDLGFBQS9ELEVBQThFQyxjQUE5RSxFQUE4RkMsYUFBOUYsQ0FBUDtBQUNEOztBQUdELFFBQU1FLFFBQU4sR0FBaUI7QUFDZixVQUFNLHdEQUFlQyxhQUFmLDZCQUE2QixJQUE3QixZQUFOO0FBQ0Q7O0FBR0QsUUFBTUMsZ0JBQU4sQ0FBdUJDLGFBQXZCLEVBQXNDO0FBQ3BDLFVBQU1DLEtBQUssR0FBRyxjQUFkO0FBQ0EsVUFBTUMsS0FBSyxHQUFHLEdBQWQ7QUFDQSxRQUFJQyxLQUFKO0FBQ0EsUUFBSUMsT0FBTyxHQUFHLENBQWQ7O0FBQ0EsVUFBTUMsS0FBSywrQkFBRyxJQUFILGlDQUFYOztBQUNBLFFBQUlDLEdBQUo7O0FBQ0EsUUFBSUQsS0FBSyxJQUFJLENBQWIsRUFBZ0I7QUFDZEMsTUFBQUEsR0FBRyxHQUFJLDJCQUEwQkwsS0FBTSxnRUFBK0RDLEtBQU0sRUFBNUc7QUFDRCxLQUZELE1BRU8sSUFBSUcsS0FBSyxLQUFLLENBQWQsRUFBaUI7QUFDdEJDLE1BQUFBLEdBQUcsR0FBSSwyQkFBMEJMLEtBQU0sMkdBQTBHQyxLQUFNLEVBQXZKO0FBQ0QsS0FGTSxNQUVBLElBQUlHLEtBQUssS0FBSyxDQUFkLEVBQWlCO0FBQ3RCQyxNQUFBQSxHQUFHLEdBQUksMkJBQTBCTCxLQUFNLGdFQUErREMsS0FBTSxFQUE1RztBQUNELEtBRk0sTUFFQTtBQUNMLFlBQU0sSUFBSUssS0FBSixDQUFVLDZCQUFWLENBQU47QUFDRDs7QUFFRCxPQUFHO0FBQ0QsWUFBTUMsSUFBSSxHQUFHLE1BQU0sNENBQ2hCQyxLQURnQixDQUNWSCxHQURVLEVBQ0wsQ0FBQ0YsT0FBRCxDQURLLEVBRWhCTSxJQUZnQixDQUVYQyxHQUFHLElBQUk7QUFDWCxlQUFPQSxHQUFHLENBQUNILElBQUosSUFBWSxFQUFuQjtBQUNELE9BSmdCLENBQW5CO0FBTUEsVUFBSUksTUFBTSxHQUFHLENBQWI7QUFDQVQsTUFBQUEsS0FBSyxHQUFHSyxJQUFJLENBQUNLLE1BQWI7O0FBQ0EsaUJBQVcsTUFBTUMsR0FBakIsSUFBd0JOLElBQXhCLEVBQThCO0FBQzVCLGNBQU1SLGFBQWEsQ0FBQyxDQUFDYyxHQUFHLENBQUMsSUFBRCxDQUFMLEVBQWFBLEdBQUcsQ0FBQyxTQUFELENBQWhCLENBQW5CO0FBQ0FGLFFBQUFBLE1BQU0sR0FBRyxDQUFDRSxHQUFHLENBQUMsSUFBRCxDQUFiO0FBQ0Q7O0FBQ0RDLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLGtDQUFpQ1osT0FBUSxRQUFPUSxNQUFPLEVBQXBFO0FBQ0FSLE1BQUFBLE9BQU8sR0FBR1EsTUFBVjtBQUNELEtBZkQsUUFlU1QsS0FBSyxHQUFHLENBZmpCO0FBZ0JEOztBQUdELFFBQU1jLFlBQU4sQ0FBbUJDLEVBQW5CLEVBQXVCbEIsYUFBdkIsRUFBc0M7QUFDcEMsVUFBTUMsS0FBSyxHQUFHLGVBQWQ7QUFDQSxVQUFNSyxHQUFHLEdBQUksa0NBQWlDTCxLQUFNLGdCQUFwRDtBQUNBLFVBQU1PLElBQUksR0FBRyxNQUFNLDRDQUNoQkMsS0FEZ0IsQ0FDVkgsR0FEVSxFQUNMLENBQUNZLEVBQUQsQ0FESyxFQUVoQlIsSUFGZ0IsQ0FFWEMsR0FBRyxJQUFJO0FBQ1gsYUFBT0EsR0FBRyxDQUFDSCxJQUFKLElBQVksRUFBbkI7QUFDRCxLQUpnQixDQUFuQjs7QUFNQSxlQUFXLE1BQU1NLEdBQWpCLElBQXdCTixJQUF4QixFQUE4QjtBQUM1QixZQUFNUixhQUFhLENBQUMsQ0FBQ2MsR0FBRyxDQUFDLElBQUQsQ0FBTCxFQUFhQSxHQUFHLENBQUMsTUFBRCxDQUFoQixFQUEwQkEsR0FBRyxDQUFDLFVBQUQsQ0FBN0IsQ0FBbkI7QUFDRDtBQUNGOztBQUdELFFBQU1LLFNBQU4sQ0FBZ0JELEVBQWhCLEVBQW9CRSxJQUFwQixFQUEwQkMsUUFBMUIsRUFBb0NDLGNBQXBDLEVBQW9EO0FBQ2xELFdBQU8sTUFBTSx3REFBZUgsU0FBZiw2QkFBeUIsSUFBekIsYUFBbUNELEVBQW5DLEVBQXVDRSxJQUF2QyxFQUE2Q0MsUUFBN0MsRUFBdURDLGNBQXZELENBQWI7QUFDRDs7QUFHRCxRQUFNQyxRQUFOLEdBQWlCO0FBQ2YsVUFBTSx3REFBZUMsYUFBZiw2QkFBNkIsSUFBN0IsWUFBTjtBQUNEOztBQUdELFFBQU1DLFNBQU4sR0FBa0I7QUFDaEIsVUFBTSx3REFBZUEsU0FBZiw2QkFBeUIsSUFBekIsWUFBTjtBQUNEOztBQUdELFFBQU1DLG1CQUFOLEdBQTRCO0FBQzFCLFVBQU0sd0RBQWVBLG1CQUFmLDZCQUFtQyxJQUFuQyxZQUFOO0FBQ0Q7O0FBRUQsUUFBTUMsa0JBQU4sR0FBMkI7QUFDekIsVUFBTSx3REFBZUEsa0JBQWYsNkJBQWtDLElBQWxDLFlBQU47QUFDRDs7QUFFRCxRQUFNQyxxQkFBTixHQUE4QjtBQUM1QixVQUFNLHdEQUFlQSxxQkFBZiw2QkFBcUMsSUFBckMsWUFBTjtBQUNEOztBQUdELFFBQU1DLHFCQUFOLEdBQThCO0FBQzVCLFVBQU0sd0RBQWVBLHFCQUFmLDZCQUFxQyxJQUFyQyxZQUFOO0FBQ0Q7O0FBR0QsUUFBTUMscUJBQU4sR0FBOEI7QUFDNUIsVUFBTSx3REFBZUMsYUFBZiw2QkFBNkIsSUFBN0IsWUFBTjtBQUNEOztBQUVELFFBQU1DLHFCQUFOLENBQTRCQyxTQUE1QixFQUF1QztBQUNyQyxVQUFNLHdEQUFlQyxrQkFBZiw2QkFBa0MsSUFBbEMsYUFBNENELFNBQTVDLENBQU47QUFDRDs7QUFFRCxRQUFNRSxhQUFOLENBQW9CRixTQUFwQixFQUErQjtBQUM3QixVQUFNLHdEQUFlRSxhQUFmLDZCQUE2QixJQUE3QixhQUF1Q0YsU0FBdkMsQ0FBTjtBQUNEOztBQXBJWTs7Ozs7Ozs7ZUF3SUFqRCxRIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgTGliVG9wb0xpbmUgZnJvbSAnLi9MaWJUb3BvTGluZSc7XG5cbmltcG9ydCBwYWQgZnJvbSAncGFkJztcblxuY2xhc3MgU3RyYXRlZ3kge1xuXG5cbiAgI3RvcG9sb2d5TGV2ZWw7XG5cbiAgLyoqXG4gICAqIEB2YXIgTGliVG9wb0xpbmVcbiAgICovXG4gICN0b3BvbG9neTtcblxuICAjcGc7XG5cbiAgY29uc3RydWN0b3IodG9wb2xvZ3lMZXZlbCwgcGcpIHtcbiAgICB0aGlzLiN0b3BvbG9neUxldmVsID0gdG9wb2xvZ3lMZXZlbDtcbiAgICB0aGlzLiNwZyA9IHBnO1xuICAgIHRoaXMuI3RvcG9sb2d5ID0gdGhpcy5nZXRUb3BvbG9neSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtMaWJUb3BvTGluZX1cbiAgICovXG4gIGdldFRvcG9sb2d5KCkge1xuICAgIGNvbnN0IGxldmVsTnVtYmVyID0gcGFkKDIsIHRoaXMuI3RvcG9sb2d5TGV2ZWwsICcwJyk7XG4gICAgY29uc3QgbGluZUR1bXBTY2hlbWEgPSAndG9wbyc7XG4gICAgY29uc3QgbGluZUR1bXBUYWJsZSA9IGBsdiR7bGV2ZWxOdW1iZXJ9X2xpbmVfZHVtcGA7XG4gICAgY29uc3QgbGluZVRvcG9TY2hlbWEgPSAndG9wbyc7XG4gICAgY29uc3QgbGluZVRvcG9UYWJsZSA9IGBsdiR7bGV2ZWxOdW1iZXJ9X2xpbmVfdG9wb2A7XG4gICAgY29uc3Qgbm9kZVRvcG9TY2hlbWEgPSAndG9wbyc7XG4gICAgY29uc3Qgbm9kZVRvcG9UYWJsZSA9IGBsdiR7bGV2ZWxOdW1iZXJ9X25vZGVfdG9wb2A7XG4gICAgcmV0dXJuIG5ldyBMaWJUb3BvTGluZShsaW5lRHVtcFNjaGVtYSwgbGluZUR1bXBUYWJsZSwgbGluZVRvcG9TY2hlbWEsIGxpbmVUb3BvVGFibGUsIG5vZGVUb3BvU2NoZW1hLCBub2RlVG9wb1RhYmxlKTtcbiAgfVxuXG5cbiAgYXN5bmMgZHVtcEluaXQoKSB7XG4gICAgYXdhaXQgdGhpcy4jdG9wb2xvZ3kuaW5pdER1bXBUYWJsZSh0aGlzLiNwZyk7XG4gIH1cblxuXG4gIGFzeW5jIGxvYWRCb3VuZGFyeUxpc3QoYXN5bmNGYWxsYmFjaykge1xuICAgIGNvbnN0IHRhYmxlID0gJ2JvdW5kYXJ5Lm1mdyc7XG4gICAgY29uc3QgbGltaXQgPSAxMDA7XG4gICAgbGV0IGNvdW50O1xuICAgIGxldCBzdGFydElkID0gMDtcbiAgICBjb25zdCBsZXZlbCA9IHRoaXMuI3RvcG9sb2d5TGV2ZWw7XG4gICAgbGV0IHNxbDtcbiAgICBpZiAobGV2ZWwgPD0gMSkge1xuICAgICAgc3FsID0gYHNlbGVjdCBpZCwgemhfbmFtZSBmcm9tICR7dGFibGV9IHdoZXJlIGlkID4gJDEgYW5kIGxldmVsOjppbnRlZ2VyIDw9IDEgb3JkZXIgYnkgaWQgYXNjIGxpbWl0ICR7bGltaXR9YDtcbiAgICB9IGVsc2UgaWYgKGxldmVsID09PSAyKSB7XG4gICAgICBzcWwgPSBgc2VsZWN0IGlkLCB6aF9uYW1lIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPiAkMSBhbmQgKChpZCA+PSAxIGFuZCBpZCA8IDUwKSBvciBpZCA+IDkwMDAwMCkgYW5kIGxldmVsOjppbnRlZ2VyIDw9IDIgb3JkZXIgYnkgaWQgYXNjIGxpbWl0ICR7bGltaXR9YFxuICAgIH0gZWxzZSBpZiAobGV2ZWwgPT09IDMpIHtcbiAgICAgIHNxbCA9IGBzZWxlY3QgaWQsIHpoX25hbWUgZnJvbSAke3RhYmxlfSB3aGVyZSBpZCA+ICQxIGFuZCBsZXZlbDo6aW50ZWdlciA8PSAyIG9yZGVyIGJ5IGlkIGFzYyBsaW1pdCAke2xpbWl0fWBcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCd0b3BvbG9neSBsZXZlbCBvdXQgb2YgcmFuZ2UnKTtcbiAgICB9XG5cbiAgICBkbyB7XG4gICAgICBjb25zdCByb3dzID0gYXdhaXQgdGhpcy4jcGdcbiAgICAgICAgLnF1ZXJ5KHNxbCwgW3N0YXJ0SWRdKVxuICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgICAgfSlcbiAgICAgIDtcbiAgICAgIGxldCBuZXh0SWQgPSAwO1xuICAgICAgY291bnQgPSByb3dzLmxlbmd0aDtcbiAgICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgYXdhaXQgYXN5bmNGYWxsYmFjaygrcm93WydpZCddLCByb3dbJ3poX25hbWUnXSk7XG4gICAgICAgIG5leHRJZCA9ICtyb3dbJ2lkJ107XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgZmluaXNoIGxvYWQgYm91bmRhcnkubWZ3IGZyb20gIyR7c3RhcnRJZH0gdG8gIyR7bmV4dElkfWApO1xuICAgICAgc3RhcnRJZCA9IG5leHRJZDtcbiAgICB9IHdoaWxlIChjb3VudCA+IDApO1xuICB9XG5cblxuICBhc3luYyBsb2FkTGluZUxpc3QoaWQsIGFzeW5jRmFsbGJhY2spIHtcbiAgICBjb25zdCB0YWJsZSA9ICdib3VuZGFyeS5saW5lJztcbiAgICBjb25zdCBzcWwgPSBgc2VsZWN0IGlkLCB0eXBlLCBjYXRlZ29yeSBmcm9tICR7dGFibGV9IHdoZXJlIGlkID0gJDFgO1xuICAgIGNvbnN0IHJvd3MgPSBhd2FpdCB0aGlzLiNwZ1xuICAgICAgLnF1ZXJ5KHNxbCwgW2lkXSlcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHJldHVybiByZXMucm93cyB8fCBbXTtcbiAgICAgIH0pXG4gICAgO1xuICAgIGZvciBhd2FpdCAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgIGF3YWl0IGFzeW5jRmFsbGJhY2soK3Jvd1snaWQnXSwgcm93Wyd0eXBlJ10sIHJvd1snY2F0ZWdvcnknXSk7XG4gICAgfVxuICB9XG5cblxuICBhc3luYyBkdW1wTGluZXMoaWQsIHR5cGUsIGNhdGVnb3J5LCBtYXhWZXJ0aWNlc051bSkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiN0b3BvbG9neS5kdW1wTGluZXModGhpcy4jcGcsIGlkLCB0eXBlLCBjYXRlZ29yeSwgbWF4VmVydGljZXNOdW0pO1xuICB9XG5cblxuICBhc3luYyB0b3BvSW5pdCgpIHtcbiAgICBhd2FpdCB0aGlzLiN0b3BvbG9neS5pbml0VG9wb1RhYmxlKHRoaXMuI3BnKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2FsY0VkZ2VzKCkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmNhbGNFZGdlcyh0aGlzLiNwZyk7XG4gIH1cblxuXG4gIGFzeW5jIGNoZWNrRHVwbGljYXRlRWRnZXMoKSB7XG4gICAgYXdhaXQgdGhpcy4jdG9wb2xvZ3kuY2hlY2tEdXBsaWNhdGVFZGdlcyh0aGlzLiNwZyk7XG4gIH1cblxuICBhc3luYyBjaGVja0NvbGxhcHNlRWRnZXMoKSB7XG4gICAgYXdhaXQgdGhpcy4jdG9wb2xvZ3kuY2hlY2tDb2xsYXBzZUVkZ2VzKHRoaXMuI3BnKTtcbiAgfVxuXG4gIGFzeW5jIGluaXREdW1wMlRvcG9SZWxhdGlvbigpIHtcbiAgICBhd2FpdCB0aGlzLiN0b3BvbG9neS5pbml0RHVtcDJUb3BvUmVsYXRpb24odGhpcy4jcGcpO1xuICB9XG5cblxuICBhc3luYyBpbml0VG9wbzJEdW1wUmVsYXRpb24oKSB7XG4gICAgYXdhaXQgdGhpcy4jdG9wb2xvZ3kuaW5pdFRvcG8yRHVtcFJlbGF0aW9uKHRoaXMuI3BnKTtcbiAgfVxuXG5cbiAgYXN5bmMgY2FsY1RvcG8yRHVtcFJlbGF0aW9uKCkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmNhbGNUb3BvMkR1bXAodGhpcy4jcGcpO1xuICB9XG5cbiAgYXN5bmMgY2FsY0R1bXAyVG9wb1JlbGF0aW9uKHRvbGVyYW5jZSkge1xuICAgIGF3YWl0IHRoaXMuI3RvcG9sb2d5LmNhbGNEdW1wMlRvcG9FZGdlcyh0aGlzLiNwZywgdG9sZXJhbmNlKTtcbiAgfVxuXG4gIGFzeW5jIHRvcG9TbmFwRWRnZXModG9sZXJhbmNlKSB7XG4gICAgYXdhaXQgdGhpcy4jdG9wb2xvZ3kudG9wb1NuYXBFZGdlcyh0aGlzLiNwZywgdG9sZXJhbmNlKTtcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IFN0cmF0ZWd5OyJdfQ==