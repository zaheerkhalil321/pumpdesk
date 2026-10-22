-- 0005: a job site only needs a town. The street address (or cross streets) is optional.
alter table public.job_sites alter column address_line_1 drop not null;
