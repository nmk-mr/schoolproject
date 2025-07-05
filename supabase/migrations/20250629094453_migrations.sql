alter table "public"."assignments" add column "file_name" text;

alter table "public"."assignments" add column "file_path" text;

alter table "public"."assignments" add column "file_size" integer;

alter table "public"."assignments" add column "file_type" text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email) -- 'role' will now be NULL by default as it's nullable
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$function$
;


