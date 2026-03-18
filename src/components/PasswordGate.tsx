import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Lock } from "lucide-react";

export function PasswordGate({ children }: { children: React.ReactNode }) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [password, setPassword] = useState("");
	const [error, setError] = useState(false);

	useEffect(() => {
		const savedAuth = sessionStorage.getItem("authenticated");
		if (savedAuth === "true") {
			setIsAuthenticated(true);
		}
	}, []);

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		if (password === "didat") {
			setIsAuthenticated(true);
			sessionStorage.setItem("authenticated", "true");
			setError(false);
		} else {
			setError(true);
		}
	};

	if (isAuthenticated) {
		return <>{children}</>;
	}

	return (
		<div className="flex items-center justify-center min-h-screen bg-muted p-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<div className="mx-auto bg-primary/10 p-3 rounded-full mb-2">
						<Lock className="w-6 h-6 text-primary" />
					</div>
					<CardTitle>Zugang gesichert</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleLogin} className="space-y-4">
						<Input
							type="password"
							placeholder="Passwort eingeben"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className={error ? "border-destructive" : ""}
						/>
						{error && (
							<p className="text-sm text-destructive">Falsches Passwort.</p>
						)}
						<Button type="submit" className="w-full">
							Anmelden
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
