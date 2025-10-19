export const getLegalDocumentContent = (
  type: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES',
  version?: string
): string => {
  switch (type) {
    case 'TERMS_OF_SERVICE':
      return `Terms of Service${version ? ` - Version ${version}` : ''}

Last Updated: ${new Date().toLocaleDateString()}

1. ACCEPTANCE OF TERMS
By accessing and using BarHub, you accept and agree to be bound by these Terms of Service.

2. USER ACCOUNTS
- You must be at least 13 years old to use this service
- You are responsible for maintaining the security of your account
- You must provide accurate and complete information

3. PREMIUM SUBSCRIPTION & BILLING
- Premium subscriptions are billed monthly or yearly
- Subscriptions auto-renew unless canceled
- Refunds are handled on a case-by-case basis
- You can cancel your subscription at any time from your account settings

4. USER CONTENT
- You retain rights to your content
- You grant us a license to display and distribute your content within the app
- Prohibited content will be removed without notice
- We reserve the right to moderate content

5. PROHIBITED ACTIVITIES
- Fake location spoofing
- Spam or misleading information
- Harassment or abusive behavior
- Violation of others' privacy

6. TERMINATION
We reserve the right to terminate or suspend accounts that violate these terms.

7. LIMITATION OF LIABILITY
BarHub is provided "as is" without warranties. We are not liable for indirect damages.

8. CHANGES TO TERMS
We may update these terms. Continued use after updates constitutes acceptance of the new terms.

9. GOVERNING LAW
These terms are governed by the laws of Slovakia.

For full terms, visit: https://barhub.app/terms`;

    case 'PRIVACY_POLICY':
      return `Privacy Policy${version ? ` - Version ${version}` : ''}

Last Updated: ${new Date().toLocaleDateString()}

1. INFORMATION WE COLLECT
- Account information (name, email, date of birth)
- Photos and posts you upload
- Location data (when using the app)
- Device information and analytics
- Push notification tokens

2. HOW WE USE YOUR DATA
- To provide and improve our services
- To personalize your experience
- To send notifications about requests and activity
- To ensure security and prevent fraud
- To enforce our terms and community guidelines

3. LOCATION DATA
- We collect location data to show nearby places
- Location data is used for post verification
- Location is stored with your posts
- You can disable location services, but core features will be limited

4. DATA SHARING
- We do not sell your personal data to third parties
- Admin and Moderators may access data for moderation purposes
- We may share anonymized, aggregated analytics
- Data may be shared if required by law

5. YOUR RIGHTS (GDPR)
- Right to access your data
- Right to request data deletion
- Right to export your data
- Right to withdraw consent
- Right to rectification of inaccurate data
- Right to restrict processing

6. DATA RETENTION
- Account data: Until you delete your account
- Posts: Until you delete them
- Location history: Stored with posts
- Analytics: Anonymized after 90 days
- Deleted accounts: Fully removed within 30 days

7. COOKIES AND TRACKING
- We use essential cookies for authentication
- Analytics cookies help us improve the app
- You can disable non-essential cookies in settings

8. SECURITY
- We use industry-standard encryption
- Access to data is restricted to authorized personnel
- We conduct regular security audits

9. CHILDREN'S PRIVACY
- Our service is not intended for children under 13
- We do not knowingly collect data from children under 13
- If we discover such data, we will delete it promptly

10. INTERNATIONAL TRANSFERS
- Data may be transferred and stored outside your country
- We ensure adequate protection for such transfers

For full policy, visit: https://barhub.app/privacy`;

    case 'COMMUNITY_GUIDELINES':
      return `Community Guidelines${version ? ` - Version ${version}` : ''}

Last Updated: ${new Date().toLocaleDateString()}

Welcome to BarHub! These guidelines help maintain a safe and respectful community.

1. BE RESPECTFUL
- Treat others with kindness and respect
- No harassment, hate speech, or bullying
- Respect the privacy of others
- Constructive criticism is okay, personal attacks are not

2. PHOTO GUIDELINES
- Only upload photos from the actual location at the time you're there
- No fake location spoofing or GPS manipulation
- Photos must be appropriate for all ages
- No copyrighted material without permission
- Photos should accurately represent the venue

3. AUTHENTICITY
- Provide accurate occupancy information
- Don't manipulate data or mislead other users
- Be honest in your posts and interactions
- Report fake or suspicious content

4. REPORTING & MODERATION
- Use the report button to flag violations
- Moderators review reports within 24 hours
- False reports may result in penalties
- Repeated violations may result in account suspension

5. PROHIBITED CONTENT
- Nudity or sexually explicit content
- Violence, gore, or graphic content
- Hate speech or discriminatory content
- Spam, scams, or misleading information
- Illegal activities or promotion thereof
- Personal information of others without consent

6. PREMIUM FEATURES
- Premium features are for personal use only
- Sharing premium accounts is prohibited
- Abuse of premium features may result in subscription cancellation

7. CONSEQUENCES FOR VIOLATIONS
- First violation: Warning message
- Second violation: Temporary suspension (7 days)
- Third violation: Extended suspension (30 days)
- Severe violations: Permanent account ban
- Appeals can be submitted to support

8. INTELLECTUAL PROPERTY
- Respect copyright and trademark rights
- Don't use BarHub branding without permission
- Report copyright violations

9. PRIVACY & SAFETY
- Don't share personal contact information publicly
- Block users who make you uncomfortable
- Report safety concerns immediately

Help us maintain a positive, authentic community where everyone feels welcome!

For full guidelines, visit: https://barhub.app/community`;

    default:
      return 'Document not available';
  }
};

