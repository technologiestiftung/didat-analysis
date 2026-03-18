import { PartyPosition, Session } from "../types";
import { Badge } from "./ui/badge";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./ui/drawer";
import { FileText } from "lucide-react";

export interface PartyPositionsProps {
	positions: PartyPosition[];
	parties: string[];
	sessions: Session[];
}

const partyColors: Record<string, string> = {
	SPD: "bg-party-spd",
	CDU: "bg-party-cdu",
	Grüne: "bg-party-gruene",
	FDP: "bg-party-fdp",
	Linke: "bg-party-linke",
	AfD: "bg-party-afd",
};

const stanceIcons: Record<string, string> = {
	pro: "👍",
	contra: "👎",
	neutral: "-",
	"keine Aussage": "-",
};

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

export function PartyPositions({
	positions,
	parties,
	sessions,
}: PartyPositionsProps) {
	// Group by session
	const sessionIds = Array.from(
		new Set(positions.map((p) => p.sessionId)),
	).sort();

	if (positions.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				Keine Positionen für dieses Thema erfasst.
			</p>
		);
	}

	return (
		<div className="overflow-x-auto border border-border rounded-lg bg-card">
			<table className="w-full text-sm text-left">
				<thead className="bg-muted text-muted-foreground border-b border-border">
					<tr>
						<th className="px-4 py-3 font-medium">Sitzung</th>
						{parties.map((party) => (
							<th key={party} className="px-4 py-3 font-medium text-center">
								<div className="flex flex-col items-center gap-1">
									<span
										className={`w-3 h-3 rounded-full ${partyColors[party] || "bg-gray-400"}`}
									/>
									{party}
								</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{sessionIds.map((sessionId) => {
						const session = sessions.find((s) => s.id === sessionId);
						return (
							<Drawer key={sessionId}>
								<tr className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
									<td className="px-4 py-3 font-medium whitespace-nowrap align-middle">
										<DrawerTrigger asChild>
											<button className="text-primary hover:underline text-left">
												{new Date(sessionId).toLocaleDateString("de-DE")}
												<br />
												<span className="text-xs font-normal text-muted-foreground mt-1 block">
													Details öffnen
												</span>
											</button>
										</DrawerTrigger>
									</td>
									{parties.map((party) => {
										const pos = positions.find(
											(p) => p.sessionId === sessionId && p.party === party,
										);
										return (
											<td
												key={party}
												className="px-4 py-3 text-center align-top min-w-[120px]"
											>
												{pos ? (
													<div className="flex flex-col items-center gap-2 group relative">
														<span
															className={`text-lg ${["neutral", "keine Aussage"].includes(pos.stance) ? "text-muted-foreground/50" : ""}`}
															title={pos.stance}
														>
															{stanceIcons[pos.stance] || "•"}
														</span>
														{pos.quote && (
															<p className="text-xs text-muted-foreground italic">
																"{pos.quote}"
															</p>
														)}
													</div>
												) : (
													<span className="text-lg text-muted-foreground/50">
														-
													</span>
												)}
											</td>
										);
									})}
								</tr>

								{session && (
									<DrawerContent>
										<div className="mx-auto w-full max-w-4xl max-h-[80vh] overflow-y-auto p-6">
											<DrawerHeader className="px-0">
												<DrawerTitle>{session.title}</DrawerTitle>
												<p className="text-sm text-muted-foreground">
													{new Date(session.date).toLocaleDateString("de-DE")} •{" "}
													{session.type}
												</p>
											</DrawerHeader>

											<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
												<div className="md:col-span-2 space-y-6">
													<section>
														<h4 className="font-semibold text-lg flex items-center gap-2 mb-3">
															<FileText className="w-5 h-5" /> Beschlüsse
														</h4>
														{session.decisions.length > 0 ? (
															<div className="space-y-3">
																{session.decisions.map((d) => (
																	<div
																		key={d.id}
																		className="p-3 bg-muted rounded-md border border-border"
																	>
																		<p className="text-sm mb-2">{d.text}</p>
																		<div className="flex items-center justify-between">
																			<Badge
																				variant={getResultVariant(d.result)}
																				className={getResultClass(d.result)}
																			>
																				{d.result}
																			</Badge>
																			{d.votes && (
																				<span className="text-xs text-muted-foreground">
																					Ja: {d.votes.yes} | Nein: {d.votes.no}{" "}
																					| Enthaltung: {d.votes.abstain}
																				</span>
																			)}
																		</div>
																	</div>
																))}
															</div>
														) : (
															<p className="text-sm text-muted-foreground">
																Keine Beschlüsse gefasst.
															</p>
														)}
													</section>
												</div>

												<div className="space-y-6">
													<section className="pt-4">
														<a
															href={session.pdfUrl}
															target="_blank"
															rel="noreferrer"
															className="flex items-center justify-center w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
														>
															Original PDF öffnen
														</a>
													</section>
												</div>
											</div>
										</div>
									</DrawerContent>
								)}
							</Drawer>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
