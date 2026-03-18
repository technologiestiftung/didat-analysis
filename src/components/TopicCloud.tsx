export interface TopicCloudProps {
	topics: { name: string; weight: number }[];
}

export function TopicCloud({ topics }: TopicCloudProps) {
	const maxWeight = Math.max(...topics.map((t) => t.weight), 1);

	return (
		<div className="flex flex-wrap gap-3 items-center justify-center p-6 bg-card rounded-xl border border-border">
			{topics.map((topic, i) => {
				// Calculate font size between 0.8rem and 2rem based on weight relative to maxWeight
				const size = 0.8 + (topic.weight / maxWeight) * 1.2;
				const opacity = 0.5 + (topic.weight / maxWeight) * 0.5;

				return (
					<span
						key={i}
						className="text-primary font-medium hover:text-primary/80 transition-colors cursor-default"
						style={{
							fontSize: `${size}rem`,
							opacity: opacity,
						}}
					>
						{topic.name}
					</span>
				);
			})}
		</div>
	);
}
