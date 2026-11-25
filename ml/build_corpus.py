"""
Builds the labelled Indic scam corpus used by Indic Scam Shield.

HONESTY NOTE (also shown on the /benchmark page):
  * The training corpus is TEMPLATE-GENERATED: ~160 hand-written message templates
    (English, Hinglish, Hindi, Telugu-roman, Telugu script) x random slot filling
    (banks, amounts, links, phone numbers). It is NOT scraped real-world scam data.
  * To avoid inflated scores, evaluation splits by TEMPLATE (a test template never
    appears in training), and a separate 64-message HAND-WRITTEN holdout
    (data/handwritten_holdout.json) is never trained on.
  * Telugu and Hindi strings were written by a non-native speaker (an AI model) and
    should be reviewed by a native speaker before being treated as ground truth.
"""
import json
import random
import zlib
from pathlib import Path

random.seed(2026)
OUT = Path(__file__).parent / "data"
OUT.mkdir(exist_ok=True)

BANKS = ["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Canara Bank", "Union Bank", "PNB", "Bank of Baroda", "Kotak Bank"]
AGENCIES = ["CBI", "Mumbai Police Cyber Cell", "Customs Department", "Enforcement Directorate", "TRAI", "Narcotics Control Bureau"]
UTILS = ["TSSPDCL", "APEPDCL", "BESCOM", "MSEDCL", "Indane Gas", "BSNL"]
NAMES = ["Ramesh", "Priya", "Suresh", "Lakshmi", "Anil", "Sneha", "Venkat", "Kiran", "Meena", "Rahul"]
AMTS = ["2,499", "4,999", "9,800", "15,000", "49,999", "25,000", "1,25,000", "7,500", "18,750", "35,000"]
APPS = ["Swiggy", "Paytm", "Zerodha", "PhonePe", "Flipkart", "IRCTC", "Ola"]
MERCHANTS = ["Amazon", "BigBasket", "Myntra", "Reliance Smart", "MakeMyTrip"]
DATES = ["12-Nov", "15-Nov", "18/11/2026", "21-Nov", "25/11/2026", "30-Nov", "02-Dec"]
SCAM_LINKS = [
    "sbi-kyc-verify.top/login", "hdfc-secure-update.xyz", "bit.ly/3xK9aPq", "tinyurl.com/kyc-upd8",
    "bharatpay-refund.live", "tsspdcl-bill.icu", "indiapost-customs.cc", "cbi-verify.online",
    "http://185.234.72.19/pay", "icici-netbank-help.site", "wa.me/918801122334", "rb.gy/h7pq2z",
    "amazon-gift-claim.top", "t.me/earn_daily_vip", "upi-refund-center.click",
]
LEGIT_LINKS = [
    "https://www.amazon.in/track", "https://www.irctc.co.in", "https://www.sbi.co.in",
    "https://www.hdfcbank.com", "https://www.uidai.gov.in", "https://www.jio.com",
]


def phone():
    return "+91 " + random.choice("6789") + "".join(random.choice("0123456789") for _ in range(9))


def fill(t):
    return t.format(
        bank=random.choice(BANKS), agency=random.choice(AGENCIES), util=random.choice(UTILS),
        name=random.choice(NAMES), amt=random.choice(AMTS), app=random.choice(APPS),
        merchant=random.choice(MERCHANTS), date=random.choice(DATES), ph=phone(),
        link=random.choice(SCAM_LINKS), legit_link=random.choice(LEGIT_LINKS),
        otp=str(random.randint(100000, 999999)), d4=str(random.randint(1000, 9999)),
        oid=str(random.randint(100000, 999999)), pnr=str(random.randint(1000000000, 9999999999)),
    )


