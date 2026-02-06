echo mongos_to_windows_taskscheduler.bat
echo y.kim, 2018.4.13 - 4.16

title %~0
set task_name=PASYSTEM_mongos
schtasks /delete /tn %task_name% /f
schtasks /create /sc onstart /tn %task_name%  ^
    /tr "mongos.exe --configdb replSetName/cfg1:27019,cfg2:27019,cfg3:27019 --port 27018"
schtasks /tn %task_name%

pause
timeout 9