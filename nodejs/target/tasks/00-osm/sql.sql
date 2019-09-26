create table if not exists osm.relation_way
(
    relation_id varchar,
    way_id varchar,
    id bigint,
    role varchar,
    geom geometry,
    primary key (relation_id, way_id),
    constraint enforce_srid_geom CHECK (st_srid(geom) = 4326)
);


create index osm_relation_way_geom_idx
on osm.relation_way using gist
(geom);

create index osm_relation_way_id_idx
on osm.relation_way using btree
(id);



create table if not exists osm.relation_dump
(
    relation_id varchar,
    path integer,
    id bigint,
    role varchar,
    geom geometry,
    area float,
    primary key (relation_id, id, path, role),
    constraint enforce_srid_geom CHECK (st_srid(geom) = 4326)
);


create index osm_relation_dump_geom_idx
on osm.relation_dump using gist
(geom);


create table if not exists osm.relation_aggregate
(
    id bigint primary key,
    parent_id bigint,
    level integer,
    iso varchar,
    osm_ids bigint[],
    zh_name varchar,
    en_name varchar,
    geom geometry,
    CONSTRAINT enforce_srid_geom CHECK (st_srid(geom) = 4326)
);

CREATE INDEX osm_relation_aggregate_geom_idx
ON osm.relation_aggregate USING gist
(geom);

create INDEX osm_relation_aggregate_parent_id_idx
on osm.relation_aggregate using btree
(parent_id);

create index osm_relation_aggregate_level_idx
on osm.relation_aggregate using btree
(level);





create table if not exists osm.feature_land
(
    id bigserial primary key,
    geom geometry,
    CONSTRAINT enforce_srid_geom CHECK (st_srid(geom) = 4326)
);

create index osm_feature_land_geom_idx
on osm.feature_land using gist
(geom);



create table if not exists osm.feature_coastline
(
    id bigserial primary key,
    geom geometry,
    CONSTRAINT enforce_srid_geom CHECK (st_srid(geom) = 4326)
);


create index osm_feature_coastline_geom_idx
on osm.feature_coastline using gist
(geom);


create table if not exists osm.feature_water
(
    id bigserial primary key,
    geom geometry,
    CONSTRAINT enforce_srid_geom CHECK (st_srid(geom) = 4326)
);

create index osm_feature_water_geom_idx
on osm.feature_water using gist
(geom);