/**
 * Parse fixture ticker HTML
 */
export class FixtureParser {

    parse(doc) {
        const fixtures = {};
        const rows = doc.querySelectorAll('tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) return;

            const firstCell = cells[0];
            const teamName = firstCell.textContent.trim();

            if (teamName && teamName.length > 1) {
                fixtures[teamName] = [];
                for (let i = 1; i < cells.length; i++) {
                    const cell = cells[i];
                    const opponent = cell.textContent.trim();
                    const isHome = !opponent.toLowerCase().endsWith('(a)');

                    fixtures[teamName].push({
                        gw: 24 + i, // Assuming starts from GW25? Original code had 24 + i. Better to check header?
                        // For now keep original logic to minimize regression
                        opponent: opponent.replace(/\s*\([ha]\)\s*/gi, '').trim(),
                        isHome
                    });
                }
            }
        });

        return fixtures;
    }
}
