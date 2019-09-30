create table if not exists boundary.mfw
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

create index boundary_mfw_parent_id_idx
on boundary.mfw using btree
(parent_id);

create index boundary_mfw_key_idx
on boundary.mfw using btree
(key);

create index boundary_mfw_level_idx
on boundary.mfw using btree
(level);

create index boundary_mfw_geom_idx
on boundary.mfw using gist
(geom);

create index boundary_mfw_mdd_id_idx
on boundary.mfw using btree
(mdd_id);

create index boundary_mfw_region_id_idx
on boundary.mfw using btree
(region_id);



create table if not exists boundary.water_feature
(
    id bigint,
    fid varchar,
    geom geometry,
    primary key (id, fid),
    constraint enforce_srid_geom check (st_srid(geom) = 4326)
);

create index boundary_water_feature_geom_idx
on boundary.water_feature using gist
(geom);




create table if not exists boundary.line
(
    id bigint,
    type varchar,
    category varchar,
    name varchar,
    geom geometry,
    primary key (id, type, category),
    constraint enforce_srid_geom check (st_srid(geom) = 4326)
);

create index boundary_line_geom_idx
on boundary.line using gist
(geom);