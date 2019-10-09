create table if not exists simplify.topology_dump
(
    id bigserial primary key,
    outer_ids bigint[],
    inner_ids bigint[],
    category varchar,
    geom geometry,
    constraint enforce_srid_geom check (st_srid(geom) = 4326)
);


create index simplify_topology_dump_geom_idx
on simplify.topology_dump using gist
(geom);

create index simplify_topology_dump_outer_ids_idx
on simplify.topology_dump using gin
(outer_ids);


create index simplify_topology_dump_inner_ids_idx
on simplify.topology_dump using gin
(inner_ids);




create table if not exists simplify.dump_simplify
(
    id bigserial primary key,
    outer_ids bigint[],
    inner_ids bigint[],
    category varchar,
    geom geometry,
    constraint enforce_srid_geom check (st_srid(geom) = 4326)
);

create index simplify_dump_simplify_geom_idx
on simplify.dump_simplify using gist
(geom);

create index simplify_dump_simplify_outer_ids_idx
on simplify.dump_simplify using gin
(outer_ids);


create index simplify_dump_simplify_inner_ids_idx
on simplify.dump_simplify using gin
(inner_ids);