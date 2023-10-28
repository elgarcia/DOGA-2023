# **DOGA Challenge**
This project focuses on extracting specific information from PDF files and generating a structured object containing the extracted data. It utilizes various JavaScript libraries such as pdf-parse, fs, path, and objectToCSV to read PDF files, extract relevant text content, and process it to find desired information.
Our main goal being generating a CSV file.
## **Project Overview**
The PDF Data Extraction project consists of the following main components:
1. **PDF Processing**: The *pdfToObj* function defined in *pdfProcessing.js* reads PDF files from a specified directory, extracts text content using *pdf-parse*, and processes the extracted text to find specific information. The function searches for **keywords** and patterns to identify and extract the relevant data, including client names, test details, test results, standards, and test object types. The extracted data is *stored in an array* of structured objects.
2. **CSV Conversion**: The *objectToCSV* function, defined in *csv_conversor.js*, takes the extracted data and converts it into a *CSV format*. It generates a *CSV file* named *result.csv*, which can be used for further analysis or integration with other systems.

## **Usage**
1. Ensure that **Node.js** and the required dependencies (pdf-parse) are installed. You can install the dependencies by running the following the next steps:
 # Instruccions
  Install The Required
  ```shell
  npm run install-dependencies
  ```
2. Place your PDF files in a directory of your choice.
Modify the *directoryPath* variable in *index.js* by setting it to the path of your PDF files directory.
Finally Use The Next Command To Test The Project
```shell
node index.js
```
## **Example**
Here's an example of using the PDF data extraction in your own code:
```javascript
// ...
const objectToCSV = require('./csv_conversor.js');

const directoryPath = './'; // Replace with the path to your directory

// ...Our Logic

pdfToObj(directoryPath)
  .then(processedData => {
    objectToCSV(processedData, 'result.csv');
    console.log('Extraction completed successfully!');
  })
  .catch(error => {
    console.error('Error:', error);
  });
```
