// SBV Professional V2 - Budget Controller
// Provides budget statistics and calculations

const { query } = require('../config/database');

class BudgetController {
    // Get budget KPIs for dashboard
    static async getBudgetKPIs(req, res) {
        try {
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
            
            // Get rapport statistics and calculate actual spent amount
            // Filter by user if not admin and by year
            let rapportQuery;
            let queryParams = [];
            
            if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
                // Admins see all rapports filtered by year
                rapportQuery = `
                    SELECT 
                        COUNT(*) as total_count,
                        SUM(CASE WHEN status = 'genehmigt' THEN 1 ELSE 0 END) as approved_count,
                        SUM(CASE WHEN status IN ('entwurf', 'eingereicht', 'in_bearbeitung', 'zur-pruefung') THEN 1 ELSE 0 END) as active_count
                    FROM rapporte
                    WHERE EXTRACT(YEAR FROM created_at) = $1
                `;
                queryParams = [parseInt(year)];
            } else {
                // Users see only their own rapports filtered by year
                rapportQuery = `
                    SELECT 
                        COUNT(*) as total_count,
                        SUM(CASE WHEN status = 'genehmigt' THEN 1 ELSE 0 END) as approved_count,
                        SUM(CASE WHEN status IN ('entwurf', 'eingereicht', 'in_bearbeitung', 'zur-pruefung') THEN 1 ELSE 0 END) as active_count
                    FROM rapporte
                    WHERE author_id = $1 AND EXTRACT(YEAR FROM created_at) = $2
                `;
                queryParams = [req.user.id, parseInt(year)];
            }
            
            const rapportResult = await query(rapportQuery, queryParams);
            const stats = rapportResult.rows?.[0] || rapportResult[0] || { 
                total_count: 0, 
                approved_count: 0, 
                active_count: 0 
            };
            
            // Calculate spent amount from actual rapport data
            let spent = 0;
            
            // Get approved rapports and sum their budgets
            if (stats.approved_count > 0) {
                let spentQuery;
                let spentParams = [];
                
                if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
                    // Admins see all approved rapports
                    spentQuery = `
                        SELECT content
                        FROM rapporte
                        WHERE status = 'genehmigt' 
                        AND EXTRACT(YEAR FROM created_at) = $1
                    `;
                    spentParams = [parseInt(year)];
                } else {
                    // Users see only their approved rapports
                    spentQuery = `
                        SELECT content
                        FROM rapporte
                        WHERE author_id = $1 
                        AND status = 'genehmigt'
                        AND EXTRACT(YEAR FROM created_at) = $2
                    `;
                    spentParams = [req.user.id, parseInt(year)];
                }
                
                const spentResult = await query(spentQuery, spentParams);
                const approvedRapports = Array.isArray(spentResult) ? spentResult : (spentResult.rows || []);
                
                // Sum up budgets from approved rapports
                approvedRapports.forEach(rapport => {
                    try {
                        const content = typeof rapport.content === 'string' ? 
                            JSON.parse(rapport.content) : rapport.content;
                        
                        // Add istBrutto if available, otherwise budgetBrutto
                        const amount = parseFloat(content.istBrutto) || parseFloat(content.budgetBrutto) || 0;
                        spent += amount;
                    } catch (e) {
                        console.log('Could not parse rapport content:', e);
                    }
                });
                
                console.log(`💰 Calculated spent amount: CHF ${spent.toLocaleString('de-CH')}`);
            }
            
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
            
        } catch (error) {
            console.error('Budget KPI error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Laden der Budget-KPIs',
                error: error.message
            });
        }
    }
    
    // Get detailed budget breakdown
    static async getBudgetBreakdown(req, res) {
        try {
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
            
        } catch (error) {
            console.error('Budget breakdown error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Laden der Budget-Aufschlüsselung'
            });
        }
    }
}

module.exports = BudgetController;