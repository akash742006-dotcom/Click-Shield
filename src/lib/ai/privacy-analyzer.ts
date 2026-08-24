import ZAI from 'z-ai-web-dev-sdk'
import { withTimeout } from './with-timeout'

export interface PrivacyAnalysisResult {
  serviceName: string
  serviceUrl?: string
  policyUrl?: string
  policyTitle?: string
  lastUpdated?: string
  analysisDate: string
  keyQuestions: {
    whatData: string
    whyCollected: string
    sharesData: 'YES' | 'NO' | 'POLICY UNCLEAR'
    sellsData: 'YES' | 'NO' | 'POLICY UNCLEAR'
    retentionPeriod: string
    canDelete: 'YES' | 'NO' | 'LIMITED' | 'UNCLEAR'
    canOptOut: string
  }
  dashboard: {
    dataCollection: 'LOW' | 'MEDIUM' | 'HIGH'
    dataSharing: 'LOW' | 'MEDIUM' | 'HIGH'
    advertisingTracking: 'LOW' | 'MEDIUM' | 'HIGH'
    dataRetention: 'CLEAR' | 'UNCLEAR'
    userControl: 'STRONG' | 'MODERATE' | 'LIMITED'
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH'
  }
  sections: {
    dataCollection: string
    dataUsage: string
    dataSharing: string
    dataSelling: string
    dataRetention: string
    userRights: string
    accountDeletion: string
    childrenPrivacy: string
  }
  riskExplanation: string
  simpleSummary: string
  disclaimer: string
  retrieved: boolean
  retrievalError?: string
}

const DISCLAIMER =
  'This summary simplifies the original privacy policy. It is not legal advice and may not capture every provision. Always refer to the original policy for complete information.'

const SYSTEM_PROMPT = `You are Click Shield's AI Privacy Analyzer. You read the privacy policy text of an online service and explain, in plain English, what the service does with personal data.

You MUST respond with ONLY a valid JSON object — no markdown, no commentary. Use this exact schema:
{
  "key_questions": {
    "what_data": "<simple bullet list of data types collected>",
    "why_collected": "<simple bullet list of purposes>",
    "shares_data": "YES|NO|POLICY UNCLEAR",
    "sells_data": "YES|NO|POLICY UNCLEAR",
    "retention_period": "<state the retention period if clearly stated, otherwise exactly: Not clearly stated in the privacy policy.>",
    "can_delete": "YES|NO|LIMITED|UNCLEAR",
    "can_opt_out": "<simple explanation>"
  },
  "dashboard": {
    "data_collection": "LOW|MEDIUM|HIGH",
    "data_sharing": "LOW|MEDIUM|HIGH",
    "advertising_tracking": "LOW|MEDIUM|HIGH",
    "data_retention": "CLEAR|UNCLEAR",
    "user_control": "STRONG|MODERATE|LIMITED",
    "overall_risk": "LOW|MEDIUM|HIGH"
  },
  "sections": {
    "data_collection": "<plain-English explanation>",
    "data_usage": "<plain-English explanation>",
    "data_sharing": "<plain-English explanation>",
    "data_selling": "<plain-English explanation — distinguish selling from sharing with service providers>",
    "data_retention": "<plain-English explanation>",
    "user_rights": "<plain-English explanation>",
    "account_deletion": "<plain-English explanation>",
    "children_privacy": "<plain-English explanation>"
  },
  "risk_explanation": "<2-4 sentences explaining why this overall risk level was assigned>",
  "simple_summary": "<3-5 sentence plain-English summary for a non-technical user>"
}

CRITICAL RULES:
- NEVER invent information. If the policy does not clearly answer a question, use exactly: "Not clearly stated in the privacy policy." or "POLICY UNCLEAR" / "UNCLEAR".
- Distinguish data SELLING (selling personal info to advertisers/brokers) from general third-party sharing (e.g., service providers). Do NOT claim a company sells data merely because it shares data with service providers.
- Assign overall_risk = HIGH only when data collection + sharing + tracking are all high AND user control is limited.
- Keep all language simple enough for a non-technical user.
- Do not include any text outside the JSON object.`

