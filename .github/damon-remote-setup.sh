#!/usr/bin/env bash
# [STACK: 2 — Next.js/React/MERN] DAMON — Remote setup script
# Run this ONCE after: gh auth login
# Requires: gh CLI authenticated, git configured

set -euo pipefail

REPO_NAME="esg-reporter"
OWNER="$(gh api user --jq '.login')"

echo "=== Creating GitHub repo: ${OWNER}/${REPO_NAME} ==="
gh repo create "${REPO_NAME}" \
  --private \
  --description "ESG carbon reporting SaaS — Stack 2 (Next.js/React/MERN)" \
  --source . \
  --remote origin \
  --push

echo "=== Pushing develop branch ==="
git push origin develop

echo "=== Branch protection: main ==="
gh api \
  --method PUT \
  "/repos/${OWNER}/${REPO_NAME}/branches/main/protection" \
  --field required_status_checks='{"strict":true,"contexts":["lint","typecheck","test-api","test-web","test-engine"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null

echo "=== Branch protection: develop ==="
gh api \
  --method PUT \
  "/repos/${OWNER}/${REPO_NAME}/branches/develop/protection" \
  --field required_status_checks='{"strict":true,"contexts":["lint","typecheck","test-api","test-web","test-engine"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":false}' \
  --field restrictions=null

echo "=== Adding CLERK_SECRET_KEY repository secret ==="
echo "  → Run: gh secret set CLERK_SECRET_KEY --repo ${OWNER}/${REPO_NAME}"

echo ""
echo "✓ Remote setup complete."
echo "  Repo: https://github.com/${OWNER}/${REPO_NAME}"
echo "  Protected branches: main, develop"
echo "  CI: .github/workflows/ci.yml (lint + typecheck + test matrix)"
