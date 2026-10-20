'use strict';

/**
 * Two optional links on each bug:
 * - commitLink: the commit where the tester noticed the bug (sent when reporting it)
 * - resolutionCommit: the commit that fixed it (required when the status becomes RESOLVED)
 *
 * @type {import('sequelize-cli').Migration}
 */
export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.addColumn('Bugs', 'commitLink', { type: Sequelize.STRING, allowNull: true }, { transaction });
    await queryInterface.addColumn('Bugs', 'resolutionCommit', { type: Sequelize.STRING, allowNull: true }, { transaction });
  });
}

export async function down(queryInterface) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.removeColumn('Bugs', 'resolutionCommit', { transaction });
    await queryInterface.removeColumn('Bugs', 'commitLink', { transaction });
  });
}
