'use strict';

/**
 * Parses common query parameters into Sequelize-ready options.
 *
 * @param {object} query   - req.query
 * @param {object} options - { searchFields: [], filterFields: [] }
 * @returns {{ limit, offset, order, where, page, meta }}
 */
const { Op } = require('sequelize');

const parseQuery = (query, { searchFields = [], filterFields = [] } = {}) => {
  // ─── Pagination ────────────────────────────────────────────────────────────
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;

  // ─── Sorting ───────────────────────────────────────────────────────────────
  const sortField = query.sort  || 'createdAt';
  const sortOrder = (query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const order = [[sortField, sortOrder]];

  // ─── Search (Op.like on provided fields) ──────────────────────────────────
  const where = {};
  if (query.search && searchFields.length > 0) {
    where[Op.or] = searchFields.map((field) => ({
      [field]: { [Op.like]: `%${query.search}%` }
    }));
  }

  // ─── Filtering (exact match on whitelisted fields) ────────────────────────
  filterFields.forEach((field) => {
    if (query[field] !== undefined && query[field] !== '') {
      where[field] = query[field];
    }
  });

  return { page, limit, offset, order, where };
};

module.exports = { parseQuery };
