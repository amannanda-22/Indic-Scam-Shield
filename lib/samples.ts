export interface Sample {
  id: string;
  label: string;
  lang: string;
  text: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "digital-arrest",
    label: "Digital arrest call",
    lang: "Hinglish",
    text: "Main CBI se bol raha hu. Aapke naam ka parcel pakda gaya hai jisme illegal saaman mila. Aap digital arrest mein hain, video call mat kaatna aur kisi ko mat batana. Case khatam karne ke liye Rs 49,999 bhejiye.",
  },
  {
    id: "kyc-link",
    label: "KYC block link",
    lang: "English",
    text: "SBI ALERT: PAN not updated. Your account will be suspended in 24 hrs. Click http://sbi-kyc-verify.top/login and enter card details & OTP to avoid closure.",
  },
  {
    id: "upi-hindi",
    label: "UPI refund trick",
    lang: "Hindi",
    text: "आपके ऑर्डर का Rs 4,999 रिफंड पेंडिंग है। पैसे पाने के लिए यह QR स्कैन करें या UPI PIN डालें: bharatpay-refund.live",
  },
  {
    id: "task-telugu",
    label: "Task job",
    lang: "Telugu (roman)",
    text: "Part-time online job kosam hiring! YouTube videos like chesi roju Rs 5,000 sampadinchandi. Experience avasaram ledu. Mana Telegram group t.me/earn_daily_vip join avvandi.",
  },
  {
    id: "loan-threat",
    label: "Loan-app blackmail",
    lang: "Hinglish",
    text: "Turant paisa wapas karo warna aapki photo aur loan details aapke saare contacts ko bhej denge. Pending: Rs 7,500.",
  },
  {
    id: "telugu-script",
    label: "Fake KYC",
    lang: "Telugu",
    text: "ప్రియమైన కస్టమర్, KYC పెండింగ్‌లో ఉన్నందున మీ SBI ఖాతా ఈ రోజు బ్లాక్ అవుతుంది. వెంటనే అప్‌డేట్ చేయండి: sbi-kyc-verify.top/login",
  },
  {
    id: "genuine-otp",
    label: "Genuine bank OTP",
    lang: "English",
    text: "482913 is your OTP for HDFC Bank NetBanking login. Valid for 10 minutes. Do not share this OTP with anyone. Bank never asks for OTP.",
  },
  {
    id: "delivery",
    label: "Real delivery update",
    lang: "Hinglish",
    text: "Aapka Amazon order #882013 aaj delivery ke liye nikla hai. Track karein: https://www.amazon.in/track",
  },
];
