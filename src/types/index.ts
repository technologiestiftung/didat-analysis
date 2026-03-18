export interface Session {
	id: string; // z.B. "2024-03-14"
	date: string; // ISO date string
	title: string; // Offizieller Sitzungstitel
	pdfUrl: string; // Link zum Originalprotokoll
	type: "Einladung" | "Beschlussprotokoll";
	topics: string[]; // Extrahierte Themen-IDs
	decisions: Decision[];
	attendees: Attendee[];
}

export interface Decision {
	id: string;
	text: string;
	result: "angenommen" | "abgelehnt" | "vertagt" | "zur Kenntnis genommen";
	votes?: { yes: number; no: number; abstain: number };
}

export interface Topic {
	id: string;
	name: string; // z.B. "KI in der Verwaltung"
	category: TopicCategory;
	sessionIds: string[]; // In welchen Sitzungen erwähnt
	trend: "steigend" | "fallend" | "konstant";
	partyPositions: PartyPosition[];
}

export type TopicCategory =
	| "Digitale Bürgerdienste (E-Government)"
	| "IT-Infrastruktur & ITDZ"
	| "Datenschutz & Informationsfreiheit"
	| "Verwaltungsreform & Haushalt"
	| "Künstliche Intelligenz (KI)"
	| "Cybersicherheit"
	| "Open Data & Open Source";

export interface PartyPosition {
	party: "SPD" | "CDU" | "Grüne" | "FDP" | "Linke" | "AfD";
	stance: "pro" | "contra" | "neutral" | "keine Aussage";
	quote?: string; // Kurzzitat aus dem Protokoll (max. 100 Zeichen)
	sessionId: string;
}

export interface Attendee {
	name: string;
	party: string;
	role: "Vorsitz" | "Mitglied" | "Gast" | "Sachverständige:r";
}

export interface TrendDataPoint {
	date: string;
	category: TopicCategory;
	count: number;
}
