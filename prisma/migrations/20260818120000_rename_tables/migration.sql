ALTER TABLE "users" RENAME TO "usuarios";
ALTER TABLE "schedule_slots" RENAME TO "horarios_grade";
ALTER TABLE "appointments" RENAME TO "agendamentos";
ALTER TABLE "notifications" RENAME TO "notificacoes";

ALTER TABLE "usuarios" RENAME CONSTRAINT "users_pkey" TO "usuarios_pkey";
ALTER TABLE "horarios_grade" RENAME CONSTRAINT "schedule_slots_pkey" TO "horarios_grade_pkey";
ALTER TABLE "agendamentos" RENAME CONSTRAINT "appointments_pkey" TO "agendamentos_pkey";
ALTER TABLE "notificacoes" RENAME CONSTRAINT "notifications_pkey" TO "notificacoes_pkey";

ALTER INDEX "users_email_key" RENAME TO "usuarios_email_key";
ALTER INDEX "schedule_slots_day_of_week_start_time_key" RENAME TO "horarios_grade_day_of_week_start_time_key";

ALTER INDEX "appointments_date_idx" RENAME TO "agendamentos_date_idx";
ALTER INDEX "appointments_slot_id_idx" RENAME TO "agendamentos_slot_id_idx";
ALTER INDEX "appointments_user_id_idx" RENAME TO "agendamentos_user_id_idx";
ALTER INDEX "appointments_status_idx" RENAME TO "agendamentos_status_idx";
ALTER INDEX "appointments_user_id_slot_id_date_key" RENAME TO "agendamentos_user_id_slot_id_date_key";

ALTER INDEX "notifications_user_id_read_idx" RENAME TO "notificacoes_user_id_read_idx";

ALTER TABLE "agendamentos" RENAME CONSTRAINT "appointments_user_id_fkey" TO "agendamentos_user_id_fkey";
ALTER TABLE "agendamentos" RENAME CONSTRAINT "appointments_slot_id_fkey" TO "agendamentos_slot_id_fkey";
ALTER TABLE "notificacoes" RENAME CONSTRAINT "notifications_user_id_fkey" TO "notificacoes_user_id_fkey";