# ---------------------------------------------------------------- SCAM TEMPLATES
SCAM = {
    "digital_arrest": {
        "en": [
            "This is {agency}. A parcel in your name with illegal items was seized. You are under digital arrest. Do not disconnect this video call and do not tell anyone. Pay Rs {amt} to clear your case.",
            "{agency} NOTICE: Your Aadhaar is linked to a money laundering case. Join the video call immediately and stay on camera. Failure will lead to an arrest warrant today.",
            "Your SIM will be blocked in 2 hours, a TRAI complaint is filed against your number {ph}. Press 1 to talk to an officer from {agency} or face legal action.",
        ],
        "hinglish": [
            "Main {agency} se bol raha hu. Aapke naam ka parcel pakda gaya hai jisme illegal saaman mila. Aap digital arrest mein hain, video call mat kaatna aur kisi ko mat batana. Case khatam karne ke liye Rs {amt} bhejiye.",
            "{agency} notice: Aapka Aadhaar money laundering case se juda hai. Turant video call join karein aur camera on rakhein warna aaj hi arrest warrant nikalega.",
            "Aapka SIM 2 ghante mein band ho jayega, aapke number {ph} par TRAI ki complaint hai. Officer se baat karne ke liye 1 dabayein varna legal action hoga.",
        ],
        "hindi": [
            "मैं {agency} से बोल रहा हूँ। आपके नाम का पार्सल पकड़ा गया है जिसमें गैरकानूनी सामान मिला है। आप डिजिटल अरेस्ट में हैं, वीडियो कॉल मत काटिए और किसी को मत बताइए। केस खत्म करने के लिए Rs {amt} भेजिए।",
            "{agency} नोटिस: आपका आधार मनी लॉन्ड्रिंग केस से जुड़ा है। तुरंत वीडियो कॉल जॉइन करें, वरना आज ही गिरफ्तारी वारंट निकलेगा।",
            "आपका सिम 2 घंटे में बंद हो जाएगा, आपके नंबर {ph} पर TRAI की शिकायत है। अधिकारी से बात करने के लिए 1 दबाएं वरना कानूनी कार्रवाई होगी।",
        ],
        "telugu_roman": [
            "Nenu {agency} nundi matladutunna. Mee peru meeda parcel lo illegal vastuvulu dorikayi. Meeru digital arrest lo unnaru, video call cut cheyyakandi, evariki cheppakandi. Case close cheyyadaniki Rs {amt} pampandi.",
            "{agency} notice: Mee Aadhaar money laundering case to link ayyindi. Ventane video call join avvandi, lekapothe ee roje arrest warrant vastundi.",
            "Mee SIM 2 gantallo block avtundi, mee number {ph} meeda TRAI complaint undi. Officer to matladataniki 1 nokkandi lekapothe legal action untundi.",
        ],
        "telugu_script": [
            "నేను {agency} నుండి మాట్లాడుతున్నాను. మీ పేరు మీద పార్సెల్‌లో అక్రమ వస్తువులు దొరికాయి. మీరు డిజిటల్ అరెస్ట్‌లో ఉన్నారు, వీడియో కాల్ కట్ చేయకండి, ఎవరికీ చెప్పకండి. కేసు మూసివేయడానికి Rs {amt} పంపండి.",
        ],
    },
    "kyc_block": {
        "en": [
            "Dear customer, your {bank} account will be blocked today as KYC is pending. Update immediately: {link}",
            "{bank} ALERT: PAN not updated. Account will be suspended in 24 hrs. Click {link} and enter card details & OTP to avoid closure.",
            "Your {bank} net banking is deactivated. Verify your KYC now at {link} or call {ph}.",
        ],
        "hinglish": [
            "Pyare grahak, aapka {bank} account aaj block ho jayega kyunki KYC pending hai. Turant update karein: {link}",
            "{bank} ALERT: PAN update nahi hua. 24 ghante mein account band ho jayega. {link} par click karke card details aur OTP daalein.",
            "Aapki {bank} net banking band ho gayi hai. Abhi KYC verify karein {link} par ya {ph} par call karein.",
        ],
        "hindi": [
            "प्रिय ग्राहक, KYC पेंडिंग होने के कारण आपका {bank} खाता आज बंद हो जाएगा। तुरंत अपडेट करें: {link}",
            "{bank} अलर्ट: PAN अपडेट नहीं हुआ। 24 घंटे में खाता बंद हो जाएगा। {link} पर क्लिक करके कार्ड डिटेल और OTP डालें।",
            "आपकी {bank} नेट बैंकिंग बंद हो गई है। अभी KYC वेरिफाई करें {link} पर या {ph} पर कॉल करें।",
        ],
        "telugu_roman": [
            "Priyamaina customer, KYC pending undi kabatti mee {bank} account ee roju block avtundi. Ventane update cheyyandi: {link}",
            "{bank} ALERT: PAN update avvaledu. 24 gantallo account close avtundi. {link} click chesi card details, OTP enter cheyyandi.",
            "Mee {bank} net banking deactivate ayyindi. Ippude KYC verify cheyyandi {link} lo leda {ph} ki call cheyyandi.",
        ],
        "telugu_script": [
            "ప్రియమైన కస్టమర్, KYC పెండింగ్‌లో ఉన్నందున మీ {bank} ఖాతా ఈ రోజు బ్లాక్ అవుతుంది. వెంటనే అప్‌డేట్ చేయండి: {link}",
        ],
    },
    "upi_refund": {
        "en": [
            "Sorry, I sent Rs {amt} to your number by mistake. Please approve the collect request on PhonePe to return it. Urgent.",
            "Refund of Rs {amt} is pending for your order. Scan this QR or enter your UPI PIN to receive the money: {link}",
            "Congratulations! Cashback of Rs {amt} credited. Open {link} and enter UPI PIN to claim.",
        ],
        "hinglish": [
            "Sorry bhai, galti se aapke number par Rs {amt} chale gaye. Wapas karne ke liye PhonePe par collect request approve kar do. Urgent hai.",
            "Aapke order ka Rs {amt} refund pending hai. Paisa lene ke liye ye QR scan karein ya UPI PIN daalein: {link}",
            "Badhai ho! Rs {amt} cashback aaya hai. {link} kholkar claim karne ke liye UPI PIN daalein.",
        ],
        "hindi": [
            "माफ़ कीजिए, गलती से आपके नंबर पर Rs {amt} चले गए। वापस करने के लिए PhonePe पर कलेक्ट रिक्वेस्ट अप्रूव कर दें। ज़रूरी है।",
            "आपके ऑर्डर का Rs {amt} रिफंड पेंडिंग है। पैसे पाने के लिए यह QR स्कैन करें या UPI PIN डालें: {link}",
            "बधाई हो! Rs {amt} कैशबैक आया है। {link} खोलकर क्लेम करने के लिए UPI PIN डालें।",
        ],
        "telugu_roman": [
            "Sorry andi, tappuga mee number ki Rs {amt} pampanu. Return cheyyadaniki PhonePe lo collect request approve cheyyandi. Urgent.",
            "Mee order refund Rs {amt} pending undi. Dabbulu pondadaniki ee QR scan cheyyandi leda UPI PIN enter cheyyandi: {link}",
            "Abhinandanalu! Rs {amt} cashback vachindi. {link} open chesi claim cheyyadaniki UPI PIN enter cheyyandi.",
        ],
        "telugu_script": [
            "క్షమించండి, పొరపాటున మీ నంబర్‌కు Rs {amt} పంపాను. తిరిగి ఇవ్వడానికి PhonePe లో కలెక్ట్ రిక్వెస్ట్ ఆమోదించండి. అత్యవసరం.",
        ],
    },
    "lottery_prize": {
        "en": [
            "Congratulations! You have won Rs {amt} in the KBC lucky draw. To claim, pay a processing fee of Rs 2,500 and send your bank details to {ph}.",
            "You are selected for a Jio anniversary prize of Rs {amt}. Click {link} to claim before midnight.",
            "Lucky winner! An iPhone 15 is yours. Pay the delivery charge today to receive it: {link}",
        ],
        "hinglish": [
            "Badhai ho! Aapne KBC lucky draw mein Rs {amt} jeeta hai. Claim karne ke liye Rs 2,500 processing fee bhejein aur bank details {ph} par bhejein.",
            "Aap Jio anniversary ke Rs {amt} inaam ke liye chune gaye hain. Aaj raat tak claim karne ke liye {link} par click karein.",
            "Lucky winner! iPhone 15 aapka hai. Pane ke liye aaj delivery charge bharein: {link}",
        ],
        "hindi": [
            "बधाई हो! आपने KBC लकी ड्रॉ में Rs {amt} जीते हैं। क्लेम करने के लिए Rs 2,500 प्रोसेसिंग फीस भेजें और बैंक डिटेल {ph} पर भेजें।",
            "आप Jio एनिवर्सरी के Rs {amt} इनाम के लिए चुने गए हैं। आज रात तक क्लेम करने के लिए {link} पर क्लिक करें।",
            "लकी विनर! iPhone 15 आपका है। पाने के लिए आज डिलीवरी चार्ज भरें: {link}",
        ],
        "telugu_roman": [
            "Abhinandanalu! Meeru KBC lucky draw lo Rs {amt} gelichaaru. Claim cheyyadaniki Rs 2,500 processing fee pampandi, bank details {ph} ki pampandi.",
            "Jio anniversary Rs {amt} bahumathi kosam meeru ennikayyaru. Ee raatri varaku claim cheyyadaniki {link} click cheyyandi.",
            "Lucky winner! iPhone 15 meede. Pondadaniki ee roju delivery charge kattandi: {link}",
        ],
        "telugu_script": [
            "అభినందనలు! మీరు KBC లక్కీ డ్రాలో Rs {amt} గెలుచుకున్నారు. క్లెయిమ్ చేయడానికి Rs 2,500 ప్రాసెసింగ్ ఫీజు పంపండి.",
        ],
    },
    "job_task": {
        "en": [
            "Hiring for part-time online job! Earn Rs {amt} daily by liking YouTube videos. No experience needed. Join our Telegram group {link} and message HR on WhatsApp {ph}.",
            "Work from home, earn Rs {amt} per day. Complete simple tasks, first payment instantly. Deposit Rs 1,000 to unlock premium tasks: {link}",
            "Amazon product review job: 5 minutes work, Rs {amt} guaranteed. Register on {link} today, limited seats.",
        ],
        "hinglish": [
            "Part-time online job ke liye hiring! YouTube videos like karke roz Rs {amt} kamayein. Koi experience nahi chahiye. Hamara Telegram group {link} join karein aur WhatsApp {ph} par HR ko message karein.",
            "Ghar baithe roz Rs {amt} kamayein. Simple tasks poore karein, pehla payment turant. Premium tasks unlock karne ke liye Rs 1,000 deposit karein: {link}",
            "Amazon product review job: 5 minute ka kaam, Rs {amt} pakka. Aaj hi {link} par register karein, seats limited hain.",
        ],
        "hindi": [
            "पार्ट-टाइम ऑनलाइन जॉब के लिए भर्ती! YouTube वीडियो लाइक करके रोज़ Rs {amt} कमाएं। अनुभव ज़रूरी नहीं। हमारा Telegram ग्रुप {link} जॉइन करें और WhatsApp {ph} पर HR को मैसेज करें।",
            "घर बैठे रोज़ Rs {amt} कमाएं। आसान टास्क पूरे करें, पहला पेमेंट तुरंत। प्रीमियम टास्क अनलॉक करने के लिए Rs 1,000 जमा करें: {link}",
            "Amazon प्रोडक्ट रिव्यू जॉब: 5 मिनट का काम, Rs {amt} पक्का। आज ही {link} पर रजिस्टर करें, सीटें सीमित हैं।",
        ],
        "telugu_roman": [
            "Part-time online job kosam hiring! YouTube videos like chesi roju Rs {amt} sampadinchandi. Experience avasaram ledu. Mana Telegram group {link} join avvandi, WhatsApp {ph} lo HR ki message cheyyandi.",
            "Intlone kurchuni roju Rs {amt} sampadinchandi. Simple tasks complete cheyyandi, first payment ventane. Premium tasks unlock cheyyadaniki Rs 1,000 deposit cheyyandi: {link}",
            "Amazon product review job: 5 nimishala pani, Rs {amt} guarantee. Ee roje {link} lo register avvandi, seats limited.",
        ],
        "telugu_script": [
            "ఇంటి నుండే పని చేసి రోజుకు Rs {amt} సంపాదించండి. సులభమైన టాస్క్‌లు పూర్తి చేయండి. ప్రీమియం టాస్క్‌ల కోసం Rs 1,000 డిపాజిట్ చేయండి: {link}",
        ],
    },
    "loan_app": {
        "en": [
            "Instant loan up to Rs {amt} without documents! Download the app {link}. Approval in 5 minutes. Pay Rs 1,500 insurance fee first.",
            "Your loan of Rs {amt} is pre-approved. Share Aadhaar, selfie and allow contacts access in {link} to receive money now.",
            "Pay back immediately or we will send your photos and loan details to all your contacts. Pending: Rs {amt}.",
        ],
        "hinglish": [
            "Bina documents ke Rs {amt} tak instant loan! App download karein {link}. 5 minute mein approval. Pehle Rs 1,500 insurance fee bharein.",
            "Aapka Rs {amt} ka loan pre-approved hai. Paisa abhi pane ke liye {link} par Aadhaar, selfie share karein aur contacts access allow karein.",
            "Turant paisa wapas karo warna aapki photo aur loan details aapke saare contacts ko bhej denge. Pending: Rs {amt}.",
        ],
        "hindi": [
            "बिना डॉक्यूमेंट Rs {amt} तक इंस्टेंट लोन! ऐप डाउनलोड करें {link}। 5 मिनट में अप्रूवल। पहले Rs 1,500 इंश्योरेंस फीस भरें।",
            "आपका Rs {amt} का लोन प्री-अप्रूव्ड है। पैसा अभी पाने के लिए {link} पर आधार, सेल्फी शेयर करें और कॉन्टैक्ट्स एक्सेस दें।",
            "तुरंत पैसे वापस करो वरना आपकी फोटो और लोन डिटेल आपके सभी कॉन्टैक्ट्स को भेज देंगे। बकाया: Rs {amt}.",
        ],
        "telugu_roman": [
            "Documents lekunda Rs {amt} varaku instant loan! App download cheyyandi {link}. 5 nimishallo approval. Mundu Rs 1,500 insurance fee kattandi.",
            "Mee Rs {amt} loan pre-approved. Dabbulu ippude pondadaniki {link} lo Aadhaar, selfie share cheyyandi, contacts access allow cheyyandi.",
            "Ventane dabbulu thirigi ivvandi lekapothe mee photo, loan details mee contacts andariki pamputhamu. Pending: Rs {amt}.",
        ],
        "telugu_script": [
            "డాక్యుమెంట్లు లేకుండా Rs {amt} వరకు ఇన్‌స్టంట్ లోన్! యాప్ డౌన్‌లోడ్ చేయండి {link}. ముందు Rs 1,500 ఇన్సూరెన్స్ ఫీజు చెల్లించండి.",
        ],
    },
    "utility_disconnect": {
        "en": [
            "Dear consumer, your electricity connection will be disconnected tonight at 9:30 PM as the previous bill is unpaid. Call {ph} immediately.",
            "{util} ALERT: Bill update pending, power supply will be cut today. Pay Rs {amt} now via {link}.",
            "Your gas connection will be blocked. Update KYC at {link} or call officer {ph}.",
        ],
        "hinglish": [
            "Pyare upbhokta, pichla bill pending hone ke karan aapka bijli connection aaj raat 9:30 baje kat diya jayega. Turant {ph} par call karein.",
            "{util} ALERT: Bill update pending hai, aaj bijli supply band hogi. Abhi {link} se Rs {amt} bharein.",
            "Aapka gas connection block ho jayega. {link} par KYC update karein ya officer {ph} ko call karein.",
        ],
        "hindi": [
            "प्रिय उपभोक्ता, पिछला बिल बकाया होने के कारण आपका बिजली कनेक्शन आज रात 9:30 बजे काट दिया जाएगा। तुरंत {ph} पर कॉल करें।",
            "{util} अलर्ट: बिल अपडेट पेंडिंग है, आज बिजली सप्लाई बंद होगी। अभी {link} से Rs {amt} भरें।",
            "आपका गैस कनेक्शन ब्लॉक हो जाएगा। {link} पर KYC अपडेट करें या अधिकारी {ph} को कॉल करें।",
        ],
        "telugu_roman": [
            "Priyamaina viniyogadarulaku, mundu bill pending undi kabatti mee current connection ee raatri 9:30 ki cut chestaru. Ventane {ph} ki call cheyyandi.",
            "{util} ALERT: Bill update pending undi, ee roju current supply aapestaru. Ippude {link} dwara Rs {amt} kattandi.",
            "Mee gas connection block avtundi. {link} lo KYC update cheyyandi leda officer {ph} ki call cheyyandi.",
        ],
        "telugu_script": [
            "ప్రియమైన వినియోగదారులకు, గత బిల్లు బకాయి ఉన్నందున మీ విద్యుత్ కనెక్షన్ ఈ రాత్రి 9:30కి కట్ చేస్తారు. వెంటనే {ph} కి కాల్ చేయండి.",
        ],
    },
    "parcel_customs": {
        "en": [
            "Your parcel is held at customs. Pay Rs {amt} clearance fee at {link} within 24 hours or it will be returned.",
            "India Post: delivery failed, address incomplete. Update address and pay Rs 25 redelivery fee: {link}",
            "FedEx: package from abroad contains restricted items. Contact {ph} to avoid a police case.",
        ],
        "hinglish": [
            "Aapka parcel customs mein ruka hai. 24 ghante mein {link} par Rs {amt} clearance fee bharein warna wapas bhej diya jayega.",
            "India Post: delivery fail ho gayi, address adhura hai. Address update karein aur Rs 25 redelivery fee bharein: {link}",
            "FedEx: videsh se aaye package mein restricted saaman hai. Police case se bachne ke liye {ph} par sampark karein.",
        ],
        "hindi": [
            "आपका पार्सल कस्टम में रुका है। 24 घंटे में {link} पर Rs {amt} क्लियरेंस फीस भरें वरना वापस भेज दिया जाएगा।",
            "इंडिया पोस्ट: डिलीवरी फेल हो गई, पता अधूरा है। पता अपडेट करें और Rs 25 रीडिलीवरी फीस भरें: {link}",
            "FedEx: विदेश से आए पैकेज में प्रतिबंधित सामान है। पुलिस केस से बचने के लिए {ph} पर संपर्क करें।",
        ],
        "telugu_roman": [
            "Mee parcel customs lo aagipoyindi. 24 gantallo {link} lo Rs {amt} clearance fee kattandi lekapothe thirigi pamputhamu.",
            "India Post: delivery fail ayyindi, address purthiga ledu. Address update chesi Rs 25 redelivery fee kattandi: {link}",
            "FedEx: videsham nundi vachina package lo restricted vastuvulu unnayi. Police case nundi tappukodaniki {ph} ki sampradinchandi.",
        ],
        "telugu_script": [
            "మీ పార్సెల్ కస్టమ్స్‌లో ఆగిపోయింది. 24 గంటల్లో {link} లో Rs {amt} క్లియరెన్స్ ఫీజు చెల్లించండి లేకపోతే తిరిగి పంపుతాము.",
        ],
    },
}

