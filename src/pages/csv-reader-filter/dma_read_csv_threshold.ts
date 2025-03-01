import { DMAData } from './dma_read_csv_filter';

interface ThresholdResult {
  meanAverage: number;
  threshold: number;
  lowestFlowPerDay: DailyMinFlow[];
  calculatedAt: string;
}

interface DailyMinFlow {
  date: string;
  minFlow: number;
}

/**
 * Calculates threshold from filtered data
 * - Gets the lowest C2 flow for each day
 * - Calculates the mean average of those minimum values
 * - Returns the mean and a threshold value (130% of mean)
 */
export const calculateThreshold = (filteredData: DMAData[]): ThresholdResult => {
  // Group data by date (ignoring time)
  const dataByDate: { [key: string]: DMAData[] } = {};
  
  filteredData.forEach(item => {
    // Extract just the date part (DD/MM/YYYY)
    const datePart = item.DateTime.split(' ')[0];
    
    if (!dataByDate[datePart]) {
      dataByDate[datePart] = [];
    }
    
    dataByDate[datePart].push(item);
  });
  
  // Find minimum flow for each day
  const lowestFlowPerDay: DailyMinFlow[] = [];
  
  Object.keys(dataByDate).forEach(date => {
    const dayData = dataByDate[date];
    
    // Find entry with minimum C2Flow for this day
    const minFlowEntry = dayData.reduce((min, current) => 
      current.C2Flow < min.C2Flow ? current : min, dayData[0]);
    
    lowestFlowPerDay.push({
      date,
      minFlow: minFlowEntry.C2Flow
    });
  });
  
  // Calculate mean average of lowest flows
  const totalMinFlow = lowestFlowPerDay.reduce((sum, item) => sum + item.minFlow, 0);
  const meanAverage = lowestFlowPerDay.length > 0 
    ? totalMinFlow / lowestFlowPerDay.length 
    : 0;
  
  // Calculate threshold (130% of mean)
  const threshold = meanAverage * 1.3;
  
  // Get current date and time
  const calculatedAt = new Date().toLocaleString();
  
  return {
    meanAverage: parseFloat(meanAverage.toFixed(2)),
    threshold: parseFloat(threshold.toFixed(2)),
    lowestFlowPerDay,
    calculatedAt
  };
};