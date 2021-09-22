
--
-- Table structure for table `gateway`
--

DROP TABLE IF EXISTS `gateway`;
CREATE TABLE `gateway` (
  `IMEI` bigint NOT NULL,
  `type` varchar(10) NOT NULL DEFAULT '4g',
  `rtc_time` timestamp NULL DEFAULT NULL,
  `connectToPower` tinyint DEFAULT '0',
  `firmware` varchar(20) DEFAULT NULL,
  `status_present` tinyint DEFAULT NULL,
  `lsb_present` tinyint DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `port` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IMEI`)
);
--
-- Table structure for table `gateway_data`
--

DROP TABLE IF EXISTS `gateway_data`;
CREATE TABLE `gateway_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `rtc_time` varchar(25) NOT NULL,
  `no_of_sensor` int NOT NULL,
  `firmware` varchar(20) DEFAULT NULL,
  `status_present` tinyint NOT NULL,
  `lsb_present` tinyint NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `port` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `gateway_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `gateway_to_ifo_idx` (`gateway_id`),
  CONSTRAINT `gateway_to_ifo` FOREIGN KEY (`gateway_id`) REFERENCES `gateway` (`IMEI`) ON DELETE CASCADE ON UPDATE CASCADE
);
--
-- Table structure for table `lsb`
--

DROP TABLE IF EXISTS `lsb`;
CREATE TABLE `lsb` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `lac` varchar(20) DEFAULT NULL,
  `cell_id` varchar(20) DEFAULT NULL,
  `mcc` varchar(20) DEFAULT NULL,
  `mnc` varchar(20) DEFAULT NULL,
  `gateway_data_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `data_to_lsb_idx` (`gateway_data_id`),
  CONSTRAINT `data_to_lsb` FOREIGN KEY (`gateway_data_id`) REFERENCES `gateway_data` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
--
-- Table structure for table `sensor`
--

DROP TABLE IF EXISTS `sensor`;
CREATE TABLE `sensor` (
  `sensor_id` bigint NOT NULL AUTO_INCREMENT,
  `type` varchar(20) DEFAULT NULL,
  `battery_voltage` float DEFAULT NULL,
  `condition` varchar(10) DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `rssi` int DEFAULT NULL,
  `time` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`sensor_id`)
);
--
-- Table structure for table `sensor_data`
--

DROP TABLE IF EXISTS `sensor_data`;
CREATE TABLE `sensor_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `status` json DEFAULT NULL,
  `battery_voltage` float DEFAULT NULL,
  `condition` varchar(10) DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `humidity` float DEFAULT NULL,
  `rssi` int DEFAULT NULL,
  `time` timestamp NULL DEFAULT NULL,
  `recieved_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sensor_id` bigint NOT NULL,
  `gateway_data_id` bigint NOT NULL,
  `gateway_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sensor_to_data_idx` (`sensor_id`),
  KEY `gatewayData_to_sensor_idx` (`gateway_data_id`),
  KEY `gateway_to_sensordata_idx` (`gateway_id`),
  CONSTRAINT `gateway_to_sensordata` FOREIGN KEY (`gateway_id`) REFERENCES `gateway` (`IMEI`),
  CONSTRAINT `gatewayData_to_sensordata` FOREIGN KEY (`gateway_data_id`) REFERENCES `gateway_data` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sensor_to_data` FOREIGN KEY (`sensor_id`) REFERENCES `sensor` (`sensor_id`) ON DELETE CASCADE ON UPDATE CASCADE
);
--
-- Table structure for table `status`
--

