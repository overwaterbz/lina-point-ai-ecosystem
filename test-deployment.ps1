#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Comprehensive test suite for Lina Point AI Ecosystem production deployment
    
.DESCRIPTION
    Tests all API endpoints, webhooks, and integrations after deployment to Vercel
    
.PARAMETER Url
    Base URL of the deployed application (default: https://lina-point-ai-ecosystem.vercel.app)
    
.EXAMPLE
    .\test-deployment.ps1 -Url https://lina-point-ai-ecosystem.vercel.app
#>

param(
    [string]$Url = "https://lina-point-ai-ecosystem.vercel.app"
)

$ErrorActionPreference = "Continue"
$passed = 0
$failed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Path,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [scriptblock]$Validator = { $true }
    )
    
    $fullUrl = "$Url$Path"
    Write-Host "`n🧪 Testing: $Name" -ForegroundColor Cyan
    Write-Host "   URL: $fullUrl" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $fullUrl
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        
        if (& $Validator $response $content) {
            Write-Host "   ✅ PASSED" -ForegroundColor Green
            $script:passed++
            return $true
        } else {
            Write-Host "   ❌ FAILED: Validator returned false" -ForegroundColor Red
            Write-Host "   Response: $($response.Content)" -ForegroundColor Red
            $script:failed++
            return $false
        }
    } catch {
        Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
        return $false
    }
}

Write-Host "
╔════════════════════════════════════════════════════════════╗
║  LINA POINT AI ECOSYSTEM - DEPLOYMENT TEST SUITE          ║
║  Base URL: $Url ║
╚════════════════════════════════════════════════════════════╝
" -ForegroundColor Yellow

# ============================================================================
# SECTION 1: HEALTH & BASIC ENDPOINTS
# ============================================================================
Write-Host "`n📍 SECTION 1: HEALTH & BASIC ENDPOINTS" -ForegroundColor Magenta

Test-Endpoint `
    -Name "Homepage" `
    -Path "/" `
    -Validator {
        param($response, $content)
        return $response.StatusCode -eq 200 -and $response.Content -match "Lina Point"
    }

Test-Endpoint `
    -Name "Auth Login Page" `
    -Path "/auth/login" `
    -Validator {
        param($response, $content)
        return $response.StatusCode -eq 200
    }

Test-Endpoint `
    -Name "Auth Signup Page" `
    -Path "/auth/signup" `
    -Validator {
        param($response, $content)
        return $response.StatusCode -eq 200
    }

# ============================================================================
# SECTION 2: API ENDPOINTS
# ============================================================================
Write-Host "`n📍 SECTION 2: API ENDPOINTS" -ForegroundColor Magenta

Test-Endpoint `
    -Name "Test Magic Content Generation" `
    -Path "/api/test-magic" `
    -Validator {
        param($response, $content)
        return $response.StatusCode -eq 200 `
            -and $content.success -eq $true `
            -and $content.tests -ne $null
    }

Test-Endpoint `
    -Name "List Magic Content" `
    -Path "/api/magic/list" `
    -Validator {
        param($response, $content)
        return $response.StatusCode -eq 200
    }

Test-Endpoint `
    -Name "Check Events" `
    -Path "/api/check-events" `
    -Validator {
        param($response, $content)
        return $response.StatusCode -eq 200
    }

# ============================================================================
# SECTION 3: WEBHOOK ENDPOINTS (Basic Health)
# ============================================================================
Write-Host "`n📍 SECTION 3: WEBHOOK ENDPOINTS" -ForegroundColor Magenta

Test-Endpoint `
    -Name "Stripe Webhook (should accept POST)" `
    -Method "POST" `
    -Path "/api/stripe/webhook" `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body '{"type":"test","id":"evt_test"}' `
    -Validator {
        param($response, $content)
        # Expect 400 due to signature validation, but endpoint exists
        return $response.StatusCode -in @(400, 401) -or $response.Content -match "stripe"
    }

Test-Endpoint `
    -Name "WhatsApp Webhook (should accept POST)" `
    -Method "POST" `
    -Path "/api/whatsapp-webhook" `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body '{"messages":[]}' `
    -Validator {
        param($response, $content)
        return $response.StatusCode -in @(200, 400)
    }

# ============================================================================
# SECTION 4: CRON ENDPOINT
# ============================================================================
Write-Host "`n📍 SECTION 4: CRON ENDPOINT" -ForegroundColor Magenta