interface AIPrivacyParsed {
  key_questions?: {
    what_data?: string
    why_collected?: string
    shares_data?: 'YES' | 'NO' | 'POLICY UNCLEAR'
    sells_data?: 'YES' | 'NO' | 'POLICY UNCLEAR'
    retention_period?: string
    can_delete?: 'YES' | 'NO' | 'LIMITED' | 'UNCLEAR'
    can_opt_out?: string
  }
  dashboard?: {
    data_collection?: 'LOW' | 'MEDIUM' | 'HIGH'
    data_sharing?: 'LOW' | 'MEDIUM' | 'HIGH'
    advertising_tracking?: 'LOW' | 'MEDIUM' | 'HIGH'
    data_retention?: 'CLEAR' | 'UNCLEAR'
    user_control?: 'STRONG' | 'MODERATE' | 'LIMITED'
    overall_risk?: 'LOW' | 'MEDIUM' | 'HIGH'
  }
  sections?: {
    data_collection?: string
    data_usage?: string
    data_sharing?: string
    data_selling?: string
    data_retention?: string
    user_rights?: string
    account_deletion?: string
    children_privacy?: string
  }
  risk_explanation?: string
  simple_summary?: string
}

const FALLBACK = (serviceName: string, policyUrl?: string): PrivacyAnalysisResult => ({
  serviceName,
  serviceUrl: policyUrl,
  policyUrl,
  policyTitle: 'Privacy Policy',
  analysisDate: new Date().toISOString(),
  keyQuestions: {
    whatData: 'Not clearly stated in the privacy policy.',
    whyCollected: 'Not clearly stated in the privacy policy.',
    sharesData: 'POLICY UNCLEAR',
    sellsData: 'POLICY UNCLEAR',
    retentionPeriod: 'Not clearly stated in the privacy policy.',
    canDelete: 'UNCLEAR',
    canOptOut: 'Not clearly stated in the privacy policy.',
  },
  dashboard: {
    dataCollection: 'MEDIUM',
    dataSharing: 'MEDIUM',
    advertisingTracking: 'MEDIUM',
    dataRetention: 'UNCLEAR',
    userControl: 'MODERATE',
    overallRisk: 'MEDIUM',
  },
  sections: {
    dataCollection: 'The privacy policy could not be fully parsed. Please refer to the original policy.',
    dataUsage: 'Not clearly stated in the privacy policy.',
    dataSharing: 'Not clearly stated in the privacy policy.',
    dataSelling: 'Not clearly stated in the privacy policy.',
    dataRetention: 'Not clearly stated in the privacy policy.',
    userRights: 'Not clearly stated in the privacy policy.',
    accountDeletion: 'Not clearly stated in the privacy policy.',
    childrenPrivacy: 'Not clearly stated in the privacy policy.',
  },
  riskExplanation:
    'A medium risk was assigned because the policy could not be fully analyzed automatically. Review the original policy directly.',
  simpleSummary: `${serviceName}'s privacy policy could not be analyzed in detail. We recommend reading the original policy carefully before sharing personal data.`,
  disclaimer: DISCLAIMER,
  retrieved: false,
})

