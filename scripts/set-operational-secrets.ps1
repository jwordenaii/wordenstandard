param(
  [ValidateSet('core', 'ai', 'media', 'observability', 'all')]
  [string]$Target = 'all',

  [ValidateSet('railway', 'netlify', 'local', 'all')]
  [string]$Provider = 'all',

  [string]$RailwayService = 'codexbuildfreeofbase44',
  [string]$RailwayEnvironment = 'production',
  [string]$NetlifySiteId = 'da1c274c-cd8c-4080-bbbb-5ad79f448f18',
  [ValidateSet('Process', 'User')]
  [string]$LocalScope = 'User',
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "[ops-secrets] $Message"
}

function Should-IncludeGroup {
  param([string]$Group)
  return $Target -eq 'all' -or $Target -eq $Group
}

function Should-SetProvider {
  param([string]$Name)
  return $Provider -eq 'all' -or $Provider -eq $Name
}

function ConvertTo-PlainText {
  param([securestring]$SecureValue)
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  }
  finally {
    if ($ptr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
  }
}

function Read-SecretValue {
  param(
    [string]$Name,
    [string]$Description
  )

  Write-Host ""
  Write-Host "$Name - $Description"
  $secure = Read-Host "Enter value, or leave blank to skip" -AsSecureString
  if ($secure.Length -eq 0) {
    return $null
  }
  return ConvertTo-PlainText $secure
}

function Read-PlainValue {
  param(
    [string]$Name,
    [string]$Description,
    [string]$DefaultValue = ''
  )

  Write-Host ""
  Write-Host "$Name - $Description"
  if ($DefaultValue) {
    $value = Read-Host "Enter value, leave blank for '$DefaultValue', or type SKIP"
    if ($value -eq 'SKIP') { return $null }
    if ([string]::IsNullOrWhiteSpace($value)) { return $DefaultValue }
    return $value.Trim()
  }

  $value = Read-Host "Enter value, or leave blank to skip"
  if ([string]::IsNullOrWhiteSpace($value)) { return $null }
  return $value.Trim()
}

function Invoke-RailwaySet {
  param(
    [string]$Name,
    [string]$Value
  )

  if ($DryRun) {
    Write-Step "Would set Railway $Name for service '$RailwayService' in '$RailwayEnvironment'."
    return
  }

  $Value | & npx -y @railway/cli variable set $Name --stdin --service $RailwayService --environment $RailwayEnvironment | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Railway variable set failed for $Name."
  }
}

function Invoke-NetlifySet {
  param(
    [string]$Name,
    [string]$Value
  )

  if ($DryRun) {
    Write-Step "Would set Netlify $Name for site '$NetlifySiteId'."
    return
  }

  & npx -y netlify env:set $Name $Value --context production --site $NetlifySiteId --secret --force | Out-Host
  if ($LASTEXITCODE -ne 0) {
    throw "Netlify variable set failed for $Name."
  }
}

