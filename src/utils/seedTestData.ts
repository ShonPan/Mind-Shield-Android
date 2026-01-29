import {insertCallRecord, flagNumber} from '../database/callRecordRepository';
import type {CallRecord} from '../types/CallRecord';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function minutesAgo(minutes: number): string {
  const date = new Date(Date.now() - minutes * 60 * 1000);
  return date.toISOString();
}

type CallTemplate = Omit<CallRecord, 'id' | 'detected_at' | 'created_at' | 'updated_at'>;

const scamTemplates: CallTemplate[] = [
  {
    file_path: '/storage/emulated/0/Recordings/Call/scam_irs_call.m4a',
    file_name: 'scam_irs_call.m4a',
    phone_number: '+1-202-555-0147',
    duration_sec: 245,
    transcript:
      "Hello, this is Officer Michael Johnson from the Internal Revenue Service. We have detected suspicious activity on your tax account and there is a warrant issued for your arrest. You owe $4,500 in back taxes and penalties. If you do not pay immediately using gift cards, federal agents will arrive at your home within the hour. This is your final warning. Press 1 to speak with our collections department and avoid arrest. Do not hang up or you will be arrested. We need your social security number to verify your identity.",
    transcription_status: 'completed',
    risk_score: 95,
    risk_level: 'red',
    scam_categories: ['Government Impersonation', 'Tax Scam'],
    scam_tactics: ['Urgency and threats', 'Demanding gift card payment', 'Requesting SSN', 'Fake arrest warrant'],
    analysis_summary:
      'High-confidence scam call. Caller impersonates IRS agent and uses classic tactics: threatening arrest, demanding immediate gift card payment, and requesting sensitive personal information. The IRS never calls demanding immediate payment or threatens arrest.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/tech_support_scam.m4a',
    file_name: 'tech_support_scam.m4a',
    phone_number: '+1-888-555-0199',
    duration_sec: 312,
    transcript:
      "Hello, this is Windows Technical Support. We have received alerts that your computer has been infected with a dangerous virus and hackers are stealing your banking information right now. Do not turn off your computer. I need you to go to your computer and press the Windows key and R at the same time. Now type in the following website address so I can remotely connect and fix your computer. We will need your credit card to pay for the $299 security software license. This virus is very serious and if we don't act now, all your files and bank accounts will be compromised.",
    transcription_status: 'completed',
    risk_score: 92,
    risk_level: 'red',
    scam_categories: ['Tech Support Scam', 'Remote Access Fraud'],
    scam_tactics: ['Creating panic about viruses', 'Requesting remote access', 'Unsolicited call claiming issues', 'Demanding payment for fake services'],
    analysis_summary:
      'Classic tech support scam. Caller falsely claims to be from Microsoft/Windows and creates urgency about fake virus infection. Attempts to gain remote access to computer and charge for unnecessary services. Microsoft never makes unsolicited support calls.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/social_security_scam.m4a',
    file_name: 'social_security_scam.m4a',
    phone_number: '+1-800-555-0172',
    duration_sec: 198,
    transcript:
      "This is an urgent call from the Social Security Administration. Your Social Security number has been suspended due to suspicious activity linked to criminal behavior. If you do not respond immediately, your accounts will be frozen and a warrant will be issued for your arrest. Press 1 now to speak with a federal agent who can help resolve this matter before law enforcement is dispatched to your location.",
    transcription_status: 'completed',
    risk_score: 94,
    risk_level: 'red',
    scam_categories: ['Government Impersonation', 'Identity Theft'],
    scam_tactics: ['Threatening account suspension', 'Fake arrest warrant', 'Urgency and threats', 'Impersonating federal agency'],
    analysis_summary:
      'Government impersonation scam. The Social Security Administration never calls to threaten arrest or suspend your number. This is a well-known fraud pattern designed to steal personal information.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/bank_fraud_scam.m4a',
    file_name: 'bank_fraud_scam.m4a',
    phone_number: '+1-877-555-0234',
    duration_sec: 276,
    transcript:
      "Hello, this is the fraud department at your bank. We've detected unauthorized transactions on your account totaling $2,300. To secure your account, I need to verify your identity. Can you please confirm your full account number, the last four digits of your social security number, and your online banking password? We also need to transfer your funds to a secure temporary account to protect them while we investigate.",
    transcription_status: 'completed',
    risk_score: 91,
    risk_level: 'red',
    scam_categories: ['Bank Fraud', 'Identity Theft'],
    scam_tactics: ['Requesting banking credentials', 'Fake fraud alert', 'Urgency about unauthorized transactions', 'Requesting fund transfer'],
    analysis_summary:
      'Bank impersonation scam. Legitimate banks never ask for your password or full account number over the phone, and never request you to transfer money to a "secure account."',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/lottery_scam.m4a',
    file_name: 'lottery_scam.m4a',
    phone_number: '+1-876-555-0311',
    duration_sec: 203,
    transcript:
      "Congratulations! You have been selected as the grand prize winner of the International Lottery Program. You have won $1.5 million dollars! To claim your prize, you will need to pay a processing fee of $500 via wire transfer or gift cards. We also need your bank account information to deposit the winnings directly. Please act quickly as this offer expires in 24 hours and the prize will be given to another winner.",
    transcription_status: 'completed',
    risk_score: 89,
    risk_level: 'red',
    scam_categories: ['Lottery Scam', 'Advance Fee Fraud'],
    scam_tactics: ['Fake prize notification', 'Requiring upfront payment', 'Requesting bank details', 'Artificial deadline'],
    analysis_summary:
      'Lottery scam. You cannot win a lottery you did not enter. Legitimate lotteries never require upfront fees to claim prizes and never request bank account information over the phone.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/medicare_scam.m4a',
    file_name: 'medicare_scam.m4a',
    phone_number: '+1-833-555-0188',
    duration_sec: 167,
    transcript:
      "Hello, I'm calling from Medicare. We're issuing new Medicare cards to all beneficiaries and we need to verify your information. Can you please provide your Medicare number and date of birth so we can send your new card? There's also a new benefit you qualify for that provides a free back brace and knee brace. We just need your doctor's information and we'll take care of the rest.",
    transcription_status: 'completed',
    risk_score: 87,
    risk_level: 'red',
    scam_categories: ['Medicare Scam', 'Health Insurance Fraud'],
    scam_tactics: ['Impersonating Medicare', 'Requesting Medicare number', 'Offering fake free benefits', 'Identity verification pretext'],
    analysis_summary:
      'Medicare impersonation scam. Medicare does not call to ask for your number or offer unsolicited medical equipment. This is a common tactic to steal Medicare numbers for fraudulent billing.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/utility_shutoff_scam.m4a',
    file_name: 'utility_shutoff_scam.m4a',
    phone_number: '+1-555-555-0276',
    duration_sec: 134,
    transcript:
      "This is an urgent notice from your electric utility company. Your account is severely past due and your power will be disconnected within the next 30 minutes unless you make a payment right now. You must pay using a prepaid debit card or gift card. Call our payment hotline immediately to avoid disconnection. This is your final warning.",
    transcription_status: 'completed',
    risk_score: 86,
    risk_level: 'red',
    scam_categories: ['Utility Scam', 'Payment Fraud'],
    scam_tactics: ['Threatening service disconnection', 'Extreme urgency', 'Demanding gift card payment', 'Impersonating utility company'],
    analysis_summary:
      'Utility shutoff scam. Real utility companies provide written notice before disconnection and never demand payment via gift cards or prepaid debit cards.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/car_warranty_scam.m4a',
    file_name: 'car_warranty_scam.m4a',
    phone_number: '+1-844-555-0399',
    duration_sec: 155,
    transcript:
      "We've been trying to reach you about your car's extended warranty. This is your final notice. Your vehicle's factory warranty has expired and you are no longer covered for major repairs. We can offer you an extended warranty plan starting at just $99 per month. This offer expires today. Press 1 now to speak with a representative before it's too late. Don't get stuck with a $5,000 repair bill.",
    transcription_status: 'completed',
    risk_score: 82,
    risk_level: 'red',
    scam_categories: ['Auto Warranty Scam', 'Robocall Fraud'],
    scam_tactics: ['Fake warranty expiration', 'Artificial urgency', 'Unsolicited robocall', 'Fear of expensive repairs'],
    analysis_summary:
      'Auto warranty robocall scam. These unsolicited calls are not from your car manufacturer or dealer. They use high-pressure tactics to sell overpriced or worthless warranty plans.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/student_loan_scam.m4a',
    file_name: 'student_loan_scam.m4a',
    phone_number: '+1-866-555-0422',
    duration_sec: 221,
    transcript:
      "This is a call regarding your federal student loans. Due to a new government program, you may qualify for immediate loan forgiveness. We can eliminate up to 100% of your student debt. To see if you qualify, we need your Federal Student Aid ID and social security number. There is a one-time processing fee of $995 which will be refunded if you don't qualify. This program has limited enrollment and spots are filling up fast.",
    transcription_status: 'completed',
    risk_score: 88,
    risk_level: 'red',
    scam_categories: ['Student Loan Scam', 'Advance Fee Fraud'],
    scam_tactics: ['Fake government program', 'Requesting SSN', 'Upfront fee for free service', 'Artificial scarcity'],
    analysis_summary:
      'Student loan forgiveness scam. Legitimate federal loan forgiveness programs are free to apply for through studentaid.gov. No legitimate servicer will ask for upfront fees or your FSA ID over the phone.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/grandparent_scam.m4a',
    file_name: 'grandparent_scam.m4a',
    phone_number: '+1-347-555-0513',
    duration_sec: 189,
    transcript:
      "Grandma? It's me, your grandson. I'm in trouble. I was in a car accident and I got arrested. Please don't tell Mom and Dad. I need you to send $3,000 through Western Union to my lawyer right away so I can get out of jail. I'm so scared. My lawyer says if you don't send the money by this afternoon, I'll have to stay in jail all weekend. Please help me. I'll pay you back, I promise.",
    transcription_status: 'completed',
    risk_score: 90,
    risk_level: 'red',
    scam_categories: ['Grandparent Scam', 'Impersonation Fraud'],
    scam_tactics: ['Impersonating family member', 'Emotional manipulation', 'Requesting wire transfer', 'Secrecy from other family'],
    analysis_summary:
      'Grandparent scam. The caller impersonates a grandchild in distress to extract money via wire transfer. Always verify by calling the family member directly at their known number before sending any money.',
    user_dismissed: false,
  },
];

