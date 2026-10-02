#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
	echo "usage: $(basename "$0") <node-script> [arguments...]" >&2
	exit 2
fi

if [[ "$1" == /* ]]; then
	SCRIPT_PATH="$1"
else
	SCRIPT_PATH="$(pwd)/$1"
fi
shift

if [[ ! -f "$SCRIPT_PATH" ]]; then
	echo "error: Unable to locate Node.js script '$SCRIPT_PATH'." >&2
	exit 1
fi

NODE_BIN=""
NODE_VERSION=""
LAST_FOUND_VERSION=""

try_candidate() {
	local candidate="$1"
	if [[ -z "$candidate" || ! -x "$candidate" ]]; then
		return 1
	fi

	local version
	if ! version="$("$candidate" -v 2>/dev/null)"; then
		return 1
	fi

	version="${version//$'\r'/}"
	version="${version#v}"
	if [[ -z "$version" ]]; then
		return 1
	fi

	if [[ ! "$version" =~ ^[0-9]+(\.[0-9]+)*$ ]]; then
		return 1
	fi

	local major="${version%%.*}"
	if (( major >= 20 )); then
		NODE_BIN="$candidate"
		NODE_VERSION="$version"
		return 0
	fi

	LAST_FOUND_VERSION="$version"
	return 1
}

if [[ -z "$NODE_BIN" ]]; then
	# Prefer whatever `command -v` in the current non-interactive shell resolves.
	candidate="$(command -v node 2>/dev/null || true)"
	if try_candidate "$candidate"; then
		NODE_BIN="$candidate"
	fi
fi

if [[ -z "$NODE_BIN" ]]; then
	# Try the user's interactive zsh (common default login shell) which may have NVM/Volta wiring.
	candidate="$(/bin/zsh -lc 'command -v node' 2>/dev/null || true)"
	if try_candidate "$candidate"; then
		NODE_BIN="$candidate"
	fi
fi

if [[ -z "$NODE_BIN" ]]; then
	# Fall back to an interactive bash lookup for users who configure Node there.
	candidate="$(/bin/bash -lc 'command -v node' 2>/dev/null || true)"
	if try_candidate "$candidate"; then
		NODE_BIN="$candidate"
	fi
fi

if [[ -z "$NODE_BIN" && -d "$HOME/.nvm/versions/node" ]]; then
	# Finally, walk common NVM install roots and take the newest eligible Node binary.
	while IFS= read -r candidate; do
		if try_candidate "$candidate"; then
			NODE_BIN="$candidate"
			break
		fi
	done < <(find "$HOME/.nvm/versions/node" -maxdepth 2 -mindepth 2 -type f -name node | sort -r)
fi

if [[ -z "$NODE_BIN" ]]; then
	echo "error: Titanium build scripts require Node.js >=20.x." >&2
	if [[ -n "$LAST_FOUND_VERSION" ]]; then
		echo "       Detected Node.js $LAST_FOUND_VERSION but it is too old for the ES module-based build scripts." >&2
	fi
	exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Using Node.js: $NODE_BIN (${NODE_VERSION:-unknown})" >&2

cd "$REPO_ROOT"
exec "$NODE_BIN" "$SCRIPT_PATH" "$@"
