create table "public"."assignments" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "due_date" timestamp with time zone not null,
    "category" text not null,
    "teacher_id" uuid not null,
    "year" integer not null,
    "status" text not null default 'open'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."assignments" enable row level security;

create table "public"."submissions" (
    "id" uuid not null default gen_random_uuid(),
    "assignment_id" uuid not null,
    "student_id" uuid not null,
    "student_name" text,
    "file_name" text not null,
    "file_path" text not null,
    "file_size" bigint,
    "file_type" text,
    "submitted_at" timestamp with time zone not null default now(),
    "grade" integer,
    "feedback" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."submissions" enable row level security;

create table "public"."users" (
    "id" uuid not null,
    "email" text not null,
    "role" text,
    "name" text,
    "avatar_url" text,
    "year" integer,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX assignments_pkey ON public.assignments USING btree (id);

CREATE INDEX idx_assignments_teacher_id ON public.assignments USING btree (teacher_id);

CREATE INDEX idx_assignments_year ON public.assignments USING btree (year);

CREATE INDEX idx_submissions_assignment_id ON public.submissions USING btree (assignment_id);

CREATE INDEX idx_submissions_student_id ON public.submissions USING btree (student_id);

CREATE INDEX idx_users_role ON public.users USING btree (role);

CREATE INDEX idx_users_year ON public.users USING btree (year);

CREATE UNIQUE INDEX submissions_assignment_id_student_id_key ON public.submissions USING btree (assignment_id, student_id);

CREATE UNIQUE INDEX submissions_pkey ON public.submissions USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."assignments" add constraint "assignments_pkey" PRIMARY KEY using index "assignments_pkey";

alter table "public"."submissions" add constraint "submissions_pkey" PRIMARY KEY using index "submissions_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."assignments" add constraint "assignments_category_check" CHECK ((category = ANY (ARRAY['Assignment'::text, 'Tutorial'::text, 'Lab Report'::text]))) not valid;

alter table "public"."assignments" validate constraint "assignments_category_check";

alter table "public"."assignments" add constraint "assignments_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'grading_complete'::text]))) not valid;

alter table "public"."assignments" validate constraint "assignments_status_check";

alter table "public"."assignments" add constraint "assignments_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."assignments" validate constraint "assignments_teacher_id_fkey";

alter table "public"."assignments" add constraint "assignments_year_check" CHECK (((year >= 1) AND (year <= 6))) not valid;

alter table "public"."assignments" validate constraint "assignments_year_check";

alter table "public"."submissions" add constraint "submissions_assignment_id_fkey" FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE not valid;

alter table "public"."submissions" validate constraint "submissions_assignment_id_fkey";

alter table "public"."submissions" add constraint "submissions_assignment_id_student_id_key" UNIQUE using index "submissions_assignment_id_student_id_key";

alter table "public"."submissions" add constraint "submissions_grade_check" CHECK (((grade IS NULL) OR ((grade >= 0) AND (grade <= 100)))) not valid;

alter table "public"."submissions" validate constraint "submissions_grade_check";

alter table "public"."submissions" add constraint "submissions_student_id_fkey" FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."submissions" validate constraint "submissions_student_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

alter table "public"."users" add constraint "users_role_check" CHECK ((role = ANY (ARRAY['student'::text, 'teacher'::text, 'admin'::text]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

alter table "public"."users" add constraint "users_year_check" CHECK (((year IS NULL) OR ((year >= 1) AND (year <= 6)))) not valid;

alter table "public"."users" validate constraint "users_year_check";

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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$function$
;

grant delete on table "public"."assignments" to "anon";

grant insert on table "public"."assignments" to "anon";

grant references on table "public"."assignments" to "anon";

grant select on table "public"."assignments" to "anon";

grant trigger on table "public"."assignments" to "anon";

grant truncate on table "public"."assignments" to "anon";

grant update on table "public"."assignments" to "anon";

grant delete on table "public"."assignments" to "authenticated";

grant insert on table "public"."assignments" to "authenticated";

grant references on table "public"."assignments" to "authenticated";

grant select on table "public"."assignments" to "authenticated";

grant trigger on table "public"."assignments" to "authenticated";

grant truncate on table "public"."assignments" to "authenticated";

grant update on table "public"."assignments" to "authenticated";

grant delete on table "public"."assignments" to "service_role";

grant insert on table "public"."assignments" to "service_role";

grant references on table "public"."assignments" to "service_role";

grant select on table "public"."assignments" to "service_role";

grant trigger on table "public"."assignments" to "service_role";

grant truncate on table "public"."assignments" to "service_role";

grant update on table "public"."assignments" to "service_role";

grant delete on table "public"."submissions" to "anon";

grant insert on table "public"."submissions" to "anon";

grant references on table "public"."submissions" to "anon";

grant select on table "public"."submissions" to "anon";

grant trigger on table "public"."submissions" to "anon";

grant truncate on table "public"."submissions" to "anon";

grant update on table "public"."submissions" to "anon";

grant delete on table "public"."submissions" to "authenticated";

grant insert on table "public"."submissions" to "authenticated";

grant references on table "public"."submissions" to "authenticated";

grant select on table "public"."submissions" to "authenticated";

grant trigger on table "public"."submissions" to "authenticated";

grant truncate on table "public"."submissions" to "authenticated";

grant update on table "public"."submissions" to "authenticated";

grant delete on table "public"."submissions" to "service_role";

grant insert on table "public"."submissions" to "service_role";

grant references on table "public"."submissions" to "service_role";

grant select on table "public"."submissions" to "service_role";

grant trigger on table "public"."submissions" to "service_role";

grant truncate on table "public"."submissions" to "service_role";

grant update on table "public"."submissions" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

create policy "Allow admin to delete assignments"
on "public"."assignments"
as permissive
for delete
to authenticated
using ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Allow admin to insert assignments"
on "public"."assignments"
as permissive
for insert
to authenticated
with check ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Allow admin to update assignments"
on "public"."assignments"
as permissive
for update
to authenticated
using ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text))
with check ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Allow admin to view all assignments"
on "public"."assignments"
as permissive
for select
to authenticated
using ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Allow students to view assignments for their year"
on "public"."assignments"
as permissive
for select
to authenticated
using (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'student'::text) AND (year = ( SELECT users.year
   FROM users
  WHERE (users.id = auth.uid())))));


create policy "Allow teachers to create assignments"
on "public"."assignments"
as permissive
for insert
to authenticated
with check (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'teacher'::text) AND (teacher_id = auth.uid())));


