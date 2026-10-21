// Request schemas: they describe which fields each route accepts and their format.
// The validate() middleware checks requests against them before the controller runs.
// Business rules (permissions, "does this user exist?", password strength) stay in the controllers.
import { z } from 'zod';
import { isValidRepoLink } from '../utils/repoLink.js';

// Allowed values, same as the ENUM columns in the database
export const ROLES = ['MP', 'TST'];
export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
export const PRIORITIES = ['Low', 'Medium', 'High'];
export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

// IDs arrive as text in URLs ("/bugs/7"), so they are converted to numbers
const id = (name) => z.coerce.number({ error: `Invalid ${name}.` }).int({ error: `Invalid ${name}.` }).positive({ error: `Invalid ${name}.` });
const oneOf = (field, values) => z.enum(values, { error: `Invalid ${field}. Use one of: ${values.join(', ')}.` });
const requiredText = (message) => z.string({ error: message }).trim().min(1, { error: message });
// Optional commit link on GitHub, GitLab or Bitbucket; an empty field is stored as null
const optionalRepoLink = (field) => z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string({ error: `${field} must be text.` }).trim()
        .refine(isValidRepoLink, { error: `${field} must be an https:// link to GitHub, GitLab or Bitbucket.` })
        .nullable()
).optional();
// " Ana@Mail.com " is accepted and stored as "ana@mail.com"
const emailField = () => z.string({ error: 'Email invalid.' }).trim().toLowerCase().pipe(z.email({ error: 'Email invalid.' }));

/* URL parameters */
export const idParams = z.object({ id: id('id') });
export const projectIdParams = z.object({ projectId: id('project id') });

/* Users */
export const registerBody = z.object({
    email: emailField(),
    password: z.string({ error: 'Password is required.' }).min(1, { error: 'Password is required.' }).max(200, { error: 'Password is too long.' }),
    role: z.enum(ROLES, { error: 'Role invalid. Use MP or TST.' }).optional(),
});

export const loginBody = z.object({
    email: requiredText('Email and password are required.'),
    password: z.string({ error: 'Email and password are required.' }).min(1, { error: 'Email and password are required.' }),
});

export const updateUserBody = z.object({
    email: emailField().optional(),
    role: z.enum(ROLES, { error: 'Role invalid.' }).optional(),
});

/* Projects */
export const createProjectBody = z.object({
    title: requiredText('Project title is required.'),
    commit_link: z.string({ error: 'Commit link is required.' }),
});

/* Teams */
export const createTeamBody = z.object({
    name: requiredText('Team name is required.'),
    description: z.string({ error: 'Description must be text.' }).optional(),
});

export const inviteBody = z.object({
    email: requiredText('Email is required.'),
});

/* Bugs */
export const createBugBody = z.object({
    title: requiredText('Title is required.'),
    description: z.string({ error: 'Description must be text.' }).optional(),
    severity: oneOf('severity', SEVERITIES),
    priority: oneOf('priority', PRIORITIES),
    projectId: id('project id'),
    assignedUserId: id('assigned user id').nullable().optional(),
    commitLink: optionalRepoLink('Commit link'),
});

export const updateBugBody = z.object({
    title: requiredText('Title cannot be empty.').optional(),
    description: z.string({ error: 'Description must be text.' }).optional(), // "" clears it
    severity: oneOf('severity', SEVERITIES).optional(),
    priority: oneOf('priority', PRIORITIES).optional(),
    status: oneOf('status', STATUSES).optional(),
    assignedUserId: id('assigned user id').nullable().optional(), // null unassigns the bug
    resolutionCommit: optionalRepoLink('Resolution commit'),
});
