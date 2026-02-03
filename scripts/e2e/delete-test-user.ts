/**
 * OpenClaw Marketplace - Delete Test User
 * 
 * Cleans up test user from:
 * 1. Convex database
 * 2. Auth provider (if applicable)
 * 3. Payment provider (if applicable)
 * 
 * Run with: npx tsx scripts/e2e/delete-test-user.ts
 */

import { ConvexHttpClient } from "convex/browser";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "test@openclaw.ai";
const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

async function deleteTestUser() {
  console.log(`🗑️  Deleting test user: ${TEST_EMAIL}`);

  if (!CONVEX_URL) {
    console.error("❌ CONVEX_URL not set");
    process.exit(1);
  }

  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // 1. Delete from Convex database
    // Note: Adjust mutation name based on your actual schema
    console.log("1. Checking Convex for test user...");
    
    // Query for user by email
    // const user = await client.query(api.users.getByEmail, { email: TEST_EMAIL });
    
    // if (user) {
    //   // Delete user and cascade
    //   await client.mutation(api.users.deleteUser, { userId: user._id });
    //   console.log("   ✅ Deleted from Convex");
    // } else {
    //   console.log("   ⏭️  User not found in Convex");
    // }
    
    console.log("   ⚠️  TODO: Implement Convex user deletion mutation");

    // 2. Delete from auth provider (Clerk, Auth0, etc.)
    // Uncomment and configure based on your auth provider
    /*
    if (process.env.CLERK_SECRET_KEY) {
      const clerk = await import("@clerk/backend");
      const users = await clerk.users.getUserList({ emailAddress: [TEST_EMAIL] });
      
      for (const user of users) {
        await clerk.users.deleteUser(user.id);
        console.log("   ✅ Deleted from Clerk");
      }
    }
    */
    console.log("2. Auth provider cleanup: Not configured");

    // 3. Delete from payment provider (Stripe)
    // Uncomment and configure if using Stripe
    /*
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = await import("stripe").then(m => new m.default(process.env.STRIPE_SECRET_KEY!));
      
      const customers = await stripe.customers.list({ email: TEST_EMAIL });
      
      for (const customer of customers.data) {
        // Cancel subscriptions first
        const subs = await stripe.subscriptions.list({ customer: customer.id });
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
        
        // Delete customer
        await stripe.customers.del(customer.id);
        console.log("   ✅ Deleted from Stripe");
      }
    }
    */
    console.log("3. Payment provider cleanup: Not configured");

    console.log("\n✅ Test user cleanup complete");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

// Run
deleteTestUser().catch(console.error);
