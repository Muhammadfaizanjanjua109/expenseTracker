// src/controllers/exportController.js
const pool = require('../config/db');
const excel = require('exceljs');
const { Parser } = require('json2csv');

const exportController = {
    exportTransactions: async (req, res) => {
        try {
            const userId = req.userId;
            const { format, startDate, endDate } = req.query;

            // Build query with date filters
            let query = `
                SELECT 
                    t.date,
                    t.amount,
                    t.type,
                    t.description,
                    c.name as category,
                    t.created_at
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = $1
            `;
            const queryParams = [userId];

            if (startDate) {
                query += ' AND t.date >= $2';
                queryParams.push(startDate);
            }
            if (endDate) {
                query += ' AND t.date <= $' + (queryParams.length + 1);
                queryParams.push(endDate);
            }

            query += ' ORDER BY t.date DESC';

            const result = await pool.query(query, queryParams);
            const transactions = result.rows;

            if (format === 'csv') {
                return await exportToCSV(transactions, res);
            } else {
                return await exportToExcel(transactions, res);
            }

        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({ message: 'Failed to export data' });
        }
    },

    exportMonthlyReport: async (req, res) => {
        try {
            const userId = req.userId;
            const { year, month, format } = req.query;

            // Get monthly summary
            const summaryQuery = `
                SELECT 
                    c.name as category,
                    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses,
                    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
                    b.amount as budget,
                    COUNT(*) as transaction_count
                FROM categories c
                LEFT JOIN transactions t ON t.category_id = c.id 
                    AND EXTRACT(YEAR FROM t.date) = $2
                    AND EXTRACT(MONTH FROM t.date) = $3
                LEFT JOIN budgets b ON b.category_id = c.id
                    AND EXTRACT(YEAR FROM b.month) = $2
                    AND EXTRACT(MONTH FROM b.month) = $3
                WHERE c.user_id = $1
                GROUP BY c.name, b.amount
            `;

            const result = await pool.query(summaryQuery, [userId, year, month]);
            const summary = result.rows;

            if (format === 'csv') {
                return await exportMonthlyToCSV(summary, year, month, res);
            } else {
                return await exportMonthlyToExcel(summary, year, month, res);
            }

        } catch (error) {
            console.error('Monthly report export error:', error);
            res.status(500).json({ message: 'Failed to export monthly report' });
        }
    }
};

// Helper function to export to CSV
async function exportToCSV(data, res) {
    try {
        const fields = ['date', 'amount', 'type', 'category', 'description', 'created_at'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment('transactions.csv');
        return res.send(csv);
    } catch (error) {
        throw error;
    }
}

// Helper function to export to Excel
async function exportToExcel(data, res) {
    try {
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Transactions');

        // Add headers
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Description', key: 'description', width: 30 },
            { header: 'Created At', key: 'created_at', width: 20 }
        ];

        // Add style to header row
        worksheet.getRow(1).font = { bold: true };

        // Add data
        worksheet.addRows(data);

        // Format date columns
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.getCell('date').numFmt = 'yyyy-mm-dd';
                row.getCell('created_at').numFmt = 'yyyy-mm-dd hh:mm:ss';
            }
        });

        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.header('Content-Disposition', 'attachment; filename=transactions.xlsx');

        return await workbook.xlsx.write(res);
    } catch (error) {
        throw error;
    }
}

// Helper function to export monthly report to CSV
async function exportMonthlyToCSV(data, year, month, res) {
    try {
        const fields = ['category', 'expenses', 'income', 'budget', 'transaction_count'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment(`monthly_report_${year}_${month}.csv`);
        return res.send(csv);
    } catch (error) {
        throw error;
    }
}

// Helper function to export monthly report to Excel
async function exportMonthlyToExcel(data, year, month, res) {
    try {
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Monthly Report');

        // Add headers
        worksheet.columns = [
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Expenses', key: 'expenses', width: 15 },
            { header: 'Income', key: 'income', width: 15 },
            { header: 'Budget', key: 'budget', width: 15 },
            { header: 'Transaction Count', key: 'transaction_count', width: 20 }
        ];

        // Add style to header row
        worksheet.getRow(1).font = { bold: true };

        // Add data
        worksheet.addRows(data);

        // Add summary
        const totalExpenses = data.reduce((sum, row) => sum + Number(row.expenses || 0), 0);
        const totalIncome = data.reduce((sum, row) => sum + Number(row.income || 0), 0);
        const totalBudget = data.reduce((sum, row) => sum + Number(row.budget || 0), 0);

        worksheet.addRow({});
        worksheet.addRow({
            category: 'TOTALS',
            expenses: totalExpenses,
            income: totalIncome,
            budget: totalBudget
        }).font = { bold: true };

        res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.header('Content-Disposition', `attachment; filename=monthly_report_${year}_${month}.xlsx`);

        return await workbook.xlsx.write(res);
    } catch (error) {
        throw error;
    }
}

module.exports = exportController;