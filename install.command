#!/bin/bash
# Double-click this file in Finder, or run `bash install.command` in Terminal.
# Any missing prerequisite (Xcode CLT, Homebrew, Node.js, dsh) is detected and
# auto-installed.
#
#   bash install.command            interactive install
#   bash install.command --yes      auto-install missing prerequisites
#   bash install.command --check    only verify prerequisites, then exit
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

CHECK=0
for arg in "$@"; do
  [ "$arg" = "--check" ] && CHECK=1
done

if bash "$ROOT/scripts/install.sh" "$@"; then
  :
else
  status=$?
  echo ""
  echo "Installation failed. Review the message above, then try again."
  if [ -t 0 ]; then
    read -r -p "Press Return to close..." _
  fi
  exit "$status"
fi

if [ "$CHECK" -ne 1 ]; then
  echo "==> Opening DSH"
  open /Applications/DSH.app
fi