const normalTemplates: CallTemplate[] = [
  {
    file_path: '/storage/emulated/0/Recordings/Call/doctors_office.m4a',
    file_name: 'doctors_office.m4a',
    phone_number: '+1-415-555-0123',
    duration_sec: 87,
    transcript:
      "Hi, this is Sarah calling from Dr. Martinez's office. I'm calling to confirm your appointment scheduled for Thursday at 2:30 PM. Please remember to bring your insurance card and arrive 15 minutes early to fill out any paperwork. If you need to reschedule, please give us a call back at the office. Thank you, and we'll see you Thursday!",
    transcription_status: 'completed',
    risk_score: 5,
    risk_level: 'green',
    scam_categories: null,
    scam_tactics: null,
    analysis_summary:
      'Legitimate appointment reminder call from a medical office. No suspicious requests, no urgency tactics, no requests for payment or personal information over the phone.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/mom_call.m4a',
    file_name: 'mom_call.m4a',
    phone_number: '+1-510-555-0456',
    duration_sec: 423,
    transcript:
      "Hey honey, it's Mom. Just wanted to check in and see how you're doing. Dad and I were thinking about coming to visit next month if that works for you. Also, did you get the photos I sent from Aunt Linda's birthday party? The cake was amazing. Oh, and remember to call your grandmother this week, she's been asking about you. Let me know about the visit dates when you get a chance. Love you, bye!",
    transcription_status: 'completed',
    risk_score: 2,
    risk_level: 'green',
    scam_categories: null,
    scam_tactics: null,
    analysis_summary:
      'Personal call from family member. Casual conversation about family matters and plans. No indicators of fraudulent activity.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/work_colleague.m4a',
    file_name: 'work_colleague.m4a',
    phone_number: '+1-650-555-0789',
    duration_sec: 156,
    transcript:
      "Hey, it's James from the office. Just wanted to give you a heads up — the meeting tomorrow got moved to 10 AM instead of 2 PM. Also, did you finish the quarterly report? Sarah was asking about it. No rush, just let me know if you need help with anything. See you tomorrow!",
    transcription_status: 'completed',
    risk_score: 3,
    risk_level: 'green',
    scam_categories: null,
    scam_tactics: null,
    analysis_summary:
      'Routine call from a work colleague about scheduling and work tasks. No suspicious indicators.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/dentist_appointment.m4a',
    file_name: 'dentist_appointment.m4a',
    phone_number: '+1-408-555-0234',
    duration_sec: 62,
    transcript:
      "Hi, this is Bright Smiles Dental calling to remind you about your cleaning appointment this Friday at 9 AM with Dr. Chen. If you need to reschedule, please call us back at 408-555-0234. We look forward to seeing you!",
    transcription_status: 'completed',
    risk_score: 4,
    risk_level: 'green',
    scam_categories: null,
    scam_tactics: null,
    analysis_summary:
      'Routine dental appointment reminder. Legitimate business call with no requests for personal information or payment.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/school_call.m4a',
    file_name: 'school_call.m4a',
    phone_number: '+1-925-555-0567',
    duration_sec: 134,
    transcript:
      "Hello, this is Principal Adams from Lincoln Elementary. I'm calling to let you know that school will be closed tomorrow due to a scheduled teacher training day. Regular classes will resume on Wednesday. Also, don't forget that parent-teacher conferences are next week. You can sign up on the school website. Have a great day!",
    transcription_status: 'completed',
    risk_score: 3,
    risk_level: 'green',
    scam_categories: null,
    scam_tactics: null,
    analysis_summary:
      'Legitimate school notification about schedule changes and upcoming events. No suspicious content.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/pharmacy_refill.m4a',
    file_name: 'pharmacy_refill.m4a',
    phone_number: '+1-415-555-0890',
    duration_sec: 48,
    transcript:
      "This is an automated message from Walgreens Pharmacy. Your prescription is ready for pickup. If you have any questions, please call your local pharmacy. Thank you.",
    transcription_status: 'completed',
    risk_score: 4,
    risk_level: 'green',
    scam_categories: null,
    scam_tactics: null,
    analysis_summary:
      'Automated pharmacy notification about a prescription refill. Standard, legitimate communication.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/friend_call.m4a',
    file_name: 'friend_call.m4a',
    phone_number: '+1-628-555-0345',
    duration_sec: 287,
    transcript:
      "Hey! Are you free this Saturday? A bunch of us are going hiking at Point Reyes. We're planning to leave around 8 AM. Bring sunscreen and water, the trail is about 6 miles round trip. Also, Mike said he can drive so we can carpool. Let me know if you're in!",
    transcription_status: 'completed',
    risk_score: 2,
    risk_level: 'green',
    scam_categories: null,
    scam_tactics: null,
    analysis_summary:
      'Casual call from a friend making weekend plans. No suspicious indicators whatsoever.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/restaurant_reservation.m4a',
    file_name: 'restaurant_reservation.m4a',
    phone_number: '+1-415-555-0678',
    duration_sec: 73,
    transcript:
      "Hi, this is Marco from Bella Italia restaurant. I'm calling to confirm your reservation for this Saturday at 7 PM, party of four. We have you at a window table as requested. If anything changes, just give us a call. See you Saturday!",
    transcription_status: 'completed',
    risk_score: 3,
    risk_level: 'green',
    scam_categories: null,
    scam_tactics: null,
    analysis_summary:
      'Restaurant reservation confirmation. Standard business communication with no suspicious elements.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/mechanic_call.m4a',
    file_name: 'mechanic_call.m4a',
    phone_number: '+1-510-555-0912',
    duration_sec: 118,
    transcript:
      "Hi, this is Tom from Bay Area Auto. Your car is ready for pickup. We replaced the brake pads and did the oil change. The total comes to $285. We're open until 6 PM today and 5 PM on Saturday. You can pay when you pick it up. Give us a call if you have any questions.",
    transcription_status: 'completed',
    risk_score: 5,
    risk_level: 'green',
    scam_categories: null,
    scam_tactics: null,
    analysis_summary:
      'Legitimate call from an auto mechanic about completed car service. Payment discussed in normal business context with no pressure tactics.',
    user_dismissed: false,
  },
  {
    file_path: '/storage/emulated/0/Recordings/Call/neighbor_call.m4a',
    file_name: 'neighbor_call.m4a',
    phone_number: '+1-415-555-0111',
    duration_sec: 95,
    transcript:
      "Hey, it's Dave from next door. I think your sprinklers went off at like 2 AM last night, just wanted to let you know in case it's a timer issue. Also, we're having a barbecue this Sunday if you and the family want to come over. Nothing fancy, just burgers and hot dogs. Let me know!",
    transcription_status: 'completed',
    risk_score: 1,
    risk_level: 'green',
    scam_categories: null,
    scam_tactics: null,
    analysis_summary:
      'Friendly call from a neighbor about a household matter and social invitation. No suspicious content.',
    user_dismissed: false,
  },
];

