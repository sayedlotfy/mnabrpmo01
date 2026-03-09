ALTER TABLE `projects` ADD `isArchived` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `projects` ADD `archivedBy` int;