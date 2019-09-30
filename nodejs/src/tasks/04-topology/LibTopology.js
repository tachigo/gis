'use strict';



class LibTopology {

  #topology;
  #pg;
  #srid;

  constructor(pg, topologyName, srid) {
    this.#pg = pg;
    this.#topology = topologyName;
    this.#srid = srid;
  }

  get topology() {
    return this.#topology;
  }

  get pg() {
    return this.#pg;
  }

  get srid() {
    return this.#srid;
  }

  async createTopology() {
    const pg = this.#pg;
    return await pg
      .query(`select topology.CreateTopology($1::varchar, $2::integer) as topo_id`, [this.#topology, this.#srid])
      .then(res => {
        return res.rows[0]['topo_id'] || 0;
      });
  }

  async dropTopology() {
    const pg = this.#pg;
    return await pg.query(`select topology.DropTopology($1::varchar)`, [this.#topology]);
  }


  async addLineString(selectGeomSql) {

  }

}



export default LibTopology;