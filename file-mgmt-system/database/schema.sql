-- ============================================================================
-- Enterprise File Management & Audit Logging System — Database Schema
-- Engine: MySQL 8.x
-- ============================================================================
-- Design notes:
--   - InnoDB everywhere (FK + transaction support).
--   - utf8mb4 for full Unicode (emoji-safe filenames, names, etc).
--   - Every audit/log table intentionally has NO foreign key ON DELETE CASCADE
--     to `users` for logs — logs must survive even if a user row is removed,
--     so we use ON DELETE SET NULL where the column is nullable, preserving
--     the audit trail (a hard requirement for compliance-grade systems).
-- ============================================================================


CREATE DATABASE IF NOT EXISTS file_mgmt_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE file_mgmt_system;

-- ----------------------------------------------------------------------------
-- 1. users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name         VARCHAR(150)        NOT NULL,
  email             VARCHAR(191)        NOT NULL,
  password_hash     VARCHAR(255)        NOT NULL,
  role              ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  is_active         TINYINT(1)          NOT NULL DEFAULT 1,
  last_login_at     DATETIME            NULL,
  created_at        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uq_users_email UNIQUE (email),
  INDEX idx_users_role (role)
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- 2. files
-- ----------------------------------------------------------------------------
CREATE TABLE files (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id             BIGINT UNSIGNED   NOT NULL,
  file_category       ENUM('profile-image', 'resume', 'project-document') NOT NULL,
  original_file_name  VARCHAR(255)      NOT NULL,
  stored_file_name    VARCHAR(255)      NOT NULL,
  file_type           VARCHAR(50)       NOT NULL,   -- e.g. pdf, png, docx
  mime_type           VARCHAR(100)      NOT NULL,   -- e.g. application/pdf
  file_size           BIGINT UNSIGNED   NOT NULL,   -- bytes
  cloudinary_url      VARCHAR(500)      NOT NULL,
  cloudinary_public_id VARCHAR(255)     NOT NULL,
  is_deleted          TINYINT(1)        NOT NULL DEFAULT 0,   -- soft delete
  uploaded_at         DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_files_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_files_user_id (user_id),
  INDEX idx_files_category (file_category),
  INDEX idx_files_is_deleted (is_deleted),
  INDEX idx_files_public_id (cloudinary_public_id)
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- 3. audit_logs
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED   NULL,   -- nullable: unauthenticated actions (e.g. failed login)
  action        VARCHAR(100)      NOT NULL,   -- e.g. LOGIN, FILE_DELETE
  module        VARCHAR(100)      NOT NULL,   -- e.g. AUTH, FILE, PROFILE
  description   VARCHAR(500)      NULL,
  http_method   VARCHAR(10)       NOT NULL,
  endpoint      VARCHAR(255)      NOT NULL,
  ip_address    VARCHAR(45)       NOT NULL,   -- IPv6-safe length
  status        ENUM('SUCCESS', 'FAILURE') NOT NULL,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_audit_user_id (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_module (module),
  INDEX idx_audit_created_at (created_at)
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- 4. login_logs
-- ----------------------------------------------------------------------------
CREATE TABLE login_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED   NULL,
  login_time    DATETIME          NULL,
  logout_time   DATETIME          NULL,
  ip_address    VARCHAR(45)       NOT NULL,
  browser       VARCHAR(150)      NULL,
  device        VARCHAR(150)      NULL,
  login_status  ENUM('SUCCESS', 'FAILED') NOT NULL,
  created_at    DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_login_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_login_logs_user_id (user_id),
  INDEX idx_login_logs_status (login_status),
  INDEX idx_login_logs_created_at (created_at)
) ENGINE = InnoDB;

-- ----------------------------------------------------------------------------
-- 5. api_logs
-- ----------------------------------------------------------------------------
CREATE TABLE api_logs (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED   NULL,
  endpoint        VARCHAR(255)      NOT NULL,
  http_method     VARCHAR(10)       NOT NULL,
  status_code     SMALLINT UNSIGNED NOT NULL,
  response_time_ms INT UNSIGNED     NOT NULL,
  ip_address      VARCHAR(45)       NOT NULL,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_api_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_api_logs_user_id (user_id),
  INDEX idx_api_logs_endpoint (endpoint),
  INDEX idx_api_logs_status_code (status_code),
  INDEX idx_api_logs_created_at (created_at)
) ENGINE = InnoDB;
