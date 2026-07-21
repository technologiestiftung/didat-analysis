import { useEffect, useState, useMemo } from "react";
import { Topic, TopicCategory, PartyPosition, Session } from "../types";
import { PartyPositions } from "../components/PartyPositions";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const ALL_CATEGORIES: TopicCategory[] = [
	"Bürgerdienste & Digitale Anträge",
	"IT-Modernisierung & Infrastruktur",
	"Datenschutz & Grundrechte",
	"Informationsfreiheit & Transparenz",
	"Künstliche Intelligenz (KI)",
	"Cybersicherheit & Resilienz",
	"Haushalt & Steuerung",
	"Digitale Gesetze & Strategien",
];

const PARTIES = ["SPD", "CDU", "Grüne", "FDP", "Linke", "AfD"];

export function Topics() {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [positions, setPositions] = useState<
		{ topicId: string; positions: PartyPosition[] }[]
	>([]);
	const [selectedCategory, setSelectedCategory] = useState<TopicCategory>(
		"Bürgerdienste & Digitale Anträge",
	);

	useEffect(() => {
		fetch("/data/sessions.json")
			.then((r) => r.json())
			.then(setSessions);
		fetch("/data/topics.json")
			.then((r) => r.json())
			.then(setTopics);
		fetch("/data/parties.json")
			.then((r) => r.json())
			.then(setPositions);
	}, []);

	// Only include topics that have actual positions
	const topicsWithPositions = useMemo(() => {
		return topics.filter((t) => {
			const posGroup = positions.find((p) => p.topicId === t.id);
			return posGroup && posGroup.positions && posGroup.positions.length > 0;
		});
	}, [topics, positions]);

	// Filter topics by the selected category
	const filteredTopics = useMemo(() => {
		return topicsWithPositions.filter((t) => t.category === selectedCategory);
	}, [topicsWithPositions, selectedCategory]);

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div>
				<h2 className="text-3xl font-bold mb-2">Themen & Parteipositionen</h2>
				<p className="text-muted-foreground">
					Detaillierte Analyse der Ausschussthemen und wie sich die Parteien
					dazu positionieren. Wählen Sie eine Kategorie, um die zugehörigen
					Themen und Zitate zu sehen.
				</p>
			</div>

			<div className="space-y-4">
				<div className="flex flex-wrap gap-2">
					{ALL_CATEGORIES.map((cat) => (
						<Badge
							key={cat}
							variant={selectedCategory === cat ? "default" : "outline"}
							className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground transition-colors py-1.5 px-3"
							onClick={() => setSelectedCategory(cat)}
						>
							{cat}
						</Badge>
					))}
				</div>
			</div>

			<div className="space-y-6">
				{filteredTopics.length > 0 ? (
					filteredTopics.map((topic) => {
						const topicPositions =
							positions.find((p) => p.topicId === topic.id)?.positions || [];
						return (
							<Card key={topic.id} className="overflow-hidden">
								<CardHeader className="bg-muted/30 border-b border-border">
									<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
										<div>
											<CardTitle className="text-xl mb-1">
												{topic.name}
											</CardTitle>
										</div>
									</div>
								</CardHeader>
								<CardContent className="p-0">
									<div className="p-6">
										<h4 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">
											Positionen
										</h4>
										<PartyPositions
											positions={topicPositions}
											parties={PARTIES}
											sessions={sessions}
										/>
									</div>
								</CardContent>
							</Card>
						);
					})
				) : (
					<div className="text-center p-12 bg-card border border-border rounded-xl">
						<p className="text-muted-foreground">
							Keine Themen mit hinterlegten Parteipositionen in dieser Kategorie
							gefunden.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
