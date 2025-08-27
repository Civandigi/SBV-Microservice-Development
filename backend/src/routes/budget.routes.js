// SBV Professional V2 - Budget Routes
// Budget and financial KPI endpoints

const router = require('express').Router();
const BudgetController = require('../controllers/budget.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All budget routes require authentication
router.use(authenticateToken);

// Get budget KPIs for dashboard
router.get('/kpis', BudgetController.getBudgetKPIs);

// Get detailed budget breakdown
router.get('/breakdown', BudgetController.getBudgetBreakdown);

// Debug route to check database data
router.get('/debug', async (req, res) => {
    const { query } = require('../config/database');
    try {
        // Check rapports in database
        const rapportResult = await query(`
            SELECT 
                id, 
                title, 
                category,
                status,
                created_at,
                EXTRACT(YEAR FROM created_at) as year
            FROM rapporte 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        // Check templates in database
        const templateResult = await query(`
            SELECT 
                teilprojekt,
                template_name,
                template_data->>'gesamtbudget' as budget
            FROM rapport_templates
            WHERE aktiv = true
        `);
        
        const rapports = Array.isArray(rapportResult) ? rapportResult : (rapportResult.rows || []);
        const templates = Array.isArray(templateResult) ? templateResult : (templateResult.rows || []);
        
        // Calculate total budget from templates
        let totalBudget = 0;
        templates.forEach(t => {
            const budget = parseInt(t.budget) || 0;
            totalBudget += budget;
        });
        
        res.json({
            success: true,
            rapports: {
                count: rapports.length,
                data: rapports
            },
            templates: {
                count: templates.length,
                data: templates,
                totalBudget: totalBudget
            },
            message: 'Debug data from database'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;