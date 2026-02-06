echo mongodb_shard_and_config_to_windows_service.bat
echo y.kim, 2018.4.5 - 4.16, 7.9: 2020.11.19
echo %~0
title %~0

:: options

set path=c:\ide\MongoDB\Server\4.2\bin;%path%

set mongodb_log_path=f:\mongodb\log

set mongodb_shard_name=PASystem_mongodb_shard
set mongodb_shard_path=f:\mongodb\shard
set mongodb_shard_port=28001

set mongodb_config_name=PASystem_mongodb_config
set mongodb_config_path=f:\mongodb\config
set mongodb_config_port=28002

set service_un=pasystem
set service_pw=pasystem

:: create folders

mkdir %mongodb_log_path%
mkdir %mongodb_shard_path%
mkdir %mongodb_config_path%


:: mongodb shard server

sc delete "%mongodb_shard_name%"  1> nul  2> nul
mongod.exe  ^
    --install --serviceName "%mongodb_shard_name%"  ^
    --serviceDisplayName "%mongodb_shard_name%"  ^
    --serviceDescription "%mongodb_shard_name%"  ^
    --serviceUser "%service_un%"  ^
    --servicePassword "%service_pw%"  ^
    --shardsvr --dbpath "%mongodb_shard_path%"  ^
    --replSet %service_un%  ^
    --port %mongodb_shard_port%  --bind_ip_all ^
    --wirtedTigerCacheSizeGB 7 ^
    --logpath "%mongodb_log_path%\%mongodb_shard_name%.log"  ^
    --logappend


:: mongodb config server

sc delete "%mongodb_config_name%"  1> nul  2> nul
mongod.exe  ^
    --install --serviceName "%mongodb_config_name%"  ^
    --serviceDisplayName "%mongodb_config_name%"  ^
    --serviceDescription "%mongodb_config_name%"  ^
    --serviceUser "%service_un%"  ^
    --servicePassword "%service_pw%"  ^
    --configsvr --dbpath "%mongodb_config_path%"  ^
    --port %mongodb_config_port%  --bind_ip_all  ^
    --replSet %service_un%  ^
    --logpath "%mongodb_log_path%\mongodb_config.log"  ^
    --logappend

pause
timeout 9