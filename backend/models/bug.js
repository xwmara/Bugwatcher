'use strict';

import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Bug extends Model {

    static associate(models) {
      this.belongsTo(models.Project,
        {
          foreignKey: 'projectId',
        }
      )
      this.belongsTo(models.User, {
        foreignKey: 'assignedUserId',
        as: 'assignedUser'
      })

      this.belongsTo(models.User, {
        foreignKey: 'reporterId',
        as: 'reporter'
      })

    }
  }
  Bug.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    severity: DataTypes.ENUM("Low", "Medium", "High", "Critical"),
    priority: DataTypes.ENUM("Low", "Medium", "High"),
    status: DataTypes.ENUM("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"),
    projectId: DataTypes.INTEGER,
    assignedUserId: DataTypes.INTEGER,
    reporterId: DataTypes.INTEGER,
    commitLink: DataTypes.STRING,        // commit where the bug was found (optional)
    resolutionCommit: DataTypes.STRING   // commit that fixed it (required for RESOLVED)
  }, {
    sequelize,
    modelName: 'Bug',
  });
  return Bug;
};