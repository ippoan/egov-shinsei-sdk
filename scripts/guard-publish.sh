#!/bin/bash
# Guard against direct npm publish.
# Allow only in CI (GitHub Actions sets CI=true).

if [ "$CI" != "true" ]; then
  echo ""
  echo "ERROR: Direct npm publish is not allowed."
  echo ""
  echo "  Use git tag to trigger CI publish:"
  echo "    git tag v0.1.0"
  echo "    git push origin v0.1.0"
  echo ""
  echo "  Or use the /tag-release skill."
  echo ""
  exit 1
fi

npm run build
