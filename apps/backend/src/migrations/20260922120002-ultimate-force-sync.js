'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface, Sequelize) {
    // We will dynamically require the Sequelize instance to get all defined models
    const db = require('../config/database');
    
    // Make sure all models are loaded
    require('../models/index');
    
    // Get all defined models
    const models = db.models;
    
    for (const modelName in models) {
      const Model = models[modelName];
      const tableName = Model.tableName;
      
      let tableInfo;
      try {
        tableInfo = await queryInterface.describeTable(tableName);
      } catch (err) {
        console.log(`Table ${tableName} does not exist yet, skipping...`);
        continue;
      }
      
      const attributes = Model.getAttributes();
      
      for (const attributeName in attributes) {
        const attribute = attributes[attributeName];
        const columnName = attribute.field || attributeName;
        
        // Skip createdAt and updatedAt since they might cause NOT NULL issues and they always exist
        if (columnName === 'createdAt' || columnName === 'updatedAt' || columnName === 'created_at' || columnName === 'updated_at') {
          continue;
        }

        if (!tableInfo[columnName]) {
          console.log(`Adding missing column ${columnName} to table ${tableName}`);
          
          let columnDef = {
            type: attribute.type,
            allowNull: true // Force true to avoid "cannot add NOT NULL column" errors on existing rows
          };
          
          if (attribute.defaultValue !== undefined) {
             columnDef.defaultValue = attribute.defaultValue;
          }
          
          if (attribute.references) {
             columnDef.references = attribute.references;
          }
          
          if (attribute.primaryKey) {
             columnDef.primaryKey = true;
          }
          
          try {
            await queryInterface.addColumn(tableName, columnName, columnDef);
            console.log(`Successfully added ${columnName} to ${tableName}`);
          } catch (e) {
            console.error(`Failed to add column ${columnName} to ${tableName}:`, e.message);
          }
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {}
};
