'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Calendar,
  BarChart,
  Table
} from 'lucide-react';
import axios from 'axios';

const ExportPage = () => {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  const [monthlyReport, setMonthlyReport] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleTransactionExport = async (format) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        format,
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      const response = await axios.get(
        `http://localhost:5000/api/export/transactions?${params.toString()}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob'
        }
      );
      
      // Create and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `transactions_${dateRange.startDate || 'all'}_to_${dateRange.endDate || 'all'}.${format}`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess(`Successfully exported transactions as ${format.toUpperCase()}`);
    } catch (err) {
      setError('Failed to export transactions. Please try again.');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthlyReportExport = async (format) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `http://localhost:5000/api/export/monthly-report?year=${monthlyReport.year}&month=${monthlyReport.month}&format=${format}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob'
        }
      );
      
      // Create and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `monthly_report_${monthlyReport.year}_${monthlyReport.month}.${format}`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess(`Successfully exported monthly report as ${format.toUpperCase()}`);
    } catch (err) {
      setError('Failed to export monthly report. Please try again.');
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Transaction Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="w-5 h-5" />
            Export Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50">
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Date Range Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <Button 
                  className="w-full h-full flex flex-col items-center justify-center gap-2 p-8"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => handleTransactionExport('csv')}
                >
                  <FileText className="w-12 h-12" />
                  <span className="text-lg font-medium">Export as CSV</span>
                  <span className="text-sm text-gray-500">
                    Download transactions in CSV format
                  </span>
                </Button>
              </Card>

              <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <Button 
                  className="w-full h-full flex flex-col items-center justify-center gap-2 p-8"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => handleTransactionExport('excel')}
                >
                  <FileSpreadsheet className="w-12 h-12" />
                  <span className="text-lg font-medium">Export as Excel</span>
                  <span className="text-sm text-gray-500">
                    Download transactions in Excel format
                  </span>
                </Button>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Report Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Export Monthly Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Month Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Input
                  type="number"
                  value={monthlyReport.year}
                  onChange={(e) => setMonthlyReport({ ...monthlyReport, year: e.target.value })}
                  min="2000"
                  max="2100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={monthlyReport.month}
                  onChange={(e) => setMonthlyReport({ ...monthlyReport, month: e.target.value })}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <Button 
                  className="w-full h-full flex flex-col items-center justify-center gap-2 p-8"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => handleMonthlyReportExport('csv')}
                >
                  <FileText className="w-12 h-12" />
                  <span className="text-lg font-medium">Export Report as CSV</span>
                  <span className="text-sm text-gray-500">
                    Download monthly report in CSV format
                  </span>
                </Button>
              </Card>

              <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <Button 
                  className="w-full h-full flex flex-col items-center justify-center gap-2 p-8"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => handleMonthlyReportExport('excel')}
                >
                  <FileSpreadsheet className="w-12 h-12" />
                  <span className="text-lg font-medium">Export Report as Excel</span>
                  <span className="text-sm text-gray-500">
                    Download monthly report in Excel format
                  </span>
                </Button>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportPage;