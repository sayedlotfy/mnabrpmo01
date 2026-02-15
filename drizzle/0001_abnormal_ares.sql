CREATE TABLE `budgetExpenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `budgetExpenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgetLabor` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`staffId` int NOT NULL,
	`hours` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `budgetLabor_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`description` text,
	`reimbursable` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` text NOT NULL,
	`type` enum('Contract','VO') NOT NULL DEFAULT 'Contract',
	`amount` decimal(15,2) NOT NULL,
	`date` date NOT NULL,
	`requirements` text,
	`status` enum('Pending','Due','Claimed','Invoiced','PaidPartial','PaidFull') NOT NULL DEFAULT 'Pending',
	`paidAmount` decimal(15,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` text NOT NULL,
	`code` varchar(100) NOT NULL,
	`manager` text,
	`coordinator` text,
	`totalContractValue` decimal(15,2) NOT NULL,
	`overheadMultiplier` decimal(5,2) NOT NULL DEFAULT '2.5',
	`targetMargin` decimal(5,2) NOT NULL DEFAULT '20',
	`currency` varchar(10) NOT NULL DEFAULT 'SAR',
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`stoppageDays` int NOT NULL DEFAULT 0,
	`percentComplete` decimal(5,2) NOT NULL DEFAULT '0',
	`isPaused` boolean NOT NULL DEFAULT false,
	`pauseStartDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`baseRate` decimal(10,2) NOT NULL,
	`location` enum('Riyadh','Cairo') NOT NULL DEFAULT 'Cairo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`staffId` int NOT NULL,
	`hours` decimal(10,2) NOT NULL,
	`phase` varchar(100) NOT NULL,
	`description` text,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timeLogs_id` PRIMARY KEY(`id`)
);
