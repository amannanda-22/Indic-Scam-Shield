export type UiLang = "en" | "hi" | "te";

type L3 = Record<UiLang, string>;

export const TYPE_LABEL: Record<string, L3> = {
  digital_arrest: { en: "Digital-arrest / fake officer call", hi: "डिजिटल अरेस्ट / फर्जी अधिकारी", te: "డిజిటల్ అరెస్ట్ / నకిలీ అధికారి" },
  kyc_block: { en: "KYC / account-block phishing", hi: "KYC / खाता बंद फिशिंग", te: "KYC / ఖాతా బ్లాక్ ఫిషింగ్" },
  upi_refund: { en: "UPI refund / collect-request trick", hi: "UPI रिफंड / कलेक्ट रिक्वेस्ट ठगी", te: "UPI రీఫండ్ / కలెక్ట్ రిక్వెస్ట్ మోసం" },
  lottery_prize: { en: "Lottery / prize advance-fee scam", hi: "लॉटरी / इनाम फीस ठगी", te: "లాటరీ / బహుమతి ఫీజు మోసం" },
  job_task: { en: "Fake part-time / task job", hi: "फर्जी पार्ट-टाइम / टास्क जॉब", te: "నకిలీ పార్ట్-టైమ్ / టాస్క్ జాబ్" },
  loan_app: { en: "Predatory loan app / blackmail", hi: "लोन ऐप / ब्लैकमेल", te: "లోన్ యాప్ / బ్లాక్‌మెయిల్" },
  utility_disconnect: { en: "Utility disconnection scare", hi: "बिजली/गैस कनेक्शन कटने की धमकी", te: "కరెంట్/గ్యాస్ కట్ బెదిరింపు" },
  parcel_customs: { en: "Parcel / customs fee scam", hi: "पार्सल / कस्टम फीस ठगी", te: "పార్సెల్ / కస్టమ్స్ ఫీజు మోసం" },
  investment_fraud: { en: "Fake investment / trading group", hi: "फर्जी निवेश / ट्रेडिंग ग्रुप", te: "నకిలీ పెట్టుబడి / ట్రేడింగ్ గ్రూప్" },
  remote_access: { en: "Remote-access (AnyDesk) takeover", hi: "रिमोट एक्सेस (AnyDesk) ठगी", te: "రిమోట్ యాక్సెస్ (AnyDesk) మోసం" },
  other: { en: "General phishing / social engineering", hi: "सामान्य फिशिंग / ठगी", te: "సాధారణ ఫిషింగ్ / మోసం" },
};

export const VERDICT_LABEL: Record<"safe" | "suspicious" | "scam", L3> = {
  safe: { en: "Looks safe", hi: "सुरक्षित लगता है", te: "సురక్షితంగా కనిపిస్తోంది" },
  suspicious: { en: "Suspicious - be careful", hi: "संदिग्ध - सावधान रहें", te: "అనుమానాస్పదం - జాగ్రత్త" },
  scam: { en: "Likely SCAM", hi: "संभावित ठगी (SCAM)", te: "మోసం అయ్యే అవకాశం (SCAM)" },
};

