-- ============================================================
-- 007_admin_edita_perfiles.sql
-- Hasta ahora un usuario solo podía editar SU PROPIO perfil
-- (profiles_update_own_basic_fields). Un administrador necesita
-- poder editar el nombre y el estado (activo/suspendido) de
-- CUALQUIER perfil desde /admin/usuarios/[id]/.
--
-- El trigger "prevent_role_self_escalation" ya existente sigue
-- protegiendo la columna "role": solo se puede cambiar si
-- is_admin() es verdadero, y este panel de edición nunca envía
-- "role" en el update de todos modos.
-- ============================================================

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());
