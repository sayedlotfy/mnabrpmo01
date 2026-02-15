ALTER TABLE `payments` MODIFY COLUMN `date` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `startDate` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `endDate` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `timeLogs` MODIFY COLUMN `startDate` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `timeLogs` MODIFY COLUMN `endDate` varchar(10) NOT NULL;