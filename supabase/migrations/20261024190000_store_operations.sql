-- Store-scoped operations. Existing profiles/stores and role names are preserved.
-- Merchant confirmed all authenticated store roles may edit stock and Khata.
create or replace function public.current_store_id()
returns uuid language sql stable security definer set search_path=public
as $$ select store_id from public.profiles where id=auth.uid() $$;
create or replace function public.is_store_member(target_store uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and store_id=target_store) $$;
revoke all on function public.current_store_id() from public;
revoke all on function public.is_store_member(uuid) from public;
grant execute on function public.current_store_id(),public.is_store_member(uuid) to authenticated;

create table public.products(
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 name text not null, name_hi text not null default '', barcode text, category text not null default 'General',
 stock numeric(12,3) not null default 0 check(stock>=0), unit text not null default 'piece',
 min_stock numeric(12,3) not null default 0 check(min_stock>=0), cost_price numeric(12,2) not null default 0 check(cost_price>=0),
 selling_price numeric(12,2) not null default 0 check(selling_price>=0), mrp numeric(12,2) not null default 0 check(mrp>=0),
 distributor text not null default '', distributor_phone text not null default '', lead_days integer not null default 1 check(lead_days>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(store_id,id));
create unique index products_store_barcode_unique on public.products(store_id,barcode) where barcode is not null and barcode<>'';
create index products_store_name_idx on public.products(store_id,name);

create table public.customers(
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 name text not null, phone text not null default '', address text not null default '',
 credit_limit numeric(12,2) not null default 3000 check(credit_limit>=0), created_at timestamptz not null default now(), unique(store_id,id));
create table public.sales(
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 invoice_no text not null, customer_id uuid, customer_name text not null default '',
 payment_method text not null check(payment_method in ('cash','upi','khata')),
 total_amount numeric(12,2) not null check(total_amount>=0), created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), unique(store_id,id), unique(store_id,invoice_no),
 foreign key(store_id,customer_id) references public.customers(store_id,id));
create table public.sale_items(
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 sale_id uuid not null, product_id uuid not null, product_name text not null,
 quantity numeric(12,3) not null check(quantity>0), price_per_unit numeric(12,2) not null check(price_per_unit>=0),
 line_total numeric(12,2) not null check(line_total>=0),
 foreign key(store_id,sale_id) references public.sales(store_id,id) on delete cascade,
 foreign key(store_id,product_id) references public.products(store_id,id));
create table public.khata_entries(
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 customer_id uuid not null, sale_id uuid, entry_type text not null check(entry_type in ('udhaar','jama')),
 amount numeric(12,2) not null check(amount>0), description text not null default '',
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 foreign key(store_id,customer_id) references public.customers(store_id,id),
 foreign key(store_id,sale_id) references public.sales(store_id,id));
create table public.inventory_adjustments(
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 product_id uuid not null, delta numeric(12,3) not null check(delta<>0), reason text not null,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 foreign key(store_id,product_id) references public.products(store_id,id));
create index sales_store_created_idx on public.sales(store_id,created_at desc);
create index sale_items_store_sale_idx on public.sale_items(store_id,sale_id);
create index khata_entries_store_customer_idx on public.khata_entries(store_id,customer_id,created_at desc);

alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.khata_entries enable row level security;
alter table public.inventory_adjustments enable row level security;
create policy "store members read products" on public.products for select to authenticated using(public.is_store_member(store_id));
create policy "store members add products" on public.products for insert to authenticated with check(public.is_store_member(store_id));
create policy "store members edit products" on public.products for update to authenticated using(public.is_store_member(store_id)) with check(public.is_store_member(store_id));
create policy "store members read customers" on public.customers for select to authenticated using(public.is_store_member(store_id));
create policy "store members add customers" on public.customers for insert to authenticated with check(public.is_store_member(store_id));
create policy "store members edit customers" on public.customers for update to authenticated using(public.is_store_member(store_id)) with check(public.is_store_member(store_id));
create policy "store members read sales" on public.sales for select to authenticated using(public.is_store_member(store_id));
create policy "store members read sale items" on public.sale_items for select to authenticated using(public.is_store_member(store_id));
create policy "store members read khata" on public.khata_entries for select to authenticated using(public.is_store_member(store_id));
create policy "store members read stock history" on public.inventory_adjustments for select to authenticated using(public.is_store_member(store_id));

-- Table writes for inventory, bills and ledgers are audited through RPCs.
revoke insert,update,delete on public.sales,public.sale_items,public.khata_entries,public.inventory_adjustments from anon,authenticated;
revoke insert,update,delete on public.products from anon,authenticated;
revoke insert,update,delete on public.customers from anon,authenticated;
grant select on public.products,public.customers,public.sales,public.sale_items,public.khata_entries,public.inventory_adjustments to authenticated;
grant update(name,name_hi,barcode,category,unit,min_stock,cost_price,selling_price,mrp,distributor,distributor_phone,lead_days,updated_at) on public.products to authenticated;
grant insert(store_id,name,phone,address,credit_limit) on public.customers to authenticated;
grant update(name,phone,address,credit_limit) on public.customers to authenticated;

create or replace function public.adjust_stock(p_product_id uuid,p_delta numeric,p_reason text)
returns public.products language plpgsql security definer set search_path=public
as $$ declare s uuid; result public.products; begin
 s:=public.current_store_id();
 if s is null or p_delta=0 or length(trim(coalesce(p_reason,'')))=0 then raise exception 'Invalid stock adjustment'; end if;
 update public.products set stock=stock+p_delta,updated_at=now() where id=p_product_id and store_id=s and stock+p_delta>=0 returning * into result;
 if not found then raise exception 'Product missing or stock cannot be negative'; end if;
 insert into public.inventory_adjustments(store_id,product_id,delta,reason,created_by) values(s,p_product_id,p_delta,trim(p_reason),auth.uid());
 return result;
