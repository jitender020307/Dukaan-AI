-- Keep store lookup internal and allow only signed-in clients to call the app RPCs.
revoke execute on function public.current_store_id() from anon,authenticated,public;
revoke execute on function public.is_store_member(uuid) from anon,public;
revoke execute on function public.adjust_stock(uuid,numeric,text) from anon,public;
revoke execute on function public.create_product(jsonb) from anon,public;
revoke execute on function public.add_khata_entry(uuid,text,numeric,text) from anon,public;
revoke execute on function public.complete_sale(jsonb,text,uuid,text) from anon,public;
grant execute on function public.is_store_member(uuid) to authenticated;
grant execute on function public.adjust_stock(uuid,numeric,text),public.create_product(jsonb),public.add_khata_entry(uuid,text,numeric,text),public.complete_sale(jsonb,text,uuid,text) to authenticated;
