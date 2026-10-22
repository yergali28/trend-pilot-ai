-- Комиссия площадки по конкретному товару от провайдера аналитики (MPSTATS: commission_fbo, %).
-- Точнее справочника по предметам: провайдер отдаёт ставку, действующую для карточки.
alter table public.listing_stats add column commission_pct numeric check (commission_pct between 0 and 100);
