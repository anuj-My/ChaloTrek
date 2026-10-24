-- "Verified organizer" badge: an admin has checked the organizer's state
-- adventure-tourism registration on top of KYC. Public (organizers is
-- readable once approved), set only by admins, and cleared whenever the
-- organizer stops being approved.

alter table public.organizers add column verified_at timestamptz;

create or replace function public.protect_organizer_fields()
returns trigger
language plpgsql
as $$
begin
  if public.is_app_user() and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.kyc_status = 'pending';
      new.verified_at = null;
    elsif new.kyc_status is distinct from old.kyc_status
       or new.owner_user_id is distinct from old.owner_user_id
       or new.verified_at is distinct from old.verified_at then
      raise exception 'Only an admin can change kyc_status, verified_at or owner_user_id';
    end if;
  end if;
  if new.kyc_status <> 'approved' then
    new.verified_at = null;
  end if;
  return new;
end;
$$;
