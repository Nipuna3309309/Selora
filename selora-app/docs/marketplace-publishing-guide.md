# Publishing Selora on Microsoft Marketplace (AppSource)

Researched 2026-10-19 from Microsoft Learn (Partner Center docs, Marketplace certification policies v1.67, Power Platform
developer docs). Sources are listed at the end. Microsoft renamed "AppSource" and "commercial marketplace" to
**Microsoft Marketplace** (marketplace.microsoft.com); the old names still appear in many docs.

---

## 1. The short version

1. Your company gets a **Partner Center** account, passes **verification** and enrols in the **Microsoft Marketplace** program
   (accepting the Microsoft Publisher Agreement).
2. You build a **managed solution** with everything Selora needs, wrap it in a **Marketplace package** (.zip with
   Package Deployer package, `Input.xml`, `[Content_Types].xml`, 32x32 icon, license terms HTML) and upload it to
   **Azure Blob Storage** with a read-only **SAS URL**.
3. In Partner Center you create a **"Dynamics 365 apps on Dataverse and Power Apps"** offer, fill every page (setup, properties,
   listing, availability, technical configuration, supplemental content) and select **Review and publish**.
4. Microsoft **certifies** it (business eligibility, content check, technical check: Solution Checker, install/uninstall with
   Package Deployer, functional test from your E2E document, security review).
5. You check the **preview** and press **Go live**. Recertify at least every **6 months**.

Publishing is free. If Microsoft sells it for you ("Buy now"), Microsoft keeps a **3% store service fee**.

---

## 2. Which offer type Selora uses

| Question | Answer |
|---|---|
| Offer type in Partner Center | **Dynamics 365 apps on Dataverse and Power Apps** (Power Apps solutions and Dynamics 365 CE apps both use it) |
| Package format | Package Deployer package inside a Marketplace package .zip, stored in Azure Blob with a SAS URL |
| Who installs it | Customer admin, from the listing or the Power Platform admin center, into a Dataverse environment |
| Customer licences | Code apps need **Power Apps Premium** (or per-app, pay-as-you-go, auto-claim) for every end user, on top of your app's price |

---

## 3. Account and company documents (do this first, it takes days)

### 3.1 Partner Center account and Marketplace enrolment
- Sign up at Partner Center with a **work account (Microsoft Entra ID)**, not a personal email.
- Join the **Microsoft AI Cloud Partner Program** (gives you a Partner ID / PartnerOne ID).
- Settings > Account settings > Identifiers > Publisher > **Add program > Microsoft Marketplace**, then accept the
  **Microsoft Publisher Agreement**. The person accepting must be authorised to sign for the company.
- Check: Settings > Account settings > Programs shows Microsoft Marketplace as registered.
- Best practice: at least **two Owners** on the publisher account.

### 3.2 Verification: what Microsoft checks and what you upload
Normally 3-5 business days. Emails go only to the **primary contact**, so watch that inbox (and junk folder).

| Check | What you need |
|---|---|
| Email verification | Primary contact's **company-domain email** (no Gmail/Outlook.com). Click the code Microsoft sends. |
| Identity verification | At least one user verifies with a **government-issued ID**; the name must match the Partner Center user name. |
| Employment verification | **Domain ownership documents** from an authorised registrar showing business name, address, domain, purchase and expiry dates. |
| Business verification | **Company registration documents**: certificate of incorporation / business registration / business licence, with legal name and address matching Partner Center **exactly** (no abbreviations). |
| Additional verification | Sometimes a questionnaire if Microsoft wants more assurance. |

Roles that can complete verification: Global admin, Compliance admin, Account admin, or Marketplace Manager/Owner.
If rejected you can submit an appeal from Verification Summary.

### 3.3 Only if you sell through Microsoft (paid "Buy now")
Not needed for Free, Free trial, Contact me or "Get it now" listings.
- **Tax profile** (Owner or Financial Contributor role): every publisher fills **US tax forms**. Outside the US
  (Sri Lanka included) that is an **IRS W-8** (usually W-8BEN-E for a company). Up to 48 h to validate.
- **Payout profile**: a bank account (or PayPal where supported) **in the same country as the Partner Center account**,
  account holder name exactly as at the bank, payout currency chosen. Up to 48 h to validate.
- Fee: Microsoft keeps **3%** of the licence price.

