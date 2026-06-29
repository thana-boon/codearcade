CREATE TABLE IF NOT EXISTS "function_forge_leaderboard" (
	"id" serial PRIMARY KEY NOT NULL,
	"level" text NOT NULL,
	"player_name" text NOT NULL,
	"score" integer NOT NULL,
	"time_seconds" integer NOT NULL,
	"run_count" integer NOT NULL,
	"level_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "function_forge_level_score_idx" ON "function_forge_leaderboard" ("level","score");
