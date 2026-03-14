import React from "react";

function App() {
	return (
		<div className="min-h-screen bg-gray-100 flex items-center justify-center">
			<div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
				<h1 className="text-3xl font-bold text-center text-gray-800 mb-6 font-sans">
					Hackathon Starter
				</h1>
				<p className="text-gray-600 text-center mb-4">
					React + Vite + Tailwind CSS v4 + Express + MongoDB
				</p>
				<button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
					Get Started
				</button>
			</div>
		</div>
	);
}

export default App;
