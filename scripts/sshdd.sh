#! /bin/bash 

function set_value_to
{
    ## set value of parameter1 to the parameter parameter2 specifed.    
    eval local set_value_to_name="$""$2"
    eval "$set_value_to_name"=\""$1"\"
}

function is_ctrl_param
{
    param=$1
    if [ "${param:0:1}" = "-" ]
    then
        second_letter=`echo ${param:1:1} | sed 's/[^'$param_set']//'`
        if [ -z "${second_letter}" ]
        then
            return 2;
        fi
        return 0;
    fi
    return 1;
}

function set_value
{
    param=$1
    value=${param:2}
    if [ -n "${value}" ]
    then
        set_value_to "${value}" "_${param:1:1}"
        return 0
    fi
    return 1
}

function fetch_params
{
    param_number=$#
    for param in "$@"
    do
        param_number=`expr ${param_number} - 1`
        is_ctrl_param "${param}"
        ret=$?
        if [ ${ret} -eq 0 -a -z "${last_param}" ]
        then
            #the ctrl_param is met.
            set_value "${param}"
            ret=$?
            if [ ${ret} -eq 1 ]
            then
                last_param="${param:0:2}"
            fi
        elif [ ${ret} -eq 1 -a -n "${last_param}" ]
        then
            #the value of ctrl_param is met.
            set_value "${last_param}${param}"
            last_param=""
        else
            if [ ${param_number} -eq 0 ]
            then
                modules="${param}"
                break
            fi
            echo params is invalid.
            usage
            exit 1
        fi
    done
}

function kill_proc_tree
{
    local pid=$1
    local sig=${2-SIGKILL}
    kill -stop ${pid} # needed to stop quickly forking parent from producing child between child killing and parent killing
    for child in $( pgrep -P $pid ); do
        kill_proc_tree ${child} ${sig}
    done
    echo "kill $pid"
    kill -${sig} ${pid}
}

function kill_descendant
{
    local pid=$1
    local sig=${2-SIGKILL}
    for child in $( pgrep -P $pid ); do
        kill_proc_tree ${child} ${sig}
    done
}

function usage
{
    echo -e "Usage: $( basename $script_file ) <-m mode> <-f pid_file> [-p pid]"
    echo -e "    -m\t\t mode: daemon client killer"
    echo -e "    -P\t\t only use in killer mode. if specifed, kill the process tree of pid. otherwise, kill all process tree of pid in pid_file."
}


function init
{
    _m=run_mode
    _f=pid_file
    _P=target_pid
    _D=relay_address
    _h=host
    _p=port
    _u=user
    param_set=DfhmpPu
}

function check_params
{
    [ -z "$pid_file" ] && { echo parameter '-f' must be specifed.; usage; exit 1; }
}

init
script_file=$0 
fetch_params "$@"
check_params

cur_pid=$$

case "$run_mode" in
    "daemon")
        {
            flock -n -e 3
            [ $? -eq 1 ] && { echo failed, one process one time!; exit 1; }
            echo $cur_pid 1>&3
            count=1
            while [ 1 -eq 1 ]
            do
                (( count=count+1 ))
                [ $count -gt 10 ] && exit
                password=123456
                "$script_file" -m"client" -f"$pid_file" -D"$relay_address" -h"$host" -p"$port" -u"$user" <<EOF
$password
EOF
                echo "send a dbus message."
                sleep 10
            done 
        } 3>>"$pid_file"
        kill_descendant $cur_pid
        ;;
    "client")
        read password
        echo $cur_pid >> "$pid_file"
        /usr/bin/expect <<EOF
set timeout 60
spawn ssh -N -D$relay_address $user@$host -p$port
while {1} {
    expect {
        eof                        {break}
        "The authenticity of host" {send "yes\r"}
        "password:"                {send "$password\r"}
        "*\]"                      {send "exit\r"}
    }
}
wait
close $spawn_id
EOF
        ;;
    "killer")
        if [ -n "$target_pid" ]
        then
            kill_proc_tree "$target_pid"
            result=`grep '^'"$target_pid"'$' "$pid_file"`
            [ -n "$result" ] && [ `wc -l "$pid_file" | cut -d" " -f1` -eq 1 ] && rm "$pid_file" 
        else
            while read line
            do
                kill_proc_tree "$line"
            done <"$pid_file"
            rm "$pid_file"
        fi
        ;;
esac
