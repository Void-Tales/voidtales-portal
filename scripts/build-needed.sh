#!/usr/bin/env bash
# Does this run have to build? Prints build=true or build=false (for $GITHUB_OUTPUT).
#
# Push and manual runs always build. The nightly run exists for the item
# catalogue and the gallery strip, and builds only when the live site is not made
# from this commit, the current catalogue and the current gallery list: it compares
# /items/build.txt of the live site with the commit and the two digests. It skips only on an
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
gallery=$(curl -fsS --max-time 30 "${GALLERY:-https://gallery.voidtales.win}/images.json?cb=$cb" | sha256sum | cut -c1-16) || gallery=unknown
have=$(curl -fsS --max-time 30 "$site/items/build.txt?cb=$cb") || have=
want=$(printf 'commit %s\nitems %s\ngallery %s' "${SHA:?}" "$items" "$gallery")

echo "live:   ${have//$'\n'/ · }" >&2
echo "wanted: ${want//$'\n'/ · }" >&2
if [ -n "$items" ] && [ "$have" = "$want" ]; then echo build=false; else echo build=true; fi
