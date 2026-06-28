# Post-cleanup API smoke test for NzolaNet
$base = "http://localhost:5000/api"
$passed = 0
$failed = 0

function Test-Step {
  param(
    [string]$Name,
    [scriptblock]$Action
  )
  try {
    & $Action
    Write-Host "[PASS] $Name" -ForegroundColor Green
    $script:passed++
  } catch {
    Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
    $script:failed++
  }
}

Test-Step "GET publications (empty after cleanup)" {
  $r = Invoke-RestMethod -Uri "$base/publications" -Method GET
  if ($r.Count -ne 0) { throw "Expected 0 publications, got $($r.Count)" }
}

Test-Step "Admin login" {
  $body = @{ email = "admin@nzolanet.app"; password = "NzolaAdmin@2026" } | ConvertTo-Json
  $script:login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $body -ContentType "application/json"
  if (-not $script:login.token) { throw "No token returned" }
  $script:headers = @{ Authorization = "Bearer $($script:login.token)" }
}

Test-Step "GET auth/me" {
  $me = Invoke-RestMethod -Uri "$base/auth/me" -Method GET -Headers $script:headers
  if ($me.username -ne "nzolaadmin") { throw "Wrong user: $($me.username)" }
}

Test-Step "Register temp user" {
  $email = "smoke$(Get-Random)@test.local"
  $body = @{
    email = $email
    password = "Test@123456"
    username = "smokeuser$(Get-Random)"
    displayName = "Smoke Test User"
  } | ConvertTo-Json
  $script:reg = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -Body $body -ContentType "application/json"
  if (-not $script:reg.token) { throw "Registration failed" }
  $script:user2Headers = @{ Authorization = "Bearer $($script:reg.token)" }
  $script:user2Email = $email
}

Test-Step "Create publication (text only)" {
  $boundary = [System.Guid]::NewGuid().ToString()
  $LF = "`r`n"
  $bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"Text`"",
    "",
    "Smoke test publication",
    "--$boundary--",
    ""
  ) -join $LF
  $script:pub = Invoke-RestMethod -Uri "$base/publications" -Method POST -Headers $script:headers -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines
  if (-not $script:pub.id) { throw "No publication id" }
}

Test-Step "GET publications (1 item)" {
  $r = Invoke-RestMethod -Uri "$base/publications" -Method GET
  if ($r.Count -lt 1) { throw "Expected at least 1 publication" }
}

Test-Step "Update publication" {
  $body = @{ text = "Updated smoke test" } | ConvertTo-Json
  $updated = Invoke-RestMethod -Uri "$base/publications/$($script:pub.id)" -Method PUT -Headers $script:headers -Body $body -ContentType "application/json"
  if ($updated.text -ne "Updated smoke test") { throw "Text not updated" }
}

Test-Step "Like publication" {
  Invoke-RestMethod -Uri "$base/publications/$($script:pub.id)/like" -Method POST -Headers $script:user2Headers | Out-Null
}

Test-Step "Unlike publication" {
  Invoke-RestMethod -Uri "$base/publications/$($script:pub.id)/like" -Method DELETE -Headers $script:user2Headers | Out-Null
}

Test-Step "Create comment" {
  $body = @{ text = "Smoke comment" } | ConvertTo-Json
  $script:comment = Invoke-RestMethod -Uri "$base/publications/$($script:pub.id)/comments" -Method POST -Headers $script:user2Headers -Body $body -ContentType "application/json"
  if (-not $script:comment.id) { throw "No comment id" }
}

Test-Step "Update comment" {
  $body = @{ text = "Updated comment" } | ConvertTo-Json
  $updated = Invoke-RestMethod -Uri "$base/comments/$($script:comment.id)" -Method PUT -Headers $script:user2Headers -Body $body -ContentType "application/json"
  if ($updated.text -ne "Updated comment") { throw "Comment not updated" }
}

Test-Step "Delete comment" {
  Invoke-RestMethod -Uri "$base/comments/$($script:comment.id)" -Method DELETE -Headers $script:user2Headers | Out-Null
}

Test-Step "Follow user (user2 follows admin)" {
  $adminId = $script:login.user.id
  Invoke-RestMethod -Uri "$base/users/$adminId/follow" -Method POST -Headers $script:user2Headers | Out-Null
}

Test-Step "Unfollow user" {
  $adminId = $script:login.user.id
  Invoke-RestMethod -Uri "$base/users/$adminId/follow" -Method DELETE -Headers $script:user2Headers | Out-Null
}

Test-Step "User search" {
  $r = Invoke-RestMethod -Uri "$base/users/search?q=admin" -Method GET -Headers $script:headers
  if ($r.Count -lt 1) { throw "No search results" }
}

Test-Step "Forgot password" {
  $body = @{ email = $script:user2Email } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/auth/forgot-password" -Method POST -Body $body -ContentType "application/json" | Out-Null
}

Test-Step "Delete publication" {
  Invoke-RestMethod -Uri "$base/publications/$($script:pub.id)" -Method DELETE -Headers $script:headers | Out-Null
}

Write-Host ""
Write-Host "=== Results: $passed passed, $failed failed ===" -ForegroundColor Cyan
if ($failed -gt 0) { exit 1 }