create policy "Allow teachers to delete their own assignments"
on "public"."assignments"
as permissive
for delete
to authenticated
using (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'teacher'::text) AND (teacher_id = auth.uid())));


create policy "Allow teachers to update their own assignments"
on "public"."assignments"
as permissive
for update
to authenticated
using (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'teacher'::text) AND (teacher_id = auth.uid())))
with check (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'teacher'::text) AND (teacher_id = auth.uid())));


create policy "Allow teachers to view their own assignments"
on "public"."assignments"
as permissive
for select
to authenticated
using (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'teacher'::text) AND (teacher_id = auth.uid())));


create policy "Allow admin to delete submissions"
on "public"."submissions"
as permissive
for delete
to authenticated
using ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Allow admin to insert submissions"
on "public"."submissions"
as permissive
for insert
to authenticated
with check ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Allow admin to update submissions"
on "public"."submissions"
as permissive
for update
to authenticated
using ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text))
with check ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Allow admin to view all submissions"
on "public"."submissions"
as permissive
for select
to authenticated
using ((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'admin'::text));


create policy "Allow students to delete their own submissions"
on "public"."submissions"
as permissive
for delete
to authenticated
using (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'student'::text) AND (student_id = auth.uid()) AND (( SELECT assignments.status
   FROM assignments
  WHERE (assignments.id = submissions.assignment_id)) = 'open'::text)));


create policy "Allow students to insert/update their submissions"
on "public"."submissions"
as permissive
for insert
to authenticated
with check (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'student'::text) AND (student_id = auth.uid()) AND (( SELECT assignments.year
   FROM assignments
  WHERE (assignments.id = submissions.assignment_id)) = ( SELECT users.year
   FROM users
  WHERE (users.id = auth.uid()))) AND (( SELECT assignments.status
   FROM assignments
  WHERE (assignments.id = submissions.assignment_id)) = 'open'::text)));


create policy "Allow students to update their submissions (for upsert)"
on "public"."submissions"
as permissive
for update
to authenticated
using (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'student'::text) AND (student_id = auth.uid()) AND (( SELECT assignments.status
   FROM assignments
  WHERE (assignments.id = submissions.assignment_id)) = 'open'::text)))
with check (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'student'::text) AND (student_id = auth.uid()) AND (( SELECT assignments.status
   FROM assignments
  WHERE (assignments.id = submissions.assignment_id)) = 'open'::text)));


create policy "Allow students to view their own submissions"
on "public"."submissions"
as permissive
for select
to authenticated
using (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'student'::text) AND (student_id = auth.uid())));


create policy "Allow teachers to update submissions for their assignments"
on "public"."submissions"
as permissive
for update
to authenticated
using (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'teacher'::text) AND (assignment_id IN ( SELECT assignments.id
   FROM assignments
  WHERE (assignments.teacher_id = auth.uid())))))
with check (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'teacher'::text) AND (assignment_id IN ( SELECT assignments.id
   FROM assignments
  WHERE (assignments.teacher_id = auth.uid())))));


create policy "Allow teachers to view submissions for their assignments"
on "public"."submissions"
as permissive
for select
to authenticated
using (((( SELECT users.role
   FROM users
  WHERE (users.id = auth.uid())) = 'teacher'::text) AND (assignment_id IN ( SELECT assignments.id
   FROM assignments
  WHERE (assignments.teacher_id = auth.uid())))));


create policy "Allow admin to delete users"
on "public"."users"
as permissive
for delete
to authenticated
using ((( SELECT users_1.role
   FROM users users_1
  WHERE (users_1.id = auth.uid())) = 'admin'::text));


create policy "Allow admin to insert users"
on "public"."users"
as permissive
for insert
to authenticated
with check ((( SELECT users_1.role
   FROM users users_1
  WHERE (users_1.id = auth.uid())) = 'admin'::text));


create policy "Allow admin to update any user profile"
on "public"."users"
as permissive
for update
to authenticated
using ((( SELECT users_1.role
   FROM users users_1
  WHERE (users_1.id = auth.uid())) = 'admin'::text))
with check ((( SELECT users_1.role
   FROM users users_1
  WHERE (users_1.id = auth.uid())) = 'admin'::text));


create policy "Allow admin to view all user profiles"
on "public"."users"
as permissive
for select
to authenticated
using ((( SELECT users_1.role
   FROM users users_1
  WHERE (users_1.id = auth.uid())) = 'admin'::text));


create policy "Allow individual user select access"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Allow individual user update access"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


create policy "Allow teachers to view student profiles"
on "public"."users"
as permissive
for select
to authenticated
using (((( SELECT users_1.role
   FROM users users_1
  WHERE (users_1.id = auth.uid())) = 'teacher'::text) AND (role = 'student'::text)));


CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


