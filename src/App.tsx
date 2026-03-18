import { Routes, Route, Link } from "react-router-dom";
import { Overview } from "./pages/Overview";
import { Sessions } from "./pages/Sessions";
import { Topics } from "./pages/Topics";
import { PasswordGate } from "./components/PasswordGate";

export default function App() {
	return (
		<PasswordGate>
			<div className="min-h-screen bg-background text-foreground flex flex-col">
				<header className="border-b border-border bg-card">
					<div className="container mx-auto px-4 py-4 flex items-center justify-between">
						<Link
							to="/"
							className="flex items-center gap-3 hover:opacity-80 transition-opacity"
						>
							<img
								src="https://www.berlin.de/i9f/r1/images/logo_berlin_m_srgb.svg"
								alt="Berlin Logo"
								className="h-8"
							/>
							<h1 className="text-xl font-bold">DiDat</h1>
						</Link>
						<nav className="flex gap-4">
							<Link to="/" className="hover:text-primary transition-colors">
								Übersicht
							</Link>
							<Link
								to="/topics"
								className="hover:text-primary transition-colors"
							>
								Themen
							</Link>
							<Link
								to="/sessions"
								className="hover:text-primary transition-colors"
							>
								Sitzungen
							</Link>
						</nav>
					</div>
				</header>
				<main className="flex-1 container mx-auto px-4 py-8">
					<Routes>
						<Route path="/" element={<Overview />} />
						<Route path="/sessions" element={<Sessions />} />
						<Route path="/topics" element={<Topics />} />
					</Routes>
				</main>
			</div>
		</PasswordGate>
	);
}
