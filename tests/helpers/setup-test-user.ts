import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const testEmail = process.env.E2E_USERNAME!;
const testPassword = process.env.E2E_PASSWORD!;
const testUserId = process.env.E2E_USERNAME_ID!;

/**
 * Setup script for E2E tests
 * Creates test user if it doesn't exist
 */
async function setupTestUser() {
  console.log("Setting up test user...");
  console.log("Supabase URL:", supabaseUrl);
  console.log("Test Email:", testEmail);

  // Create admin client to manage users
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Try to sign in first to check if user exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInData?.user) {
      console.log("✓ Test user already exists and can login");
      console.log("  User ID:", signInData.user.id);
      console.log("  Email:", signInData.user.email);

      // Sign out after check
      await supabase.auth.signOut();
      return;
    }

    // If login failed, check if it's due to wrong password or missing user
    if (signInError) {
      console.log("Login attempt failed:", signInError.message);

      // Try to create the user
      console.log("Attempting to create test user...");

      // Note: User creation via client API requires admin privileges
      // For Supabase, you may need to use the service role key or admin API
      console.log("\n⚠ WARNING: Cannot create user via standard API");
      console.log("Please create the test user manually in Supabase dashboard:");
      console.log(`  Email: ${testEmail}`);
      console.log(`  Password: ${testPassword}`);
      console.log(`  User ID (optional): ${testUserId}`);

      process.exit(1);
    }
  } catch (error) {
    console.error("Error setting up test user:", error);
    process.exit(1);
  }
}

// Run setup
setupTestUser();
