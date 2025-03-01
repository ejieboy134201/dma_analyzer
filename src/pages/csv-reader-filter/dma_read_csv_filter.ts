import Papa from 'papaparse';

export interface DMAData {
  DateTime: string;
  C2Flow: number;
}

function parseCustomDate(dateStr: string): Date {
  // Expected format: "DD/MM/YYYY HH:mm"
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes] = timePart.split(':');
  
  // Month is 0-based in JavaScript Date
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  );
}

export const filterCSVData = (file: File): Promise<DMAData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const data = results.data as string[][];
          const filteredData: DMAData[] = [];

          // Log the raw data for debugging
          console.log('Raw CSV data:', data);

          // Skip header row
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            
            // Skip empty rows or rows without enough columns
            if (!row || row.length < 3 || !row[0] || !row[2]) continue;

            try {
              // Parse the date string using our custom parser
              const dateTime = parseCustomDate(row[0]);
              
              // Log each row's date and hour for debugging
              console.log(`Row ${i}: DateTime=${row[0]}, Parsed Hour=${dateTime.getHours()}, Valid Date=true`);

              const hour = dateTime.getHours();

              // Only get data between 1 AM and 4 AM
              if (hour >= 1 && hour <= 4) {
                const flow = parseFloat(row[2]);
                if (!isNaN(flow)) {
                  filteredData.push({
                    DateTime: row[0],
                    C2Flow: flow
                  });
                } else {
                  console.warn(`Invalid flow value at row ${i}:`, row[2]);
                }
              }
            } catch (dateError) {
              console.warn(`Error parsing date at row ${i}:`, row[0], dateError);
              continue;
            }
          }

          console.log('Filtered Data (1 AM - 4 AM):', filteredData);
          
          resolve(filteredData);
        } catch (error) {
          console.error('Error processing CSV:', error);
          reject(error);
        }
      },
      error: (error) => {
        console.error('Papa Parse error:', error);
        reject(error);
      },
      header: false,
      skipEmptyLines: true
    });
  });
};
