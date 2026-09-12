#!/usr/bin/env bash
# Pinned official binaries, checksum verified before execution. No credentials.
set -euo pipefail
case "${1:-}" in
  actionlint)
    url='https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz'
    checksum='8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8' ;;
  gitleaks)
    url='https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz'
    checksum='551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb' ;;
  grype)
    url='https://github.com/anchore/grype/releases/download/v0.118.0/grype_0.118.0_linux_amd64.tar.gz'
    checksum='1d444c5e7360471815f7158f71935fcecc68a3c417d85c7344f770854300bba2' ;;
  *) echo 'Expected actionlint, gitleaks or grype.' >&2; exit 1 ;;
esac
tool_dir="${RUNNER_TEMP:-/tmp}/pixelforge-ci-tools"
mkdir -p "$tool_dir"
archive=$(mktemp "$tool_dir/archive.XXXXXX")
trap 'rm -f "$archive"' EXIT
curl --fail --silent --show-error --location --retry 3 "$url" --output "$archive"
printf '%s  %s\n' "$checksum" "$archive" | sha256sum --check >&2
tar -xzf "$archive" -C "$tool_dir" "$1"
printf '%s/%s\n' "$tool_dir" "$1"
