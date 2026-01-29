import {insertCallRecord, flagNumber} from '../database/callRecordRepository';
import type {CallRecord} from '../types/CallRecord';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function minutesAgo(minutes: number): string {
  const date = new Date(Date.now() - minutes * 60 * 1000);
  return date.toISOString();
}

const testRecords: Omit<CallRecord, 'created_at' | 'updated_at'>[] = [
  // SCAM CALL 1 - IRS Impersonation (High Risk)
  {
    id: generateId(),
    file_path: '/storage/emulated/0/Recordings/Call/scam_irs_call.m4a',
    file_name: 'scam_irs_call.m4a',
    detected_at: minutesAgo(15),
    phone_number: '+1-202-555-0147',
    duration_sec: 245,
    transcript:
      "Hello, this is Officer Michael Johnson from the Internal Revenue Service. We have detected suspicious activity on your tax account and there is a warrant issued for your arrest. You owe $4,500 in back taxes and penalties. If you do not pay immediately using gift cards, federal agents will arrive at your home within the hour. This is your final warning. Press 1 to speak with our collections department and avoid arrest. Do not hang up or you will be arrested. We need your social security number to verify your identity.",
    transcription_status: 'completed',
    risk_score: 95,
    risk_level: 'red',
    scam_categories: ['Government Impersonation', 'Tax Scam'],
    scam_tactics: [
      'Urgency and threats',
      'Demanding gift card payment',
      'Requesting SSN',
      'Fake arrest warrant',
    ],
    analysis_summary:
      'High-confidence scam call. Caller impersonates IRS agent and uses classic tactics: threatening arrest, demanding immediate gift card payment, and requesting sensitive personal information. The IRS never calls demanding immediate payment or threatens arrest.',
    user_dismissed: false,
  },

  // SCAM CALL 2 - Tech Support Scam (High Risk)
  {
    id: generateId(),
    file_path: '/storage/emulated/0/Recordings/Call/tech_support_scam.m4a',
    file_name: 'tech_support_scam.m4a',
    detected_at: minutesAgo(45),
    phone_number: '+1-888-555-0199',
    duration_sec: 312,
    transcript:
      "Hello, this is Windows Technical Support. We have received alerts that your computer has been infected with a dangerous virus and hackers are stealing your banking information right now. Do not turn off your computer. I need you to go to your computer and press the Windows key and R at the same time. Now type in the following website address so I can remotely connect and fix your computer. We will need your credit card to pay for the $299 security software license. This virus is very serious and if we don't act now, all your files and bank accounts will be compromised.",
    transcription_status: 'completed',
    risk_score: 92,
    risk_level: 'red',
    scam_categories: ['Tech Support Scam', 'Remote Access Fraud'],
    scam_tactics: [
      'Creating panic about viruses',
      'Requesting remote access',
      'Unsolicited call claiming issues',
      'Demanding payment for fake services',
    ],
    analysis_summary:
      'Classic tech support scam. Caller falsely claims to be from Microsoft/Windows and creates urgency about fake virus infection. Attempts to gain remote access to computer and charge for unnecessary services. Microsoft never makes unsolicited support calls.',
    user_dismissed: false,
  },

  // NORMAL CALL 1 - Doctor's Office
  {
    id: generateId(),
    file_path: '/storage/emulated/0/Recordings/Call/doctors_office.m4a',
    file_name: 'doctors_office.m4a',
    detected_at: minutesAgo(120),
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

  // NORMAL CALL 2 - Family Member
  {
    id: generateId(),
    file_path: '/storage/emulated/0/Recordings/Call/mom_call.m4a',
    file_name: 'mom_call.m4a',
    detected_at: minutesAgo(180),
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
];

export async function seedTestData(): Promise<number> {
  let inserted = 0;
  for (const record of testRecords) {
    // Generate fresh IDs each time
    const recordWithNewId = {
      ...record,
      id: generateId(),
      detected_at: minutesAgo(Math.floor(Math.random() * 200) + 10),
    };
    await insertCallRecord(recordWithNewId);
    inserted++;

    // Auto-flag scam numbers in the database
    if (
      record.risk_level === 'red' &&
      record.phone_number &&
      record.risk_score &&
      record.scam_categories
    ) {
      await flagNumber(
        record.phone_number,
        record.risk_score,
        record.scam_categories,
      );
    }
  }
  return inserted;
}
