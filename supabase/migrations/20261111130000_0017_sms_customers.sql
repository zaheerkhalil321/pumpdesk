-- 0017_sms_customers: texts can also go straight to a customer's own number, and no longer need an order.

alter table public.sms_messages add column customer_id uuid;
alter table public.sms_messages add constraint sms_messages_customer_fkey
  foreign key (company_id, customer_id) references public.customers (company_id, id);
alter table public.sms_messages drop constraint sms_messages_recipient_kind_check;
alter table public.sms_messages add constraint sms_messages_recipient_kind_check
  check (recipient_kind in ('contact', 'operator', 'customer'));
grant insert (customer_id) on public.sms_messages to authenticated;
