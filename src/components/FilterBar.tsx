import { TopicCategory } from "../types";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

export interface ActiveFilters {
	year?: number | null;
	category?: TopicCategory | null;
	party?: string | null;
}

export interface FilterBarProps {
	years: number[];
	categories: TopicCategory[];
	parties: string[];
	activeFilters: ActiveFilters;
	onFilterChange: (filters: ActiveFilters) => void;
}

export function FilterBar({
	years,
	categories,
	parties,
	activeFilters,
	onFilterChange,
}: FilterBarProps) {
	return (
		<div className="flex flex-col sm:flex-row gap-4 items-center mb-6 bg-card p-4 rounded-lg border border-border">
			<div className="flex-1 w-full sm:w-auto">
				<Select
					value={activeFilters.year ? activeFilters.year.toString() : "all"}
					onValueChange={(v) =>
						onFilterChange({
							...activeFilters,
							year: !v || v === "all" ? null : parseInt(v as string),
						})
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="Jahr" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Alle Jahre</SelectItem>
						{years.map((y) => (
							<SelectItem key={y} value={y.toString()}>
								{y}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex-1 w-full sm:w-auto">
				<Select
					value={activeFilters.category ? activeFilters.category : "all"}
					onValueChange={(v) =>
						onFilterChange({
							...activeFilters,
							category: !v || v === "all" ? null : (v as TopicCategory),
						})
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="Thema" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Alle Themen</SelectItem>
						{categories.map((c) => (
							<SelectItem key={c} value={c}>
								{c}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex-1 w-full sm:w-auto">
				<Select
					value={activeFilters.party ? activeFilters.party : "all"}
					onValueChange={(v) =>
						onFilterChange({
							...activeFilters,
							party: !v || v === "all" ? null : v,
						})
					}
				>
					<SelectTrigger>
						<SelectValue placeholder="Partei" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Alle Parteien</SelectItem>
						{parties.map((p) => (
							<SelectItem key={p} value={p}>
								{p}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
