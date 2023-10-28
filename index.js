const { error } = require('console');
const fs = require('fs');
const { test } = require('node:test');
const path = require('path');
const pdf = require('pdf-parse');
const objectToCSV = require('./csv_conversor.js');

const directoryPath = './pdfs'; // Replace with the path to your directory

process.on('unhandledRejection', (reason, promise) => {
	console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
	// You can choose to log the warning or handle it in another way.
});

async function pdfToObj(directoryPath) {
	
	const pdfparsed = [];
	const keywords = ["3M", "Durability 1.5M", "Durability 0,5M", "Durability Motors",
		"Durability", "Performances", "Climatics", "IP", "External Test", "Test Plan (DVP)",
		"Electronics Test", "Others", "Salt spray test", "Humid. Chamber"];
	try {
		const files = await fs.promises.readdir(directoryPath);

		// Filter the PDF files
		const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf' && !file.startsWith("._"));

		// Iterate through PDF files
		//Error probably of reading more than necessary
		for (const pdfFile of pdfFiles) {
			const dataBuffer = fs.readFileSync(path.join(directoryPath, pdfFile));
			const data = await pdf(dataBuffer);
			const pdfText = data.text;
			// Process the PDF content here
			//Split the text in lines
			const lines = pdfText.split(/\n|\s+/);
			const proLines = pdfText.split(/\n/);
			//Remove whitespaces and empty lines
			const filteredLines = lines.filter(lines => lines.trim() != '');
			//Iterate in the array of lines looking for the term and print it (they can be all in one)
			let aux = 0;
			const fieldsToCapture = {
				"Report Number": "report",
				"Request": "request",
				"Reception date": "date",
				"Client": "client",
				"Test": "test",
				"Standard": "standard",
				"Test Result": "testResult",
				"Type": "type",
			};
			let currentData = {
				report: "",
				request: "",
				date: "",
				client: "",
				test: "",
				standard: "",
				testResult: "",
				type: "",
				testedComponents: ""
			}
			let currentField = "";

			//Report Number
			for (let i = 0; i < proLines.length; i++) {
				const line = proLines[i];
				const match = line.match(/\d+\/\d+/); // Regular expression to match the pattern "xx/xx"
				if (match) {
					currentData.report = match[0];
					//				currentField = match[0];
					break; // Once you find a matching pattern, you can stop searching
				}
			}
			currentField = "";
			//Request
			for (let i = 0; i < proLines.length; i++) {
				const line = proLines[i];

				if (line.includes("Request:") && line.includes("Page:")) {
					// Use a regular expression to capture the text between "Request:" and "Page:"
					const requestMatch = line.match(/Request: (.*?) Page:/);
					if (requestMatch) {
						const requestField = requestMatch[1].trim();
						currentData.request = requestField;
					}
					break; // Stop processing lines after finding the desired line
				}
			}
			currentField = "";
			//Date
			for (let i = 0; i < proLines.length; i++) {
				const line = proLines[i];
				// Check for labels and set the current field
				for (const label in fieldsToCapture) {
					if (line.startsWith(label)) {
						currentField = fieldsToCapture[label];
						let value = line.replace(label, "").replace(":", "").trim();
						if (currentField === "date") {
							// If the label is "Reception date," save the next line as the date
							currentData[currentField] = value;
						}
						break;
					}
				}
			}
			currentField = "";
			//Client
			for (let i = 0; i < filteredLines.length; i++) {
				const lines = filteredLines[i];
				if (aux == 1) {
					currentField += lines
					aux = 2;
				}
				else if (aux == 2) {
					if (lines.startsWith("Manufacturer:")) {
						currentData.client = currentField;
						//clientData.push(currentClient);
						aux = 0;
						break;
					}
					else
						currentField += " " + lines
				}
				if (lines.startsWith("Client:"))
					aux = 1;
			}
			currentField = "";
			//Test
			let aux2 = 0;
			for (let i = 0; i < filteredLines.length; i++) {
				const lines = filteredLines[i];
				if (aux == 1) {
					if (lines.includes("tests"))
						aux = 2;
				}
				else if (aux == 2) {
					if (lines.includes("See"))
						aux = 4
					else {
						currentField += lines;
						aux = 3;
					}
				}
				else if (aux == 3) {
					if (lines.includes("Test") || !keywords.some(keyword => lines.includes(keyword))) {
						if (!lines.includes("Test"))
							currentField += " " + lines;
						currentData.test = currentField;
						// testsData.push(currentTest);
						aux = 0;
						break;
					}
					else
						test += " " + lines;
				}
				else if (aux == 4) {
					if (aux2 == 1) {
						if (lines.includes("TEST"))
							aux = 5;
					}
					else if (lines.includes("TEST"))
						aux = 5;
				}
				else if (aux == 5) {
					if (aux2 == 1) {
						if (lines.includes("METHOD"))
						{
							aux2 = 0;
							aux = 6;
						}
					}
					else if (lines.includes("METHOD")) {
						aux = 4;
						aux2 = 1;
					}
				}
				else if (aux == 6) {
					if (keywords.some(keywords => lines.includes(keywords))) {
						currentField += lines;
						aux = 7;
					}
					else if (lines.includes("RESULTS")) {
						currentData.test = "Others";
						// testsData.push(currentTest);
						aux = 0;
						break;
					}
				}
				else if (aux == 7) {
					if (keywords.some(keywords => lines.includes(keywords)))
						currentField += " " + lines;
					else {
						currentData.test = currentField;
						aux = 0;
						break;
					}
				}
				else if (lines.includes("Performed")) {
					aux = 1;
				}
			}
			currentField = "";
			//Test result
			for (let i = 0; i < filteredLines.length; i++) {
				const lines = filteredLines[i];
				if (aux == 1) {
					if (lines.includes("results"))
						aux = 2;
				}
				else if (aux == 2) {
					if (lines.includes("Pass") || lines.includes("Fail")) {
						currentData.testResult = lines;
						// testResultData.push(currentTestResult);
						aux = 0;
						break;
					}
					else if (lines.includes("See")) {
						currentData.testResult = "Measured";
						// testResultData.push(currentTestResult);
						aux = 0;
						break;
					}
					else {
						currentData.testResult = "Not applicable";
						// testResultData.push(currentTestResult);
						aux = 0;
						break;
					}
				}
				if (lines.includes("Test"))
					aux = 1;
			}
			currentField = "";
			//Standard
			for (let i = 0; i < filteredLines.length; i++) {
				const lines = filteredLines[i];

				if (aux == 1) {
					if (lines.includes("standard"))
						aux = 2;
				}
				else if (aux == 2) {
					if (lines.includes("See") || lines.includes("According")) {
						currentData.standard = "OTROS";
						aux = 0;
						break;
					}
					else if (lines.includes("Performed")) {
						currentData.standard = currentField;
						aux = 0;
						break;
					}
					else
						currentField += lines + "";
				}
				if (lines.includes("Test"))
					aux = 1;
			}
			currentField = "";
			//Test object
			for (let i = 0; i < filteredLines.length; i++) {
				const lines = filteredLines[i];

				if (aux == 1) {
					if (lines.includes("object"))
						aux = 2;
				}
				else if (aux == 2) {
					if (lines.includes("Denomination")) {
						currentData.type = currentField;
						aux = 0;
						break;
					}
					else {
						if (currentField == "")
							currentField += lines;
						else
							currentField += " " + lines;
					}
				}
				if (lines.includes("Test"))
					aux = 1;
			}
			//Tested components
			let testedObj = "";
			for (let i = 0; i < filteredLines.length; i++) {
				const lines = filteredLines[i];
				if (aux == 1) {
					if (aux2 == 1) {
						if (lines.includes("COMPONENTS:")) {
							aux2 = 0;
							aux = 3;
						}
					}
					else if (lines.includes("COMPONENTS:")) {
						aux2 = 1;
						aux = 0;
					}
				}
				else if (aux == 3) {
					if (lines.includes("TEST")) {
						currentData.testedComponents = testedObj;
						aux = 0;
						break;
					}
					else {
						if (testedObj == "")
							testedObj += lines;
						else
							testedObj += " " + lines;
					}
				}
				else if (aux == 0) {
					if (lines.includes("TESTED")) {
						if (aux2 == 1) {
							if (lines.includes("TESTED"))
								aux = 1;
						}
						else
							aux = 1;
					}
				}
			}
			pdfparsed.push(currentData);
		}
		return pdfparsed;
	} catch (error) {
		console.error(`Error processing`, error);
		return [];
	}
}

pdfToObj(directoryPath)
.then(processedData => {
		objectToCSV(processedData, 'result.csv');
		console.log('Extraction completed successfully!');
	})
	.catch(error => {
		console.error('Error:', error);
	});