'use strict';

import LibTopoLine from './LibTopoLine';

import pad from 'pad';

class Strategy {


  #topologyLevel;

  /**
   * @var LibTopoLine
   */
  #topology;

  #pg;

  constructor(topologyLevel, pg) {
    this.#topologyLevel = topologyLevel;
    this.#pg = pg;
    this.#topology = this.getTopology();
  }

  /**
   * @returns {LibTopoLine}
   */
  getTopology() {
    const levelNumber = pad(2, this.#topologyLevel, '0');
    const lineDumpSchema = 'topo';
    const lineDumpTable = `lv${levelNumber}_line_dump`;
    const lineTopoSchema = 'topo';
    const lineTopoTable = `lv${levelNumber}_line_topo`;
    return new LibTopoLine(lineDumpSchema, lineDumpTable, lineTopoSchema, lineTopoTable);
  }


  async dumpInit() {
    await this.#topology.initDumpTable(this.#pg);
  }


  async loadBoundaryList(asyncFallback) {
    const table = 'boundary.mfw';
    const limit = 100;
    let count;
    let startId = 0;
    const level = this.#topologyLevel;
    let sql;
    if (level <= 1) {
      sql = `select id, zh_name from ${table} where id > $1 and level::integer <= 1 order by id asc limit ${limit}`;
    } else if (level === 2) {
      sql = `select id, zh_name from ${table} where id > $1 and ((id >= 1 and id < 50) or id > 900000) and level::integer <= 2 order by id asc limit ${limit}`
    } else if (level === 3) {
      sql = `select id, zh_name from ${table} where id > $1 and level::integer <= 2 order by id asc limit ${limit}`
    } else {
      throw new Error('topology level out of range');
    }

    do {
      const rows = await this.#pg
        .query(sql, [startId])
        .then(res => {
          return res.rows || [];
        })
      ;
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
    const rows = await this.#pg
      .query(sql, [id])
      .then(res => {
        return res.rows || [];
      })
    ;
    for await (const row of rows) {
      await asyncFallback(+row['id'], row['type'], row['category']);
    }
  }


  async dumpLines(id, type, category, maxVerticesNum) {
    return await this.#topology.dumpLines(this.#pg, id, type, category, maxVerticesNum);
  }


  async topoInit() {
    await this.#topology.initTopoTable(this.#pg);
  }


  async calcEdges(maxVerticesNum) {
    await this.#topology.calcEdges(this.#pg, maxVerticesNum);
  }

  async checkEdges(maxVerticesNum) {
    await this.#topology.checkEdges(this.#pg, maxVerticesNum);
  }


  async initDump2TopoRelation() {
    await this.#topology.initDump2TopoRelation(this.#pg);
  }


  async initTopo2DumpRelation() {
    await this.#topology.initTopo2DumpRelation(this.#pg);
  }


  async calcTopo2DumpRelation() {
    await this.#topology.calcTopo2Dump(this.#pg);
  }

  async calcDump2TopoRelation() {
    await this.#topology.calcDump2Topo(this.#pg);
  }
}


export default Strategy;