// Catalog of well-known services and their official privacy policy URLs.
// Used by Privacy Shield to identify the official privacy policy for a searched service.
// For services not listed here, the AI will attempt to identify the policy dynamically.

export interface KnownService {
  name: string
  publisher: string
  official_url: string
  privacy_policy_url: string
  aliases: string[]
  category: string
}

export const knownServices: KnownService[] = [
  {
    name: 'Instagram',
    publisher: 'Meta Platforms, Inc.',
    official_url: 'https://www.instagram.com',
    privacy_policy_url: 'https://privacycenter.instagram.com/policy',
    aliases: ['instagram', 'insta', 'ig'],
    category: 'Social Media',
  },
  {
    name: 'WhatsApp',
    publisher: 'Meta Platforms, Inc.',
    official_url: 'https://www.whatsapp.com',
    privacy_policy_url: 'https://www.whatsapp.com/legal/privacy-policy',
    aliases: ['whatsapp', 'wa', 'whatsapp messenger'],
    category: 'Messaging',
  },
  {
    name: 'Google',
    publisher: 'Google LLC',
    official_url: 'https://www.google.com',
    privacy_policy_url: 'https://policies.google.com/privacy',
    aliases: ['google', 'google search', 'gmail', 'google account'],
    category: 'Technology',
  },
  {
    name: 'YouTube',
    publisher: 'Google LLC',
    official_url: 'https://www.youtube.com',
    privacy_policy_url: 'https://policies.google.com/privacy',
    aliases: ['youtube', 'yt'],
    category: 'Streaming',
  },
  {
    name: 'Facebook',
    publisher: 'Meta Platforms, Inc.',
    official_url: 'https://www.facebook.com',
    privacy_policy_url: 'https://www.facebook.com/privacy/policy',
    aliases: ['facebook', 'fb'],
    category: 'Social Media',
  },
  {
    name: 'Amazon',
    publisher: 'Amazon.com, Inc.',
    official_url: 'https://www.amazon.com',
    privacy_policy_url: 'https://www.amazon.com/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ',
    aliases: ['amazon', 'amazon shopping'],
    category: 'E-commerce',
  },
  {
    name: 'Spotify',
    publisher: 'Spotify AB',
    official_url: 'https://www.spotify.com',
    privacy_policy_url: 'https://www.spotify.com/legal/privacy-policy/',
    aliases: ['spotify'],
    category: 'Streaming',
  },
  {
    name: 'X (Twitter)',
    publisher: 'X Corp.',
    official_url: 'https://www.x.com',
    privacy_policy_url: 'https://twitter.com/en/privacy',
    aliases: ['twitter', 'x', 'x twitter'],
    category: 'Social Media',
  },
  {
    name: 'TikTok',
    publisher: 'TikTok Inc.',
    official_url: 'https://www.tiktok.com',
    privacy_policy_url: 'https://www.tiktok.com/legal/privacy-policy',
    aliases: ['tiktok', 'tik tok'],
    category: 'Social Media',
  },
  {
    name: 'Snapchat',
    publisher: 'Snap Inc.',
    official_url: 'https://www.snapchat.com',
    privacy_policy_url: 'https://snap.com/en-US/privacy/privacy-policy',
    aliases: ['snapchat', 'snap'],
    category: 'Social Media',
  },
  {
    name: 'Netflix',
    publisher: 'Netflix, Inc.',
    official_url: 'https://www.netflix.com',
    privacy_policy_url: 'https://help.netflix.com/legal/privacy',
    aliases: ['netflix'],
    category: 'Streaming',
  },
  {
    name: 'Microsoft',
    publisher: 'Microsoft Corporation',
    official_url: 'https://www.microsoft.com',
    privacy_policy_url: 'https://privacy.microsoft.com/en-us/privacystatement',
    aliases: ['microsoft', 'windows', 'outlook', 'hotmail', 'live'],
    category: 'Technology',
  },
  {
    name: 'Apple',
    publisher: 'Apple Inc.',
    official_url: 'https://www.apple.com',
    privacy_policy_url: 'https://www.apple.com/legal/privacy/en/',
    aliases: ['apple', 'icloud', 'appleid'],
    category: 'Technology',
  },
  {
    name: 'Paytm',
    publisher: 'One97 Communications Ltd.',
    official_url: 'https://paytm.com',
    privacy_policy_url: 'https://paytm.com/privacy-policy',
    aliases: ['paytm'],
    category: 'Payments',
  },
  {
    name: 'PhonePe',
    publisher: 'PhonePe Pvt. Ltd.',
    official_url: 'https://www.phonepe.com',
    privacy_policy_url: 'https://www.phonepe.com/privacy-policy/',
    aliases: ['phonepe', 'phone pe'],
    category: 'Payments',
  },
  {
    name: 'Swiggy',
    publisher: 'Swiggy Pvt. Ltd.',
    official_url: 'https://www.swiggy.com',
    privacy_policy_url: 'https://www.swiggy.com/privacy-policy',
    aliases: ['swiggy'],
    category: 'Food Delivery',
  },
  {
    name: 'Zomato',
    publisher: 'Zomato Ltd.',
    official_url: 'https://www.zomato.com',
    privacy_policy_url: 'https://www.zomato.com/privacy_policy',
    aliases: ['zomato'],
    category: 'Food Delivery',
  },
  {
    name: 'Flipkart',
    publisher: 'Flipkart Internet Pvt. Ltd.',
    official_url: 'https://www.flipkart.com',
    privacy_policy_url: 'https://www.flipkart.com/pages/privacypolicy',
    aliases: ['flipkart'],
    category: 'E-commerce',
  },
  {
    name: 'Uber',
    publisher: 'Uber Technologies, Inc.',
    official_url: 'https://www.uber.com',
    privacy_policy_url: 'https://www.uber.com/legal/en/document/?name=privacy-policy&country=india',
    aliases: ['uber'],
    category: 'Ride-hailing',
  },
  {
    name: 'Truecaller',
    publisher: 'True Software Scandinavia AB',
    official_url: 'https://www.truecaller.com',
    privacy_policy_url: 'https://www.truecaller.com/privacy-policy',
    aliases: ['truecaller'],
    category: 'Communication',
  },
]

export interface ServiceSearchResult {
  found: boolean
  service?: KnownService
  multiple?: KnownService[]
}

/** Search the known services catalog by name/alias. */
export function searchKnownService(query: string): ServiceSearchResult {
  const q = query.trim().toLowerCase()
  if (!q) return { found: false }

  const matches: KnownService[] = []
  for (const svc of knownServices) {
    const haystack = [svc.name, ...svc.aliases, svc.publisher].map((s) => s.toLowerCase())
    if (haystack.some((h) => h.includes(q) || q.includes(h))) {
      matches.push(svc)
    }
  }

  if (matches.length === 0) return { found: false }
  if (matches.length === 1) return { found: true, service: matches[0] }
  return { found: true, multiple: matches }
}
