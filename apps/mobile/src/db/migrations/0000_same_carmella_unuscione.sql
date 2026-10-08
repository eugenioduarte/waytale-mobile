CREATE TABLE `downloads` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_type` text NOT NULL,
	`item_id` text NOT NULL,
	`status` text NOT NULL,
	`downloaded_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `downloads_user_item_uq` ON `downloads` (`user_id`,`item_type`,`item_id`);--> statement-breakpoint
CREATE TABLE `journey_events` (
	`id` text PRIMARY KEY NOT NULL,
	`journey_id` text NOT NULL,
	`type` text NOT NULL,
	`stop_id` text,
	`occurred_at` text NOT NULL,
	`payload` text,
	FOREIGN KEY (`journey_id`) REFERENCES `journeys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `journey_events_journey_idx` ON `journey_events` (`journey_id`);--> statement-breakpoint
CREATE TABLE `journeys` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`route_id` text,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text
);
--> statement-breakpoint
CREATE INDEX `journeys_user_idx` ON `journeys` (`user_id`);--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`operation` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`synced_at` text
);
--> statement-breakpoint
CREATE INDEX `outbox_synced_idx` ON `outbox` (`synced_at`);--> statement-breakpoint
CREATE TABLE `places` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`city` text,
	`latitude` real,
	`longitude` real,
	`image_url` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`theme` text,
	`city` text,
	`duration_minutes` integer,
	`distance_meters` real,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `saved_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_type` text NOT NULL,
	`item_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_items_user_item_uq` ON `saved_items` (`user_id`,`item_type`,`item_id`);--> statement-breakpoint
CREATE TABLE `stops` (
	`id` text PRIMARY KEY NOT NULL,
	`route_id` text NOT NULL,
	`place_id` text,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`place_id`) REFERENCES `places`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stops_route_idx` ON `stops` (`route_id`);--> statement-breakpoint
CREATE TABLE `stories` (
	`id` text PRIMARY KEY NOT NULL,
	`stop_id` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`sources` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`stop_id`) REFERENCES `stops`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stories_stop_idx` ON `stories` (`stop_id`);--> statement-breakpoint
CREATE TABLE `story_audio` (
	`id` text PRIMARY KEY NOT NULL,
	`story_id` text NOT NULL,
	`voice_id` text,
	`language` text NOT NULL,
	`audio_key` text,
	`duration_ms` integer,
	FOREIGN KEY (`story_id`) REFERENCES `stories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `story_audio_story_idx` ON `story_audio` (`story_id`);