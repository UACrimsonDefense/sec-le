import type { Shape } from '#lib/types.js';

export type Term = { id: number; term: string; domain: number; definition: string };

export const terms: Term[] = [
	{
		id: 1,
		term: 'PHISHING',
		domain: 2,
		definition:
			'Tricking people into giving up credentials or info, usually through fake emails or sites.'
	},
	{
		id: 2,
		term: 'DEFENSE IN DEPTH',
		domain: 1,
		definition:
			'Layering multiple independent security controls so one failure does not expose everything.'
	},
	{
		id: 3,
		term: 'SHA-256',
		domain: 1,
		definition: 'A hashing algorithm that produces a 256-bit digest, used to verify integrity.'
	},
	{
		id: 4,
		term: 'HONEYPOT',
		domain: 1,
		definition: 'A decoy system set up to attract attackers and study their behavior.'
	},
	{
		id: 5,
		term: 'RANSOMWARE',
		domain: 2,
		definition: 'Malware that encrypts or locks data and demands payment to restore access.'
	},
	{
		id: 6,
		term: 'SQL INJECTION',
		domain: 2,
		definition: 'Slipping database commands into unsanitized input so the app runs them.'
	},
	{
		id: 7,
		term: 'ZERO-DAY',
		domain: 2,
		definition: 'A flaw attackers exploit before the vendor knows about it or has a fix.'
	},
	{
		id: 8,
		term: 'BRUTE FORCE',
		domain: 2,
		definition: 'Trying every possible password or key until one works.'
	},
	{
		id: 9,
		term: 'MICROSEGMENTATION',
		domain: 3,
		definition: 'Splitting a network into very small zones so workloads only reach what they need.'
	},
	{
		id: 10,
		term: '802.1X',
		domain: 3,
		definition:
			'A standard that makes devices authenticate before a switch port or Wi-Fi lets them on the network.'
	},
	{
		id: 11,
		term: 'SD-WAN',
		domain: 3,
		definition:
			'Software that manages traffic across several WAN links from one central controller.'
	},
	{
		id: 12,
		term: 'CLOUD ACCESS SECURITY BROKER',
		domain: 4,
		definition: 'A control point between users and cloud apps that enforces policy and shows usage.'
	},
	{
		id: 13,
		term: 'SIEM',
		domain: 4,
		definition:
			'A platform that collects logs from many sources and correlates them to spot incidents.'
	},
	{
		id: 14,
		term: 'SANDBOXING',
		domain: 4,
		definition: 'Running untrusted code in an isolated space where it cannot touch the real system.'
	},
	{
		id: 15,
		term: 'DATA LOSS PREVENTION',
		domain: 4,
		definition: 'Tools that detect and block sensitive data from leaving where it should stay.'
	},
	{
		id: 16,
		term: 'TABLETOP EXERCISE',
		domain: 4,
		definition: 'A discussion-based walkthrough of how a team would respond to a made-up incident.'
	},
	{
		id: 17,
		term: 'RISK REGISTER',
		domain: 5,
		definition: 'A running list of known risks with their owners, ratings and planned responses.'
	},
	{
		id: 18,
		term: 'DUE DILIGENCE',
		domain: 5,
		definition:
			'Checking a vendor or partner carefully before trusting them with your systems or data.'
	},
	{
		id: 19,
		term: 'PENETRATION TESTING',
		domain: 5,
		definition: 'An authorized simulated attack to find weaknesses before real attackers do.'
	},
	{
		id: 20,
		term: 'NON-REPUDIATION',
		domain: 1,
		definition: 'Proof that someone took an action, so they cannot later deny it.'
	},
	{
		id: 21,
		term: 'ZERO TRUST',
		domain: 1,
		definition: 'A model where no user or device is trusted by default, even inside the network.'
	}
];

export function getShape(term: string): Shape {
	return (term.match(/[^ ]+| /g) ?? []).map((part) => (part === ' ' ? part : part.length));
}

export function letters(term: string): string {
	return term.replace(/ /g, '');
}

export function maxGuesses(term: string): number {
	return Math.min(8, Math.max(5, letters(term).length + 2));
}
