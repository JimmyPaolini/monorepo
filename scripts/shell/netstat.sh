#!/bin/bash
#
# # netstat (network statistics) 📡
#
# netstat [options]
#
# ## Options 🔧
# - `-a`   Show all sockets (listening and non-listening)
# - `-g`   Show multicast group information (used with other modes)
# - `-i`   Show interfaces table / interface stats
# - `-I <interface>` Show info for a specific interface
# - `-n`   Show numeric addresses (no reverse DNS)
# - `-s`   Show protocol statistics (can be combined with `-p` or `-f`)
# - `-m`   Show memory/buffer statistics
# - `-r`   Show routing table (use `-rn` for numeric)
# - `-f <address_family>` Filter by address family (inet, inet6)
# - `-p <protocol>` Filter by protocol (tcp, udp)
# - `-w <wait>` Interval/wait setting for repeated output (used with `-I`)
#
# ## Examples 📝
#
# Show all connections:
# netstat -a
#
# Show listening TCP connections:
# netstat -lt
#
# Show statistics for UDP:
# netstat -su
#
# Show IP addresses only (no DNS):
# netstat -an
#
# Show established connections:
# netstat -an | grep ESTABLISHED
#
# Show connections on a specific port (replace #### with port number):
# netstat -an | grep ":####"

# # Notepad 🗒️
# Use the space below to write and run your netstat commands.
# For example:
netstat -an
