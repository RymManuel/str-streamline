-- STR-Streamline MySQL Database Schema
-- Run: mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS str_streamline
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE str_streamline;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(200) DEFAULT NULL,
  default_source VARCHAR(50) NOT NULL DEFAULT 'Mixed',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_properties_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS uploaded_files (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  row_count INT NOT NULL DEFAULT 0,
  source VARCHAR(50) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_files_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rental_records (
  id VARCHAR(36) PRIMARY KEY,
  file_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  property_id VARCHAR(36) DEFAULT NULL,
  record_date DATE NOT NULL,
  property_name VARCHAR(150) NOT NULL,
  guest VARCHAR(150) DEFAULT NULL,
  nights INT NOT NULL DEFAULT 1,
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expenses DECIMAL(12, 2) NOT NULL DEFAULT 0,
  occupancy TINYINT UNSIGNED NOT NULL DEFAULT 0,
  source VARCHAR(50) NOT NULL,
  status ENUM('completed', 'cancelled', 'pending') NOT NULL DEFAULT 'completed',
  FOREIGN KEY (file_id) REFERENCES uploaded_files(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  INDEX idx_records_user (user_id),
  INDEX idx_records_date (record_date),
  INDEX idx_records_file (file_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  details TEXT DEFAULT NULL,
  ip_address VARCHAR(45) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_logs_created (created_at),
  INDEX idx_logs_action (action)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS financial_targets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  month_year CHAR(7) NOT NULL,
  revenue_target DECIMAL(12, 2) NOT NULL,
  occupancy_target TINYINT UNSIGNED NOT NULL DEFAULT 80,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_targets_user_month (user_id, month_year)
) ENGINE=InnoDB;
