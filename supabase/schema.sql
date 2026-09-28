create table rabbits (
  id uuid primary key default gen_random_uuid(),
  tag text unique not null,
  breed text,
  sex text check (sex in ('M','F')),
  weight_kg numeric(5,2),
  status text not null default 'en_stock' check (status in ('en_stock','vendu')),
  entered_at date not null default current_date,
  sold_at date,
  sale_type text check (sale_type in ('gros','detail')),
  sale_price integer,
  buyer text
);
create table stock_movements (
  id bigint generated always as identity primary key,
  rabbit_id uuid references rabbits(id) on delete set null,
  tag text,
  type text not null check (type in ('entree','sortie')),
  sale_type text,
  price integer,
  note text,
  created_at timestamptz default now()
);
-- Accès uniquement via le serveur Node (clé service_role)
alter table rabbits enable row level security;
alter table stock_movements enable row level security;