# ---------------------------------------------------------------- LEGIT TEMPLATES
LEGIT = {
    "bank_txn_alert": {
        "en": [
            "Rs {amt} debited from A/c XX{d4} on {date}. If not done by you, call {bank} helpline 1800 1234 or visit your branch. Never share OTP.",
            "Rs {amt} credited to your A/c XX{d4} on {date} by UPI. Avl bal Rs 12,430. -{bank}",
        ],
        "hinglish": [
            "Aapke A/c XX{d4} se {date} ko Rs {amt} debit hue. Agar aapne nahi kiya to {bank} helpline 1800 1234 par call karein ya branch jayein. OTP kisi ko na batayein.",
            "Aapke A/c XX{d4} mein {date} ko UPI se Rs {amt} credit hue. Avl bal Rs 12,430. -{bank}",
        ],
        "hindi": [
            "आपके खाते XX{d4} से {date} को Rs {amt} डेबिट हुए। यदि आपने नहीं किया तो {bank} हेल्पलाइन 1800 1234 पर कॉल करें या शाखा जाएं। OTP किसी को न बताएं।",
            "आपके खाते XX{d4} में {date} को UPI से Rs {amt} जमा हुए। उपलब्ध शेष Rs 12,430। -{bank}",
        ],
        "telugu_roman": [
            "Mee A/c XX{d4} nundi {date} na Rs {amt} debit ayyayi. Meeru cheyyaka pothe {bank} helpline 1800 1234 ki call cheyyandi leda branch ki vellandi. OTP evariki cheppakandi.",
            "Mee A/c XX{d4} ki {date} na UPI dwara Rs {amt} credit ayyayi. Avl bal Rs 12,430. -{bank}",
        ],
        "telugu_script": [
            "మీ ఖాతా XX{d4} నుండి {date} న Rs {amt} డెబిట్ అయ్యాయి. మీరు చేయకపోతే {bank} హెల్ప్‌లైన్‌కు కాల్ చేయండి. OTP ఎవరికీ చెప్పకండి.",
        ],
    },
    "genuine_otp": {
        "en": [
            "{otp} is your OTP for login to {app}. Valid for 10 minutes. Do not share this OTP with anyone.",
            "Your OTP for the transaction of Rs {amt} at {merchant} is {otp}. Never share it with anyone, including bank staff.",
        ],
        "hinglish": [
            "{app} par login ke liye aapka OTP {otp} hai. 10 minute tak valid. Ye OTP kisi ko na batayein.",
            "{merchant} par Rs {amt} ke transaction ka aapka OTP {otp} hai. Ise kisi ke saath share na karein, bank staff ke saath bhi nahi.",
        ],
        "hindi": [
            "{app} में लॉगिन के लिए आपका OTP {otp} है। 10 मिनट तक मान्य। यह OTP किसी को न बताएं।",
            "{merchant} पर Rs {amt} के ट्रांज़ैक्शन के लिए आपका OTP {otp} है। इसे किसी से साझा न करें, बैंक स्टाफ से भी नहीं।",
        ],
        "telugu_roman": [
            "{app} lo login kosam mee OTP {otp}. 10 nimishalu mathrame valid. Ee OTP evariki cheppakandi.",
            "{merchant} lo Rs {amt} transaction kosam mee OTP {otp}. Dinni evariki share cheyyakandi, bank staff ki kuda.",
        ],
        "telugu_script": [
            "{app} లో లాగిన్ కోసం మీ OTP {otp}. 10 నిమిషాలు మాత్రమే చెల్లుతుంది. ఈ OTP ఎవరికీ చెప్పకండి.",
        ],
    },
    "delivery_update": {
        "en": [
            "Your Amazon order #{oid} is out for delivery today. Track: {legit_link}",
            "Your IRCTC ticket PNR {pnr} is confirmed for {date}. Have a safe journey.",
        ],
        "hinglish": [
            "Aapka Amazon order #{oid} aaj delivery ke liye nikla hai. Track karein: {legit_link}",
            "Aapka IRCTC ticket PNR {pnr} {date} ke liye confirm hai. Shubh yatra.",
        ],
        "hindi": [
            "आपका Amazon ऑर्डर #{oid} आज डिलीवरी के लिए निकला है। ट्रैक करें: {legit_link}",
            "आपका IRCTC टिकट PNR {pnr} {date} के लिए कन्फर्म है। शुभ यात्रा।",
        ],
        "telugu_roman": [
            "Mee Amazon order #{oid} ee roju delivery ki bayaluderindi. Track cheyyandi: {legit_link}",
            "Mee IRCTC ticket PNR {pnr} {date} kosam confirm ayyindi. Subha prayanam.",
        ],
        "telugu_script": [
            "మీ Amazon ఆర్డర్ #{oid} ఈ రోజు డెలివరీకి బయలుదేరింది. ట్రాక్ చేయండి: {legit_link}",
        ],
    },
    "bill_reminder": {
        "en": [
            "Reminder: your {util} bill of Rs {amt} is due on {date}. Pay on the official app or at the counter. Ignore if already paid.",
            "Your mobile recharge plan expires on {date}. Recharge from the official Jio or Airtel app to continue services.",
        ],
        "hinglish": [
            "Yaad dilana: aapka {util} bill Rs {amt} {date} ko due hai. Official app ya counter par bharein. Pehle hi bhar diya ho to ignore karein.",
            "Aapka mobile recharge plan {date} ko khatam ho raha hai. Service jaari rakhne ke liye official Jio ya Airtel app se recharge karein.",
        ],
        "hindi": [
            "याद दिलाना: आपका {util} बिल Rs {amt} {date} को देय है। आधिकारिक ऐप या काउंटर पर भरें। पहले भर दिया हो तो अनदेखा करें।",
            "आपका मोबाइल रिचार्ज प्लान {date} को समाप्त हो रहा है। सेवा जारी रखने के लिए आधिकारिक Jio या Airtel ऐप से रिचार्ज करें।",
        ],
        "telugu_roman": [
            "Gurtu chesukondi: mee {util} bill Rs {amt} {date} lo gaduvu undi. Official app lo leda counter lo kattandi. Mundu ne kattiunte pattinchukokandi.",
            "Mee mobile recharge plan {date} na mugustundi. Service konasaginchadaniki official Jio leda Airtel app nundi recharge cheyyandi.",
        ],
        "telugu_script": [
            "గుర్తు చేస్తున్నాం: మీ {util} బిల్లు Rs {amt} {date} న చెల్లించాలి. అధికారిక యాప్ లేదా కౌంటర్‌లో చెల్లించండి.",
        ],
    },
    "personal_chat": {
        "en": [
            "Hey {name}, are we still meeting for dinner at 8? I will reach by 7:45.",
            "Mom, I reached home safely. Will call you after dinner.",
        ],
        "hinglish": [
            "Arre {name}, kya hum 8 baje dinner ke liye mil rahe hain? Main 7:45 tak pahunch jaunga.",
            "Mummy, main ghar pahunch gaya. Dinner ke baad call karunga.",
        ],
        "hindi": [
            "अरे {name}, क्या हम 8 बजे डिनर के लिए मिल रहे हैं? मैं 7:45 तक पहुँच जाऊँगा।",
            "मम्मी, मैं घर पहुँच गया। डिनर के बाद फोन करूँगा।",
        ],
        "telugu_roman": [
            "Hey {name}, manam 8 ki dinner ki kaluddama? Nenu 7:45 ki chestanu.",
            "Amma, nenu intiki chesanu. Dinner tarvata call chestanu.",
        ],
        "telugu_script": [
            "హే {name}, మనం 8 గంటలకు డిన్నర్‌కి కలుద్దామా? నేను 7:45 కి చేరుకుంటాను.",
        ],
    },
    "appointment": {
        "en": [
            "Reminder: your appointment with Dr {name} is on {date} at 10:30 AM at the clinic. Reply YES to confirm.",
            "Your exam hall ticket is available on the official university website. Exam starts {date}.",
        ],
        "hinglish": [
            "Yaad dilana: Dr {name} ke saath aapka appointment {date} ko subah 10:30 baje clinic mein hai. Confirm karne ke liye YES reply karein.",
            "Aapka exam hall ticket official university website par available hai. Exam {date} se shuru hoga.",
        ],
        "hindi": [
            "याद दिलाना: Dr {name} के साथ आपका अपॉइंटमेंट {date} को सुबह 10:30 बजे क्लिनिक में है। कन्फर्म करने के लिए YES रिप्लाई करें।",
            "आपका परीक्षा हॉल टिकट आधिकारिक विश्वविद्यालय वेबसाइट पर उपलब्ध है। परीक्षा {date} से शुरू होगी।",
        ],
        "telugu_roman": [
            "Gurtu chesukondi: Dr {name} tho mee appointment {date} na udayam 10:30 ki clinic lo undi. Confirm cheyyadaniki YES reply cheyyandi.",
            "Mee exam hall ticket official university website lo available. Exam {date} nundi modalavutundi.",
        ],
        "telugu_script": [
            "గుర్తు చేస్తున్నాం: Dr {name} తో మీ అపాయింట్‌మెంట్ {date} న ఉదయం 10:30 కి క్లినిక్‌లో ఉంది. నిర్ధారించడానికి YES అని రిప్లై చేయండి.",
        ],
    },
}

