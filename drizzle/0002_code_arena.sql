CREATE TABLE IF NOT EXISTS "code_arena_leaderboard" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" text NOT NULL,
	"player_name" text NOT NULL,
	"score" integer NOT NULL,
	"time_seconds" integer NOT NULL,
	"steps_used" integer NOT NULL,
	"wall_hits" integer NOT NULL,
	"level_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_arena_level_score_idx" ON "code_arena_leaderboard" ("level","score");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "code_arena_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_code" text NOT NULL,
	"room_name" text NOT NULL,
	"password" text NOT NULL,
	"level" text NOT NULL,
	"level_ids" text NOT NULL,
	"host_token" text NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "code_arena_rooms_room_code_unique" UNIQUE("room_code")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_arena_room_code_idx" ON "code_arena_rooms" ("room_code");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "code_arena_room_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"player_token" text NOT NULL,
	"player_name" text NOT NULL,
	"levels_completed" integer DEFAULT 0 NOT NULL,
	"total_score" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_arena_room_players_room_idx" ON "code_arena_room_players" ("room_id");
