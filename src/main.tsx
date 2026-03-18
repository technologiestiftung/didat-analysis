import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

function render() {
	const root = document.getElementById("root");

	if (!root) {
		return;
	}

	createRoot(root).render(
		<StrictMode>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</StrictMode>,
	);
}

render();
