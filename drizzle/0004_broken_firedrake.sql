CREATE TABLE `appUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`role` enum('portfolio_manager','project_manager') NOT NULL DEFAULT 'project_manager',
	`pinHash` varchar(64) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appUsers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `userId` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `totalContractValue` decimal(15,2) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE `projects` ADD `appUserId` int;--> statement-breakpoint
ALTER TABLE `projects` ADD `phase` enum('Concept','Schematic','DD','CD','Tender','Construction') DEFAULT 'Concept' NOT NULL;