CREATE TABLE `email_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`date` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_threads_id_unique` ON `email_threads` (`id`);--> statement-breakpoint
ALTER TABLE `email_messages` ADD `email_thread_id` text REFERENCES email_threads(id);--> statement-breakpoint
ALTER TABLE `embeddings` ADD `email_thread_id` text REFERENCES email_threads(id);--> statement-breakpoint
CREATE UNIQUE INDEX `embeddings_email_thread_id_unique` ON `embeddings` (`email_thread_id`);