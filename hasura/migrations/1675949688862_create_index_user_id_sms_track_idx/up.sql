CREATE  INDEX "user_id_sms_track_idx" on
  "public"."sms_track" using btree ("user_id");
