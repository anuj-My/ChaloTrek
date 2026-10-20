-- Once an organizer is approved, they can't edit their KYC details (PAN, GSTIN,
-- tourism registration) without an admin, so what was reviewed stays what's on
-- file. Before approval, and after a rejection, they can edit and resubmit.

create or replace function public.protect_organizer_kyc_fields()
returns trigger
language plpgsql
as $$
begin
  if public.is_app_user() and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.razorpay_account_id = null;
      new.review_notes = null;
      new.reviewed_at = null;
    else
      if new.razorpay_account_id is distinct from old.razorpay_account_id
         or new.review_notes is distinct from old.review_notes
         or new.reviewed_at is distinct from old.reviewed_at then
        raise exception 'Only an admin can change payout or review fields';
      end if;
      if exists (
        select 1 from public.organizers
        where id = new.organizer_id and kyc_status = 'approved'
      ) then
        raise exception 'KYC details are locked after approval';
      end if;
    end if;
  end if;
  return new;
end;
$$;
