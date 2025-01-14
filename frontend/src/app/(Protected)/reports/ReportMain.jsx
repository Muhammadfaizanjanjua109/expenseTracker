'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Download } from 'lucide-react';
import axios from 'axios';

const ReportsPage = () => {
  const [monthlyData, setMonthlyData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [spendingTrends, setSpendingTrends] = useState([]);
  const [budgetComparison, setBudgetComparison] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };
  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const month = parseInt(selectedMonth.split('-')[1]);
      const year = parseInt(selectedMonth.split('-')[0]);

      // Fetch all reports in parallel
      const [monthlyResponse, categoryResponse, trendsResponse, budgetResponse] = await Promise.all([
        axios.get(
          `http://localhost:5000/api/reports/monthly?month=${month}&year=${year}`,
          { headers }
        ),
        axios.get(
          'http://localhost:5000/api/reports/category-expenses',
          { 
            headers,
            params: {
              startDate: `${selectedMonth}-01`,
              endDate: `${selectedMonth}-31`
            }
          }
        ),
        axios.get(
          'http://localhost:5000/api/reports/spending-trends',
          { headers }
        ),
        axios.get(
          `http://localhost:5000/api/reports/budget-comparison?month=${month}&year=${year}`,
          { headers }
        )
      ]);

      setMonthlyData(monthlyResponse.data);
      setCategoryData(categoryResponse.data);
      setSpendingTrends(trendsResponse.data);
      setBudgetComparison(budgetResponse.data);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth]);

  const handleExportData = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/export?format=${format}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_report_${selectedMonth}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export data');
    }
  };

  if (isLoading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Time Period Selection and Export */}
      <div className="flex justify-between items-center">
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-40"
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportData('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExportData('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Monthly Overview */}
      {monthlyData && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-100 rounded-lg">
                <h3 className="text-lg font-semibold">Total Income</h3>
                <p className="text-2xl text-green-600">
                  ${formatAmount(monthlyData.totals.total_income)}
                </p>
              </div>
              <div className="p-4 bg-red-100 rounded-lg">
                <h3 className="text-lg font-semibold">Total Expenses</h3>
                <p className="text-2xl text-red-600">
                  ${formatAmount(monthlyData.totals.total_expenses)}
                </p>
              </div>
              <div className="p-4 bg-blue-100 rounded-lg">
                <h3 className="text-lg font-semibold">Net Savings</h3>
                <p className="text-2xl text-blue-600">
                  ${formatAmount(monthlyData.totals.net_savings)}
                  <span className="text-sm ml-2">
                    ({monthlyData.totals.savings_percentage}%)
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="total_amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({name, percent}) => `${name} (${(percent * 100).toFixed(1)}%)`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${formatAmount(value)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis dataKey="category" type="category" width={100} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="utilization_percentage" fill="#8884d8">
                  {budgetComparison.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.utilization_percentage > 100 ? '#ef4444' : '#22c55e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Spending Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spendingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value) => `$${formatAmount(value)}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                name="Expenses" 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#22c55e" 
                name="Income"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Summary Table */}
      {monthlyData && monthlyData.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Budget</th>
                    <th className="text-right p-2">Spent</th>
                    <th className="text-right p-2">Remaining</th>
                    <th className="text-right p-2">% Used</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.summary.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.category}</td>
                      <td className="text-right p-2">
                        ${formatAmount(item.budget_amount) || '0.00'}
                      </td>
                      <td className="text-right p-2">
                        ${formatAmount(item.total_expenses)}
                      </td>
                      <td className="text-right p-2">
                        ${(formatAmount((item.budget_amount || 0) - item.total_expenses))}
                      </td>
                      <td className="text-right p-2">
                        <span className={
                          item.budget_utilized_percentage > 100 
                            ? 'text-red-600' 
                            : item.budget_utilized_percentage > 80 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                        }>
                          {item.budget_utilized_percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;