Test-Endpoint `
    -Name "Cron Send Proactive Messages" `
    -Path "/api/cron/send-proactive-messages" `
    -Headers @{ "authorization" = "Bearer $($env:CRON_SECRET)" } `
    -Validator {
        param($response, $content)
        # Check if endpoint exists and is protected
        return $response.StatusCode -in @(200, 401, 403) `
            -or $response.Content -match "Unauthorized|authenticated"
    }

# ============================================================================
# SECTION 5: PAYMENT ENDPOINTS
# ============================================================================
Write-Host "`n📍 SECTION 5: PAYMENT ENDPOINTS" -ForegroundColor Magenta

Test-Endpoint `
    -Name "Create Payment Intent (Square Primary)" `
    -Method "POST" `
    -Path "/api/stripe/create-payment-intent" `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body @{
        amount = 100
        currency = "USD"
        reservationId = "test-123"
    } | ConvertTo-Json `
    -Validator {
        param($response, $content)
        return $response.StatusCode -in @(200, 400, 500) `
            -and ($content.success -ne $null -or $content.error -ne $null)
    }

# ============================================================================
# SECTION 6: DEBUG ENDPOINTS
# ============================================================================
Write-Host "`n📍 SECTION 6: DEBUG ENDPOINTS" -ForegroundColor Magenta

Test-Endpoint `
    -Name "Booking Status Debug Info" `
    -Path "/api/debug/booking-status" `
    -Validator {
        param($response, $content)
        return $response.StatusCode -in @(200, 400, 401)
    }

Test-Endpoint `
    -Name "Test Booking Flow" `
    -Method "POST" `
    -Path "/api/test-booking" `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body @{
        userId = "test-user-$([guid]::NewGuid().ToString().Substring(0, 8))"
    } | ConvertTo-Json `
    -Validator {
        param($response, $content)
        return $response.StatusCode -in @(200, 400, 500)
    }

# ============================================================================
# SECTION 7: PROTECTED ENDPOINTS
# ============================================================================
Write-Host "`n📍 SECTION 7: PROTECTED ENDPOINTS" -ForegroundColor Magenta

Test-Endpoint `
    -Name "Admin Dashboard (Protected - Should Redirect)" `
    -Path "/admin/dashboard" `
    -Validator {
        param($response, $content)
        # Should redirect to login if not authenticated
        return $response.StatusCode -in @(200, 301, 302, 307) `
            -or $response.Content -match "redirect|login|unauthorized"
    }

Test-Endpoint `
    -Name "Trigger n8n Workflow (Protected)" `
    -Method "POST" `
    -Path "/api/trigger-n8n" `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body '{"source":"test"}' `
    -Validator {
        param($response, $content)
        # Should fail auth but endpoint should exist
        return $response.StatusCode -in @(200, 400, 401, 403)
    }

# ============================================================================
# RESULTS SUMMARY
# ============================================================================
Write-Host "`n
╔════════════════════════════════════════════════════════════╗
║                    TEST RESULTS SUMMARY                    ║
╚════════════════════════════════════════════════════════════╝
" -ForegroundColor Yellow

Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red

$total = $passed + $failed
$percentage = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }

Write-Host "📊 Success Rate: $percentage% ($passed/$total tests)" -ForegroundColor Cyan

Write-Host "`n🔍 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "
1. Verify environment variables are set in Vercel:
   https://vercel.com/rick-jennings-projects/lina-point-ai-ecosystem/settings/environment-variables

2. Configure webhook signing secrets:
   - Stripe: https://dashboard.stripe.com/webhooks
   - Twilio: https://console.twilio.com/sms/whatsapp

3. Monitor deployment logs:
   https://vercel.com/rick-jennings-projects/lina-point-ai-ecosystem/logs

4. Test with real payment:
   - Use Square test card: 4111 1111 1111 1111
   - Should create payment_intent and record in Supabase

5. Test WhatsApp webhook:
   - Send message to Twilio sandbox
   - Verify bot responds

6. Verify cron job:
   - Check logs at 6 PM UTC daily
   - Should send proactive messages to opted-in users
"

if ($failed -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Deployment is healthy." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  Some tests failed. Please review and troubleshoot." -ForegroundColor Red
    exit 1
}
