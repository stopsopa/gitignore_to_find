#!/bin/bash
set -e
set -o pipefail
find "$@" -not -path '*/.git/*' | sed 's|^\./||'
