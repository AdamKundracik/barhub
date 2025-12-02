export const getLegalDocumentContent = (
  type: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'COMMUNITY_GUIDELINES',
  version?: string
): string => {
  const date = new Date().toLocaleDateString();

  switch (type) {
    case 'TERMS_OF_SERVICE':
      return `TERMS OF SERVICE & EULA${version ? ` - Version ${version}` : ''}

Last Updated: December 02, 2025

1. ACKNOWLEDGEMENT
This End User License Agreement ("Agreement") is between you ("End-User") and Barhub (operated by Adam Kundracik, "we," "us," or "our"), not with Apple. We are solely responsible for the App and its content. Your use of the App must comply with the Apple Media Services Terms and Conditions.

2. SCOPE OF LICENSE
You are granted a non-transferable, non-exclusive license to use the App on any Apple-branded Products that you own or control and as permitted by the Usage Rules set forth in the Apple Media Services Terms and Conditions, except that such Licensed Application may be accessed and used by other accounts associated with the purchaser via Family Sharing or volume purchasing.

3. ELIGIBILITY & AGE RESTRICTION
- You must be at least 13 years old to use Barhub. By using the App, you represent and warrant that you are 13 or older.
- The App is intended for social discovery of nightlife venues. We do not encourage excessive alcohol consumption or illegal activities.

4. USER ACCOUNTS
- You are responsible for maintaining the confidentiality of your login credentials.
- You agree to provide accurate, current, and complete information during registration.
- You are solely responsible for all activities that occur under your account.
- We reserve the right to disable any account if we suspect a violation of these Terms.

5. APP FUNCTIONALITY & LOCATION SERVICES
- **Location Tracking:** Barhub requires access to your device's location (foreground and/or background) to function. This enables features like the "Radius" feed, "Travel Mode," and location-based notifications.
- **Photo Requests:** Users may request real-time photos from venues. By responding, you agree to share your current location and photo with the community.
- **Leaderboard:** Points earned on the leaderboard have no monetary value and cannot be exchanged for cash or goods. We reserve the right to reset or modify the points system at any time.

6. USER CONTENT & LICENSE
- **Ownership:** You retain ownership of the photos, text, and other content ("User Content") you post.
- **License to Us:** By posting User Content, you grant Barhub a non-exclusive, worldwide, royalty-free, sublicensable, and transferable license to use, reproduce, modify, display, and distribute your User Content in connection with the App and our business (including marketing).
- **Responsibility:** You are solely responsible for your User Content. You must not post content that is illegal, offensive, violates third-party rights, or includes sensitive personal information of others without consent.

7. MAINTENANCE & SUPPORT
We are solely responsible for providing any maintenance and support services with respect to the App, as specified in this Agreement, or as required under applicable law. Apple has no obligation whatsoever to furnish any maintenance and support services with respect to the App.

8. WARRANTY
We are solely responsible for any product warranties, whether express or implied by law, to the extent not effectively disclaimed. In the event of any failure of the App to conform to any applicable warranty, you may notify Apple, and Apple will refund the purchase price for the App to you. To the maximum extent permitted by applicable law, Apple will have no other warranty obligation whatsoever with respect to the App, and any other claims, losses, liabilities, damages, costs or expenses attributable to any failure to conform to any warranty will be our sole responsibility.

9. PRODUCT CLAIMS
We, not Apple, are responsible for addressing any claims of the End-User or any third party relating to the App or your possession and/or use of the App, including, but not limited to: (i) product liability claims; (ii) any claim that the App fails to conform to any applicable legal or regulatory requirement; and (iii) claims arising under consumer protection, privacy, or similar legislation.

10. INTELLECTUAL PROPERTY RIGHTS
In the event of any third party claim that the App or your possession and use of the App infringes that third party’s intellectual property rights, we, not Apple, will be solely responsible for the investigation, defense, settlement and discharge of any such intellectual property infringement claim.

11. PROHIBITED CONDUCT
You agree not to:
- Use the App for any illegal purpose.
- Harass, bully, or intimidate other users.
- Post sexually explicit, violent, or hateful content.
- Spam or solicit other users.
- Impersonate others or spoof your location.
- Attempt to reverse engineer or hack the App.

12. LEGAL COMPLIANCE
You represent and warrant that (i) you are not located in a country that is subject to a U.S. Government embargo, or that has been designated by the U.S. Government as a “terrorist supporting” country; and (ii) you are not listed on any U.S. Government list of prohibited or restricted parties.

13. DISCLAIMERS & LIMITATION OF LIABILITY
- **"As Is" Basis:** The App is provided on an "as is" and "as available" basis without warranties of any kind.
- **Venue Safety:** Barhub is a platform for information sharing. We do not control or vet the venues listed. We are not responsible for the safety, quality, or legality of any venue or event.
- **User Interactions:** We are not responsible for your interactions with other users. Use caution and common sense.
- **Liability Cap:** To the maximum extent permitted by law, our liability shall be limited to €50. The EULA may not limit our liability to you beyond what is permitted by applicable law.

14. THIRD PARTY TERMS OF AGREEMENT
You must comply with applicable third party terms of agreement when using the App (e.g., if you have a VoIP application, then you must not be in violation of their wireless data service agreement when using the App).

15. THIRD PARTY BENEFICIARY
Apple, and Apple’s subsidiaries, are third party beneficiaries of this Agreement. Upon your acceptance of this Agreement, Apple will have the right (and will be deemed to have accepted the right) to enforce this Agreement against you as a third party beneficiary thereof.

16. TERMINATION
We may terminate or suspend your access to the App immediately, without prior notice or liability, for any reason, including breach of these Terms.

17. GOVERNING LAW
These Terms shall be governed by and construed in accordance with the laws of Slovakia, without regard to its conflict of law provisions.

18. DEVELOPER NAME & CONTACT
For questions, complaints or claims with respect to the App, please contact us:
Developer: Adam Kundracik
Address: Slovakia
Email: support@barhubapp.com`;

    case 'PRIVACY_POLICY':
      return `PRIVACY POLICY FOR BARHUB APP${version ? ` - Version ${version}` : ''}

Last Updated: November 26, 2025

This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You. We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy. This Privacy Policy has been created with the help of the Privacy Policy Generator.

INTERPRETATION AND DEFINITIONS

Interpretation
The words whose initial letters are capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.

Definitions
For the purposes of this Privacy Policy:

Account means a unique account created for You to access our Service or parts of our Service.

Affiliate means an entity that controls, is controlled by, or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.

Application refers to Barhub app, the software program provided by the Company.

Company (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Barhub app.

Country refers to: Slovakia

Device means any device that can access the Service such as a computer, a cellphone or a digital tablet.

Personal Data is any information that relates to an identified or identifiable individual.

Service refers to the Application.

Service Provider means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used.

Usage Data refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).

You means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.

COLLECTING AND USING YOUR PERSONAL DATA

Types of Data Collected

Personal Data
While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:
- Email address
- First name and last name
- Profile picture
- Usage Data

Information from Social Login Providers
If You choose to register or log in to our Service using a third-party social login provider (e.g., Google Sign-In, or other providers we may add in the future), We may collect certain information associated with Your account with such providers, with Your prior consent granted through the respective provider. This information may include, but is not limited to:
- Your name
- Your email address
- Profile picture
- Unique identifiers required for authentication

We use this information exclusively for authentication purposes, account creation, and to streamline Your access to the Service. The collection and processing of this data is always based on Your explicit consent provided through the social login provider. The use of this data is also governed by the privacy policy of the respective provider (for example, Google Privacy Policy: https://policies.google.com/privacy).

Usage Data
Usage Data is collected automatically when using the Service.

Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.

When You access the Service by or through a mobile device, We may collect certain information automatically, including, but not limited to, the type of mobile device You use, Your mobile device's unique ID, the IP address of Your mobile device, Your mobile operating system, the type of mobile Internet browser You use, unique device identifiers and other diagnostic data.

We may also collect information that Your browser sends whenever You visit Our Service or when You access the Service by or through a mobile device.

Information Collected while Using the Application
While using Our Application, in order to provide features of Our Application, We may collect, with Your prior permission:
- Information regarding Your location
- Pictures and other information from Your Device's camera and photo library

We use this information to provide features of Our Service, to improve and customize Our Service. The information may be uploaded to the Company's servers and/or a Service Provider's server or it may be simply stored on Your device. You can enable or disable access to this information at any time, through Your Device settings.

Use of Your Personal Data
The Company may use Personal Data for the following purposes:

- To provide and maintain our Service, including to monitor the usage of our Service.
- To manage Your Account: to manage Your registration as a user of the Service. The Personal Data You provide can give You access to different functionalities of the Service that are available to You as a registered user.
- For the performance of a contract: the development, compliance and undertaking of the purchase contract for the products, items or services You have purchased or of any other contract with Us through the Service.
- To contact You: To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication, such as a mobile application's push notifications regarding updates or informative communications related to the functionalities, products or contracted services, including the security updates, when necessary or reasonable for their implementation.
- To provide You with news, special offers, and general information about other goods, services and events which We offer that are similar to those that You have already purchased or enquired about unless You have opted not to receive such information.
- To manage Your requests: To attend and manage Your requests to Us.
- For business transfers: We may use Your information to evaluate or conduct a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of Our assets, whether as a going concern or as part of bankruptcy, liquidation, or similar proceeding, in which Personal Data held by Us about our Service users is among the assets transferred.
- For other purposes: We may use Your information for other purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Service, products, services, marketing and Your experience.

We may share Your personal information in the following situations:

- With Service Providers: We may share Your personal information with Service Providers to monitor and analyze the use of our Service, for advertising, and to contact You.
- For business transfers: We may share or transfer Your personal information in connection with, or during negotiations of, any merger, sale of Company assets, financing, or acquisition of all or a portion of Our business to another company.
- With Affiliates: We may share Your information with Our affiliates, in which case we will require those affiliates to honor this Privacy Policy. Affiliates include Our parent company and any other subsidiaries, joint venture partners or other companies that We control or that are under common control with Us.
- With business partners: We may share Your information with Our business partners to offer You certain products, services or promotions.
- With social login providers: When You use third-party login services (e.g., Google Sign-In), limited data is shared with the provider as required for authentication.
- With advertising partners: Through Google AdMob and its partners for the purpose of displaying advertisements.
- With other users: when You share personal information or otherwise interact in the public areas with other users, such information may be viewed by all users and may be publicly distributed outside.
- With Your consent: We may disclose Your personal information for any other purpose with Your consent.

Retention of Your Personal Data
The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.

The Company will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of Our Service, or We are legally obligated to retain this data for longer periods.

Transfer of Your Personal Data
Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to — and maintained on — computers located outside of Your state, province, country or other governmental jurisdiction where the data protection laws may differ from those from Your jurisdiction.

Your consent to this Privacy Policy followed by Your submission of such information represents Your agreement to that transfer.

The Company will take all steps reasonably necessary to ensure that Your data is treated securely and in accordance with this Privacy Policy and no transfer of Your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of Your data and other personal information.

Delete Your Personal Data
You have the right to delete or request that We assist in deleting the Personal Data that We have collected about You. Our Service may give You the ability to delete certain information about You from within the Service.

You may update, amend, or delete Your information at any time by signing in to Your Account, if you have one, and visiting the account settings section that allows you to manage Your personal information. You may also contact Us to request access to, correct, or delete any personal information that You have provided to Us.

Please note, however, that We may need to retain certain information when we have a legal obligation or lawful basis to do so.

Disclosure of Your Personal Data

Business Transactions
If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.

Law enforcement
Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).

Other legal requirements
The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:
- Comply with a legal obligation
- Protect and defend the rights or property of the Company
- Prevent or investigate possible wrongdoing in connection with the Service
- Protect the personal safety of Users of the Service or the public
- Protect against legal liability

Security of Your Personal Data
The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially reasonable means to protect Your Personal Data, We cannot guarantee its absolute security.

Detailed Information on the Processing of Your Personal Data
The Service Providers We use may have access to Your Personal Data. These third-party vendors collect, store, use, process and transfer information about Your activity on Our Service in accordance with their Privacy Policies.

Advertising and Analytics Service Providers

Google AdMob
Our Application uses Google AdMob to display advertisements. AdMob may collect certain information about Your device and Your behavior within the app in order to serve personalized or non-personalized advertisements. AdMob may collect, for example:
- Device identifiers (e.g., Advertising ID, IDFA)
- IP address
- Data about interactions with advertisements
- Information used for operational, security, and fraud prevention purposes

The use of Google AdMob is governed by Google's Privacy Policy: https://www.google.com/intl/en/policies/privacy/

If You do not wish to receive personalized advertisements, You can opt out in Your device settings (e.g., "Opt out of Ads Personalization" on Android or "Limit Ad Tracking" on iOS).

Google Places
Google Places is a service that returns information about places using HTTP requests. It is operated by Google. Google Places service may collect information from You and from Your Device for security purposes.

The information gathered by Google Places is held in accordance with the Privacy Policy of Google: https://www.google.com/intl/en/policies/privacy/

CHILDREN'S PRIVACY
Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us. If We become aware that We have collected Personal Data from anyone under the age of 13 without verification of parental consent, We take steps to remove that information from Our servers.

LINKS TO OTHER WEBSITES
Our Service may contain links to other websites that are not operated by Us. If You click on a third-party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit.

We have no control over and assume no responsibility for the content, privacy policies or practices of any third-party sites or services.

CHANGES TO THIS PRIVACY POLICY
We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.

We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.

CONTACT US
If you have any questions about this Privacy Policy, You can contact us:
- By email: support@barhubapp.com`;

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

