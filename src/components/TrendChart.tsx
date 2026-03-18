import { TrendDataPoint, TopicCategory } from "../types";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
} from "./ui/chart";

export interface TrendChartProps {
	data: TrendDataPoint[];
}

// Fixed color palette for the categories
const categoryColors: Record<TopicCategory, string> = {
	"Digitale Bürgerdienste (E-Government)": "#e11d48", // Red
	"IT-Infrastruktur & ITDZ": "#2563eb", // Blue
	"Datenschutz & Informationsfreiheit": "#16a34a", // Green
	"Verwaltungsreform & Haushalt": "#d97706", // Orange
	"Künstliche Intelligenz (KI)": "#9333ea", // Purple
	Cybersicherheit: "#0ea5e9", // Indigo
	"Open Data & Open Source": "#475569", // Slate
};

export function TrendChart({ data }: TrendChartProps) {
	// Helper to make category names safe for CSS variables and Recharts keys
	const safeKey = (key: string) => key.replace(/[^a-zA-Z0-9]/g, "");

	// 1. Get unique dates and categories
	const categories = Array.from(new Set(data.map((d) => d.category)));
	const dates = Array.from(new Set(data.map((d) => d.date))).sort();

	// 2. Transform flat data into wide format: [{ date: "2025-01", "KI": 5, "Smart City": 2 }, ...]
	const chartData = dates.map((date) => {
		const point: Record<string, string | number> = { date };
		categories.forEach((cat) => {
			const match = data.find((d) => d.date === date && d.category === cat);
			point[safeKey(cat)] = match ? match.count : 0;
		});
		return point;
	});

	// 3. Build ChartConfig dynamically
	const chartConfig = categories.reduce((acc, cat) => {
		acc[safeKey(cat)] = {
			label: cat,
			color: categoryColors[cat as TopicCategory] || "var(--primary)",
		};
		return acc;
	}, {} as ChartConfig);

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
					data={chartData}
					margin={{ left: -20, right: 10, top: 10, bottom: 0 }}
				>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="date"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tickFormatter={(value) => {
							// Format "YYYY-MM" to "Mon YY" if desired, or keep as is.
							const d = new Date(value + "-01");
							if (!isNaN(d.getTime())) {
								return d.toLocaleDateString("de-DE", {
									month: "short",
									year: "2-digit",
								});
							}
							return value;
						}}
					/>
					<YAxis tickLine={false} axisLine={false} tickMargin={8} />
					<ChartTooltip
						cursor={false}
						content={
							<ChartTooltipContent
								indicator="dot"
								labelFormatter={(value) => {
									const d = new Date(value + "-01");
									if (!isNaN(d.getTime())) {
										return d.toLocaleDateString("de-DE", {
											month: "long",
											year: "numeric",
										});
									}
									return value;
								}}
							/>
						}
					/>
					<ChartLegend content={<ChartLegendContent className="flex-wrap" />} />

					{categories.map((cat) => (
						<Line
							key={cat}
							type="monotone"
							dataKey={safeKey(cat)}
							stroke={`var(--color-${safeKey(cat)})`}
							strokeWidth={2}
							dot={{ r: 4 }}
							activeDot={{ r: 6 }}
						/>
					))}
				</LineChart>
			</ChartContainer>
		</div>
	);
}
