// SBV Professional V2 - Budget Controller
// Provides budget statistics and calculations

const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');

class BudgetController {
    // Get budget KPIs for dashboard
    static getBudgetKPIs = asyncHandler(async (req, res) => {
        // Get year from query params, default to 2024
        const year = req.query.year || '2024';
        console.log(`📊 Getting budget KPIs for year: ${year}`);

        // Get budgets from database templates
        const templateResult = await query(`
            SELECT
                teilprojekt,
                template_name,
                template_data
            FROM rapport_templates
            WHERE aktiv = true
        `);

        const templates = Array.isArray(templateResult) ? templateResult : (templateResult.rows || []);

        // Build budget object from templates
        const yearBudget = {};
        let totalBudget = 0;

        templates.forEach(template => {
            // Parse JSON data from template_data string
            let budget = 0;
            try {
                const data = JSON.parse(template.template_data);
                budget = parseInt(data.budget || data.gesamtbudget) || 0;
            } catch (e) {
                console.log('Could not parse template data:', template.teilprojekt);
            }
            yearBudget[template.teilprojekt] = budget;
            totalBudget += budget;
        });

        console.log(`📊 Total budget from DB templates: CHF ${totalBudget.toLocaleString('de-CH')}`);

        let stats;
        let spent = 0;

        if (process.env.USE_SQLITE === 'true') {
            // Original queries for SQLite compatibility in tests
            let rapportQuery;
            let queryParams = [];
            if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
                rapportQuery = `
                    SELECT 
                        COUNT(*) as total_count,
                        SUM(CASE WHEN status = 'genehmigt' THEN 1 ELSE 0 END) as approved_count,
                        SUM(CASE WHEN status IN ('entwurf', 'eingereicht', 'in_bearbeitung', 'zur-pruefung') THEN 1 ELSE 0 END) as active_count
                    FROM rapporte
                    WHERE strftime('%Y', created_at) = ?
                `;
                queryParams = [year];
            } else {
                rapportQuery = `
                    SELECT 
                        COUNT(*) as total_count,
                        SUM(CASE WHEN status = 'genehmigt' THEN 1 ELSE 0 END) as approved_count,
                        SUM(CASE WHEN status IN ('entwurf', 'eingereicht', 'in_bearbeitung', 'zur-pruefung') THEN 1 ELSE 0 END) as active_count
                    FROM rapporte
                    WHERE author_id = ? AND strftime('%Y', created_at) = ?
                `;
                queryParams = [req.user.id, year];
            }
            const rapportResult = await query(rapportQuery, queryParams);
            stats = rapportResult.rows?.[0] || rapportResult[0] || { total_count: 0, approved_count: 0, active_count: 0 };

            if (stats.approved_count > 0) {
                let spentQuery;
                let spentParams = [];
                if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
                    spentQuery = `SELECT content FROM rapporte WHERE status = 'genehmigt' AND strftime('%Y', created_at) = ?`;
                    spentParams = [year];
                } else {
                    spentQuery = `SELECT content FROM rapporte WHERE author_id = ? AND status = 'genehmigt' AND strftime('%Y', created_at) = ?`;
                    spentParams = [req.user.id, year];
                }
                const spentResult = await query(spentQuery, spentParams);
                const approvedRapports = Array.isArray(spentResult) ? spentResult : (spentResult.rows || []);
                approvedRapports.forEach(rapport => {
                    try {
                        const content = typeof rapport.content === 'string' ? JSON.parse(rapport.content) : rapport.content;
                        const amount = parseFloat(content.istBrutto) || parseFloat(content.budgetBrutto) || 0;
                        spent += amount;
                    } catch (e) {
                        console.log('Could not parse rapport content:', e);
                    }
                });
            }
        } else {
            // Optimized query for PostgreSQL
            const startDate = `${year}-01-01`;
            const endDate = `${parseInt(year) + 1}-01-01`;
            let rapportQuery;
            let queryParams = [];
            const baseQuery = `
                SELECT
                    COUNT(*) as total_count,
                    SUM(CASE WHEN status = 'genehmigt' THEN 1 ELSE 0 END) as approved_count,
                    SUM(CASE WHEN status IN ('entwurf', 'eingereicht', 'in_bearbeitung', 'zur-pruefung') THEN 1 ELSE 0 END) as active_count,
                    SUM(
                        CASE
                            WHEN status = 'genehmigt' THEN
                                COALESCE(
                                    (content->>'istBrutto')::numeric,
                                    (content->>'budgetBrutto')::numeric,
                                    0
                                )
                            ELSE 0
                        END
                    ) as total_spent
                FROM rapporte
            `;

            if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
                rapportQuery = `${baseQuery} WHERE created_at >= $1 AND created_at < $2`;
                queryParams = [startDate, endDate];
            } else {
                rapportQuery = `${baseQuery} WHERE author_id = $1 AND created_at >= $2 AND created_at < $3`;
                queryParams = [req.user.id, startDate, endDate];
            }
            const rapportResult = await query(rapportQuery, queryParams);
            stats = rapportResult.rows?.[0] || rapportResult[0] || { total_count: 0, approved_count: 0, active_count: 0, total_spent: 0 };
            spent = parseFloat(stats.total_spent || 0);
        }

        console.log(`💰 Calculated spent amount: CHF ${spent.toLocaleString('de-CH')}`);

        // Calculate utilization percentage
        const utilization = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

        // Get active rapports count
        const activeReports = parseInt(stats.active_count || 0);

        // Calculate KPI achievement based on various factors
        let kpiAchievement = 0;
        if (stats.total_count > 0) {
            // Base KPI on rapport completion rate and budget efficiency
            const completionRate = (stats.approved_count / stats.total_count) * 100;
            const budgetEfficiency = utilization > 0 ? Math.min(100, (utilization / 80) * 100) : 0;
            kpiAchievement = Math.round((completionRate + budgetEfficiency) / 2);
        }

        // Prepare response with detailed information
        const response = {
            success: true,
            year: year,                        // Current year being viewed
            totalBudget: totalBudget,         // Budget for the selected year
            spent: spent,                      // Actual calculated expenses
            utilization: utilization,          // Percentage of budget used
            openReports: activeReports,        // Count of active reports
            kpiAchievement: kpiAchievement,    // Overall KPI achievement %
            budgetByTeilprojekt: yearBudget,  // Budget breakdown for the year
            // Additional debug info
            debug: {
                year: year,
                totalRapports: parseInt(stats.total_count || 0),
                approvedRapports: parseInt(stats.approved_count || 0),
                budgetFromTemplates: totalBudget,
                calculation: spent > 0 ?
                    `${stats.approved_count} genehmigte Rapporte mit Gesamtausgaben von CHF ${spent.toLocaleString('de-CH')}` :
                    totalBudget === 0 ?
                        'Keine Templates in Datenbank gefunden' :
                        'Keine genehmigten Rapporte vorhanden'
            }
        };

        console.log('📊 Budget KPIs calculated:', {
            totalBudget: response.totalBudget,
            spent: response.spent,
            utilization: response.utilization + '%',
            activeReports: response.openReports
        });

        res.json(response);
    });

    // Get detailed budget breakdown
    static getBudgetBreakdown = asyncHandler(async (req, res) => {
        const TEILPROJEKTE = {
            'TP1_Leitmedien': {
                name: 'TP1 - Leitmedien',
                budget: 1590000,
                massnahmen: [
                    { name: 'Mediakampagne', budget: 830000 },
                    { name: 'Werbeartikel', budget: 470000 },
                    { name: 'Sachinformation', budget: 110000 },
                    { name: 'Jahresaktion', budget: 0 },
                    { name: 'Projektentwicklung', budget: 180000 }
                ]
            },
            'TP2_DigitaleMedien': {
                name: 'TP2 - Digitale Medien',
                budget: 490000,
                massnahmen: [
                    { name: 'Internetprojekte', budget: 280000 },
                    { name: 'Social Media', budget: 210000 }
                ]
            },
            'TP3_Messen': {
                name: 'TP3 - Messen & Ausstellungen',
                budget: 630000,
                massnahmen: [
                    { name: 'Messen & Ausstellungen', budget: 630000 }
                ]
            },
            'TP4_Basiskommunikation': {
                name: 'TP4 - Basiskommunikation',
                budget: 470000,
                massnahmen: [
                    { name: 'Vom Hof', budget: 80000 },
                    { name: 'Stallvisite', budget: 80000 },
                    { name: 'Tag der offenen Hoftüren', budget: 10000 },
                    { name: 'Lockpfosten', budget: 10000 },
                    { name: 'Buurehof id Stadt', budget: 145000 },
                    { name: 'Landwirtschaft im Fokus', budget: 145000 }
                ]
            },
            'TP5_Schule': {
                name: 'TP5 - Schule',
                budget: 140000,
                massnahmen: [
                    { name: 'Schulprojekt', budget: 140000 }
                ]
            },
            'TP6_Partnerprojekte': {
                name: 'TP6 - Partnerprojekte',
                budget: 1090000,
                massnahmen: [
                    { name: 'Agro-Image', budget: 70000 },
                    { name: 'Agriviva', budget: 110000 },
                    { name: 'Kantonale Ergänzungsprojekte', budget: 890000 },
                    { name: 'Ergänzende Projekte', budget: 20000 }
                ]
            }
        };

        // Calculate spent amounts per Teilprojekt
        // In a real system, this would aggregate from actual rapport data
        const breakdown = {};
        for (const [key, tp] of Object.entries(TEILPROJEKTE)) {
            breakdown[key] = {
                ...tp,
                spent: 0,  // Would be calculated from actual rapport data
                utilization: 0
            };
        }

        res.json({
            success: true,
            breakdown: breakdown,
            totalBudget: Object.values(TEILPROJEKTE).reduce((sum, tp) => sum + tp.budget, 0)
        });
    });
}

module.exports = BudgetController;