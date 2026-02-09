/**
 * Parse Team Stats HTML
 */
export class TeamStatsParser {

    parse(doc) {
        const rows = doc.querySelectorAll('tr');
        const teams = {};

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) return;

            const firstCell = cells[0];
            const teamLink = firstCell.querySelector('a');

            // Prefer oldtitle from cell or link, fall back to text
            const teamName = firstCell.getAttribute('oldtitle') ||
                (teamLink && teamLink.getAttribute('oldtitle')) ||
                firstCell.textContent.trim();

            if (!teamName || teamName.length < 2) return;

            const teamData = { team: teamName };

            cells.forEach(cell => {
                const oldtitle = cell.getAttribute('oldtitle');
                if (!oldtitle) return;

                const match = oldtitle.match(/^(.+?):\s*(.+)$/);
                if (match) {
                    const statName = match[1].trim();
                    const statValue = match[2].trim();
                    const numValue = parseFloat(statValue.replace(/,/g, ''));
                    teamData[statName] = isNaN(numValue) ? statValue : numValue;
                }
            });

            if (Object.keys(teamData).length > 1) {
                teams[teamName] = teamData;
            }
        });

        return teams;
    }
}
