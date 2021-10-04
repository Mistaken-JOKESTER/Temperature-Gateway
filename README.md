# Sensor-Gateway
LTE/Ethernet Sensor Gateways Database - Protoype site needed at this stage only to prove intergration is possible.

We are looking to create a database that recieves data packets from two types of Hardware - the detailed Data Protocal Information is contained in the PDFs.

This data will need to be placed into a custom made sql/rds or equalivant database that we can then run querys on from an interactive front end.


## The project

The project is "greenfield". We have a preferred stack but we are open to suggestions, and are happy to be guided by your past experience with high availability applications. Our preferred stack is: 

 - Node w/ TypeScript
 - Relational database (MySQL or Postgres preferred). 
 - All infrastructure will be hosted within AWS. 
 - We are currently thinking a serverless stack, especially for data capture
 - The interactive front end can be any framework, but a major framework such as React would be preferred
 - Telstra API knowledge, as the mobilebroad devices will need remote management/reporting.

## Technical specification

[LoRa Gateway data protocol(4G)-v1.2.pdf](https://github.com/Safety-Mates-Australia/Sensor-Gateway/files/7071808/LoRa.Gateway.data.protocol.4G.-v1.2.pdf)

[LoRa Gateway WIFI data protocol-v1.2.pdf](https://github.com/Safety-Mates-Australia/Sensor-Gateway/files/7080274/LoRa.Gateway.WIFI.data.protocol-v1.2.pdf)


### LoRa Gateway 4G data is hex.

The format of hex code:

Format: Start symbol(2byte) + Packet length(2byte) + Protocol type(2byte) + Hardware type(2byte) + Firmware version(4byte) + IMEI(8byte) + RTC time(6byte) + LBS data length(2byte) + LAC(2byte) + CELLID(4byte) MCC(2byte) + MNC(2byte) + Extension(A) + State data length(2byte) + Alarm type(1byte) + Terminal information(1byte) + CSQ(1byte) +GSM state(1byte) +	Battery voltage(2byte) +Power voltage(2byte) + Extension(B) + Sensor information data length (2byte) + Sensor type(1byte) + Number of the Sensor (1byte) + length of per Sensor (1byte) + Sensor information(X byte) + Extension(C) + Extension(D)+	packet index(2byte) + Check code(2byte) + Stop symbol (2byte)

For example:
54 5A 00 40 24 24 04 06 01 08 00 00 08 66 10 40 26 19 25 60 11 09 12 06 27 1A 00 04 27 B6 11 09 00 08 AA C0 11 37 01 9E 04 BF 00 14 01 01 11 72 17 00 20 00 0E 1A 01 14 2D 36 11 09 12 06 26 1B 0E E7 89 B9 0D 0A

# LoRa Gateway WIFI data is hex.

The format of hex code:

Format: Start symbol(2byte) + Packet length(2byte) + Protocol type(2byte) + Hardware type(2byte) + Firmware version(4byte) + IMEI(8byte) + RTC time(6byte) + Reserved (2byte) + Extension(A) + State data length(2byte) + Alarm type(1byte) + Terminal information(1byte) + Reserved (2byte) +Battery voltage(2byte) +Power voltage(2byte) + Extension(B) + Sensor information data length (2byte) + Sensor type(1byte) + Number of the Sensor (1byte) + length of per Sensor (1byte) + Sensor information(X byte) + Extension(C) + Extension(D) + packet index(2byte) + Check code(2byte) + Stop symbol (2byte)

For example:
54 5A 00 3C 24 24 04 06 02 01 00 00 06 51 88 49 07 90 00 03 12 0C 0A 05 37 13 00 00 00 08 AA C0 00 00 01 A8 04 DF 00 14 01 01 11 72 18 04 76 20 0E 38 00 D6 30 07 12 0C 0A 05 37 12 03 F5 E8 1C 0D 0A
