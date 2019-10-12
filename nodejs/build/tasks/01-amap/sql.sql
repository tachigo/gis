create table if not exists amap.china
(
    id bigserial primary key,
    parent_id bigint,
    iso varchar,
    level integer,
    zh_name varchar,
    en_name varchar,
    geom geometry,
    CONSTRAINT enforce_srid_geom CHECK (st_srid(geom) = 4326)
);


CREATE INDEX amap_china_geom_idx
ON amap.china USING gist
(geom);

create INDEX amap_china_parent_id_idx
on amap.china using btree
(parent_id);

create INDEX amap_china_level_idx
on amap.china using btree
(level);

