import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const testEmail = process.env.E2E_USERNAME;
const testPassword = process.env.E2E_PASSWORD;
const testUserId = process.env.E2E_USERNAME_ID;

if (!supabaseUrl || !supabaseKey || !testEmail || !testPassword || !testUserId) {
  throw new Error("Missing required environment variables");
}

/**
 * Setup script for E2E tests
 * Creates test user if it doesn't exist
 */
async function setupTestUser() {
  // eslint-disable-next-line no-console
  console.log("Setting up test user...");
  // eslint-disable-next-line no-console
  console.log("Supabase URL:", supabaseUrl);
  // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.log("✓ Test user already exists and can login");
      // eslint-disable-next-line no-console
      console.log("  User ID:", signInData.user.id);
      // eslint-disable-next-line no-console
      console.log("  Email:", signInData.user.email);

      // Sign out after check
      await supabase.auth.signOut();
      return;
    }

    // If login failed, check if it's due to wrong password or missing user
    if (signInError) {
      // eslint-disable-next-line no-console
      console.log("Login attempt failed:", signInError.message);

      // Try to create the user
      // eslint-disable-next-line no-console
      console.log("Attempting to create test user...");

      // Note: User creation via client API requires admin privileges
      // For Supabase, you may need to use the service role key or admin API
      // eslint-disable-next-line no-console
      console.log("\n⚠ WARNING: Cannot create user via standard API");
      // eslint-disable-next-line no-console
      console.log("Please create the test user manually in Supabase dashboard:");
      // eslint-disable-next-line no-console
      console.log(`  Email: ${testEmail}`);
      // eslint-disable-next-line no-console
      console.log(`  Password: ${testPassword}`);
      // eslint-disable-next-line no-console
      console.log(`  User ID (optional): ${testUserId}`);

      process.exit(1);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error setting up test user:", error);
    process.exit(1);
  }
}

// Run setup
setupTestUser();
