'use strict';


class LibLWGeom {

  static async getPointCount(pg, geom) {
    return await pg
      .query(`select ST_Points($1::geometry) as points`, [geom])
      .then(res => {
        return +res.rows[0]['points'];
      })
    ;
  }


  static async topoSnap(pg, src, tgt, tol, desc) {
    let changed;
    let tmp = src;
    let iterations = 0;
    const maxIterations = await LibLWGeom.getPointCount(pg, tgt);
    const tmpVertices = LibLWGeom.getPointCount(pg, tmp);
    do {
      const tmp2 = await pg
        .query(`select ST_AsHEXEWKB(ST_Snap($1::geometry, $2::geometry, $3::float)) as geom`, [tmp, tgt, tol])
        .then(res => {
          return res.rows[0]['geom'];
        })
      ;
      ++iterations;
      const tmp2Vertices = LibLWGeom.getPointCount(pg, tmp2);
      changed = (tmp2Vertices !== tmpVertices);
      console.log(desc, `After iteration ${iterations}, geometry changed ? ${changed} (${tmp2Vertices} vs ${tmpVertices} vertices)`);
      if (tmp !== src) {
        tmp = tmp2;
      }
    } while (changed && iterations <= maxIterations);

    console.log(desc, `It took ${iterations}/${maxIterations} iterations to properly snap`);
    return tmp;
  }


  static async difference(pg, src, tgt) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_Difference($1::geometry, $2::geometry)) as geom`, [src, tgt])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }

  static async symDifference(pg, src, tgt) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_SymDifference($1::geometry, $2::geometry)) as geom`, [src, tgt])
      .then(res => {
        return res.rows[0]['geom'];
      })
      ;
  }

  static async intersection(pg, a, b) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_Intersection($1::geometry, $2::geometry)) as geom`, [a, b])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }

  static async lineMerge(pg, a) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_LineMerge($1::geometry)) as geom`, [a])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }

  static async union(pg, a, b) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_Union($1::geometry, $2::geomettry)) as geom`, [a, b])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }


  static async splitByNodes(pg, src, nodes) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_Split($1::geometry, $2::geometry)) as geom`, [src, nodes])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }


  static async unaryUnion(pg, a) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_UnaryUnion($1::geometry)) as geom`, [a])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }


  static async getClosestPoint(pg, geom1, geom2) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_ClosestPoint($1::geometry, $2::geometry)) as geom`, [geom1, geom2])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }


  static async isEqual(pg, geom1, geom2) {
    return await pg
      .query(`select 1 as id where ST_Equals($1::geometry, $2::geometry)`, [geom1, geom2])
      .then(res => {
        return res.rows.length > 0;
      })
    ;
  }


  static async addPoint(pg, geomLine, geomPoint, position) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_AddPoint($1::geometry, $2::geometry, $3::integer)) as geom`, [geomLine, geomPoint, position])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }


  static async minToleranceDouble(d) {
    return 3.6 * Math.pow(10, - ( 15 - Math.log10( d ? d : 1.0) ));
  }

  static async minTolerance(pg, geom) {
    const row = await pg
      .query(`with 
      ta as (
        select ST_AsHEXEWKB(ST_Envelope($1::geometry)) as geom
      )
      select ST_XMax(geom) as x_max, ST_XMin(geom) as x_min, ST_YMax(geom) as y_max, ST_YMin(geom) as y_min from ta`, [geom])
      .then(res => {
        return res.rows[0] || [];
      })
    ;
    if (row.length === 0) {
      return 0;
    }
    let max = Math.abs(+row['x_min']);
    if (max < Math.abs(+row['x_max'])) {
      max = Math.abs(+row['x_max']);
    }
    if (max < Math.abs(+row['y_min'])) {
      max = Math.abs(+row['y_min']);
    }
    if (max < Math.abs(+row['y_max'])) {
      max = Math.abs(+row['y_max']);
    }

    return this.minToleranceDouble(max);

  }


  static async xMax(pg, geom) {
    return await pg
      .query(`select ST_XMax($1::geometry) as value`)
      .then(res => {
        return +res.rows[0]['value'];
      })
    ;
  }

  static async xMin(pg, geom) {
    return await pg
      .query(`select ST_XMin($1::geometry) as value`)
      .then(res => {
        return +res.rows[0]['value'];
      })
    ;
  }

  static async yMax(pg, geom) {
    return await pg
      .query(`select ST_YMax($1::geometry) as value`)
      .then(res => {
        return +res.rows[0]['value'];
      })
    ;
  }

  static async yMin(pg, geom) {
    return await pg
      .query(`select ST_YMin($1::geometry) as value`)
      .then(res => {
        return +res.rows[0]['value'];
      })
    ;
  }


  static async getStartPoint(pg, geom) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_StartPoint($1::geometry)) as geom`, [geom])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }

  static async getEndPoint(pg, geom) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_EndPoint($1::geometry)) as geom`, [geom])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }


  static async getPointN(pg, geom, n) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_PointN($1::geometry, $2::integer)) as geom`, [geom, +n])
      .then(res => {
        return res.rows[0]['geom']
      })
    ;
  }


  static async setPoint(pg, geomLine, offset, geomPoint) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_SetPoint($1::geometry, $2::integer, $3::geometry)) as geom`, [geomLine, offset, geomPoint])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }

  static async makeValid(pg, geom) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_MakeValid($1::geometry)) as geom`, [geom])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }

  static async removeRepeatedPoints(pg, geom, tol) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_RemoveRepeatedPoints($1::geometry, $2::float)) as geom`, [geom, tol])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }


  static async node(pg, geom) {
    return await pg
      .query(`select ST_AsHEXEWKB(ST_Node($1::geometry)) as geom`, [geom])
      .then(res => {
        return res.rows[0]['geom'];
      })
    ;
  }
}

export default LibLWGeom;