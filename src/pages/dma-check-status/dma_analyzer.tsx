import React, { useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import {
  Button,
  Layout,
  Menu,
  theme,
  Tabs,
  Table,
  notification,
  Card,
} from "antd";
import { filterCSVData, DMAData } from "../csv-reader-filter/dma_read_csv_filter";
import { calculateThreshold } from "../csv-reader-filter/dma_read_csv_threshold";
import { saveDMAData } from "../dma-upload-db/dma-to-db";

const { Header, Sider, Content } = Layout;
const { TabPane } = Tabs;

interface ThresholdData {
  meanAverage: number;
  threshold: number;
  calculatedAt: string;
  lowestFlowPerDay: {
    date: string;
    minFlow: number;
  }[];
}

const DMAAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filteredData, setFilteredData] = useState<DMAData[]>([]);
  const [thresholdData, setThresholdData] = useState<ThresholdData | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<string>("filtered");
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setFileName("");
    setFilteredData([]);
    setThresholdData(null);
    // Reset file input by creating a new reference
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      notification.error({
        message: "File Required",
        description: "Please select a CSV file first",
        placement: "topRight",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Get filtered data
      const data = await filterCSVData(selectedFile);

      // Validate filtered data
      if (!data || data.length === 0) {
        throw new Error("No data found between 1 AM and 4 AM in the CSV file");
      }

      // Log the filtered data
      console.log("Filtered Data from CSV:", data);
      console.table(data); // This will show the data in a nice table format in console

      // Calculate threshold from filtered data
      const thresholdResults = calculateThreshold(data);
      console.log("Threshold calculation results:", thresholdResults);

      // Update state with filtered data and threshold
      setFilteredData(data);
      setThresholdData(thresholdResults);

      // Save data to database
      await saveDMAData(data);

      notification.success({
        message: "Success",
        description: "Data processed and threshold calculated successfully!",
        placement: "topRight",
      });
    } catch (error) {
      console.error("Error processing file:", error);
      notification.error({
        message: "Processing Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process CSV file. Please check the file format and try again.",
        placement: "topRight",
        duration: 5, // Show for 5 seconds
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      title: "Date Time",
      dataIndex: "DateTime",
      key: "DateTime",
    },
    {
      title: "C2 Flow",
      dataIndex: "C2Flow",
      key: "C2Flow",
    },
  ];

  const minFlowColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Minimum Flow",
      dataIndex: "minFlow",
      key: "minFlow",
    },
  ];

  return (
    <Layout className="min-h-screen">
      <div className="mx-4 my-4 h-8 bg-white/20" />
      <Layout>
        <Content className="p-6 min-h-[280px] bg-white rounded-lg">
          <Tabs defaultActiveKey="1">
            <TabPane tab="DMA Threshold" key="1">
              <div className="flex flex-col space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex flex-col items-center space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Upload CSV File
                    </label>
                    <p className="text-sm text-gray-500">
                      Upload a csv file for setting new dma threshold.
                    </p>
                  </div>
                  <div className="w-full max-w-md relative">
                    <div className="flex relative">
                      <input
                        id="fileInput"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="opacity-0 absolute h-0 w-0"
                      />
                      <label
                        htmlFor="fileInput"
                        className="px-4 py-2 w-full text-sm text-gray-500 bg-white rounded-lg border border-gray-300 cursor-pointer overflow-hidden whitespace-nowrap text-ellipsis"
                      >
                        {fileName || "No file chosen"}
                      </label>
                      {fileName && (
                        <button
                          onClick={clearFileSelection}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-red-500"
                          title="Clear selection"
                        >
                          <CloseCircleOutlined />
                        </button>
                      )}
                    </div>
                  </div>
                  <Button
                    type="primary"
                    onClick={handleSubmit}
                    disabled={isProcessing || !selectedFile}
                    loading={isProcessing}
                    className="w-full max-w-md"
                    style={{
                      marginBottom: "1rem",
                      backgroundColor: selectedFile ? "green" : "red",
                      opacity: selectedFile ? 1 : 0.7,
                    }}
                  >
                    {isProcessing ? "Processing..." : "Submit"}
                  </Button>
                </div>

                {/* Data Display Section with Tabs */}
                {filteredData.length > 0 && thresholdData && (
                  <div className="mt-8">
                    <Tabs
                      activeKey={activeResultTab}
                      onChange={(key) => setActiveResultTab(key)}
                      className="mb-4"
                    >
                      <TabPane tab="Filtered Data (1 AM - 4 AM)" key="filtered">
                        <Table
                          dataSource={filteredData}
                          columns={columns}
                          rowKey={(record) => record.DateTime}
                          className="w-full"
                          pagination={{ pageSize: 10 }}
                        />
                      </TabPane>
                      <TabPane tab="Threshold Calculation" key="threshold">
                        {thresholdData && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <Card title="DMA Threshold Values" className="shadow-md">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="font-medium">Mean Average:</span>
                                    <span className="font-bold text-blue-600">
                                      {thresholdData.meanAverage} m³/h
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center pb-2 border-b">
                                    <span className="font-medium">Threshold (130%):</span>
                                    <span className="font-bold text-red-600">
                                      {thresholdData.threshold} m³/h
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Calculated At:</span>
                                    <span>{thresholdData.calculatedAt}</span>
                                  </div>
                                </div>
                              </Card>

                              <Card title="Daily Minimum Flow Values" className="shadow-md">
                                <Table
                                  dataSource={thresholdData.lowestFlowPerDay}
                                  columns={minFlowColumns}
                                  rowKey={(record) => record.date}
                                  pagination={false}
                                  size="small"
                                />
                              </Card>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                              <h4 className="mb-2 text-lg font-medium text-blue-800">
                                How Threshold is Calculated
                              </h4>
                              <p className="text-sm text-blue-600">
                                1. For each day, we find the minimum flow value between 1 AM and 4 AM.
                                <br />
                                2. We calculate the mean average of these minimum values.
                                <br />
                                3. The threshold is set at 130% of this mean average.
                              </p>
                            </div>
                          </div>
                        )}
                      </TabPane>
                    </Tabs>
                  </div>
                )}
              </div>
            </TabPane>
            <TabPane tab="Analysis Results" key="2">
              <div className="text-gray-700">
                <h3 className="text-lg font-medium">Analysis Results</h3>
                <p className="mt-2">
                  View the analysis results and filtered data here.
                </p>
              </div>
            </TabPane>
          </Tabs>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DMAAnalyzer;
