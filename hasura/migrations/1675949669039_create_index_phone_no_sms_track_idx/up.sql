CREATE  INDEX "phone_no_sms_track_idx" on
  "public"."sms_track" using btree ("phone_no");