function Set-LocalEnv {
  param(
    [string]$Name,
    [string]$Value
  )

  if ($DryRun) {
    Write-Step "Would set local $LocalScope env $Name."
    return
  }

  [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
  if ($LocalScope -eq 'User') {
    [Environment]::SetEnvironmentVariable($Name, $Value, 'User')
  }
  Write-Step "Set local $LocalScope env $Name. Open a new terminal for User-scope values to appear automatically."
}

function Add-SecretEntry {
  param(
    [string]$Group,
    [string]$Name,
    [string]$Description,
    [string[]]$Destinations
  )

  if (-not (Should-IncludeGroup $Group)) { return }
  $value = Read-SecretValue -Name $Name -Description $Description
  if ($null -eq $value) {
    Write-Step "Skipped $Name."
    return
  }
  Set-EntryValue -Name $Name -Value $value -Destinations $Destinations
}

function Add-PlainEntry {
  param(
    [string]$Group,
    [string]$Name,
    [string]$Description,
    [string[]]$Destinations,
    [string]$DefaultValue = ''
  )

  if (-not (Should-IncludeGroup $Group)) { return }
  $value = Read-PlainValue -Name $Name -Description $Description -DefaultValue $DefaultValue
  if ($null -eq $value) {
    Write-Step "Skipped $Name."
    return
  }
  Set-EntryValue -Name $Name -Value $value -Destinations $Destinations
}

function Set-EntryValue {
  param(
    [string]$Name,
    [string]$Value,
    [string[]]$Destinations
  )

  foreach ($destination in $Destinations) {
    switch ($destination) {
      'railway' { if (Should-SetProvider 'railway') { Invoke-RailwaySet -Name $Name -Value $Value } }
      'netlify' { if (Should-SetProvider 'netlify') { Invoke-NetlifySet -Name $Name -Value $Value } }
      'local' { if (Should-SetProvider 'local') { Set-LocalEnv -Name $Name -Value $Value } }
      default { throw "Unknown destination '$destination' for $Name." }
    }
  }
}

Write-Step "Target=$Target Provider=$Provider DryRun=$DryRun"
Write-Step "Blank secret prompts are skipped. Nothing is written to .env or git."

Add-PlainEntry -Group 'core' -Name 'AUTO_CREATE_TABLES' -Description 'Production should use Alembic migrations instead of startup table creation.' -Destinations @('railway') -DefaultValue 'false'
Add-PlainEntry -Group 'core' -Name 'LOG_FORMAT' -Description 'Use JSON logs in production.' -Destinations @('railway') -DefaultValue 'json'
Add-PlainEntry -Group 'core' -Name 'LOG_LEVEL' -Description 'Minimum backend log level.' -Destinations @('railway') -DefaultValue 'INFO'
Add-PlainEntry -Group 'core' -Name 'EXTRA_CORS_ORIGINS' -Description 'Comma-separated allowed browser origins.' -Destinations @('railway') -DefaultValue 'https://www.jwordenasphaltpaving.com,https://jwordenasphaltpaving.com'
Add-PlainEntry -Group 'core' -Name 'VITE_API_BASE_URL' -Description 'Frontend API base URL.' -Destinations @('netlify') -DefaultValue 'https://codexbuildfreeofbase44-production.up.railway.app'
Add-PlainEntry -Group 'core' -Name 'USE_BACKEND_TOKEN_ENDPOINT' -Description 'Netlify function should exchange master key via backend token endpoint.' -Destinations @('netlify') -DefaultValue 'true'
Add-SecretEntry -Group 'core' -Name 'JWORDEN_MASTER_KEY' -Description 'Backend master API key. Set the same value in Railway and Netlify.' -Destinations @('railway', 'netlify')
Add-SecretEntry -Group 'core' -Name 'JWT_SECRET_KEY' -Description 'JWT signing secret. Set in Railway; Netlify only needs it if USE_BACKEND_TOKEN_ENDPOINT=false.' -Destinations @('railway')
Add-PlainEntry -Group 'core' -Name 'ADMIN_USERNAME' -Description 'Admin dashboard username.' -Destinations @('railway') -DefaultValue 'admin'
Add-SecretEntry -Group 'core' -Name 'ADMIN_PASSWORD' -Description 'Admin dashboard password.' -Destinations @('railway')
Add-SecretEntry -Group 'ai' -Name 'OPENAI_API_KEY' -Description 'OpenAI key for chat, photo inspection, document intelligence, blog drafts, and analytics AI.' -Destinations @('railway')
Add-SecretEntry -Group 'ai' -Name 'GEMINI_API_KEY' -Description 'Optional Gemini provider key for planned multi-provider AI routing.' -Destinations @('railway')
Add-SecretEntry -Group 'ai' -Name 'ANTHROPIC_API_KEY' -Description 'Optional Anthropic provider key for planned multi-provider AI routing.' -Destinations @('railway')
Add-SecretEntry -Group 'ai' -Name 'PERPLEXITY_API_KEY' -Description 'Optional Perplexity provider key for web-grounded research.' -Destinations @('railway')
Add-SecretEntry -Group 'ai' -Name 'GOOGLE_API_KEY' -Description 'Google Maps/Places/geocoding key. Restrict browser variants by domain in Google Cloud.' -Destinations @('railway')
Add-SecretEntry -Group 'ai' -Name 'VITE_GOOGLE_MAPS_API_KEY' -Description 'Browser-safe Google Maps key for frontend maps. Must be domain-restricted.' -Destinations @('netlify')
Add-SecretEntry -Group 'observability' -Name 'SENTRY_DSN' -Description 'Backend Sentry DSN.' -Destinations @('railway')
Add-SecretEntry -Group 'observability' -Name 'VITE_SENTRY_DSN' -Description 'Frontend Sentry DSN.' -Destinations @('netlify')
Add-SecretEntry -Group 'observability' -Name 'DATADOG_API_KEY' -Description 'Datadog metrics API key.' -Destinations @('railway')
Add-SecretEntry -Group 'observability' -Name 'SLACK_WEBHOOK_URL' -Description 'Slack incoming webhook for operational alerts.' -Destinations @('railway')
Add-PlainEntry -Group 'observability' -Name 'DD_ENV' -Description 'Datadog environment tag.' -Destinations @('railway') -DefaultValue 'production'
Add-PlainEntry -Group 'observability' -Name 'DD_SERVICE' -Description 'Datadog service tag.' -Destinations @('railway') -DefaultValue 'jworden-api'
Add-SecretEntry -Group 'media' -Name 'DROPBOX_ACCESS_TOKEN' -Description 'Local Dropbox import token. Stored only in this process by default.' -Destinations @('local')
Add-PlainEntry -Group 'media' -Name 'DROPBOX_PATH' -Description 'Optional Dropbox folder path to import from.' -Destinations @('local') -DefaultValue '/Work Photos'
Add-SecretEntry -Group 'media' -Name 'GOOGLE_PHOTOS_ACCESS_TOKEN' -Description 'Local Google Photos OAuth token.' -Destinations @('local')
Add-PlainEntry -Group 'media' -Name 'GOOGLE_PHOTOS_ALBUM_ID' -Description 'Optional Google Photos album ID to limit imports.' -Destinations @('local')
Add-SecretEntry -Group 'media' -Name 'GOOGLE_DRIVE_ACCESS_TOKEN' -Description 'Local Google Drive OAuth token.' -Destinations @('local')
Add-PlainEntry -Group 'media' -Name 'GOOGLE_DRIVE_FOLDER_ID' -Description 'Optional Drive folder ID to limit imports.' -Destinations @('local')

Write-Step "Done. Railway and Netlify may redeploy after variable changes."