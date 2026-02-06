echo mongodb_shard_to_windows_service.bat
echo y.kim, 2020.11.19
echo %~0
title %~0

:: option

set path=c:\ide\MongoDB\Server\3.4\bin;%path%

set mongodb_shard_name=PASystem_mongodb_shard_s3
set mongodb_shard_folder=d:\mongodb\shard_s3
set mongodb_shard_port=28003
set mongodb_log_folder=f:\mongodb\log

set service_un=pasystem
set service_pw=pasystem

:: create folders

mkdir %mongodb_log_folder%
mkdir %mongodb_shard_folder%

:: mongodb shard server

sc delete "%mongodb_shard_name%"  1> nul  2> nul
mongod.exe  ^
    --install --serviceName "%mongodb_shard_name%"  ^
    --serviceDisplayName "%mongodb_shard_name%"  ^
    --serviceDescription "%mongodb_shard_name%"  ^
    --serviceUser "%service_un%"  ^
    --servicePassword "%service_pw%"  ^
    --shardsvr --dbpath "%mongodb_shard_folder%"  ^
    --port %mongodb_shard_port%  --bind_ip_all ^
    --replSet "%mongodb_shard_name%"  ^
    --wiredTigerCacheSizeGB 7  ^
    --logpath "%mongodb_log_folder%\%mongodb_shard_name%.log"  ^
    --logRotate rename

pause
timeout 9