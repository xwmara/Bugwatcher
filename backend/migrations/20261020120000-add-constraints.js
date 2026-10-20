'use strict';

/**
 * Adds the database rules that the first migrations missed:
 * - foreign keys, so rows cannot point to users or projects that do not exist
 * - one membership row per user and project
 * - team names are required and unique (the API already expects this)
 * - "TST" as the default role (the first migration had a typo: toDefaultValue)
 *
 * @type {import('sequelize-cli').Migration}
 */

const foreignKeys = [
  // table, column, referenced table, constraint name, what happens on delete
  ['Bugs', 'projectId', 'Projects', 'Bugs_projectId_fkey', 'CASCADE'],
  ['Bugs', 'assignedUserId', 'Users', 'Bugs_assignedUserId_fkey', 'SET NULL'],
  ['UserProjects', 'userId', 'Users', 'UserProjects_userId_fkey', 'CASCADE'],
  ['UserProjects', 'projectId', 'Projects', 'UserProjects_projectId_fkey', 'CASCADE'],
];

export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    for (const [table, field, refTable, name, onDelete] of foreignKeys) {
      await queryInterface.addConstraint(table, {
        fields: [field],
        type: 'foreign key',
        name,
        references: { table: refTable, field: 'id' },
        onDelete,
        onUpdate: 'CASCADE',
        transaction,
      });
    }

    await queryInterface.addConstraint('UserProjects', {
      fields: ['userId', 'projectId'],
      type: 'unique',
      name: 'UserProjects_userId_projectId_key',
      transaction,
    });

    await queryInterface.changeColumn('Teams', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
    }, { transaction });
    await queryInterface.addConstraint('Teams', {
      fields: ['name'],
      type: 'unique',
      name: 'Teams_name_key',
      transaction,
    });

    // Raw SQL: changeColumn on a Postgres ENUM column tries to recreate the enum type
    await queryInterface.sequelize.query(
      `ALTER TABLE "Users" ALTER COLUMN "role" SET DEFAULT 'TST';`,
      { transaction }
    );
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.sequelize.query(
      `ALTER TABLE "Users" ALTER COLUMN "role" DROP DEFAULT;`,
      { transaction }
    );
    await queryInterface.removeConstraint('Teams', 'Teams_name_key', { transaction });
    await queryInterface.changeColumn('Teams', 'name', {
      type: Sequelize.STRING,
      allowNull: true,
    }, { transaction });
    await queryInterface.removeConstraint('UserProjects', 'UserProjects_userId_projectId_key', { transaction });
    for (const [table, , , name] of foreignKeys) {
      await queryInterface.removeConstraint(table, name, { transaction });
    }
  });
}
