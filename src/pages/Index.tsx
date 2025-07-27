import React, { useState, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Upload, FileText, Database, BarChart3, TrendingUp, MessageSquare, 
  Plus, Trash2, Download, Settings, Eye, Brain, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Types for our data structure
interface DataRow {
  [key: string]: any;
}

interface Column {
  name: string;
  type: 'numeric' | 'categorical' | 'date';
  missingCount: number;
  uniqueCount: number;
  strategy?: 'remove' | 'mean' | 'mode' | 'none';
}

interface Chart {
  id: string;
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'histogram';
  title: string;
  xAxis?: string;
  yAxis?: string;
  data: any[];
}

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const DataAnalysisDashboard: React.FC = () => {
  // State management
  const [rawData, setRawData] = useState<DataRow[]>([]);
  const [cleanedData, setCleanedData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [charts, setCharts] = useState<Chart[]>([]);
  const [dashboardCharts, setDashboardCharts] = useState<Chart[]>([]);
  const [selectedChartType, setSelectedChartType] = useState<string>('bar');
  const [selectedXAxis, setSelectedXAxis] = useState<string>('');
  const [selectedYAxis, setSelectedYAxis] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);

  const { toast } = useToast();

  // Data processing utilities
  const detectColumnType = useCallback((values: any[]): 'numeric' | 'categorical' | 'date' => {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonNullValues.length === 0) return 'categorical';

    // Check if numeric
    const numericValues = nonNullValues.filter(v => !isNaN(parseFloat(v)));
    if (numericValues.length / nonNullValues.length > 0.8) return 'numeric';

    // Check if date
    const dateValues = nonNullValues.filter(v => !isNaN(Date.parse(v)));
    if (dateValues.length / nonNullValues.length > 0.8) return 'date';

    return 'categorical';
  }, []);

  const processFile = useCallback((file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as DataRow[];
        setRawData(data);
        setCleanedData(data);

        // Analyze columns
        const columnNames = Object.keys(data[0] || {});
        const analyzedColumns: Column[] = columnNames.map(name => {
          const values = data.map(row => row[name]);
          const missingCount = values.filter(v => v === null || v === undefined || v === '').length;
          const uniqueCount = new Set(values.filter(v => v !== null && v !== undefined && v !== '')).size;
          const type = detectColumnType(values);

          return {
            name,
            type,
            missingCount,
            uniqueCount,
            strategy: missingCount > 0 ? (type === 'numeric' ? 'mean' : 'mode') : 'none'
          };
        });

        setColumns(analyzedColumns);
        generateAutomaticCharts(data, analyzedColumns);
        setIsProcessing(false);
        setActiveTab('clean');
        toast({
          title: "File uploaded successfully",
          description: `Loaded ${data.length} rows with ${columnNames.length} columns`
        });
      },
      error: (error) => {
        setIsProcessing(false);
        toast({
          title: "Error parsing file",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  }, [detectColumnType, toast]);

  // Data cleaning functions
  const applyDataCleaning = useCallback(() => {
    setIsProcessing(true);
    let processedData = [...rawData];

    // Remove duplicates
    const uniqueData = processedData.filter((row, index, self) => 
      index === self.findIndex(r => JSON.stringify(r) === JSON.stringify(row))
    );

    // Handle missing values for each column
    columns.forEach(column => {
      if (column.strategy === 'remove') {
        uniqueData.filter(row => row[column.name] !== null && row[column.name] !== undefined && row[column.name] !== '');
      } else if (column.strategy === 'mean' && column.type === 'numeric') {
        const values = uniqueData.map(row => parseFloat(row[column.name])).filter(v => !isNaN(v));
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        uniqueData.forEach(row => {
          if (row[column.name] === null || row[column.name] === undefined || row[column.name] === '') {
            row[column.name] = mean.toFixed(2);
          }
        });
      } else if (column.strategy === 'mode') {
        const values = uniqueData.map(row => row[column.name]).filter(v => v !== null && v !== undefined && v !== '');
        const mode = values.sort((a, b) =>
          values.filter(v => v === a).length - values.filter(v => v === b).length
        ).pop();
        uniqueData.forEach(row => {
          if (row[column.name] === null || row[column.name] === undefined || row[column.name] === '') {
            row[column.name] = mode;
          }
        });
      }
    });

    setCleanedData(uniqueData);
    generateAutomaticCharts(uniqueData, columns);
    setIsProcessing(false);
    setActiveTab('visualize');
    toast({
      title: "Data cleaned successfully",
      description: `Cleaned dataset has ${uniqueData.length} rows`
    });
  }, [rawData, columns, toast]);

  // Chart generation
  const generateAutomaticCharts = useCallback((data: DataRow[], cols: Column[]) => {
    const newCharts: Chart[] = [];

    cols.forEach(column => {
      if (column.type === 'numeric') {
        // Generate histogram for numeric columns
        const values = data.map(row => parseFloat(row[column.name])).filter(v => !isNaN(v));
        const min = Math.min(...values);
        const max = Math.max(...values);
        const bins = 10;
        const binSize = (max - min) / bins;
        
        const histogramData = Array.from({ length: bins }, (_, i) => {
          const binStart = min + i * binSize;
          const binEnd = binStart + binSize;
          const count = values.filter(v => v >= binStart && v < binEnd).length;
          return {
            range: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
            count,
            value: binStart + binSize / 2
          };
        });

        newCharts.push({
          id: `hist-${column.name}`,
          type: 'bar',
          title: `Distribution of ${column.name}`,
          xAxis: 'range',
          yAxis: 'count',
          data: histogramData
        });
      } else if (column.type === 'categorical' && column.uniqueCount <= 20) {
        // Generate bar chart for categorical columns
        const valueCounts = data.reduce((acc, row) => {
          const value = row[column.name];
          acc[value] = (acc[value] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const barData = Object.entries(valueCounts)
          .map(([key, value]) => ({ category: key, count: value }))
          .sort((a, b) => b.count - a.count);

        newCharts.push({
          id: `bar-${column.name}`,
          type: 'bar',
          title: `Frequency of ${column.name}`,
          xAxis: 'category',
          yAxis: 'count',
          data: barData
        });
      }
    });

    setCharts(newCharts);
  }, []);

  const createCustomChart = useCallback(() => {
    if (!selectedXAxis || !selectedYAxis || !selectedChartType) {
      toast({
        title: "Missing chart configuration",
        description: "Please select chart type, X-axis, and Y-axis",
        variant: "destructive"
      });
      return;
    }

    const chartData = cleanedData.map(row => ({
      x: row[selectedXAxis],
      y: parseFloat(row[selectedYAxis]) || 0,
      [selectedXAxis]: row[selectedXAxis],
      [selectedYAxis]: row[selectedYAxis]
    }));

    const newChart: Chart = {
      id: `custom-${Date.now()}`,
      type: selectedChartType as any,
      title: `${selectedYAxis} by ${selectedXAxis}`,
      xAxis: selectedXAxis,
      yAxis: selectedYAxis,
      data: chartData
    };

    setCharts(prev => [...prev, newChart]);
    toast({
      title: "Chart created",
      description: `Created ${selectedChartType} chart`
    });
  }, [selectedXAxis, selectedYAxis, selectedChartType, cleanedData, toast]);

  const addToDashboard = useCallback((chart: Chart) => {
    setDashboardCharts(prev => [...prev, { ...chart, id: `dash-${chart.id}` }]);
    toast({
      title: "Added to dashboard",
      description: `${chart.title} added to dashboard`
    });
  }, [toast]);

  // AI Question Answering
  const askQuestion = useCallback(async () => {
    if (!userQuestion.trim()) return;
    if (!geminiApiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingAI(true);
    const userMsg: ChatMessage = {
      type: 'user',
      content: userQuestion,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      // Prepare data summary for AI
      const dataSummary = columns.map(col => 
        `${col.name} (${col.type}): ${col.uniqueCount} unique values, ${col.missingCount} missing`
      ).join('\n');
      
      const sampleData = cleanedData.slice(0, 5).map(row => 
        Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(', ')
      ).join('\n');

      const prompt = `You are a data analyst. Based on the following data summary and user question, provide a concise, data-backed answer.

Data Summary:
${dataSummary}

Sample Data (first 5 rows):
${sampleData}

User Question: ${userQuestion}

Please provide a clear, analytical response based on the data structure provided.`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + geminiApiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topP: 0.9,
            maxOutputTokens: 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I could not analyze your data.';

      const aiMsg: ChatMessage = {
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      toast({
        title: "AI Analysis Failed",
        description: "Could not get AI response. Please check your API key.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAI(false);
      setUserQuestion('');
    }
  }, [userQuestion, geminiApiKey, columns, cleanedData, toast]);

  // Chart rendering component
  const ChartRenderer: React.FC<{ chart: Chart }> = ({ chart }) => {
    const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

    const commonProps = {
      width: 400,
      height: 300,
      data: chart.data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={chart.yAxis} fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={chart.yAxis} stroke={colors[1]} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis} />
              <YAxis dataKey={chart.yAxis} />
              <Tooltip />
              <Scatter dataKey={chart.yAxis} fill={colors[2]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chart.data}
                dataKey={chart.yAxis}
                nameKey={chart.xAxis}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  const numericColumns = useMemo(() => columns.filter(col => col.type === 'numeric'), [columns]);
  const categoricalColumns = useMemo(() => columns.filter(col => col.type === 'categorical'), [columns]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Data Analysis Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload, clean, analyze, and visualize your data with AI-powered insights
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-card shadow-card">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="clean" disabled={rawData.length === 0} className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Clean
            </TabsTrigger>
            <TabsTrigger value="visualize" disabled={cleanedData.length === 0} className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Visualize
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="ai" disabled={cleanedData.length === 0} className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="shadow-elevated bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Upload Your Dataset
                </CardTitle>
                <CardDescription>
                  Upload a CSV file to begin your data analysis journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processFile(file);
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">Choose a CSV file</p>
                        <p className="text-muted-foreground">or drag and drop it here</p>
                      </div>
                    </div>
                  </Label>
                </div>
                
                {isProcessing && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-primary">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Processing file...
                    </div>
                  </div>
                )}

                {rawData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {rawData.length} rows
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {columns.length} columns
                      </Badge>
                      <Badge variant="outline">{fileName}</Badge>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-auto">
                      <h4 className="font-medium mb-2">Data Preview</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              {Object.keys(rawData[0] || {}).map(key => (
                                <th key={key} className="text-left p-2 font-medium">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rawData.slice(0, 10).map((row, i) => (
                              <tr key={i} className="border-b border-border/50">
                                {Object.values(row).map((value, j) => (
                                  <td key={j} className="p-2">{String(value)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Cleaning Tab */}
          <TabsContent value="clean" className="space-y-6">
            <Card className="shadow-elevated bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Data Cleaning & Preprocessing
                </CardTitle>
                <CardDescription>
                  Configure how to handle missing values and duplicates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {columns.map(column => (
                    <div key={column.name} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{column.name}</span>
                          <Badge variant={column.type === 'numeric' ? 'default' : column.type === 'categorical' ? 'secondary' : 'outline'}>
                            {column.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {column.missingCount} missing • {column.uniqueCount} unique values
                        </p>
                      </div>
                      
                      {column.missingCount > 0 && (
                        <Select 
                          value={column.strategy} 
                          onValueChange={(value) => {
                            setColumns(prev => prev.map(col => 
                              col.name === column.name ? { ...col, strategy: value as any } : col
                            ));
                          }}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="remove">Remove Row</SelectItem>
                            {column.type === 'numeric' && (
                              <SelectItem value="mean">Fill with Mean</SelectItem>
                            )}
                            <SelectItem value="mode">Fill with Mode</SelectItem>
                            <SelectItem value="none">Keep Missing</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Duplicate Rows</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove identical rows from your dataset
                    </p>
                  </div>
                  <Button variant="outline" onClick={applyDataCleaning} disabled={isProcessing}>
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Clean Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualize" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Automatic Charts */}
              <Card className="shadow-elevated bg-gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Automatic Insights
                  </CardTitle>
                  <CardDescription>
                    Generated visualizations based on your data types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {charts.map(chart => (
                    <div key={chart.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{chart.title}</h4>
                        <Button variant="outline" size="sm" onClick={() => addToDashboard(chart)}>
                          <Plus className="w-3 h-3" />
                          Add to Dashboard
                        </Button>
                      </div>
                      <div className="bg-card rounded-lg p-4 shadow-chart">
                        <ChartRenderer chart={chart} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Custom Chart Builder */}
              <Card className="shadow-elevated bg-gradient-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Custom Chart Builder
                  </CardTitle>
                  <CardDescription>
                    Create your own visualizations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="chart-type">Chart Type</Label>
                      <Select value={selectedChartType} onValueChange={setSelectedChartType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select chart type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="scatter">Scatter Plot</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="x-axis">X-Axis</Label>
                      <Select value={selectedXAxis} onValueChange={setSelectedXAxis}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select X-axis column" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map(col => (
                            <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="y-axis">Y-Axis</Label>
                      <Select value={selectedYAxis} onValueChange={setSelectedYAxis}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Y-axis column" />
                        </SelectTrigger>
                        <SelectContent>
                          {numericColumns.map(col => (
                            <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={createCustomChart} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Chart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card className="shadow-elevated bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Your Analytics Dashboard
                </CardTitle>
                <CardDescription>
                  Collection of your selected visualizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardCharts.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No charts added to dashboard yet</p>
                    <p className="text-sm text-muted-foreground">Go to Visualize tab to add charts</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {dashboardCharts.map(chart => (
                      <div key={chart.id} className="bg-card rounded-lg p-4 shadow-chart">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">{chart.title}</h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setDashboardCharts(prev => prev.filter(c => c.id !== chart.id))}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <ChartRenderer chart={chart} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card className="shadow-elevated bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI-Powered Data Insights
                </CardTitle>
                <CardDescription>
                  Ask questions about your data and get AI-powered answers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Key Input */}
                <div className="space-y-2">
                  <Label htmlFor="api-key">Gemini API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your Gemini API key"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from Google AI Studio. Your key is not stored anywhere.
                  </p>
                </div>

                {/* Chat Interface */}
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4 min-h-64 max-h-96 overflow-y-auto">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                        <p>Ask me anything about your data!</p>
                        <p className="text-sm">Try: "What are the main trends?" or "Which values are most common?"</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((message, index) => (
                          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                              message.type === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-card border'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask a question about your data..."
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
                      disabled={isLoadingAI}
                    />
                    <Button onClick={askQuestion} disabled={isLoadingAI}>
                      {isLoadingAI ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DataAnalysisDashboard;