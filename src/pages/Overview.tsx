import { useEffect, useState, useMemo } from "react";
import { Session, Topic, TrendDataPoint } from "../types";
import { TrendChart } from "../components/TrendChart";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Users, FileText, Activity } from "lucide-react";
import { Badge } from "../components/ui/badge";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";

export function Overview() {
	const [sessions, setSessions] = useState<Session[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [trends, setTrends] = useState<TrendDataPoint[]>([]);
	const [startYear, setStartYear] = useState<number | null>(null);
	const [endYear, setEndYear] = useState<number | null>(null);

	const getResultVariant = (result: string) => {
		if (result === "angenommen") {
			return "default";
		}
		if (result === "abgelehnt") {
			return "destructive";
		}
		return "secondary";
	};

	const getResultClass = (result: string) => {
		if (result === "angenommen") {
			return "bg-green-600 hover:bg-green-700 text-white border-transparent";
		}
		if (result === "vertagt") {
			return "bg-yellow-500 hover:bg-yellow-600 text-white border-transparent";
		}
		return "";
	};

	useEffect(() => {
		fetch("/data/sessions.json")
			.then((r) => r.json())
			.then(setSessions);
		fetch("/data/topics.json")
			.then((r) => r.json())
			.then(setTopics);
		fetch("/data/trends.json")
			.then((r) => r.json())
			.then(setTrends);
	}, []);

	const totalDecisions = sessions.reduce(
		(acc, s) => acc + s.decisions.length,
		0,
	);

	// Get all decisions with their session date for the overview
	const allDecisions = useMemo(() => {
		const decisionsList = sessions.flatMap((s) =>
			s.decisions.map((d) => ({
				...d,
				sessionDate: s.date,
				sessionTitle: s.title,
			})),
		);
		return decisionsList.sort(
			(a, b) =>
				new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime(),
		);
	}, [sessions]);

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<section className="py-4">
				<h2 className="text-3xl md:text-4xl font-bold mb-2">
					Ausschuss für Digitalisierung und Datenschutz
				</h2>
				<p className="text-lg text-muted-foreground max-w-2xl">
					Berliner Abgeordnetenhaus
					<br />
					Zusammenfassung der Diskussionen, Themen und Parteipositionen auf
					Basis offizieller Protokolle.
				</p>
			</section>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Sitzungen
						</CardTitle>
						<Users className="w-4 h-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{sessions.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Beschlüsse gefasst
						</CardTitle>
						<FileText className="w-4 h-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{totalDecisions}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Verschiedene Themen
						</CardTitle>
						<Activity className="w-4 h-4 text-primary" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{topics.length}</div>
					</CardContent>
				</Card>
			</div>

			<section className="space-y-4">
				<h3 className="text-xl font-bold">
					Themen-Trends (Vorkommen pro Monat)
				</h3>
				<TrendChart data={trends} />
			</section>

			<section className="space-y-4">
				<h3 className="text-xl font-bold">
					Übersicht der gefassten Beschlüsse
				</h3>
				<div className="border border-border rounded-xl bg-card overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full text-sm text-left">
							<thead className="bg-muted text-muted-foreground border-b border-border">
								<tr>
									<th className="px-4 py-3 font-medium whitespace-nowrap">
										Datum
									</th>
									<th className="px-4 py-3 font-medium">Beschluss</th>
									<th className="px-4 py-3 font-medium">Ergebnis</th>
								</tr>
							</thead>
							<tbody>
								{allDecisions.map((d, i) => (
									<tr
										key={i}
										className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
									>
										<td className="px-4 py-3 whitespace-nowrap align-top">
											{new Date(d.sessionDate).toLocaleDateString("de-DE")}
										</td>
										<td className="px-4 py-3 align-top max-w-2xl">
											<p className="font-medium text-foreground mb-1">
												{d.text}
											</p>
											<p className="text-xs text-muted-foreground">
												{d.sessionTitle}
											</p>
										</td>
										<td className="px-4 py-3 align-top whitespace-nowrap">
											<Badge
												variant={getResultVariant(d.result)}
												className={getResultClass(d.result)}
											>
												{d.result}
											</Badge>
										</td>
									</tr>
								))}
								{allDecisions.length === 0 && (
									<tr>
										<td
											colSpan={3}
											className="px-4 py-8 text-center text-muted-foreground"
										>
											Keine Beschlüsse gefunden.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</section>
		</div>
	);
}
