create table if not exists topo.line_dump
(
    id bigserial primary key,
    target_id bigint,
    path int,
    type varchar,
    category varchar,
    points integer,
    length float,
    geom geometry,
    constraint enforce_srid_geom check (st_srid(geom) = 4326)
);


create index topo_line_dump_geom_idx
on topo.line_dump using gist
(geom);

