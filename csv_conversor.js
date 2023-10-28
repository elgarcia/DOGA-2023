const fs = require('fs');

/**
 * Convierte un objeto en formato JSON en un archivo CSV.
 * @param {object} obj - El objeto a convertir en CSV.
 * @param {sub_obj} sub - como se ha nombrado el rray interno
 * @param {string} filename - El nombre del archivo CSV de salida.
 */

function objectToCSV(obj, filename)
{
	let keys, csvArray, csvData, values, value;


	// if (!obj || !sub || !Array.isArray(sub) || sub.length === 0)
	// 	throw new Error('Ivalid Obj format.');

	keys = Object.keys(obj[0]);
	csvArray = [];

	csvArray.push(keys.join(','));

	obj.forEach(cliente => {
		values = keys.map(key => {
			value = cliente[key];
			if (value.toString().includes(','))
				return (`"${value}"`);
			return (value);
		});
		csvArray.push(values.join(','));
	});

	csvData = csvArray.join('\n');

	try {
		fs.writeFileSync(filename, csvData);
		console.log(`"${filename}" CSV generated and saved successfully.`);
	} catch (err) {
		throw new Error(`Something went wront generating CSV file: ${err.message}`);
	}
}

module.exports = objectToCSV;

// const object_pdf = require('./clients.json');
// try {
// 	objectToCSV(object_pdf, 'name2.csv');
// } catch (error) {
// 	console.error(`Error: ${error.message}`);
// }

