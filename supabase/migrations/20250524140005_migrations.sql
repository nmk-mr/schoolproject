create policy "Allow authenticated users to read teacher names"
on "public"."users"
as permissive
for select
to authenticated
using ((role = 'teacher'::text));



