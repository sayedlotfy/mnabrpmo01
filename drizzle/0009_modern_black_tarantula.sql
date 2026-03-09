CREATE TABLE `internalTransfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`recipient` varchar(255) NOT NULL,
	`department` varchar(100) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`date` varchar(10) NOT NULL,
	`description` text,
	`status` enum('Pending','Paid') NOT NULL DEFAULT 'Pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `internalTransfers_id` PRIMARY KEY(`id`)
);
