-- Schéma Supabase / PostgreSQL pour Lapin de Daloa
create extension if not exists pgcrypto;

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  type text not null check (type in ('lapin_frais','lapin_prepare','plat')),
  description text default '',
  weight text default '',
  price integer not null default 0 check (price >= 0),
  wholesale_price integer not null default 0 check (wholesale_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image text default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete restrict,
  type text not null check (type in ('in','out','adjustment')),
  quantity integer not null check (quantity > 0),
  unit_price integer not null default 0,
  reason text default '',
  reference text default '',
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  customer_name text,
  customer_phone text,
  customer_address text,
  sale_type text not null default 'detail' check (sale_type in ('detail','gros')),
  status text not null default 'nouvelle' check (status in ('nouvelle','confirmee','preparee','livree','annulee')),
  total_amount integer not null default 0,
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  total integer generated always as (quantity * unit_price) stored
);

create or replace function register_stock_movement(
  p_product_id uuid,
  p_type text,
  p_quantity integer,
  p_unit_price integer default 0,
  p_reason text default '',
  p_reference text default ''
) returns integer
language plpgsql
security definer
as $$
declare
  current_stock integer;
  new_stock integer;
begin
  if p_quantity <= 0 then raise exception 'La quantité doit être positive'; end if;
  select stock into current_stock from products where id=p_product_id and active=true for update;
  if current_stock is null then raise exception 'Produit introuvable'; end if;

  if p_type='in' then new_stock := current_stock + p_quantity;
  elsif p_type='out' then
    if current_stock < p_quantity then raise exception 'Stock insuffisant'; end if;
    new_stock := current_stock - p_quantity;
  elsif p_type='adjustment' then new_stock := p_quantity;
  else raise exception 'Type de mouvement invalide'; end if;

  update products set stock=new_stock, updated_at=now() where id=p_product_id;
  insert into stock_movements(product_id,type,quantity,unit_price,reason,reference)
  values(p_product_id,p_type,p_quantity,p_unit_price,p_reason,p_reference);
  return new_stock;
end;
$$;

create or replace function create_sale(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_sale_type text,
  p_items jsonb,
  p_note text default ''
) returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_code text;
  item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_price integer;
  v_total integer := 0;
  v_stock integer;
begin
  v_code := 'CMD-' || to_char(now(),'YYYYMMDD-HH24MISS') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,5);
  insert into orders(order_code,customer_name,customer_phone,customer_address,sale_type,note)
  values(v_code,p_customer_name,p_customer_phone,p_customer_address,coalesce(p_sale_type,'detail'),coalesce(p_note,''))
  returning id into v_order_id;

  for item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (item->>'product_id')::uuid;
    v_qty := (item->>'quantity')::integer;
    select stock, case when coalesce(p_sale_type,'detail')='gros' and wholesale_price > 0 then wholesale_price else price end
      into v_stock, v_price from products where id=v_product_id and active=true for update;
    if v_stock is null then raise exception 'Produit introuvable'; end if;
    if v_stock < v_qty then raise exception 'Stock insuffisant pour %', item->>'product_id'; end if;
    insert into order_items(order_id,product_id,quantity,unit_price) values(v_order_id,v_product_id,v_qty,v_price);
    update products set stock=stock-v_qty, updated_at=now() where id=v_product_id;
    insert into stock_movements(product_id,type,quantity,unit_price,reason,reference)
      values(v_product_id,'out',v_qty,v_price,'Vente',v_code);
    v_total := v_total + (v_qty*v_price);
  end loop;

  update orders set total_amount=v_total, status='confirmee' where id=v_order_id;
  return v_order_id;
end;
$$;

alter table products enable row level security;
alter table stock_movements enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists "public read active products" on products;
create policy "public read active products" on products for select using (active=true);

drop policy if exists "public insert orders" on orders;
create policy "public insert orders" on orders for insert with check (true);

drop policy if exists "public insert order items" on order_items;
create policy "public insert order items" on order_items for insert with check (true);

insert into products(code,name,type,description,weight,price,wholesale_price,stock,image)
values
('LF-001','Lapin frais entier','lapin_frais','Lapin frais entier, vendu au détail et en gros.','1,2 à 1,8 kg',8000,7000,0,''),
('LP-001','Lapin préparé entier','lapin_prepare','Lapin nettoyé et préparé, prêt à cuisiner.','1,2 à 1,8 kg',9000,8000,0,'')
on conflict (code) do nothing;
