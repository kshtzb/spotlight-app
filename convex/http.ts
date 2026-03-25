// Import Convex HTTP router to create API endpoints
import { httpRouter } from "convex/server";

// Allows us to create HTTP actions that can access the Convex database
import { httpAction } from "./_generated/server";

// Svix is the service Clerk uses to securely send webhook events
import { Webhook } from "svix";

// Import generated Convex API so we can call mutations like createUser
import { api } from "./_generated/api";
import { convexToJson } from "convex/values";

// Create a new HTTP router
// This lets Convex expose REST-style endpoints
const http = httpRouter();

// -------------------------------------------------------------
// WEBHOOK FLOW OVERVIEW
// -------------------------------------------------------------
// 1️⃣ Clerk sends a webhook event when something happens
//    Example: user signs up → "user.created"
//
// 2️⃣ Convex receives the webhook at this endpoint
//
// 3️⃣ We verify the webhook to make sure it really came from Clerk
//
// 4️⃣ If valid, we process the event
//
// 5️⃣ For "user.created" we save the user in our Convex database
// -------------------------------------------------------------

// Create a route for the webhook endpoint
http.route({
  path: "/clerk-webhook", // URL endpoint: /clerk-webhook
  method: "POST", // Clerk sends webhooks using POST requests

  handler: httpAction(async (ctx, request) => {
    console.log("🔥 Clerk webhook hit");
    // -------------------------------------------------------------
    // STEP 1: GET WEBHOOK SECRET
    // -------------------------------------------------------------
    // This secret is provided by Clerk in the webhook dashboard
    // It is used to verify that the webhook request is legitimate

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    // -------------------------------------------------------------
    // STEP 2: READ SVIX HEADERS
    // -------------------------------------------------------------
    // Clerk uses Svix to sign webhook requests
    // These headers are required to verify the request authenticity
    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    // If any required header is missing, reject the request
    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("Error occurred -- no svix headers", {
        status: 400,
      });
    }

    // -------------------------------------------------------------
    // STEP 3: READ THE WEBHOOK PAYLOAD
    // -------------------------------------------------------------
    // Clerk sends event data in the request body

    const payload = await request.json();

    // Convert payload to string (required by Svix verification)
    const body = JSON.stringify(payload);

    // -------------------------------------------------------------
    // STEP 4: VERIFY THE WEBHOOK
    // -------------------------------------------------------------
    // This ensures the webhook was actually sent by Clerk
    // and not by a malicious source

    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      // Verify the webhook signature
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as any;
    } catch (err) {
      // If verification fails → reject request
      console.error("Error verifying webhook:", err);

      return new Response("Error occurred", { status: 400 });
    }

    // -------------------------------------------------------------
    // STEP 5: CHECK WHAT EVENT OCCURRED
    // -------------------------------------------------------------
    // Clerk sends many types of events like:
    // - user.created
    // - user.updated
    // - session.created

    const eventType = evt.type;

    console.log("📩 Event type:", eventType);

    // -------------------------------------------------------------
    // STEP 6: HANDLE "USER CREATED" EVENT
    // -------------------------------------------------------------
    // When a new user signs up in Clerk

    if (eventType === "user.created") {
      // Extract useful user data from the webhook payload
      const { id, email_addresses, first_name, last_name, image_url } =
        evt.data;

      // Get primary email address
      const email = email_addresses[0].email_address;

      // Combine first + last name
      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        // -------------------------------------------------------------
        // STEP 7: SAVE USER IN CONVEX DATABASE
        // -------------------------------------------------------------
        // Call the Convex mutation createUser
        await ctx.runMutation(api.users.createUser, {
          email, // user email
          fullname: name, // full name
          image: image_url, // profile image from Clerk
          clerkId: id, // unique Clerk user ID
          username: email.split("@")[0], // generate username from email
        });
      } catch (error) {
        // If database insertion fails
        console.log("Error creating user:", error);

        return new Response("Error creating user", { status: 500 });
      }
    }

    // -------------------------------------------------------------
    // STEP 8: SEND SUCCESS RESPONSE
    // -------------------------------------------------------------
    // Clerk expects a 200 response if webhook processed correctly

    return new Response("Webhook processed successfully", { status: 200 });
  }),
});

// Export the HTTP router so Convex can use it
export default http;

// import { httpRouter } from "convex/server";
// import { httpAction } from "./_generated/server";
// import { Webhook } from "svix";
// import { api } from "./_generated/api";

// const http = httpRouter();

// // 1- we need to make sure that the webhook event is coming from Clerk
// // 2- if so, we will listen for the "user.created" event
// // 3- we will save the user to the database

// http.route({
//   path: "/clerk-webhook",
//   method: "POST",
//   handler: httpAction(async (ctx, request) => {
//     console.log("🔥 Clerk webhook hit");
//     const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
//     if (!webhookSecret) {
//       throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
//     }

//     // check headers
//     const svix_id = request.headers.get("svix-id");
//     const svix_signature = request.headers.get("svix-signature");
//     const svix_timestamp = request.headers.get("svix-timestamp");

//     if (!svix_id || !svix_signature || !svix_timestamp) {
//       return new Response("Error occurred -- no svix headers", {
//         status: 400,
//       });
//     }

//     const payload = await request.json();
//     const body = JSON.stringify(payload);

//     const wh = new Webhook(webhookSecret);
//     let evt: any;

//     // verify webhook
//     try {
//       evt = wh.verify(body, {
//         "svix-id": svix_id,
//         "svix-timestamp": svix_timestamp,
//         "svix-signature": svix_signature,
//       }) as any;
//     } catch (err) {
//       console.error("Error verifying webhook:", err);
//       return new Response("Error occurred", { status: 400 });
//     }

//     const eventType = evt.type;
//     console.log("📩 Event type:", eventType);
//     if (eventType === "user.created") {
//       const { id, email_addresses, first_name, last_name, image_url } =
//         evt.data;

//       const email = email_addresses[0].email_address;
//       const name = `${first_name || ""} ${last_name || ""}`.trim();

//       try {
//         await ctx.runMutation(api.users.createUser, {
//           email,
//           fullname: name,
//           image: image_url,
//           clerkId: id,
//           username: email.split("@")[0],
//         });
//       } catch (error) {
//         console.log("Error creating user:", error);
//         return new Response("Error creating user", { status: 500 });
//       }
//     }

//     return new Response("Webhook processed successfully", { status: 200 });
//   }),
// });

// export default http;
