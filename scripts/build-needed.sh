#!/usr/bin/env bash
# Does this run have to build? Prints build=true or build=false (for $GITHUB_OUTPUT).
#
# Push and manual runs always build. The nightly run exists for the item
# catalogue and builds only when the live site is not made from this commit and
# the current catalogue: it compares /items/build.txt of the live site with the
# commit and the digest of the bundle on the media host. It skips only on an
# exact match - a failed lookup, a bundle without digest or a missing build.txt
# all mean build. A failed deploy is therefore caught up the next night.
#
#   EVENT=schedule SHA=<commit> scripts/build-needed.sh
set -uo pipefail

[ "${EVENT:-}" = schedule ] || { echo build=true; exit 0; }

media=${MEDIA_HOST:-https://media.voidtales.win}
site=${SITE:-https://portal.voidtales.win}
# Cache busters: the edge holds the media host for a month and HTML for 5 minutes.
cb=$(date +%s)
items=$(curl -fsS --max-time 30 "$media/items/items.json?cb=$cb" | jq -r '.digest // empty') || items=
have=$(curl -fsS --max-time 30 "$site/items/build.txt?cb=$cb") || have=
want=$(printf 'commit %s\nitems %s' "${SHA:?}" "$items")

echo "live:   ${have//$'\n'/ · }" >&2
echo "wanted: ${want//$'\n'/ · }" >&2
if [ -n "$items" ] && [ "$have" = "$want" ]; then echo build=false; else echo build=true; fi