// Track which templates have been used in this session
const usedScamIndices = new Set<number>();
const usedNormalIndices = new Set<number>();

export async function seedOneScamCall(): Promise<CallRecord | null> {
  // Find unused templates
  const available = scamTemplates
    .map((_, i) => i)
    .filter(i => !usedScamIndices.has(i));

  if (available.length === 0) {
    return null;
  }

  const idx = available[Math.floor(Math.random() * available.length)];
  usedScamIndices.add(idx);

  const template = scamTemplates[idx];
  const record = {
    ...template,
    id: generateId(),
    detected_at: minutesAgo(Math.floor(Math.random() * 30) + 1),
  };

  await insertCallRecord(record);

  if (
    template.risk_level === 'red' &&
    template.phone_number &&
    template.risk_score &&
    template.scam_categories
  ) {
    await flagNumber(
      template.phone_number,
      template.risk_score,
      template.scam_categories,
    );
  }

  return record as CallRecord;
}

export async function seedOneNormalCall(): Promise<CallRecord | null> {
  const available = normalTemplates
    .map((_, i) => i)
    .filter(i => !usedNormalIndices.has(i));

  if (available.length === 0) {
    return null;
  }

  const idx = available[Math.floor(Math.random() * available.length)];
  usedNormalIndices.add(idx);

  const template = normalTemplates[idx];
  const record = {
    ...template,
    id: generateId(),
    detected_at: minutesAgo(Math.floor(Math.random() * 30) + 1),
  };

  await insertCallRecord(record);

  return record as CallRecord;
}