end $$;

create or replace function public.create_product(p_product jsonb)
returns public.products language plpgsql security definer set search_path=public
as $$ declare s uuid; result public.products; opening numeric; begin
 s:=public.current_store_id(); if s is null then raise exception 'A store profile is required'; end if;
 opening:=greatest(0,coalesce((p_product->>'stock')::numeric,0));
 insert into public.products(store_id,name,name_hi,barcode,category,stock,unit,min_stock,cost_price,selling_price,mrp,distributor,distributor_phone,lead_days)
 values(s,trim(p_product->>'name'),coalesce(p_product->>'name_hi',''),nullif(trim(p_product->>'barcode'),''),coalesce(nullif(p_product->>'category',''),'General'),opening,
 coalesce(nullif(p_product->>'unit',''),'piece'),greatest(0,coalesce((p_product->>'min_stock')::numeric,0)),greatest(0,coalesce((p_product->>'cost_price')::numeric,0)),
 greatest(0,coalesce((p_product->>'selling_price')::numeric,0)),greatest(0,coalesce((p_product->>'mrp')::numeric,0)),coalesce(p_product->>'distributor',''),
 coalesce(p_product->>'distributor_phone',''),greatest(0,coalesce((p_product->>'lead_days')::integer,1))) returning * into result;
 if opening>0 then insert into public.inventory_adjustments(store_id,product_id,delta,reason,created_by) values(s,result.id,opening,'Opening stock',auth.uid()); end if;
 return result;
end $$;

create or replace function public.add_khata_entry(p_customer_id uuid,p_entry_type text,p_amount numeric,p_description text)
returns public.khata_entries language plpgsql security definer set search_path=public
as $$ declare s uuid; result public.khata_entries; begin
 s:=public.current_store_id();
 if s is null or p_entry_type not in ('udhaar','jama') or p_amount<=0 then raise exception 'Invalid Khata entry'; end if;
 if not exists(select 1 from public.customers where id=p_customer_id and store_id=s) then raise exception 'Customer not found'; end if;
 insert into public.khata_entries(store_id,customer_id,entry_type,amount,description,created_by)
 values(s,p_customer_id,p_entry_type,p_amount,coalesce(p_description,''),auth.uid()) returning * into result;
 return result;
end $$;

create or replace function public.complete_sale(p_items jsonb,p_payment_method text,p_customer_id uuid default null,p_customer_name text default '')
returns public.sales language plpgsql security definer set search_path=public
as $$ declare s uuid; sale_row public.sales; item jsonb; prod public.products; qty numeric; total numeric:=0; invoice text; cid uuid; begin
 s:=public.current_store_id(); if s is null then raise exception 'A store profile is required'; end if;
 if p_payment_method not in ('cash','upi','khata') then raise exception 'Invalid payment method'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Sale needs at least one item'; end if;
 if p_payment_method='khata' and p_customer_id is null then raise exception 'Select a customer for a Khata sale'; end if;
 cid:=p_customer_id; if cid is not null and not exists(select 1 from public.customers where id=cid and store_id=s) then raise exception 'Customer not found'; end if;
 for item in select value from jsonb_array_elements(p_items) loop
  qty:=(item->>'quantity')::numeric; if qty<=0 then raise exception 'Quantity must be positive'; end if;
  select * into prod from public.products where id=(item->>'product_id')::uuid and store_id=s for update;
  if not found then raise exception 'Product not found'; end if; if prod.stock<qty then raise exception 'Not enough stock for %',prod.name; end if;
  total:=total+round(prod.selling_price*qty,2);
 end loop;
 invoice:='SALE-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
 insert into public.sales(store_id,invoice_no,customer_id,customer_name,payment_method,total_amount,created_by)
 values(s,invoice,cid,coalesce(p_customer_name,''),p_payment_method,total,auth.uid()) returning * into sale_row;
 for item in select value from jsonb_array_elements(p_items) loop
  qty:=(item->>'quantity')::numeric; select * into prod from public.products where id=(item->>'product_id')::uuid and store_id=s for update;
  update public.products set stock=stock-qty,updated_at=now() where id=prod.id;
  insert into public.inventory_adjustments(store_id,product_id,delta,reason,created_by) values(s,prod.id,-qty,'Sale '||invoice,auth.uid());
  insert into public.sale_items(store_id,sale_id,product_id,product_name,quantity,price_per_unit,line_total)
  values(s,sale_row.id,prod.id,prod.name,qty,prod.selling_price,round(prod.selling_price*qty,2));
 end loop;
 if p_payment_method='khata' then
  insert into public.khata_entries(store_id,customer_id,sale_id,entry_type,amount,description,created_by)
  values(s,cid,sale_row.id,'udhaar',total,'Sale '||invoice,auth.uid());
 end if;
 return sale_row;
end $$;

revoke all on function public.adjust_stock(uuid,numeric,text),public.create_product(jsonb),public.add_khata_entry(uuid,text,numeric,text),public.complete_sale(jsonb,text,uuid,text) from public;
grant execute on function public.adjust_stock(uuid,numeric,text),public.create_product(jsonb),public.add_khata_entry(uuid,text,numeric,text),public.complete_sale(jsonb,text,uuid,text) to authenticated;