# Extra legitimate-message coverage (added after the first benchmark showed the model over-flagged
# ordinary receipts, HR mails and service notices: legit data was too narrow).
LEGIT.update({
    "receipt_thanks": {
        "en": [
            "Payment of Rs {amt} received at {merchant}. Invoice has been sent to your email. Thank you.",
            "Your order from {merchant} worth Rs {amt} has been delivered. Please rate your experience in the app.",
        ],
        "hinglish": [
            "{merchant} par Rs {amt} ka payment mil gaya. Invoice aapke email par bhej diya gaya hai. Dhanyavaad.",
            "{merchant} se aapka Rs {amt} ka order deliver ho gaya hai. App mein apna experience rate karein.",
        ],
        "hindi": [
            "{merchant} पर Rs {amt} का भुगतान प्राप्त हुआ। इनवॉइस आपके ईमेल पर भेज दिया गया है। धन्यवाद।",
            "{merchant} से आपका Rs {amt} का ऑर्डर डिलीवर हो गया है। कृपया ऐप में अपना अनुभव रेट करें।",
        ],
        "telugu_roman": [
            "{merchant} lo Rs {amt} payment andindi. Invoice mee email ki pampamu. Dhanyavadalu.",
            "{merchant} nundi mee Rs {amt} order deliver ayyindi. App lo mee anubhavanni rate cheyyandi.",
        ],
    },
    "work_hr": {
        "en": [
            "Hi {name}, your interview is scheduled on {date} at 11 AM. Please carry a copy of your resume. Details are in your registered email.",
            "Team, today's standup is moved to 4 PM. Please update your tasks on the board before the meeting.",
        ],
        "hinglish": [
            "Hi {name}, aapka interview {date} ko subah 11 baje hai. Apne resume ki copy saath layein. Details aapke registered email mein hain.",
            "Team, aaj ka standup 4 baje shift ho gaya hai. Meeting se pehle board par apne tasks update kar dein.",
        ],
        "hindi": [
            "नमस्ते {name}, आपका इंटरव्यू {date} को सुबह 11 बजे है। अपने रिज्यूमे की कॉपी साथ लाएं। विवरण आपके पंजीकृत ईमेल में है।",
            "टीम, आज की स्टैंडअप मीटिंग 4 बजे कर दी गई है। मीटिंग से पहले बोर्ड पर अपने टास्क अपडेट कर दें।",
        ],
        "telugu_roman": [
            "Hi {name}, mee interview {date} na udayam 11 ki undi. Mee resume copy theesukurandi. Details mee registered email lo unnayi.",
            "Team, ee roju standup 4 ki marchamu. Meeting mundu board lo mee tasks update cheyyandi.",
        ],
    },
    "service_info": {
        "en": [
            "Train {pnr} is running 20 minutes late today. It will arrive on platform 2.",
            "Weather alert: heavy rain expected tomorrow in your city. Please carry an umbrella and avoid waterlogged roads.",
        ],
        "hinglish": [
            "Train {pnr} aaj 20 minute late chal rahi hai. Ye platform 2 par aayegi.",
            "Mausam alert: kal aapke sheher mein tez baarish ki sambhavna hai. Chhata saath rakhein aur paani bhari sadkon se bachein.",
        ],
        "hindi": [
            "ट्रेन {pnr} आज 20 मिनट की देरी से चल रही है। यह प्लेटफॉर्म 2 पर आएगी।",
            "मौसम अलर्ट: कल आपके शहर में भारी बारिश की संभावना है। छाता साथ रखें और जलभराव वाली सड़कों से बचें।",
        ],
        "telugu_roman": [
            "Train {pnr} ee roju 20 nimishalu aalasyanga nadustondi. Idi platform 2 meeda vastundi.",
            "Vatavarana hecharika: repu mee nagaram lo bhari varshalu padavachchu. Umbrella theesukelli, neellu nindina rahadarulanu thappinchandi.",
        ],
    },
    "statement_info": {
        "en": [
            "Your SIP of Rs {amt} in the mutual fund was successful. Units will be allotted at the applicable NAV.",
            "Your monthly account statement for {date} is ready. Log in to the official app to view it. We never ask for OTP or password.",
        ],
        "hinglish": [
            "Mutual fund mein aapka Rs {amt} ka SIP successful raha. Units applicable NAV par allot honge.",
            "{date} ka aapka monthly account statement ready hai. Dekhne ke liye official app mein login karein. Hum kabhi OTP ya password nahi maangte.",
        ],
        "hindi": [
            "म्यूचुअल फंड में आपका Rs {amt} का SIP सफल रहा। यूनिट्स लागू NAV पर आवंटित होंगी।",
            "{date} का आपका मासिक अकाउंट स्टेटमेंट तैयार है। देखने के लिए आधिकारिक ऐप में लॉगिन करें। हम कभी OTP या पासवर्ड नहीं मांगते।",
        ],
        "telugu_roman": [
            "Mutual fund lo mee Rs {amt} SIP vijayavanthamayyindi. Units NAV prakaram kettayistaru.",
            "{date} mee monthly account statement siddhanga undi. Chudadaniki official app lo login cheyyandi. Memu eppudu OTP leda password adagamu.",
        ],
    },
    "govt_info": {
        "en": [
            "Your Aadhaar address update request has been received. Check its status on the official uidai.gov.in portal.",
            "Your gas cylinder is booked. Delivery expected in 2 days. Share the delivery code only with the delivery person at your door.",
        ],
        "hinglish": [
            "Aapka Aadhaar address update request mil gaya hai. Status official uidai.gov.in portal par dekhein.",
            "Aapka gas cylinder book ho gaya hai. 2 din mein delivery hogi. Delivery code sirf darwaze par aaye delivery person ko batayein.",
        ],
        "hindi": [
            "आपका आधार पता अपडेट अनुरोध प्राप्त हो गया है। स्थिति आधिकारिक uidai.gov.in पोर्टल पर देखें।",
            "आपका गैस सिलेंडर बुक हो गया है। 2 दिन में डिलीवरी होगी। डिलीवरी कोड केवल दरवाजे पर आए डिलीवरी व्यक्ति को बताएं।",
        ],
        "telugu_roman": [
            "Mee Aadhaar address update request andindi. Status ni official uidai.gov.in portal lo chudandi.",
            "Mee gas cylinder book ayyindi. 2 rojullo delivery avtundi. Delivery code ni mee intiki vachina delivery person ke cheppandi.",
        ],
    },
})

