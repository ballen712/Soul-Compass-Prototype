#!/bin/bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
CI=1 pnpm install --frozen-lockfile

# Schema changes require separate, explicit approval. Never migrate or push a
# database as a side effect of merging application code.
