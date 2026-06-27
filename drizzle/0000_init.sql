CREATE TABLE IF NOT EXISTS "leaderboard_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" text NOT NULL,
	"player_name" text NOT NULL,
	"score" integer NOT NULL,
	"time_seconds" integer NOT NULL,
	"wrong_attempts" integer NOT NULL,
	"level_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leaderboard_level_score_idx" ON "leaderboard_entries" ("level","score");
