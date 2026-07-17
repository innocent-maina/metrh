export interface LegalPageContent {
  title: string;
  seoTitle: string;
  seoDescription: string;
  content: string;
}

export const privacyPolicyPage: LegalPageContent = {
  title: "Privacy Policy",
  seoTitle: "Privacy Policy - MeTRH",
  seoDescription:
    "How Meru Teaching and Referral Hospital collects, uses, stores, and protects information shared through the website and online forms.",
  content: `
<p>Meru Teaching and Referral Hospital ("MeTRH", "we", "our", or "us") respects your privacy. This page explains how we handle information collected through our website, online forms, and related public services.</p>

<h2>Information we collect</h2>
<p>Depending on how you use the site, we may collect:</p>
<ul>
  <li>contact details you submit, such as your name, email address, phone number, subject, and message;</li>
  <li>information you include in requests, feedback, job applications, or other forms;</li>
  <li>technical data from your browser and device, such as IP address, browser type, pages visited, and approximate location derived from network data;</li>
  <li>cookie and usage data that helps us keep the website secure and understand what content is being used.</li>
</ul>

<h2>How we use information</h2>
<p>We use information to respond to enquiries, provide hospital services, improve the website, protect the security of our systems, and meet legal and administrative obligations.</p>

<h2>Sharing and disclosure</h2>
<p>We may share information with staff who need it to handle your request, trusted service providers who help us run the website, and public authorities where the law requires it. We do not sell personal information.</p>

<h2>Health and sensitive information</h2>
<p>Do not send urgent clinical details through general website forms unless a form explicitly asks for them. For emergencies, use the emergency line or seek immediate in-person care.</p>

<h2>Retention and security</h2>
<p>We keep information only for as long as it is needed for the purpose it was collected, or as required by law, record-keeping rules, or patient care needs. We use reasonable administrative and technical safeguards to protect it.</p>

<h2>Your rights</h2>
<p>Subject to applicable law, you may request access to your information, ask for corrections, object to certain processing, or raise a concern about how your data is handled. You may start with the hospital and, where appropriate, contact the Office of the Data Protection Commissioner.</p>

<h2>Changes to this policy</h2>
<p>We may update this policy from time to time. The latest version will appear on this page.</p>

<h2>Contact</h2>
<p>If you have a privacy question, use the contact page or reach the hospital through the official communication channels listed on the site.</p>
`,
};

export const termsOfUsePage: LegalPageContent = {
  title: "Terms of Use",
  seoTitle: "Terms of Use - MeTRH",
  seoDescription:
    "The rules for using the Meru Teaching and Referral Hospital website, including medical disclaimers, acceptable use, and contact information.",
  content: `
<p>These terms apply to the Meru Teaching and Referral Hospital website. By using the site, you agree to these terms. If you do not agree, please do not use the site.</p>

<h2>Information only</h2>
<p>The website is provided for public information, navigation, announcements, and general service access. It does not replace clinical assessment, diagnosis, or treatment from a qualified health professional.</p>

<h2>Emergency use</h2>
<p>Do not use this website for emergencies. If you need urgent medical help, call the emergency line or go to the nearest appropriate care point immediately.</p>

<h2>Your responsibilities</h2>
<p>When you submit forms or messages, you must provide information that is accurate, lawful, and relevant. Do not submit spam, abusive content, malware, or content that interferes with the website or its users.</p>

<h2>Acceptable use</h2>
<ul>
  <li>Use the site in a lawful and respectful way.</li>
  <li>Do not attempt to bypass security controls or access data you are not authorized to access.</li>
  <li>Do not copy or reuse content in a way that misrepresents the hospital or harms users.</li>
  <li>Do not rely on the site as a substitute for official notices, referrals, or clinical instructions.</li>
</ul>

<h2>Intellectual property</h2>
<p>Unless otherwise stated, the text, images, logos, and layout on this site belong to MeTRH or are used with permission. You may view and share pages for personal, educational, or journalistic use, but you may not claim hospital content as your own.</p>

<h2>External links</h2>
<p>The site may link to third-party services or information sources. Those sites are governed by their own terms and policies, and we are not responsible for their content or practices.</p>

<h2>Availability and changes</h2>
<p>We may change, suspend, or remove parts of the site at any time without notice. We may also update these terms when needed, and continued use of the site means you accept the updated version.</p>

<h2>Liability</h2>
<p>To the extent allowed by law, MeTRH is not liable for losses caused by misuse of the site, interruption of service, third-party content, or reliance on information that has become outdated.</p>

<h2>Contact</h2>
<p>If you have a question about these terms, use the contact page or the hospital's official communication channels.</p>
`,
};

export const termsOfServicePage: LegalPageContent = {
  ...termsOfUsePage,
  title: "Terms of Service",
  seoTitle: "Terms of Service - MeTRH",
};

export const cookiePolicyPage: LegalPageContent = {
  title: "Cookie Policy",
  seoTitle: "Cookie Policy - MeTRH",
  seoDescription:
    "What cookies and similar technologies the Meru Teaching and Referral Hospital website uses and how you can manage them.",
  content: `
<p>This policy explains how MeTRH uses cookies and similar technologies on the website.</p>

<h2>What cookies are</h2>
<p>Cookies are small text files stored by your browser when you visit a website. They help the site remember basic settings and understand how pages are used.</p>

<h2>Cookies we may use</h2>
<ul>
  <li><strong>Essential cookies:</strong> needed for security, page navigation, and core site functions.</li>
  <li><strong>Preference cookies:</strong> remember choices such as display settings where the site offers them.</li>
  <li><strong>Analytics cookies:</strong> help us understand which pages are visited and how users move through the site so we can improve it.</li>
  <li><strong>Embedded content cookies:</strong> may be set by third-party services if a page includes maps, video, or other embedded tools.</li>
</ul>

<h2>Why we use them</h2>
<p>We use cookies to keep the site working, improve performance, measure usage trends, and support a better browsing experience.</p>

<h2>Managing cookies</h2>
<p>You can control cookies through your browser settings. Most browsers let you block or delete cookies, but disabling essential cookies may affect how some parts of the site work.</p>

<h2>Third-party services</h2>
<p>Some services on the site may come from third parties. Those providers may set their own cookies, and their use of data is governed by their own policies.</p>

<h2>Updates</h2>
<p>We may update this cookie policy when the website changes or when the law requires a revision. The latest version will always appear on this page.</p>

<h2>Contact</h2>
<p>If you want to ask a question about cookies on this site, use the contact page.</p>
`,
};
