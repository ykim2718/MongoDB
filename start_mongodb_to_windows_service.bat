echo mongodb_to_windows_service.bat
:: y.kim, 2018.5.11 - 12, 12.17; 2019.2.5, 5.21, 12.7; 2020.1.26, 8.3, 11.1, 12.31; 2022.3.23

rem Default MongoDB Port: 27017, 27018, 27019
rem https://docs.mongodb.com/manual/reference/default-mongodb-port/
rem https://docs.mongodb.com/manual/tutorial/enable-authentication
rem https://docs.mongodb.com/manual/reference/program/mongod/#cmdoption-mongod-wiredtigercachesizegb

title %~0
echo %cd%

set path=c:\Y\MongoDB\Server\5.0\bin;%path%

set mongodb_log_path=e:\Y\yDB\log
set mongodb_data_path=e:\Y\yDB\data
set mongodb_service_name=Y_MongoDb
set mongodb_port=27017

if not exist "%mongodb_log_path%" (mkdir "%mongodb_log_path%")
if not exist "%mongodb_data_path%" (mkdir "%mongodb_data_path%")

taskkill /f /im mongod.exe  1>nul 2>nul
sc delete "%mongodb_service_name%"  1>nul 2>nul
mongod --install --serviceName "%mongodb_service_name%"  ^
    --serviceDisplayName "%mongodb_service_name%"  --serviceDescription "%mongodb_service_name%"  ^
    --wiredTigerCacheSizeGB 2  ^
    --dbpath "%mongodb_data_path%"  --port %mongodb_port% --bind_ip_all ^
    --logpath "%mongodb_log_path%\mongodb.log"  --logappend
rem --auth

pause
timeout 9