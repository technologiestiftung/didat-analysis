import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	...props
}: SliderPrimitive.Root.Props) {
	const _values = Array.isArray(value)
		? value
		: Array.isArray(defaultValue)
			? defaultValue
			: [min, max];

	return (
		<SliderPrimitive.Root
			className={cn("w-full", className)}
			data-slot="slider"
			defaultValue={defaultValue}
			value={value}
			min={min}
			max={max}
			thumbAlignment="edge"
			{...props}
		>
			<SliderPrimitive.Control className="relative flex h-5 w-full touch-none items-center select-none data-disabled:opacity-50">
				<SliderPrimitive.Track
					data-slot="slider-track"
					className="relative h-0.5 w-full grow rounded-full bg-zinc-300"
				>
					<SliderPrimitive.Indicator
						data-slot="slider-range"
						className="h-full rounded-full bg-zinc-700"
					/>
					{Array.from({ length: _values.length }, (_, index) => (
						<SliderPrimitive.Thumb
							data-slot="slider-thumb"
							key={index}
							className="block size-5 shrink-0 cursor-pointer rounded-full border-2 border-zinc-700 bg-white shadow-sm transition-transform select-none after:absolute after:-inset-2 hover:scale-110 focus-visible:outline-hidden focus-visible:scale-110 active:scale-105 disabled:pointer-events-none disabled:opacity-50"
						/>
					))}
				</SliderPrimitive.Track>
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
}

export { Slider };