export const ACTIONS: Record<string, L3[]> = {
  _scam: [
    { en: "Do not reply, click any link, install any app or send money.", hi: "जवाब न दें, किसी लिंक पर क्लिक न करें, ऐप इंस्टॉल न करें, पैसे न भेजें।", te: "స్పందించకండి, లింక్‌లు క్లిక్ చేయకండి, యాప్ ఇన్‌స్టాల్ చేయకండి, డబ్బు పంపకండి." },
    { en: "Never share OTP, UPI PIN, CVV or card details with anyone.", hi: "OTP, UPI PIN, CVV या कार्ड डिटेल किसी को न बताएं।", te: "OTP, UPI PIN, CVV లేదా కార్డ్ వివరాలు ఎవరికీ చెప్పకండి." },
    { en: "If money is already lost, call 1930 immediately and file on cybercrime.gov.in.", hi: "अगर पैसे जा चुके हैं तो तुरंत 1930 पर कॉल करें और cybercrime.gov.in पर शिकायत करें।", te: "డబ్బు పోయి ఉంటే వెంటనే 1930 కి కాల్ చేసి cybercrime.gov.in లో ఫిర్యాదు చేయండి." },
    { en: "Block the sender and report the number on Sanchar Saathi (Chakshu).", hi: "भेजने वाले को ब्लॉक करें और संचार साथी (चक्षु) पर नंबर रिपोर्ट करें।", te: "పంపినవారిని బ్లాక్ చేసి సంచార్ సాథీ (చక్షు) లో నంబర్ రిపోర్ట్ చేయండి." },
  ],
  digital_arrest: [
    { en: "Hang up. No agency arrests anyone over a video call or asks you to stay on camera.", hi: "कॉल काट दें। कोई एजेंसी वीडियो कॉल पर गिरफ्तार नहीं करती।", te: "కాల్ కట్ చేయండి. వీడియో కాల్‌లో ఏ సంస్థా అరెస్ట్ చేయదు." },
    { en: "Tell a family member now - secrecy is the scammer's main weapon.", hi: "तुरंत परिवार में किसी को बताएं - गोपनीयता ठगों का हथियार है।", te: "వెంటనే కుటుంబ సభ్యులకు చెప్పండి - రహస్యం మోసగాళ్ల ఆయుధం." },
  ],
  kyc_block: [
    { en: "Open your bank's official app yourself, or call the number printed on your card.", hi: "बैंक का आधिकारिक ऐप खुद खोलें या कार्ड पर छपे नंबर पर कॉल करें।", te: "బ్యాంక్ అధికారిక యాప్‌ను మీరే తెరవండి లేదా కార్డ్‌పై ఉన్న నంబర్‌కు కాల్ చేయండి." },
  ],
  upi_refund: [
    { en: "Decline the collect request. You never need a PIN to receive money.", hi: "कलेक्ट रिक्वेस्ट डिक्लाइन करें। पैसे पाने के लिए PIN कभी नहीं चाहिए।", te: "కలెక్ట్ రిక్వెస్ట్‌ను తిరస్కరించండి. డబ్బు పొందడానికి PIN అవసరం లేదు." },
  ],
  lottery_prize: [
    { en: "Real prizes never ask for a fee first - do not pay anything.", hi: "असली इनाम के लिए पहले फीस नहीं मांगी जाती - कुछ न भरें।", te: "నిజమైన బహుమతికి ముందు ఫీజు అడగరు - ఏమీ చెల్లించకండి." },
  ],
  job_task: [
    { en: "Do not deposit money to 'unlock' tasks. Verify the employer on its official careers page.", hi: "टास्क 'अनलॉक' करने के लिए पैसे जमा न करें। कंपनी की आधिकारिक वेबसाइट पर जांचें।", te: "టాస్క్‌లు 'అన్‌లాక్' చేయడానికి డబ్బు జమ చేయకండి. సంస్థను అధికారిక వెబ్‌సైట్‌లో ధృవీకరించండి." },
  ],
  loan_app: [
    { en: "Do not grant contacts/gallery access. Borrow only from RBI-regulated lenders.", hi: "कॉन्टैक्ट/गैलरी एक्सेस न दें। केवल RBI-नियंत्रित संस्थाओं से लोन लें।", te: "కాంటాక్ట్స్/గ్యాలరీ యాక్సెస్ ఇవ్వకండి. RBI నియంత్రిత సంస్థల నుండి మాత్రమే రుణం తీసుకోండి." },
  ],
  remote_access: [
    { en: "Uninstall the remote-control app, then call your bank from another phone.", hi: "रिमोट ऐप अनइंस्टॉल करें, फिर दूसरे फोन से बैंक को कॉल करें।", te: "రిమోట్ యాప్‌ను అన్‌ఇన్‌స్టాల్ చేసి మరో ఫోన్ నుండి బ్యాంక్‌కు కాల్ చేయండి." },
  ],
  _suspicious: [
    { en: "Do not act on this message yet. Verify through the company's official app, website or helpline.", hi: "अभी इस संदेश पर कार्रवाई न करें। कंपनी के आधिकारिक ऐप/वेबसाइट/हेल्पलाइन से जांचें।", te: "ఈ సందేశంపై ఇంకా చర్య తీసుకోకండి. సంస్థ అధికారిక యాప్/వెబ్‌సైట్/హెల్ప్‌లైన్‌లో ధృవీకరించండి." },
    { en: "Never share OTP, PIN or CVV.", hi: "OTP, PIN या CVV किसी को न बताएं।", te: "OTP, PIN, CVV ఎవరికీ చెప్పకండి." },
  ],
  _safe: [
    { en: "No strong scam indicators found. Still, never share OTP/PIN and open links only from official apps.", hi: "कोई मजबूत ठगी संकेत नहीं मिला। फिर भी OTP/PIN साझा न करें और लिंक केवल आधिकारिक ऐप से खोलें।", te: "బలమైన మోసపు సూచనలు కనిపించలేదు. అయినా OTP/PIN చెప్పకండి, లింక్‌లు అధికారిక యాప్ నుండి మాత్రమే తెరవండి." },
  ],
};

export const UI: Record<string, L3> = {
  headline_scam: { en: "Do not trust this message.", hi: "इस संदेश पर भरोसा न करें।", te: "ఈ సందేశాన్ని నమ్మకండి." },
  headline_suspicious: { en: "Verify before you act.", hi: "कार्रवाई से पहले जांचें।", te: "చర్య తీసుకునే ముందు ధృవీకరించండి." },
  headline_safe: { en: "Nothing alarming found.", hi: "कुछ चिंताजनक नहीं मिला।", te: "ఆందోళనకరమైనది ఏమీ కనపడలేదు." },
  because: { en: "Why", hi: "कारण", te: "కారణం" },
};
