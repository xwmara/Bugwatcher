'use strict';

import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Team extends Model {
    
    static associate(models) {
      Team.hasMany(models.User, {
        foreignKey: 'teamId',
        onDelete: 'CASCADE',
      })

    }
  }
  Team.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: "",
      allowNull: true 
    }
  }, {
    sequelize,
    modelName: 'Team',
  });
  return Team;
};