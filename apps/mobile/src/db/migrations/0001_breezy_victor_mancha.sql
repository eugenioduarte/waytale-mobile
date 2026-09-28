ALTER TABLE `outbox` ADD `user_id` text;--> statement-breakpoint
ALTER TABLE `outbox` ADD `attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `outbox` ADD `last_error` text;--> statement-breakpoint
ALTER TABLE `outbox` ADD `failed_at` text;--> statement-breakpoint
CREATE INDEX `outbox_entity_idx` ON `outbox` (`entity_type`,`entity_id`);