### 3.4 Optional but useful
- **Publisher verification** of any Entra app registration (blue verified badge). Needs the PGA Partner ID, a DNS-verified
  custom domain matching your Partner Center email domain (not `*.onmicrosoft.com`) and MFA.
- **Co-sell with Microsoft** tab (optional) so Microsoft sellers can recommend you.

---

## 4. Listing options (pick one; it decides what you must build)

| Option | How it works | Selora fit |
|---|---|---|
| **Contact me** | Customer leaves details; lead goes to Partner Center Referrals (and optionally your CRM). | Easiest first listing. |
| **Get it now (free)** | Customer installs it for free. | Possible once certified. |
| **Free trial (listing)** | Link to a trial you host; 1, 3 or 6 months. Tokens only for Entra sign-in to create accounts. | Needs your own trial setup. |
| **Get it now (with licence management)** | BYOL: you sell outside Microsoft, licences assigned in Microsoft 365 admin center. | See warning below. |
| **Buy now (transact)** | Microsoft bills customers per user per month; licence management switched on automatically. | See warning below. |

**Warning for Selora:** Microsoft's ISV app licence enforcement currently supports **named users** and **model-driven
apps only**, and asks for ISV Connect enrolment. A code app is not a model-driven app, so licence enforcement would not
protect Selora. For paid Selora either add a model-driven app as the licensed component or start with Contact me / Free.

Policy 1420.2: these offers must be Free, Trial, Contact me or ISV app licence management. Policy 100.1.5: at least one public plan.

---

## 5. Everything you upload or type in Partner Center

### 5.1 Offer setup page
- **Offer ID**: lowercase letters, numbers, `-`, `_`. Publisher ID + Offer ID at most **40 characters**. Can't change later.
  It appears in the URL: `marketplace.microsoft.com/product/dynamics-365/<publisherid>.<offerid>`.
- **Offer alias**: internal name only. Can't change later.
- Sell through Microsoft: Yes / No; licence management tick boxes; listing option (section 4).
- **Customer leads**: leads always appear in Partner Center Referrals; optionally connect Dynamics 365, Salesforce,
  Marketo, Azure Table or an HTTPS endpoint (Power Automate works).

### 5.2 Properties page
- Up to **2 categories**, each with up to 2 subcategories. If the app has AI features, choose **AI Apps and Agents**.
- Industries: up to 2 (each with 2 verticals) only if the app is industry-specific (e.g. Retail). Mention it in the description.
- **Applicable products**: e.g. Power Apps, Power Automate.
- **App version** shown to customers.
- **Terms and conditions** (text or URL). Required.

### 5.3 Offer listing page
| Field | Rule |
|---|---|
| Name | Max 200 characters, no emojis; must match the name you use elsewhere (100.1.1) |
| Search results summary | Max **100** characters |
| Description | Max **5,000** characters, plain text or simple HTML, must include the **full product name** (1420.3); value, audience, supported Microsoft products, prerequisites (e.g. "users need Power Apps Premium"), limitations, any extra charges |
| Search keywords | Up to 3 |
| Products your app works with | Up to 3 |
| **Help link** | URL; must be **different** from the Support URL |
| **Privacy policy link** | Required; must describe what customer data you collect, use and store |
| **Support contact** | Name, email, phone (digits and spaces only), support website URL. Not public. |
| **Engineering contact** | Name, email, phone. Not public. |
| **Supporting documents** | **1 to 3 PDFs**, customer-facing marketing (brochure, white paper, datasheet). No credentials or internal data. |
| **Logo** | **PNG**, Large size (Partner Center derives the other sizes from it). No text in the logo, flat, not stretched, avoid white/black backgrounds. |
| **Screenshots** | **1 to 5**, **1280 x 720 PNG**, each with a caption. Blurry images get rejected. |
| Videos (optional) | Up to 4, YouTube or Vimeo link plus a **1280 x 720 PNG** thumbnail |

Language: one language only. English isn't required, but a non-English description must begin with
"This application is available only in [language]." Don't mention competitors, other marketplaces or Microsoft partner
programme badges (100.7). Follow Microsoft trademark guidelines.