DROP TABLE IF EXISTS `status`;
CREATE TABLE `status` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `alarm_type` varchar(45) DEFAULT NULL,
  `terminal_info` varchar(45) DEFAULT NULL,
  `csq` int DEFAULT NULL,
  `gsm_status` json DEFAULT NULL,
  `battery_voltage` float DEFAULT NULL,
  `power_voltage` float DEFAULT NULL,
  `gateway_data_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `data_to_status_idx` (`gateway_data_id`),
  CONSTRAINT `data_to_status` FOREIGN KEY (`gateway_data_id`) REFERENCES `gateway_data` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

--
-- Dumping routines for database 'sensors'
--

DELIMITER ;;
CREATE PROCEDURE `add_new_packet`(
	IN `imei` bigint,
    IN `type` varchar(10),
	IN `rtc_time` timestamp,
    IN `connectToPower` tinyint,
	IN `no_of_sensor` int,
	IN `sensor_type` varchar(15),
	IN `firmware` varchar(20) ,
	IN `status_present` tinyint,
	IN `lsb_present` tinyint,
    IN `lac` varchar(20), 
	IN `cell_id` varchar(20),
	IN `mcc` varchar(20),
	IN `mnc` varchar(20),
    IN `alarm_type` varchar(45),
	IN `terminal_info` varchar(45),
	IN `csq` int,
	IN `gsm_status` json,
	IN `battery_voltage` float,
	IN `power_voltage` float,
    IN `ip` varchar(45),
    IN `port` varchar(45)
)
BEGIN
	set @gateway_data_id = null;
	if not exists (select IMEI from gateway where gateway.IMEI = `imei`) then
		insert into gateway(IMEI, `type`, rtc_time, connectToPower, firmware, status_present, lsb_present, ip, `port`)
        value(`imei`, `type`, `rtc_time`, `connectToPower`, `firmware`, `status_present`, `lsb_present`, `ip`, `port`);
	else 
		update gateway
			set `type`=`type`,
				rtc_time=`rtc_time`,
                connectToPower=`connectToPower`,
				firmware=`firmware`,
				status_present=`status_present`,
				lsb_present=`lsb_present`,
				ip=`ip`,
				`port`=`port`
                where gateway.IMEI = `imei`;
    end if;
    
    insert into gateway_data(rtc_time, no_of_sensor, firmware, status_present, lsb_present, gateway_id, ip, `port`)
		value(`rtc_time`, `no_of_sensor`, `firmware`, `status_present`, `lsb_present`, `imei`, `ip`, `port`);
	
    SELECT LAST_INSERT_ID() into @gateway_data_id;
		
    if(`lsb_present`) then
		insert into lsb(lac, cell_id, mcc, mnc, gateway_data_id) 
			value(`lac`, `cell_id`, `mcc`, `mnc`, @gateway_data_id);
    end if;
    if(`status_present`) then
		insert into `status`(alarm_type, terminal_info, csq, gsm_status, battery_voltage, power_voltage, gateway_data_id)
			value(`alarm_type`, `terminal_info`, `csq`, `gsm_status`, `battery_voltage`, `power_voltage`, @gateway_data_id);
    end if;
	
    select @gateway_data_id;
END ;;
DELIMITER ;


DELIMITER ;;
CREATE PROCEDURE `add_sensor`(
	IN `sensor_id` bigint,
    IN `type` varchar(20),
    IN `status` json ,
	IN `battery_voltage` float ,
	IN `condition` varchar(10) ,
	IN `temperature` float ,
	IN `humidity` float ,
	IN `rssi` int ,
	IN `time` timestamp ,
	IN `gateway_data_id` bigint ,
	IN `gateway_id` bigint
)
BEGIN
	set @sensor_id = null;
    select sensor_id into @sensor_id from sensor where sensor.sensor_id = `sensor_id`;
    
    if(isNUll(@sensor_id)) then 
		insert into sensor value(`sensor_id`, `type`,`battery_voltage`,`condition`,`temperature`,`humidity`,`rssi`,`time`);
    else
		update sensor set
			`type`=`type`,
			`battery_voltage`=`battery_voltage`,
			`condition`=`condition`,
			`temperature`=`temperature`,
			`humidity`=`humidity`,
			`rssi`=`rssi`,
			`time`=`time`
            where `sensor_id`=`sensor_id`;
    end if;
    
    insert into sensor_data (`status`,`battery_voltage`,`condition`,`temperature`,`humidity`,`rssi`,`time`,`sensor_id`,`gateway_data_id`,`gateway_id`)
    value(`status`,`battery_voltage`,`condition`,`temperature`,`humidity`,`rssi`,`time`,`sensor_id`,`gateway_data_id`,`gateway_id`);
END ;;
DELIMITER ;


DELIMITER ;;
CREATE PROCEDURE `gateway_latest`(
	IN `IMEI` bigint
)
BEGIN
	Set @status = 0;
    Set @gateway_data_id = null;
    
    if exists (select IMEI from gateway where gateway.IMEI = `IMEI`) then
		set @status = 1;
        select @status;
        select * from gateway where gateway.IMEI = `IMEI`;
        
        
        select id into @gateway_data_id from gateway_data where gateway_data.gateway_id = `IMEI` order by id desc limit 1;
        
        select * from gateway_data where gateway_data.id = @gateway_data_id;
        select * from lsb where lsb.gateway_data_id = @gateway_data_id;
        select * from status where status.gateway_data_id = @gateway_data_id;
    else
		select @status;
    end if;
END ;;
DELIMITER ;


DELIMITER ;;
CREATE PROCEDURE `sensor_latest`(
	IN `sensor_id` bigint,
    IN `offset` bigint
)
BEGIN
	Set @status = 0;
    Set @sensor_data_id = null;
    
    if exists (select sensor_id from sensor where sensor.sensor_id = `sensor_id`) then
		set @status = 1;
        select @status;
        select * from sensor where sensor.sensor_id = `sensor_id`;
        select sd.temperature, sd.humidity, sd.condition, sd.status, sd. battery_voltage, sd.time, sd.rssi, gd.gateway_id, gd.firmware, gd.ip, gd.port from sensor_data sd 
			left join gateway_data gd
            on gd.id = sd.gateway_data_id
			where sd.sensor_id = `sensor_id`  order by sd.id desc limit 1;
            
		select * from sensor_data sd where sd.sensor_id = `sensor_id`  order by sd.id desc limit 50 offset `offset`;
    else
		select @status;
    end if;
END ;;
DELIMITER ;