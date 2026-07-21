import { useMemo, useState } from "react";
import { TrendDataPoint, TopicCategory } from "../types";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
} from "./ui/chart";
import { Slider } from "./ui/slider";
import { cn } from "@/lib/utils";

export interface TrendChartProps {
	data: TrendDataPoint[];
}

const DEFAULT_RANGE_START = "2025-06";
const DEFAULT_RANGE_END = "2026-06";

const categoryColors: Record<TopicCategory, string> = {
	"Bürgerdienste & Digitale Anträge": "#656ef2",
	"IT-Modernisierung & Infrastruktur": "#de6046",
	"Datenschutz & Grundrechte": "#5cc99a",
	"Informationsfreiheit & Transparenz": "#f2a667",
	"Künstliche Intelligenz (KI)": "#a167f2",
	"Cybersicherheit & Resilienz": "#63d0ef",
	"Haushalt & Steuerung": "#ed7092",
	"Digitale Gesetze & Strategien": "#f6cd68",
};

function safeKey(key: string) {
	return key.replace(/[^a-zA-Z0-9]/g, "");
}

function formatMonthLabel(value: string, style: "short" | "long" = "short") {
	const d = new Date(`${value}-01`);
	if (Number.isNaN(d.getTime())) {
		return value;
	}
	return d.toLocaleDateString("de-DE", {
		month: style,
		year: style === "short" ? "2-digit" : "numeric",
	});
}

/** Index of exact date, else first date on/after target, else fallback. */
function dateIndex(dates: string[], target: string, fallback: number) {
	const exact = dates.indexOf(target);
	if (exact !== -1) {
		return exact;
	}
	const next = dates.findIndex((d) => d >= target);
	return next === -1 ? fallback : next;
}

export function TrendChart({ data }: TrendChartProps) {
	const [range, setRange] = useState<[number, number] | null>(null);
	const [activeCat, setActiveCat] = useState<string | null>(null);

	const categories = useMemo(
		() => Array.from(new Set(data.map((d) => d.category))),
		[data],
	);

	const dates = useMemo(
		() => Array.from(new Set(data.map((d) => d.date))).sort(),
		[data],
	);

	const defaultRange = useMemo((): [number, number] => {
		if (dates.length === 0) {
			return [0, 0];
		}
		const start = dateIndex(dates, DEFAULT_RANGE_START, 0);
		const end = dateIndex(dates, DEFAULT_RANGE_END, dates.length - 1);
		return [Math.min(start, end), Math.max(start, end)];
	}, [dates]);

	const resolvedRange = range ?? defaultRange;

	const chartData = useMemo(
		() =>
			dates.map((date) => {
				const point: Record<string, string | number> = { date };
				for (const cat of categories) {
					const match = data.find((d) => d.date === date && d.category === cat);
					point[safeKey(cat)] = match?.count ?? 0;
				}
				return point;
			}),
		[dates, categories, data],
	);

	const visibleData = useMemo(
		() => chartData.slice(resolvedRange[0], resolvedRange[1] + 1),
		[chartData, resolvedRange],
	);

	const chartConfig = useMemo(
		() =>
			Object.fromEntries(
				categories.map((cat) => [
					safeKey(cat),
					{
						label: cat,
						color: categoryColors[cat as TopicCategory] || "var(--primary)",
					},
				]),
			) as ChartConfig,
		[categories],
	);

	if (data.length === 0) {
		return (
			<div className="p-8 text-center text-muted-foreground border border-border rounded-xl">
				Keine Trend-Daten verfügbar.
			</div>
		);
	}

	return (
		<div className="border border-border rounded-xl p-4 bg-card">
			<ChartContainer config={chartConfig} className="w-full h-[350px]">
				<LineChart
					accessibilityLayer
					data={visibleData}
					margin={{ left: -20, right: 10, top: 10, bottom: 0 }}
				>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="date"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tickFormatter={(value) => formatMonthLabel(value, "short")}
					/>
					<YAxis tickLine={false} axisLine={false} tickMargin={8} />
					<ChartTooltip
						cursor={false}
						content={
							<ChartTooltipContent
								indicator="dot"
								labelFormatter={(value) => formatMonthLabel(value, "long")}
							/>
						}
					/>
					<ChartLegend
						content={({ payload }) => (
							<div className="flex flex-wrap items-center justify-center gap-2 pt-3">
								{payload
									?.filter((item) => item.type !== "none")
									.map((item) => {
										const key = String(item.dataKey ?? item.value ?? "");
										const muted = activeCat !== null && activeCat !== key;
										return (
											<div
												key={key}
												className={cn(
													"inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium transition-opacity cursor-default",
													muted && "opacity-40",
												)}
												onMouseEnter={() => setActiveCat(key)}
												onMouseLeave={() => setActiveCat(null)}
											>
												<span
													className="size-2 shrink-0 rounded-full"
													style={{ backgroundColor: item.color }}
												/>
												<span>{chartConfig[key]?.label ?? item.value}</span>
											</div>
										);
									})}
							</div>
						)}
					/>

					{categories.map((cat) => {
						const key = safeKey(cat);
						const muted = activeCat !== null && activeCat !== key;
						return (
							<Line
								key={cat}
								type="monotone"
								dataKey={key}
								stroke={`var(--color-${key})`}
								strokeWidth={muted ? 1.5 : 2}
								strokeOpacity={muted ? 0.15 : 1}
								dot={muted ? false : { r: 4 }}
								activeDot={muted ? false : { r: 6 }}
								onMouseEnter={() => setActiveCat(key)}
								onMouseLeave={() => setActiveCat(null)}
								style={{ transition: "stroke-opacity 150ms ease" }}
							/>
						);
					})}
				</LineChart>
			</ChartContainer>

			<div className="mt-4 space-y-2 px-2">
				<div className="flex items-center justify-between text-sm text-muted-foreground">
					<span>{formatMonthLabel(dates[resolvedRange[0]], "long")}</span>
					<span>{formatMonthLabel(dates[resolvedRange[1]], "long")}</span>
				</div>
				<Slider
					min={0}
					max={Math.max(0, dates.length - 1)}
					step={1}
					value={resolvedRange}
					onValueChange={(value) => {
						if (Array.isArray(value) && value.length >= 2) {
							setRange([value[0], value[1]]);
						}
					}}
					aria-label="Zeitraum der Themen-Trends"
				/>
			</div>
		</div>
	);
}
