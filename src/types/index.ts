export interface Session {
	id: string; // z.B. "s_001" (stable session number)
	date: string; // ISO date string
	title: string; // Offizieller Sitzungstitel
	pdfUrl: string; // Link zum Originalprotokoll
	type: "Einladung" | "Beschlussprotokoll";
	topics: string[]; // Themennamen für Anzeige
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
	| "Bürgerdienste & Digitale Anträge"
	| "IT-Modernisierung & Infrastruktur"
	| "Datenschutz & Grundrechte"
	| "Informationsfreiheit & Transparenz"
	| "Künstliche Intelligenz (KI)"
	| "Cybersicherheit & Resilienz"
	| "Haushalt & Steuerung"
	| "Digitale Gesetze & Strategien";

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
