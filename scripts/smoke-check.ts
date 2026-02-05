/**
 * FlowState Smoke Check
 * Verifies critical system assumptions.
 */

async function runSmokeCheck() {
  console.log("🚀 Starting FlowState Smoke Check...");

  // Check 1: API Key presence
  if (!process.env.API_KEY) {
    console.error("❌ FAILED: API_KEY is missing from environment.");
  } else {
    console.log("✅ PASSED: API_KEY detected.");
  }

  // Check 2: Storage Availability
  try {
    const testKey = '__smoke_test__';
    localStorage.setItem(testKey, 'val');
    localStorage.removeItem(testKey);
    console.log("✅ PASSED: LocalStorage is functional.");
  } catch (e) {
    console.error("❌ FAILED: LocalStorage is inaccessible.");
  }

  // Check 3: PWA Manifest
  try {
    const response = await fetch('/manifest.json');
    if (response.ok) {
      console.log("✅ PASSED: manifest.json is reachable.");
    } else {
      throw new Error();
    }
  } catch (e) {
    console.warn("⚠️ WARNING: manifest.json check failed. PWA may not install.");
  }

  console.log("\n🏁 Smoke Check complete.");
}

// In a real browser env, this would be triggered via a hidden debug menu.
// For CI/CD, this would run via Playwright.
runSmokeCheck();