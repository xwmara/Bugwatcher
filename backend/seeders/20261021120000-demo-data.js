'use strict';

/**
 * Demo data for the live demo and for local development:
 * a team of two MPs, two projects, two testers and a set of bugs in different states.
 *
 * Run:   npm run db:seed       (needs DEMO_PASSWORD in backend/.env)
 * Undo:  npm run db:seed:undo
 *
 * All demo accounts use the password from DEMO_PASSWORD, so no password is stored in the code.
 * Running it twice is safe: it does nothing if the demo users already exist.
 *
 * @type {import('sequelize-cli').Seed}
 */
import bcrypt from 'bcrypt';

export const DEMO_USERS = [
    { key: 'manager', email: 'demo-manager@example.com', role: 'MP' },
    { key: 'developer', email: 'demo-developer@example.com', role: 'MP' },
    { key: 'tester', email: 'demo-tester@example.com', role: 'TST' },
    { key: 'tester2', email: 'demo-tester2@example.com', role: 'TST' },
];
const DEMO_TEAM = 'Bugwatcher Demo Team';

const PROJECTS = [
    {
        key: 'shop',
        title: 'Online Bookshop',
        description: 'Web shop for second-hand books: catalogue, cart and checkout.',
        commit_link: 'https://github.com/example/online-bookshop',
    },
    {
        key: 'weather',
        title: 'Weather Dashboard',
        description: 'React dashboard with forecasts for saved cities.',
        commit_link: 'https://github.com/example/weather-dashboard',
    },
];

// project, reporter, assignee (or null), title, description, severity, priority, status
const BUGS = [
    ['shop', 'tester', 'developer', 'Checkout fails when the cart has more than 10 items',
        'Add 11 books to the cart and press "Pay": the page shows a blank screen and the order is not created.',
        'Critical', 'High', 'IN_PROGRESS'],
    ['shop', 'tester', 'manager', 'Search ignores Romanian diacritics',
        'Searching "Creanga" does not find "Amintiri din copilărie" by Ion Creangă.',
        'Medium', 'Medium', 'OPEN'],
    ['shop', 'tester2', null, 'Book cover images load very slowly on mobile',
        'On a 4G connection the catalogue page takes about 8 seconds; covers are full-size images.',
        'Low', 'Medium', 'OPEN'],
    ['shop', 'tester2', 'developer', 'Price shows three decimals in the cart',
        'A book priced 24.5 RON appears as 24.500 RON in the cart summary.',
        'Low', 'Low', 'RESOLVED'],
    ['weather', 'tester', 'manager', 'Temperature unit switch resets after refresh',
        'Choose °F, reload the page: the dashboard is back to °C.',
        'Medium', 'Low', 'OPEN'],
    ['weather', 'tester2', 'developer', 'App crashes when a city name contains an apostrophe',
        'Adding "L\'Aquila" to saved cities throws an error and the dashboard stays empty.',
        'High', 'High', 'IN_PROGRESS'],
    ['weather', 'tester', null, 'Forecast chart overlaps the legend on small screens',
        'At 360px width the 7-day chart covers the legend text.',
        'Low', 'Low', 'OPEN'],
    ['weather', 'tester2', 'manager', 'Wrong time zone for saved cities',
        'Sunrise for Tokyo is shown in Bucharest local time.',
        'Medium', 'Medium', 'CLOSED'],
];

const findIds = async (queryInterface, sql, replacements, transaction) => {
    const [rows] = await queryInterface.sequelize.query(sql, { replacements, transaction });
    return rows;
};

export async function up(queryInterface) {
    const password = process.env.DEMO_PASSWORD;
    if (!password) {
        throw new Error('Set DEMO_PASSWORD in backend/.env before seeding (see backend/.env.example).');
    }

    const existing = await findIds(queryInterface, 'SELECT id FROM "Users" WHERE email IN (:emails)',
        { emails: DEMO_USERS.map((u) => u.email) });
    if (existing.length > 0) {
        console.log('Demo data already exists, nothing to do.');
        return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await queryInterface.sequelize.transaction(async (transaction) => {
        const now = new Date();
        const stamps = { createdAt: now, updatedAt: now };

        // Team (the two MPs are its members, so the projects belong to the team)
        await queryInterface.bulkInsert('Teams', [{ name: DEMO_TEAM, description: 'Demo team used on the live demo.', ...stamps }], { transaction });
        const [{ id: teamId }] = await findIds(queryInterface, 'SELECT id FROM "Teams" WHERE name = :name', { name: DEMO_TEAM }, transaction);

        // Users
        await queryInterface.bulkInsert('Users', DEMO_USERS.map((u) => ({
            email: u.email,
            password: passwordHash,
            role: u.role,
            teamId: u.role === 'MP' ? teamId : null,
            ...stamps,
        })), { transaction });
        const userRows = await findIds(queryInterface, 'SELECT id, email FROM "Users" WHERE email IN (:emails)',
            { emails: DEMO_USERS.map((u) => u.email) }, transaction);
        const userId = Object.fromEntries(DEMO_USERS.map((u) => [u.key, userRows.find((r) => r.email === u.email).id]));

        // Projects owned by the team
        await queryInterface.bulkInsert('Projects', PROJECTS.map((p) => ({
            title: p.title,
            description: p.description,
            commit_link: p.commit_link,
            owner_type: 'TEAM',
            owner_id: teamId,
            ...stamps,
        })), { transaction });
        const projectRows = await findIds(queryInterface, 'SELECT id, title FROM "Projects" WHERE owner_type = \'TEAM\' AND owner_id = :teamId',
            { teamId }, transaction);
        const projectId = Object.fromEntries(PROJECTS.map((p) => [p.key, projectRows.find((r) => r.title === p.title).id]));

        // Every demo user is a member of every demo project (testers joined them)
        await queryInterface.bulkInsert('UserProjects', PROJECTS.flatMap((p) =>
            DEMO_USERS.map((u) => ({ userId: userId[u.key], projectId: projectId[p.key], ...stamps }))
        ), { transaction });

        // Bugs
        const repoOf = (project) => PROJECTS.find((p) => p.key === project).commit_link;
        await queryInterface.bulkInsert('Bugs', BUGS.map(([project, reporter, assignee, title, description, severity, priority, status], i) => ({
            title,
            description,
            severity,
            priority,
            status,
            projectId: projectId[project],
            reporterId: userId[reporter],
            assignedUserId: assignee ? userId[assignee] : null,
            // Example commit links (the demo repositories are fictional)
            commitLink: i % 2 === 0 ? `${repoOf(project)}/commit/${(1000 + i).toString(16)}a7c2e` : null,
            resolutionCommit: status === 'RESOLVED' ? `${repoOf(project)}/commit/${(2000 + i).toString(16)}f91b0` : null,
            ...stamps,
        })), { transaction });
    });

    console.log(`Demo data created. Log in as ${DEMO_USERS[0].email} (MP) or ${DEMO_USERS[2].email} (tester).`);
}

export async function down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
        const teams = await findIds(queryInterface, 'SELECT id FROM "Teams" WHERE name = :name', { name: DEMO_TEAM }, transaction);
        if (teams.length > 0) {
            // Bugs and memberships are removed by the foreign keys (ON DELETE CASCADE)
            await queryInterface.bulkDelete('Projects', { owner_type: 'TEAM', owner_id: teams[0].id }, { transaction });
        }
        await queryInterface.bulkDelete('Users', { email: DEMO_USERS.map((u) => u.email) }, { transaction });
        await queryInterface.bulkDelete('Teams', { name: DEMO_TEAM }, { transaction });
    });
}
