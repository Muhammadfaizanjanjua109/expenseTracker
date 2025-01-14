'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [newBudget, setNewBudget] = useState({
    category_id: '',
    amount: '',
    month: new Date().toISOString().slice(0, 7)
  });

  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/budgets', {
        headers: { Authorization: `Bearer ${token}` },
        params: { month: selectedMonth + '-01' }
      });
      // Convert string amounts to numbers
      const formattedBudgets = response.data.map(budget => ({
        ...budget,
        amount: parseFloat(budget.amount) || 0,
        spent_amount: parseFloat(budget.spent_amount) || 0,
        percentage_used: parseFloat(budget.percentage_used) || 0
      }));
      setBudgets(formattedBudgets);
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBudgets();
  }, [selectedMonth]);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/budgets',
        { ...newBudget, month: `${newBudget.month}-01` },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setIsDialogOpen(false);
      setNewBudget({
        category_id: '',
        amount: '',
        month: new Date().toISOString().slice(0, 7)
      });
      fetchBudgets();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/budgets/${editingBudget.id}`,
        { amount: editingBudget.amount },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setIsDialogOpen(false);
      setEditingBudget(null);
      fetchBudgets();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteBudget = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/budgets/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchBudgets();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getBudgetStatusColor = (percentageUsed) => {
    if (percentageUsed >= 100) return 'bg-red-600';
    if (percentageUsed >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Budget Management</CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-40"
              />
              <Calendar className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Set New Budget</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBudget ? 'Update Budget' : 'Set New Budget'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget} 
                    className="space-y-4">
                {!editingBudget && (
                  <select
                    className="w-full p-2 border rounded"
                    value={newBudget.category_id}
                    onChange={(e) => setNewBudget({...newBudget, category_id: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
                
                <Input
                  type="number"
                  placeholder="Budget Amount"
                  value={editingBudget ? editingBudget.amount : newBudget.amount}
                  onChange={(e) => {
                    if (editingBudget) {
                      setEditingBudget({...editingBudget, amount: e.target.value});
                    } else {
                      setNewBudget({...newBudget, amount: e.target.value});
                    }
                  }}
                  required
                  min="0"
                  step="0.01"
                />

                {!editingBudget && (
                  <Input
                    type="month"
                    value={newBudget.month}
                    onChange={(e) => setNewBudget({...newBudget, month: e.target.value})}
                    required
                  />
                )}

                <Button type="submit" className="w-full">
                  {editingBudget ? 'Update Budget' : 'Set Budget'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Budget Amount</TableHead>
                <TableHead>Spent Amount</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell>{budget.category_name}</TableCell>
                  <TableCell>${formatAmount(budget.amount)}</TableCell>
                  <TableCell>${ formatAmount(budget.spent_amount) }</TableCell>
                  <TableCell>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${getBudgetStatusColor(budget.percentage_used)}`}
                        style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {budget.percentage_used}% used
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingBudget(budget);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteBudget(budget.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetsPage;