'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class LibMfwCustom {
  /**
   * 获取和中国相交的
   * @param pg
   * @returns {Promise<Array<{id, zhName}>>}
   */
  static async countryIntersectWithChina(pg) {
    const table = 'gps.world';
    const sql = `with 
    ta as (
      select geom from ${table} where id = 1
    )
    select tb.id as id, tb.zh_name as zh_name, tb.iso as iso from ${table} as tb, ta 
    where tb.id > 900000 and level <= 1 and st_intersects(ta.geom, tb.geom) = true order by id asc`;
    const res = await pg.query(sql);
    const items = [];
    const ids = [];

    for await (const row of res.rows) {
      ids.push(row['id']);
      items.push({
        id: row['id'],
        zhName: row['zh_name']
      });
    }

    return items;
  }

}

var _default = LibMfwCustom;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90YXNrcy8wMi1ncHMvTGliTWZ3Q3VzdG9tLmpzIl0sIm5hbWVzIjpbIkxpYk1md0N1c3RvbSIsImNvdW50cnlJbnRlcnNlY3RXaXRoQ2hpbmEiLCJwZyIsInRhYmxlIiwic3FsIiwicmVzIiwicXVlcnkiLCJpdGVtcyIsImlkcyIsInJvdyIsInJvd3MiLCJwdXNoIiwiaWQiLCJ6aE5hbWUiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0FBSUEsTUFBTUEsWUFBTixDQUFtQjtBQUVqQjs7Ozs7QUFLQSxlQUFhQyx5QkFBYixDQUF1Q0MsRUFBdkMsRUFBMkM7QUFDekMsVUFBTUMsS0FBSyxHQUFHLFdBQWQ7QUFDQSxVQUFNQyxHQUFHLEdBQUk7O3lCQUVRRCxLQUFNOztvRUFFcUNBLEtBQU07bUdBSnRFO0FBTUEsVUFBTUUsR0FBRyxHQUFHLE1BQU1ILEVBQUUsQ0FBQ0ksS0FBSCxDQUFTRixHQUFULENBQWxCO0FBQ0EsVUFBTUcsS0FBSyxHQUFHLEVBQWQ7QUFDQSxVQUFNQyxHQUFHLEdBQUcsRUFBWjs7QUFDQSxlQUFXLE1BQU1DLEdBQWpCLElBQXdCSixHQUFHLENBQUNLLElBQTVCLEVBQWtDO0FBQ2hDRixNQUFBQSxHQUFHLENBQUNHLElBQUosQ0FBU0YsR0FBRyxDQUFDLElBQUQsQ0FBWjtBQUNBRixNQUFBQSxLQUFLLENBQUNJLElBQU4sQ0FBVztBQUNUQyxRQUFBQSxFQUFFLEVBQUVILEdBQUcsQ0FBQyxJQUFELENBREU7QUFFVEksUUFBQUEsTUFBTSxFQUFFSixHQUFHLENBQUMsU0FBRDtBQUZGLE9BQVg7QUFJRDs7QUFDRCxXQUFPRixLQUFQO0FBQ0Q7O0FBMUJnQjs7ZUErQkpQLFkiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cblxuXG5jbGFzcyBMaWJNZndDdXN0b20ge1xuXG4gIC8qKlxuICAgKiDojrflj5blkozkuK3lm73nm7jkuqTnmoRcbiAgICogQHBhcmFtIHBnXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEFycmF5PHtpZCwgemhOYW1lfT4+fVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNvdW50cnlJbnRlcnNlY3RXaXRoQ2hpbmEocGcpIHtcbiAgICBjb25zdCB0YWJsZSA9ICdncHMud29ybGQnO1xuICAgIGNvbnN0IHNxbCA9IGB3aXRoIFxuICAgIHRhIGFzIChcbiAgICAgIHNlbGVjdCBnZW9tIGZyb20gJHt0YWJsZX0gd2hlcmUgaWQgPSAxXG4gICAgKVxuICAgIHNlbGVjdCB0Yi5pZCBhcyBpZCwgdGIuemhfbmFtZSBhcyB6aF9uYW1lLCB0Yi5pc28gYXMgaXNvIGZyb20gJHt0YWJsZX0gYXMgdGIsIHRhIFxuICAgIHdoZXJlIHRiLmlkID4gOTAwMDAwIGFuZCBsZXZlbCA8PSAxIGFuZCBzdF9pbnRlcnNlY3RzKHRhLmdlb20sIHRiLmdlb20pID0gdHJ1ZSBvcmRlciBieSBpZCBhc2NgO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHBnLnF1ZXJ5KHNxbCk7XG4gICAgY29uc3QgaXRlbXMgPSBbXTtcbiAgICBjb25zdCBpZHMgPSBbXTtcbiAgICBmb3IgYXdhaXQgKGNvbnN0IHJvdyBvZiByZXMucm93cykge1xuICAgICAgaWRzLnB1c2gocm93WydpZCddKTtcbiAgICAgIGl0ZW1zLnB1c2goe1xuICAgICAgICBpZDogcm93WydpZCddLFxuICAgICAgICB6aE5hbWU6IHJvd1snemhfbmFtZSddLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBpdGVtcztcbiAgfVxuXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgTGliTWZ3Q3VzdG9tOyJdfQ==