VARIANTS = 14


def build():
    rows = []
    templates = []
    for label, group in (("scam", SCAM), ("legit", LEGIT)):
        for kind, langs in group.items():
            for lang, tpls in langs.items():
                for i, t in enumerate(tpls):
                    tid = f"{kind}|{lang}|{i}"
                    split = "test" if zlib.crc32(tid.encode()) % 4 == 0 else "train"
                    templates.append({"id": tid, "label": label, "type": kind, "lang": lang, "split": split})
                    seen = set()
                    tries = 0
                    while len(seen) < VARIANTS and tries < 200:
                        tries += 1
                        s = fill(t)
                        if s in seen:
                            continue
                        seen.add(s)
                        rows.append({"text": s, "label": label, "type": kind, "lang": lang,
                                     "template": tid, "split": split})
    random.shuffle(rows)
    return rows, templates


if __name__ == "__main__":
    rows, templates = build()
    (OUT / "corpus.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT / "templates.json").write_text(json.dumps(templates, ensure_ascii=False, indent=1), encoding="utf-8")
    from collections import Counter
    c = Counter((r["split"], r["label"]) for r in rows)
    print("rows:", len(rows), "templates:", len(templates))
    print("split x label:", dict(c))
    print("test templates per type:", Counter(t["type"] for t in templates if t["split"] == "test"))
