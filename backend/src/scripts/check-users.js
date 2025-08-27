// Script zum Prüfen der echten User in der Datenbank
const { query } = require('../config/database');

async function checkUsers() {
    console.log('👥 Prüfe User in der Datenbank...\n');
    
    try {
        // Hole alle User
        const users = await query('SELECT id, name, email, role FROM users');
        const userList = Array.isArray(users) ? users : (users.rows || []);
        
        console.log(`📊 Anzahl User: ${userList.length}\n`);
        
        if (userList.length > 0) {
            console.log('User in der Datenbank:');
            console.log('=======================');
            userList.forEach(user => {
                console.log(`ID: ${user.id}`);
                console.log(`Name: ${user.name}`);
                console.log(`Email: ${user.email}`);
                console.log(`Rolle: ${user.role}`);
                console.log('-----------------------');
            });
        }
        
        // Prüfe welche User Rapporte haben
        console.log('\n📝 Rapporte pro User:');
        console.log('=====================');
        
        const rapporte = await query(`
            SELECT r.author_id, u.name, u.email, COUNT(*) as rapport_count
            FROM rapporte r
            LEFT JOIN users u ON r.author_id = u.id
            GROUP BY r.author_id, u.name, u.email
        `);
        
        const rapportList = Array.isArray(rapporte) ? rapporte : (rapporte.rows || []);
        
        rapportList.forEach(item => {
            console.log(`${item.name || 'Unbekannt'} (${item.email || 'keine Email'}): ${item.rapport_count} Rapport(e)`);
        });
        
    } catch (error) {
        console.error('❌ Fehler:', error);
    }
}

// Führe Check aus
if (require.main === module) {
    checkUsers().then(() => {
        console.log('\n✅ Check abgeschlossen');
        process.exit(0);
    }).catch(err => {
        console.error('❌ Fehler:', err);
        process.exit(1);
    });
}

module.exports = checkUsers;