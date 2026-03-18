import { Session } from "../types";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./ui/drawer";
import { FileText } from "lucide-react";

export interface SessionListProps {
	sessions: Session[];
}

export function SessionList({ sessions }: SessionListProps) {
	return (
		<div className="border border-border rounded-lg bg-card overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Datum</TableHead>
						<TableHead>Titel</TableHead>
						<TableHead>Themen</TableHead>
						<TableHead>Beschlüsse</TableHead>
						<TableHead className="text-right">Details</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sessions.map((session) => (
						<Drawer key={session.id}>
							<TableRow>
								<TableCell className="whitespace-nowrap">
									{new Date(session.date).toLocaleDateString("de-DE")}
								</TableCell>
								<TableCell className="font-medium">{session.title}</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{session.topics.map((t) => (
											<Badge key={t} variant="secondary" className="text-xs">
												{t}
											</Badge>
										))}
									</div>
								</TableCell>
								<TableCell>{session.decisions.length}</TableCell>
								<TableCell className="text-right">
									<DrawerTrigger asChild>
										<button className="text-primary hover:underline text-sm font-medium">
											Ansehen
										</button>
									</DrawerTrigger>
								</TableCell>
							</TableRow>

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
																		variant={
																			d.result === "angenommen"
																				? "default"
																				: d.result === "abgelehnt"
																					? "destructive"
																					: "secondary"
																		}
																		className={
																			d.result === "angenommen"
																				? "bg-green-600 hover:bg-green-700 text-white border-transparent"
																				: d.result === "vertagt"
																					? "bg-yellow-500 hover:bg-yellow-600 text-white border-transparent"
																					: ""
																		}
																	>
																		{d.result}
																	</Badge>
																	{d.votes && (
																		<span className="text-xs text-muted-foreground">
																			Ja: {d.votes.yes} | Nein: {d.votes.no} |
																			Enthaltung: {d.votes.abstain}
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
						</Drawer>
					))}
					{sessions.length === 0 && (
						<TableRow>
							<TableCell colSpan={5} className="h-24 text-center">
								Keine Sitzungen gefunden.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
