SET check_function_bodies = false;
CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);
CREATE TABLE public.sms_track (
    id integer NOT NULL,
    type text NOT NULL,
    phone_no text NOT NULL,
    user_id text NOT NULL,
    instance_id uuid NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text NOT NULL,
    message_id text NOT NULL
);
CREATE SEQUENCE public.sms_track_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.sms_track_id_seq OWNED BY public.sms_track.id;
CREATE TABLE public.submission (
    id integer NOT NULL,
    xml_string xml NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone,
    type text NOT NULL,
    status text DEFAULT 'QUEUED'::text NOT NULL,
    remarks text,
    instance_id uuid NOT NULL,
    user_id text NOT NULL
);
CREATE SEQUENCE public.submission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.submission_id_seq OWNED BY public.submission.id;
ALTER TABLE ONLY public.sms_track ALTER COLUMN id SET DEFAULT nextval('public.sms_track_id_seq'::regclass);
ALTER TABLE ONLY public.submission ALTER COLUMN id SET DEFAULT nextval('public.submission_id_seq'::regclass);
ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sms_track
    ADD CONSTRAINT sms_track_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.submission
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);
