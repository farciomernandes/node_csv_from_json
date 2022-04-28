const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const PNF = require('google-libphonenumber').PhoneNumberFormat;

const fs = require('fs');

const LINE_END = "\n";
const DELIMITER = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
const TAG_DELIMITER = " ";

// Recuperando todas as linhas do CSV
const csv = fs.readFileSync("entrada.csv", "utf-8");

// Criando um array onde cada item representa uma linha 
const csvLines = csv.split(LINE_END);

// Criando um array com a primeira linha do CSV de forma que cada item seja um "header" do CSV 
const headerLine = csvLines[0].split(DELIMITER); 

// Removendo a linha de headers do array para que cada item seja uma linha com dados
const dataLines = csvLines.splice(1, csvLines.length);


// Fazendo um split das linhas onde cada item do array representa uma linha com várias colunas
const lineColumns = dataLines.map(line => line.split(LINE_END));

const output = [];
lineColumns.forEach(line => {

	//Array onde cada índice representa um valor da linha
	const columns = line.toString().split(DELIMITER);
	
	// Objeto a ser montado para retorno
	const item = {};

	headerLine.forEach((header, index) => {

	const ADDRESSES_PROPERTY = "addresses";
	const ADDRESSES_PROPERTY_VALUE = "address";

		const [type, ...tags] = header.split(TAG_DELIMITER);

		const value_conversions = {
			"yes": true,
			"1": true,
			"no": false,
			"0": false,
		};

		const nonTreatedValue = columns[index];


		let value = Object.keys(value_conversions).find(key => key == nonTreatedValue) 
			? value_conversions[nonTreatedValue]
			: nonTreatedValue;
		
		// Se o dado for do tipo address salvar no array de ADDRESSES
		if (tags.length > 0) {

			if (! item[ADDRESSES_PROPERTY]) {
				item[ADDRESSES_PROPERTY] = [];
			}

				 
			//Se o dado for um número, converte em telefone
			try {
				const number = phoneUtil.parseAndKeepRawInput(value, 'BR');
				const convertedNumber = number.getNationalNumber();
				value = convertedNumber;
			} catch (error) {
				// Catch vazio pois o programa deve seguir normalmente
			}
			
			if(value){
				const addressesItem = {
					type: cleanString(type), 
					tags: tags.map(tag=> cleanString(tag)), 
					[ADDRESSES_PROPERTY_VALUE]: value
				}
	
				item[ADDRESSES_PROPERTY].push(addressesItem);
			}
		

		} else {

			value = cleanString(value);
			
			//Verifica se o campo do csv estava vazio
			if (item[type]) {

				//Se for um array adiciona a key o valor do array
				if (Array.isArray(item[type])) {
					const values = item[type];
					values.push(value);

					item[type] = values.map(elem=> cleanString(elem));
				} else {
					item[type] = [item[type], value];
				}

			} else {

				item[type] = value ? value : false;

			}

			// Salva o dado utilizando o type comum 
			// item[type] = value ? value : false;
		}

	});

	// Salva o item no array de items
	output.push(item);

});



//Filtra uma string e retorna seu conteúdo puro
function cleanString(data){
	data = typeof data === 'string' && data.includes("\"") ? data.replace("\"", "") : data;
	data = typeof data === 'string' && data.includes("/") ? data.split("/") : data;
	data = typeof data === 'string' && data.includes(",") ? data.split(",") : data;

	return data;
}

// Salva o arquivo de output
fs.writeFileSync(`output-${new Date()}.json`, JSON.stringify(output))