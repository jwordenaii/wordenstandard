$ErrorActionPreference = 'Stop'

Write-Output '=== Repo Preflight ==='

$root = git rev-parse --show-toplevel
$remote = git remote get-url origin
$branch = git branch --show-current
$localHead = git rev-parse HEAD
$originHead = git rev-parse origin/main
$status = git status --short

Write-Output "Root: $root"
Write-Output "Remote: $remote"
Write-Output "Branch: $branch"
Write-Output "Local HEAD: $localHead"
Write-Output "Origin/main HEAD: $originHead"

if ([string]::IsNullOrWhiteSpace($status)) {
  Write-Output 'Working tree: clean'
} else {
  Write-Output 'Working tree: dirty'
  Write-Output $status
}

$ok = $true
if ($remote -ne 'https://github.com/jwordenaii/codexbuildfreeofbase44.git') {
  Write-Output 'FAIL: Unexpected origin remote.'
  $ok = $false
}
if ($branch -ne 'main') {
  Write-Output 'FAIL: You are not on main.'
  $ok = $false
}
if ($localHead -ne $originHead) {
  Write-Output 'WARN: Local HEAD does not match origin/main.'
}

if ($ok) {
  Write-Output 'PASS: Repo identity is correct for this project.'
} else {
  Write-Output 'FAIL: Fix repo/branch before making edits or deploy changes.'
  exit 2
}
