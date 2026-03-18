import { useEffect, useState, useMemo } from "react";
import { Session } from "../types";
import { SessionList } from "../components/SessionList";

export function Sessions() {
	const [sessions, setSessions] = useState<Session[]>([]);

	useEffect(() => {
		fetch("/data/sessions.json")
			.then((r) => r.json())
			.then(setSessions);
	}, []);

	const sortedSessions = useMemo(() => {
		return [...sessions].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);
	}, [sessions]);

	return (
		<div className="space-y-6 animate-in fade-in duration-500">
			<div className="flex items-center justify-between">
				<h2 className="text-3xl font-bold">Sitzungsprotokolle</h2>
				<span className="text-muted-foreground bg-muted px-3 py-1 rounded-full text-sm">
					{sortedSessions.length} Ergebnisse
				</span>
			</div>

			<SessionList sessions={sortedSessions} />
		</div>
	);
}
