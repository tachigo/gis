create table if not exists gps.world
(
    id bigserial primary key,
    parent_id bigint,
    key varchar,
    level varchar,
    iso varchar,
    zh_name varchar,
    en_name varchar,
    geom geometry,
    constraint enforce_srid_geom check (st_srid(geom) = 4326)
);

create index gps_world_parent_id_idx
on gps.world using btree
(parent_id);

create index gps_world_key_idx
on gps.world using btree
(key);

create index gps_world_level_idx
on gps.world using btree
(level);

create index gps_world_geom_idx
on gps.world using gist
(geom);


create table if not exists gps.mfw
(
    id bigserial primary key,
    parent_id bigint,
    key varchar,
    level varchar,
    iso varchar,
    zh_name varchar,
    en_name varchar,
    geom geometry,
    region_id bigint,
    mdd_id bigint,
    constraint enforce_srid_geom check (st_srid(geom) = 4326)
);

create index gps_mfw_parent_id_idx
on gps.mfw using btree
(parent_id);

create index gps_mfw_key_idx
on gps.mfw using btree
(key);

create index gps_mfw_level_idx
on gps.mfw using btree
(level);

create index gps_mfw_geom_idx
on gps.mfw using gist
(geom);

create index gps_mfw_mdd_id_idx
on gps.mfw using btree
(mdd_id);

create index gps_mfw_region_id_idx
on gps.mfw using btree
(region_id);