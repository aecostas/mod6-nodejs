create database poi_db;
create schema poi_schema;

create table collections (
id serial not null,
collection varchar(50) not null
);

create table poi (
id serial not null,
id_collection integer not null,
province varchar(50) not null,
council varchar(50) not null,
"name" varchar(100) not null,
web varchar(100) not null,
coordenadas varchar(100) not null
);

create table "data"(
id serial not null,
id_poi integer not null,
"key" varchar(50) not null,
value varchar(50) not null
);

/* PK */
alter table collections add constraint pk_collections primary key (id);
alter table poi add constraint pk_poi primary key (id);
alter table "data" add constraint pk_data primary key (id);

/* FK */
alter table poi add constraint fk_poi_collections foreign key (id_collection) references collections (id);
alter table "data" add constraint fk_data_poi foreign key (id_poi) references poi (id);