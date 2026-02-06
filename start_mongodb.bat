@echo on
:: y, 2017.6.9, 6.14; 2019.3.9, 5.21, 12.7; 2020.1.28

title %~0

set path=c:\Y\MongoDB\Server\4.2\bin;%path%
set my_db_path=e:\Y\yDB

if not exist %my_db_path% (mkdir %my_db_path%)

mongod --dbpath=%my_db_path% -port 27017 --bind_ip_all

timeout 99