PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_email_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`html_body` text NOT NULL,
	`text_body` text NOT NULL,
	`parts` text NOT NULL,
	`subject` text,
	`date` text NOT NULL,
	`from` text NOT NULL,
	`in_reply_to` text,
	`email_thread_id` text,
	FOREIGN KEY (`email_thread_id`) REFERENCES `email_threads`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_email_messages`("id", "message_id", "html_body", "text_body", "parts", "subject", "date", "from", "in_reply_to", "email_thread_id") SELECT "id", "message_id", "html_body", "text_body", "parts", "subject", "date", "from", "in_reply_to", "email_thread_id" FROM `email_messages`;--> statement-breakpoint
DROP TABLE `email_messages`;--> statement-breakpoint
ALTER TABLE `__new_email_messages` RENAME TO `email_messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `email_messages_id_unique` ON `email_messages` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_messages_message_id_unique` ON `email_messages` (`message_id`);