### 5.4 Availability page
- **Markets**: pick countries (you're responsible for local laws, e.g. GDPR for the EU).
- **Preview audience / Hide key**: lowercase letters and numbers; used to see the offer before it's public.

### 5.5 Plans (only with licence management or Buy now)
- Plan ID (max 50 characters, lowercase), plan name (max 200), per-user monthly/annual price per market (or CSV import),
  optional private plans for specific customer tenants, 1-month trial possible.
- Copy each plan's **Service ID** (`publisher.offer.plan`) into the solution with `pac solution add-license`
  (plan definition CSV + plan mapping CSV), rebuild, then export managed.

### 5.6 Technical configuration page
- **Base licence model**: `Resource` (instance) or `User` (per user; required with licence management).
- "Requires S2S outbound and CRM Secure Store Access": leave unticked unless needed (triggers extra review).
- Application configuration URL: leave blank.
- **URL of your package location**: the Azure Blob **SAS URL** of the Marketplace package .zip. Give the SAS an expiry
  at least **one month** out; an expired link blocks publishing.
- Tick "more than one CRM package" only if the zip holds several.
- **CRM package availability**: add the regions (geos). Don't pick sovereign clouds (US Gov, China, DoD).

### 5.7 Supplemental content page (only Microsoft sees it)
- **Key usage scenarios PDF** = the **End-to-End (E2E) functional document**. Certification tests exactly what is in it
  (1420.5, 1420.8). Include: install steps, post-install setup (connections, environment variables, security roles,
  SharePoint/data setup), every user journey (customer, admin, supplier), admin journey, external connections and how to
  authenticate them, test accounts/sample data, expected results. Video links can be emailed as an alternative.

### 5.8 Review and publish page
- Every page must show **Complete**.
- **Notes for certification**: test instructions, test logins, anything the tester needs.

---

## 6. Building the package (the technical deliverable)

### Step 1: Managed solution
- One solution with a **publisher and prefix** you own (e.g. `sriq`). Set a customer-facing **Display Name** and
  **Description** (shown in the admin center).
- Include everything: the app, tables, flows, **connection references**, **environment variables**, security roles,
  custom connectors, web resources. Solution max **95 MB**.
- Export as **Managed**, with **Run solution checker** on. Increment the version for every submission (1420.4).
- Optional demo/config data: export with the **Configuration Migration tool** (schema + data .zip).

### Step 2: Package Deployer package
- Create a Package Deployer project (`pac package init`, then `pac package add-solution`, build) giving
  `<PackageName>.dll` + package folder (`PkgFolder`) with the solution and data.
- Zip `PkgFolder`, the `.dll` and a `[Content_Types].xml` into **package.zip**.

### Step 3: Marketplace package (outer zip, flat, no nested folder)
```
Company_Selora.zip
├── package.zip            (Package Deployer package from step 2)
├── [Content_Types].xml    (MIME types: xml, dll, zip, png, html, json, msapp, ...)
├── logo32x32.png          (32x32 PNG or JPG)
├── TermsOfUse.html        (your licence terms; one per language if multilingual)
└── Input.xml
```
`Input.xml` (element names are case-sensitive):
```xml
<?xml version="1.0" encoding="utf-8"?>
<PvsPackageData>
  <ProviderName>SRIQ Corporation</ProviderName>
  <PackageFile>package.zip</PackageFile>
  <SolutionAnchorName>Selora_managed.zip</SolutionAnchorName>
  <StartDate>11/01/2026</StartDate>
  <EndDate>01/01/2036</EndDate>
  <SupportedCountries>LK,US,GB,AU,IN</SupportedCountries>
  <LearnMoreLink>https://example.com/selora</LearnMoreLink>
  <Locales>
    <PackageLocale Code="1033" IsDefault="true">
      <Logo>logo32x32.png</Logo>
      <Terms><PackageTerm File="TermsOfUse.html" /></Terms>
    </PackageLocale>
  </Locales>
</PvsPackageData>
```
- Dates are MM/DD/YYYY. `SupportedCountries` has **no spaces or line breaks**. Locale codes must match `solution.xml`.
- Wrong file names or a nested folder are the most common certification failures.

### Step 4: Azure Blob Storage
- Azure storage account > container > upload the zip (Azure Storage Explorer is easiest).
- Right-click > **Get Shared Access Signature**, read-only, expiry at least a month out > copy the URL into Technical configuration.

---

## 7. What certification checks (so you can pass first time)

Overall: **publisher eligibility**, **content validation** (title, description, screenshots, how it uses Microsoft
platforms), **technical validation** (malware scan, network call monitoring, package analysis, functional testing).
Failures come back as a report by email and in the Partner Center Action Center; fix and resubmit as often as needed.

For Power Apps / Dataverse offers (policy 1420 and the App certification checklist):

| Check | What they do | How to prepare |
|---|---|---|
| Sanity | Listing type is Free/Trial/Contact me/licence managed; package has all artifacts; E2E document is complete | Use section 5.7 checklist |
| Code validation | **Power Apps Checker / Solution Checker** with the **AppSource Certification ruleset**; canvas apps: formula errors, runtime errors, **accessibility** errors | Run Solution Checker yourself, fix all High/Critical; fix accessibility (labels, contrast, keyboard) |
| Deployment | Installs with **Package Deployer**, opens the app in edit and run mode, checks connectors connect, all components present, then **uninstalls** and checks everything is removed | Test install + uninstall in a clean trial environment in another tenant |
| Functionality | Runs every scenario in your E2E document; everything must work | Give test accounts and sample data |
| Security | External data sources and non-Power-Platform connections must be documented; custom code in Package Deployer is reviewed; service accounts must **not** get System Admin / Customizer / Maker roles, only a least-privilege custom role | Ship custom security roles; no secrets in env var defaults or flow parameters |
| Sitemap | Must not change or remove out-of-box sitemaps | Don't touch OOB sitemaps |
| Platform | Dynamics 365 v9.1+, UCI (model-driven only), **public APIs only** | |
| Recertification | Within **6 months** of the last successful publish | Calendar reminder |

General policy reminders (100.x): the UI must not look unfinished (100.12), show loading indicators for slow actions,
provide real value (100.8), keep a working privacy policy, terms, documentation and help links (100.5), and disclose
any extra charges or dependencies (100.4), e.g. Power Apps Premium licences and a SharePoint site.

---

## 8. After submitting: publish flow

1. **Review and publish** > **Publish**. Status moves through Automated validation > Certification > Publisher sign-off.
2. Email arrives when the **preview** is ready. Use the preview link (and hide key) to check the listing; for Contact me,
   submit a test lead; for paid offers, open a support ticket before a test purchase or you will be billed.
3. Press **Go live**. The listing then goes public; Partner Center shows the progress.
4. Every change needs a **republish**. Package changes need a new version number and recertification.

Lead time to plan for: verification 3-5 business days (longer if documents are queried), tax/payout up to 48 h each,
certification typically 1-2 weeks per round (estimate, varies).

---

## 9. Selora-specific gaps found in this repo (fix before packaging)

These come from reading `power.config.json` and the current setup, not from the Microsoft docs.

1. **Hard-coded SharePoint site.** The app's data lives in SharePoint lists at
   `netorgft6455485.sharepoint.com/sites/NipunaAutomateTesting`. A customer's tenant can't reach that. The site URL and
   list names must become **environment variables** (or the data moved into **Dataverse tables** in the solution).
   SharePoint lists are not solution components, so they would not install with the package; Dataverse tables would.
2. **Code app acceptance is unconfirmed.** The certification checklist names model-driven apps, canvas apps and flows;
   it doesn't mention Power Apps **code apps**. Code apps also need an environment setting turned on by the customer's
   admin ("Enable code apps"). Ask Microsoft through a Partner Center support ticket before investing in packaging.
3. **Licence enforcement** (paid listing) works only for model-driven apps (section 4).
4. **End-user licences**: every Selora user needs Power Apps Premium (code apps). Say so in the description.
5. Flows must use **connection references** and **environment variables** only (no hard-coded emails, sites or secrets).
6. **Security roles** for Admin / Supplier / Customer should ship in the solution with least privilege.
7. **Privacy policy, terms of use, help page and support page** URLs are needed and must be live.
8. Prepare the media: logo PNG, 1-5 screenshots at 1280x720, 1-3 marketing PDFs, E2E functional document PDF.

---

## 10. Master checklist

**Company / account**
- [ ] Partner Center account (work account), AI Cloud Partner Program, Partner ID
- [ ] Marketplace program enrolled, Publisher Agreement accepted
- [ ] Verification passed: company email, government ID, domain documents, incorporation/registration documents
- [ ] Two Owners on the publisher account
- [ ] (Paid only) W-8BEN-E tax profile and bank payout profile validated

**Legal / web pages**
- [ ] Terms and conditions (text or URL) and `TermsOfUse.html` in the package
- [ ] Privacy policy URL
- [ ] Help URL and a separate Support URL
- [ ] Support contact and engineering contact (name, email, phone)

**Media and documents**
- [ ] Logo PNG (large), 32x32 package icon
- [ ] 1-5 screenshots 1280x720 PNG with captions
- [ ] Optional videos + 1280x720 thumbnails
- [ ] 1-3 customer marketing PDFs
- [ ] E2E functional document / key usage scenarios PDF
- [ ] Notes for certification (test accounts, steps)

**Listing text**
- [ ] Name, 100-character summary, description (full product name, prerequisites, licences needed), 3 keywords
- [ ] Categories, industries, applicable products, app version, markets, hide key

**Package**
- [ ] Managed solution, version incremented, Solution Checker clean (AppSource ruleset)
- [ ] Connection references + environment variables, no secrets, security roles included
- [ ] Package Deployer package.zip
- [ ] Outer zip: package.zip, [Content_Types].xml, logo32x32.png, TermsOfUse.html, Input.xml (flat)
- [ ] Uploaded to Azure Blob, read-only SAS URL valid for 1+ month
- [ ] Clean install and uninstall tested in a separate tenant

---

## Sources

- Plan a Dynamics 365 offer: https://learn.microsoft.com/partner-center/marketplace-offers/marketplace-dynamics-365
- Create the offer (setup, leads): https://learn.microsoft.com/partner-center/marketplace-offers/dynamics-365-customer-engage-offer-setup
- Properties: https://learn.microsoft.com/partner-center/marketplace-offers/dynamics-365-customer-engage-properties
- Offer listing (media rules): https://learn.microsoft.com/partner-center/marketplace-offers/dynamics-365-customer-engage-offer-listing
- Availability: https://learn.microsoft.com/partner-center/marketplace-offers/dynamics-365-customer-engage-availability
- Plans: https://learn.microsoft.com/partner-center/marketplace-offers/dynamics-365-customer-engage-plans
- Technical configuration: https://learn.microsoft.com/partner-center/marketplace-offers/dynamics-365-customer-engage-technical-configuration
- Supplemental content: https://learn.microsoft.com/partner-center/marketplace-offers/dynamics-365-customer-engage-supplemental-content
- Review and publish: https://learn.microsoft.com/partner-center/marketplace-offers/dynamics-365-review-publish
- Create Marketplace account: https://learn.microsoft.com/partner-center/account-settings/create-account
- Verification process: https://learn.microsoft.com/partner-center/enroll/verification-responses
- Payout and tax: https://learn.microsoft.com/partner-center/account-settings/set-up-your-payout-account
- Transact capabilities and 3% fee: https://learn.microsoft.com/partner-center/marketplace-offers/marketplace-commercial-transaction-capabilities-and-considerations
- Marketplace FAQ: https://learn.microsoft.com/partner-center/marketplace-offers/marketplace-faq-publisher-guide
- ISV app licence management: https://learn.microsoft.com/partner-center/marketplace-offers/isv-app-license
- Add licence info to solution: https://learn.microsoft.com/power-platform/developer/marketplace/appendix-add-license-information-to-your-solution
- Publish your app (steps 1-4): https://learn.microsoft.com/power-apps/developer/data-platform/publish-app-appsource
- Create managed solution: https://learn.microsoft.com/power-platform/developer/marketplace/create-solution-app
- Create Marketplace package: https://learn.microsoft.com/power-apps/developer/data-platform/create-package-app-appsource
- Store package in Azure: https://learn.microsoft.com/power-apps/developer/data-platform/store-appsource-package-azure-storage
- App certification checklist: https://learn.microsoft.com/power-platform/developer/marketplace/appendix-app-certification-checklist
- Certification policies (100 General, 1420): https://learn.microsoft.com/legal/marketplace/certification-policies
- Code apps overview (licensing, limitations): https://learn.microsoft.com/power-apps/developer/code-apps/overview
- Publisher verification (Entra): https://learn.microsoft.com/entra/identity-platform/publisher-verification-overview