export async function analyzePrivacyPolicy(
  serviceName: string,
  policyUrl: string,
  serviceUrl?: string
): Promise<PrivacyAnalysisResult> {
  let policyText = ''
  let policyTitle = 'Privacy Policy'
  let lastUpdated: string | undefined
  let retrieved = false
  let retrievalError: string | undefined

  // Retrieve the privacy policy using the web-reader function.
  // Guarded with a timeout so a hanging retrieval can never wedge the server.
  try {
    const zai = await withTimeout(ZAI.create(), 20_000, 'ZAI init')
    const result = await withTimeout(
      zai.functions.invoke('page_reader', { url: policyUrl }),
      45_000,
      'Privacy policy retrieval'
    )
    const data = result?.data
    if (data) {
      policyTitle = data.title || policyTitle
      // Convert HTML to plain text.
      const html: string = data.html || ''
      policyText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()
      lastUpdated = data.publishedTime || undefined
      retrieved = policyText.length > 200
    }
  } catch (err: any) {
    retrievalError = err?.message || 'Failed to retrieve the privacy policy.'
    console.error('[privacy-analyzer] retrieval error:', retrievalError)
  }

  if (!retrieved) {
    const fb = FALLBACK(serviceName, policyUrl)
    fb.retrievalError = retrievalError || 'The privacy policy could not be retrieved for automatic analysis.'
    return fb
  }

  // Truncate to keep the prompt within reasonable limits.
  const truncated = policyText.slice(0, 18000)

  try {
    const zai = await withTimeout(ZAI.create(), 20_000, 'ZAI init')
    const completion = await withTimeout(
      zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Service: ${serviceName}
Privacy policy URL: ${policyUrl}

Privacy policy text (may be truncated):
"""
${truncated}
"""

Return ONLY the JSON object described.`,
          },
        ],
        thinking: { type: 'disabled' },
      }),
      75_000,
      'Privacy AI analysis'
    )
    const raw = completion.choices[0]?.message?.content ?? ''
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
    const firstBrace = cleaned.indexOf('{')
    const lastBrace = cleaned.lastIndexOf('}')
    if (firstBrace === -1 || lastBrace === -1) {
      return FALLBACK(serviceName, policyUrl)
    }
    const jsonStr = cleaned.slice(firstBrace, lastBrace + 1)
    const parsed = JSON.parse(jsonStr) as AIPrivacyParsed

    return {
      serviceName,
      serviceUrl,
      policyUrl,
      policyTitle,
      lastUpdated,
      analysisDate: new Date().toISOString(),
      keyQuestions: {
        whatData: parsed.key_questions?.what_data || 'Not clearly stated in the privacy policy.',
        whyCollected: parsed.key_questions?.why_collected || 'Not clearly stated in the privacy policy.',
        sharesData: parsed.key_questions?.shares_data || 'POLICY UNCLEAR',
        sellsData: parsed.key_questions?.sells_data || 'POLICY UNCLEAR',
        retentionPeriod:
          parsed.key_questions?.retention_period || 'Not clearly stated in the privacy policy.',
        canDelete: parsed.key_questions?.can_delete || 'UNCLEAR',
        canOptOut: parsed.key_questions?.can_opt_out || 'Not clearly stated in the privacy policy.',
      },
      dashboard: {
        dataCollection: parsed.dashboard?.data_collection || 'MEDIUM',
        dataSharing: parsed.dashboard?.data_sharing || 'MEDIUM',
        advertisingTracking: parsed.dashboard?.advertising_tracking || 'MEDIUM',
        dataRetention: parsed.dashboard?.data_retention || 'UNCLEAR',
        userControl: parsed.dashboard?.user_control || 'MODERATE',
        overallRisk: parsed.dashboard?.overall_risk || 'MEDIUM',
      },
      sections: {
        dataCollection:
          parsed.sections?.data_collection || 'Not clearly stated in the privacy policy.',
        dataUsage: parsed.sections?.data_usage || 'Not clearly stated in the privacy policy.',
        dataSharing: parsed.sections?.data_sharing || 'Not clearly stated in the privacy policy.',
        dataSelling: parsed.sections?.data_selling || 'Not clearly stated in the privacy policy.',
        dataRetention: parsed.sections?.data_retention || 'Not clearly stated in the privacy policy.',
        userRights: parsed.sections?.user_rights || 'Not clearly stated in the privacy policy.',
        accountDeletion:
          parsed.sections?.account_deletion || 'Not clearly stated in the privacy policy.',
        childrenPrivacy:
          parsed.sections?.children_privacy || 'Not clearly stated in the privacy policy.',
      },
      riskExplanation: parsed.risk_explanation || '',
      simpleSummary: parsed.simple_summary || '',
      disclaimer: DISCLAIMER,
      retrieved: true,
    }
  } catch (err) {
    console.error('[privacy-analyzer] AI parse error:', err)
    return FALLBACK(serviceName, policyUrl)
  }
}
