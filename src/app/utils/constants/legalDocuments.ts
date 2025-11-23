export const getLegalDocumentContent = (
  type: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES',
  version?: string
): string => {
  const date = new Date().toLocaleDateString();

  switch (type) {
    case 'TERMS_OF_SERVICE':
      return `TERMS OF SERVICE${version ? ` - Version ${version}` : ''}

Last Updated: ${date}

1. ACCEPTANCE OF TERMS
By creating an account or accessing Barhub ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, please do not use the App. These Terms constitute a legally binding agreement between you and Barhub (operated by Adam Kundracik, "we," "us," or "our").

2. ELIGIBILITY & AGE RESTRICTION
- You must be at least 18 years old to use Barhub. By using the App, you represent and warrant that you are 18 or older.
- The App is intended for social discovery of nightlife venues. We do not encourage excessive alcohol consumption or illegal activities.

3. USER ACCOUNTS
- You are responsible for maintaining the confidentiality of your login credentials.
- You agree to provide accurate, current, and complete information during registration.
- You are solely responsible for all activities that occur under your account.
- We reserve the right to disable any account if we suspect a violation of these Terms.

4. APP FUNCTIONALITY & LOCATION SERVICES
- **Location Tracking:** Barhub requires access to your device's location (foreground and/or background) to function. This enables features like the "Radius" feed, "Travel Mode," and location-based notifications.
- **Photo Requests:** Users may request real-time photos from venues. By responding, you agree to share your current location and photo with the community.
- **Leaderboard:** Points earned on the leaderboard have no monetary value and cannot be exchanged for cash or goods. We reserve the right to reset or modify the points system at any time.

5. USER CONTENT & LICENSE
- **Ownership:** You retain ownership of the photos, text, and other content ("User Content") you post.
- **License to Us:** By posting User Content, you grant Barhub a non-exclusive, worldwide, royalty-free, sublicensable, and transferable license to use, reproduce, modify, display, and distribute your User Content in connection with the App and our business (including marketing).
- **Responsibility:** You are solely responsible for your User Content. You must not post content that is illegal, offensive, violates third-party rights, or includes sensitive personal information of others without consent.

6. PREMIUM SERVICES & PAYMENTS
- **Subscriptions:** We may offer premium features (e.g., "Travel Mode", "Highlight Post") via subscription or one-time purchase.
- **Billing:** Payments are processed through the Apple App Store or Google Play Store. You agree to their respective terms and conditions.
- **Auto-Renewal:** Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period.
- **Refunds:** Refunds are subject to the policies of Apple or Google. We do not issue refunds directly.

7. PROHIBITED CONDUCT
You agree not to:
- Use the App for any illegal purpose.
- Harass, bully, or intimidate other users.
- Post sexually explicit, violent, or hateful content.
- Spam or solicit other users.
- Impersonate others or spoof your location.
- Attempt to reverse engineer or hack the App.

8. DISCLAIMERS & LIMITATION OF LIABILITY
- **"As Is" Basis:** The App is provided on an "as is" and "as available" basis without warranties of any kind.
- **Venue Safety:** Barhub is a platform for information sharing. We do not control or vet the venues listed. We are not responsible for the safety, quality, or legality of any venue or event.
- **User Interactions:** We are not responsible for your interactions with other users. Use caution and common sense.
- **Liability Cap:** To the maximum extent permitted by law, Barhub's liability shall be limited to the amount you paid us in the last 12 months, or €50, whichever is greater.

9. TERMINATION
We may terminate or suspend your access to the App immediately, without prior notice or liability, for any reason, including breach of these Terms.

10. GOVERNING LAW
These Terms shall be governed by and construed in accordance with the laws of Slovakia, without regard to its conflict of law provisions.

11. CONTACT
For questions about these Terms, please contact us via the App support.`;

    case 'PRIVACY_POLICY':
      return `PRIVACY POLICY${version ? ` - Version ${version}` : ''}

Last Updated: ${date}

1. INTRODUCTION
Barhub ("we," "us") values your privacy. This Privacy Policy explains how we collect, use, and share your personal data when you use our mobile application. We are committed to complying with the General Data Protection Regulation (GDPR).

2. DATA CONTROLLER
The data controller for your personal data is Adam Kundracik, based in Slovakia.

3. INFORMATION WE COLLECT
- **Identity Data:** Name, username, date of birth, profile picture.
- **Contact Data:** Email address, phone number (if used for auth).
- **Location Data:** Precise and approximate location data collected from your device (GPS, Wi-Fi) to show nearby venues and posts. This may be collected in the background if you enable "Travel Mode" or specific notifications.
- **User Content:** Photos, comments, posts, and interactions (likes, shares).
- **Technical Data:** IP address, device ID, device model, OS version, crash reports.
- **Usage Data:** How you use the App, features accessed, time spent.

4. HOW WE USE YOUR DATA
- **Service Delivery:** To show you relevant posts, venues, and occupancy data based on your location.
- **Community Features:** To enable photo requests, leaderboards, and user interactions.
- **Notifications:** To send you alerts about nearby requests or activity (via Push Notifications).
- **Analytics:** To understand user behavior and improve the App.
- **Safety & Security:** To prevent fraud, spam, and enforce our Terms.
- **Legal Compliance:** To comply with legal obligations.

5. LEGAL BASIS FOR PROCESSING (GDPR)
- **Contractual Necessity:** To provide the App services to you.
- **Legitimate Interests:** To improve our services, prevent fraud, and ensure security.
- **Consent:** For accessing your device location and camera. You can withdraw consent at any time via device settings.

6. DATA SHARING & THIRD PARTIES
We do not sell your personal data. We share data with trusted service providers:
- **Firebase (Google):** For authentication, database hosting, and cloud functions.
- **Google Maps:** For map display and location services.
- **RevenueCat:** For processing subscriptions and purchases.
- **AdMob (Google):** To display advertisements (if applicable).
- **Analytics Providers:** To analyze app usage.
We ensure these providers have appropriate data protection safeguards in place.

7. DATA RETENTION
- **Account Data:** Retained as long as your account is active.
- **Location Data:** Precise location history is not stored permanently; it is used to tag posts. Posts are retained until deleted by you or us.
- **Deletion:** If you delete your account, your personal data will be deleted or anonymized within 30 days, subject to legal retention requirements.

8. YOUR RIGHTS (GDPR)
You have the right to:
- **Access:** Request a copy of your personal data.
- **Rectification:** Correct inaccurate data.
- **Erasure:** Request deletion of your data ("Right to be Forgotten").
- **Restriction:** Limit how we use your data.
- **Portability:** Receive your data in a structured format.
- **Objection:** Object to processing based on legitimate interests.
To exercise these rights, please contact us through the App settings or support.

9. INTERNATIONAL TRANSFERS
Your data may be processed outside the European Economic Area (EEA). We ensure such transfers are protected by appropriate safeguards, such as Standard Contractual Clauses.

10. CHILDREN'S PRIVACY
Barhub is not intended for users under 18. We do not knowingly collect data from children. If we discover such data, we will delete it immediately.

11. CHANGES TO THIS POLICY
We may update this policy. We will notify you of significant changes through the App.`;

    case 'COMMUNITY_GUIDELINES':
      return `COMMUNITY GUIDELINES${version ? ` - Version ${version}` : ''}

Last Updated: ${date}

Barhub is a community for discovering nightlife and social venues. To keep this community safe, authentic, and fun, we ask you to follow these guidelines.

1. BE AUTHENTIC
- **Real Photos:** Only upload photos you took yourself, at the actual location, in real-time. Do not upload stock photos or old content when responding to a "Live" request.
- **Honest Occupancy:** When reporting occupancy (Busy/Medium/Empty), be honest. The community relies on accurate info.
- **No Spoofing:** Do not use GPS spoofing apps to fake your location. This ruins the experience for everyone and will result in a ban.

2. BE RESPECTFUL
- **Zero Tolerance for Harassment:** Bullying, hate speech, threats, and harassment are strictly prohibited.
- **No Discrimination:** Do not discriminate based on race, ethnicity, gender, religion, sexual orientation, or disability.
- **Respect Privacy:** Do not take or post photos of specific individuals without their consent. Focus on the venue and the "vibe," not private conversations.

3. SAFETY FIRST
- **Illegal Acts:** Do not depict or promote illegal drug use, violence, or other criminal activities.
- **Alcohol:** While Barhub is about nightlife, do not encourage dangerous behavior or excessive intoxication.
- **Self-Harm:** Content promoting self-harm or suicide is strictly prohibited.

4. PROHIBITED CONTENT
You may NOT post:
- Nudity or sexually explicit content.
- Gore or graphic violence.
- Spam, scams, or commercial advertisements (unless authorized).
- Links to malicious websites.

5. PHOTO REQUESTS & LEADERBOARD
- **Fair Play:** Do not try to "game" the leaderboard system with fake accounts or automated scripts.
- **Quality:** When responding to a photo request, ensure the photo is clear and actually shows the venue's current state.

6. REPORTING & ENFORCEMENT
- **Report:** If you see something that violates these guidelines, please use the "Report" feature in the App.
- **Consequences:** Violations may result in content removal, temporary suspension, or permanent account termination.
- **Appeals:** If you believe your account was banned in error, you may contact support.

Let's make nightlife better together!`;

    default:
      return 'Document not available';
  }
};

