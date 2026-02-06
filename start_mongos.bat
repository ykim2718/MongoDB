echo start_mongos.bat
echo y, 2018.4.9, 7.11
title %~0

set path=d:\IDE\MongoDB\Server\3.4\bin;%path%

mongos.exe  ^
    --configdb pasystem/12.23.64.181:28002,12.23.64.109:28002,12.23.64.167:28002,12.23.64.148:28002  ^
    --port  28000

pause
