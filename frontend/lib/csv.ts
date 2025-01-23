import Papa from "papaparse";

export function parseTextToCSV(text: string){
    const result = Papa.parse(text);

    return [result.data,result.errors];
}