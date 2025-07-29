import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Sparkles, 
  Download,
  Filter,
  Search,
  TrendingUp,
  Database
} from 'lucide-react';
import Papa from 'papaparse';
import Plot from 'react-plotly.js';

interface DataRow {
  [key: string]: any;
}

interface Column {
  name: string;
  type: 'numeric' | 'categorical' | 'date';
  missingValues: number;
  uniqueValues: number;
  stats?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    mode?: string;
  };
}

const MinimalistDataDashboard = () => {
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChart, setSelectedChart] = useState('');
  const { toast } = useToast();

  const detectColumnType = (values: any[]): 'numeric' | 'categorical' | 'date' => {
    const cleanValues = values.filter(v => v !== null && v !== undefined && v !== '');
    if (cleanValues.length === 0) return 'categorical';

    const numericCount = cleanValues.filter(v => !isNaN(Number(v))).length;
    const numericRatio = numericCount / cleanValues.length;

    if (numericRatio > 0.8) return 'numeric';

    const dateCount = cleanValues.filter(v => !isNaN(Date.parse(v))).length;
    const dateRatio = dateCount / cleanValues.length;

    if (dateRatio > 0.6) return 'date';

    return 'categorical';
  };

  const analyzeData = useCallback((csvData: DataRow[]) => {
    if (!csvData.length) return [];

    const columnNames = Object.keys(csvData[0]);
    
    return columnNames.map(name => {
      const values = csvData.map(row => row[name]);
      const cleanValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const type = detectColumnType(values);
      
      let stats = {};
      if (type === 'numeric') {
        const numericValues = cleanValues.map(Number).filter(n => !isNaN(n));
        if (numericValues.length > 0) {
          stats = {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            median: numericValues.sort()[Math.floor(numericValues.length / 2)]
          };
        }
      } else if (type === 'categorical') {
        const frequencies = cleanValues.reduce((acc: any, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});
        const mode = Object.keys(frequencies).reduce((a, b) => 
          frequencies[a] > frequencies[b] ? a : b
        );
        stats = { mode };
      }

      return {
        name,
        type,
        missingValues: values.length - cleanValues.length,
        uniqueValues: new Set(cleanValues).size,
        stats
      };
    });
  }, []);

  const processFile = useCallback(async (file: File) => {
    setLoading(true);
    
    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            toast({
              title: "Import Warning",
              description: `${results.errors.length} parsing errors occurred`,
              variant: "destructive"
            });
          }

          const csvData = results.data as DataRow[];
          setData(csvData);
          
          const analyzedColumns = analyzeData(csvData);
          setColumns(analyzedColumns);
          
          setActiveTab('explore');
          
          toast({
            title: "Data Imported",
            description: `Successfully imported ${csvData.length} rows with ${analyzedColumns.length} columns`
          });
          
          setLoading(false);
        },
        error: (error) => {
          toast({
            title: "Import Error",
            description: error.message,
            variant: "destructive"
          });
          setLoading(false);
        }
      });
    } catch (error) {
      toast({
        title: "File Processing Error",
        description: "Failed to process the file",
        variant: "destructive"
      });
      setLoading(false);
    }
  }, [analyzeData, toast]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      processFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
    }
  };

  const numericColumns = useMemo(() => 
    columns.filter(col => col.type === 'numeric'), [columns]);
  
  const categoricalColumns = useMemo(() => 
    columns.filter(col => col.type === 'categorical'), [columns]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const createScatterPlot = (xCol: string, yCol: string) => {
    const xValues = data.map(row => Number(row[xCol])).filter(v => !isNaN(v));
    const yValues = data.map(row => Number(row[yCol])).filter(v => !isNaN(v));

    return (
      <Plot
        data={[{
          x: xValues,
          y: yValues,
          type: 'scatter',
          mode: 'markers',
          marker: {
            color: 'hsl(220, 85%, 60%)',
            size: 8,
            opacity: 0.7
          },
          name: `${yCol} vs ${xCol}`
        }]}
        layout={{
          title: {
            text: `${yCol} vs ${xCol}`,
            font: { family: 'system-ui', size: 16 }
          },
          xaxis: { title: xCol, gridcolor: 'hsl(220, 10%, 92%)' },
          yaxis: { title: yCol, gridcolor: 'hsl(220, 10%, 92%)' },
          plot_bgcolor: 'hsl(0, 0%, 100%)',
          paper_bgcolor: 'hsl(0, 0%, 100%)',
          margin: { t: 50, r: 20, b: 50, l: 50 }
        }}
        style={{ width: '100%', height: '400px' }}
        config={{ displayModeBar: false }}
      />
    );
  };

  const createBarChart = (column: string) => {
    const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
    const frequencies = values.reduce((acc: any, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    const sortedEntries = Object.entries(frequencies)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 20);

    return (
      <Plot
        data={[{
          x: sortedEntries.map(([key]) => key),
          y: sortedEntries.map(([,value]) => value as number),
          type: 'bar',
          marker: {
            color: 'hsl(220, 85%, 60%)',
            opacity: 0.8
          },
          name: column
        }]}
        layout={{
          title: {
            text: `Distribution of ${column}`,
            font: { family: 'system-ui', size: 16 }
          },
          xaxis: { title: column, gridcolor: 'hsl(220, 10%, 92%)' },
          yaxis: { title: 'Count', gridcolor: 'hsl(220, 10%, 92%)' },
          plot_bgcolor: 'hsl(0, 0%, 100%)',
          paper_bgcolor: 'hsl(0, 0%, 100%)',
          margin: { t: 50, r: 20, b: 100, l: 50 }
        }}
        style={{ width: '100%', height: '400px' }}
        config={{ displayModeBar: false }}
      />
    );
  };

  const createHistogram = (column: string) => {
    const values = data.map(row => Number(row[column])).filter(v => !isNaN(v));

    return (
      <Plot
        data={[{
          x: values,
          type: 'histogram',
          marker: {
            color: 'hsl(220, 85%, 60%)',
            opacity: 0.8
          },
          name: column
        }]}
        layout={{
          title: {
            text: `Distribution of ${column}`,
            font: { family: 'system-ui', size: 16 }
          },
          xaxis: { title: column, gridcolor: 'hsl(220, 10%, 92%)' },
          yaxis: { title: 'Frequency', gridcolor: 'hsl(220, 10%, 92%)' },
          plot_bgcolor: 'hsl(0, 0%, 100%)',
          paper_bgcolor: 'hsl(0, 0%, 100%)',
          margin: { t: 50, r: 20, b: 50, l: 50 }
        }}
        style={{ width: '100%', height: '400px' }}
        config={{ displayModeBar: false }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-light text-foreground">Data Analytics</h1>
        <p className="text-muted-foreground">Minimalist data exploration and visualization</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30">
          <TabsTrigger value="upload" className="data-[state=active]:bg-card">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="explore" className="data-[state=active]:bg-card">
            <Database className="h-4 w-4 mr-2" />
            Explore
          </TabsTrigger>
          <TabsTrigger value="visualize" className="data-[state=active]:bg-card">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visualize
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-card">
            <Sparkles className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="shadow-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-light">Import Your Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Drag and drop your CSV file here, or</p>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={loading}
                    />
                    <Button variant="outline" className="cursor-pointer" disabled={loading}>
                      {loading ? 'Processing...' : 'Browse Files'}
                    </Button>
                  </label>
                </div>
              </div>
              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing data...</span>
                    <span>Please wait</span>
                  </div>
                  <Progress value={undefined} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Explore Tab */}
        <TabsContent value="explore" className="space-y-6">
          {data.length > 0 ? (
            <>
              {/* Data Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Database className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-light">{data.length.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Rows</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-light">{columns.length}</p>
                        <p className="text-sm text-muted-foreground">Columns</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-light">{numericColumns.length}</p>
                        <p className="text-sm text-muted-foreground">Numeric</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Column Analysis */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-light">Column Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {columns.map((column) => (
                      <div key={column.name} className="border border-border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{column.name}</h4>
                          <Badge variant="outline">{column.type}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Missing: </span>
                            <span>{column.missingValues}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Unique: </span>
                            <span>{column.uniqueValues}</span>
                          </div>
                          {column.stats?.mean && (
                            <div>
                              <span className="text-muted-foreground">Mean: </span>
                              <span>{column.stats.mean.toFixed(2)}</span>
                            </div>
                          )}
                          {column.stats?.mode && (
                            <div>
                              <span className="text-muted-foreground">Mode: </span>
                              <span>{column.stats.mode}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Data Preview */}
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-light">Data Preview</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search data..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.slice(0, 6).map((column) => (
                            <TableHead key={column.name}>{column.name}</TableHead>
                          ))}
                          {columns.length > 6 && <TableHead>...</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.slice(0, 10).map((row, index) => (
                          <TableRow key={index}>
                            {columns.slice(0, 6).map((column) => (
                              <TableCell key={column.name}>
                                {String(row[column.name] || '').slice(0, 30)}
                              </TableCell>
                            ))}
                            {columns.length > 6 && <TableCell>...</TableCell>}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredData.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing 10 of {filteredData.length} rows
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="shadow-card">
              <CardContent className="text-center py-12">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No data to explore. Please upload a CSV file first.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Visualize Tab */}
        <TabsContent value="visualize" className="space-y-6">
          {data.length > 0 ? (
            <>
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-light">Create Visualizations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedChart} onValueChange={setSelectedChart}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a visualization type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scatter">Scatter Plot</SelectItem>
                      <SelectItem value="histogram">Histogram</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scatter plots for numeric columns */}
                {numericColumns.length >= 2 && (
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="font-light">Correlation Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {createScatterPlot(numericColumns[0].name, numericColumns[1].name)}
                    </CardContent>
                  </Card>
                )}

                {/* Histograms for numeric columns */}
                {numericColumns.slice(0, 2).map((column) => (
                  <Card key={`hist-${column.name}`} className="shadow-card">
                    <CardHeader>
                      <CardTitle className="font-light">Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {createHistogram(column.name)}
                    </CardContent>
                  </Card>
                ))}

                {/* Bar charts for categorical columns */}
                {categoricalColumns.slice(0, 2).map((column) => (
                  <Card key={`bar-${column.name}`} className="shadow-card">
                    <CardHeader>
                      <CardTitle className="font-light">Category Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {createBarChart(column.name)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="shadow-card">
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No data to visualize. Please upload a CSV file first.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-light">Data Quality</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {columns.map((column) => {
                    const completeness = ((data.length - column.missingValues) / data.length) * 100;
                    return (
                      <div key={column.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{column.name}</span>
                          <span>{completeness.toFixed(1)}% complete</span>
                        </div>
                        <Progress value={completeness} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-light">Column Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Numeric</span>
                      <Badge variant="outline">{numericColumns.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Categorical</span>
                      <Badge variant="outline">{categoricalColumns.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <Badge variant="outline">
                        {columns.filter(col => col.type === 'date').length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="shadow-card">
              <CardContent className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No insights available. Please upload a CSV file first.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MinimalistDataDashboard;