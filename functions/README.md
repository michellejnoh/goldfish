# Notifications (gifts and duels)

The game itself saves each phone's push address when notifications are turned on
(keeper name > notifications > turn on, in the home-screen app). This folder is the small
server function that actually sends a notification whenever a gift or a duel result lands
in someone's gift box. It runs on Firebase Cloud Functions.

One-time setup (on a computer with Node 20):

1. Firebase console > goldfish-tank-f99a7 > upgrade to the Blaze plan (Cloud Functions needs it;
   this function's use stays inside the free allowance).
2. Firebase console > Firestore > note the database location at the top. If it is not
   nam5 / us-central1, change `REGION` in `functions/index.js` to that location (for example `asia-northeast3`).
3. In a terminal:
   ```
   npm install -g firebase-tools
   firebase login
   git clone https://github.com/michellejnoh/goldfish && cd goldfish
   firebase functions:secrets:set VAPID_PRIVATE      # paste the private key when asked
   firebase deploy --only firestore:rules,functions
   ```

The private key pairs with `VAPID_PUB` in index.html and `VAPID_PUBLIC` in functions/index.js.
Keep it out of the repo. If it is ever lost, make a new pair (`npx web-push generate-vapid-keys`)
and update both public keys and the secret.
