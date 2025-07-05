drop policy "Allow admin to delete users" on "public"."users";

drop policy "Allow admin to insert users" on "public"."users";

drop policy "Allow admin to update any user profile" on "public"."users";

drop policy "Allow admin to view all user profiles" on "public"."users";

drop policy "Allow teachers to view student profiles" on "public"."users";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM users WHERE id = auth.uid();
$function$
;

create policy "Allow authenticated users to read their own data"
on "public"."users"
as permissive
for select
to authenticated
using ((auth.uid() = id));


create policy "Allow admin to delete users"
on "public"."users"
as permissive
for delete
to authenticated
using ((get_my_role() = 'admin'::text));


create policy "Allow admin to insert users"
on "public"."users"
as permissive
for insert
to authenticated
with check ((get_my_role() = 'admin'::text));


create policy "Allow admin to update any user profile"
on "public"."users"
as permissive
for update
to authenticated
using ((get_my_role() = 'admin'::text))
with check ((get_my_role() = 'admin'::text));


create policy "Allow admin to view all user profiles"
on "public"."users"
as permissive
for select
to authenticated
using ((get_my_role() = 'admin'::text));


create policy "Allow teachers to view student profiles"
on "public"."users"
as permissive
for select
to authenticated
using (((get_my_role() = 'teacher'::text) AND (role = 'student'::text)));



