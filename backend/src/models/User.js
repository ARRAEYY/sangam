const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    google_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    auth_provider: {
      type: DataTypes.ENUM('LOCAL', 'GOOGLE'),
      allowNull: false,
      defaultValue: 'LOCAL',
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    email_verification_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_reset_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password_reset_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    branch: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    graduation_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2000,
      },
    },
    headline: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    github_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    linkedin_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    portfolio_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    leetcode_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    codeforces_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
  }
)

module.exports = User
