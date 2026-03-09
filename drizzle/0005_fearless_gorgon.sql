CREATE TABLE `projectEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`eventType` enum('start','pause','resume') NOT NULL,
	`eventDate` varchar(10) NOT NULL,
	`reason` text NOT NULL,
	`recordedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectEvents_id` PRIMARY KEY(`id`)
);
