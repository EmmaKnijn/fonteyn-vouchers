const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
  }
);

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true // True because Entra ID users might not have a local password
  },
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'viewer'),
    defaultValue: 'viewer'
  }
});

const VoucherMetadata = sequelize.define('VoucherMetadata', {
  voucher_id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  guest_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  open_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  activated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// Seed admin user if it doesn't exist
const seedAdmin = async () => {
  const adminExists = await User.findOne({ where: { email: 'admin@fonteyn.local' } });
  if (!adminExists) {
    const hash = await bcrypt.hash('admin', 10);
    await User.create({
      email: 'admin@fonteyn.local',
      password_hash: hash,
      role: 'admin'
    });
    console.log('Seeded default admin (admin@fonteyn.local / admin)');
  }
};

const initDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected');
    await sequelize.sync({ alter: true });
    await seedAdmin();
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }
};

module.exports = { sequelize, User, VoucherMetadata, initDb };
