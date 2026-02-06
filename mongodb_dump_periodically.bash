#!/usr/bin/env bash -o igncr
# y, mongodb_dump_periodically.bash
# 2018.4.12 - 13, 6.25, 7.9 - 11, 8.8, 8.10

bash_bin_path="c:\Y\cygwin64\bin"
mongodb_bin_path="c:\Y\MongoDB\Server\3.4\bin"
mongodb_dump_path="e:\mongodb_dump"
mongodb_dump_prefix="mongodb_dump"
mongodb_dump_max=5

find_exe=$(cygpath -u $bash_bin_path\\find.exe)
mongodump_exe=$(cygpath -u "$mongodb_bin_path\\mongodump.exe)

mkdir -p "$mongodb_dump_path"

echo "pwd=$PWD"
# basename "$PWD"
# echo "${PWD##*/}"
today=$(date +%Y-%m-%d)
echo "today=$today"

folders=$($find_exe "$mongodb_dump_path" -maxdepth 1 -type d -name "$mongodb_dump_prefix?*")
readarray -t folders <<< "$folders"
folder_count=${#folders[@]}
if (( $folder_count > $mongodb_dump_max )); then
    readarray -t sorted < <(for a in "${folders[@]}"; do echo "$a"; done | sort)
    k=0
    for j in ${!sorted[@]}; do
        j=$((j + 1))
        if (( $j >= $mongodb_dump_max )); then
            folder=$(cygpath -w "${sorted[$k]}")
            echo "deleted .. $folder"
            rm -rf "$folder"
            k=$((k + 1))
        fi
    done
fi

new_dump_folder="$mongodb_dump_path\\$mongodb_dump_prefix $today"
echo "creating .. $new_dump_folder"
$mongodump_exe --host localhost --port 27017 --out "$new_dump_folder"
