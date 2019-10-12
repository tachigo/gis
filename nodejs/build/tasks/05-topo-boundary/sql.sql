create table if not exists topo.boundary
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


create index topo_boundary_parent_id_idx
on topo.boundary using btree
(parent_id);

create index topo_boundary_key_idx
on topo.boundary using btree
(key);

create index topo_boundary_level_idx
on topo.boundary using btree
(level);

create index topo_boundary_geom_idx
on topo.boundary using gist
(geom);

create index topo_boundary_mdd_id_idx
on topo.boundary using btree
(mdd_id);

create index topo_boundary_region_id_idx
on topo.boundary using btree
(region_id);