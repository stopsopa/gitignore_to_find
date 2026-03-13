#!/bin/bash
set -e
set -o pipefail
find "$@" | sed 's|^\./||'
